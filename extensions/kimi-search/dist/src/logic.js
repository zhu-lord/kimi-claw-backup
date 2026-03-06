"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSearch = executeSearch;
exports.executeFetch = executeFetch;
function ok(output, message = "", brief = "") {
    return {
        is_error: false,
        output,
        message,
        brief,
    };
}
function error(message, brief, output = "") {
    return {
        is_error: true,
        output,
        message,
        brief,
    };
}
function normalizeLimit(limit) {
    if (typeof limit !== "number" || Number.isNaN(limit)) {
        return 5;
    }
    const int = Math.floor(limit);
    return Math.max(1, Math.min(20, int));
}
function parseSearchResponse(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Response is not an object");
    }
    const root = data;
    if (!Array.isArray(root.search_results)) {
        throw new Error("search_results is missing");
    }
    return root.search_results.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`search_results[${index}] is invalid`);
        }
        const row = item;
        const required = ["site_name", "title", "url", "snippet"];
        for (const key of required) {
            if (typeof row[key] !== "string") {
                throw new Error(`${key} is missing in search_results[${index}]`);
            }
        }
        return {
            site_name: row.site_name,
            title: row.title,
            url: row.url,
            snippet: row.snippet,
            content: typeof row.content === "string" ? row.content : "",
            date: typeof row.date === "string" ? row.date : "",
            icon: typeof row.icon === "string" ? row.icon : "",
            mime: typeof row.mime === "string" ? row.mime : "",
        };
    });
}
async function executeSearch(params, ctx, fetchLike = fetch) {
    const baseUrl = (ctx.config.baseUrl ?? "").trim();
    const apiKey = (ctx.config.apiKey ?? "").trim();
    if (!baseUrl || !apiKey) {
        return error("Search service is not configured. You may want to try other methods to search.", "Search service not configured");
    }
    const timeoutSeconds = ctx.config.timeoutSeconds ?? 30;
    const timeoutMs = Math.max(1, timeoutSeconds) * 1000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetchLike(baseUrl, {
            method: "POST",
            headers: {
                "User-Agent": ctx.userAgent,
                Authorization: `Bearer ${apiKey}`,
                "X-Msh-Tool-Call-Id": ctx.toolCallId,
                ...(ctx.config.customHeaders ?? {}),
            },
            body: JSON.stringify({
                text_query: params.query,
                limit: normalizeLimit(params.limit),
                enable_page_crawling: Boolean(params.include_content),
                timeout_seconds: 30,
            }),
            signal: controller.signal,
        });
        if (response.status !== 200) {
            return error(`Failed to search. Status: ${response.status}. This may indicates that the search service is currently unavailable.`, "Failed to search");
        }
        try {
            const results = parseSearchResponse(await response.json());
            const chunks = [];
            for (let i = 0; i < results.length; i += 1) {
                const result = results[i];
                if (i > 0) {
                    chunks.push("---\n\n");
                }
                chunks.push(`Title: ${result.title}\nDate: ${result.date ?? ""}\nURL: ${result.url}\nSummary: ${result.snippet}\n\n`);
                if (result.content) {
                    chunks.push(`${result.content}\n\n`);
                }
            }
            return ok(chunks.join(""));
        }
        catch (e) {
            return error(`Failed to parse search results. Error: ${String(e)}. This may indicates that the search service is currently unavailable.`, "Failed to parse search results");
        }
    }
    finally {
        clearTimeout(timeout);
    }
}
async function fetchWithService(params, ctx, fetchLike) {
    const service = ctx.service;
    if (!service) {
        return error("Fetch service is not configured. You may want to try other methods to fetch.", "Fetch service not configured");
    }
    const baseUrl = (service.baseUrl ?? "").trim();
    const apiKey = (service.apiKey ?? "").trim();
    if (!baseUrl || !apiKey) {
        return error("Fetch service is not configured. You may want to try other methods to fetch.", "Fetch service not configured");
    }
    try {
        const response = await fetchLike(baseUrl, {
            method: "POST",
            headers: {
                "User-Agent": ctx.userAgent,
                Authorization: `Bearer ${apiKey}`,
                Accept: "text/markdown",
                "X-Msh-Tool-Call-Id": ctx.toolCallId,
                ...(service.customHeaders ?? {}),
            },
            body: JSON.stringify({ url: params.url }),
        });
        if (response.status !== 200) {
            return error(`Failed to fetch URL via service. Status: ${response.status}.`, "Failed to fetch URL via fetch service");
        }
        return ok(await response.text(), "The returned content is the main content extracted from the page.");
    }
    catch (e) {
        return error(`Failed to fetch URL via service due to network error: ${String(e)}. This may indicate the service is unreachable.`, "Network error when calling fetch service");
    }
}
function decodeHtmlEntities(input) {
    return input
        .replaceAll("&nbsp;", " ")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replaceAll(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}
function extractMeaningfulText(html) {
    const stripped = html
        .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, " ")
        .replaceAll(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, " ")
        .replaceAll(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gis, " ")
        .replaceAll(/<!--([\s\S]*?)-->/g, " ")
        .replaceAll(/<\/?(h[1-6]|p|div|article|section|li|tr|td|th|ul|ol|br)\b[^>]*>/gi, "\n")
        .replaceAll(/<[^>]+>/g, " ");
    const decoded = decodeHtmlEntities(stripped)
        .replaceAll(/\r\n?/g, "\n")
        .replaceAll(/\t/g, " ")
        .replaceAll(/[ \u00A0]+/g, " ")
        .replaceAll(/\n{3,}/g, "\n\n")
        .trim();
    return decoded;
}
async function fetchWithHttpGet(params, fetchLike) {
    let response;
    let respText;
    try {
        response = await fetchLike(params.url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });
        if (response.status >= 400) {
            return error(`Failed to fetch URL. Status: ${response.status}. This may indicate the page is not accessible or the server is down.`, `HTTP ${response.status} error`);
        }
        respText = await response.text();
        const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
        if (contentType.startsWith("text/plain") || contentType.startsWith("text/markdown")) {
            return ok(respText, "The returned content is the full content of the page.");
        }
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return error(`Failed to fetch URL due to network error: ${message}. This may indicate the URL is invalid or the server is unreachable.`, "Network error");
    }
    if (!respText) {
        return ok("", "The response body is empty.", "Empty response body");
    }
    const extractedText = extractMeaningfulText(respText);
    if (!extractedText) {
        return error("Failed to extract meaningful content from the page. This may indicate the page content is not suitable for text extraction, or the page requires JavaScript to render its content.", "No content extracted");
    }
    return ok(extractedText, "The returned content is the main text content extracted from the page.");
}
async function executeFetch(params, ctx, fetchLike = fetch) {
    if (ctx.service) {
        const serviceRet = await fetchWithService(params, ctx, fetchLike);
        if (!serviceRet.is_error) {
            return serviceRet;
        }
    }
    return fetchWithHttpGet(params, fetchLike);
}
//# sourceMappingURL=logic.js.map