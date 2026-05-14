import React from "react";
import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySolveLayout } from "@/components/laboratory/laboratory-solve-layout";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { MethodSelector } from "@/components/laboratory/method-selector/method-selector";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";
import { MatrixResultPanel } from "../components/matrix-result-panel";
import {
    DifferentialComputationSummary,
    DifferentialMetricCard,
    DifferentialValidationSignal,
    DifferentialAnalyticSolveResponse,
    DifferentialCoordinateSystem,
    DifferentialClassification,
    DifferentialExtendedMode,
} from "../types";

interface SolveViewState {
    summary: DifferentialComputationSummary | null;
    point: string;
    expression: string;
    variable: string;
    order: string;
    direction: string;
    coordinates: DifferentialCoordinateSystem;
    mode: DifferentialExtendedMode;
    classification: DifferentialClassification;
    isResultStale: boolean;
    analyticSolution: DifferentialAnalyticSolveResponse | null;
    solvePhase: string;
    error: string;
    solveErrorMessage: string;
}

interface SolveViewActions {
    setExpression: (value: string) => void;
    setVariable: (value: string) => void;
    setPoint: (value: string) => void;
    setOrder: (value: string) => void;
    setDirection: (value: string) => void;
    setMode: (value: DifferentialExtendedMode) => void;
    requestSolve: () => void;
}

interface SolveViewProps {
    state: SolveViewState;
    actions: SolveViewActions;
    visibleSignals?: DifferentialValidationSignal[];
}

