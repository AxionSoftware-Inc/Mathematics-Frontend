import type {
    DerivativeSummary,
    DifferentialAnalyticSolveResponse,
    DifferentialBenchmarkSummary,
    DifferentialComputationSummary,
    DifferentialExtendedMode,
    DifferentialMetricCard,
    GradientSummary,
    HessianSummary,
    JacobianSummary,
    ODESummary,
    PDESummary,
    PartialDerivativeSummary,
    PlotPoint,
    SDESummary,
} from "../types";

function normalizeMathText(value: string) {
    return value.replace(/\s+/g, "").replace(/ln\(/gi, "log(").toLowerCase();
}

function normalizePointText(value: string) {
    return value.replace(/\s+/g, "");
}

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

function isODE(summary: unknown): summary is ODESummary {
    return (summary as ODESummary)?.type === "ode";
}

function isPDE(summary: unknown): summary is PDESummary {
    return (summary as PDESummary)?.type === "pde";
}

function isSDE(summary: unknown): summary is SDESummary {
    return (summary as SDESummary)?.type === "sde";
}

export function buildDifferentialVisualizeOverviewCards(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
): DifferentialMetricCard[] {
    if (!summary && analyticSolution?.status === "exact") {
        return [
            { eyebrow: "Operation", value: mode.charAt(0).toUpperCase() + mode.slice(1), detail: analyticSolution.exact?.method_label ?? "Specialized lane", tone: "neutral" },
            { eyebrow: "Taxonomy", value: analyticSolution.diagnostics?.taxonomy?.family ?? "specialized", detail: "Backend lane family", tone: "info" },
            { eyebrow: "Continuity", value: analyticSolution?.diagnostics?.continuity ?? "Partial", detail: "Lane-specific validity signal", tone: "success" },
        ];
    }

    if (!summary) {
        return [
            { eyebrow: "Operation", value: mode.charAt(0).toUpperCase() + mode.slice(1), detail: "2D lane armed", tone: "neutral" },
            { eyebrow: "Preview", value: "Ready", detail: "Showcase preset loaded", tone: "info" },
            { eyebrow: "Continuity", value: "Pending", detail: "Solve to validate locally", tone: "neutral" },
        ];
    }

    if (summary.type === "higher_order") {
        return [
            { eyebrow: "Order", value: String(summary.maxOrder), detail: "Taylor chain ready", tone: "success" },
            { eyebrow: "Value", value: summary.valueAtPoint.toFixed(4), detail: "Expansion anchor", tone: "info" },
            { eyebrow: "Samples", value: String(summary.functionSamples.length), detail: "Function vs Taylor traces", tone: "neutral" },
        ];
    }

    if (isGradient(summary)) {
        return [
            { eyebrow: "Magnitude", value: summary.magnitude.toFixed(4), detail: "Steepest ascent norm", tone: "success" },
            { eyebrow: "Components", value: String(summary.gradient.length), detail: "Active variables", tone: "info" },
            { eyebrow: "Trace", value: String(summary.samples.length), detail: "Preview points", tone: "neutral" },
        ];
    }

    if (summary.type === "directional") {
        return [
            { eyebrow: "Directional Rate", value: summary.directionalDerivative.toFixed(4), detail: "Projected change", tone: "success" },
            { eyebrow: "Direction", value: `[${summary.unitDirection.map((value) => value.toFixed(2)).join(", ")}]`, detail: "Normalized direction", tone: "info" },
            { eyebrow: "Trace", value: String(summary.samples.length), detail: "Curve points", tone: "neutral" },
        ];
    }

    if (isODE(summary)) {
        return [
            { eyebrow: "Trajectory", value: String(summary.samples.length), detail: "RK4 path samples", tone: "success" },
            { eyebrow: "Equilibria", value: summary.equilibriumPoints.length ? summary.equilibriumPoints.map((item) => item.toFixed(2)).join(", ") : "none", detail: "Phase-line roots", tone: "info" },
            { eyebrow: "Stability", value: summary.stabilityLabel, detail: "Autonomous phase read", tone: summary.stabilityLabel === "unstable" ? "warn" : "neutral" },
        ];
    }

    if (isPDE(summary)) {
        return [
            { eyebrow: "Family", value: summary.family, detail: "PDE numeric lane", tone: "success" },
            { eyebrow: "Grid", value: `${summary.grid.nx}x${summary.grid.nt}`, detail: "Space-time mesh", tone: "info" },
            { eyebrow: "Ratio", value: summary.stabilityRatio.toFixed(3), detail: summary.family === "heat" ? "Explicit CFL indicator" : "Transport speed magnitude", tone: summary.family === "heat" && summary.stabilityRatio > 0.5 ? "warn" : "neutral" },
        ];
    }

    if (isSDE(summary)) {
        return [
            { eyebrow: "Paths", value: String(summary.pathCount), detail: "Ensemble members", tone: "success" },
            { eyebrow: "Terminal Mean", value: summary.terminalMean.toFixed(4), detail: "Ensemble expectation", tone: "info" },
            { eyebrow: "Terminal Std", value: summary.terminalStd.toFixed(4), detail: "Path dispersion", tone: summary.terminalStd > 1 ? "warn" : "neutral" },
        ];
    }

    if (isJacobian(summary) || isHessian(summary)) {
        return [
            { eyebrow: "Shape", value: `${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`, detail: "Matrix lane", tone: "success" },
            { eyebrow: isHessian(summary) ? "Critical Type" : "Determinant", value: isHessian(summary) ? summary.criticalPointType ?? "pending" : summary.determinant !== null ? summary.determinant.toFixed(4) : "pending", detail: isHessian(summary) ? "Second-order classification" : "Local invertibility", tone: "info" },
            { eyebrow: "Trace", value: summary.trace !== null ? summary.trace.toFixed(4) : "pending", detail: "Matrix diagnostic", tone: "neutral" },
        ];
    }

    if (isDerivativeOrPartial(summary)) {
        const rate = "tangentLine" in summary ? summary.tangentLine.slope : summary.partialAtPoint;
        return [
            { eyebrow: "Value", value: summary.valueAtPoint.toFixed(4), detail: "Function evaluation", tone: "success" },
            { eyebrow: "Rate", value: rate.toFixed(4), detail: "Local first-order response", tone: "info" },
            { eyebrow: "Trace", value: String(summary.samples.length), detail: "Preview points", tone: "neutral" },
        ];
    }

    return [];
}

export function buildDifferentialCompareOverviewCards(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
): DifferentialMetricCard[] {
    if (!summary && analyticSolution?.status === "exact") {
        return [
            { eyebrow: "Lane", value: mode.toUpperCase(), detail: analyticSolution.exact?.method_label ?? "Specialized solver", tone: "success" },
            { eyebrow: "Family", value: analyticSolution.diagnostics?.taxonomy?.family ?? "specialized", detail: "Symbolic taxonomy", tone: "info" },
            { eyebrow: "Convergence", value: mode === "sde" ? "Pathwise" : "Symbolic", detail: mode === "sde" ? "single-path simulation" : "closed-form lane", tone: "neutral" },
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
            convergenceValue = analyticSolution?.exact?.eigenvalue_signature ?? "spectrum pending";
        } else if (summary.type === "directional") {
            primaryLabel = "Directional Rate";
            primaryValue = summary.directionalDerivative;
            deviationValue = analyticSolution?.diagnostics?.domain_analysis?.blockers?.length ? "domain watch" : "< 1e-4";
        } else if (isGradient(summary)) {
            primaryLabel = "|Grad|";
            primaryValue = summary.magnitude;
        } else if (isODE(summary)) {
            primaryLabel = "Terminal State";
            primaryValue = summary.valueAtPoint;
            deviationValue = summary.stabilityLabel;
            convergenceValue = summary.family === "autonomous" ? "Phase-ready" : "Trajectory";
        } else if (isPDE(summary)) {
            primaryLabel = "Midfield";
            primaryValue = summary.valueAtPoint;
            deviationValue = summary.family;
            convergenceValue = summary.family === "heat" ? "Explicit mesh" : "Transport";
        } else if (isSDE(summary)) {
            primaryLabel = "E[X(T)]";
            primaryValue = summary.terminalMean;
            deviationValue = `σ=${summary.terminalStd.toFixed(3)}`;
            convergenceValue = `${summary.pathCount} paths`;
        }
    }

    return [
        { eyebrow: primaryLabel, value: primaryValue.toFixed(4), detail: "Primary compare anchor", tone: "success" },
        { eyebrow: "Deviation", value: deviationValue, detail: "Numeric / symbolic alignment", tone: deviationValue === "< 1e-4" ? "success" : "warn" },
        { eyebrow: "Lane State", value: convergenceValue, detail: "Current resolution quality", tone: convergenceValue === "Stable" || convergenceValue === "Symbolic" ? "info" : "neutral" },
    ];
}

export function buildDifferentialRiskRegisterCards(
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
): DifferentialMetricCard[] {
    const cards: DifferentialMetricCard[] = [
        {
            eyebrow: "Singularity Risk",
            value: analyticSolution?.diagnostics?.singularity_points?.length ? "Watch" : "Low",
            detail: "Point-neighborhood scan",
            tone: analyticSolution?.diagnostics?.singularity_points?.length ? "warn" : "success",
        },
        {
            eyebrow: "Truncation Error",
            value: mode === "hessian" ? "Elevated" : mode === "sde" ? "Path variance" : mode === "ode" || mode === "pde" ? "Symbolic lane" : "Standard",
            detail: mode === "hessian" ? "Second-order stencil is more sensitive" : mode === "sde" ? "single-path stochastic uncertainty" : mode === "ode" || mode === "pde" ? "solver family dependent" : "Bounded by O(h^2) stencil",
            tone: mode === "hessian" || mode === "sde" ? "warn" : "neutral",
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
}

export function evaluateDifferentialBenchmark(
    mode: DifferentialExtendedMode,
    expression: string,
    point: string,
    variable: string,
    summary: DifferentialComputationSummary | null,
): DifferentialBenchmarkSummary | null {
    const normalizedExpression = normalizeMathText(expression);
    const normalizedPoint = normalizePointText(point);
    const normalizedVariable = normalizePointText(variable);

    if (mode === "derivative" && summary?.type === "derivative" && normalizedExpression === "x^3" && normalizedPoint === "2") {
        const actual = summary.derivativeAtPoint;
        const expected = 12;
        const absoluteError = Math.abs(actual - expected);
        return {
            id: "derivative-cubic-at-two",
            label: "Cubic derivative benchmark",
            expectedValue: expected.toFixed(6),
            actualValue: actual.toFixed(6),
            absoluteError,
            status: absoluteError <= 1e-8 ? "verified" : "review",
            detail: "d/dx x^3 at x=2 should equal 12.",
        };
    }

    if (mode === "jacobian" && summary?.type === "jacobian" && normalizedExpression === "(x^2+y,x-y^2)" && normalizedPoint === "1,2") {
        const expected = [[2, 1], [1, -4]];
        const actual = summary.matrix;
        const flatExpected = expected.flat();
        const flatActual = actual.flat();
        const absoluteError = Math.max(...flatExpected.map((value, index) => Math.abs((flatActual[index] ?? 0) - value)));
        return {
            id: "jacobian-polynomial-system",
            label: "Jacobian benchmark",
            expectedValue: "[[2,1],[1,-4]]",
            actualValue: `[[${actual[0]?.join(",") ?? ""}],[${actual[1]?.join(",") ?? ""}]]`,
            absoluteError,
            status: absoluteError <= 1e-8 ? "verified" : "review",
            detail: "J(x^2+y, x-y^2) at (1,2) should match the canonical 2x2 matrix.",
        };
    }

    if (mode === "hessian" && summary?.type === "hessian" && normalizedExpression === "x^2+y^2" && normalizedPoint === "0,0" && normalizedVariable === "x,y") {
        const expectedTrace = 4;
        const absoluteError = Math.abs(summary.trace - expectedTrace);
        return {
            id: "hessian-quadratic-origin",
            label: "Hessian quadratic benchmark",
            expectedValue: "trace=4, positive_definite",
            actualValue: `trace=${summary.trace.toFixed(6)}, ${summary.eigenvalueSignature}`,
            absoluteError,
            status: absoluteError <= 1e-8 && summary.eigenvalueSignature === "positive_definite" ? "verified" : "review",
            detail: "Hessian of x^2+y^2 at the origin should be positive definite with trace 4.",
        };
    }

    if (mode === "partial" && summary?.type === "gradient" && normalizedExpression === "x^2+y^2" && normalizedPoint === "1,2" && normalizedVariable === "x,y") {
        const expected = Math.sqrt(20);
        const absoluteError = Math.abs(summary.magnitude - expected);
        return {
            id: "gradient-quadratic",
            label: "Gradient magnitude benchmark",
            expectedValue: expected.toFixed(6),
            actualValue: summary.magnitude.toFixed(6),
            absoluteError,
            status: absoluteError <= 1e-8 ? "verified" : "review",
            detail: "For f=x^2+y^2 at (1,2), |grad f| should equal sqrt(20).",
        };
    }

    if (mode === "ode" && summary?.type === "ode" && normalizedExpression === "y'=y;y(0)=1") {
        const expected = Math.exp(6);
        const absoluteError = Math.abs(summary.valueAtPoint - expected);
        return {
            id: "ode-exp-growth",
            label: "ODE exponential-growth benchmark",
            expectedValue: expected.toFixed(6),
            actualValue: summary.valueAtPoint.toFixed(6),
            absoluteError,
            status: absoluteError <= 0.5 ? "verified" : "review",
            detail: "For y' = y with y(0)=1, the default trajectory should end near e^6.",
        };
    }

    if (mode === "pde" && summary?.type === "pde" && normalizedExpression === "u_t=u_x;u(x,0)=sin(x)") {
        const amplitude = Math.max(...summary.finalProfile.map((item) => Math.abs(item.y)));
        const absoluteError = Math.abs(amplitude - 1);
        return {
            id: "pde-transport-sine",
            label: "Transport-profile benchmark",
            expectedValue: "max amplitude 1.000000",
            actualValue: `max amplitude ${amplitude.toFixed(6)}`,
            absoluteError,
            status: absoluteError <= 0.08 ? "verified" : "review",
            detail: "Transport of sin(x) should preserve profile amplitude across the time horizon.",
        };
    }

    if (mode === "pde" && summary?.type === "pde" && normalizedExpression === "u_t=u_xx;u(x,0)=sin(x)") {
        const amplitude = Math.max(...summary.finalProfile.map((item) => Math.abs(item.y)));
        const expected = Math.exp(-1.2);
        const absoluteError = Math.abs(amplitude - expected);
        return {
            id: "pde-heat-sine",
            label: "Heat-profile benchmark",
            expectedValue: expected.toFixed(6),
            actualValue: amplitude.toFixed(6),
            absoluteError,
            status: absoluteError <= 0.08 ? "verified" : "review",
            detail: "Heat evolution of sin(x) should decay approximately like exp(-t) over the final profile.",
        };
    }

    if (mode === "sde" && summary?.type === "sde" && normalizedExpression === "dx=0.4*x*dt+0.2*x*dw;x(0)=1;t:[0,1];n=64") {
        const expected = Math.exp(0.4);
        const absoluteError = Math.abs(summary.terminalMean - expected);
        return {
            id: "sde-geometric-brownian",
            label: "SDE geometric-Brownian benchmark",
            expectedValue: expected.toFixed(6),
            actualValue: summary.terminalMean.toFixed(6),
            absoluteError,
            status: absoluteError <= 0.35 ? "verified" : "review",
            detail: "For dX = 0.4X dt + 0.2X dW, ensemble mean should stay near exp(0.4).",
        };
    }

    return null;
}

export function buildDifferentialTrustScore(
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    error: string,
    solveErrorMessage: string,
    summary: DifferentialComputationSummary | null,
    mode: DifferentialExtendedMode,
    benchmarkSummary: DifferentialBenchmarkSummary | null,
): number {
    let score = analyticSolution?.status === "exact" ? 92 : 74;
    if (error || solveErrorMessage) score -= 30;
    if (analyticSolution?.diagnostics?.singularity_points?.length) score -= 15;
    if (analyticSolution?.diagnostics?.differentiability === "non_differentiable") score -= 18;
    if (analyticSolution?.diagnostics?.differentiability === "partial") score -= 8;
    if (!summary && !(mode === "ode" || mode === "pde" || mode === "sde")) score -= 12;
    if (mode === "sde") score -= 8;
    if (analyticSolution?.diagnostics?.contract?.status === "warn") score -= 8;
    if (analyticSolution?.diagnostics?.contract?.status === "error") score -= 18;
    if (analyticSolution?.diagnostics?.contract?.risk_level === "medium") score -= 4;
    if (analyticSolution?.diagnostics?.contract?.risk_level === "high") score -= 10;
    score -= Math.min(analyticSolution?.diagnostics?.contract?.hazard_count ?? 0, 3) * 2;
    if (benchmarkSummary?.status === "verified") score += 4;
    if (benchmarkSummary?.status === "review") score -= 8;
    return Math.max(0, Math.min(100, score));
}

export function buildDifferentialTrustHazards(
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    error: string,
    solveErrorMessage: string,
    mode: DifferentialExtendedMode,
    benchmarkSummary: DifferentialBenchmarkSummary | null,
): string[] {
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
        hazards.push("Stochastic lane dispersion should be read together with ensemble variance bands.");
    }
    if (analyticSolution?.diagnostics?.contract?.status === "warn" || analyticSolution?.diagnostics?.contract?.status === "error") {
        hazards.push(`Solver contract: ${analyticSolution.diagnostics.contract.status}.`);
    }
    if (analyticSolution?.diagnostics?.contract?.risk_level === "high") {
        hazards.push("Solver risk level is high for the active differential lane.");
    }
    if (analyticSolution?.diagnostics?.contract?.review_notes?.length) {
        hazards.push(...analyticSolution.diagnostics.contract.review_notes.slice(0, 2));
    }
    if (benchmarkSummary?.status === "review") {
        hazards.push(`Benchmark review required: ${benchmarkSummary.detail}`);
    }
    return hazards;
}

export function buildDifferentialPrimaryResultText(summary: DifferentialComputationSummary | null): string | null {
    if (!summary) return null;
    if (summary.type === "derivative") return summary.derivativeAtPoint.toFixed(6);
    if (summary.type === "partial") return summary.partialAtPoint.toFixed(6);
    if (summary.type === "gradient") return `|grad|=${summary.magnitude.toFixed(6)}`;
    if (summary.type === "directional") return summary.directionalDerivative.toFixed(6);
    if (isODE(summary)) return summary.valueAtPoint.toFixed(6);
    if (isPDE(summary)) return summary.valueAtPoint.toFixed(6);
    if (isSDE(summary)) return `μ_T=${summary.terminalMean.toFixed(6)}`;
    if ("matrix" in summary) return `${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`;
    return `n=${summary.maxOrder}`;
}

export function buildDifferentialReportExecutiveCards(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
    trustScore: number,
    benchmarkSummary: DifferentialBenchmarkSummary | null,
): DifferentialMetricCard[] {
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
        } else if (isODE(summary)) {
            mainResult = `y(T) = ${summary.valueAtPoint.toFixed(4)}`;
        } else if (isPDE(summary)) {
            mainResult = `${summary.family} profile`;
        } else if (isSDE(summary)) {
            mainResult = `E[X(T)] = ${summary.terminalMean.toFixed(4)}`;
        }
    }

    const benchmarkTone: "success" | "warn" = benchmarkSummary?.status === "verified" ? "success" : "warn";
    return [
        { eyebrow: "Mode", value: mode.toUpperCase(), detail: "Derivative resolution", tone: "neutral" },
        { eyebrow: "Result", value: mainResult, detail: "Final computation", tone: "success" },
        { eyebrow: "Trust Score", value: String(trustScore), detail: "Methodological safety", tone: trustScore >= 85 ? "success" : trustScore >= 65 ? "info" : "warn" },
        ...(benchmarkSummary ? [{ eyebrow: "Benchmark", value: benchmarkSummary.status, detail: benchmarkSummary.label, tone: benchmarkTone }] : []),
    ];
}

