#!/bin/bash
# Stop Letta MCP Server
# Usage: ./scripts/stop.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Find running server process
SERVER_PID=$(pgrep -f "node src/index.js --http" || true)

if [ -z "$SERVER_PID" ]; then
    echo "ℹ️  Server is not running"
    exit 0
fi

echo "🛑 Stopping Letta MCP Server (PID: $SERVER_PID)..."

# Try graceful shutdown first
kill $SERVER_PID 2>/dev/null || true

# Wait up to 5 seconds for graceful shutdown
for i in {1..5}; do
    if ! ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "✅ Server stopped gracefully"
        rm -f .server.pid
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "⚠️  Server didn't stop gracefully, forcing shutdown..."
    kill -9 $SERVER_PID 2>/dev/null || true
    sleep 1
fi

# Verify it's stopped
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "❌ Failed to stop server"
    exit 1
else
    echo "✅ Server stopped"
    rm -f .server.pid
fi

