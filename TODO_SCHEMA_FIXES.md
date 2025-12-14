# Schema Validation Fixes - Actionable TODOs

## Priority 0: Critical Foundation Fix (Do First!)

### TODO 0: Fix Error Response Schema Validation Bypass
**Issue:** Schema validation is running on error responses, masking validation errors
**Impact:** All tools fail schema validation even when proper errors are returned
**Action:**
- **CRITICAL:** Ensure `createErrorResponse()` bypasses schema validation entirely
- Error responses should NOT be validated against tool output schemas
- This is standard MCP behavior - errors use error format, not tool response format
- Review MCP SDK error handling to ensure errors bypass schema checks
- Test: Invalid agent ID should return validation error, NOT schema error

**Implementation:**
- Verify `server.createErrorResponse()` throws/returns proper MCP error format
- Ensure error responses are recognized by MCP framework and skip schema validation
- If needed, modify error handling in `src/core/server.js` to ensure proper error format

**Reference:** Error responses should use `{"error": {...}}` format, not tool response format

---

## Priority 1: Fix Schema Validation Errors (High Priority)

### TODO 1: Fix `get_agent_summary` structuredContent
**File:** `src/tools/agents/get-agent-summary.js`
**Issue:** Returns only `content`, missing `structuredContent` matching output schema
**Expected Schema:** `{ agent_id, name, description, model, memory_summary: { core_memory: { persona, human }, archival_memory_size }, tools: [], last_activity }`
**Current Response:** Custom summary object that doesn't match schema

**Implementation Steps:**
1. Extract `model` from `agentState.llm_config.model` or `agentState.llm_config.handle` (fallback to `agentState.model` if available)
2. Extract `core_memory.persona` from blocks array: `blocks.find(b => b.label === "persona")?.value || ""`
3. Extract `core_memory.human` from blocks array: `blocks.find(b => b.label === "human")?.value || ""`
4. Get `archival_memory_size` - may need to call passages endpoint or extract from agent state
5. Format `tools` as array of strings (tool names/IDs), not objects
6. Extract `last_activity` from agent state (if available)
7. Add `structuredContent` with properly formatted data matching schema exactly
8. Keep `content` for backward compatibility

**Code Pattern:**
```javascript
const personaBlock = coreMemoryBlocks.find(b => b.label === "persona");
const humanBlock = coreMemoryBlocks.find(b => b.label === "human");

const structuredContent = {
    agent_id: agentState.id,
    name: agentState.name,
    description: agentState.description || "",
    model: agentState.llm_config?.model || agentState.llm_config?.handle || agentState.model || "",
    memory_summary: {
        core_memory: {
            persona: personaBlock?.value || "",
            human: humanBlock?.value || ""
        },
        archival_memory_size: 0  // TODO: Get from passages or agent state
    },
    tools: attachedTools.map(t => t.name || t.id),  // Array of strings
    last_activity: agentState.last_activity || ""
};

return {
    content: [{ type: 'text', text: JSON.stringify(summary) }],
    structuredContent: structuredContent
};
```

**Reference:** See `list_prompts.js` for pattern (returns both `content` and `structuredContent`)

---

### TODO 2: Fix `retrieve_agent` structuredContent
**File:** `src/tools/agents/retrieve-agent.js`
**Issue:** Returns only `content` with `{ agent: agentState }`, missing `structuredContent`
**Expected Schema:** `{ id, name, description, created_at, model, embedding_model, memory: {}, tools: [] }`
**Current Response:** `{ agent: agentState }` - wrapper object doesn't match schema

**Implementation Steps:**
1. **DO NOT transform/flatten** - preserve API structure as-is
2. Extract agent fields from `agentState` to match schema
3. Return `structuredContent` with flat structure (not wrapped in `agent` key)
4. Map `agentState` fields to schema properties:
   - `id` from `agentState.id`
   - `name` from `agentState.name`
   - `description` from `agentState.description`
   - `created_at` from `agentState.created_at`
   - `model` from `agentState.model` or `agentState.llm_config.model`
   - `embedding_model` from `agentState.embedding_model` or `agentState.embedding_config.embedding_model`
   - `memory` from `agentState.memory` (preserve structure)
   - `tools` from `agentState.tools` (preserve as array)
5. Ensure required fields (`id`, `name`) are present
6. Keep `content` for backward compatibility

