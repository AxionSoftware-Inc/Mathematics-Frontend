import React from "react";
import {
    DifferentialExtendedMode,
    DifferentialExperienceLevel,
    DifferentialWorkspaceTab,
    DifferentialSolvePhase,
    DifferentialSolveSnapshot,
    DifferentialAnalyticSolveResponse,
    DifferentialComputationSummary,
    DifferentialCoordinateSystem,
    DifferentialAnnotation,
    DifferentialSavedExperiment,
} from "./types";
import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { DIFFERENTIAL_PRESETS } from "./constants";
import { DifferentialClassificationService } from "./services/classification-service";
import { DifferentialMathService } from "./services/math-service";
import { DifferentialSolveService } from "./services/solve-service";
import {
    buildDifferentialCompareOverviewCards,
    buildDifferentialMethodTableRows,
    buildDifferentialPrimaryResultText,
    buildDifferentialReportExecutiveCards,
    buildDifferentialReportSupportCards,
    buildDifferentialRiskRegisterCards,
    buildDifferentialSampleTableRows,
    buildDifferentialTrustHazards,
    buildDifferentialTrustScore,
    buildDifferentialVisualizeOverviewCards,
} from "./services/presentation-service";

function parseNumberList(value: string): number[] {
    return value
        .replace(/[\[\]]/g, "")
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((part) => Number.isFinite(part));
}

