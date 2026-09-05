@echo off
title HELIX Discord Bot - Production
cd /d "%~dp0"

if not exist "logs" mkdir "logs"

for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%a
set LOG_FILE=logs\helix_%TIMESTAMP%.log

echo ===================================================
echo   HELIX Discord Bot - Production Runtime
echo ===================================================
echo [INFO] Starting HELIX in production mode...
echo [INFO] Logging output to: %LOG_FILE%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Continue'; npm start 2>&1 | Tee-Object -FilePath '%LOG_FILE%'"
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Process exited with error code %ERRORLEVEL%.
  echo [INFO] See log file for details: %LOG_FILE%
  pause
)
