#!/bin/bash
# Restart Letta MCP Server
# Usage: ./scripts/restart.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "🔄 Restarting Letta MCP Server..."

# Stop if running
"$SCRIPT_DIR/stop.sh"

# Wait a moment
sleep 1

# Start again
"$SCRIPT_DIR/start.sh"

