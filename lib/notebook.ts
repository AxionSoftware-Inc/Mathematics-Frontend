import { fetchPublic } from "@/lib/api";

export type NotebookBlockKind =
    | "text"
    | "formula"
    | "solve"
    | "graph"
    | "table"
    | "python"
    | "theorem"
    | "exercise"
    | "answer"
    | "export"
    | "lab-result";

export type NotebookBlock = {
    id: string;
    kind: NotebookBlockKind;
    title: string;
    content: string;
    config?: Record<string, string>;
};

export type NotebookDocument = {
    id: string;
    title: string;
    summary: string;
    blocks: NotebookBlock[];
    metadata: Record<string, unknown>;
    revision: number;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
};

export type NotebookDocumentPayload = {
    title: string;
    summary: string;
    blocks: NotebookBlock[];
    metadata?: Record<string, unknown>;
    is_locked?: boolean;
};

function normalizeNotebook(payload: Record<string, unknown>): NotebookDocument | null {
    if (typeof payload.id !== "string" || typeof payload.title !== "string" || !Array.isArray(payload.blocks)) {
        return null;
    }
    return {
        id: payload.id,
        title: payload.title,
        summary: typeof payload.summary === "string" ? payload.summary : "",
        blocks: payload.blocks as NotebookBlock[],
        metadata: typeof payload.metadata === "object" && payload.metadata ? (payload.metadata as Record<string, unknown>) : {},
        revision: typeof payload.revision === "number" ? payload.revision : 1,
        is_locked: typeof payload.is_locked === "boolean" ? payload.is_locked : false,
        created_at: typeof payload.created_at === "string" ? payload.created_at : "",
        updated_at: typeof payload.updated_at === "string" ? payload.updated_at : "",
    };
}

async function parseApiError(response: Response) {
    try {
        const data = await response.json();
        return typeof data === "object" && data ? JSON.stringify(data) : `Request failed with status ${response.status}`;
    } catch {
        return `Request failed with status ${response.status}`;
    }
}

export async function fetchNotebookDocuments() {
    const response = await fetchPublic("/api/notebook/documents/?ordering=-updated_at");
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    return items
        .map((item: unknown) => normalizeNotebook(item as Record<string, unknown>))
        .filter((item: NotebookDocument | null): item is NotebookDocument => Boolean(item));
}

export async function createNotebookDocument(payload: NotebookDocumentPayload) {
    const response = await fetchPublic("/api/notebook/documents/", {
        method: "POST",
        body: JSON.stringify({
            ...payload,
            metadata: {
                schema_version: 1,
                document_standard: "mathsphere.computational_notebook",
                ...(payload.metadata || {}),
            },
        }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    const normalized = normalizeNotebook(await response.json());
    if (!normalized) throw new Error("Notebook response is malformed.");
    return normalized;
}

export async function updateNotebookDocument(id: string, payload: NotebookDocumentPayload) {
    const response = await fetchPublic(`/api/notebook/documents/${encodeURIComponent(id)}/`, {
        method: "PUT",
        body: JSON.stringify({
            ...payload,
            metadata: {
                schema_version: 1,
                document_standard: "mathsphere.computational_notebook",
                ...(payload.metadata || {}),
            },
        }),
    });
    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }
    const normalized = normalizeNotebook(await response.json());
    if (!normalized) throw new Error("Notebook response is malformed.");
    return normalized;
}
