import React from "react";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import {
    LAB_PUBLICATION_PROFILE_DESCRIPTIONS,
    LAB_PUBLICATION_PROFILE_LABELS,
} from "@/lib/laboratory-publication-profile";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";

type ReportMetricCard = React.ComponentProps<typeof LaboratoryMetricCard>;

type ReportLiveTarget = {
    id: string;
    title: string;
};

export function LaboratoryReportLayout({
    executiveCards,
    supportCards,
    readinessCards,
    reportMarkdown,
    publicationProfile,
    setPublicationProfile,
    copyMarkdownExport,
    saveResult,
    saveState = "idle",
    saveError = null,
    lastSavedResultTitle,
    sendToWriter,
    pushLiveResult,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    annotationNode,
    summaryNode,
    reportTitle = "Research Markdown Skeleton",
}: {
    executiveCards: ReportMetricCard[];
    supportCards: ReportMetricCard[];
    readinessCards: ReportMetricCard[];
    reportMarkdown: string;
    publicationProfile: WriterBridgePublicationProfile;
    setPublicationProfile: (profile: WriterBridgePublicationProfile) => void;
    copyMarkdownExport: () => void;
    saveResult?: () => void | Promise<unknown>;
    saveState?: "idle" | "saving" | "saved" | "error";
    saveError?: string | null;
    lastSavedResultTitle?: string | null;
    sendToWriter: () => void;
    pushLiveResult: () => void;
    liveTargets: ReportLiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    annotationNode?: React.ReactNode;
    summaryNode?: React.ReactNode;
    reportTitle?: string;
}) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
                {executiveCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${card.detail}`} {...card} />
                ))}
            </div>

            {summaryNode}

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-8">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Export Packet</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {(Object.keys(LAB_PUBLICATION_PROFILE_LABELS) as WriterBridgePublicationProfile[]).map((profile) => (
                                <button
                                    key={profile}
                                    type="button"
                                    onClick={() => setPublicationProfile(profile)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                                        publicationProfile === profile
                                            ? "border-accent/35 bg-[var(--accent-soft)]"
                                            : "border-border/60 bg-background hover:border-accent/20"
                                    }`}
                                >
                                    <div className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
                                        {LAB_PUBLICATION_PROFILE_LABELS[profile]}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {LAB_PUBLICATION_PROFILE_DESCRIPTIONS[profile]}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {supportCards.map((card) => (
                                <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${card.detail}`} {...card} />
                            ))}
                        </div>
                    </div>

                    <LaboratoryMathPanel
                        eyebrow="Report Builder"
                        title={reportTitle}
                        content={reportMarkdown}
                        accentClassName="text-amber-600"
                    />

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => void saveResult?.()}
                            className="site-btn-accent px-6"
                            disabled={!saveResult || saveState === "saving"}
                        >
                            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved to Laboratory" : "Save Result"}
                        </button>
                        <button onClick={copyMarkdownExport} className="site-btn px-6">
                            Copy Report
                        </button>
                        <button onClick={sendToWriter} className="site-btn-accent px-6">
                            Send to Writer
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Active publication profile: <span className="font-semibold text-foreground">{LAB_PUBLICATION_PROFILE_LABELS[publicationProfile]}</span>.
                    </div>
                    {saveState === "saved" && lastSavedResultTitle ? (
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Saved asset: {lastSavedResultTitle}
                        </div>
                    ) : null}
                    {saveState === "error" && saveError ? (
                        <div className="text-sm font-medium text-rose-700 dark:text-rose-300">{saveError}</div>
                    ) : null}
                </div>

                <div className="space-y-8">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Report Readiness</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {readinessCards.map((card) => (
                                <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${card.detail}`} {...card} />
                            ))}
                        </div>
                    </div>

                    {annotationNode}

                    <div className="site-panel space-y-4 p-6">
                        <div className="site-eyebrow text-accent">Live Bridge</div>
                        <div className="flex flex-wrap gap-3">
                            {liveTargets.length ? (
                                liveTargets.map((target) => (
                                    <button
                                        key={target.id}
                                        onClick={() => setSelectedLiveTargetId(target.id)}
                                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                            selectedLiveTargetId === target.id ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {target.title}
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                                    Writer document topilmadi
                                </div>
                            )}

                            <button onClick={pushLiveResult} className="site-btn flex items-center gap-2" disabled={!liveTargets.length}>
                                Push Live
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
