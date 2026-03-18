"use client";

import Link from "next/link";
import { Copy, FlaskConical, Send } from "lucide-react";

import { LiveWriterBridgePanel } from "@/components/live-writer-bridge/live-writer-bridge-panel";
import { type LiveWriterTargetOption } from "@/components/live-writer-bridge/use-live-writer-targets";

export type LaboratoryBridgeGuideMode = "copy" | "send";

export type LaboratoryBridgeGuide = {
    badge: string;
    title: string;
    description: string;
    confirmLabel: string;
    steps: readonly string[];
    note: string;
};

export function LaboratoryBridgeCard({
    ready,
    exportState,
    guideMode,
    setGuideMode,
    guides,
    liveTargets,
    selectedLiveTargetId,
    onSelectTarget,
    onCopy,
    onSend,
    onPush,
}: {
    ready: boolean;
    exportState: "idle" | "copied" | "sent";
    guideMode: LaboratoryBridgeGuideMode | null;
    setGuideMode: (mode: LaboratoryBridgeGuideMode | null) => void;
    guides: Record<LaboratoryBridgeGuideMode, LaboratoryBridgeGuide>;
    liveTargets: LiveWriterTargetOption[];
    selectedLiveTargetId: string;
    onSelectTarget: (targetId: string) => void;
    onCopy: () => void | Promise<void>;
    onSend: () => void;
    onPush: () => void;
}) {
    return (
        <div className="site-panel p-4 lg:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Laboratory Export</div>
                    <h2 className="mt-1 font-serif text-2xl font-black">Writer Bridge</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Natijalarni markdown ko&apos;rinishida yoki live block orqali writer ichiga olib o&apos;ting.
                    </p>
                </div>
                <div className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {exportState === "copied" ? "Copied" : exportState === "sent" ? "Writer opened" : "Ready"}
                </div>
            </div>

            <div className="mt-4 grid gap-3">
                <button
                    type="button"
                    onClick={() => setGuideMode("copy")}
                    disabled={!ready}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold transition hover:border-foreground disabled:opacity-50"
                >
                    <Copy className="h-4 w-4" />
                    Markdown nusxa olish
                </button>
                <button
                    type="button"
                    onClick={() => setGuideMode("send")}
                    disabled={!ready}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                    Writer&apos;ga yuborish
                </button>
                <Link href="/write" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold transition hover:border-foreground">
                    <FlaskConical className="h-4 w-4" />
                    Writer katalogi
                </Link>
            </div>

            <div className="mt-3 rounded-[1.25rem] border border-border/70 bg-background/55 p-3 text-sm leading-6 text-muted-foreground">
                Hozirgi ko&apos;chirish oqimi uch xil: `Markdown nusxa olish`, `Writer&apos;ga yuborish`, va `Live Writer Bridge`.
            </div>

            {guideMode ? (
                <div className="mt-3 rounded-[1.5rem] border border-border bg-background/85 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="site-eyebrow">{guides[guideMode].badge}</div>
                            <h3 className="mt-1 font-serif text-xl font-black">{guides[guideMode].title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{guides[guideMode].description}</p>
                        </div>
                        <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            Step guide
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {guides[guideMode].steps.map((step, index) => (
                            <div key={step} className="flex gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 text-sm">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-black">
                                    {index + 1}
                                </div>
                                <div className="leading-6 text-muted-foreground">{step}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
                        {guides[guideMode].note}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setGuideMode(null)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-4 text-sm font-bold transition hover:border-foreground"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="button"
                            onClick={guideMode === "copy" ? onCopy : onSend}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90"
                        >
                            {guides[guideMode].confirmLabel}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mt-3">
                <LiveWriterBridgePanel
                    targets={liveTargets}
                    selectedTargetId={selectedLiveTargetId}
                    onSelectTarget={onSelectTarget}
                    onPush={onPush}
                    disabled={!ready || !selectedLiveTargetId}
                />
            </div>
        </div>
    );
}
