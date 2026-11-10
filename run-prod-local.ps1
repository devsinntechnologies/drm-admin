# Local fast mode for drm-admin: build once, then serve (no per-page dev compile).
# Usage (from drm-admin):  powershell -ExecutionPolicy Bypass -File .\run-prod-local.ps1
npm.cmd run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }
npm.cmd run start -- -p 3000