**Code Pattern:**
```javascript
const structuredContent = {
    id: agentState.id,
    name: agentState.name,
    description: agentState.description || "",
    created_at: agentState.created_at || "",
    model: agentState.model || agentState.llm_config?.model || "",
    embedding_model: agentState.embedding_model || agentState.embedding_config?.embedding_model || "",
    memory: agentState.memory || {},
    tools: agentState.tools || []
};

return {
    content: [{ type: 'text', text: JSON.stringify({ agent: agentState }) }],
    structuredContent: structuredContent
};
```

---

### TODO 3: Fix `list_agent_tools` structuredContent
**File:** `src/tools/agents/list-agent-tools.js`
**Issue:** Returns only `content`, missing `structuredContent`
**Expected Schema:** `{ agent_id: string, tools: [{ id, name, description, source }] }`
**Current Response:** `{ agent_id, agent_name, tool_count, tools }` - has extra fields

**Implementation Steps:**
1. Format `tools` array to match schema exactly:
   - Each tool must have: `id`, `name`, `description`, `source`
   - Ensure all tools have required fields (`id`, `name`)
   - Map API tool fields to schema fields
2. Remove `agent_name` and `tool_count` from structuredContent (keep in text content only)
3. Add `structuredContent` with `{ agent_id, tools: [...] }`
4. Handle empty state: `tools: []` (never null or omitted)
5. Keep `content` for backward compatibility

**Code Pattern:**
```javascript
const formattedTools = (tools || []).map(tool => ({
    id: tool.id || "",
    name: tool.name || "",
    description: tool.description || "",
    source: tool.source || tool.tool_type || ""
}));

const structuredContent = {
    agent_id: args.agent_id,
    tools: formattedTools
};

return {
    content: [{ type: 'text', text: JSON.stringify({ agent_id, agent_name, tool_count, tools }) }],
    structuredContent: structuredContent
};
```

---

### TODO 4: Fix `read_memory_block` structuredContent
**File:** `src/tools/memory/read-memory-block.js`
**Issue:** Returns only `content` with raw API response, missing `structuredContent`
**Expected Schema:** `{ id, name, label, value, metadata }` (all required)
**Current Response:** Raw `response.data` - may not match schema structure

**Implementation Steps:**
1. Map API response to schema structure exactly
2. Ensure all required fields are present (`id`, `name`, `label`, `value`)
3. Handle cases where API returns different field names
4. **Critical:** Ensure `value` is always a string (not null/undefined) - use `""` if missing
5. Handle error case: If block doesn't exist, use `createErrorResponse()` (bypasses schema)
6. Add `structuredContent` with properly formatted data
7. Keep `content` for backward compatibility

**Code Pattern:**
```javascript
try {
    const response = await server.api.get(`/blocks/${args.block_id}`, { headers });
    const block = response.data;
    
    const structuredContent = {
        id: block.id || "",
        name: block.name || "Unnamed Block",
        label: block.label || "",
        value: block.value || "",  // Always string, never null
        metadata: block.metadata || {}
    };
    
    return {
        content: [{ type: 'text', text: JSON.stringify(block) }],
        structuredContent: structuredContent
    };
} catch (error) {
    if (error.response?.status === 404) {
        return server.createErrorResponse(`Block not found: ${args.block_id}`);
    }
    return server.createErrorResponse(error);
}
```

---

### TODO 5: Fix `list_passages` structuredContent
**File:** `src/tools/passages/list-passages.js`
**Issue:** Returns only `content` with `{ passages: [...] }`, missing `structuredContent` and schema fields
**Expected Schema:** `{ passages: [{ id, text, created_at, metadata }], total: integer, has_more: boolean }`
**Current Response:** `{ passages: [...] }` - missing `total` and `has_more`

**Implementation Steps:**
1. Add `total` field: Count of passages returned (use `passages.length`)
2. Add `has_more` field:
   - If `limit` is specified: `has_more = (returned_count === limit)`
   - If no `limit` specified: `has_more = false`
   - Pattern: `const has_more = limit ? (passages.length === limit) : false;`
3. Ensure each passage has required fields (`id`, `text`)
4. Format passages to match schema structure:
   - `id` from passage.id
   - `text` from passage.text
   - `created_at` from passage.created_at
   - `metadata` from passage.metadata
5. Handle empty state: `{ passages: [], total: 0, has_more: false }`
6. Add `structuredContent` with complete schema structure
7. Keep `content` for backward compatibility