function parseVariableList(value: string): string[] {
    return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

export function useDifferentialStudio(module: LaboratoryModuleMeta) {
    const showcasePreset = DIFFERENTIAL_PRESETS[0];
    const defaultMode = (module.config?.defaultMode as DifferentialExtendedMode) || (showcasePreset.mode as DifferentialExtendedMode) || "derivative";
    const defaultExpression = (module.config?.defaultExpression as string) || showcasePreset.expr || "sin(x)";
    const defaultVariable = (module.config?.defaultVariable as string) || showcasePreset.variable || "x";
    const defaultPoint = String(module.config?.defaultPoint ?? showcasePreset.point ?? "1");
    const defaultOrder = String(showcasePreset.order ?? "1");

    const [mode, setMode] = React.useState<DifferentialExtendedMode>(defaultMode);
    const [experienceLevel, setExperienceLevel] = React.useState<DifferentialExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<DifferentialWorkspaceTab>("solve");
    const [expression, setExpression] = React.useState(defaultExpression);
    const [variable, setVariable] = React.useState(defaultVariable);
    const [point, setPoint] = React.useState(defaultPoint);
    const [order, setOrder] = React.useState(defaultOrder);
    const [direction, setDirection] = React.useState("1, 0");
    const [coordinates, setCoordinates] = React.useState<DifferentialCoordinateSystem>("cartesian");
    const [savedExperiments, setSavedExperiments] = React.useState<DifferentialSavedExperiment[]>([]);
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [annotations, setAnnotations] = React.useState<DifferentialAnnotation[]>([]);
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");

    const [solvedRequest, setSolvedRequest] = React.useState<DifferentialSolveSnapshot | null>(null);
    const [numericalRequest, setNumericalRequest] = React.useState<DifferentialSolveSnapshot | null>(null);
    const [solvePhase, setSolvePhase] = React.useState<DifferentialSolvePhase>("idle");
    const [solveErrorMessage, setSolveErrorMessage] = React.useState("");
    const [analyticSolution, setAnalyticSolution] = React.useState<DifferentialAnalyticSolveResponse | null>(null);

    const currentRequest = React.useMemo<DifferentialSolveSnapshot>(
        () => ({
            mode,
            expression,
            variable,
            point,
            order,
            direction,
            coordinates,
        }),
        [coordinates, direction, expression, mode, order, point, variable],
    );

    const classification = React.useMemo(
        () => DifferentialClassificationService.classify(currentRequest),
        [currentRequest],
    );
    const canRunCurrentLane = React.useMemo(
        () =>
            [
                "ordinary_derivative",
                "higher_order_derivative",
                "partial_derivative",
                "gradient_candidate",
                "directional_derivative",
                "jacobian_candidate",
                "hessian_candidate",
                "ode_candidate",
                "pde_candidate",
                "sde_candidate",
            ].includes(classification.kind),
        [classification.kind],
    );
    const serializedCurrentRequest = React.useMemo(() => JSON.stringify(currentRequest), [currentRequest]);
    const serializedSolvedRequest = React.useMemo(
        () => (solvedRequest ? JSON.stringify(solvedRequest) : ""),
        [solvedRequest],
    );

    const solverState = React.useMemo(() => {
        if (!numericalRequest) {
            return { error: "", summary: null as DifferentialComputationSummary | null };
        }

        try {
            if (numericalRequest.mode === "derivative") {
                const derivativeOrder = Math.max(1, Number(numericalRequest.order) || 1);
                if (derivativeOrder > 1) {
                    return {
                        error: "",
                        summary: DifferentialMathService.approximateHigherOrderSeries(
                            numericalRequest.expression,
                            parseVariableList(numericalRequest.variable)[0] ?? "x",
                            Number(numericalRequest.point),
                            derivativeOrder,
                        ) as DifferentialComputationSummary,
                    };
                }

                return {
                    error: "",
                    summary: DifferentialMathService.approximateDerivative(
                        numericalRequest.expression,
                        parseVariableList(numericalRequest.variable)[0] ?? "x",
                        Number(numericalRequest.point),
                        derivativeOrder,
                    ) as DifferentialComputationSummary,
                };
            }

            if (numericalRequest.mode === "directional") {
                return {
                    error: "",
                    summary: DifferentialMathService.approximateDirectionalDerivative(
                        numericalRequest.expression,
                        parseVariableList(numericalRequest.variable),
                        parseNumberList(numericalRequest.point),
                        parseNumberList(numericalRequest.direction),
                        1e-5,
                        numericalRequest.coordinates,
                    ) as DifferentialComputationSummary,
                };
            }

            if (numericalRequest.mode === "partial" || numericalRequest.mode === "jacobian" || numericalRequest.mode === "hessian") {
                return {
                    error: "",
                    summary: DifferentialMathService.approximateAdvanced(
                        numericalRequest.mode,
                        numericalRequest.expression,
                        numericalRequest.variable,
                        numericalRequest.point,
                        1e-5,
                        Number(numericalRequest.order) || 1,
                        numericalRequest.coordinates,
                    ) as DifferentialComputationSummary,
                };
            }

            if (numericalRequest.mode === "ode" || numericalRequest.mode === "pde" || numericalRequest.mode === "sde") {
                return {
                    error: "",
                    summary: DifferentialMathService.approximateAdvanced(
                        numericalRequest.mode,
                        numericalRequest.expression,
                        numericalRequest.variable,
                        numericalRequest.point,
                        1e-5,
                        Number(numericalRequest.order) || 1,
                        numericalRequest.coordinates,
                    ) as DifferentialComputationSummary,
                };
            }

            return { error: "", summary: null as DifferentialComputationSummary | null };
        } catch (error) {
            return {
                error: (error as Error).message || "Differential solver failed.",
                summary: null as DifferentialComputationSummary | null,
            };
        }
    }, [numericalRequest]);

    const error = solverState.error;
    const summary = solverState.summary;
    const isResultStale = Boolean(solvedRequest && JSON.stringify(currentRequest) !== JSON.stringify(solvedRequest));

    const requestSolve = React.useCallback(async () => {
        if (!canRunCurrentLane) {
            setAnalyticSolution(null);
            setNumericalRequest(null);
            setSolvedRequest(currentRequest);
            setSolvePhase("error");
            setSolveErrorMessage(
                `${classification.label}: bu differential oilasi uchun alohida solver studio kerak. Hozirgi modul guidance va diagnostics ko'rsatadi, lekin real solve lane hali yo'q.`,
            );
            return;
        }

        setSolvePhase("analytic-loading");
        setSolveErrorMessage("");

        try {
            const response = await DifferentialSolveService.requestAnalyticSolve(currentRequest);
            setAnalyticSolution(response);
            setSolvedRequest(currentRequest);
            setNumericalRequest(currentRequest);
            setSolvePhase(response.status === "exact" ? "exact-ready" : "numerical-ready");
        } catch (requestError) {
            const normalizedError = requestError as Error;
            setSolvePhase("error");
            setSolveErrorMessage(normalizedError.message);
            setSolvedRequest(currentRequest);
            setNumericalRequest(currentRequest);
        }
    }, [canRunCurrentLane, classification.label, currentRequest]);

    React.useEffect(() => {
        if (!currentRequest.expression.trim()) return;
        if (serializedCurrentRequest === serializedSolvedRequest) return;

        const timer = window.setTimeout(() => {
            void requestSolve();
        }, 420);

        return () => window.clearTimeout(timer);
    }, [currentRequest.expression, requestSolve, serializedCurrentRequest, serializedSolvedRequest]);

    const visualizeOverviewCards = React.useMemo(
        () => buildDifferentialVisualizeOverviewCards(summary, analyticSolution, mode),
        [analyticSolution, mode, summary],
    );

    const methodAuditCards = React.useMemo(() => {
        const methodValue =
            mode === "derivative"
                ? (Number(order) > 1 ? "Taylor sweep" : "Central difference")
                : mode === "partial"
                  ? "Gradient stencil"
                  : mode === "directional"
                    ? "Gradient · unit(u)"
                    : mode === "jacobian"
                      ? "Row-wise partials"
                      : mode === "hessian"
                        ? "Second-order stencil"
                        : mode === "ode"
                          ? "SymPy dsolve"
                          : mode === "pde"
                            ? "SymPy pdsolve"
                            : "Euler-Maruyama";
        const matrixAudit =
            mode === "jacobian"
                ? analyticSolution?.diagnostics?.matrix?.determinant_status ?? "shape audit"
                : mode === "hessian"
                    ? analyticSolution?.diagnostics?.matrix?.critical_point_type ?? "curvature audit"
                    : mode === "sde"
                        ? "seed=42"
                        : mode === "ode" || mode === "pde"
                            ? "symbolic lane"
                            : "1e-5";

        return [
            { eyebrow: "Method", value: methodValue, detail: "Numerical analysis core", tone: "neutral" as const },
            { eyebrow: "Precision", value: mode === "sde" ? "dt path" : mode === "ode" || mode === "pde" ? "symbolic exact" : "O(h^2)", detail: mode === "hessian" ? "Second-order stencil bound" : mode === "sde" ? "discrete stochastic step" : mode === "ode" || mode === "pde" ? "closed-form where supported" : "Central approximation bound", tone: "neutral" as const },
            {
                eyebrow: mode === "jacobian" || mode === "hessian" ? "Matrix Audit" : mode === "sde" ? "Simulation" : "Step (h)",
                value: matrixAudit,
                detail: mode === "jacobian" || mode === "hessian" ? "Structured backend diagnostic" : mode === "sde" ? "Reproducible stochastic path" : "Default stable step",
                tone: "info" as const,
            },
        ];
    }, [analyticSolution, mode, order]);

    const compareOverviewCards = React.useMemo(
        () => buildDifferentialCompareOverviewCards(summary, analyticSolution, mode),
        [analyticSolution, mode, summary],
    );

    const riskRegisterCards = React.useMemo(
        () => buildDifferentialRiskRegisterCards(analyticSolution, mode),
        [analyticSolution, mode],
    );

    const trustScore = React.useMemo(
        () => buildDifferentialTrustScore(analyticSolution, error, solveErrorMessage, summary, mode),
        [analyticSolution, error, mode, solveErrorMessage, summary],
    );

    const trustHazards = React.useMemo(
        () => buildDifferentialTrustHazards(analyticSolution, error, solveErrorMessage, mode),
        [analyticSolution, error, mode, solveErrorMessage],
    );

    const primaryResultText = React.useMemo(
        () => buildDifferentialPrimaryResultText(summary),
        [summary],
    );

    const reportExecutiveCards = React.useMemo(
        () => buildDifferentialReportExecutiveCards(summary, analyticSolution, mode, trustScore),
        [analyticSolution, mode, summary, trustScore],
    );

    const reportSupportCards = React.useMemo(
        () => buildDifferentialReportSupportCards(summary, analyticSolution, mode),
        [analyticSolution, mode, summary],
    );

    const methodTableRows = React.useMemo(
        () => buildDifferentialMethodTableRows(summary, analyticSolution, mode),
        [analyticSolution, mode, summary],
    );

    const sampleTableRows = React.useMemo(
        () => buildDifferentialSampleTableRows(summary, analyticSolution, mode),
        [analyticSolution, mode, summary],
    );

    const saveCurrentExperiment = React.useCallback(() => {
        const label = experimentLabel.trim() || `${mode} @ ${point}`;
        const item: DifferentialSavedExperiment = {
            id: `${Date.now()}`,
            label,
            savedAt: new Date().toISOString(),
            mode,
            expression,
            variable,
            point,
            order,
            direction,
            coordinates,
            result: primaryResultText,
        };
        setSavedExperiments((current) => [item, ...current].slice(0, 12));
        setExperimentLabel("");
    }, [coordinates, direction, experimentLabel, expression, mode, order, point, primaryResultText, variable]);

    const loadSavedExperiment = React.useCallback((item: DifferentialSavedExperiment) => {
        setMode(item.mode);
        setExpression(item.expression);
        setVariable(item.variable);
        setPoint(item.point);
        setOrder(item.order);
        setDirection(item.direction);
        setCoordinates(item.coordinates);
    }, []);

    const removeSavedExperiment = React.useCallback((id: string) => {
        setSavedExperiments((current) => current.filter((item) => item.id !== id));
    }, []);

    const annotationAnchor = React.useMemo(() => `${mode} | p=${point} | ${expression}`, [expression, mode, point]);

    const addAnnotationFromCurrentResult = React.useCallback(() => {
        if (!summary || error) return;
        const title = annotationTitle.trim() || `${mode} note`;
        const note = annotationNote.trim() || `Observed result: ${primaryResultText ?? "n/a"}`;
        const item: DifferentialAnnotation = {
            id: `${Date.now()}`,
            title,
            note,
            anchor: annotationAnchor,
            createdAt: new Date().toISOString(),
        };
        setAnnotations((current) => [item, ...current].slice(0, 20));
        setAnnotationTitle("");
        setAnnotationNote("");
    }, [annotationAnchor, annotationNote, annotationTitle, error, mode, primaryResultText, summary]);

    const removeAnnotation = React.useCallback((id: string) => {
        setAnnotations((current) => current.filter((item) => item.id !== id));
    }, []);

    const trustPanelProps = React.useMemo(() => ({
        state: {
            trustScore,
            analyticStatus: analyticSolution?.status || "needs_numerical",
            numericalSupport: true,
            convergence: trustHazards.length ? "warning" as const : "convergent" as const,
            hazards: trustHazards,
            parserNotes: analyticSolution?.parser?.notes ?? [],
        },
    }), [analyticSolution, trustHazards, trustScore]);

    const scenarioPanelProps = React.useMemo(() => ({
        state: {
            savedExperiments,
            experimentLabel,
            setExperimentLabel,
            saveCurrentExperiment,
            loadSavedExperiment,
            removeSavedExperiment,
        },
    }), [experimentLabel, loadSavedExperiment, removeSavedExperiment, saveCurrentExperiment, savedExperiments]);

    const annotationPanelProps = React.useMemo(() => ({
        state: {
            annotations,
            annotationAnchor,
            annotationTitle,
            setAnnotationTitle,
            annotationNote,
            setAnnotationNote,
            addAnnotationFromCurrentResult,
            removeAnnotation,
            canSave: Boolean(summary) && !error,
        },
    }), [addAnnotationFromCurrentResult, annotationAnchor, annotationNote, annotationTitle, annotations, error, removeAnnotation, summary]);

    return {
        state: {
            mode,
            experienceLevel,
            activeTab,
            expression,
            variable,
            point,
            order,
            direction,
            coordinates,
            solvePhase,
            solveErrorMessage,
            analyticSolution,
            error,
            summary,
            isResultStale,
            classification,
            solvedRequest,
            numericalRequest,
            visualizeOverviewCards,
            methodAuditCards,
            methodTableRows,
            sampleTableRows,
            compareOverviewCards,
            riskRegisterCards,
            reportExecutiveCards,
            reportSupportCards,
            trustPanelProps,
            scenarioPanelProps,
            annotationPanelProps,
        },
        actions: {
            setMode,
            setExperienceLevel,
            setActiveTab,
            setExpression,
            setVariable,
            setPoint,
            setOrder,
            setDirection,
            setCoordinates,
            requestSolve,
        },
    };
}
