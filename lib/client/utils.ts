/**
 * Helper to get the correct media URL, handling absolute URLs from the backend.
 * Extracted here to safely be used in Client components without importing next/headers.
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
