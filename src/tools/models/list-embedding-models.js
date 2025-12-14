/**
 * Tool handler for listing available embedding models
 */
export async function handleListEmbeddingModels(server, _args) {
    try {
        const headers = server.getApiHeaders();

        // Use the specific endpoint from the OpenAPI spec
        const response = await server.api.get('/models/embedding', { headers });
        // Handle different response structures: array directly or object with models property
        let models = response.data;
        if (!Array.isArray(models)) {
            // If response.data is an object, try to extract the array
            models = models?.models || models?.data || [];
        }
        if (!Array.isArray(models)) {
            throw new Error('Invalid response format: expected array of embedding models');
        }

        // Format models to match output schema
        const formattedModels = models.map((model) => ({
            name: model.name || model.id || '',
            provider: model.provider || '',
            dimensions: model.dimensions || 0,
        }));

        const responseData = {
            models: formattedModels,
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        model_count: formattedModels.length,
                        models: formattedModels,
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
 * Tool definition for list_embedding_models
 */
export const listEmbeddingModelsDefinition = {
    name: 'list_embedding_models',
    description:
        'List available embedding models configured on the Letta server. Use with create_agent or modify_agent to set agent embedding preferences.',
    inputSchema: {
        type: 'object',
        properties: {}, // No input arguments needed
        required: [],
    },
};
