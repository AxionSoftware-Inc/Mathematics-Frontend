import React from "react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { useDifferentialStudio } from "./differential-studio/use-differential-studio";
import { DIFFERENTIAL_PRESETS } from "./differential-studio/constants";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";

// Local Components
import { StudioHeaderBar } from "./differential-studio/components/studio-header-bar";
import { StudioStatusBar } from "./differential-studio/components/studio-status-bar";
import { CompareView } from "./differential-studio/views/compare-view";
import { ReportView } from "./differential-studio/views/report-view";
import { SolveView } from "./differential-studio/views/solve-view";
import { VisualizeView } from "./differential-studio/views/visualize-view";
import type { DifferentialComputationSummary } from "./differential-studio/types";

function buildDifferentialReportMarkdown(state: ReturnType<typeof useDifferentialStudio>["state"]) {
    return `# Differential Report

- mode: ${state.mode}
- expression: ${state.expression}
- variable: ${state.variable}
- point: ${state.point}
- method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}
- continuity: ${state.analyticSolution?.diagnostics?.continuity ?? "pending"}
- differentiability: ${state.analyticSolution?.diagnostics?.differentiability ?? "pending"}
- trust score: ${state.reportExecutiveCards?.[2]?.value ?? "pending"}

## core signals
- classification: ${state.classification.label}
- result: ${describeDifferentialResult(state.summary) ?? state.analyticSolution?.exact.numeric_approximation ?? "pending"}
- taxonomy: ${state.analyticSolution?.diagnostics?.taxonomy?.family ?? "pending"}
- blockers: ${(state.analyticSolution?.diagnostics?.domain_analysis?.blockers ?? []).join(" | ") || "none"}`;
}

function describeDifferentialResult(summary: DifferentialComputationSummary | null) {
    if (!summary) return null;
    if ("matrix" in summary) return `${summary.type} ${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`;
    if (summary.type === "gradient") return `|grad|=${summary.magnitude.toFixed(6)}`;
    if (summary.type === "directional") return `${summary.directionalDerivative.toFixed(6)}`;
    if (summary.type === "higher_order") return `order ${summary.maxOrder}`;
    if ("partialAtPoint" in summary) return `${summary.partialAtPoint.toFixed(6)}`;
    if ("derivativeAtPoint" in summary) return `${summary.derivativeAtPoint.toFixed(6)}`;
    return null;
}

function buildDifferentialLivePayload(state: ReturnType<typeof useDifferentialStudio>["state"], targetId: string): WriterBridgeBlockData {
    const matrixTables =
        state.summary && "matrix" in state.summary
            ? [{ label: state.summary.type, matrix: state.summary.matrix }]
            : undefined;
    const plotSeries =
        state.summary && "samples" in state.summary && Array.isArray(state.summary.samples)
            ? [{ label: "Samples", color: "#2563eb", points: state.summary.samples }]
            : undefined;

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "differential-studio",
        kind: state.mode,
        title: `Differential report: ${state.mode}`,
        summary: state.analyticSolution?.exact.method_label ?? state.classification.label,
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mode", value: state.mode },
            { label: "Variable", value: state.variable },
            { label: "Point", value: state.point },
            { label: "Result", value: describeDifferentialResult(state.summary) ?? state.analyticSolution?.exact.numeric_approximation ?? "pending" },
        ],
        notes: [
            state.classification.summary,
            ...(state.analyticSolution?.diagnostics?.domain_analysis?.blockers ?? []),
            ...(state.analyticSolution?.parser?.notes ?? []),
        ],
        matrixTables,
        plotSeries,
    };
}

export function DifferentialStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useDifferentialStudio(module);
    const {
        experienceLevel,
        activeTab,
        solvePhase,
        solveErrorMessage,
        error,
        isResultStale,
    } = state;

    const {
        setExperienceLevel,
        setActiveTab,
    } = actions;

    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(DIFFERENTIAL_PRESETS[0]?.label);
    const [, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const reportMarkdown = React.useMemo(() => buildDifferentialReportMarkdown(state), [state]);
    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean((state.summary || state.analyticSolution) && !(state.error || state.solveErrorMessage)),
        sourceLabel: "Differential Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildDifferentialLivePayload(state, targetId),
        getDraftMeta: () => ({
            title: "Differential Analysis",
            abstract: "Exported from Differential Studio.",
            keywords: `${state.mode},differential`,
        }),
    });

    const applyPreset = (preset: any) => {
        actions.setMode(preset.mode);
        actions.setExpression(preset.expr);
        actions.setVariable(preset.variable ?? "");
        actions.setPoint(preset.point ?? "");
        actions.setOrder(preset.order ?? "1");
        actions.setDirection(preset.direction ?? "");
        setActivePresetLabel(preset.label);
    };

    const warningSignals = React.useMemo(() => {
        const signals: any[] = [];
        if (error || solveErrorMessage) {
            signals.push({ tone: "warn", label: "Solver Alert", text: error || solveErrorMessage });
        }
        return signals;
    }, [error, solveErrorMessage]);

    const visibleSignals = React.useMemo(() => [...warningSignals], [warningSignals]);

    // Keep this file as a thin orchestration shell.
    // Future work should stay inside tab views/services so new differential lanes
    // can be added without turning the module entrypoint into another monolith.
    const renderedTab = React.useMemo(() => {
        switch (activeTab) {
            case "solve":
                return (
                    <SolveView
                        state={state}
                        actions={actions}
                        visibleSignals={visibleSignals}
                    />
                );
            case "visualize":
                return (
                    <VisualizeView
                        state={state}
                    />
                );
            case "compare":
                return (
                    <CompareView
                        state={state}
                    />
                );
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
    }, [activeTab, actions, copyMarkdownExport, liveTargets, pushLiveResult, selectedLiveTargetId, sendToWriter, setSelectedLiveTargetId, state, visibleSignals]);

    return (
        <div className="flex grow flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/50">
            <StudioHeaderBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                availableTabs={["solve", "visualize", "compare", "report"]}
                tabs={[
                    { id: "solve", label: "Solve" },
                    { id: "visualize", label: "Visualize" },
                    { id: "compare", label: "Compare" },
                    { id: "report", label: "Report" },
                ]}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                workflowTemplates={[]}
                activeTemplateId={activeTemplateId}
                applyWorkflowTemplate={setActiveTemplateId}
                presets={DIFFERENTIAL_PRESETS as any}
                activePresetLabel={activePresetLabel}
                applyPreset={applyPreset}
                presetDescriptions={{}}
            />
            
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">
                    {renderedTab}
                </div>
            </div>

            <StudioStatusBar
                solvePhase={solvePhase}
                isResultStale={isResultStale}
            />
        </div>
    );
}
