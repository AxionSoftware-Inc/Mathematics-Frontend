import { fetchPublic } from "@/lib/api";
import {
    LIVE_WRITER_EXPORT_VERSION,
    createWriterImportRequestId,
    type WriterBridgeBlockData,
    type WriterImportPayload,
} from "@/lib/live-writer-bridge";

export type SavedLaboratoryResult = {
    id: string;
    module_slug: string;
    module_title: string;
    mode: string;
    title: string;
    summary: string;
    report_markdown: string;
    input_snapshot: Record<string, unknown>;
    structured_payload: WriterBridgeBlockData;
    metadata: Record<string, unknown>;
    revision: number;
    created_at: string;
    updated_at: string;
};

export type CreateSavedLaboratoryResultPayload = {
    module_slug: string;
    module_title: string;
    mode: string;
    title: string;
    summary: string;
    report_markdown: string;
    input_snapshot: Record<string, unknown>;
    structured_payload: WriterBridgeBlockData;
    metadata?: Record<string, unknown>;
};

function normalizeSavedLaboratoryResult(payload: Record<string, unknown>): SavedLaboratoryResult | null {
    if (
        typeof payload.id !== "string" ||
        typeof payload.module_slug !== "string" ||
        typeof payload.module_title !== "string" ||
        typeof payload.title !== "string" ||
        typeof payload.report_markdown !== "string"
    ) {
        return null;
    }

    return {
        id: payload.id,
        module_slug: payload.module_slug,
        module_title: payload.module_title,
        mode: typeof payload.mode === "string" ? payload.mode : "",
        title: payload.title,
        summary: typeof payload.summary === "string" ? payload.summary : "",
        report_markdown: payload.report_markdown,
        input_snapshot:
            typeof payload.input_snapshot === "object" && payload.input_snapshot
                ? (payload.input_snapshot as Record<string, unknown>)
                : {},
        structured_payload:
            typeof payload.structured_payload === "object" && payload.structured_payload
                ? (payload.structured_payload as WriterBridgeBlockData)
                : ({
                      id: payload.id,
                      status: "ready",
                      moduleSlug: typeof payload.module_slug === "string" ? payload.module_slug : "laboratory",
                      kind: typeof payload.mode === "string" ? payload.mode : "report",
                      title: payload.title,
                      summary: typeof payload.summary === "string" ? payload.summary : "",
                      generatedAt: typeof payload.updated_at === "string" ? payload.updated_at : new Date().toISOString(),
                      metrics: [],
                  } satisfies WriterBridgeBlockData),
        metadata:
            typeof payload.metadata === "object" && payload.metadata ? (payload.metadata as Record<string, unknown>) : {},
        revision: typeof payload.revision === "number" ? payload.revision : 1,
        created_at: typeof payload.created_at === "string" ? payload.created_at : "",
        updated_at: typeof payload.updated_at === "string" ? payload.updated_at : "",
    };
}

async function parseApiError(response: Response) {
    try {
        const data = (await response.json()) as Record<string, unknown>;
        if (typeof data.detail === "string") {
            return data.detail;
        }
        if (typeof data.report_markdown === "string") {
            return data.report_markdown;
        }
        return JSON.stringify(data);
    } catch {
        return `Request failed with status ${response.status}`;
    }
}

export async function createSavedLaboratoryResult(payload: CreateSavedLaboratoryResultPayload) {
    const response = await fetchPublic("/api/laboratory/results/", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }

    const data = (await response.json()) as Record<string, unknown>;
    const normalized = normalizeSavedLaboratoryResult(data);
    if (!normalized) {
        throw new Error("Saved laboratory result response is malformed.");
    }

    return normalized;
}

export async function fetchSavedLaboratoryResults(params: { moduleSlug?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.moduleSlug) {
        query.set("module_slug", params.moduleSlug);
    }
    if (params.search) {
        query.set("search", params.search);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await fetchPublic(`/api/laboratory/results/${suffix}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((item) => normalizeSavedLaboratoryResult(item as Record<string, unknown>))
        .filter((item): item is SavedLaboratoryResult => Boolean(item));
}

export async function fetchSavedLaboratoryResult(id: string) {
    const response = await fetchPublic(`/api/laboratory/results/${encodeURIComponent(id)}/`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }

    const data = (await response.json()) as Record<string, unknown>;
    const normalized = normalizeSavedLaboratoryResult(data);
    if (!normalized) {
        throw new Error("Saved laboratory result response is malformed.");
    }

    return normalized;
}

export function createWriterImportPayloadFromSavedResult(result: SavedLaboratoryResult): WriterImportPayload {
    const block: WriterBridgeBlockData = {
        ...result.structured_payload,
        id: createWriterImportRequestId(),
        sync: undefined,
        generatedAt: result.updated_at || result.structured_payload.generatedAt,
        title: result.structured_payload.title || result.title,
        summary: result.structured_payload.summary || result.summary,
        moduleSlug: result.structured_payload.moduleSlug || result.module_slug,
        kind: result.structured_payload.kind || result.mode || "report",
        status: "ready",
    };

    return {
        version: LIVE_WRITER_EXPORT_VERSION,
        markdown: result.report_markdown,
        block,
        title: result.title,
        abstract: result.summary || `Imported from ${result.module_title}.`,
        keywords: `${result.module_slug},laboratory`,
    };
}
