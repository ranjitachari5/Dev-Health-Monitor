#!/usr/bin/env bash
set -euo pipefail

TOOL_NAME="${1:-}"
FIX_TYPE="${2:-install}"

if [[ -z "${TOOL_NAME}" ]]; then
  echo "Usage: install_deps.sh <tool_name> [install|update]"
  exit 2
fi

if [[ "${FIX_TYPE}" != "install" && "${FIX_TYPE}" != "update" ]]; then
  echo "Invalid fix type: ${FIX_TYPE}. Use install or update."
  exit 2
fi

is_macos() {
  [[ "$(uname -s)" == "Darwin" ]]
}

echo "Dev Environment Health Monitor - Dependency Installer (Mac/Linux)"
echo "Tool: ${TOOL_NAME}"
echo "Mode: ${FIX_TYPE}"
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

if is_macos; then
  pkg="${BREW_MAP[${TOOL_NAME}]:-}"
  if [[ -z "${pkg}" ]]; then
    echo "No brew mapping for '${TOOL_NAME}'."
    exit 1
  fi

  echo "Detected macOS: using Homebrew"
  if [[ "${FIX_TYPE}" == "update" ]]; then
    echo "Running: brew update && brew upgrade ${pkg}"
    brew update
    brew upgrade ${pkg}
  else
    echo "Running: brew install ${pkg}"
    brew install ${pkg}
  fi
  echo "Install/update completed for ${TOOL_NAME}."
  exit 0
fi

pkg="${APT_MAP[${TOOL_NAME}]:-}"
if [[ -z "${pkg}" ]]; then
  echo "No apt mapping for '${TOOL_NAME}'."
  exit 1
fi

echo "Detected Linux: using apt-get"
if command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
else
  SUDO=""
fi

if [[ "${FIX_TYPE}" == "update" ]]; then
  echo "Running: ${SUDO} apt-get update && ${SUDO} apt-get install --only-upgrade -y ${pkg}"
  ${SUDO} apt-get update
  ${SUDO} apt-get install --only-upgrade -y ${pkg}
else
  echo "Running: ${SUDO} apt-get update && ${SUDO} apt-get install -y ${pkg}"
  ${SUDO} apt-get update
  ${SUDO} apt-get install -y ${pkg}
fi
echo "Install/update completed for ${TOOL_NAME}."
