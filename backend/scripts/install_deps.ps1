param(
  [Parameter(Mandatory=$true)]
  [string]$ToolName
)

$ToolName = $ToolName.ToLower().Trim()

# Winget package ID map
$wingetMap = @{
  "python"       = "Python.Python.3"
  "python3"      = "Python.Python.3"
  "git"          = "Git.Git"
  "node"         = "OpenJS.NodeJS.LTS"
  "nodejs"       = "OpenJS.NodeJS.LTS"
  "npm"          = "OpenJS.NodeJS.LTS"
  "docker"       = "Docker.DockerDesktop"
  "docker-compose" = "Docker.DockerDesktop"
  "postgresql"   = "PostgreSQL.PostgreSQL"
  "postgres"     = "PostgreSQL.PostgreSQL"
  "mysql"        = "Oracle.MySQL"
  "mongodb"      = "MongoDB.Server"
  "redis"        = "tporadowski.Redis"
  "go"           = "GoLang.Go"
  "rust"         = "Rustlang.Rust.MSVC"
  "dotnet"       = "Microsoft.DotNet.SDK.8"
  "vscode"       = "Microsoft.VisualStudioCode"
  "kubectl"      = "Kubernetes.kubectl"
  "terraform"    = "Hashicorp.Terraform"
  "java"         = "Oracle.JDK.21"
  "jdk"          = "Oracle.JDK.21"
  "maven"        = "Apache.Maven"
  "gradle"       = "Gradle.Gradle"
  "ruby"         = "RubyInstallerTeam.Ruby.3.3"
  "php"          = "PHP.PHP"
  "composer"     = "PHP.Composer"
  "ffmpeg"       = "Gyan.FFmpeg"
  "curl"         = "cURL.cURL"
  "wget"         = "GnuWin32.Wget"
  "make"         = "GnuWin32.Make"
  "cmake"        = "Kitware.CMake"
  "helm"         = "Helm.Helm"
  "minikube"     = "Kubernetes.minikube"
  "pulumi"       = "Pulumi.Pulumi"
  "awscli"       = "Amazon.AWSCLI"
  "aws"          = "Amazon.AWSCLI"
  "azure-cli"    = "Microsoft.AzureCLI"
  "az"           = "Microsoft.AzureCLI"
  "gcloud"       = "Google.CloudSDK"
}

# npm-installable tools
$npmMap = @{
  "yarn"         = "yarn"
  "pnpm"         = "pnpm"
  "typescript"   = "typescript"
  "ts-node"      = "ts-node"
  "eslint"       = "eslint"
  "prettier"     = "prettier"
  "nx"           = "nx"
  "expo-cli"     = "expo-cli"
  "create-react-app" = "create-react-app"
}

# pip-installable tools
$pipMap = @{
  "pip"          = "pip"
  "pipenv"       = "pipenv"
  "poetry"       = "poetry"
  "black"        = "black"
  "flake8"       = "flake8"
  "mypy"         = "mypy"
  "pytest"       = "pytest"
  "uvicorn"      = "uvicorn"
  "celery"       = "celery"
}

Write-Host "=== Dev Health Monitor - Installing: $ToolName ==="
Write-Host ""

# Try npm first for node tools
if ($npmMap.ContainsKey($ToolName)) {
  $pkg = $npmMap[$ToolName]
  Write-Host "Installing via npm: $pkg"
  Write-Host "Running: npm install -g $pkg"
  Write-Host ""
  & npm install -g $pkg
  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: $ToolName installed via npm."
    exit 0
  } else {
    Write-Host "npm install failed (exit $LASTEXITCODE)."
    exit 1
  }
}

# Try pip for python packages
if ($pipMap.ContainsKey($ToolName)) {
  $pkg = $pipMap[$ToolName]
  Write-Host "Installing via pip: $pkg"
  Write-Host "Running: pip install $pkg"
  Write-Host ""
  & pip install $pkg
  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: $ToolName installed via pip."
    exit 0
  } else {
    Write-Host "pip install failed (exit $LASTEXITCODE)."
    exit 1
  }
}

# Try winget
if ($wingetMap.ContainsKey($ToolName)) {
  $pkg = $wingetMap[$ToolName]
  Write-Host "Installing via winget: $pkg"
  Write-Host "Running: winget install --id $pkg --silent --accept-source-agreements --accept-package-agreements"
  Write-Host ""
  & winget install --id $pkg --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: $ToolName installed. You may need to restart your terminal."
    exit 0
  } else {
    Write-Host "winget install failed (exit $LASTEXITCODE)."
    exit 1
  }
}

# Unknown tool — try winget search as a fallback hint
Write-Host "No known package mapping for '$ToolName'."
Write-Host "Trying: winget search $ToolName"
Write-Host ""
& winget search $ToolName
Write-Host ""
Write-Host "Please run the winget install command above manually."
exit 1
