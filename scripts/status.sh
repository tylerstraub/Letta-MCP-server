#!/bin/bash
# Check Letta MCP Server status
# Usage: ./scripts/status.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Find running server process
SERVER_PID=$(pgrep -f "node src/index.js --http" || true)

if [ -z "$SERVER_PID" ]; then
    echo "❌ Server is not running"
    exit 1
fi

echo "✅ Server is running"
echo "   PID: $SERVER_PID"

# Try to get health status
PORT=${PORT:-3001}
HEALTH=$(curl -s http://localhost:$PORT/health 2>/dev/null || echo "unreachable")

if [ "$HEALTH" != "unreachable" ]; then
    echo "   Status: $(echo $HEALTH | python3 -m json.tool 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo 'unknown')"
    echo "   Health: http://localhost:$PORT/health"
else
    echo "   ⚠️  Health endpoint not responding"
fi

echo "   Logs: logs/server.log"

