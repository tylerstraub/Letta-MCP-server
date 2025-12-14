# Cursor MCP Configuration for Letta MCP Server

This guide shows you how to add the Letta MCP Server to any Cursor project.

## Quick Setup

### Option 1: HTTP Transport (Recommended - Already Deployed)

Since your Letta MCP Server is running on `http://localhost:3001`, use this configuration:

**Create `mcp.json` in your project root:**

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

**File Location**: Place `mcp.json` in the root directory of your Cursor project.

**After creating the file**:
1. Save the file
2. Restart Cursor (or reload the window)
3. The Letta MCP Server tools will be available in Cursor

---

### Option 2: stdio Transport (Alternative)

If you prefer stdio transport instead of HTTP, use this configuration:

```json
{
  "mcpServers": {
    "letta": {
      "command": "node",
      "args": [
        "/Users/tylerstraub/Letta-MCP-server/src/index.js"
      ],
      "env": {
        "LETTA_BASE_URL": "http://your-letta-ip:port/v1",
        "LETTA_PASSWORD": "your-letta-password"
      },
      "disabled": false,
      "alwaysAllow": [
        "list_agents",
        "list_memory_blocks",
        "list_agent_tools",
        "retrieve_agent",
        "get_agent_summary"
      ],
      "timeout": 300
    }
  }
}
```

**Note**: With stdio transport, you need to provide the Letta credentials directly in the config file, and it will start a new server process for each Cursor session.

---

## Configuration Options Explained

### HTTP Transport (Recommended)

- **`url`**: The endpoint where your MCP server is running
  - Local: `http://localhost:3001/mcp`
  - Remote: `http://your-server-ip:3001/mcp`
  
- **`transport`**: Must be `"http"` for HTTP transport

- **`disabled`**: Set to `false` to enable the server

- **`alwaysAllow`**: List of tool names that Cursor should allow without prompting. These are typically read-only or safe operations.

- **`timeout`**: Request timeout in seconds (300 = 5 minutes)

### stdio Transport

- **`command`**: The command to run (usually `"node"`)

- **`args`**: Arguments to pass to the command (path to your server's index.js)

- **`env`**: Environment variables needed by the server
  - `LETTA_BASE_URL`: Your Letta instance URL (must include `/v1`)
  - `LETTA_PASSWORD`: Your Letta password (or empty string if not required)

---

## Remote Server Configuration

If your Letta MCP Server is running on a different machine:

```json
{
  "mcpServers": {
    "letta": {
      "url": "http://192.168.1.100:3001/mcp",
      "transport": "http",
      "disabled": false,
      "alwaysAllow": [
        "list_agents",
        "list_memory_blocks",
        "list_agent_tools",
        "retrieve_agent",
        "get_agent_summary"
      ],
      "timeout": 300
    }
  }
}
```

Replace `192.168.1.100:3001` with your actual server IP and port.

---

## Verifying the Connection

After adding the configuration and restarting Cursor:

1. **Check Cursor's MCP Status**:
   - Look for MCP server status in Cursor's settings or status bar
   - You should see "letta" listed as connected

2. **Test Available Tools**:
   - Try using Cursor's AI features
   - The Letta tools should be available in the tool list
   - You can ask Cursor to "list my Letta agents" or similar

3. **Check Server Health** (if using HTTP):
   ```bash
   curl http://localhost:3001/health
   ```

---

## Troubleshooting

### Issue: MCP Server Not Connecting

**For HTTP Transport**:
- Verify the server is running: `curl http://localhost:3001/health`
- Check the URL in `mcp.json` is correct
- Ensure port 3001 is accessible
- Check Cursor's console/error logs

**For stdio Transport**:
- Verify the path to `index.js` is correct (use absolute path)
- Check that Node.js is in your PATH
- Verify environment variables are set correctly
- Check Cursor's console/error logs

### Issue: Tools Not Available

- Ensure `"disabled": false` in the configuration
- Check that tools are in the `alwaysAllow` list (or be prepared to approve them)
- Restart Cursor after making configuration changes
- Verify the server is actually running and healthy

### Issue: Authentication Errors

- Verify `LETTA_BASE_URL` includes `/v1` suffix
- Check `LETTA_PASSWORD` is correct (or empty if not required)
- Test Letta connection directly: `curl http://your-letta-url/v1/health`

---

## Example: Adding to Multiple Projects

You can copy the `mcp.json` file to any project where you want Letta MCP Server access:

```bash
# Copy to another project
cp cursor-mcp.json /path/to/your/other/project/mcp.json
```

Or create a symlink if you want to share the same configuration:

```bash
# Create symlink (optional)
ln -s /Users/tylerstraub/Letta-MCP-server/cursor-mcp.json /path/to/project/mcp.json
```

---

## Available Tools

Once configured, you'll have access to 70+ Letta tools including:

- **Agent Management**: `create_agent`, `list_agents`, `modify_agent`, `delete_agent`, `clone_agent`, `prompt_agent`
- **Memory Operations**: `create_memory_block`, `list_memory_blocks`, `update_memory_block`, `attach_memory_block`
- **Passage Management**: `create_passage`, `list_passages`, `modify_passage`, `delete_passage`
- **Tool Management**: `upload_tool`, `attach_tool`, `list_agent_tools`
- **Model Information**: `list_llm_models`, `list_embedding_models`
- **MCP Integration**: `list_mcp_servers`, `list_mcp_tools_by_server`, `add_mcp_tool_to_letta`

And more! See the main README for the complete list.

---

## Next Steps

1. ✅ Copy `cursor-mcp.json` to your project as `mcp.json`
2. ✅ Restart Cursor
3. ✅ Verify connection in Cursor's MCP status
4. ✅ Start using Letta tools in your projects!

