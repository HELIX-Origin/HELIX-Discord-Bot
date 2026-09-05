#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - Linux/POSIX Production Runner
# ==============================================================================
# Usage:
#   ./run-start.sh            # Runs in foreground with terminal output & logfile
#   ./run-start.sh --silent   # Runs in background silently (logs to logs/helix_*.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

mkdir -p logs
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/helix_${TIMESTAMP}.log"

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Starting Silently (Background)"
  echo "==================================================="
  nohup npm start > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "[OK] HELIX started in background (PID: $PID)."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo "[INFO] To stop the bot, run: kill $PID"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Production Runtime"
  echo "==================================================="
  echo "[INFO] Starting HELIX in foreground..."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo "[TIP] Pass --silent to launch in the background without terminal."
  echo ""
  npm start 2>&1 | tee "$LOG_FILE"
fi