**Code Pattern:**
```javascript
const passages = response.data || [];
const limit = args.limit;
const has_more = limit ? (passages.length === limit) : false;

const formattedPassages = passages.map(passage => ({
    id: passage.id || "",
    text: passage.text || "",
    created_at: passage.created_at || "",
    metadata: passage.metadata || {}
}));

const structuredContent = {
    passages: formattedPassages,
    total: formattedPassages.length,
    has_more: has_more
};

return {
    content: [{ type: 'text', text: JSON.stringify({ passages: formattedPassages }) }],
    structuredContent: structuredContent
};
```

---

## Priority 2: Fix Parameter/API Issues (Medium Priority)

### TODO 6: Fix `list_mcp_tools_by_server` parameter mapping
**File:** `src/tools/mcp/list-mcp-tools-by-server.js`
**Issue:** Tool accepts `mcp_server_name` but API expects `mcp_server_id` (returns 400 error)
**Error:** `"Argument mcp_server_id does not match type <class 'str'>; is None"`
**Current Implementation:** Uses `mcp_server_name` directly in URL path `/tools/mcp/servers/${serverName}/tools`

**Implementation Steps (Option 1 - Preferred):**
1. Add server name-to-ID lookup before API call:
   - First call `list_mcp_servers` to get server list
   - Find server by name: `servers.find(s => s.name === mcp_server_name)`
   - Extract server ID from found server object
2. Use resolved ID in the tools endpoint
3. Return clear error if server name not found:
   - `createErrorResponse(-32602, `Server '${mcp_server_name}' not found`)`
4. Update error handling to distinguish between:
   - Server not found (404 from lookup)
   - Server found but no tools (200 with empty array)
   - API error (400/500)

**Code Pattern:**
```javascript
// First, get server list to lookup ID
const serversResponse = await server.api.get('/tools/mcp/servers', { headers });
const servers = serversResponse.data || {};
const serverEntry = Object.entries(servers).find(([name]) => name === args.mcp_server_name);

if (!serverEntry) {
    return server.createErrorResponse(`MCP Server not found: ${args.mcp_server_name}`);
}

const [serverName, serverConfig] = serverEntry;
// Use serverName (which is the ID/key) or serverConfig.id if available
const serverId = serverConfig.id || serverName;

// Now call tools endpoint with ID
const response = await server.api.get(`/tools/mcp/servers/${serverId}/tools`, { headers });
```

**Alternative (Option 2):** Accept both `mcp_server_id` and `mcp_server_name`
- Prefer `mcp_server_id` if provided
- Fallback to name lookup if only name provided
- Update tool definition to accept both (make both optional, require at least one)

---

## Priority 3: Testing & Validation (After Fixes)

### TODO 7: Test all fixed tools with real data
**Action:**
- Test `get_agent_summary` with agents that have:
  - ✅ Core memory blocks (persona/human)
  - ✅ Attached tools
  - ✅ Archival memory
  - ✅ No memory/tools (empty states)
- Test `retrieve_agent` with various agent configurations
- Test `list_agent_tools` with agents that have tools and without tools
- Test `read_memory_block` with valid and invalid block IDs
- Test `list_passages` with agents that have passages and without passages
- Verify all return proper `structuredContent` matching schemas
- Verify error responses bypass schema validation

### TODO 8: Test edge cases
**Action:**
- Test with empty/null responses from API
- Test with malformed API responses
- Test with missing optional fields
- Verify all required schema fields are always present
- Test pagination edge cases for `list_passages`:
  - No limit specified
  - Limit equals returned count (has_more = true)
  - Limit greater than returned count (has_more = false)
  - Empty results (has_more = false)

### TODO 9: Add schema validation tests
**Action:**
- Create unit tests that verify `structuredContent` matches output schemas
- Test with real API responses (mocked)
- Test with various data states (empty, populated, partial)
- Test error responses bypass schema validation
- Add to CI/CD pipeline

---

## Implementation Patterns Reference

### Pattern 1: List Operations (Reference: `list_memory_blocks`)
```javascript
const response = await api.listSomething(params);
const items = response.data || [];

return {
    content: [{
        type: 'text',
        text: JSON.stringify({ items, count: items.length })
    }],
    structuredContent: {
        items: items,
        total: items.length,
        // Always include pagination if applicable
        ...(pagination && { pagination })
    }
};
```

