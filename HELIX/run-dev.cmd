@echo off
title HELIX Discord Bot - Development (Hot Reload)
cd /d "%~dp0"
echo ===================================================
echo   HELIX Discord Bot - Development Mode
echo ===================================================
echo [INFO] Starting HELIX with TypeScript hot-reloading...
echo.
npm run dev
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Process exited with error code %ERRORLEVEL%.
  pause
)
