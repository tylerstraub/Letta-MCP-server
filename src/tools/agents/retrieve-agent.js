/**
 * Tool handler for retrieving the state of a specific agent
 */
export async function handleRetrieveAgent(server, args) {
    if (!args?.agent_id) {
        server.createErrorResponse('Missing required argument: agent_id');
    }

    try {
        const headers = server.getApiHeaders();
        const agentId = encodeURIComponent(args.agent_id);

        // Use the specific endpoint from the OpenAPI spec
        const response = await server.api.get(`/agents/${agentId}`, { headers });
        const agentState = response.data; // Assuming response.data is the AgentState object

        // Map agentState to structuredContent matching output schema exactly
        const structuredContent = {
            id: agentState.id || '',
            name: agentState.name || '',
            description: agentState.description || '',
            created_at: agentState.created_at || '',
            model: agentState.model || agentState.llm_config?.model || '',
            embedding_model: agentState.embedding_model || agentState.embedding_config?.embedding_model || '',
            memory: agentState.memory || {},
            tools: agentState.tools || [],
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        agent: agentState,
                    }),
                },
            ],
            structuredContent: structuredContent,
        };
    } catch (error) {
        // Handle potential 404 if agent not found, or other API errors
        if (error.response && error.response.status === 404) {
            server.createErrorResponse(`Agent not found: ${args.agent_id}`);
        }
        server.createErrorResponse(error);
    }
}

/**
 * Tool definition for retrieve_agent
 */
export const retrieveAgentDefinition = {
    name: 'retrieve_agent',
    description:
        'Get the full state of a specific agent by ID. Similar to get_agent_summary but returns complete details. Use list_agents to find agent IDs.',
    inputSchema: {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string',
                description: 'The ID of the agent to retrieve',
            },
        },
        required: ['agent_id'],
    },
};