### Pattern 2: Get Single Item (Reference: Should be `read_memory_block`)
```javascript
try {
    const response = await api.getItem(id);
    if (!response || !response.data) {
        return createErrorResponse(-32602, "Item not found");
    }
    
    const item = response.data;
    return {
        content: [{ type: 'text', text: JSON.stringify(item) }],
        structuredContent: {
            // Map response to schema exactly
            id: item.id || "",
            name: item.name || "",
            // ... all required fields
        }
    };
} catch (error) {
    if (error.response?.status === 404) {
        return createErrorResponse(-32602, "Item not found");
    }
    return createErrorResponse(-32603, error.message);
}
```

### Pattern 3: Summary/Extracted Data (Reference: Should be `get_agent_summary`)
```javascript
const agentState = await api.getAgent(id);
const blocks = await api.getAgentBlocks(id);
const personaBlock = blocks.find(b => b.label === "persona");
const humanBlock = blocks.find(b => b.label === "human");

return {
    content: [{ type: 'text', text: JSON.stringify(summary) }],
    structuredContent: {
        agent_id: agentState.id,
        model: agentState.llm_config?.model || agentState.model || "",
        memory_summary: {
            core_memory: {
                persona: personaBlock?.value || "",
                human: humanBlock?.value || ""
            },
            archival_memory_size: 0  // Extract from passages
        },
        tools: (agentState.tools || []).map(t => t.name || t.id),
        // ... other fields
    }
};
```

### Pattern 4: Error Handling (Critical)
```javascript
try {
    // Validate input FIRST
    if (!isValidId(id)) {
        return createErrorResponse(-32602, "Invalid ID format");
        // This MUST bypass schema validation
    }
    
    // Call API
    const response = await api.get(id);
    
    // Transform to match schema
    const structuredContent = transformToSchema(response);
    
    // Return (will be schema validated)
    return {
        content: [...],
        structuredContent: structuredContent
    };
} catch (error) {
    // Error responses bypass schema validation
    if (error.response?.status === 404) {
        return createErrorResponse(-32602, "Not found");
    }
    return createErrorResponse(-32603, error.message);
}
```

---

## Key Principles

1. **Always return both `content` and `structuredContent`**
   - `content`: Text representation for backward compatibility
   - `structuredContent`: Object matching output schema exactly

2. **Empty states use empty arrays/objects, never null**
   - ✅ `tools: []` (not `tools: null` or omitted)
   - ✅ `passages: []` (not `passages: null` or omitted)
   - ✅ `metadata: {}` (not `metadata: null`)

3. **Error responses bypass schema validation**
   - Use `createErrorResponse()` for all errors
   - Errors should NOT be validated against tool output schemas
   - This is standard MCP behavior

4. **Required schema fields must always be present**
   - Use empty strings/arrays/objects as defaults
   - Never omit required fields

5. **Field mapping preserves API structure when appropriate**
   - `retrieve_agent`: Preserve nested structure
   - `get_agent_summary`: Extract and flatten to schema
   - Match field names exactly (casing matters)

---

## Implementation Order

1. **TODO 0** - Fix error response schema validation bypass (CRITICAL - do first!)
2. **TODO 1-5** - Fix schema validation for each tool (can do in parallel after TODO 0)
3. **TODO 6** - Fix parameter mapping issue
4. **TODO 7-9** - Testing and validation

---

## Estimated Effort

- **Priority 0 (Error Handling):** ~30-60 minutes
  - Review and fix error response handling
  - Test error bypass behavior
  
- **Priority 1 (Schema Fixes):** ~2-3 hours
  - Each tool: 20-30 minutes to add structuredContent
  - Testing: 30-60 minutes
  
- **Priority 2 (Parameter Fix):** ~30-60 minutes
  - Add name-to-ID lookup
  - Update error handling
  
- **Priority 3 (Testing):** ~1-2 hours
  - Comprehensive testing
  - Edge case validation

**Total:** ~4-6 hours for complete fix

---

## Questions Resolved ✅

All questions from original TODO have been answered:
- ✅ API response structures clarified
- ✅ Empty state handling defined
- ✅ Field mapping patterns established
- ✅ Pagination logic specified
- ✅ Error handling approach confirmed
- ✅ Testing strategy defined

**Ready to implement!** Start with TODO 0 (error handling), then proceed with schema fixes.
