$ErrorActionPreference = "Stop"

# ── Check prerequisites ──
function Check-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host ""
Write-Host "  Workbench with Hermes Agent — Installer" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor DarkGray
Write-Host ""

# Check Git
if (-not (Check-Command "git")) {
    Write-Host "  [!] Git is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Install Git first:" -ForegroundColor Yellow
    Write-Host "    winget install Git.Git" -ForegroundColor White
    Write-Host "    or download from: https://git-scm.com/download/win" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  After installing Git, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Node.js
if (-not (Check-Command "node")) {
    Write-Host "  [!] Node.js is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Install Node.js first:" -ForegroundColor Yellow
    Write-Host "    winget install OpenJS.NodeJS.LTS" -ForegroundColor White
    Write-Host "    or download from: https://nodejs.org" -ForegroundColor DarkGray
    exit 1
}

# Check npm
if (-not (Check-Command "npm")) {
    Write-Host "  [!] npm is not installed (usually comes with Node.js)." -ForegroundColor Red
    exit 1
}

$nodeVer = node --version
Write-Host "  Git: $(git --version)" -ForegroundColor DarkGray
Write-Host "  Node: $nodeVer" -ForegroundColor DarkGray
Write-Host ""

$Repo = "https://github.com/zhouyukun0506-sudo/hermes-control-center.git"
$InstallDir = "$env:USERPROFILE\.hermes-control"

Write-Host "  Cloning Workbench with Hermes Agent..." -ForegroundColor Cyan
if (Test-Path $InstallDir) {
    Write-Host "  Updating existing installation..." -ForegroundColor DarkGray
    Set-Location $InstallDir
    git pull --ff-only
} else {
    git clone $Repo $InstallDir
    Set-Location $InstallDir
}

Write-Host "  Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "  Building frontend..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "  Done! Installed to $InstallDir" -ForegroundColor Green
Write-Host ""
Write-Host "  Start the desktop app:" -ForegroundColor Yellow
Write-Host "    cd $InstallDir && npm run electron" -ForegroundColor White
Write-Host ""
Write-Host "  Or run in browser:" -ForegroundColor Yellow
Write-Host "    cd $InstallDir && npm run dev" -ForegroundColor White
Write-Host ""
