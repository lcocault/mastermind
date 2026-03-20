#!/usr/bin/env bash
set -euo pipefail

# run.sh - convenience script to run the Mastermind web app locally
# Usage:
#   ./run.sh start    # install (if needed), build, and serve on port 8000
#   ./run.sh dev      # install (if needed), run tsc --watch and serve
#   ./run.sh rebuild  # run `npm run build` only
#   ./run.sh test     # run `npm test`
#   ./run.sh open     # open http://localhost:8000 (if xdg-open available)
#   ./run.sh package  # build bundle and create mastermind-static.zip for deployment

PORT=${PORT:-8000}
CMD=${1:-start}

ensure_node_modules() {
  if [ ! -d node_modules ]; then
    echo "Installing npm dependencies..."
    npm install
  fi
}

start_server() {
  echo "Starting static server on http://localhost:${PORT}"
  # serve in background so we can optionally run watchers
  python3 -m http.server "${PORT}" >/dev/null 2>&1 &
  SERVER_PID=$!
  echo "Server PID: ${SERVER_PID}"
}

start_build() {
  echo "Building TypeScript..."
  npm run build
}

start_watch() {
  echo "Starting TypeScript watch (npm run start)..."
  # run in background; it prints its own output
  npm run start &
  TSC_PID=$!
  echo "TS watch PID: ${TSC_PID}"
}

cleanup() {
  echo "Shutting down..."
  if [ -n "${TSC_PID-}" ] 2>/dev/null; then
    kill "${TSC_PID}" 2>/dev/null || true
  fi
  if [ -n "${SERVER_PID-}" ] 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

case "$CMD" in
  start)
    ensure_node_modules
    start_build
    start_server
    ;;
  dev)
    ensure_node_modules
    start_watch
    start_server
    ;;
  rebuild)
    ensure_node_modules
    npm run build
    ;;
  test)
    ensure_node_modules
    npm test
    ;;
  open)
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "http://localhost:${PORT}" || true
    else
      echo "Open your browser at http://localhost:${PORT}"
    fi
    ;;
  package)
    ensure_node_modules
    echo "Building static package..."
    npm run package
    ;;
  *)
    echo "Usage: $0 [start|dev|rebuild|test|open|package]"
    exit 1
    ;;
esac

echo "Press Ctrl-C to stop."
wait
