function getBackendBaseUrl(): string {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return apiUrl.replace(/\/api$/, "");
}

/**
 * Helper to get the correct media URL, handling split frontend/backend deployments.
 * Extracted here to safely be used in Client components without importing next/headers.
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
