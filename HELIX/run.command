#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - macOS Production Runner
# ==============================================================================
# Double-clickable in macOS Finder, or run from Terminal:
#   ./run.command            # Interactive terminal window & logfile
#   ./run.command --silent   # Background daemon (logs to logs/helix_*.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

mkdir -p logs
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/helix_${TIMESTAMP}.log"

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Starting Silently (macOS)"
  echo "==================================================="
  nohup npm start > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "[OK] HELIX started in background (PID: $PID)."
  echo "[INFO] Live logs: $LOG_FILE"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Production Runtime"
  echo "==================================================="
  echo "[INFO] Starting HELIX in macOS Terminal..."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo ""
  npm start 2>&1 | tee "$LOG_FILE"
fi
