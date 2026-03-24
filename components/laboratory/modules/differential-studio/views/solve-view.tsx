import React from "react";
import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
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
                          : solvedSummary.trace.toFixed(4);

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
                          : "Hessian Trace";

        return [
            { eyebrow: primaryLabel, value: primaryValue, detail: "Primary result", tone: "success" as const },
            { eyebrow: "Evaluation at Point", value: pointValue, detail: `p = ${point}`, tone: "info" as const },
            { eyebrow: "Solver Node", value: analyticSolution?.status === "exact" ? "Analytic + Numeric" : "Numeric Fallback", detail: "Hybrid pipeline active", tone: "neutral" as const },
            { eyebrow: "Status", value: isResultStale ? "Needs refresh" : "Stable", detail: "Current solve state", tone: isResultStale ? "warn" as const : "neutral" as const },
        ] satisfies DifferentialMetricCard[];
    }, [analyticSolution, isResultStale, point, summary]);

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

    return (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
                <SolverControl state={state} actions={actions} />

                {classification.kind !== "ordinary_derivative"
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
                ) : null}

                {solvePhase === "analytic-loading" ? (
                    <div className="site-panel rounded-3xl p-5 py-10 text-center text-muted-foreground animate-pulse">
                        Solving differential pipeline...
                    </div>
                ) : (summary || analyticSolution) ? (
                    <div className="space-y-5">
                        {hasAnalytic && (
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
                        )}

                        {isMatrixSummary ? (
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
                        ) : !hasAnalytic ? (
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
                                        result="Local response evaluated with O(h^2) truncation behaviour"
                                        formula="\frac{f(x+h) - f(x-h)}{2h}"
                                        tone="success"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="space-y-6">
                <div className="relative">
                    {staleOverlay}
                    <div className={staleClass}>
                        <VisualizerDeck state={state as import("../components/visualizer-deck").VisualizerDeckState} />
                    </div>
                </div>

                {summary && (
                    <div className="relative">
                        {staleOverlay}
                        <div className={`grid gap-5 ${staleClass}`}>
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

                            <div className="site-panel space-y-4 p-5">
                                <div className="site-eyebrow text-sky-600">Dual Core Audit</div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {methodAuditCards.map((card) => (
                                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                    ))}
                                </div>
                            </div>

                            {visibleSignals.length > 0 && (
                                <LaboratorySignalPanel
                                    eyebrow="Runtime Diagnostics"
                                    title="Evaluation Signals"
                                    items={visibleSignals.map((signal) => ({
                                        label: signal.label,
                                        text: signal.text || "",
                                        tone: (signal.tone === "error" ? "danger" : signal.tone) as Extract<import("@/components/laboratory/laboratory-signal-panel").LaboratorySignalTone, "warn" | "info" | "danger" | "neutral">,
                                    }))}
                                />
                            )}

                            <div className="site-panel space-y-4 p-5">
                                <div className="site-eyebrow text-amber-600">Assumptions Active</div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {assumptionsCards.map((card) => (
                                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
