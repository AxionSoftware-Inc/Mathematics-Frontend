"use client";

import { Link2, Radio, SendHorizontal } from "lucide-react";

import { type LiveWriterTargetOption } from "@/components/live-writer-bridge/use-live-writer-targets";
import { findLiveWriterTargetBySelection, getLiveWriterTargetSelectionId } from "@/lib/live-writer-bridge";

function formatTime(value: number | null) {
    if (!value) {
        return "--";
    }

    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveWriterBridgePanel({
    targets,
    selectedTargetId,
    onSelectTarget,
    onPush,
    disabled,
}: {
    targets: LiveWriterTargetOption[];
    selectedTargetId: string;
    onSelectTarget: (targetId: string) => void;
    onPush: () => void;
    disabled: boolean;
}) {
    const selectedTarget = findLiveWriterTargetBySelection(targets, selectedTargetId);
    const nextRevision = (selectedTarget?.lastRevision ?? 0) + 1;

    return (
        <div className="rounded-[1.5rem] border border-border bg-background/85 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Live Writer Bridge</div>
                    <h3 className="mt-1 font-serif text-xl font-black">Saved writer targets</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Laboratory natijani serverdagi writer hujjat block&apos;iga to&apos;g&apos;ridan-to&apos;g&apos;ri sync qiling.
                    </p>
                </div>
                <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {targets.length} target
                </div>
            </div>

            {targets.length ? (
                <div className="mt-4 space-y-2">
                    {targets.map((target) => {
                        const active = getLiveWriterTargetSelectionId(target) === selectedTargetId;
                        return (
                            <button
                                key={`${target.paperId}-${target.id}`}
                                type="button"
                                onClick={() => onSelectTarget(getLiveWriterTargetSelectionId(target))}
                                className={`w-full rounded-[1.25rem] border p-3 text-left transition ${
                                    active ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 hover:border-foreground/40"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-black">{target.title}</div>
                                        <div className={`mt-1 truncate text-xs ${active ? "text-background/70" : "text-muted-foreground"}`}>
                                            {target.paperTitle} · #{target.paperId}
                                        </div>
                                        <div className={`mt-1 truncate text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                                            {target.sectionPath || "Document root"}
                                        </div>
                                        <div className={`mt-1 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                                            rev {target.lastRevision ?? 0} | push {formatTime(target.lastPushedAt)} | ack {formatTime(target.lastAckAt)}
                                        </div>
                                    </div>
                                    <div
                                        className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                            active ? "border-background/20 bg-background/10 text-background" : "border-sky-500/30 bg-sky-500/10 text-sky-600"
                                        }`}
                                    >
                                        {target.savedResultId ? "linked" : "server"}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-4 rounded-[1.25rem] border border-dashed border-border bg-background/60 p-4">
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        <Radio className="h-3.5 w-3.5" />
                        No saved targets
                    </div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                        Writer hujjatini saqlang va ichiga `Live Lab Block` joylashtiring.
                    </div>
                </div>
            )}

            <div className="mt-4 rounded-[1.25rem] border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                1. Writer sahifasida `Live Lab Block` qo&apos;shing va hujjatni saqlang.
                <br />
                2. Laboratory ichida kerakli target&apos;ni tanlang.
                <br />
                3. `Live push` bosilganda server hujjat ichidagi block yangilanadi.
                <br />
                4. Writer keyinroq ochilsa ham yangi revision saqlangan bo&apos;ladi.
            </div>

            {selectedTarget ? (
                <div className="mt-4 rounded-[1.25rem] border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">Selected sync session</div>
                    <div className="mt-2">
                        Target: {selectedTarget.sectionPath || "Document root"}
                        <br />
                        Next push: rev {nextRevision}
                        <br />
                        Paper: {selectedTarget.paperTitle}
                        <br />
                        Last ack: {formatTime(selectedTarget.lastAckAt)}
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                onClick={onPush}
                disabled={disabled}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
            >
                <SendHorizontal className="h-4 w-4" />
                {selectedTarget ? `Live push rev ${nextRevision}` : "Live push"}
            </button>

            <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Server-backed sync ishlaydi, writer tab ochiq bo&apos;lishi shart emas.
            </div>
        </div>
    );
}
