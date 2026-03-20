"use client";

import React from "react";
import Link from "next/link";
import { Copy, ExternalLink, FlaskConical, Info, Loader2, Send } from "lucide-react";

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
    onSend: () => void | Promise<void>;
    onPush: () => void;
}) {
    const [pendingAction, setPendingAction] = React.useState<LaboratoryBridgeGuideMode | null>(null);
    const [actionError, setActionError] = React.useState("");

    const exportStatusLabel =
        exportState === "copied" ? "Copied" : exportState === "sent" ? "Draft opened" : ready ? "Ready" : "Waiting";

    async function runAction(mode: LaboratoryBridgeGuideMode, handler: () => void | Promise<void>) {
        if (!ready || pendingAction) {
            return;
        }

        setActionError("");
        setPendingAction(mode);

        try {
            await Promise.resolve(handler());
            setGuideMode(null);
        } catch (error) {
            console.error(`Laboratory bridge ${mode} action failed`, error);
            setActionError(mode === "copy" ? "Markdown nusxa olishda xatolik yuz berdi." : "Yangi draft ochishda xatolik yuz berdi.");
        } finally {
            setPendingAction(null);
        }
    }

    const actionCards = [
        {
            mode: "copy" as const,
            title: "Markdown nusxa olish",
            description: "Natijani clipboard'ga tayyor markdown formatida ko'chiradi.",
            status: exportState === "copied" ? "Copied" : "Manual insert",
            icon: Copy,
            tone:
                exportState === "copied"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-background/70 text-foreground",
            actionLabel: pendingAction === "copy" ? "Ko'chirilmoqda..." : "Nusxa olish",
            onAction: onCopy,
        },
        {
            mode: "send" as const,
            title: "Yangi draftga yuborish",
            description: "Laboratoriya natijasidan yangi writer draft ochadi.",
            status: exportState === "sent" ? "Draft opened" : "New draft",
            icon: Send,
            tone:
                exportState === "sent"
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : "border-border bg-background/70 text-foreground",
            actionLabel: pendingAction === "send" ? "Ochilmoqda..." : "Draft ochish",
            onAction: onSend,
        },
    ];

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
                    {exportStatusLabel}
                </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
                {actionCards.map((card) => {
                    const Icon = card.icon;
                    const isPending = pendingAction === card.mode;

                    return (
                        <div key={card.mode} className={`rounded-[1.5rem] border p-4 shadow-sm transition ${card.tone}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-current/15 bg-current/5">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-black">{card.title}</div>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                                    </div>
                                </div>
                                <div className="rounded-full border border-current/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                                    {card.status}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void runAction(card.mode, card.onAction)}
                                    disabled={!ready || Boolean(pendingAction)}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                                    {card.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGuideMode(guideMode === card.mode ? null : card.mode)}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold transition hover:border-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                    Qanday ishlaydi
                                </button>
                            </div>
                        </div>
                    );
                })}

                <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/75 text-foreground">
                            <FlaskConical className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-black">Writer katalogi</div>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Barcha draft va maqolalarni ko'rish, kerakli writer hujjatini ochish va target tayyorlash.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/write"
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background/85 px-4 text-sm font-bold transition hover:border-foreground"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Writer katalogini ochish
                    </Link>
                </div>
            </div>

            <div className="mt-3 rounded-[1.25rem] border border-border/70 bg-background/55 p-3 text-sm leading-6 text-muted-foreground">
                Hozirgi ko&apos;chirish oqimi uch xil: `Markdown nusxa olish`, `Yangi draftga yuborish`, va `Live Writer Bridge`.
            </div>

            {!ready ? (
                <div className="mt-3 rounded-[1.25rem] border border-amber-300/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
                    Avval laboratoriya natijasini hisoblab oling, keyin export tugmalari faol bo&apos;ladi.
                </div>
            ) : null}

            {actionError ? (
                <div className="mt-3 rounded-[1.25rem] border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-destructive">
                    {actionError}
                </div>
            ) : null}

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
                            onClick={() => void runAction(guideMode, guideMode === "copy" ? onCopy : onSend)}
                            disabled={!ready || Boolean(pendingAction)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90"
                        >
                            {pendingAction === guideMode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
