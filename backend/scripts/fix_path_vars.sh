#!/usr/bin/env bash
set -euo pipefail

TOOL_NAME="${1:-}"
if [[ -z "${TOOL_NAME}" ]]; then
  echo "Usage: fix_path_vars.sh <tool_name>"
  exit 2
fi

echo "Dev Environment Health Monitor - PATH Fixer (Mac/Linux)"
echo "Tool: ${TOOL_NAME}"
echo ""

echo "Simulating PATH updates in shell profiles..."
sleep 0.4

ZSHRC="${HOME}/.zshrc"
BASHRC="${HOME}/.bashrc"

echo "Would append export lines to:"
echo " - ${ZSHRC}"
echo " - ${BASHRC}"
sleep 0.5

for p in 20 40 60 80 100; do
  echo "Progress: ${p}% ..."
  sleep 0.25
done

echo ""
echo "Simulated: PATH updated for ${TOOL_NAME}."
echo "Note: restart your shell or run 'source ~/.zshrc' or 'source ~/.bashrc'."
