#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - Linux/POSIX Development Runner
# ==============================================================================
# Usage:
#   ./run-dev.sh            # Runs in foreground with terminal output
#   ./run-dev.sh --silent   # Runs in background silently (logs to helix-dev.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Dev Mode (Background)"
  echo "==================================================="
  nohup npm run dev > helix-dev.log 2>&1 &
  PID=$!
  echo "[OK] HELIX dev server started in background (PID: $PID)."
  echo "[INFO] Live logs are streaming to: helix-dev.log"
  echo "[INFO] To stop the bot, run: kill $PID"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Development Mode"
  echo "==================================================="
  echo "[INFO] Starting HELIX with TypeScript hot-reloading..."
  echo "[TIP] Pass --silent to launch in the background without terminal."
  echo ""
  npm run dev
fi
