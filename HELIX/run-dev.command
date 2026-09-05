#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - macOS Development Runner
# ==============================================================================
# Double-clickable in macOS Finder, or run from Terminal:
#   ./run-dev.command            # Interactive terminal window & logfile
#   ./run-dev.command --silent   # Background daemon (logs to logs/helix-dev_*.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

mkdir -p logs
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/helix-dev_${TIMESTAMP}.log"

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Dev Mode (macOS Background)"
  echo "==================================================="
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "[OK] HELIX dev server started in background (PID: $PID)."
  echo "[INFO] Live logs: $LOG_FILE"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Development Mode"
  echo "==================================================="
  echo "[INFO] Starting HELIX with TypeScript hot-reloading..."
  echo "[INFO] Live logs are streaming to: $LOG_FILE"
  echo ""
  npm run dev 2>&1 | tee "$LOG_FILE"
fi
