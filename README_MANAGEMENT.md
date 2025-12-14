# Server Management - Quick Reference

## Standard Commands

```bash
# Start server
npm run server:start
# or
./scripts/start.sh

# Stop server
npm run server:stop
# or
./scripts/stop.sh

# Restart server
npm run server:restart
# or
./scripts/restart.sh

# Check status
npm run server:status
# or
./scripts/status.sh
```

## What Each Command Does

- **start**: Starts server in background, logs to `logs/server.log`
- **stop**: Gracefully stops server (force kills if needed)
- **restart**: Stops then starts server
- **status**: Shows if server is running, PID, and health status

## View Logs

```bash
tail -f logs/server.log
```

## Health Check

```bash
curl http://localhost:3001/health
```

---

**Full documentation**: See `MANAGEMENT.md` for detailed information.

