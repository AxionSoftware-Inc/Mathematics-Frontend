"use client";

import React from "react";
import { fetchPublic } from "@/lib/api";

import { type LiveWriterTargetOption } from "@/components/live-writer-bridge/use-live-writer-targets";
import {
    createLaboratoryWriterDraftHref,
    findLiveWriterTargetBySelection,
    queueWriterImport,
    type WriterBridgeBlockData,
} from "@/lib/live-writer-bridge";

type WriterBridgeExportState = "idle" | "copied" | "sent";
type WriterBridgeGuideMode = "copy" | "send" | null;

type UseLaboratoryWriterBridgeOptions = {
    ready: boolean;
    sourceLabel: string;
    liveTargets: LiveWriterTargetOption[];
    selectedLiveTargetId: string;
    setExportState: React.Dispatch<React.SetStateAction<WriterBridgeExportState>>;
    setGuideMode?: React.Dispatch<React.SetStateAction<WriterBridgeGuideMode>>;
    buildMarkdown: () => string;
    buildBlock: (targetId: string) => WriterBridgeBlockData;
    getSavedResultMeta?: () => { id?: string | null; revision?: number | null } | null;
    getDraftMeta?: (block: WriterBridgeBlockData) => {
        title?: string;
        abstract?: string;
        keywords?: string;
    };
};

export function useLaboratoryWriterBridge(options: UseLaboratoryWriterBridgeOptions) {
    const {
        ready,
        sourceLabel,
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown,
        buildBlock,
        getSavedResultMeta,
        getDraftMeta,
    } = options;

    const closeGuide = React.useCallback(() => {
        setGuideMode?.(null);
    }, [setGuideMode]);

    const copyMarkdownExport = React.useCallback(async () => {
        if (!ready) {
            return;
        }

        await navigator.clipboard.writeText(buildMarkdown());
        setExportState("copied");
        closeGuide();
    }, [buildMarkdown, closeGuide, ready, setExportState]);

    const sendToWriter = React.useCallback(() => {
        if (!ready) {
            return;
        }

        const block = buildBlock(`${sourceLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`);
        const savedMeta = getSavedResultMeta?.();
        if (savedMeta?.id) {
            block.savedResultId = savedMeta.id;
            block.savedResultRevision = savedMeta.revision ?? undefined;
        }
        const draftMeta = getDraftMeta?.(block);
        const requestId = queueWriterImport({
            version: 1,
            markdown: buildMarkdown(),
            block,
            title: draftMeta?.title ?? block.title,
            abstract: draftMeta?.abstract,
            keywords: draftMeta?.keywords,
        });

        setExportState("sent");
        closeGuide();
        window.location.assign(createLaboratoryWriterDraftHref(requestId));
    }, [buildBlock, buildMarkdown, closeGuide, getDraftMeta, ready, setExportState, sourceLabel]);

    const pushLiveResult = React.useCallback(() => {
        const run = async () => {
            if (!ready) {
                return;
            }

            const target = findLiveWriterTargetBySelection(liveTargets, selectedLiveTargetId);
            if (!target || !target.paperId) {
                return;
            }

            const block = buildBlock(target.id);
            const savedMeta = getSavedResultMeta?.();
            block.savedResultId = savedMeta?.id ?? block.savedResultId ?? target.savedResultId;
            block.savedResultRevision = savedMeta?.revision ?? block.savedResultRevision ?? target.savedResultRevision;

            const response = await fetchPublic(`/api/builder/papers/${target.paperId}/live-sync/`, {
                method: "POST",
                body: JSON.stringify({
                    block_id: target.id,
                    block,
                    saved_result_id: block.savedResultId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Live sync failed with status ${response.status}`);
            }
            closeGuide();
        };

        void run().catch((error) => {
            console.error("Failed to push live laboratory result", error);
        });
    }, [buildBlock, closeGuide, getSavedResultMeta, liveTargets, ready, selectedLiveTargetId, sourceLabel]);

    return {
        copyMarkdownExport,
        sendToWriter,
        pushLiveResult,
    };
}
