# ============================================================
# Dev Health Monitor - Single Command Launcher
# Usage: .\start.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ROOT     = $PSScriptRoot
$BACKEND  = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"
$VENV     = Join-Path $BACKEND "venv"
$PYTHON   = if ($IsWindows -or $env:OS -eq "Windows_NT") { Join-Path $VENV "Scripts\python.exe" } else { Join-Path $VENV "bin/python" }
$UVICORN  = if ($IsWindows -or $env:OS -eq "Windows_NT") { Join-Path $VENV "Scripts\uvicorn.exe" } else { Join-Path $VENV "bin/uvicorn" }

# --- Colors -------------------------------------------------
function Write-Header($msg)  { Write-Host "`n  $msg" -ForegroundColor Cyan }
function Write-Ok($msg)      { Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "  [ERR]  $msg" -ForegroundColor Red }
function Write-Step($msg)    { Write-Host "  -> $msg" -ForegroundColor DarkCyan }

Write-Host ""
Write-Host "  =======================================" -ForegroundColor Blue
Write-Host "         DEV HEALTH MONITOR" -ForegroundColor Cyan
Write-Host "  =======================================" -ForegroundColor Blue
Write-Host ""

# --- Prerequisites check -------------------------------------
Write-Header "Checking prerequisites..."

# Python
try {
    $pyVer = python --version 2>&1
    Write-Ok "Python: $pyVer"
} catch {
    Write-Err "Python not found. Install Python 3.10+ from https://python.org"
    exit 1
}

# Node
try {
    $nodeVer = node --version 2>&1
    Write-Ok "Node.js: $nodeVer"
} catch {
    Write-Err "Node.js not found. Install Node.js 18+ from https://nodejs.org"
    exit 1
}

# npm
try {
    $npmVer = npm --version 2>&1
    Write-Ok "npm: v$npmVer"
} catch {
    Write-Err "npm not found. It should come with Node.js."
    exit 1
}

# --- Backend setup -------------------------------------------
Write-Header "Setting up backend..."

if (-not (Test-Path $VENV)) {
    Write-Step "Creating Python virtual environment..."
    python -m venv $VENV
    Write-Ok "Virtual environment created"
} else {
    Write-Ok "Virtual environment already exists"
}

Write-Step "Installing / verifying Python dependencies..."
& $PYTHON -m pip install --quiet --upgrade pip
& $PYTHON -m pip install --quiet -r (Join-Path $ROOT "requirements.txt")
Write-Ok "Backend dependencies ready"

# --- .env check ----------------------------------------------
$envFile = Join-Path $BACKEND ".env"
if (-not (Test-Path $envFile)) {
    Write-Warn ".env not found - creating from template"
    Copy-Item (Join-Path $BACKEND ".env.example") $envFile
    Write-Ok ".env created (AI_API_KEY is blank - enter your key in the app)"
}

# --- Frontend setup ------------------------------------------
Write-Header "Setting up frontend..."

Write-Step "Installing / verifying frontend dependencies..."
Push-Location $FRONTEND
npm install --silent --no-audit --no-fund
npm rebuild esbuild --silent
Pop-Location
Write-Ok "Frontend dependencies ready"

# --- Launch --------------------------------------------------
Write-Header "Starting services..."
Write-Host ""
Write-Host "  Backend  -> http://localhost:8000" -ForegroundColor DarkGreen
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor DarkGreen
Write-Host "  API docs -> http://localhost:8000/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop both services." -ForegroundColor DarkGray
Write-Host ""

# Start backend as a background job
$backendJob = Start-Job -ScriptBlock {
    param($uvicorn, $backend)
    Set-Location $backend
    & $uvicorn main:app --reload --host 127.0.0.1 --port 8000
} -ArgumentList $UVICORN, $BACKEND

# Give backend a moment to bind
Start-Sleep -Seconds 2

# Start frontend in the foreground (blocks until Ctrl+C)
Push-Location $FRONTEND
try {
    npm run dev
} finally {
    Pop-Location
    Write-Host ""
    Write-Step "Stopping backend..."
    Stop-Job  $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Ok "All services stopped. Goodbye!"
}
