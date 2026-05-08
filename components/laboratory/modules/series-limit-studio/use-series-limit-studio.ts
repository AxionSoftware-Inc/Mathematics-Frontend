"use client";

import * as React from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { SERIES_LIMIT_PRESETS } from "./constants";
import { SeriesLimitMathService } from "./services/math-service";
import { buildSeriesLimitContract, evaluateSeriesLimitBenchmark } from "./services/presentation-service";
import { SeriesLimitSolveService } from "./services/solve-service";
import type {
    SeriesLimitAnnotation,
    SeriesLimitAnalyticSolveResponse,
    SeriesLimitExperienceLevel,
    SeriesLimitMode,
    SeriesLimitPreset,
    SeriesLimitSavedScenario,
    SeriesLimitStudioState,
    SeriesLimitWorkspaceTab,
} from "./types";

function preferPreviewSeries<T>(preview: T[] | null | undefined, fallback: T[] | undefined) {
    return preview && preview.length ? preview : fallback;
}

export function useSeriesLimitStudio(module: LaboratoryModuleMeta) {
    const config = module.config ?? {};
    const defaultPreset = SERIES_LIMIT_PRESETS[0];

    const [experienceLevel, setExperienceLevel] = React.useState<SeriesLimitExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<SeriesLimitWorkspaceTab>("solve");
    const [mode, setMode] = React.useState<SeriesLimitMode>((config.defaultMode as SeriesLimitMode | undefined) ?? defaultPreset.mode);
    const [expression, setExpression] = React.useState<string>((config.defaultExpression as string | undefined) ?? defaultPreset.expression);
    const [auxiliaryExpression, setAuxiliaryExpression] = React.useState<string>((config.defaultSecondary as string | undefined) ?? defaultPreset.auxiliary ?? "");
    const [dimension, setDimension] = React.useState<string>((config.defaultDimension as string | undefined) ?? defaultPreset.dimension);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(defaultPreset.label);
    const [solvePhase, setSolvePhase] = React.useState<SeriesLimitStudioState["solvePhase"]>("analysis-ready");
    const [analyticSolution, setAnalyticSolution] = React.useState<SeriesLimitAnalyticSolveResponse | null>(null);
    const [solveErrorMessage, setSolveErrorMessage] = React.useState<string | null>(null);
    const [solveSignature, setSolveSignature] = React.useState<string>("");
    const [savedScenarios, setSavedScenarios] = React.useState<SeriesLimitSavedScenario[]>([]);
    const [scenarioLabel, setScenarioLabel] = React.useState("");
    const [annotations, setAnnotations] = React.useState<SeriesLimitAnnotation[]>([]);
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");

    const signature = React.useMemo(
        () => JSON.stringify({ mode, expression, auxiliaryExpression, dimension }),
        [auxiliaryExpression, dimension, expression, mode],
    );

    const rawResult = React.useMemo(
        () => SeriesLimitMathService.analyze(mode, expression, auxiliaryExpression, dimension),
        [auxiliaryExpression, dimension, expression, mode],
    );

    React.useEffect(() => {
        let cancelled = false;

        if (!expression.trim()) {
            setAnalyticSolution(null);
            setSolveErrorMessage(null);
            setSolvePhase("idle");
            return;
        }

        setSolvePhase("auto-ready");
        setSolveErrorMessage(null);

        SeriesLimitSolveService.requestSolve({
            mode,
            expression,
            auxiliary: auxiliaryExpression,
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
                setSolveErrorMessage(error instanceof Error ? error.message : "Series / limit solve xatosi.");
                setSolvePhase("analysis-ready");
            });

        return () => {
            cancelled = true;
        };
    }, [auxiliaryExpression, dimension, expression, mode, signature]);

    const result = React.useMemo(
        () => ({
            ...rawResult,
            lineSeries: preferPreviewSeries(analyticSolution?.preview?.lineSeries, rawResult.lineSeries),
            secondaryLineSeries: preferPreviewSeries(analyticSolution?.preview?.secondaryLineSeries, rawResult.secondaryLineSeries),
            tertiaryLineSeries: preferPreviewSeries(analyticSolution?.preview?.tertiaryLineSeries, rawResult.tertiaryLineSeries),
            quaternaryLineSeries: preferPreviewSeries(analyticSolution?.preview?.quaternaryLineSeries, rawResult.quaternaryLineSeries),
        }),
        [analyticSolution?.preview?.lineSeries, analyticSolution?.preview?.secondaryLineSeries, analyticSolution?.preview?.tertiaryLineSeries, analyticSolution?.preview?.quaternaryLineSeries, rawResult],
    );

    const summary = React.useMemo(
        () => ({ ...rawResult.summary, ...(analyticSolution?.summary ?? {}) }),
        [analyticSolution?.summary, rawResult.summary],
    );

    const contractSummary = React.useMemo(
        () => buildSeriesLimitContract(mode, summary, analyticSolution),
        [analyticSolution, mode, summary],
    );

    const benchmarkSummary = React.useMemo(
        () => evaluateSeriesLimitBenchmark(mode, expression, auxiliaryExpression, summary),
        [auxiliaryExpression, expression, mode, summary],
    );

    const visualNotes = React.useMemo(() => {
        if (mode === "limits") {
            return [
                `Family: ${summary.detectedFamily ?? "pending"}`,
                `Limit: ${summary.candidateResult ?? "pending"}`,
                `Asymptotic cue: ${summary.asymptoticSignal ?? "pending"}`,
                `Expansion: ${summary.expansionSignal ?? "pending"}`,
                `Error bound: ${summary.errorBoundSignal ?? "pending"}`,
                `Research lane: ${summary.specialFamilySignal ?? "pending"}`,
            ];
        }
        if (mode === "sequences") {
            return [
                `Monotonicity: ${summary.monotonicity ?? "pending"}`,
                `Tail limit: ${summary.candidateResult ?? "pending"}`,
                `Boundedness: ${summary.boundedness ?? "pending"}`,
            ];
        }
        if (mode === "power-series") {
            return [
                `Radius: ${summary.radiusSignal ?? "pending"}`,
                `Interval: ${summary.intervalSignal ?? "pending"}`,
                `Endpoints: ${summary.endpointSignal ?? "pending"}`,
                `Expansion: ${summary.expansionSignal ?? "pending"}`,
            ];
        }
        return [
            `Convergence: ${summary.convergenceSignal ?? "pending"}`,
            `Partial sums: ${summary.partialSumSignal ?? "pending"}`,
            `Test family: ${summary.testFamily ?? "pending"}`,
            `Proof signal: ${summary.proofSignal ?? "pending"}`,
            `Error bound: ${summary.errorBoundSignal ?? "pending"}`,
            `Special family: ${summary.specialFamilySignal ?? "pending"}`,
        ];
    }, [mode, summary]);

    const compareNotes = React.useMemo(
        () => [
            `Primary lane: ${mode}`,
            `Method: ${analyticSolution?.exact.method_label ?? "client-side preview"}`,
            `Test family: ${summary.testFamily ?? "pending"}`,
            `Secondary test: ${summary.secondaryTestFamily ?? "pending"}`,
            `Dominant term: ${summary.dominantTerm ?? "pending"}`,
            `Expansion: ${summary.expansionSignal ?? "pending"}`,
            `Error bound: ${summary.errorBoundSignal ?? "pending"}`,
            `Special family: ${summary.specialFamilySignal ?? "pending"}`,
            `Risk: ${summary.riskSignal ?? "pending"}`,
            `Readiness: ${contractSummary.readinessLabel}`,
            ...(benchmarkSummary ? [`Benchmark: ${benchmarkSummary.status} (${benchmarkSummary.label})`] : []),
        ],
        [analyticSolution?.exact.method_label, benchmarkSummary, contractSummary.readinessLabel, mode, summary],
    );

    const reportNotes = React.useMemo(
        () => [
            `Mode: ${mode}`,
            `Dimension: ${dimension}`,
            `Family: ${summary.detectedFamily ?? "pending"}`,
            `Result: ${analyticSolution?.exact.result_latex ?? rawResult.finalFormula ?? "pending"}`,
            `Convergence: ${summary.convergenceSignal ?? summary.radiusSignal ?? "pending"}`,
            `Proof signal: ${summary.proofSignal ?? "pending"}`,
            `Error bound: ${summary.errorBoundSignal ?? "pending"}`,
            `Special family: ${summary.specialFamilySignal ?? "pending"}`,
            `Expansion: ${summary.expansionSignal ?? "pending"}`,
            `Risk: ${summary.riskSignal ?? "pending"}`,
            `Readiness: ${contractSummary.readinessLabel}`,
            ...(benchmarkSummary ? [`Benchmark: ${benchmarkSummary.label} -> ${benchmarkSummary.status}`] : []),
        ],
        [analyticSolution?.exact.result_latex, benchmarkSummary, contractSummary.readinessLabel, dimension, mode, rawResult.finalFormula, summary],
    );

    const trustScore = React.useMemo(() => {
        let score = analyticSolution?.status === "exact" ? 90 : 72;
        if (solveErrorMessage) score -= 30;
        if (summary.riskSignal?.includes("proof")) score -= 12;
        if (summary.endpointSignal?.includes("unresolved")) score -= 14;
        if (summary.convergenceSignal?.includes("inconclusive")) score -= 18;
        if (contractSummary.riskLevel === "medium") score -= 6;
        if (benchmarkSummary?.status === "review") score -= 8;
        return Math.max(0, Math.min(100, score));
    }, [analyticSolution?.status, benchmarkSummary, contractSummary.riskLevel, solveErrorMessage, summary.convergenceSignal, summary.endpointSignal, summary.riskSignal]);

    const trustHazards = React.useMemo(() => {
        const hazards: string[] = [];
        if (solveErrorMessage) hazards.push(solveErrorMessage);
        if (summary.riskSignal) hazards.push(summary.riskSignal);
        if (summary.endpointSignal?.includes("unresolved")) hazards.push(`Endpoint audit unresolved: ${summary.endpointSignal}`);
        if (summary.proofSignal?.includes("incomplete")) hazards.push(summary.proofSignal);
        hazards.push(...contractSummary.reviewNotes);
        if (benchmarkSummary?.status === "review") hazards.push(`Benchmark review required: ${benchmarkSummary.detail}`);
        return [...new Set(hazards.filter(Boolean))];
    }, [benchmarkSummary, contractSummary.reviewNotes, solveErrorMessage, summary.endpointSignal, summary.proofSignal, summary.riskSignal]);

    const primaryResultText = React.useMemo(
        () => analyticSolution?.exact.result_latex ?? rawResult.finalFormula ?? summary.candidateResult ?? null,
        [analyticSolution?.exact.result_latex, rawResult.finalFormula, summary.candidateResult],
    );

    const saveCurrentScenario = React.useCallback(() => {
        const label = scenarioLabel.trim() || `${mode} snapshot`;
        const item: SeriesLimitSavedScenario = {
            id: `${Date.now()}`,
            label,
            savedAt: new Date().toISOString(),
            mode,
            expression,
            auxiliaryExpression,
            dimension,
            result: primaryResultText,
        };
        setSavedScenarios((current) => [item, ...current].slice(0, 12));
        setScenarioLabel("");
    }, [auxiliaryExpression, dimension, expression, mode, primaryResultText, scenarioLabel]);

    const loadSavedScenario = React.useCallback((item: SeriesLimitSavedScenario) => {
        setMode(item.mode);
        setExpression(item.expression);
        setAuxiliaryExpression(item.auxiliaryExpression);
        setDimension(item.dimension);
    }, []);

    const removeSavedScenario = React.useCallback((id: string) => {
        setSavedScenarios((current) => current.filter((item) => item.id !== id));
    }, []);

    const annotationAnchor = React.useMemo(() => `${mode} | ${expression} | ${auxiliaryExpression || "-"}`, [auxiliaryExpression, expression, mode]);

    const addAnnotationFromCurrentResult = React.useCallback(() => {
        if (!primaryResultText) return;
        const item: SeriesLimitAnnotation = {
            id: `${Date.now()}`,
            title: annotationTitle.trim() || `${mode} note`,
            note: annotationNote.trim() || `Observed result: ${primaryResultText}`,
            anchor: annotationAnchor,
            createdAt: new Date().toISOString(),
        };
        setAnnotations((current) => [item, ...current].slice(0, 20));
        setAnnotationTitle("");
        setAnnotationNote("");
    }, [annotationAnchor, annotationNote, annotationTitle, mode, primaryResultText]);

    const removeAnnotation = React.useCallback((id: string) => {
        setAnnotations((current) => current.filter((item) => item.id !== id));
    }, []);

    const applyPreset = React.useCallback((preset: SeriesLimitPreset) => {
        setMode(preset.mode);
        setExpression(preset.expression);
        setAuxiliaryExpression(preset.auxiliary ?? "");
        setDimension(preset.dimension);
        setActivePresetLabel(preset.label);
        setSolvePhase("analysis-ready");
    }, []);

    return {
        state: {
            experienceLevel,
            activeTab,
            mode,
            expression,
            auxiliaryExpression,
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
            trustPanelProps: {
                state: {
                    trustScore,
                    analyticStatus: analyticSolution?.status ?? "needs_numerical",
                    numericalSupport: true,
                    convergence: summary.convergenceSignal?.includes("convergent")
                        ? "convergent"
                        : trustHazards.length
                          ? "warning"
                          : "unknown",
                    hazards: trustHazards,
                    parserNotes: [
                        analyticSolution?.parser.expression_raw ?? expression,
                        auxiliaryExpression || "auxiliary missing",
                        summary.testFamily ?? "test family pending",
                    ],
                    readinessLabel: contractSummary.readinessLabel,
                    benchmarkLabel: benchmarkSummary ? `${benchmarkSummary.label} · ${benchmarkSummary.status}` : null,
                },
            },
            scenarioPanelProps: {
                state: {
                    savedScenarios,
                    scenarioLabel,
                    setScenarioLabel,
                    saveCurrentScenario,
                    loadSavedScenario,
                    removeSavedScenario,
                },
            },
            annotationPanelProps: {
                state: {
                    annotations,
                    annotationAnchor,
                    annotationTitle,
                    setAnnotationTitle,
                    annotationNote,
                    setAnnotationNote,
                    addAnnotationFromCurrentResult,
                    removeAnnotation,
                    canSave: Boolean(primaryResultText),
                },
            },
        } satisfies SeriesLimitStudioState,
        actions: {
            setExperienceLevel,
            setActiveTab,
            setMode,
            setExpression,
            setAuxiliaryExpression,
            setDimension,
            applyPreset,
        },
    };
}
