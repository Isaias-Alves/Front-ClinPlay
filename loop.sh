#!/usr/bin/env bash
# loop.sh — harness genérico. Copie para a RAIZ de cada repo (front e back).
# Uso:  AGENT=claude ./loop.sh          # roda UMA tarefa do backlog até o gate passar
#       AGENT=gemini MAX_ITER=5 ./loop.sh
#       ./queue.sh                      # drena o backlog inteiro (ver SETUP.md)
set -uo pipefail

AGENT="${AGENT:-claude}"          # claude | gemini | local
MAX_ITER="${MAX_ITER:-8}"         # limite duro de voltas
ERR_TAIL="${ERR_TAIL:-40}"        # linhas de erro que voltam pro modelo
PROG_TAIL="${PROG_TAIL:-12}"      # linhas de histórico que voltam pro modelo
A=agent

# ---------------------------------------------------------------- utilidades
say()  { printf '\n\033[1;36m[loop]\033[0m %s\n' "$*"; }
ping() { command -v notify-send >/dev/null && notify-send "loop: $(basename "$PWD")" "$1" || true; }

run_agent() {
  # $1 = arquivo de contexto. Ajuste os flags conforme a versão do seu CLI.
  case "$AGENT" in
    claude) claude -p "$(cat "$1")" --permission-mode acceptEdits ;;
    gemini) gemini --yolo -p "$(cat "$1")" ;;
    local)  # Ollama sozinho NÃO edita arquivos. Use um harness que fale com ele:
            opencode run "$(cat "$1")" ;;
    *) echo "AGENT desconhecido: $AGENT"; exit 1 ;;
  esac
}

# ------------------------------------------------- 1. pega a próxima tarefa
[ -f "$A/BACKLOG.md" ] || { echo "sem $A/BACKLOG.md"; exit 1; }
awk '/^## \[ \]/{if(f)exit; f=1} f' "$A/BACKLOG.md" > "$A/TASK.md"
[ -s "$A/TASK.md" ] && grep -q '^## \[ \]' "$A/TASK.md" || { say "backlog vazio ✅"; exit 3; }

HEAD_LINE=$(head -1 "$A/TASK.md")
ID=$(echo "$HEAD_LINE" | sed -E 's/^## \[ \] ([A-Za-z0-9._-]+).*/\1/')
TITLE=$(echo "$HEAD_LINE" | sed -E 's/^## \[ \] [A-Za-z0-9._-]+[[:space:]]*[-—:]*[[:space:]]*//')
BRANCH="agent/$(echo "$ID" | tr '[:upper:]' '[:lower:]')"

# ------------------------------------------------- 2. branch isolada
git switch -c "$BRANCH" 2>/dev/null || git switch "$BRANCH" || exit 1
say "tarefa $ID → branch $BRANCH"

rm -f "$A/ERRO.md" "$A/BLOCKED.md"
touch "$A/PROGRESS.md"
PREV_HASH=""

# ------------------------------------------------- 3. o loop
for i in $(seq 1 "$MAX_ITER"); do
  say "iteração $i/$MAX_ITER"

  # contexto montado AQUI, não pelo modelo: é isso que segura o custo.
  {
    cat "$A/PROMPT.md"
    printf '\n---\n# ARQUITETURA\n'; cat "$A/ARCH.md"
    printf '\n---\n# TAREFA ATUAL\n'; cat "$A/TASK.md"
    printf '\n---\n# HISTÓRICO (últimas linhas)\n'; tail -n "$PROG_TAIL" "$A/PROGRESS.md"
    if [ -s "$A/ERRO.md" ]; then
      printf '\n---\n# ERRO DA ÚLTIMA TENTATIVA — sua única missão agora é corrigir isto\n'
      cat "$A/ERRO.md"
    fi
  } > "$A/CONTEXT.md"

  BEFORE=$(git rev-parse HEAD; git status --porcelain | md5sum)
  run_agent "$A/CONTEXT.md"
  AFTER=$(git rev-parse HEAD; git status --porcelain | md5sum)

  if [ -f "$A/BLOCKED.md" ]; then
    say "🛑 agente bloqueou: $(head -3 "$A/BLOCKED.md")"
    git add -A && git commit -q -m "wip($ID): bloqueado na iteração $i" || true
    sed -i "s|^## \[ \] $ID|## [!] $ID|" "$A/BACKLOG.md"
    ping "$ID BLOQUEADO — precisa de você"; exit 2
  fi

  if [ "$BEFORE" = "$AFTER" ]; then
    say "🛑 nenhuma mudança nesta volta — travou"
    echo "travou: nenhuma alteração na iteração $i" > "$A/BLOCKED.md"
    ping "$ID travado (sem mudanças)"; exit 2
  fi

  # ---- gate determinístico: custo zero em token
  if ./gate.sh > "$A/gate.log" 2>&1; then
    echo "[$(date +%F\ %H:%M)] $ID ok em $i iteração(ões)" >> "$A/PROGRESS.md"
    sed -i "s|^## \[ \] $ID|## [x] $ID|" "$A/BACKLOG.md"
    git add -A && git commit -q -m "feat($ID): $TITLE"
    git push -q -u origin "$BRANCH" 2>/dev/null || true
    command -v gh >/dev/null && gh pr create --fill --base main --head "$BRANCH" >/dev/null 2>&1 || true
    say "✅ $ID verde — PR aberto"; ping "$ID pronto ✅"; exit 0
  fi

  tail -n "$ERR_TAIL" "$A/gate.log" > "$A/ERRO.md"
  HASH=$(md5sum < "$A/ERRO.md")
  if [ "$HASH" = "$PREV_HASH" ]; then
    say "🛑 mesmo erro duas vezes seguidas — parando para não queimar token"
    cp "$A/ERRO.md" "$A/BLOCKED.md"
    git add -A && git commit -q -m "wip($ID): erro repetido" || true
    sed -i "s|^## \[ \] $ID|## [!] $ID|" "$A/BACKLOG.md"
    ping "$ID travado no mesmo erro"; exit 2
  fi
  PREV_HASH="$HASH"
  git add -A && git commit -q -m "wip($ID): iteração $i" || true
done

say "🛑 estourou $MAX_ITER iterações"
sed -i "s|^## \[ \] $ID|## [!] $ID|" "$A/BACKLOG.md"
ping "$ID estourou o limite"; exit 2
