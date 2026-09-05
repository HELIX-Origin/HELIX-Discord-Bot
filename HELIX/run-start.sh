#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - Linux/POSIX Production Runner
# ==============================================================================
# Usage:
#   ./run-start.sh            # Runs in foreground with terminal output
#   ./run-start.sh --silent   # Runs in background silently (logs to helix.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Starting Silently (Background)"
  echo "==================================================="
  nohup npm start > helix.log 2>&1 &
  PID=$!
  echo "[OK] HELIX started in background (PID: $PID)."
  echo "[INFO] Live logs are streaming to: helix.log"
  echo "[INFO] To stop the bot, run: kill $PID"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Production Runtime"
  echo "==================================================="
  echo "[INFO] Starting HELIX in foreground..."
  echo "[TIP] Pass --silent to launch in the background without terminal."
  echo ""
  npm start
fi
