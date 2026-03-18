import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

/**
 * Server-only helper to fetch data with Auth cookies
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_access_token")?.value;

    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const fullUrl = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    
    return fetch(fullUrl, {
        ...options,
        headers,
    });
}
