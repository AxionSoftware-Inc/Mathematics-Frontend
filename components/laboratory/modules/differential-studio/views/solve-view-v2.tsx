import React from "react";

import { LaboratoryReferenceSolveShell } from "@/components/laboratory/laboratory-reference-solve-shell";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { DifferentialProblemComposerV2 } from "../components/differential-problem-composer-v2";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { DifferentialComputationSummary, DifferentialValidationSignal, DifferentialExtendedMode } from "../types";

type Props = {
    state: {
        summary: DifferentialComputationSummary | null;
        point: string;
        expression: string;
        variable: string;
        order: string;
        direction: string;
        coordinates: import("../types").DifferentialCoordinateSystem;
        mode: DifferentialExtendedMode;
        classification: import("../types").DifferentialClassification;
        isResultStale: boolean;
        analyticSolution: import("../types").DifferentialAnalyticSolveResponse | null;
        solvePhase: string;
        error: string;
        solveErrorMessage: string;
        experienceLevel?: string;
    };
    actions: {
        setExpression: (value: string) => void;
        setVariable: (value: string) => void;
        setPoint: (value: string) => void;
        setOrder: (value: string) => void;
        setDirection: (value: string) => void;
        setMode: (value: DifferentialExtendedMode) => void;
        requestSolve: () => void;
    };
    visibleSignals?: DifferentialValidationSignal[];
};

function resultValue(summary: DifferentialComputationSummary | null, analytic: Props["state"]["analyticSolution"]) {
    if (analytic?.exact?.numeric_approximation) return analytic.exact.numeric_approximation;
    if (!summary) return "pending";
    if (summary.type === "ode") return summary.valueAtPoint.toFixed(6);
    if (summary.type === "pde") return `${summary.family} · ${summary.grid.nx}×${summary.grid.nt}`;
    if (summary.type === "sde") return summary.terminalMean.toFixed(6);
    if (summary.type === "gradient") return summary.magnitude.toFixed(6);
    if (summary.type === "directional") return summary.directionalDerivative.toFixed(6);
    if (summary.type === "higher_order") return `order ${summary.maxOrder}`;
    if (summary.type === "jacobian") return summary.determinant != null ? summary.determinant.toFixed(6) : `${summary.size.rows}×${summary.size.cols}`;
    if (summary.type === "hessian") return summary.trace.toFixed(6);
    if ("partialAtPoint" in summary) return summary.partialAtPoint.toFixed(6);
    if ("derivativeAtPoint" in summary) return summary.derivativeAtPoint.toFixed(6);
    return "ready";
}

function secondaryValue(summary: DifferentialComputationSummary | null) {
    if (!summary) return "pending";
    if (summary.type === "ode") return summary.stabilityLabel;
    if (summary.type === "pde") return `r = ${summary.stabilityRatio.toFixed(4)}`;
    if (summary.type === "sde") return `σ = ${summary.terminalStd.toFixed(4)}`;
    if (summary.type === "gradient") return `[${summary.gradient.map((value) => value.toFixed(3)).join(", ")}]`;
    if (summary.type === "directional") return `[${summary.gradient.map((value) => value.toFixed(3)).join(", ")}]`;
    if (summary.type === "jacobian" || summary.type === "hessian") return `${summary.matrix.length}×${summary.matrix[0]?.length ?? summary.matrix.length}`;
    return "local evaluation";
}

export function SolveViewV2({ state, actions, visibleSignals = [] }: Props) {
    const exactSteps = state.analyticSolution?.exact?.steps ?? [];
    const hasExact = state.analyticSolution?.status === "exact";
    const primaryCards = [
        {
            eyebrow: "Result",
            value: resultValue(state.summary, state.analyticSolution),
            detail: hasExact ? "Analytic result" : "Current solve output",
            tone: hasExact ? "success" as const : "info" as const,
        },
        {
            eyebrow: "Mode",
            value: state.mode.toUpperCase(),
            detail: state.classification.label,
            tone: "neutral" as const,
        },
        {
            eyebrow: "Structure",
            value: secondaryValue(state.summary),
            detail: "Primary structural signal",
            tone: "neutral" as const,
        },
        {
            eyebrow: "State",
            value: state.isResultStale ? "Needs update" : state.solvePhase === "analytic-loading" ? "Solving" : "Ready",
            detail: state.solveErrorMessage || "Current input state",
            tone: state.solveErrorMessage ? "warn" as const : state.isResultStale ? "warn" as const : "success" as const,
        },
    ];

    const result = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Result</div>
                    <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Primary result</div>
                </div>
                <div className="text-[10px] text-[#949ba5]">Symbolic first · numerical when required</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {primaryCards.map((card) => <LaboratoryMetricCard key={card.eyebrow} {...card} />)}
            </div>
        </section>
    );

    const interpretation = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white p-4">
            <LaboratoryMathPanel
                eyebrow={hasExact ? "Analytic interpretation" : "Numerical interpretation"}
                title={state.analyticSolution?.exact?.method_label ?? state.classification.label}
                content={[
                    state.analyticSolution?.exact?.derivative_latex ? `**Result:** ${state.analyticSolution.exact.derivative_latex}` : null,
                    state.analyticSolution?.exact?.evaluated_latex ? `**At point:** ${state.analyticSolution.exact.evaluated_latex}` : null,
                    state.analyticSolution?.message ? `**Solver note:** ${state.analyticSolution.message}` : null,
                    !state.analyticSolution?.message ? `**Reading:** ${state.classification.summary}` : null,
                ].filter(Boolean).join("\n\n")}
                accentClassName={hasExact ? "text-emerald-600" : "text-[#184eb8]"}
            />
        </section>
    );

    const advanced = (
        <div className="space-y-4">
            {exactSteps.length ? (
                <div className="space-y-2">
                    {exactSteps.map((step, index) => (
                        <LaboratorySolveDetailCard
                            key={`${step.title}-${index}`}
                            id={String(index + 1)}
                            action={step.title}
                            result={step.summary}
                            formula={step.latex || undefined}
                            tone={(step.tone as "neutral" | "info" | "success" | "warn") ?? "neutral"}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-[8px] border border-[#e2e6ec] bg-[#fcfdff] px-4 py-3 text-[12px] leading-5 text-[#68717d]">
                    Detailed symbolic steps will appear here when the active solver emits a derivation trace.
                </div>
            )}
            {visibleSignals.length ? (
                <LaboratorySignalPanel
                    eyebrow="Runtime diagnostics"
                    title="Validation and solver state"
                    items={visibleSignals.map((signal) => ({
                        label: signal.label,
                        text: signal.text || "",
                        tone: (signal.tone === "error" ? "danger" : signal.tone) as "neutral" | "info" | "warn" | "danger",
                    }))}
                />
            ) : null}
        </div>
    );

    return (
        <LaboratoryReferenceSolveShell
            composer={<DifferentialProblemComposerV2 state={state} actions={actions} />}
            visual={<VisualizerDeck state={state as import("../components/visualizer-deck").VisualizerDeckState} />}
            result={result}
            interpretation={interpretation}
            advanced={advanced}
            visualHint="Function, slope, field or trajectory depending on the active lane"
            advancedOpen={state.experienceLevel === "research"}
        />
    );
}
