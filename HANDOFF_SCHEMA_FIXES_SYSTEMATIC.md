# Handoff: Systematic Schema Validation Fixes

## Context

We've identified a **systematic issue**: ~15-16 tools have output schemas defined but don't return `structuredContent`, causing schema validation errors even when operations succeed.

**Reported Bug:** `modify_agent` - operation succeeds but returns schema error  
**Root Cause:** Same pattern as tools we already fixed - missing `structuredContent`  
**Scope:** Affects ~15-16 tools across agent, memory, passage, and tool operations

**Reference:** See `SCHEMA_ANALYSIS.md` and `MODIFY_AGENT_ANALYSIS.md` for detailed analysis.

---

## The Problem

Tools with output schemas must return:
```javascript
{
    content: [{ type: 'text', text: JSON.stringify(data) }],
    structuredContent: { /* object matching output schema exactly */ }
}
```

**Current state:**
- ✅ 13-14 tools return `structuredContent` (including ones we just fixed)
- ❌ 15-16 tools missing `structuredContent` (including `modify_agent`)

---

## Execution Strategy

### Option A: Fix High-Priority Tools First (Recommended)

**Priority 1 (Reported/Common Operations):**
1. `modify_agent` ⚠️ **REPORTED BUG** - Fix first
2. `delete_agent` - Common operation
3. `clone_agent` - Common operation
4. `prompt_agent` - Core functionality

**Priority 2 (Memory Operations):**
5. `create_memory_block`
6. `update_memory_block`
7. `attach_memory_block`

**Priority 3 (Passage Operations):**
8. `create_passage`
9. `modify_passage`
10. `delete_passage`

**Priority 4 (Tool Operations):**
11. `attach_tool`
12. `upload_tool`
13. `add_mcp_tool_to_letta`

**Priority 5 (Bulk/Import/Export):**
14. `export_agent`
15. `import_agent`
16. `bulk_attach_tool_to_agents`
17. `bulk_delete_agents`

### Option B: Fix All at Once

If you prefer to fix systematically, work through the list above in order.

---

## Fix Pattern (Same for All Tools)

### Step 1: Check Output Schema

**File:** `src/tools/output-schemas.js`

Find the schema for your tool. Example for `modify_agent`:
```javascript
modify_agent: {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        agent_id: { type: 'string' },
        updated_fields: {
            type: 'array',
            items: { type: 'string' },
        },
    },
    required: ['success', 'agent_id'],
}
```

### Step 2: Map API Response to Schema

Transform the API response to match the schema exactly:

```javascript
// For modify_agent example:
const updatedFields = Object.keys(args.update_data || {});

const structuredContent = {
    success: true,
    agent_id: agentId,
    updated_fields: updatedFields
};
```

### Step 3: Add structuredContent to Return

```javascript
return {
    content: [{
        type: 'text',
        text: JSON.stringify(response.data)  // Keep existing
    }],
    structuredContent: structuredContent  // Add this
};
```

---

## Quick Reference: Common Schema Patterns

### Success/ID Pattern (modify, delete, create operations)
```javascript
{
    success: true,
    agent_id: "...",
    updated_fields: [...]  // or other fields
}
```

### ID/Data Pattern (create operations)
```javascript
{
    agent_id: "...",
    capabilities: [...]
}
```

### Success/ID/Message Pattern (delete operations)
```javascript
{
    success: true,
    agent_id: "...",
    message: "..."
}
```

**Full schemas:** See `src/tools/output-schemas.js` for exact structure for each tool.

---

## Implementation Checklist

For each tool:

- [ ] 1. Locate tool file in `src/tools/`
- [ ] 2. Check output schema in `src/tools/output-schemas.js`
- [ ] 3. Find the `return` statement in tool handler
- [ ] 4. Extract/transform data to match schema
- [ ] 5. Add `structuredContent` field
- [ ] 6. Keep existing `content` field (backward compatibility)
- [ ] 7. Test with valid data
- [ ] 8. Test with invalid data (error handling)
- [ ] 9. Verify no regressions

