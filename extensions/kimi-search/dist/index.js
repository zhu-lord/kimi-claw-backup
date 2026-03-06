"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const logic_js_1 = require("./src/logic.js");
const DEFAULT_SEARCH_URL = "https://api.kimi.com/coding/v1/search";
const DEFAULT_FETCH_URL = "https://api.kimi.com/coding/v1/fetch";
function getApiKeyFromConfigFile() {
    try {
        const configPath = (0, path_1.join)((0, os_1.homedir)(), ".kimi", "kimi-claw", "kimi-claw-config.json");
        const content = (0, fs_1.readFileSync)(configPath, "utf-8");
        const config = JSON.parse(content);
        const apiKey = config.bridge?.kimiPluginAPIKey;
        return typeof apiKey === "string" ? apiKey : undefined;
    }
    catch {
        return undefined;
    }
}
function parseStringMap(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (typeof v === "string") {
            out[k] = v;
        }
    }
    return out;
}
function defaultMshHeaders() {
    return {
        "X-Msh-Platform": process.env.KIMI_MSH_PLATFORM?.trim() || "kimi_cli",
        "X-Msh-Version": process.env.KIMI_MSH_VERSION?.trim() || "test",
        "X-Msh-Device-Name": process.env.KIMI_MSH_DEVICE_NAME?.trim() || "openclaw-kimi-search-plugin",
        "X-Msh-Device-Model": process.env.KIMI_MSH_DEVICE_MODEL?.trim() || "openclaw-kimi-search-plugin",
        "X-Msh-Os-Version": process.env.KIMI_MSH_OS_VERSION?.trim() || process.platform,
        "X-Msh-Device-Id": process.env.KIMI_MSH_DEVICE_ID?.trim() || "openclaw-kimi-search-plugin",
    };
}
function parseConfig(value) {
    const root = value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    const search = root.search && typeof root.search === "object" && !Array.isArray(root.search)
        ? root.search
        : {};
    const fetch = root.fetch && typeof root.fetch === "object" && !Array.isArray(root.fetch)
        ? root.fetch
        : {};
    const commonHeaders = {
        ...defaultMshHeaders(),
        ...parseStringMap(root.commonHeaders),
    };
    return {
        userAgent: typeof root.userAgent === "string" && root.userAgent.trim()
            ? root.userAgent.trim()
            : (process.env.KIMI_AGENT_USER_AGENT?.trim() || "KimiCLI/OpenClawKimiSearchPlugin"),
        apiKey: process.env.KIMI_PLUGIN_API_KEY?.trim() || getApiKeyFromConfigFile()?.trim() || "",
        commonHeaders,
        search: {
            baseUrl: typeof search.baseUrl === "string" && search.baseUrl.trim()
                ? search.baseUrl.trim()
                : DEFAULT_SEARCH_URL,
            timeoutSeconds: typeof search.timeoutSeconds === "number" && Number.isFinite(search.timeoutSeconds)
                ? Math.max(1, Math.floor(search.timeoutSeconds))
                : 30,
            customHeaders: parseStringMap(search.customHeaders),
        },
        fetch: {
            baseUrl: typeof fetch.baseUrl === "string" && fetch.baseUrl.trim()
                ? fetch.baseUrl.trim()
                : DEFAULT_FETCH_URL,
            customHeaders: parseStringMap(fetch.customHeaders),
            enableService: typeof fetch.enableService === "boolean" ? fetch.enableService : true,
        },
    };
}
function toToolResponse(result) {
    const text = result.output || result.message || (result.is_error ? "Tool execution failed." : "");
    return {
        content: [{ type: "text", text }],
        details: {
            is_error: result.is_error,
            message: result.message,
            brief: result.brief,
            output: result.output,
        },
    };
}
const searchParameters = {
    type: "object",
    additionalProperties: false,
    properties: {
        query: {
            type: "string",
            description: "The query text to search for.",
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            default: 5,
            description: "The number of results to return. Typically you do not need to set this value.",
        },
        include_content: {
            type: "boolean",
            default: false,
            description: "Whether to include page content in results. This can consume many tokens.",
        },
    },
    required: ["query"],
};
const fetchParameters = {
    type: "object",
    additionalProperties: false,
    properties: {
        url: {
            type: "string",
            description: "The URL to fetch content from.",
        },
    },
    required: ["url"],
};
const plugin = {
    id: "kimi-search",
    name: "Kimi Search",
    description: "Combined KimiCode search and fetch tools for OpenClaw.",
    configSchema: {
        parse: parseConfig,
        uiHints: {
            userAgent: { label: "User Agent", advanced: true },
            commonHeaders: { label: "Common Headers", advanced: true },
            "search.baseUrl": { label: "Search URL" },
            "search.timeoutSeconds": { label: "Search Timeout (s)", advanced: true },
            "fetch.baseUrl": { label: "Fetch URL" },
            "fetch.enableService": { label: "Enable Fetch Service" },
        },
    },
    register(api) {
        const config = parseConfig(api.pluginConfig);
        api.registerTool({
            name: "kimi_search",
            label: "Kimi Search",
            description: "Search the internet for latest information (news, docs, releases, blogs, papers).",
            parameters: searchParameters,
            async execute(toolCallId, params) {
                const typed = (params ?? {});
                const ctx = {
                    toolCallId,
                    userAgent: config.userAgent,
                    config: {
                        baseUrl: config.search.baseUrl,
                        apiKey: config.apiKey,
                        timeoutSeconds: config.search.timeoutSeconds,
                        customHeaders: {
                            ...config.commonHeaders,
                            ...config.search.customHeaders,
                        },
                    },
                };
                const result = await (0, logic_js_1.executeSearch)(typed, ctx);
                return toToolResponse(result);
            },
        });
        api.registerTool({
            name: "kimi_fetch",
            label: "Kimi Fetch",
            description: "Fetch a URL and extract main text content from the page.",
            parameters: fetchParameters,
            async execute(toolCallId, params) {
                const typed = (params ?? {});
                const ctx = {
                    toolCallId,
                    userAgent: config.userAgent,
                    service: config.fetch.enableService
                        ? {
                            baseUrl: config.fetch.baseUrl,
                            apiKey: config.apiKey,
                            customHeaders: {
                                ...config.commonHeaders,
                                ...config.fetch.customHeaders,
                            },
                        }
                        : undefined,
                };
                const result = await (0, logic_js_1.executeFetch)(typed, ctx);
                return toToolResponse(result);
            },
        });
        if (!config.apiKey) {
            api.logger.warn("[kimi-search] API key is missing. Set KIMI_CODE_API_KEY.");
        }
    },
};
exports.default = plugin;
//# sourceMappingURL=index.js.map