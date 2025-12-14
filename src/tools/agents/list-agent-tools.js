/**
 * Tool handler for listing tools available for a specific agent
 */
export async function handleListAgentTools(server, args) {
    try {
        if (!args.agent_id) {
            throw new Error('Missing required argument: agent_id');
        }

        const headers = server.getApiHeaders();

        const agentInfoResponse = await server.api.get(`/agents/${args.agent_id}`, { headers });
        const agentName = agentInfoResponse.data.name;
        const tools = agentInfoResponse.data.tools || [];

        // Format tools to match output schema exactly
        const formattedTools = tools.map((tool) => ({
            id: tool.id || '',
            name: tool.name || '',
            description: tool.description || '',
            source: tool.source || tool.tool_type || '',
        }));

        // Construct structuredContent matching output schema
        const structuredContent = {
            agent_id: args.agent_id,
            tools: formattedTools,
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        agent_id: args.agent_id,
                        agent_name: agentName,
                        tool_count: tools.length,
                        tools: tools,
                    }),
                },
            ],
            structuredContent: structuredContent,
        };
    } catch (error) {
        server.createErrorResponse(error);
    }
}

/**
 * Tool definition for list_agent_tools
 */
export const listAgentToolsDefinition = {
    name: 'list_agent_tools',
    description:
        'List all tools available for a specific agent. Use attach_tool to add more tools or list_mcp_tools_by_server to discover available tools.',
    inputSchema: {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string',
                description: 'ID of the agent to list tools for',
            },
        },
        required: ['agent_id'],
    },
};
