#!/usr/bin/env bash
set -euo pipefail

TOOL_NAME="${1:-}"
if [[ -z "${TOOL_NAME}" ]]; then
  echo "Usage: install_deps.sh <tool_name>"
  exit 2
fi

is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}

echo "Dev Environment Health Monitor - Dependency Installer (Mac/Linux)"
echo "Tool: ${TOOL_NAME}"
echo ""

declare -A BREW_MAP
BREW_MAP=(
  ["python"]="python@3"
  ["git"]="git"
  ["node"]="node"
  ["docker"]="--cask docker"
  ["postgresql"]="postgresql@16"
  ["mysql"]="mysql"
  ["mongodb"]="mongodb-community"
  ["redis"]="redis"
  ["go"]="go"
  ["rust"]="rust"
  ["dotnet"]="dotnet-sdk"
  ["vscode"]="--cask visual-studio-code"
  ["kubectl"]="kubectl"
  ["terraform"]="terraform"
)

declare -A APT_MAP
APT_MAP=(
  ["python"]="python3 python3-pip"
  ["git"]="git"
  ["node"]="nodejs npm"
  ["docker"]="docker.io"
  ["postgresql"]="postgresql-client"
  ["mysql"]="mysql-client"
  ["mongodb"]="mongodb"
  ["redis"]="redis-server"
  ["go"]="golang-go"
  ["rust"]="rustc cargo"
  ["dotnet"]="dotnet-sdk-8.0"
  ["vscode"]="code"
  ["kubectl"]="kubectl"
  ["terraform"]="terraform"
)

simulate_progress() {
  local label="$1"
  for p in 10 20 30 40 50 60 70 80 90 100; do
    echo "${label}... ${p}%"
    sleep 0.2
  done
}

if is_macos; then
  pkg="${BREW_MAP[${TOOL_NAME}]:-}"
  if [[ -z "${pkg}" ]]; then
    echo "No brew mapping for '${TOOL_NAME}'."
    echo "Simulating install anyway..."
    simulate_progress "Installing"
    echo "Done (simulated)."
    exit 0
  fi

  echo "Detected macOS: using Homebrew"
  echo "Simulating: brew install ${pkg}"
  echo ""
  simulate_progress "Downloading"
  simulate_progress "Installing"
  echo ""
  echo "Install completed for ${TOOL_NAME} (simulated)."
  exit 0
fi

pkg="${APT_MAP[${TOOL_NAME}]:-}"
if [[ -z "${pkg}" ]]; then
  echo "No apt mapping for '${TOOL_NAME}'."
  echo "Simulating install anyway..."
  simulate_progress "Installing"
  echo "Done (simulated)."
  exit 0
fi

echo "Detected Linux: using apt-get"
echo "Simulating: sudo apt-get update && sudo apt-get install -y ${pkg}"
echo ""
simulate_progress "Downloading"
simulate_progress "Installing"
echo ""
echo "Install completed for ${TOOL_NAME} (simulated)."
