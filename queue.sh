#!/usr/bin/env bash
# queue.sh — drena o backlog: roda tarefa após tarefa até acabar ou travar.
# Copie para a RAIZ de cada repo, junto do loop.sh. Idêntico nos dois.
#
# Uso:  AGENT=claude ./queue.sh
#       AGENT=gemini MAX_ITER=5 ./queue.sh
#
# Códigos de saída do loop.sh:
#   0 = tarefa concluída, PR aberto  → segue para a próxima
#   2 = travou (precisa de você)     → para a fila
#   3 = backlog vazio                → fim normal
set -uo pipefail

DONE=0
START=$(date +%s)

while true; do
  ./loop.sh
  CODE=$?
  case $CODE in
    0) DONE=$((DONE+1)) ;;
    3) printf '\n\033[1;32m[queue]\033[0m backlog vazio — %s tarefa(s) em %sm\n' \
         "$DONE" "$(( ($(date +%s)-START)/60 ))"
       command -v notify-send >/dev/null && \
         notify-send "queue: $(basename "$PWD")" "fila concluída — $DONE tarefa(s) ✅"
       exit 0 ;;
    *) printf '\n\033[1;33m[queue]\033[0m parado após %s tarefa(s). Veja agent/BLOCKED.md\n' "$DONE"
       command -v notify-send >/dev/null && \
         notify-send "queue: $(basename "$PWD")" "travou após $DONE tarefa(s) — precisa de você"
       exit "$CODE" ;;
  esac
done
