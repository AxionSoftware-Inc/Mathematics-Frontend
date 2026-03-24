"use client";

import React from "react";

import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { MATRIX_PRESETS } from "@/components/laboratory/modules/matrix-studio/constants";
import { useMatrixStudio } from "@/components/laboratory/modules/matrix-studio/use-matrix-studio";
import { StudioHeaderBar } from "@/components/laboratory/modules/matrix-studio/components/studio-header-bar";
import { StudioStatusBar } from "@/components/laboratory/modules/matrix-studio/components/studio-status-bar";
import { SolveView } from "@/components/laboratory/modules/matrix-studio/views/solve-view";
import { VisualizeView } from "@/components/laboratory/modules/matrix-studio/views/visualize-view";
import { CompareView } from "@/components/laboratory/modules/matrix-studio/views/compare-view";
import { ReportView } from "@/components/laboratory/modules/matrix-studio/views/report-view";

export function MatrixStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useMatrixStudio(module);
    const [templatesOpen, setTemplatesOpen] = React.useState(false);

    const renderedTab = React.useMemo(() => {
        switch (state.activeTab) {
            case "solve":
                return <SolveView state={state} actions={actions} />;
            case "visualize":
                return <VisualizeView state={state} />;
            case "compare":
                return <CompareView state={state} />;
            case "report":
                return <ReportView state={state} />;
            default:
                return null;
        }
    }, [actions, state]);

    return (
        <div className="flex grow flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/50">
            <StudioHeaderBar
                activeTab={state.activeTab}
                setActiveTab={actions.setActiveTab}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={state.experienceLevel}
                setExperienceLevel={actions.setExperienceLevel}
                presets={MATRIX_PRESETS}
                activePresetLabel={state.activePresetLabel}
                applyPreset={actions.applyPreset}
            />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">
                    {renderedTab}
                </div>
            </div>

            <StudioStatusBar
                solvePhase={state.solvePhase}
                isResultStale={state.isResultStale}
                mode={state.mode}
            />
        </div>
    );
}
