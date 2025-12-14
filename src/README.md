# Source Code

Core implementation of the Letta MCP server.

## Structure

- `core/` - Server core (LettaServer class, logger)
- `tools/` - Tool implementations (70+ tools)
- `handlers/` - Prompt and resource handlers
- `transports/` - Transport implementations (HTTP, SSE, stdio)
- `index.js` - Main entry point

## Running

```bash
# HTTP transport (production)
npm run start:http

# Development
npm run dev:http
```

See main [README.md](../README.md) for full documentation.
