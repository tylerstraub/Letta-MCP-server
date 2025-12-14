/**
 * Tool handler for listing all configured MCP servers on the Letta server
 */
export async function handleListMcpServers(server, _args) {
    try {
        const headers = server.getApiHeaders();

        // Use the specific endpoint from the OpenAPI spec
        const response = await server.api.get('/tools/mcp/servers', { headers });
        const serversData = response.data || {}; // Assuming response.data is an object mapping server names to configs

        // Convert object to array format matching output schema
        const serversArray = Object.entries(serversData).map(([name, config]) => ({
            name: name,
            url: config.url || '',
            transport: config.transport || 'http',
            status: config.status || 'connected',
        }));

        const responseData = {
            servers: serversArray,
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        server_count: serversArray.length,
                        servers: serversArray,
                    }),
                },
            ],
            structuredContent: responseData,
        };
    } catch (error) {
        server.createErrorResponse(error);
    }
}

/**
 * Tool definition for list_mcp_servers
 */
export const listMcpServersDefinition = {
    name: 'list_mcp_servers',
    description:
        'List all configured MCP servers on the Letta server. Use with list_mcp_tools_by_server to explore available tools from each server.',
    inputSchema: {
        type: 'object',
        properties: {}, // No input arguments needed
        required: [],
    },
};
