"use client";

import * as React from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { PROBABILITY_PRESETS } from "./constants";
import { ProbabilityMathService } from "./services/math-service";
import type {
    ProbabilityAnalysisResult,
    ProbabilityExperienceLevel,
    ProbabilityMode,
    ProbabilityPreset,
    ProbabilityStudioState,
    ProbabilityWorkspaceTab,
} from "./types";

export function useProbabilityStudio(module: LaboratoryModuleMeta) {
    const config = module.config ?? {};
    const defaultPreset = PROBABILITY_PRESETS[0];

    const [experienceLevel, setExperienceLevel] = React.useState<ProbabilityExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<ProbabilityWorkspaceTab>("solve");
    const [mode, setMode] = React.useState<ProbabilityMode>((config.defaultMode as ProbabilityMode | undefined) ?? defaultPreset.mode);
    const [datasetExpression, setDatasetExpression] = React.useState<string>((config.defaultExpression as string | undefined) ?? defaultPreset.dataset);
    const [parameterExpression, setParameterExpression] = React.useState<string>((config.defaultSecondary as string | undefined) ?? defaultPreset.parameters ?? "");
    const [dimension, setDimension] = React.useState<string>((config.defaultDimension as string | undefined) ?? defaultPreset.dimension);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(defaultPreset.label);
    const [solvePhase, setSolvePhase] = React.useState<ProbabilityStudioState["solvePhase"]>("analysis-ready");
    const [solveErrorMessage] = React.useState<string | null>(null);

    const signature = React.useMemo(
        () => JSON.stringify({ mode, datasetExpression, parameterExpression, dimension }),
        [datasetExpression, dimension, mode, parameterExpression],
    );
    const solvedSignature = signature;
    const result = React.useMemo<ProbabilityAnalysisResult>(
        () => ProbabilityMathService.analyze(mode, datasetExpression, parameterExpression),
        [datasetExpression, mode, parameterExpression],
    );
    const summary = result.summary;

    const visualNotes = React.useMemo(() => {
        if (mode === "descriptive") {
            return ["Histogram / sample spread", `Mean ${summary.mean ?? "pending"}`, `Std dev ${summary.stdDev ?? "pending"}`];
        }
        if (mode === "distributions") {
            return ["Density curve", `Family ${summary.distributionFamily ?? "pending"}`, summary.confidenceInterval ?? "Tail pending"];
        }
        if (mode === "inference") {
            return ["Confidence interval band", `p-value ${summary.pValue ?? "pending"}`, summary.riskSignal ?? "significance pending"];
        }
        if (mode === "regression") {
            return ["Scatter + fit line", summary.regressionFit ?? "fit pending", summary.riskSignal ?? "residual pending"];
        }
        return ["Monte Carlo path", summary.monteCarloEstimate ?? "estimate pending", summary.variance ?? "variance pending"];
    }, [mode, summary]);

    const compareNotes = React.useMemo(
        () => [
            `Primary family: ${mode}`,
            `Shape: ${summary.shape ?? "pending"}`,
            `Risk: ${summary.riskSignal ?? "pending"}`,
            result.auxiliaryFormula ? `Aux: ${result.auxiliaryFormula}` : "Auxiliary pending",
        ],
        [mode, result.auxiliaryFormula, summary],
    );

    const reportNotes = React.useMemo(
        () => [
            `Mode: ${mode}`,
            `Dimension: ${dimension}`,
            `Sample size: ${summary.sampleSize ?? "pending"}`,
            `Risk signal: ${summary.riskSignal ?? "pending"}`,
            `Final: ${result.finalFormula ?? "pending"}`,
        ],
        [dimension, mode, result.finalFormula, summary],
    );

    const applyPreset = React.useCallback((preset: ProbabilityPreset) => {
        setMode(preset.mode);
        setDatasetExpression(preset.dataset);
        setParameterExpression(preset.parameters ?? "");
        setDimension(preset.dimension);
        setActivePresetLabel(preset.label);
        setSolvePhase("analysis-ready");
    }, []);

    return {
        state: {
            experienceLevel,
            activeTab,
            mode,
            datasetExpression,
            parameterExpression,
            dimension,
            solvePhase,
            isResultStale: solvedSignature !== signature,
            activePresetLabel,
            result,
            summary,
            solveErrorMessage,
            visualNotes,
            compareNotes,
            reportNotes,
        } satisfies ProbabilityStudioState,
        actions: {
            setExperienceLevel,
            setActiveTab,
            setMode,
            setDatasetExpression,
            setParameterExpression,
            setDimension,
            applyPreset,
        },
    };
}
