#!/bin/bash
# Start Letta MCP Server
# Usage: ./scripts/start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Check if server is already running
if pgrep -f "node src/index.js --http" > /dev/null; then
    echo "⚠️  Server is already running!"
    echo "   PID: $(pgrep -f 'node src/index.js --http')"
    echo "   Use './scripts/stop.sh' to stop it first, or './scripts/restart.sh' to restart"
    exit 1
fi

# Load environment variables from .env file
if [ -f ".env" ]; then
    # Export variables, skipping comments and empty lines
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        # Export the variable
        export "$line" 2>/dev/null || true
    done < .env
else
    echo "⚠️  Warning: .env file not found"
fi

# Check required environment variables
if [ -z "$LETTA_BASE_URL" ]; then
    echo "❌ Error: LETTA_BASE_URL not set in .env file"
    exit 1
fi

# Ensure node_modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory
mkdir -p logs

echo "🚀 Starting Letta MCP Server..."
echo "   Base URL: $LETTA_BASE_URL"
echo "   Port: ${PORT:-3001}"
echo "   Logs: logs/server.log"

# Start server in background, redirect output to log file
nohup node src/index.js --http > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully!"
    echo "   PID: $SERVER_PID"
    echo "   Health check: http://localhost:${PORT:-3001}/health"
    echo "   View logs: tail -f logs/server.log"
    echo "$SERVER_PID" > .server.pid
else
    echo "❌ Server failed to start. Check logs/server.log for details"
    exit 1
fi

