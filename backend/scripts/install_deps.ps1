param (
    [Parameter(Mandatory=$true)]
    [string]$ToolName
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dev Environment Health Monitor" -ForegroundColor Cyan
Write-Host "  Automated Install Utility (winget)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Requested tool: $ToolName" -ForegroundColor Yellow
Write-Host "[STEP] Checking winget availability..." -ForegroundColor White
Start-Sleep -Milliseconds 500

Write-Host "[STEP] Resolving winget package ID for '$ToolName'..." -ForegroundColor White
Start-Sleep -Milliseconds 400

$packageMap = @{
    "python" = "Python.Python.3.12"
    "git"    = "Git.Git"
}

$packageId = $packageMap[$ToolName.ToLower()]
if (-not $packageId) {
    $packageId = "Unknown.$ToolName"
    Write-Host "[WARN] No known package ID for '$ToolName'. Using fallback: $packageId" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Resolved package ID: $packageId" -ForegroundColor White
}

Start-Sleep -Milliseconds 300

Write-Host ""
Write-Host "[SIMULATE] Running: winget install --id $packageId --silent --accept-package-agreements --accept-source-agreements" -ForegroundColor DarkGray
Write-Host ""

# Simulated progress output
Write-Host "Found $ToolName [$packageId]" -ForegroundColor White
Start-Sleep -Milliseconds 600
Write-Host "Downloading installer... [##########----------] 50%" -ForegroundColor White
Start-Sleep -Milliseconds 700
Write-Host "Downloading installer... [####################] 100%" -ForegroundColor White
Start-Sleep -Milliseconds 400
Write-Host "Successfully verified installer hash." -ForegroundColor White
Start-Sleep -Milliseconds 500
Write-Host "Starting package install..." -ForegroundColor White
Start-Sleep -Milliseconds 800

Write-Host ""
Write-Host "[SUCCESS] '$ToolName' ($packageId) was successfully installed (simulated)." -ForegroundColor Green
Write-Host "[INFO] Run the health scan again to verify tool detection." -ForegroundColor Cyan

exit 0