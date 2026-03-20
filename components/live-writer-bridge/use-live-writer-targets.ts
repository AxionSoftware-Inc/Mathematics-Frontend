"use client";

import React from "react";

import {
    LIVE_WRITER_SELECTED_TARGET_KEY,
    LIVE_WRITER_SYNC_EVENT,
    LIVE_WRITER_TARGET_TTL_MS,
    createBroadcastChannel,
    flattenStoredWriterTargets,
    markStoredWriterTargetAcknowledged,
    readStoredWriterTargetSyncs,
    type LabPublishAckBroadcast,
    type WriterTargetsBroadcast,
    type WriterTargetsRequest,
} from "@/lib/live-writer-bridge";

export type LiveWriterTargetOption = WriterTargetsBroadcast["targets"][number] & {
    writerId: string;
    documentTitle: string;
    lastSeen: number;
    connectionState: "online" | "stale";
    syncState: "idle" | "pending" | "acknowledged";
    lastRevision: number | null;
    lastPushedAt: number | null;
    lastAckAt: number | null;
    sourceLabel: string | null;
};

function mapStoredTargets() {
    const now = Date.now();
    const syncByTarget = new Map(
        readStoredWriterTargetSyncs().map((sync) => [`${sync.writerId}::${sync.targetId}`, sync] as const),
    );

    return flattenStoredWriterTargets(now).map((target) => ({
        ...target,
        connectionState: now - target.lastSeen < LIVE_WRITER_TARGET_TTL_MS / 2 ? "online" : "stale",
        syncState: syncByTarget.get(`${target.writerId}::${target.id}`)?.state ?? "idle",
        lastRevision: syncByTarget.get(`${target.writerId}::${target.id}`)?.revision ?? target.revision ?? null,
        lastPushedAt:
            syncByTarget.get(`${target.writerId}::${target.id}`)?.lastPushedAt ??
            (target.lastPublishedAt ? Date.parse(target.lastPublishedAt) : null),
        lastAckAt:
            syncByTarget.get(`${target.writerId}::${target.id}`)?.lastAckAt ??
            (target.lastAcknowledgedAt ? Date.parse(target.lastAcknowledgedAt) : null),
        sourceLabel: syncByTarget.get(`${target.writerId}::${target.id}`)?.sourceLabel ?? target.sourceLabel ?? null,
    })) as LiveWriterTargetOption[];
}

export function useLiveWriterTargets() {
    const [liveTargets, setLiveTargets] = React.useState<LiveWriterTargetOption[]>(() => mapStoredTargets());
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

    React.useEffect(() => {
        const channel = createBroadcastChannel();
        if (!channel) {
            return;
        }

        const refreshTargets = () => {
            setLiveTargets(mapStoredTargets());
        };

        const requestTargets = () => {
            const message: WriterTargetsRequest = { type: "writer-targets-request" };
            channel.postMessage(message);
        };

        const handleMessage = (event: MessageEvent<WriterTargetsBroadcast | LabPublishAckBroadcast>) => {
            const message = event.data;
            if (!message) {
                return;
            }

            if (message.type === "lab-publish-ack") {
                markStoredWriterTargetAcknowledged(message);
                refreshTargets();
                return;
            }

            if (message.type !== "writer-targets") {
                return;
            }

            refreshTargets();
        };

        const handleSyncChanged = () => {
            refreshTargets();
        };

        channel.addEventListener("message", handleMessage as EventListener);
        window.addEventListener(LIVE_WRITER_SYNC_EVENT, handleSyncChanged as EventListener);
        refreshTargets();
        requestTargets();

        const refreshId = window.setInterval(() => {
            refreshTargets();
            requestTargets();
        }, Math.floor(LIVE_WRITER_TARGET_TTL_MS / 4));

        return () => {
            channel.removeEventListener("message", handleMessage as EventListener);
            window.removeEventListener(LIVE_WRITER_SYNC_EVENT, handleSyncChanged as EventListener);
            window.clearInterval(refreshId);
            channel.close();
        };
    }, []);

    React.useEffect(() => {
        if (!liveTargets.length) {
            if (selectedLiveTargetId) {
                setSelectedLiveTargetId("");
            }
            return;
        }

        const targetStillExists = liveTargets.some((target) => target.id === selectedLiveTargetId);
        if (!targetStillExists) {
            setSelectedLiveTargetId(liveTargets[0].id);
        }
    }, [liveTargets, selectedLiveTargetId, setSelectedLiveTargetId]);

    return {
        liveTargets,
        selectedLiveTargetId,
        setSelectedLiveTargetId,
    };
}
