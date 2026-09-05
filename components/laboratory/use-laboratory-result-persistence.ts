"use client";

import React from "react";

import {
    createSavedLaboratoryResult,
    normalizeCreateSavedLaboratoryResultPayload,
    type CreateSavedLaboratoryResultPayload,
    type SavedLaboratoryResult,
} from "@/lib/laboratory-results";
import type { WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { createLocalScientificObject } from "@/lib/ecosystem/local-object-store";
import { resolveActiveProjectId } from "@/lib/ecosystem/project-context";

type SaveState = "idle" | "saving" | "saved" | "error";

type UseLaboratoryResultPersistenceOptions = {
    ready: boolean;
    moduleSlug: string;
    moduleTitle: string;
    mode: string;
    buildTitle: () => string;
    buildSummary: () => string;
    buildReportMarkdown: () => string;
    buildStructuredPayload: (targetId: string) => WriterBridgeBlockData;
    buildInputSnapshot: () => Record<string, unknown>;
    buildMetadata?: () => Record<string, unknown>;
};

async function saveProjectResultLocally(
    projectId: string,
    payload: CreateSavedLaboratoryResultPayload,
): Promise<SavedLaboratoryResult> {
    const normalized = normalizeCreateSavedLaboratoryResultPayload(payload);
    const savedAt = new Date().toISOString();

    const object = await createLocalScientificObject({
        projectId,
        kind: "calculation",
        domain: `mathematics/${normalized.module_slug}`,
        title: normalized.title,
        sourceApp: "math",
        payload: {
            type: "laboratory-result",
            module_slug: normalized.module_slug,
            module_title: normalized.module_title,
            mode: normalized.mode,
            title: normalized.title,
            summary: normalized.summary,
            report_markdown: normalized.report_markdown,
            input_snapshot: normalized.input_snapshot,
            structured_payload: normalized.structured_payload,
            metadata: normalized.metadata ?? {},
        },
        provenance: {
            sourceApp: "math",
            executionTarget: "this-device",
            inputs: normalized.input_snapshot,
            parameters: {
                module_slug: normalized.module_slug,
                mode: normalized.mode,
            },
            finishedAt: savedAt,
        },
        metadata: {
            module_slug: normalized.module_slug,
            module_title: normalized.module_title,
            mode: normalized.mode,
            storage: "local-project",
        },
    });

    return {
        id: object.id,
        module_slug: normalized.module_slug,
        module_title: normalized.module_title,
        mode: normalized.mode,
        title: normalized.title,
        summary: normalized.summary,
        report_markdown: normalized.report_markdown,
        input_snapshot: normalized.input_snapshot,
        structured_payload: normalized.structured_payload,
        metadata: {
            ...(normalized.metadata ?? {}),
            project_id: projectId,
            scientific_object_id: object.id,
            storage: "local-project",
        },
        revision: object.currentRevision,
        created_at: object.createdAt || savedAt,
        updated_at: object.updatedAt || savedAt,
    };
}

export function useLaboratoryResultPersistence(options: UseLaboratoryResultPersistenceOptions) {
    const {
        ready,
        moduleSlug,
        moduleTitle,
        mode,
        buildTitle,
        buildSummary,
        buildReportMarkdown,
        buildStructuredPayload,
        buildInputSnapshot,
        buildMetadata,
    } = options;

    const [saveState, setSaveState] = React.useState<SaveState>("idle");
    const [lastSavedResult, setLastSavedResult] = React.useState<SavedLaboratoryResult | null>(null);
    const [saveError, setSaveError] = React.useState<string | null>(null);

    const saveResult = React.useCallback(async () => {
        if (!ready) return null;

        setSaveState("saving");
        setSaveError(null);

        try {
            const payload: CreateSavedLaboratoryResultPayload = {
                module_slug: moduleSlug,
                module_title: moduleTitle,
                mode,
                title: buildTitle().trim() || `${moduleTitle} result`,
                summary: buildSummary().trim(),
                report_markdown: buildReportMarkdown(),
                input_snapshot: buildInputSnapshot(),
                structured_payload: buildStructuredPayload(`${moduleSlug}-${Date.now()}`),
                metadata: buildMetadata?.() ?? {},
            };

            const projectId = resolveActiveProjectId();
            const result = projectId
                ? await saveProjectResultLocally(projectId, payload)
                : await createSavedLaboratoryResult(payload);

            setLastSavedResult(result);
            setSaveState("saved");
            return result;
        } catch (error) {
            setSaveState("error");
            setSaveError(error instanceof Error ? error.message : "Failed to save laboratory result.");
            return null;
        }
    }, [
        buildInputSnapshot,
        buildMetadata,
        buildReportMarkdown,
        buildStructuredPayload,
        buildSummary,
        buildTitle,
        mode,
        moduleSlug,
        moduleTitle,
        ready,
    ]);

    React.useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!ready || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
            event.preventDefault();
            void saveResult();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [ready, saveResult]);

    return { saveResult, saveState, saveError, lastSavedResult };
}
