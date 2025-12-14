# Letta MCP Server - Management Guide

Easy-to-use commands for managing the Letta MCP Server.

## Quick Reference

| Action | Command |
|--------|---------|
| **Start** | `npm run server:start` or `./scripts/start.sh` |
| **Stop** | `npm run server:stop` or `./scripts/stop.sh` |
| **Restart** | `npm run server:restart` or `./scripts/restart.sh` |
| **Status** | `npm run server:status` or `./scripts/status.sh` |

## Detailed Commands

### Start Server

```bash
npm run server:start
# or
./scripts/start.sh
```

**What it does:**
- Checks if server is already running
- Loads environment variables from `.env`
- Verifies required variables are set
- Installs dependencies if needed
- Starts server in background
- Logs output to `logs/server.log`
- Shows server PID and health check URL

**Output:**
```
🚀 Starting Letta MCP Server...
   Base URL: http://192.168.5.10:8283
   Port: 3001
   Logs: logs/server.log
✅ Server started successfully!
   PID: 12345
   Health check: http://localhost:3001/health
   View logs: tail -f logs/server.log
```

### Stop Server

```bash
npm run server:stop
# or
./scripts/stop.sh
```

**What it does:**
- Finds running server process
- Attempts graceful shutdown
- Force kills if needed
- Cleans up PID file

**Output:**
```
🛑 Stopping Letta MCP Server (PID: 12345)...
✅ Server stopped gracefully
```

### Restart Server

```bash
npm run server:restart
# or
./scripts/restart.sh
```

**What it does:**
- Stops the server (if running)
- Waits a moment
- Starts the server again

**Output:**
```
🔄 Restarting Letta MCP Server...
🛑 Stopping Letta MCP Server (PID: 12345)...
✅ Server stopped gracefully
🚀 Starting Letta MCP Server...
✅ Server started successfully!
```

### Check Status

```bash
npm run server:status
# or
./scripts/status.sh
```

**What it does:**
- Checks if server process is running
- Tests health endpoint
- Shows server information

**Output:**
```
✅ Server is running
   PID: 12345
   Status: healthy
   Health: http://localhost:3001/health
   Logs: logs/server.log
```

## Viewing Logs

```bash
# View live logs
tail -f logs/server.log

# View last 50 lines
tail -n 50 logs/server.log

# Search logs
grep "error" logs/server.log
```

## Health Check

```bash
# Quick health check
curl http://localhost:3001/health

# Pretty-printed
curl -s http://localhost:3001/health | python3 -m json.tool
```

## Troubleshooting

### Server won't start
- Check `.env` file exists and has required variables
- Verify port 3001 is not in use: `lsof -i :3001`
- Check logs: `tail -f logs/server.log`

### Server won't stop
- Find process: `ps aux | grep "node src/index.js"`
- Force kill: `kill -9 <PID>`
- Or use: `pkill -f "node src/index.js --http"`

### Check if server is running
```bash
# Quick check
ps aux | grep "node src/index.js" | grep -v grep

# Or use status script
npm run server:status
```

## File Locations

- **Scripts**: `scripts/` directory
- **Logs**: `logs/server.log`
- **PID File**: `.server.pid` (created automatically)
- **Config**: `.env` file in project root

## Notes

- Server runs in background (daemon mode)
- Logs are written to `logs/server.log`
- PID is stored in `.server.pid` for tracking
- Environment variables are loaded from `.env` automatically
- Server will not auto-start on reboot (by design)

