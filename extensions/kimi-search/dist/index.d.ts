type PluginApi = {
    pluginConfig: unknown;
    logger: {
        warn: (message: string) => void;
    };
    registerTool: (tool: {
        name: string;
        label?: string;
        description: string;
        parameters: Record<string, unknown>;
        execute: (toolCallId: string, params: unknown) => Promise<{
            content: Array<{
                type: "text";
                text: string;
            }>;
            details: unknown;
        }>;
    }) => void;
};
type PluginConfig = {
    userAgent: string;
    apiKey: string;
    commonHeaders: Record<string, string>;
    search: {
        baseUrl: string;
        timeoutSeconds: number;
        customHeaders: Record<string, string>;
    };
    fetch: {
        baseUrl: string;
        customHeaders: Record<string, string>;
        enableService: boolean;
    };
};
declare function parseConfig(value: unknown): PluginConfig;
declare const plugin: {
    id: string;
    name: string;
    description: string;
    configSchema: {
        parse: typeof parseConfig;
        uiHints: {
            userAgent: {
                label: string;
                advanced: boolean;
            };
            commonHeaders: {
                label: string;
                advanced: boolean;
            };
            "search.baseUrl": {
                label: string;
            };
            "search.timeoutSeconds": {
                label: string;
                advanced: boolean;
            };
            "fetch.baseUrl": {
                label: string;
            };
            "fetch.enableService": {
                label: string;
            };
        };
    };
    register(api: PluginApi): void;
};
export default plugin;
//# sourceMappingURL=index.d.ts.map