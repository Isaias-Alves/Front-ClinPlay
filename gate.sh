#!/usr/bin/env bash
# gate.sh — o portão. Custo zero em token. Se isto passa, a tarefa acabou.
# Ordem importa: o que falha mais rápido e mais barato vem primeiro.
set -e

# O app (package.json, tsconfig, node_modules) mora em src/frontend.
cd "$(dirname "$0")/src/frontend"

echo "▸ typecheck"
npx tsc --noEmit

echo "▸ lint"
npx eslint . --max-warnings=0

echo "▸ testes"
npx vitest run --reporter=dot

echo "▸ build"
npm run build

echo "✅ gate verde"