export function buildDifferentialReportSupportCards(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
    benchmarkSummary: DifferentialBenchmarkSummary | null,
): DifferentialMetricCard[] {
    const points = summary && "samples" in summary ? summary.samples.length : 0;
    const benchmarkTone: "success" | "warn" = benchmarkSummary?.status === "verified" ? "success" : "warn";
    return [
        { eyebrow: "Points", value: String(points), detail: mode === "ode" || mode === "pde" || mode === "sde" ? "Visualizer samples live in lane renderer" : "Trace density", tone: "neutral" },
        { eyebrow: "Format", value: "Markdown", detail: "Export readiness", tone: "info" },
        {
            eyebrow: "Diagnostics",
            value: analyticSolution?.diagnostics?.contract?.readiness_label ?? (isODE(summary) ? summary.stabilityLabel : isPDE(summary) ? `${summary.family}:${summary.stabilityRatio.toFixed(3)}` : isSDE(summary) ? `${summary.pathCount} paths` : analyticSolution?.diagnostics?.matrix?.critical_point_type ?? analyticSolution?.diagnostics?.differentiability ?? "ready"),
            detail: "Research note payload",
            tone: "neutral",
        },
        {
            eyebrow: "Contract",
            value: analyticSolution?.diagnostics?.contract?.status ?? "n/a",
            detail: analyticSolution?.diagnostics?.contract?.risk_level
                ? `${analyticSolution.diagnostics.contract.completeness ?? "n/a"} · risk ${analyticSolution.diagnostics.contract.risk_level}`
                : analyticSolution?.diagnostics?.contract?.completeness ?? "Lane validation contract",
            tone: analyticSolution?.diagnostics?.contract?.status === "error" ? "warn" : "neutral",
        },
        ...(benchmarkSummary ? [{
            eyebrow: "Benchmark",
            value: benchmarkSummary.status,
            detail: benchmarkSummary.detail,
            tone: benchmarkTone,
        }] : []),
    ];
}

