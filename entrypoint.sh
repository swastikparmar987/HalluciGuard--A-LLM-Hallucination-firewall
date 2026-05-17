#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "    HalluciGuard Production Launcher      "
echo "=========================================="

# Start FastAPI backend via Gunicorn on local interface port 8000
echo "[1/2] Starting Gunicorn FastAPI server..."
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 127.0.0.1:8000 &
BACKEND_PID=$!

# Start Nginx in foreground to keep the container running
echo "[2/2] Starting Nginx reverse proxy..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Graceful termination handler
cleanup() {
    echo "Signal received, cleaning up processes..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    kill -TERM "$NGINX_PID" 2>/dev/null || true
    wait "$BACKEND_PID" "$NGINX_PID"
    echo "Processes terminated. Goodbye!"
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Monitor both background processes. If either exits, stop the other and exit the container
while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "[CRITICAL] Backend Gunicorn process died!"
        cleanup
        exit 1
    fi
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "[CRITICAL] Nginx process died!"
        cleanup
        exit 1
    fi
    sleep 2
done
