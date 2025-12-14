# Letta MCP Server - Custom Deployment

Model Context Protocol (MCP) server connecting Cursor and other MCP clients to your on-premise Letta instance. This is a custom deployment configured for local network access.

## Overview

This server provides a bridge between MCP clients (like Cursor) and your Letta AI platform, enabling agent management, memory operations, tool integration, and more through the Model Context Protocol.

**Deployment Type:** Direct Node.js deployment on local network  
**Letta Instance:** On-premise (local network)  
**Primary Client:** Cursor IDE

## Features

- 🤖 **Agent Management** - Create, modify, clone, delete, and manage Letta agents
- 🧠 **Memory Operations** - Handle memory blocks and passages
- 🔧 **Tool Integration** - Attach and manage tools for agents
- 💬 **Prompts** - Interactive wizards and assistants
- 📚 **Resources** - Access system information and documentation
- 🌐 **HTTP Transport** - Production-ready HTTP transport for remote MCP clients
- 📊 **Structured Responses** - All tools return structured JSON responses

## Prerequisites

- **Node.js** >= 20.0.0
- **Network Access** to your on-premise Letta instance
- **Letta API Credentials** (password if required)

## Installation

```bash
# Clone or navigate to the repository
cd Letta-MCP-server

# Install dependencies
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Letta instance URL (without /v1 - server adds it automatically)
LETTA_BASE_URL=http://192.168.5.10:8283

# Required: Letta API password (use empty string if not required)
LETTA_PASSWORD=your-letta-password

# Optional: Server configuration
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
```

**Important Notes:**
- `LETTA_BASE_URL` should **NOT** include `/v1` - the server automatically appends it
- Use the internal IP address if Letta is on your local network
- If Letta doesn't require a password, use: `LETTA_PASSWORD=`

### Verify Configuration

Test connectivity to your Letta instance:

```bash
# Test Letta API connectivity
curl http://192.168.5.10:8283/v1/health
```

## Running the Server

### Quick Start

```bash
# Start the server
npm run server:start

# Check status
npm run server:status

# View logs
tail -f logs/server.log
```

### Management Commands

| Action | Command |
|--------|---------|
| **Start** | `npm run server:start` or `./scripts/start.sh` |
| **Stop** | `npm run server:stop` or `./scripts/stop.sh` |
| **Restart** | `npm run server:restart` or `./scripts/restart.sh` |
| **Status** | `npm run server:status` or `./scripts/status.sh` |

**Full documentation:** See [MANAGEMENT.md](MANAGEMENT.md) for detailed management guide.

### Server Behavior

- Server runs in **background** (daemon mode)
- Logs are written to `logs/server.log`
- Process ID is stored in `logs/server.pid`
- Server does **NOT** auto-start on reboot (manual start required)
- Health endpoint available at `http://localhost:3001/health`

## Cursor Integration

### Setup

1. **Ensure server is running:**
   ```bash
   npm run server:status
   ```

2. **Copy MCP configuration to your project:**
   ```bash
   cp cursor-mcp.json /path/to/your/project/mcp.json
   ```

3. **Configure in Cursor:**
   - The server will be available at `http://localhost:3001/mcp`
   - Cursor will automatically discover and connect to the server
   - Tools will appear in Cursor's MCP panel

### MCP Configuration

The `cursor-mcp.json` file contains the server configuration:

```json
{
  "mcpServers": {
    "letta": {
      "url": "http://localhost:3001/mcp",
      "transport": "http",
      "disabled": false,
      "alwaysAllow": [
        "list_agents",
        "list_memory_blocks",
        "list_agent_tools",
        "retrieve_agent",
        "get_agent_summary",
        "list_llm_models",
        "list_embedding_models",
        "list_mcp_servers",
        "list_prompts"
      ],
      "timeout": 300
    }
  }
}
```

## Available Tools

The server provides 70+ tools organized by category:

### Agent Management
- `create_agent` - Create new agents
- `list_agents` - List all agents
- `retrieve_agent` - Get full agent details
- `get_agent_summary` - Get agent summary
- `modify_agent` - Update agent configuration
- `delete_agent` - Delete an agent
- `clone_agent` - Clone an existing agent
- `prompt_agent` - Send messages to agents
- `list_agent_tools` - List tools attached to an agent

