"use client";

import React from "react";
import { fetchPublic } from "@/lib/api";

import { LIVE_WRITER_SELECTED_TARGET_KEY, getLiveWriterTargetSelectionId } from "@/lib/live-writer-bridge";

export type LiveWriterTargetOption = {
    id: string;
    paperId: number;
    paperTitle: string;
    title: string;
    status: "waiting" | "ready";
    generatedAt?: string;
    revision?: number;
    savedResultId?: string;
    savedResultRevision?: number;
    lastPublishedAt?: string;
    lastAcknowledgedAt?: string;
    sourceLabel?: string | null;
    sectionLabel?: string | null;
    sectionPath?: string | null;
    connectionState: "server";
    syncState: "idle" | "server";
    lastRevision: number | null;
    lastPushedAt: number | null;
    lastAckAt: number | null;
};

function normalizeTargets(payload: unknown) {
    if (!Array.isArray(payload)) {
        return [] as LiveWriterTargetOption[];
    }

    const nextTargets: LiveWriterTargetOption[] = [];
    payload.forEach((item) => {
            const target = item as Record<string, unknown>;
            if (typeof target.id !== "string" || typeof target.paperId !== "number" || typeof target.paperTitle !== "string") {
                return;
            }

            nextTargets.push({
                id: target.id,
                paperId: target.paperId,
                paperTitle: target.paperTitle,
                title: typeof target.title === "string" ? target.title : "Laboratory block",
                status: target.status === "waiting" ? "waiting" : "ready",
                generatedAt: typeof target.generatedAt === "string" ? target.generatedAt : undefined,
                revision: typeof target.revision === "number" ? target.revision : undefined,
                savedResultId: typeof target.savedResultId === "string" ? target.savedResultId : undefined,
                savedResultRevision: typeof target.savedResultRevision === "number" ? target.savedResultRevision : undefined,
                lastPublishedAt: typeof target.lastPublishedAt === "string" ? target.lastPublishedAt : undefined,
                lastAcknowledgedAt: typeof target.lastAcknowledgedAt === "string" ? target.lastAcknowledgedAt : undefined,
                sourceLabel: typeof target.sourceLabel === "string" ? target.sourceLabel : null,
                sectionLabel: typeof target.sectionLabel === "string" ? target.sectionLabel : null,
                sectionPath: typeof target.sectionPath === "string" ? target.sectionPath : null,
                connectionState: "server" as const,
                syncState: "server" as const,
                lastRevision: typeof target.revision === "number" ? target.revision : null,
                lastPushedAt: typeof target.lastPublishedAt === "string" ? Date.parse(target.lastPublishedAt) : null,
                lastAckAt: typeof target.lastAcknowledgedAt === "string" ? Date.parse(target.lastAcknowledgedAt) : null,
            });
        });
    return nextTargets;
}

export function useLiveWriterTargets() {
    const [liveTargets, setLiveTargets] = React.useState<LiveWriterTargetOption[]>([]);
    const [selectedLiveTargetId, setSelectedLiveTargetIdState] = React.useState(() => {
        if (typeof window === "undefined") {
            return "";
        }

        return window.localStorage.getItem(LIVE_WRITER_SELECTED_TARGET_KEY) || "";
    });

    const setSelectedLiveTargetId = React.useCallback((targetId: string) => {
        setSelectedLiveTargetIdState(targetId);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(LIVE_WRITER_SELECTED_TARGET_KEY, targetId);
        }
    }, []);

    const refreshTargets = React.useCallback(async () => {
        try {
            const response = await fetchPublic("/api/builder/papers/live-targets/", { cache: "no-store" });
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            setLiveTargets(normalizeTargets(payload));
        } catch (error) {
            console.error("Failed to load writer live targets", error);
        }
    }, []);

    React.useEffect(() => {
        void refreshTargets();
        const refreshId = window.setInterval(() => {
            void refreshTargets();
        }, 15000);

        return () => {
            window.clearInterval(refreshId);
        };
    }, [refreshTargets]);

    React.useEffect(() => {
        if (!liveTargets.length) {
            if (selectedLiveTargetId) {
                setSelectedLiveTargetId("");
            }
            return;
        }

        const targetStillExists = liveTargets.some(
            (target) => getLiveWriterTargetSelectionId(target) === selectedLiveTargetId,
        );
        if (!targetStillExists) {
            setSelectedLiveTargetId(getLiveWriterTargetSelectionId(liveTargets[0]));
        }
    }, [liveTargets, selectedLiveTargetId, setSelectedLiveTargetId]);

    return {
        liveTargets,
        selectedLiveTargetId,
        setSelectedLiveTargetId,
        refreshTargets,
    };
}
