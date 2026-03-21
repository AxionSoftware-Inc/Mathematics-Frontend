"use client";

import React from "react";

import { type LiveWriterTargetOption } from "@/components/live-writer-bridge/use-live-writer-targets";
import {
    createLaboratoryWriterDraftHref,
    findLiveWriterTargetBySelection,
    publishToLiveWriterTarget,
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
        if (!ready) {
            return;
        }

        const target = findLiveWriterTargetBySelection(liveTargets, selectedLiveTargetId);
        if (!target) {
            return;
        }

        publishToLiveWriterTarget({
            writerId: target.writerId,
            targetId: target.id,
            sourceLabel,
            documentTitle: target.documentTitle,
            payload: buildBlock(target.id),
        });
        closeGuide();
    }, [buildBlock, closeGuide, liveTargets, ready, selectedLiveTargetId, sourceLabel]);

    return {
        copyMarkdownExport,
        sendToWriter,
        pushLiveResult,
    };
}