### Memory Operations
- `create_memory_block` - Create memory blocks
- `list_memory_blocks` - List memory blocks
- `read_memory_block` - Read memory block content
- `update_memory_block` - Update memory blocks
- `attach_memory_block` - Attach blocks to agents
- `delete_memory_block` - Delete memory blocks

### Passage Management
- `create_passage` - Add passages to archival memory
- `list_passages` - List passages
- `modify_passage` - Update passages
- `delete_passage` - Delete passages

### Tool Management
- `upload_tool` - Upload new tools
- `attach_tool` - Attach tools to agents
- `list_agent_tools` - List agent's tools

### Model Information
- `list_llm_models` - List available LLM models
- `list_embedding_models` - List available embedding models

### MCP Integration
- `list_mcp_servers` - List configured MCP servers
- `list_mcp_tools_by_server` - List tools from MCP servers
- `add_mcp_tool_to_letta` - Add MCP tools to Letta

All tools return structured JSON responses matching their output schemas.

## Monitoring & Logs

### View Logs

```bash
# Live log tail
tail -f logs/server.log

# Last 50 lines
tail -n 50 logs/server.log

# Search for errors
grep -i error logs/server.log

# Search for specific tool calls
grep "list_agents" logs/server.log
```

### Health Check

```bash
# Quick health check
curl http://localhost:3001/health

# Pretty-printed JSON
curl -s http://localhost:3001/health | python3 -m json.tool
```

### Health Endpoint Response

```json
{
  "status": "healthy",
  "service": "letta-mcp-server",
  "transport": "streamable_http",
  "protocol_version": "2025-06-18",
  "sessions": 0,
  "uptime": 123.45,
  "timestamp": "2025-12-14T04:00:00.000Z"
}
```

## Troubleshooting

### Server Won't Start

**Check environment variables:**
```bash
# Verify .env file exists
ls -la .env

# Check required variables are set
grep LETTA_BASE_URL .env
grep LETTA_PASSWORD .env
```

**Check port availability:**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

**Check logs:**
```bash
tail -f logs/server.log
```

### Connection Errors

**Verify Letta connectivity:**
```bash
# Test Letta API directly
curl http://192.168.5.10:8283/v1/health

# Check network connectivity
ping 192.168.5.10
```

**Common issues:**
- Wrong IP address in `LETTA_BASE_URL`
- Letta instance not running
- Network firewall blocking connection
- Incorrect password in `LETTA_PASSWORD`

### Schema Validation Errors

If tools return schema validation errors:
- Check server logs for detailed error messages
- Verify Letta API is responding correctly
- Ensure all tools have been updated with structured responses
- Check that `structuredContent` is being returned by tools

### Cursor Not Connecting

**Verify server is running:**
```bash
npm run server:status
```

**Check MCP endpoint:**
```bash
curl http://localhost:3001/mcp
```

**Verify configuration:**
- Ensure `mcp.json` is in your project root
- Check that `url` points to `http://localhost:3001/mcp`
- Verify Cursor has network access to localhost:3001

## Project Structure

```
├── src/
│   ├── index.js          # Main entry point
│   ├── core/             # Server core (LettaServer, logger)
│   ├── tools/            # Tool implementations (70+ tools)
│   ├── handlers/         # Prompt and resource handlers
│   └── transports/       # Transport implementations (HTTP)
├── scripts/              # Management scripts
│   ├── start.sh          # Start server
│   ├── stop.sh           # Stop server
│   ├── restart.sh        # Restart server
│   └── status.sh         # Check server status
├── logs/                 # Server logs
│   └── server.log        # Main log file
├── .env                  # Environment configuration (create from template)
├── cursor-mcp.json       # Cursor MCP configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Maintenance

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update <package-name>
```

### Restarting After Changes

```bash
# Restart server to pick up changes
npm run server:restart
```

### Backup Configuration

Important files to backup:
- `.env` - Environment configuration
- `cursor-mcp.json` - MCP client configuration
- `logs/server.log` - Server logs (for troubleshooting)

## Security Notes

- **Never commit `.env` file** - It contains sensitive credentials
- **Server runs on localhost** - Only accessible from local machine by default
- **CORS protection** - Origin validation enabled for production
- **Password security** - Store `LETTA_PASSWORD` securely

## Support

For issues or questions:
1. Check logs: `tail -f logs/server.log`
2. Verify configuration: Check `.env` file
3. Test connectivity: Use health check endpoints
4. Review [MANAGEMENT.md](MANAGEMENT.md) for detailed operations guide

## License

MIT License - see LICENSE file for details
