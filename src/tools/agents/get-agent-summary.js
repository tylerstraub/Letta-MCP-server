import { createLogger } from '../../core/logger.js';
// McpError and ErrorCode imported by framework

const logger = createLogger('get_agent_summary');

/**
 * Tool handler for getting a summary of an agent's configuration
 */
export async function handleGetAgentSummary(server, args) {
    if (!args?.agent_id) {
        server.createErrorResponse('Missing required argument: agent_id');
    }

    const agentId = args.agent_id;
    const encodedAgentId = encodeURIComponent(agentId);
    const headers = server.getApiHeaders();

    try {
        logger.info(`Fetching summary for agent ${agentId}...`);

        // Fetch data from multiple endpoints concurrently
        const [agentStateRes, coreMemoryRes, toolsRes, sourcesRes] = await Promise.allSettled([
            server.api.get(`/agents/${encodedAgentId}`, { headers }),
            server.api.get(`/agents/${encodedAgentId}/core-memory/blocks`, { headers }),
            server.api.get(`/agents/${encodedAgentId}/tools`, { headers }),
            server.api.get(`/agents/${encodedAgentId}/sources`, { headers }),
        ]);

        // Process Agent State
        if (agentStateRes.status === 'rejected' || agentStateRes.value.status !== 200) {
            const errorInfo =
                agentStateRes.reason?.response?.data ||
                agentStateRes.reason?.message ||
                agentStateRes.value?.data ||
                'Unknown error fetching agent state';
            logger.error(`Failed to fetch agent state for ${agentId}:`, errorInfo);
            // If agent doesn't exist, return a specific error
            if (
                agentStateRes.reason?.response?.status === 404 ||
                agentStateRes.value?.status === 404
            ) {
                server.createErrorResponse(`Agent not found: ${agentId}`);
            }
            server.createErrorResponse(`Failed to fetch agent state: ${JSON.stringify(errorInfo)}`);
        }
        const agentState = agentStateRes.value.data;

        // Process Core Memory (optional, might fail if agent has none)
        let coreMemoryBlocks = [];
        if (coreMemoryRes.status === 'fulfilled' && coreMemoryRes.value.status === 200) {
            let memoryData = coreMemoryRes.value.data;
            // Handle different response structures: array directly or object with blocks property
            if (!Array.isArray(memoryData)) {
                memoryData = memoryData?.blocks || memoryData?.data || [];
            }
            if (Array.isArray(memoryData)) {
                coreMemoryBlocks = memoryData;
            }
        } else {
            logger.warn(
                `Could not fetch core memory for ${agentId}:`,
                coreMemoryRes.reason?.response?.data ||
                    coreMemoryRes.reason?.message ||
                    'Non-200 status',
            );
        }

        // Process Tools (optional)
        let attachedTools = [];
        if (toolsRes.status === 'fulfilled' && toolsRes.value.status === 200) {
            let toolsData = toolsRes.value.data;
            // Handle different response structures: array directly or object with tools property
            if (!Array.isArray(toolsData)) {
                toolsData = toolsData?.tools || toolsData?.data || [];
            }
            if (Array.isArray(toolsData)) {
                attachedTools = toolsData.map((tool) => ({
                    id: tool.id,
                    name: tool.name,
                    type: tool.tool_type,
                }));
            }
        } else {
            logger.warn(
                `Could not fetch tools for ${agentId}:`,
                toolsRes.reason?.response?.data || toolsRes.reason?.message || 'Non-200 status',
            );
        }

        // Process Sources (optional)
        let attachedSources = [];
        if (sourcesRes.status === 'fulfilled' && sourcesRes.value.status === 200) {
            let sourcesData = sourcesRes.value.data;
            // Handle different response structures: array directly or object with sources property
            if (!Array.isArray(sourcesData)) {
                sourcesData = sourcesData?.sources || sourcesData?.data || [];
            }
            if (Array.isArray(sourcesData)) {
                attachedSources = sourcesData.map((source) => ({
                    id: source.id,
                    name: source.name,
                }));
            }
        } else {
            logger.warn(
                `Could not fetch sources for ${agentId}:`,
                sourcesRes.reason?.response?.data || sourcesRes.reason?.message || 'Non-200 status',
            );
        }

        // Extract persona and human from core memory blocks
        const personaBlock = coreMemoryBlocks.find((b) => b.label === 'persona');
        const humanBlock = coreMemoryBlocks.find((b) => b.label === 'human');

        // Get archival memory size (fetch passages count)
        let archivalMemorySize = 0;
        try {
            const passagesRes = await server.api.get(
                `/agents/${encodedAgentId}/archival-memory`,
                { headers },
            );
            if (passagesRes.status === 200 && Array.isArray(passagesRes.data)) {
                archivalMemorySize = passagesRes.data.length;
            }
        } catch (error) {
            // Archival memory might not exist, use 0
            logger.debug(`Could not fetch archival memory size for ${agentId}:`, error.message);
        }

        // Extract model from agent state
        const model =
            agentState.llm_config?.model ||
            agentState.llm_config?.handle ||
            agentState.model ||
            '';

        // Format tools as array of strings (tool names/IDs)
        const toolsArray = attachedTools.map((tool) => tool.name || tool.id || '');

        // Construct the summary for text content (backward compatibility)
        const summary = {
            agent_id: agentState.id,
            name: agentState.name,
            description: agentState.description,
            system_prompt_snippet:
                agentState.system?.substring(0, 200) + (agentState.system?.length > 200 ? '...' : '') || '',
            llm_config:
                agentState.llm_config?.handle ||
                `${agentState.llm_config?.model_endpoint_type}/${agentState.llm_config?.model}`,
            embedding_config:
                agentState.embedding_config?.handle ||
                `${agentState.embedding_config?.embedding_endpoint_type}/${agentState.embedding_config?.embedding_model}`,
            core_memory_blocks: coreMemoryBlocks.map((block) => ({
                label: block.label,
                value_snippet:
                    block.value?.substring(0, 100) + (block.value?.length > 100 ? '...' : '') || '',
            })),
            attached_tools_count: attachedTools.length,
            attached_tools: attachedTools,
            attached_sources_count: attachedSources.length,
            attached_sources: attachedSources,
        };

        // Construct structuredContent matching output schema exactly
        const structuredContent = {
            agent_id: agentState.id || '',
            name: agentState.name || '',
            description: agentState.description || '',
            model: model,
            memory_summary: {
                core_memory: {
                    persona: personaBlock?.value || '',
                    human: humanBlock?.value || '',
                },
                archival_memory_size: archivalMemorySize,
            },
            tools: toolsArray,
            last_activity: agentState.last_activity || '',
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(summary),
                },
            ],
            structuredContent: structuredContent,
        };
    } catch (error) {
        // Catch any unexpected errors during processing
        logger.error(`Unexpected error for agent ${agentId}:`, error);
        server.createErrorResponse(`Failed to get agent summary: ${error.message}`);
    }
}

/**
 * Tool definition for get_agent_summary
 */
export const getAgentSummaryDefinition = {
    name: 'get_agent_summary',
    description:
        "Provides a concise summary of an agent's configuration, including core memory snippets and attached tool/source names. Use list_agents to find agent IDs. Follow up with modify_agent to change settings or attach_tool to add capabilities.",
    inputSchema: {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string',
                description: 'The ID of the agent to summarize.',
            },
        },
        required: ['agent_id'],
    },
};