export function SolveView({ state, actions, visibleSignals = [] }: SolveViewProps) {
    const { summary, point, expression, isResultStale, analyticSolution, solvePhase, classification } = state;
    const [selectedResearchMethod, setSelectedResearchMethod] = React.useState("auto");
    const isMatrixSummary = summary?.type === "jacobian" || summary?.type === "hessian";
    const hasAnalytic = analyticSolution?.status === "exact" && (analyticSolution?.exact?.steps?.length ?? 0) > 0;
    const exactSteps = analyticSolution?.exact?.steps || [];

    const solveOverviewCards = React.useMemo(() => {
        const activeSummary = summary;

        if (!activeSummary && !analyticSolution) {
            return [] as DifferentialMetricCard[];
        }

        if (!activeSummary && analyticSolution) {
            return [
                {
                    eyebrow: "Lane",
                    value: state.mode.toUpperCase(),
                    detail: analyticSolution.exact?.method_label ?? "Backend lane",
                    tone: "info" as const,
                },
                {
                    eyebrow: "Result",
                    value: analyticSolution.exact?.numeric_approximation ?? "symbolic",
                    detail: analyticSolution.message,
                    tone: "success" as const,
                },
                {
                    eyebrow: "Status",
                    value: analyticSolution.status === "exact" ? "Solved" : "Needs numerical",
                    detail: "Specialized differential family",
                    tone: analyticSolution.status === "exact" ? "success" as const : "warn" as const,
                },
                {
                    eyebrow: "Method",
                    value: analyticSolution.exact?.method_label ?? "Custom lane",
                    detail: "Dedicated backend solver",
                    tone: "neutral" as const,
                },
            ] satisfies DifferentialMetricCard[];
        }

        const solvedSummary: DifferentialComputationSummary = activeSummary!;

        const pointValue =
            "valueAtPoint" in solvedSummary
                ? Array.isArray(solvedSummary.valueAtPoint)
                    ? `[${solvedSummary.valueAtPoint.map((value) => value.toFixed(4)).join(", ")}]`
                    : solvedSummary.valueAtPoint.toFixed(4)
                : "N/A";

        const primaryValue =
            solvedSummary.type === "derivative"
                ? solvedSummary.derivativeAtPoint.toFixed(4)
                : solvedSummary.type === "partial"
                  ? solvedSummary.partialAtPoint.toFixed(4)
                  : solvedSummary.type === "gradient"
                    ? solvedSummary.magnitude.toFixed(4)
                    : solvedSummary.type === "directional"
                      ? solvedSummary.directionalDerivative.toFixed(4)
                      : solvedSummary.type === "higher_order"
                        ? `n = ${solvedSummary.maxOrder}`
                        : solvedSummary.type === "jacobian"
                          ? solvedSummary.determinant != null
                              ? solvedSummary.determinant.toFixed(4)
                              : `${solvedSummary.size.rows}x${solvedSummary.size.cols}`
                          : solvedSummary.type === "hessian"
                            ? solvedSummary.trace.toFixed(4)
                            : solvedSummary.type === "ode"
                              ? solvedSummary.valueAtPoint.toFixed(4)
                              : solvedSummary.type === "pde"
                                ? solvedSummary.stabilityRatio.toFixed(4)
                                : solvedSummary.terminalMean.toFixed(4);

        const primaryLabel =
            solvedSummary.type === "derivative"
                ? "Derivative Slope"
                : solvedSummary.type === "partial"
                  ? "Partial Rate"
                  : solvedSummary.type === "gradient"
                    ? "Gradient Magnitude"
                    : solvedSummary.type === "directional"
                      ? "Directional Rate"
                      : solvedSummary.type === "higher_order"
                        ? "Taylor Order"
                        : solvedSummary.type === "jacobian"
                          ? "Jacobian Result"
                          : solvedSummary.type === "hessian"
                            ? "Hessian Trace"
                            : solvedSummary.type === "ode"
                              ? "Terminal State"
                              : solvedSummary.type === "pde"
                                ? "Stability Ratio"
                                : "Terminal Mean";

        return [
            { eyebrow: primaryLabel, value: primaryValue, detail: "Primary result", tone: "success" as const },
            { eyebrow: "Evaluation at Point", value: pointValue, detail: `p = ${point}`, tone: "info" as const },
            { eyebrow: "Solver Node", value: analyticSolution?.status === "exact" ? "Analytic + Numeric" : "Numeric Fallback", detail: "Hybrid pipeline active", tone: "neutral" as const },
            { eyebrow: "Status", value: isResultStale ? "Needs refresh" : "Stable", detail: "Current solve state", tone: isResultStale ? "warn" as const : "neutral" as const },
        ] satisfies DifferentialMetricCard[];
    }, [analyticSolution, isResultStale, point, state.mode, summary]);

    const methodAuditCards = React.useMemo(
        () => [
            { eyebrow: "Numeric Core", value: "Finite diff", detail: "Central approximation", tone: "neutral" as const },
            { eyebrow: "Analytic Core", value: "SymPy", detail: "Symbolic exact", tone: "info" as const },
            { eyebrow: "Precision", value: "O(h^2)", detail: "Truncation bound", tone: "neutral" as const },
        ] satisfies DifferentialMetricCard[],
        [],
    );

    const assumptionsCards = React.useMemo(
        () => [
            {
                eyebrow: "Continuity",
                value: analyticSolution?.diagnostics?.continuity ?? "Assumed",
                detail: "Local regularity signal",
                tone: "info" as const,
            },
            {
                eyebrow: "Differentiability",
                value: analyticSolution?.diagnostics?.differentiability ?? "Expected",
                detail: "Derivative lane assumption",
                tone: "neutral" as const,
            },
        ] satisfies DifferentialMetricCard[],
        [analyticSolution],
    );

    const resultPanelMarkdown = React.useMemo(() => {
        if (!summary && !analyticSolution) return "";

        const lines: string[] = ["### Final Result"];

        if (analyticSolution?.status === "exact") {
            lines.push(`- **Solve lane:** analytic + numeric verification`);
            if (analyticSolution.exact?.derivative_latex) {
                lines.push(`- **Analytic form:** $${analyticSolution.exact.derivative_latex}$`);
            }
            if (analyticSolution.exact?.evaluated_latex) {
                lines.push(`- **Evaluated at point:** $${analyticSolution.exact.evaluated_latex}$`);
            }
            if (analyticSolution.exact?.numeric_approximation) {
                lines.push(`- **Numeric approximation:** \`${analyticSolution.exact.numeric_approximation}\``);
            }
        } else if (summary) {
            lines.push(`- **Solve lane:** numerical fallback`);
            if ("matrix" in summary) {
                lines.push(`- **Matrix size:** \`${summary.type === "jacobian" ? `${summary.size.rows}x${summary.size.cols}` : `${summary.size}x${summary.size}`}\``);
            } else if (summary.type === "ode") {
                lines.push(`- **Terminal state:** \`${summary.valueAtPoint.toFixed(6)}\``);
                lines.push(`- **Equilibria:** \`${summary.equilibriumPoints.map((value) => value.toFixed(3)).join(", ") || "none"}\``);
                lines.push(`- **Stability:** \`${summary.stabilityLabel}\``);
            } else if (summary.type === "pde") {
                lines.push(`- **Family:** \`${summary.family}\``);
                lines.push(`- **Mesh:** \`${summary.grid.nx}x${summary.grid.nt}\``);
                lines.push(`- **Stability ratio:** \`${summary.stabilityRatio.toFixed(4)}\``);
            } else if (summary.type === "sde") {
                lines.push(`- **Ensemble paths:** \`${summary.pathCount}\``);
                lines.push(`- **Terminal mean:** \`${summary.terminalMean.toFixed(6)}\``);
                lines.push(`- **Terminal std:** \`${summary.terminalStd.toFixed(6)}\``);
            } else if ("tangentLine" in summary) {
                lines.push(`- **Primary rate:** \`${summary.derivativeAtPoint.toFixed(6)}\``);
                lines.push(`- **f(point):** \`${summary.valueAtPoint.toFixed(6)}\``);
            } else if (summary.type === "partial") {
                lines.push(`- **Partial rate:** \`${summary.partialAtPoint.toFixed(6)}\``);
                lines.push(`- **f(point):** \`${summary.valueAtPoint.toFixed(6)}\``);
            } else if (summary.type === "gradient") {
                lines.push(`- **Gradient:** \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``);
                lines.push(`- **Magnitude:** \`${summary.magnitude.toFixed(6)}\``);
            } else if (summary.type === "directional") {
                lines.push(`- **Gradient:** \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``);
                lines.push(`- **Directional derivative:** \`${summary.directionalDerivative.toFixed(6)}\``);
            } else if (summary.type === "higher_order") {
                lines.push(`- **Taylor order:** \`${summary.maxOrder}\``);
                lines.push(`- **Series snapshot:** \`[${summary.derivatives.map((value) => value.toFixed(5)).join(", ")}]\``);
            }
        }

        if (analyticSolution?.message) {
            lines.push(`- **Solver note:** ${analyticSolution.message}`);
        }

        return lines.join("\n");
    }, [analyticSolution, summary]);

    const staleOverlay = isResultStale ? (
        <div className="absolute inset-0 z-10 rounded-3xl bg-background/50 backdrop-blur-[2px] pointer-events-none" />
    ) : null;
    const staleClass = isResultStale ? "opacity-40 grayscale focus-within:relative focus-within:z-20 focus-within:opacity-100 focus-within:grayscale-0" : "";
    const laneGuidanceSection =
        classification.kind !== "ordinary_derivative"
        && classification.kind !== "higher_order_derivative"
        && classification.kind !== "partial_derivative"
        && classification.kind !== "gradient_candidate"
        && classification.kind !== "directional_derivative"
        && classification.kind !== "jacobian_candidate"
        && classification.kind !== "hessian_candidate" ? (
            <LaboratoryMathPanel
                eyebrow="Lane Guidance"
                title={classification.label}
                content={[
                    `**Current reading:** ${classification.summary}`,
                    "",
                    ...(classification.notes ?? []).map((note: string) => `- ${note}`),
                ].join("\n")}
                accentClassName="text-amber-600 dark:text-amber-400"
            />
        ) : null;
    const derivationSection =
        solvePhase === "analytic-loading" ? (
            <div className="site-panel rounded-3xl p-5 py-10 text-center text-muted-foreground animate-pulse">
                Solving differential pipeline...
            </div>
        ) : hasAnalytic ? (
            <div className="relative">
                {staleOverlay}
                <div className={`grid gap-4 ${staleClass}`}>
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                        Analytic Derivation
                    </div>
                    {exactSteps.map((step, index) => (
                        <LaboratorySolveDetailCard
                            key={`${step.title}-${index}`}
                            id={String(index + 1)}
                            action={step.title}
                            result={step.summary}
                            formula={step.latex || ""}
                            tone={step.tone as "neutral" | "info" | "success" | "warn"}
                        />
                    ))}
                </div>
            </div>
        ) : summary ? (
            <div className="relative">
                {staleOverlay}
                <div className={`grid gap-4 ${staleClass}`}>
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                        Numerical Approximation
                    </div>
                    <LaboratorySolveDetailCard
                        id="1"
                        action="Method Tracing"
                        result={`Evaluating local differential structure of ${expression}`}
                        formula=""
                        tone="neutral"
                    />
                    <LaboratorySolveDetailCard
                        id="2"
                        action="Step (h) Selection"
                        result="Stable h = 1e-5 selected for the active 2D lane"
                        formula="h_{opt} \approx \sqrt{\epsilon}"
                        tone="info"
                    />
                    <LaboratorySolveDetailCard
                        id="3"
                        action="Central Difference"
                        result={
                            state.mode === "ode"
                                ? "RK4 trajectory and slope-field diagnostics computed from the parsed initial-value problem"
                                : state.mode === "pde"
                                  ? "Explicit space-time mesh evolved with a simple numeric lane for the active PDE family"
                                  : state.mode === "sde"
                                    ? "Euler-Maruyama ensemble generated with variance bands and terminal histogram"
                                    : "Local response evaluated with O(h^2) truncation behaviour"
                        }
                        formula={
                            state.mode === "ode"
                                ? "y_{n+1}=y_n+\\frac{h}{6}(k_1+2k_2+2k_3+k_4)"
                                : state.mode === "pde"
                                  ? "u_i^{n+1}=u_i^n+r(u_{i+1}^n-2u_i^n+u_{i-1}^n)"
                                  : state.mode === "sde"
                                    ? "X_{n+1}=X_n+\\mu\\Delta t+\\sigma\\Delta W_n"
                                    : "\\frac{f(x+h) - f(x-h)}{2h}"
                        }
                        tone="success"
                    />
                </div>
            </div>
        ) : null;
    const finalResultSection = summary ? (
        <div className="site-panel space-y-4 p-5">
            <div className="site-eyebrow text-accent">Final Result</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {solveOverviewCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
            {resultPanelMarkdown ? (
                <LaboratoryMathPanel
                    eyebrow="Result Capsule"
                    title={analyticSolution?.status === "exact" ? "Analytic Answer" : "Numerical Answer"}
                    content={resultPanelMarkdown}
                    accentClassName={analyticSolution?.status === "exact" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                />
            ) : null}
        </div>
    ) : null;
    const matrixResultSection = isMatrixSummary ? (
        <div className="relative">
            {staleOverlay}
            <div className={staleClass}>
                <MatrixResultPanel
                    summary={summary}
                    analyticSolution={analyticSolution}
                    title="Matrix Result"
                />
            </div>
        </div>
    ) : null;
    const methodAuditSection = (
        <div className="site-panel space-y-4 p-5">
            <div className="site-eyebrow text-sky-600">Dual Core Audit</div>
            <div className="grid gap-3 sm:grid-cols-3">
                {methodAuditCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );
    const verificationSection = (
        <div className="site-panel space-y-4 p-5">
            <div className="site-eyebrow text-emerald-600">Verification / Proof Layer</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                    {
                        eyebrow: "ODE residual",
                        value: state.mode === "ode" ? "tracked" : "n/a",
                        detail: state.mode === "ode" ? "Solution should satisfy y' - f(x,y) ~= 0; numeric lanes require tolerance audit." : "Residual check activates on ODE lanes.",
                        tone: state.mode === "ode" ? "info" as const : "neutral" as const,
                    },
                    {
                        eyebrow: "Substitution check",
                        value: analyticSolution?.status === "exact" ? "available" : "pending",
                        detail: "Exact differential forms can be substituted back into the original equation.",
                        tone: analyticSolution?.status === "exact" ? "success" as const : "warn" as const,
                    },
                    {
                        eyebrow: "Initial condition",
                        value: /[yx]\(0\)|[yx]\(/i.test(`${expression};${point}`) ? "provided" : "missing",
                        detail: /[yx]\(0\)|[yx]\(/i.test(`${expression};${point}`) ? "Initial/boundary data signal detected." : "C constant or trajectory seed should be stated explicitly.",
                        tone: /[yx]\(0\)|[yx]\(/i.test(`${expression};${point}`) ? "success" as const : "warn" as const,
                    },
                    {
                        eyebrow: "Numerical stability",
                        value: summary?.type === "ode" ? summary.stabilityLabel : summary?.type === "pde" ? String(summary.stabilityRatio.toFixed(3)) : "watch",
                        detail: "RK/solve_ivp/PDE lanes should compare step-size sensitivity before publication.",
                        tone: summary?.type === "pde" && summary.stabilityRatio > 0.5 ? "warn" as const : "info" as const,
                    },
                    {
                        eyebrow: "Domain warning",
                        value: analyticSolution?.diagnostics?.contract?.risk_level ?? "pending",
                        detail: (analyticSolution?.diagnostics?.contract?.review_notes ?? [])[0] ?? "No explicit domain warning emitted yet.",
                        tone: analyticSolution?.diagnostics?.contract?.risk_level === "low" ? "success" as const : "warn" as const,
                    },
                ].map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );
    const signalsSection = visibleSignals.length > 0 ? (
        <LaboratorySignalPanel
            eyebrow="Runtime Diagnostics"
            title="Evaluation Signals"
            items={visibleSignals.map((signal) => ({
                label: signal.label,
                text: signal.text || "",
                tone: (signal.tone === "error" ? "danger" : signal.tone) as Extract<import("@/components/laboratory/laboratory-signal-panel").LaboratorySignalTone, "warn" | "info" | "danger" | "neutral">,
            }))}
        />
    ) : null;
    const assumptionsSection = (
        <div className="site-panel space-y-4 p-5">
            <div className="site-eyebrow text-amber-600">Assumptions Active</div>
            <div className="grid gap-3 sm:grid-cols-2">
                {assumptionsCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );

    return (
        <LaboratorySolveLayout
            control={
                <div className="space-y-6">
                    <SolverControl state={state} actions={actions} />
                    {laneGuidanceSection}
                </div>
            }
            visual={
                <div className="relative">
                    {staleOverlay}
                    <div className={staleClass}>
                        <VisualizerDeck state={state as import("../components/visualizer-deck").VisualizerDeckState} />
                    </div>
                </div>
            }
            derivation={derivationSection}
            sections={[
                finalResultSection ? { id: "final-result", node: finalResultSection, weight: 2 } : null,
                matrixResultSection ? { id: "matrix-result", node: matrixResultSection, weight: 2 } : null,
                {
                    id: "method-selector",
                    node: (
                        <MethodSelector
                            title="Differential / ODE method"
                            value={selectedResearchMethod}
                            options={getLaboratoryMethodOptions("differential")}
                            onChange={setSelectedResearchMethod}
                        />
                    ),
                    weight: 1,
                },
                { id: "method-audit", node: methodAuditSection, weight: 1 },
                { id: "verification", node: verificationSection, weight: 1 },
                signalsSection ? { id: "signals", node: signalsSection, weight: 1 } : null,
                { id: "assumptions", node: assumptionsSection, weight: 1 },
            ].filter(Boolean) as { id: string; node: React.ReactNode; weight?: number }[]}
        />
    );
}
