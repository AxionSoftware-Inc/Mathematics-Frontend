// lib/api.ts is now client-safe (no next/headers)


const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const READ_TIMEOUT_MS = 8000;
const WRITE_TIMEOUT_MS = 60000;

type ApiFetchOptions = RequestInit & {
    timeoutMs?: number;
};

function buildHeaders(options: RequestInit, token?: string): Record<string, string> {
    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
    };

    // Robust check for FormData to avoid manual Content-Type when sending multipart data
    const isFormData = options.body instanceof FormData || 
                       (options.body && typeof (options.body as any).append === 'function');

    if (isFormData) {
        // multipart/form-data boundary will be set automatically by fetch
        delete headers["Content-Type"];
    } else if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

async function fetchWithTimeout(endpoint: string, options: ApiFetchOptions = {}, token?: string) {
    const controller = new AbortController();
    const method = (options.method || "GET").toUpperCase();
    const timeoutMs = options.timeoutMs ?? (method === "GET" ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const requestOptions: RequestInit = { ...options };
    const signal = requestOptions.signal;
    delete (requestOptions as ApiFetchOptions).timeoutMs;
    const headers = buildHeaders(requestOptions, token);

    try {
        let fullUrl = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
        
        // Fix potential double /api/ from env + endpoint concatenation
        fullUrl = fullUrl.replace("/api/api/", "/api/");

        // Append project filter for quantum-uz by default for GET requests
        if (method === "GET" && !fullUrl.includes("project=")) {
            const separator = fullUrl.includes("?") ? "&" : "?";
            fullUrl = `${fullUrl}${separator}project=quantum-uz`;
        }
        
        return await fetch(fullUrl, {
            ...requestOptions,
            headers,
            signal: signal ?? controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

// fetchWithAuth moved to api-server.ts to keep this file client-safe


export async function fetchPublic(endpoint: string, options: ApiFetchOptions = {}) {
    return fetchWithTimeout(endpoint, options);
}

/**
 * Helper to get the correct media URL, handling absolute URLs from the backend
 */
export function getMediaUrl(path: string | null | undefined): string {
    if (!path) return "";
    
    const s = String(path);
    const mediaIndex = s.indexOf("/media/");
    if (mediaIndex !== -1) {
        return s.substring(mediaIndex);
    }
    
    return s.startsWith("/") ? s : `/${s}`;
}
