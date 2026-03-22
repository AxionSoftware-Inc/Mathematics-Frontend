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

function getBackendBaseUrl(): string {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return apiUrl.replace(/\/api$/, "");
}

/**
 * Helper to get the correct media URL for deployments where frontend and backend use different ports.
 */
export function getMediaUrl(path: string | null | undefined): string {
    if (!path) return "";

    const s = String(path).trim();
    if (!s) return "";

    if (/^https?:\/\//i.test(s)) {
        return s;
    }

    const backendBaseUrl = getBackendBaseUrl();
    const mediaIndex = s.indexOf("/media/");

    if (mediaIndex !== -1) {
        return `${backendBaseUrl}${s.substring(mediaIndex)}`;
    }

    if (s.startsWith("/")) {
        return `${backendBaseUrl}${s}`;
    }

    return `${backendBaseUrl}/${s.replace(/^\/+/, "")}`;
}
