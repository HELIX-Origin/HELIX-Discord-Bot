@echo off
title HELIX Discord Bot - Development (Hot Reload)
cd /d "%~dp0"

if not exist "logs" mkdir "logs"

for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%a
set LOG_FILE=logs\helix-dev_%TIMESTAMP%.log

echo ===================================================
echo   HELIX Discord Bot - Development Mode
echo ===================================================
echo [INFO] Starting HELIX with TypeScript hot-reloading...
echo [INFO] Logging output to: %LOG_FILE%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Continue'; npm run dev 2>&1 | Tee-Object -FilePath '%LOG_FILE%'"
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Process exited with error code %ERRORLEVEL%.
  echo [INFO] See log file for details: %LOG_FILE%
  pause
)
