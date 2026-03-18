"use client";

import { Link2, Radio, SendHorizontal } from "lucide-react";

import { type WriterBridgeTarget } from "@/lib/live-writer-bridge";

export function LiveWriterBridgePanel({
    targets,
    selectedTargetId,
    onSelectTarget,
    onPush,
    disabled,
}: {
    targets: Array<WriterBridgeTarget & { writerId: string; documentTitle: string }>;
    selectedTargetId: string;
    onSelectTarget: (targetId: string) => void;
    onPush: () => void;
    disabled: boolean;
}) {
    return (
        <div className="rounded-[1.5rem] border border-border bg-background/85 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Live Writer Bridge</div>
                    <h3 className="mt-1 font-serif text-xl font-black">Open writer target&apos;lari</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Bir xil brauzer ichida ochiq writer bloklariga live update yuboring.
                    </p>
                </div>
                <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {targets.length} target
                </div>
            </div>

            {targets.length ? (
                <div className="mt-4 space-y-2">
                    {targets.map((target) => {
                        const active = target.id === selectedTargetId;
                        return (
                            <button
                                key={`${target.writerId}-${target.id}`}
                                type="button"
                                onClick={() => onSelectTarget(target.id)}
                                className={`w-full rounded-[1.25rem] border p-3 text-left transition ${active ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 hover:border-foreground/40"}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-black">{target.title}</div>
                                        <div className={`mt-1 truncate text-xs ${active ? "text-background/70" : "text-muted-foreground"}`}>
                                            {target.documentTitle}
                                        </div>
                                    </div>
                                    <div className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${active ? "border-background/20 bg-background/10 text-background" : "border-border text-muted-foreground"}`}>
                                        {target.status}
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
                        No active writer
                    </div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                        Writer ichida `Live Lab Block` qo&apos;shilgan bo&apos;lsa, u shu yerda avtomatik ko&apos;rinadi.
                    </div>
                </div>
            )}

            <div className="mt-4 rounded-[1.25rem] border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                1. Writer sahifasida `Live Lab Block` qo&apos;shing.
                <br />
                        2. Shu yerda target&apos;ni tanlang.
                <br />
                3. `Live push` bossangiz, natija o&apos;sha blok ichida darrov yangilanadi.
            </div>

            <button
                type="button"
                onClick={onPush}
                disabled={disabled}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
            >
                <SendHorizontal className="h-4 w-4" />
                Live push
            </button>

            <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                BroadcastChannel asosida ishlaydi, backend kerak emas.
            </div>
        </div>
    );
}
