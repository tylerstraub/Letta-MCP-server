# Letta MCP Server

Model Context Protocol (MCP) server providing tools for managing Letta agents, memory operations, and integrations. This server connects MCP clients (like Cursor) to your on-premise Letta instance.

## Features

- 🤖 **Agent Management** - Create, modify, clone, and manage Letta agents
- 🧠 **Memory Operations** - Handle memory blocks and passages
- 🔧 **Tool Integration** - Attach and manage tools for agents
- 💬 **Prompts** - Interactive wizards and assistants
- 📚 **Resources** - Access system information and documentation
- 🌐 **HTTP Transport** - Production-ready HTTP transport for remote connections

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- Access to your on-premise Letta instance on the local network

### Installation

```bash
# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
# Edit .env with your Letta instance details
```

### Configuration

Create a `.env` file in the project root:

```bash
# Required: Your Letta instance URL (without /v1 - server adds it automatically)
LETTA_BASE_URL=http://192.168.5.10:8283

# Required: Letta API password (empty string if not required)
LETTA_PASSWORD=your-password

# Optional: Server configuration
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
```

**Important:** `LETTA_BASE_URL` should NOT include `/v1` - the server adds it automatically.

### Running the Server

```bash
# Start server
npm run server:start

# Check status
npm run server:status

# Stop server
npm run server:stop

# Restart server
npm run server:restart
```

See [MANAGEMENT.md](MANAGEMENT.md) for detailed management commands.

### Health Check

```bash
curl http://localhost:3001/health
```

## Cursor Integration

To use this server with Cursor, copy `cursor-mcp.json` to your project root as `mcp.json`:

```bash
cp cursor-mcp.json /path/to/your/project/mcp.json
```

The server will be available at `http://localhost:3001/mcp`.

**Note:** Ensure the server is running before using it in Cursor.

## Server Management

The server includes management scripts for easy operation:

| Action | Command |
|--------|---------|
| Start | `npm run server:start` or `./scripts/start.sh` |
| Stop | `npm run server:stop` or `./scripts/stop.sh` |
| Restart | `npm run server:restart` or `./scripts/restart.sh` |
| Status | `npm run server:status` or `./scripts/status.sh` |

**Full documentation:** See [MANAGEMENT.md](MANAGEMENT.md)

## Available Tools

The server provides 70+ tools organized by category:

- **Agent Management**: `create_agent`, `list_agents`, `modify_agent`, `delete_agent`, `clone_agent`, `prompt_agent`
- **Memory Operations**: `create_memory_block`, `list_memory_blocks`, `update_memory_block`, `attach_memory_block`
- **Passage Management**: `create_passage`, `list_passages`, `modify_passage`, `delete_passage`
- **Tool Management**: `upload_tool`, `attach_tool`, `list_agent_tools`
- **Model Information**: `list_llm_models`, `list_embedding_models`
- **MCP Integration**: `list_mcp_servers`, `list_mcp_tools_by_server`, `add_mcp_tool_to_letta`

All tools include structured output schemas and enhanced descriptions.

## Logs

Server logs are written to `logs/server.log`:

```bash
# View live logs
tail -f logs/server.log

# View last 50 lines
tail -n 50 logs/server.log
```

## Troubleshooting

### Server won't start
- Verify `.env` file exists and has `LETTA_BASE_URL` and `LETTA_PASSWORD`
- Check port 3001 is not in use: `lsof -i :3001`
- Check logs: `tail -f logs/server.log`

### Connection errors
- Verify `LETTA_BASE_URL` is correct (use internal IP if on local network)
- Test connectivity: `curl http://your-letta-ip:port/`
- Ensure Letta instance is running and accessible

### Schema validation errors
- All tools should return structured responses
- Check server logs for detailed error information
- Verify Letta API is responding correctly

## Project Structure

```
├── src/
│   ├── index.js          # Entry point
│   ├── core/             # Server core
│   ├── tools/            # Tool implementations
│   ├── handlers/         # Prompt and resource handlers
│   └── transports/       # Transport implementations
├── scripts/              # Management scripts
├── logs/                 # Server logs
├── .env                  # Environment configuration (create from .env.example)
└── package.json          # Dependencies and scripts
```

## License

MIT License - see LICENSE file for details
