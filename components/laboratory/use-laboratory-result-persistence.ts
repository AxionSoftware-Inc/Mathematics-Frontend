"use client";

import React from "react";

import {
    createSavedLaboratoryResult,
    type SavedLaboratoryResult,
} from "@/lib/laboratory-results";
import type { WriterBridgeBlockData } from "@/lib/live-writer-bridge";

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
        if (!ready) {
            return null;
        }

        setSaveState("saving");
        setSaveError(null);

        try {
            const result = await createSavedLaboratoryResult({
                module_slug: moduleSlug,
                module_title: moduleTitle,
                mode,
                title: buildTitle().trim() || `${moduleTitle} result`,
                summary: buildSummary().trim(),
                report_markdown: buildReportMarkdown(),
                input_snapshot: buildInputSnapshot(),
                structured_payload: buildStructuredPayload(`${moduleSlug}-${Date.now()}`),
                metadata: buildMetadata?.() ?? {},
            });
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

    return {
        saveResult,
        saveState,
        saveError,
        lastSavedResult,
    };
}
