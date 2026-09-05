@echo off
title HELIX Discord Bot - Production
cd /d "%~dp0"
echo ===================================================
echo   HELIX Discord Bot - Production Runtime
echo ===================================================
echo [INFO] Starting HELIX in production mode...
echo.
npm start
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Process exited with error code %ERRORLEVEL%.
  pause
)