export function buildDifferentialMethodTableRows(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
): string[][] {
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

    if (isODE(summary)) {
        return [
            ["Family", summary.family, "ODE interpretation lane"],
            ["Equilibria", summary.equilibriumPoints.length ? summary.equilibriumPoints.map((item) => item.toFixed(2)).join(", ") : "none", "Phase-line roots"],
            ["Stability", summary.stabilityLabel, "Local phase read"],
        ];
    }

    if (isPDE(summary)) {
        return [
            ["Family", summary.family, "PDE numeric lane"],
            ["Grid", `${summary.grid.nx}x${summary.grid.nt}`, "Space-time resolution"],
            ["Ratio", summary.stabilityRatio.toFixed(4), "Explicit stability indicator"],
        ];
    }

    if (isSDE(summary)) {
        return [
            ["Paths", String(summary.pathCount), "Monte Carlo ensemble"],
            ["Mean", summary.terminalMean.toFixed(6), "Terminal expectation"],
            ["Std", summary.terminalStd.toFixed(6), "Terminal dispersion"],
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
        const primaryRate = "tangentLine" in summary ? summary.tangentLine.slope : summary.partialAtPoint;
        return [
            ["f(point)", summary.valueAtPoint.toFixed(6), "Primary computation"],
            ["Primary rate", primaryRate.toFixed(6), "First-order response"],
            ["Lane", summary.type === "partial" ? `∂/∂${summary.variable}` : "Ordinary derivative", "Active 2D lane"],
        ];
    }

    return [["-", "-", "-"]];
}

export function buildDifferentialSampleTableRows(
    summary: DifferentialComputationSummary | null,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    mode: DifferentialExtendedMode,
): string[][] {
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

    if (isSDE(summary)) {
        return summary.terminalHistogram.map((sample) => [
            sample.x.toFixed(4),
            sample.y.toFixed(0),
        ]);
    }

    return (summary.samples as PlotPoint[]).map((sample) => [
        (sample.x ?? 0).toFixed(4),
        (sample.y ?? 0).toFixed(4),
    ]);
}
