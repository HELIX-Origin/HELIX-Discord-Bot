#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - macOS Development Runner
# ==============================================================================
# Double-clickable in macOS Finder, or run from Terminal:
#   ./run-dev.command            # Interactive terminal window
#   ./run-dev.command --silent   # Background daemon (logs to helix-dev.log)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

if [ "$1" = "--silent" ] || [ "$1" = "-s" ] || [ "$1" = "--background" ]; then
  echo "==================================================="
  echo "  HELIX Discord Bot - Dev Mode (macOS Background)"
  echo "==================================================="
  nohup npm run dev > helix-dev.log 2>&1 &
  PID=$!
  echo "[OK] HELIX dev server started in background (PID: $PID)."
  echo "[INFO] Live logs: helix-dev.log"
else
  echo "==================================================="
  echo "  HELIX Discord Bot - Development Mode"
  echo "==================================================="
  echo "[INFO] Starting HELIX with TypeScript hot-reloading..."
  echo ""
  npm run dev
fi
