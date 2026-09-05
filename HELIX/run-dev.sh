#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - Linux/POSIX Development Runner
# ==============================================================================
# Usage:
#   ./run-dev.sh            # Runs in foreground with terminal output & logfile
#   ./run-dev.sh --silent   # Runs in background silently (logs to logs/helix-dev_*.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

mkdir -p logs
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/helix-dev_${TIMESTAMP}.log"

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Dev Mode (Background)"
  echo "==================================================="
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "[OK] HELIX dev server started in background (PID: $PID)."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo "[INFO] To stop the bot, run: kill $PID"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Development Mode"
  echo "==================================================="
  echo "[INFO] Starting HELIX with TypeScript hot-reloading..."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo "[TIP] Pass --silent to launch in the background without terminal."
  echo ""
  npm run dev 2>&1 | tee "$LOG_FILE"
fi
