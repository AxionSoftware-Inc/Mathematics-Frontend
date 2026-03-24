import React from "react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { useDifferentialStudio } from "./differential-studio/use-differential-studio";
import { DIFFERENTIAL_PRESETS } from "./differential-studio/constants";

// Local Components
import { StudioHeaderBar } from "./differential-studio/components/studio-header-bar";
import { StudioStatusBar } from "./differential-studio/components/studio-status-bar";
import { CompareView } from "./differential-studio/views/compare-view";
import { ReportView } from "./differential-studio/views/report-view";
import { SolveView } from "./differential-studio/views/solve-view";
import { VisualizeView } from "./differential-studio/views/visualize-view";

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
                    />
                );
            default:
                return null;
        }
    }, [activeTab, actions, state, visibleSignals]);

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
