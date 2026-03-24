import React from "react";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";

import { AnnotationPanel } from "../components/annotation-panel";
import { StudioMetricCard } from "../presentation-types";

type LiveTarget = {
    id: string;
    title: string;
};

type ReportViewProps = {
    reportExecutiveCards: StudioMetricCard[];
    reportSupportCards: StudioMetricCard[];
    reportSkeletonMarkdown: string;
    copyMarkdownExport: () => void;
    sendToWriter: () => void;
    reportReadinessCards: StudioMetricCard[];
    annotationPanelProps: React.ComponentProps<typeof AnnotationPanel>;
    liveTargets: LiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    pushLiveResult: () => void;
};

export function ReportView({
    reportExecutiveCards,
    reportSupportCards,
    reportSkeletonMarkdown,
    copyMarkdownExport,
    sendToWriter,
    reportReadinessCards,
    annotationPanelProps,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    pushLiveResult,
}: ReportViewProps) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
                {reportExecutiveCards.map((card) => (
                    <LaboratoryMetricCard key={`report-exec-${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-8">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Export Packet</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {reportSupportCards.map((card) => (
                                <LaboratoryMetricCard key={card.eyebrow} {...card} />
                            ))}
                        </div>
                    </div>
                    <LaboratoryMathPanel eyebrow="Report Builder" title="Research Markdown Skeleton" content={reportSkeletonMarkdown} accentClassName="text-amber-600" />
                    <div className="flex flex-wrap gap-4">
                        <button onClick={copyMarkdownExport} className="site-btn px-6">Copy Report</button>
                        <button onClick={sendToWriter} className="site-btn-accent px-6">Send to Writer</button>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Report Readiness</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {reportReadinessCards.map((card) => (
                                <LaboratoryMetricCard key={`readiness-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <AnnotationPanel {...annotationPanelProps} />
                    <div className="site-panel space-y-4 p-6">
                        <div className="site-eyebrow text-accent">Live Bridge</div>
                        <div className="flex flex-wrap gap-3">
                            {liveTargets.map((target) => (
                                <button
                                    key={target.id}
                                    onClick={() => setSelectedLiveTargetId(target.id)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${selectedLiveTargetId === target.id ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}
                                >
                                    {target.title}
                                </button>
                            ))}
                            <button onClick={pushLiveResult} className="site-btn flex items-center gap-2">Push Live</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