---

## Example: Fixing `modify_agent`

**File:** `src/tools/agents/modify-agent.js`

**Current code (lines 21-30):**
```javascript
return {
    content: [{
        type: 'text',
        text: JSON.stringify({
            agent: updatedAgentState,
        }),
    }],
};
```

**Fixed code:**
```javascript
// Extract updated fields from update_data
const updatedFields = Object.keys(args.update_data || {});

// Construct structuredContent matching output schema
const structuredContent = {
    success: true,
    agent_id: agentId,
    updated_fields: updatedFields,
};

return {
    content: [{
        type: 'text',
        text: JSON.stringify({
            agent: updatedAgentState,
        }),
    }],
    structuredContent: structuredContent,
};
```

**Time:** ~15-20 minutes per tool

---

## Key Principles

1. **Always return both `content` and `structuredContent`**
   - `content`: Text representation (backward compatibility)
   - `structuredContent`: Object matching output schema exactly

2. **Empty states use empty arrays/objects, never null**
   - ✅ `updated_fields: []` (not `null` or omitted)
   - ✅ `metadata: {}` (not `null`)

3. **Required schema fields must always be present**
   - Use defaults (empty strings, arrays, objects)
   - Never omit required fields

4. **Error responses bypass schema validation**
   - Use `createErrorResponse()` for errors
   - Errors don't need `structuredContent`

---

## Testing

After each fix:

1. **Test with valid data:**
   - Operation should succeed
   - Should return `structuredContent` matching schema
   - No schema validation errors

2. **Test with invalid data:**
   - Should return proper error (not schema error)
   - Error should bypass schema validation

3. **Test edge cases:**
   - Empty responses
   - Missing optional fields
   - All required fields present

---

## Files to Modify

**High Priority:**
- `src/tools/agents/modify-agent.js` ⚠️ **REPORTED BUG**
- `src/tools/agents/delete-agent.js`
- `src/tools/agents/clone-agent.js`
- `src/tools/agents/prompt-agent.js`

**Medium Priority:**
- `src/tools/memory/create-memory-block.js`
- `src/tools/memory/update-memory-block.js`
- `src/tools/memory/attach-memory-block.js`
- `src/tools/passages/create-passage.js`
- `src/tools/passages/modify-passage.js`
- `src/tools/passages/delete-passage.js`

**Lower Priority:**
- `src/tools/tools/attach-tool.js`
- `src/tools/tools/upload-tool.js`
- `src/tools/mcp/add-mcp-tool-to-letta.js`
- `src/tools/agents/export-agent.js`
- `src/tools/agents/import-agent.js`
- `src/tools/tools/bulk-attach-tool.js`
- `src/tools/agents/bulk-delete-agents.js`

**Full list:** See `SCHEMA_ANALYSIS.md` for complete list.

---

## Reference Documents

- **`SCHEMA_ANALYSIS.md`** - Full pattern analysis and scope
- **`MODIFY_AGENT_ANALYSIS.md`** - Specific analysis for reported bug
- **`TODO_SCHEMA_FIXES.md`** - Original detailed TODO (for reference)
- **`src/tools/output-schemas.js`** - All output schema definitions
- **`src/tools/prompts/list-prompts.js`** - Working example (gold standard)

---

## Getting Started

1. **Start with `modify_agent`** (reported bug, high priority)
2. **Follow the fix pattern** above
3. **Test immediately** after each fix
4. **Continue with Priority 1 tools**
5. **Work through remaining priorities** as needed

**Estimated time:**
- `modify_agent`: ~15-20 minutes
- Each additional tool: ~10-15 minutes
- All Priority 1 tools: ~1 hour
- All tools: ~3-4 hours

---

## Questions?

- **Schema definitions:** See `src/tools/output-schemas.js`
- **Working examples:** See `src/tools/prompts/list-prompts.js` or any recently fixed tool
- **Pattern details:** See `SCHEMA_ANALYSIS.md`

**The fix pattern is established and proven** - just apply it consistently! 🚀

