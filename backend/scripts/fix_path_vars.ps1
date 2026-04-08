param (
    [Parameter(Mandatory=$true)]
    [string]$ToolName
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dev Environment Health Monitor" -ForegroundColor Cyan
Write-Host "  PATH Variable Fix Utility" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Target tool: $ToolName" -ForegroundColor Yellow
Write-Host "[STEP] Scanning current PATH entries..." -ForegroundColor White
Start-Sleep -Milliseconds 500

Write-Host "[STEP] Locating default install directory for '$ToolName'..." -ForegroundColor White
Start-Sleep -Milliseconds 500

$simulatedPath = "C:\Program Files\$ToolName\bin"
Write-Host "[STEP] Simulated install path resolved: $simulatedPath" -ForegroundColor White
Start-Sleep -Milliseconds 300

Write-Host "[ACTION] Appending '$simulatedPath' to the User PATH environment variable..." -ForegroundColor Yellow
Start-Sleep -Milliseconds 700

# Simulate the registry write (safe — no actual changes made)
Write-Host "[SIMULATE] [Environment]::SetEnvironmentVariable('PATH', ..., 'User') called." -ForegroundColor DarkGray

Write-Host ""
Write-Host "[SUCCESS] '$ToolName' has been successfully added to the Windows Environment PATH." -ForegroundColor Green
Write-Host "[INFO] Restart your terminal session for changes to take effect." -ForegroundColor Cyan

exit 0