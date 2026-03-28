"use client";

import React from "react";

import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { SERIES_LIMIT_PRESETS } from "@/components/laboratory/modules/series-limit-studio/constants";
import { useSeriesLimitStudio } from "@/components/laboratory/modules/series-limit-studio/use-series-limit-studio";
import { StudioHeaderBar } from "@/components/laboratory/modules/series-limit-studio/components/studio-header-bar";
import { StudioStatusBar } from "@/components/laboratory/modules/series-limit-studio/components/studio-status-bar";
import { SolveView } from "@/components/laboratory/modules/series-limit-studio/views/solve-view";
import { VisualizeView } from "@/components/laboratory/modules/series-limit-studio/views/visualize-view";
import { CompareView } from "@/components/laboratory/modules/series-limit-studio/views/compare-view";
import { ReportView } from "@/components/laboratory/modules/series-limit-studio/views/report-view";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import type { SeriesLimitStudioState } from "@/components/laboratory/modules/series-limit-studio/types";

function buildSeriesLimitReportMarkdown(state: SeriesLimitStudioState) {
    return `# Series / Limit Report

- mode: ${state.mode}
- expression: ${state.expression}
- auxiliary: ${state.auxiliaryExpression || "none"}
- dimension: ${state.dimension}
- family: ${state.summary.detectedFamily ?? "pending"}
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- convergence: ${state.summary.convergenceSignal ?? state.summary.radiusSignal ?? "pending"}
- proof signal: ${state.summary.proofSignal ?? "pending"}
- error bound: ${state.summary.errorBoundSignal ?? "pending"}
- method: ${state.analyticSolution?.exact.method_label ?? "client preview"}

## report notes
${state.reportNotes.map((note) => `- ${note}`).join("\n")}`;
}

function buildSeriesLimitLivePayload(state: SeriesLimitStudioState, targetId: string): WriterBridgeBlockData {
    const plotSeries = [
        state.result.lineSeries?.length ? { label: "Primary", color: "#2563eb", points: state.result.lineSeries } : null,
        state.result.secondaryLineSeries?.length ? { label: "Secondary", color: "#7c3aed", points: state.result.secondaryLineSeries } : null,
        state.result.tertiaryLineSeries?.length ? { label: "Envelope", color: "#059669", points: state.result.tertiaryLineSeries } : null,
    ].filter(Boolean) as WriterBridgeBlockData["plotSeries"];

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "series-limit-studio",
        kind: state.mode,
        title: `Series / limit report: ${state.mode}`,
        summary: state.analyticSolution?.exact.method_label ?? "Series / limit laboratory report export",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mode", value: state.mode },
            { label: "Family", value: state.summary.detectedFamily ?? "pending" },
            { label: "Result", value: state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending" },
            { label: "Risk", value: state.summary.riskSignal ?? "pending" },
        ],
        notes: state.reportNotes,
        plotSeries,
    };
}

export function SeriesLimitStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useSeriesLimitStudio(module);
    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const reportMarkdown = React.useMemo(() => buildSeriesLimitReportMarkdown(state), [state]);
    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(state.analyticSolution || state.result.finalFormula || state.summary.detectedFamily),
        sourceLabel: "Series Limit Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildSeriesLimitLivePayload(state, targetId),
        getDraftMeta: () => ({
            title: "Series / Limit Analysis",
            abstract: "Exported from Series Limit Studio.",
            keywords: `${state.mode},series,limit`,
        }),
    });

    const renderedTab = React.useMemo(() => {
        switch (state.activeTab) {
            case "solve":
                return <SolveView state={state} actions={actions} />;
            case "visualize":
                return <VisualizeView state={state} />;
            case "compare":
                return <CompareView state={state} />;
            case "report":
                return (
                    <ReportView
                        state={state}
                        copyMarkdownExport={copyMarkdownExport}
                        sendToWriter={sendToWriter}
                        pushLiveResult={pushLiveResult}
                        liveTargets={liveTargets.map((target) => ({ id: `${target.writerId}::${target.id}`, title: target.documentTitle }))}
                        selectedLiveTargetId={selectedLiveTargetId || null}
                        setSelectedLiveTargetId={setSelectedLiveTargetId}
                    />
                );
            default:
                return null;
        }
    }, [actions, copyMarkdownExport, liveTargets, pushLiveResult, selectedLiveTargetId, sendToWriter, setSelectedLiveTargetId, state]);

    return (
        <div className="flex grow flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/50">
            <StudioHeaderBar
                activeTab={state.activeTab}
                setActiveTab={actions.setActiveTab}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={state.experienceLevel}
                setExperienceLevel={actions.setExperienceLevel}
                presets={SERIES_LIMIT_PRESETS}
                activePresetLabel={state.activePresetLabel}
                applyPreset={actions.applyPreset}
            />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">{renderedTab}</div>
            </div>

            <StudioStatusBar solvePhase={state.solvePhase} isResultStale={state.isResultStale} mode={state.mode} />
        </div>
    );
}
