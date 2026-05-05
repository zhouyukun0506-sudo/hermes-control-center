$ErrorActionPreference = "Stop"

$Repo = "https://github.com/zhouyukun0506-sudo/hermes-control-center.git"
$InstallDir = "$env:USERPROFILE\.hermes-control"

Write-Host "⏳ Cloning Workbench with Hermes Agent..." -ForegroundColor Cyan
if (Test-Path $InstallDir) {
    Write-Host "   Updating existing installation..."
    Set-Location $InstallDir
    git pull --ff-only
} else {
    git clone $Repo $InstallDir
    Set-Location $InstallDir
}

Write-Host "⏳ Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "⏳ Building frontend..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "✅ Installed to $InstallDir" -ForegroundColor Green
Write-Host ""
Write-Host "   Start the app:" -ForegroundColor Yellow
Write-Host "     cd $InstallDir && npm run electron"
Write-Host ""
Write-Host "   Or run in browser:" -ForegroundColor Yellow
Write-Host "     cd $InstallDir && npm run dev"
Write-Host ""
