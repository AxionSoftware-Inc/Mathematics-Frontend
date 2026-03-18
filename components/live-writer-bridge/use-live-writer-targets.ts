"use client";

import React from "react";

import { createBroadcastChannel, type WriterTargetsBroadcast } from "@/lib/live-writer-bridge";

export type LiveWriterTargetOption = WriterTargetsBroadcast["targets"][number] & {
    writerId: string;
    documentTitle: string;
    lastSeen: number;
};

export function useLiveWriterTargets() {
    const [liveTargets, setLiveTargets] = React.useState<LiveWriterTargetOption[]>([]);
    const [selectedLiveTargetId, setSelectedLiveTargetId] = React.useState("");

    React.useEffect(() => {
        const channel = createBroadcastChannel();
        if (!channel) {
            return;
        }

        const handleMessage = (event: MessageEvent<WriterTargetsBroadcast>) => {
            const message = event.data;
            if (!message || message.type !== "writer-targets") {
                return;
            }

            setLiveTargets((current) => {
                const nextTargets = current.filter((entry) => entry.writerId !== message.writerId);
                message.targets.forEach((target) => {
                    nextTargets.push({
                        ...target,
                        writerId: message.writerId,
                        documentTitle: message.documentTitle,
                        lastSeen: Date.now(),
                    });
                });
                return nextTargets;
            });
        };

        channel.addEventListener("message", handleMessage as EventListener);
        const cleanupId = window.setInterval(() => {
            setLiveTargets((current) => current.filter((target) => Date.now() - target.lastSeen < 4000));
        }, 2000);

        return () => {
            channel.removeEventListener("message", handleMessage as EventListener);
            window.clearInterval(cleanupId);
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
    }, [liveTargets, selectedLiveTargetId]);

    return {
        liveTargets,
        selectedLiveTargetId,
        setSelectedLiveTargetId,
    };
}
