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
    DifferentialMetricCard,
    DifferentialAnnotation,
    DerivativeSummary,
    GradientSummary,
    JacobianSummary,
    HessianSummary,
    PartialDerivativeSummary,
    PlotPoint,
    DifferentialSavedExperiment,
} from "./types";
import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { DIFFERENTIAL_PRESETS } from "./constants";
import { DifferentialClassificationService } from "./services/classification-service";
import { DifferentialMathService } from "./services/math-service";
import { DifferentialSolveService } from "./services/solve-service";

function isGradient(summary: unknown): summary is GradientSummary {
    return (summary as GradientSummary)?.type === "gradient";
}

function isJacobian(summary: unknown): summary is JacobianSummary {
    return (summary as JacobianSummary)?.type === "jacobian";
}

function isHessian(summary: unknown): summary is HessianSummary {
    return (summary as HessianSummary)?.type === "hessian";
}

function isDerivativeOrPartial(summary: unknown): summary is DerivativeSummary | PartialDerivativeSummary {
    const type = (summary as DerivativeSummary | PartialDerivativeSummary)?.type;
    return type === "derivative" || type === "partial";
}

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
                return { error: "", summary: null as DifferentialComputationSummary | null };
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

    const visualizeOverviewCards = React.useMemo(() => {
        if (!summary && analyticSolution?.status === "exact") {
            return [
                { eyebrow: "Operation", value: mode.charAt(0).toUpperCase() + mode.slice(1), detail: analyticSolution.exact?.method_label ?? "Specialized lane", tone: "neutral" as const },
                { eyebrow: "Taxonomy", value: analyticSolution.diagnostics?.taxonomy?.family ?? "specialized", detail: "Backend lane family", tone: "info" as const },
                { eyebrow: "Continuity", value: analyticSolution?.diagnostics?.continuity ?? "Partial", detail: "Lane-specific validity signal", tone: "success" as const },
            ];
        }

        if (!summary) {
            return [
                { eyebrow: "Operation", value: mode.charAt(0).toUpperCase() + mode.slice(1), detail: "2D lane armed", tone: "neutral" as const },
                { eyebrow: "Preview", value: "Ready", detail: "Showcase preset loaded", tone: "info" as const },
                { eyebrow: "Continuity", value: "Pending", detail: "Solve to validate locally", tone: "neutral" as const },
            ];
        }

        const renderCapacity =
            "samples" in summary && Array.isArray(summary.samples)
                ? `${summary.samples.length} pts`
                : "matrix" in summary
                  ? `${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`
                  : "n/a";

        const visualLane =
            summary.type === "derivative"
                ? "Function + tangent"
                : summary.type === "higher_order"
                  ? "Taylor overlay"
                  : summary.type === "gradient" || summary.type === "directional"
                    ? "Slice + vector"
                    : summary.type === "jacobian"
                      ? "Matrix lane"
                      : "Curvature lane";

        return [
            { eyebrow: "Operation", value: mode.charAt(0).toUpperCase() + mode.slice(1), detail: visualLane, tone: "neutral" as const },
            { eyebrow: "Capacity", value: renderCapacity, detail: "Renderable audit points", tone: "info" as const },
            { eyebrow: "Continuity", value: analyticSolution?.diagnostics?.continuity ?? "Assumed", detail: "Local validity signal", tone: "success" as const },
        ];
    }, [analyticSolution, mode, summary]);

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

    const compareOverviewCards = React.useMemo(() => {
        if (!summary && analyticSolution?.status === "exact") {
            return [
                {
                    eyebrow: "Lane",
                    value: mode.toUpperCase(),
                    detail: analyticSolution.exact?.method_label ?? "Specialized solver",
                    tone: "success" as const,
                },
                {
                    eyebrow: "Family",
                    value: analyticSolution.diagnostics?.taxonomy?.family ?? "specialized",
                    detail: "Symbolic taxonomy",
                    tone: "info" as const,
                },
                {
                    eyebrow: "Convergence",
                    value: mode === "sde" ? "Pathwise" : "Symbolic",
                    detail: mode === "sde" ? "single-path simulation" : "closed-form lane",
                    tone: "neutral" as const,
                },
            ];
        }

        let primaryValue = 0;
        let primaryLabel = "Primary Eval";
        let deviationValue = "< 1e-4";
        let convergenceValue = "Stable";
        if (summary) {
            if (isDerivativeOrPartial(summary) || isGradient(summary) || isHessian(summary)) {
                primaryValue = summary.valueAtPoint;
            } else if (isJacobian(summary)) {
                primaryValue = summary.valueAtPoint[0] || 0;
            }
            if (isJacobian(summary)) {
                primaryLabel = "Matrix Lead";
                deviationValue = analyticSolution?.diagnostics?.matrix?.determinant_status ?? "shape only";
                convergenceValue = analyticSolution?.status === "exact" ? "Symbolic" : "Numeric";
            } else if (isHessian(summary)) {
                primaryLabel = "Critical Point";
                deviationValue = analyticSolution?.exact?.critical_point_type ?? summary.criticalPointType;
                convergenceValue = analyticSolution?.exact?.eigenvalue_signature ?? summary.eigenvalueSignature;
            } else if (mode === "directional") {
                primaryLabel = "Projected Eval";
            }
        }

        return [
            { eyebrow: primaryLabel, value: primaryLabel === "Critical Point" ? deviationValue : primaryValue.toFixed(4), detail: "Result magnitude", tone: "success" as const },
            {
                eyebrow: primaryLabel === "Critical Point" ? "Matrix Status" : "Deviation",
                value: primaryLabel === "Critical Point" ? (analyticSolution?.diagnostics?.matrix?.determinant_status ?? "n/a") : deviationValue,
                detail: "Comparison signal",
                tone: "neutral" as const,
            },
            { eyebrow: "Convergence", value: convergenceValue, detail: mode === "jacobian" || mode === "hessian" ? "Matrix lane interpretation" : "Finite diff bounded", tone: "info" as const },
        ];
    }, [analyticSolution, mode, summary]);

    const riskRegisterCards = React.useMemo(() => {
        const cards: DifferentialMetricCard[] = [
            {
                eyebrow: "Singularity Risk",
                value: analyticSolution?.diagnostics?.singularity_points?.length ? "Watch" : "Low",
                detail: "Point-neighborhood scan",
                tone: analyticSolution?.diagnostics?.singularity_points?.length ? "warn" as const : "success" as const,
            },
            {
                eyebrow: "Truncation Error",
                value: mode === "hessian" ? "Elevated" : mode === "sde" ? "Path variance" : mode === "ode" || mode === "pde" ? "Symbolic lane" : "Standard",
                detail: mode === "hessian" ? "Second-order stencil is more sensitive" : mode === "sde" ? "single-path stochastic uncertainty" : mode === "ode" || mode === "pde" ? "solver family dependent" : "Bounded by O(h^2) stencil",
                tone: mode === "hessian" || mode === "sde" ? "warn" as const : "neutral" as const,
            },
        ];

        if (analyticSolution?.diagnostics?.domain_analysis?.constraints?.length) {
            cards.push({
                eyebrow: "Domain Constraints",
                value: String(analyticSolution.diagnostics.domain_analysis.constraints.length),
                detail: "Active symbolic constraints",
                tone: "info",
            });
        }

        if (analyticSolution?.diagnostics?.matrix?.determinant_status) {
            cards.push({
                eyebrow: "Matrix Status",
                value: analyticSolution.diagnostics.matrix.determinant_status,
                detail: "Invertibility / conditioning signal",
                tone: analyticSolution.diagnostics.matrix.determinant_status === "near_singular" ? "warn" : "info",
            });
        }

        return cards;
    }, [analyticSolution, mode]);

    const trustScore = React.useMemo(() => {
        let score = analyticSolution?.status === "exact" ? 92 : 74;
        if (error || solveErrorMessage) score -= 30;
        if (analyticSolution?.diagnostics?.singularity_points?.length) score -= 15;
        if (analyticSolution?.diagnostics?.differentiability === "non_differentiable") score -= 18;
        if (analyticSolution?.diagnostics?.differentiability === "partial") score -= 8;
        if (!summary && !(mode === "ode" || mode === "pde" || mode === "sde")) score -= 12;
        if (mode === "sde") score -= 8;
        return Math.max(0, Math.min(100, score));
    }, [analyticSolution, error, mode, solveErrorMessage, summary]);

    const trustHazards = React.useMemo(() => {
        const hazards: string[] = [];
        if (analyticSolution?.diagnostics?.singularity_points?.length) {
            hazards.push("Singularity points detected near the active variable lane.");
        }
        if (analyticSolution?.diagnostics?.differentiability === "non_differentiable") {
            hazards.push("Expression is marked non-differentiable on at least one active boundary.");
        }
        if (analyticSolution?.diagnostics?.domain_analysis?.blockers?.length) {
            hazards.push(...analyticSolution.diagnostics.domain_analysis.blockers.map((item) => `Domain blocker: ${item}`));
        }
        if (error || solveErrorMessage) {
            hazards.push(error || solveErrorMessage);
        }
        if (mode === "sde") {
            hazards.push("Single seeded sample-path only; ensemble statistics hali chiqarilmagan.");
        }
        return hazards;
    }, [analyticSolution, error, mode, solveErrorMessage]);

    const primaryResultText = React.useMemo(() => {
        if (!summary) return null;
        if (summary.type === "derivative") return summary.derivativeAtPoint.toFixed(6);
        if (summary.type === "partial") return summary.partialAtPoint.toFixed(6);
        if (summary.type === "gradient") return `|grad|=${summary.magnitude.toFixed(6)}`;
        if (summary.type === "directional") return summary.directionalDerivative.toFixed(6);
        if ("matrix" in summary) return `${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`;
        return `n=${summary.maxOrder}`;
    }, [summary]);

    const reportExecutiveCards = React.useMemo(() => {
        let mainResult = "0.00";
        if (!summary && analyticSolution?.status === "exact") {
            mainResult = analyticSolution.exact?.numeric_approximation ?? (analyticSolution.exact?.derivative_latex ? "symbolic" : "exact");
        } else if (summary) {
            if (isDerivativeOrPartial(summary)) {
                mainResult = summary.valueAtPoint.toFixed(4);
            } else if (isGradient(summary)) {
                mainResult = `|\\nabla| = ${summary.magnitude.toFixed(4)}`;
            } else if (isJacobian(summary) || isHessian(summary)) {
                mainResult = `Matrix[${summary.matrix.length}x${summary.matrix[0]?.length || summary.matrix.length}]`;
            }
        }

        return [
            { eyebrow: "Mode", value: mode.toUpperCase(), detail: "Derivative resolution", tone: "neutral" as const },
            { eyebrow: "Result", value: mainResult, detail: "Final computation", tone: "success" as const },
            { eyebrow: "Trust Score", value: String(trustScore), detail: "Methodological safety", tone: trustScore >= 85 ? "success" as const : trustScore >= 65 ? "info" as const : "warn" as const },
        ];
    }, [analyticSolution, mode, summary, trustScore]);

    const reportSupportCards = React.useMemo(() => {
        const points = summary && "samples" in summary ? summary.samples.length : 0;
        return [
            { eyebrow: "Points", value: String(points), detail: mode === "ode" || mode === "pde" || mode === "sde" ? "Visualizer samples live in lane renderer" : "Trace density", tone: "neutral" as const },
            { eyebrow: "Format", value: "Markdown", detail: "Export readiness", tone: "info" as const },
            {
                eyebrow: "Diagnostics",
                value: analyticSolution?.diagnostics?.matrix?.critical_point_type ?? analyticSolution?.diagnostics?.differentiability ?? "ready",
                detail: "Research note payload",
                tone: "neutral" as const,
            },
        ];
    }, [analyticSolution, mode, summary]);

    const methodTableRows = React.useMemo(() => {
        if (!summary && analyticSolution?.status === "exact") {
            return [
                ["Lane", mode.toUpperCase(), analyticSolution.exact?.method_label ?? "Specialized backend lane"],
                ["Family", analyticSolution.diagnostics?.taxonomy?.family ?? "specialized", analyticSolution.diagnostics?.taxonomy?.summary ?? "Lane summary"],
                ["Exact Form", analyticSolution.exact?.derivative_latex ?? "n/a", "Primary symbolic result"],
            ];
        }

        if (!summary) {
            return [["No data", "-", "-"]];
        }

        if (summary.type === "higher_order") {
            return summary.derivatives.map((value, index) => [
                `f${index === 0 ? "" : `^(${index})`}(x0)`,
                value.toFixed(6),
                index === 0 ? "Function value" : `Order ${index} derivative`,
            ]);
        }

        if (isJacobian(summary) || isHessian(summary)) {
            return summary.matrix.map((row, index) => [
                `Row ${index + 1}`,
                `[${row.map((value) => value.toFixed(4)).join(", ")}]`,
                isHessian(summary) ? "Second partials" : `State component ${index + 1}`,
            ]);
        }

        if (summary.type === "directional") {
            return [
                ["f(point)", summary.valueAtPoint.toFixed(6), "Scalar field eval"],
                ["Gradient", `[${summary.gradient.map((value) => value.toFixed(4)).join(", ")}]`, "Local gradient"],
                ["D_u f", summary.directionalDerivative.toFixed(6), "Projected change rate"],
            ];
        }

        if (isGradient(summary)) {
            return [
                ["f(point)", summary.valueAtPoint.toFixed(6), "Scalar field eval"],
                ["Gradient", `[${summary.gradient.map((value) => value.toFixed(4)).join(", ")}]`, "Vector field"],
                ["Magnitude |∇f|", summary.magnitude.toFixed(6), "Steepest ascent"],
            ];
        }

        if (isDerivativeOrPartial(summary)) {
            const primaryRate =
                "tangentLine" in summary
                    ? summary.tangentLine.slope
                    : summary.partialAtPoint;
            return [
                ["f(point)", summary.valueAtPoint.toFixed(6), "Primary computation"],
                ["Primary rate", primaryRate.toFixed(6), "First-order response"],
                ["Lane", summary.type === "partial" ? `∂/∂${summary.variable}` : "Ordinary derivative", "Active 2D lane"],
            ];
        }

        return [["-", "-", "-"]];
    }, [analyticSolution, mode, summary]);

    const sampleTableRows = React.useMemo(() => {
        if (!summary && analyticSolution?.status === "exact") {
            return [
                ["lane", mode],
                ["method", analyticSolution.exact?.method_label ?? "specialized"],
                ["result", analyticSolution.exact?.numeric_approximation ?? "symbolic"],
            ];
        }
        if (!summary || !("samples" in summary) || !summary.samples?.length) {
            return [["-", "-"]];
        }
        return (summary.samples as PlotPoint[]).map((sample) => [
            (sample.x ?? 0).toFixed(4),
            (sample.y ?? 0).toFixed(4),
        ]);
    }, [analyticSolution, mode, summary]);

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
