import { fetchPublic } from "@/lib/api";

import type { PaperFormData } from "@/components/paper-editor-workspace";

export type WriterPaperRecord = {
    id: number;
    title: string;
    abstract: string;
    content: string;
    authors: string;
    keywords: string;
    document_kind: string;
    branding_enabled: boolean;
    branding_label: string;
    status: string;
    sections: PaperFormData["sections"];
    section_count?: number;
    created_at: string;
    updated_at: string;
};

async function parseApiError(response: Response) {
    try {
        const data = await response.json();
        if (typeof data?.detail === "string") {
            return data.detail;
        }
        return JSON.stringify(data);
    } catch {
        return `Request failed with status ${response.status}`;
    }
}

export async function fetchWriterPaper(id: string | number) {
    const response = await fetchPublic(`/api/builder/papers/${id}/`);
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    return (await response.json()) as WriterPaperRecord;
}

export async function createWriterPaper(payload: PaperFormData) {
    const response = await fetchPublic("/api/builder/papers/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    return (await response.json()) as WriterPaperRecord;
}

export async function updateWriterPaper(id: string | number, payload: PaperFormData) {
    const response = await fetchPublic(`/api/builder/papers/${id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    return (await response.json()) as WriterPaperRecord;
}

export async function deleteWriterPaper(id: string | number) {
    const response = await fetchPublic(`/api/builder/papers/${id}/`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
}
