"use client";

import * as React from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { PROBABILITY_PRESETS } from "./constants";
import { normalizeProbabilityDimension } from "./probability-dimension-options";
import { ProbabilityMathService } from "./services/math-service";
import { buildProbabilityContract, evaluateProbabilityBenchmark } from "./services/presentation-service";
import { ProbabilitySolveService } from "./services/solve-service";
import type {
    ProbabilityAnalysisResult,
    ProbabilityAnalyticSolveResponse,
    ProbabilityExperienceLevel,
    ProbabilityMode,
    ProbabilityPreset,
    ProbabilityStudioState,
    ProbabilityWorkspaceTab,
} from "./types";

export function useProbabilityStudio(module: LaboratoryModuleMeta) {
    const config = module.config ?? {};
    const defaultPreset = PROBABILITY_PRESETS[0];
    const initialMode = ((config.defaultMode as ProbabilityMode | undefined) ?? defaultPreset.mode);
    const initialDimension = normalizeProbabilityDimension(initialMode, (config.defaultDimension as string | undefined) ?? defaultPreset.dimension);

    const [experienceLevel, setExperienceLevel] = React.useState<ProbabilityExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<ProbabilityWorkspaceTab>("solve");
    const [mode, setMode] = React.useState<ProbabilityMode>(initialMode);
    const [datasetExpression, setDatasetExpression] = React.useState<string>((config.defaultExpression as string | undefined) ?? defaultPreset.dataset);
    const [parameterExpression, setParameterExpression] = React.useState<string>((config.defaultSecondary as string | undefined) ?? defaultPreset.parameters ?? "");
    const [dimension, setDimension] = React.useState<string>(initialDimension);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(defaultPreset.label);
    const [solvePhase, setSolvePhase] = React.useState<ProbabilityStudioState["solvePhase"]>("analysis-ready");
    const [analyticSolution, setAnalyticSolution] = React.useState<ProbabilityAnalyticSolveResponse | null>(null);
    const [solveErrorMessage, setSolveErrorMessage] = React.useState<string | null>(null);
    const [solveSignature, setSolveSignature] = React.useState<string>("");

    const signature = React.useMemo(
        () => JSON.stringify({ mode, datasetExpression, parameterExpression, dimension }),
        [datasetExpression, dimension, mode, parameterExpression],
    );

    const result = React.useMemo<ProbabilityAnalysisResult>(
        () => ProbabilityMathService.analyze(mode, datasetExpression, parameterExpression, dimension),
        [datasetExpression, dimension, mode, parameterExpression],
    );

    React.useEffect(() => {
        const normalized = normalizeProbabilityDimension(mode, dimension);
        if (normalized !== dimension) {
            setDimension(normalized);
        }
    }, [dimension, mode]);

    React.useEffect(() => {
        let cancelled = false;

        if (!datasetExpression.trim()) {
            setAnalyticSolution(null);
            setSolveErrorMessage(null);
            setSolvePhase("idle");
            return;
        }

        setSolvePhase("auto-ready");
        setSolveErrorMessage(null);

        ProbabilitySolveService.requestSolve({
            mode,
            dataset: datasetExpression,
            parameters: parameterExpression,
            dimension,
        })
            .then((response) => {
                if (cancelled) {
                    return;
                }
                setAnalyticSolution(response);
                setSolveSignature(signature);
                setSolvePhase("analysis-ready");
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                setAnalyticSolution(null);
                setSolveErrorMessage(error instanceof Error ? error.message : "Probability solve xatosi.");
                setSolvePhase("analysis-ready");
            });

        return () => {
            cancelled = true;
        };
    }, [datasetExpression, dimension, mode, parameterExpression, signature]);

    const summary = React.useMemo(
        () => ({ ...result.summary, ...(analyticSolution?.summary ?? {}) }),
        [analyticSolution?.summary, result.summary],
    );

    const contractSummary = React.useMemo(
        () => buildProbabilityContract(mode, summary, analyticSolution),
        [analyticSolution, mode, summary],
    );

    const benchmarkSummary = React.useMemo(
        () => evaluateProbabilityBenchmark(mode, datasetExpression, parameterExpression, summary),
        [datasetExpression, mode, parameterExpression, summary],
    );

    const visualNotes = React.useMemo(() => {
        if (mode === "descriptive") {
            return ["Histogram / sample spread", `Mean ${summary.mean ?? "pending"}`, `Skew ${summary.skewness ?? "pending"}`];
        }
        if (mode === "distributions") {
            return ["Density curve", `Family ${summary.distributionFamily ?? "pending"}`, summary.confidenceInterval ?? summary.testStatistic ?? "Tail pending"];
        }
        if (mode === "inference") {
            return ["Confidence interval band", `p-value ${summary.pValue ?? "pending"}`, summary.power ?? summary.riskSignal ?? "significance pending"];
        }
        if (mode === "regression") {
            return ["Scatter + fit line", summary.regressionFit ?? "fit pending", summary.residualSignal ?? summary.outlierSignal ?? summary.forecast ?? "residual pending"];
        }
        if (mode === "bayesian") {
            return ["Posterior density", `Posterior mean ${summary.posteriorMean ?? "pending"}`, summary.posteriorPredictive ?? summary.credibleInterval ?? "credible interval pending"];
        }
        if (mode === "multivariate") {
            return ["Correlation heatmap", summary.pcaSignal ?? summary.correlationSignal ?? "correlation pending", summary.clusterSignal ?? summary.mahalanobisSignal ?? "structure pending"];
        }
        if (mode === "time-series") {
            return ["Series + moving average", summary.forecast ?? "forecast pending", summary.acfSignal ?? summary.seasonality ?? summary.stationarity ?? "stationarity pending"];
        }
        return ["Monte Carlo path", summary.monteCarloEstimate ?? "estimate pending", summary.bootstrapSignal ?? summary.varianceReduction ?? summary.samplerSignal ?? "variance pending"];
    }, [mode, summary]);

    const compareNotes = React.useMemo(
        () => [
            `Primary family: ${mode}`,
            `Shape: ${summary.shape ?? "pending"}`,
            `Risk: ${summary.riskSignal ?? "pending"}`,
            `Method: ${analyticSolution?.exact.method_label ?? "client-side fallback"}`,
            `Readiness: ${contractSummary.readinessLabel}`,
            `Contract: ${contractSummary.status}/${contractSummary.riskLevel}`,
            `Diagnostic: ${summary.testStatistic ?? summary.power ?? summary.residualSignal ?? summary.pcaSignal ?? summary.acfSignal ?? summary.bootstrapSignal ?? "pending"}`,
            ...(benchmarkSummary ? [`Benchmark: ${benchmarkSummary.status} (${benchmarkSummary.label})`] : []),
        ],
        [analyticSolution?.exact.method_label, benchmarkSummary, contractSummary, mode, summary],
    );

    const reportNotes = React.useMemo(
        () => [
            `Mode: ${mode}`,
            `Dimension: ${dimension}`,
            `Sample size: ${summary.sampleSize ?? "pending"}`,
            `Risk signal: ${summary.riskSignal ?? "pending"}`,
            `Readiness: ${contractSummary.readinessLabel}`,
            `Contract risk: ${contractSummary.riskLevel}`,
            `Final: ${analyticSolution?.exact.result_latex ?? result.finalFormula ?? "pending"}`,
            `Auxiliary diagnostic: ${summary.power ?? summary.residualSignal ?? summary.posteriorPredictive ?? summary.pcaSignal ?? summary.acfSignal ?? summary.bootstrapSignal ?? "pending"}`,
            ...(benchmarkSummary ? [`Benchmark: ${benchmarkSummary.label} -> ${benchmarkSummary.status}`] : []),
        ],
        [analyticSolution?.exact.result_latex, benchmarkSummary, contractSummary, dimension, mode, result.finalFormula, summary],
    );

    const applyPreset = React.useCallback((preset: ProbabilityPreset) => {
        setMode(preset.mode);
        setDatasetExpression(preset.dataset);
        setParameterExpression(preset.parameters ?? "");
        setDimension(normalizeProbabilityDimension(preset.mode, preset.dimension));
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
            isResultStale: Boolean(analyticSolution) && solveSignature !== signature,
            activePresetLabel,
            result,
            analyticSolution,
            summary,
            contractSummary,
            benchmarkSummary,
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
