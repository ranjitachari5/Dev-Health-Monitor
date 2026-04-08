param(
  [Parameter(Mandatory=$true)]
  [string]$ToolName
)

$ErrorActionPreference = "Stop"

$map = @{
  "python"     = "Python.Python.3"
  "git"        = "Git.Git"
  "node"       = "OpenJS.NodeJS.LTS"
  "docker"     = "Docker.DockerDesktop"
  "postgresql" = "PostgreSQL.PostgreSQL"
  "mysql"      = "Oracle.MySQL"
  "mongodb"    = "MongoDB.Server"
  "redis"      = "tporadowski.Redis"
  "go"         = "GoLang.Go"
  "rust"       = "Rustlang.Rust.MSVC"
  "dotnet"     = "Microsoft.DotNet.SDK.8"
  "vscode"     = "Microsoft.VisualStudioCode"
  "kubectl"    = "Kubernetes.kubectl"
  "terraform"  = "Hashicorp.Terraform"
}

Write-Host "Dev Environment Health Monitor - Dependency Installer (Windows)"
Write-Host "Tool: $ToolName"
Write-Host ""

if (-not $map.ContainsKey($ToolName)) {
  Write-Host "No winget mapping for '$ToolName'."
  Write-Host "Simulating install anyway..."
  Start-Sleep -Milliseconds 500
  Write-Host "Done (simulated)."
  exit 0
}

$pkg = $map[$ToolName]
Write-Host "Resolved winget package id: $pkg"
Write-Host "Simulating: winget install --id $pkg --silent --accept-source-agreements --accept-package-agreements"
Write-Host ""

for ($i = 1; $i -le 10; $i++) {
  Write-Host ("Downloading... {0}%" -f ($i * 10))
  Start-Sleep -Milliseconds 250
}
for ($i = 1; $i -le 5; $i++) {
  Write-Host ("Installing... {0}%" -f ($i * 20))
  Start-Sleep -Milliseconds 350
}

Write-Host ""
Write-Host "Install completed for $ToolName (simulated)."
Write-Host "Tip: If the tool is still not detected, run the PATH fix action."

exit 0

