#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - macOS Production Runner
# ==============================================================================
# Double-clickable in macOS Finder, or run from Terminal:
#   ./run.command            # Interactive terminal window
#   ./run.command --silent   # Background daemon (logs to helix.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Starting Silently (macOS)"
  echo "==================================================="
  nohup npm start > helix.log 2>&1 &
  PID=$!
  echo "[OK] HELIX started in background (PID: $PID)."
  echo "[INFO] Live logs: helix.log"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Production Runtime"
  echo "==================================================="
  echo "[INFO] Starting HELIX in macOS Terminal..."
  echo ""
  npm start
fi
