# Setting Up Auto-Start for Letta MCP Server on macOS

## Current Status

**❌ The server will NOT survive reboots** - it's currently running as a regular background process.

## Solution: macOS launchd Service

I've created a launchd configuration file that will:
- ✅ Start the server automatically on boot
- ✅ Restart the server if it crashes
- ✅ Load environment variables from `.env` file
- ✅ Log output to `logs/stdout.log` and `logs/stderr.log`

## Setup Instructions

### Step 1: Install the launchd Service

```bash
# Copy the plist file to LaunchAgents directory
cp /Users/tylerstraub/Letta-MCP-server/com.letta.mcp-server.plist ~/Library/LaunchAgents/

# Load the service (starts it immediately)
launchctl load ~/Library/LaunchAgents/com.letta.mcp-server.plist
```

### Step 2: Verify It's Running

```bash
# Check service status
launchctl list | grep letta

# Check if server is responding
curl http://localhost:3001/health

# View logs
tail -f /Users/tylerstraub/Letta-MCP-server/logs/stdout.log
```

### Step 3: Test Auto-Start (Optional)

```bash
# Unload the service
launchctl unload ~/Library/LaunchAgents/com.letta.mcp-server.plist

# Load it again (simulates a reboot)
launchctl load ~/Library/LaunchAgents/com.letta.mcp-server.plist
```

## Managing the Service

### Start the Service
```bash
launchctl start com.letta.mcp-server
```

### Stop the Service
```bash
launchctl stop com.letta.mcp-server
```

### Restart the Service
```bash
launchctl unload ~/Library/LaunchAgents/com.letta.mcp-server.plist
launchctl load ~/Library/LaunchAgents/com.letta.mcp-server.plist
```

### Remove Auto-Start (if needed)
```bash
launchctl unload ~/Library/LaunchAgents/com.letta.mcp-server.plist
rm ~/Library/LaunchAgents/com.letta.mcp-server.plist
```

## Important Notes

1. **Environment Variables**: The service loads variables from `.env` file automatically via the wrapper script.

2. **Node.js Path**: The wrapper script handles Node.js path (works with nvm or system Node.js).

3. **Logs**: Check logs in:
   - `logs/stdout.log` - Standard output
   - `logs/stderr.log` - Error output

4. **Current Running Process**: You should stop the current manually-started server before enabling the service:
   ```bash
   pkill -f "node src/index.js --http"
   ```

## Alternative: PM2 (Process Manager)

If you prefer PM2 (more features, easier management):

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd /Users/tylerstraub/Letta-MCP-server
pm2 start src/index.js --name letta-mcp -- --http

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints
```

PM2 provides:
- Web dashboard
- Log rotation
- Process monitoring
- Easier restart/stop commands

## Verification After Reboot

After rebooting your Mac:
1. Wait 30-60 seconds for services to start
2. Check if server is running: `curl http://localhost:3001/health`
3. Check service status: `launchctl list | grep letta`
4. View logs if needed: `tail -f logs/stdout.log`

---

**Ready to set up?** Run the commands in Step 1 above!

