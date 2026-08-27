import React from "react";

import { LaboratoryReferenceSolveShell } from "@/components/laboratory/laboratory-reference-solve-shell";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { SeriesLimitProblemComposerV2 } from "../components/series-limit-problem-composer-v2";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { SeriesLimitStudioState } from "../types";

export function SolveViewV2({
    state,
    actions,
}: {
    state: SeriesLimitStudioState;
    actions: {
        setMode: (value: SeriesLimitStudioState["mode"]) => void;
        setExpression: (value: string) => void;
        setAuxiliaryExpression: (value: string) => void;
        setDimension: (value: string) => void;
    };
}) {
    const metrics = buildMetricCards(state);
    const primary = metrics.slice(0, 4);
    const support = metrics.slice(4);
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const finalFormula = state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? undefined;
    const auxiliaryFormula = state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? undefined;
    const steps = state.analyticSolution?.exact.steps?.length ? state.analyticSolution.exact.steps : state.result.steps;

    const result = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Result</div>
                    <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Asymptotic result</div>
                </div>
                <div className="text-[10px] text-[#949ba5]">Limit or convergence signal first</div>
            </div>
            {finalFormula ? (
                <div className="mb-3 overflow-x-auto rounded-[8px] border border-[#dfe4ea] bg-[#f8fafe] px-4 py-3 text-[13px] text-[#20242b]">
                    <LaboratoryInlineMathMarkdown content={toMathMarkdown(finalFormula)} />
                </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {primary.map((card) => <LaboratoryMetricCard key={card.eyebrow} {...card} />)}
            </div>
        </section>
    );

    const interpretation = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white p-4">
            <LaboratoryMathPanel
                eyebrow={hasAnalytic ? "Analytic interpretation" : "Asymptotic interpretation"}
                title={state.analyticSolution?.exact.method_label ?? modeTitle(state.mode)}
                content={[
                    auxiliaryFormula ? `**Supporting form:** ${auxiliaryFormula}` : null,
                    state.summary.convergenceSignal ? `**Convergence:** ${state.summary.convergenceSignal}` : null,
                    state.summary.proofSignal ? `**Proof signal:** ${state.summary.proofSignal}` : null,
                    state.summary.errorBoundSignal ? `**Error bound:** ${state.summary.errorBoundSignal}` : null,
                    state.summary.riskSignal ? `**Risk:** ${state.summary.riskSignal}` : null,
                    !auxiliaryFormula && !state.summary.convergenceSignal && !state.summary.proofSignal ? "The visualization above is the primary behavior view for the active expression." : null,
                ].filter(Boolean).join("\n\n")}
                accentClassName={hasAnalytic ? "text-emerald-600" : "text-[#184eb8]"}
            />
        </section>
    );

    const advanced = (
        <div className="space-y-4">
            {support.length ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {support.map((card) => <LaboratoryMetricCard key={card.eyebrow} {...card} />)}
                </div>
            ) : null}
            {steps?.length ? (
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <LaboratorySolveDetailCard
                            key={`${step.title}-${index}`}
                            id={String(index + 1)}
                            action={step.title}
                            result={step.summary}
                            formula={step.latex ?? undefined}
                            tone="neutral"
                        />
                    ))}
                </div>
            ) : null}
            {state.experienceLevel === "research" && state.analyticSolution ? (
                <div className="grid gap-3 lg:grid-cols-3">
                    <FormulaCard label="Parsed input" value={state.analyticSolution.parser.expression_latex || state.analyticSolution.parser.expression_raw} />
                    <FormulaCard label="Final form" value={state.analyticSolution.exact.result_latex ?? "pending"} />
                    <FormulaCard label="Auxiliary form" value={state.analyticSolution.exact.auxiliary_latex ?? "pending"} />
                </div>
            ) : null}
        </div>
    );

    return (
        <LaboratoryReferenceSolveShell
            composer={
                <SeriesLimitProblemComposerV2
                    mode={state.mode}
                    setMode={actions.setMode}
                    expression={state.expression}
                    setExpression={actions.setExpression}
                    auxiliaryExpression={state.auxiliaryExpression}
                    setAuxiliaryExpression={actions.setAuxiliaryExpression}
                    dimension={state.dimension}
                    setDimension={actions.setDimension}
                    experienceLevel={state.experienceLevel}
                    activePresetLabel={state.activePresetLabel}
                    summary={state.summary}
                />
            }
            visual={<VisualizerDeck mode={state.mode} dimension={state.dimension} result={state.result} summary={state.summary} />}
            result={result}
            interpretation={interpretation}
            advanced={advanced}
            visualHint="Local behavior, partial sums or convergence geometry"
            advancedOpen={state.experienceLevel === "research"}
        />
    );
}

function modeTitle(mode: SeriesLimitStudioState["mode"]) {
    if (mode === "limits") return "Limit analysis";
    if (mode === "sequences") return "Sequence analysis";
    if (mode === "series") return "Series analysis";
    if (mode === "convergence") return "Convergence audit";
    return "Power series";
}

function buildMetricCards(state: SeriesLimitStudioState) {
    if (state.mode === "limits") {
        return [
            { eyebrow: "Limit", value: state.summary.candidateResult ?? "pending", detail: "Candidate limit", tone: "success" as const },
            { eyebrow: "Family", value: state.summary.detectedFamily ?? "pending", detail: "Detected family", tone: "info" as const },
            { eyebrow: "Asymptotic", value: state.summary.asymptoticSignal ?? "pending", detail: "Local behavior", tone: "neutral" as const },
            { eyebrow: "Proof lane", value: state.summary.proofSignal ?? "pending", detail: "Proof strategy", tone: "neutral" as const },
            { eyebrow: "Error bound", value: state.summary.errorBoundSignal ?? "pending", detail: "Approximation control", tone: "neutral" as const },
            { eyebrow: "Expansion", value: state.summary.expansionSignal ?? "pending", detail: "Local expansion", tone: "neutral" as const },
            { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Domain / singularity risk", tone: "warn" as const },
        ];
    }
    if (state.mode === "sequences") {
        return [
            { eyebrow: "Tail limit", value: state.summary.candidateResult ?? "pending", detail: "Sequence tail", tone: "success" as const },
            { eyebrow: "Monotonicity", value: state.summary.monotonicity ?? "pending", detail: "Monotone behavior", tone: "info" as const },
            { eyebrow: "Boundedness", value: state.summary.boundedness ?? "pending", detail: "Boundedness", tone: "neutral" as const },
            { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Convergence risk", tone: "warn" as const },
            { eyebrow: "Expansion", value: state.summary.expansionSignal ?? "pending", detail: "Tail expansion", tone: "neutral" as const },
        ];
    }
    if (state.mode === "power-series") {
        return [
            { eyebrow: "Radius", value: state.summary.radiusSignal ?? "pending", detail: "Radius of convergence", tone: "success" as const },
            { eyebrow: "Interval", value: state.summary.intervalSignal ?? "pending", detail: "Convergence interval", tone: "info" as const },
            { eyebrow: "Endpoints", value: state.summary.endpointSignal ?? "pending", detail: "Endpoint behavior", tone: "neutral" as const },
            { eyebrow: "Partial sum", value: state.summary.partialSumSignal ?? "pending", detail: "Current approximation", tone: "neutral" as const },
            { eyebrow: "Expansion", value: state.summary.expansionSignal ?? "pending", detail: "Series expansion", tone: "neutral" as const },
        ];
    }
    return [
        { eyebrow: "Convergence", value: state.summary.convergenceSignal ?? "pending", detail: "Primary convergence signal", tone: "success" as const },
        { eyebrow: "Family", value: state.summary.detectedFamily ?? "pending", detail: "Detected family", tone: "info" as const },
        { eyebrow: "Test", value: state.summary.testFamily ?? "pending", detail: "Primary test", tone: "neutral" as const },
        { eyebrow: "Partial sum", value: state.summary.partialSumSignal ?? "pending", detail: "Finite approximation", tone: "neutral" as const },
        { eyebrow: "Secondary test", value: state.summary.secondaryTestFamily ?? "pending", detail: "Cross-check", tone: "neutral" as const },
        { eyebrow: "Dominant term", value: state.summary.dominantTerm ?? "pending", detail: "Asymptotic driver", tone: "neutral" as const },
        { eyebrow: "Error bound", value: state.summary.errorBoundSignal ?? "pending", detail: "Approximation bound", tone: "neutral" as const },
        { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Convergence risk", tone: "warn" as const },
    ];
}

function FormulaCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[8px] border border-[#e2e6ec] bg-[#fcfdff] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#747d88]">{label}</div>
            <div className="mt-2 overflow-x-auto text-[12px] text-[#303640]">
                <LaboratoryInlineMathMarkdown content={toMathMarkdown(value)} />
            </div>
        </div>
    );
}

function toMathMarkdown(value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "pending") return trimmed || "pending";
    if (trimmed.includes("$$") || trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) return trimmed;
    return `$$${trimmed}$$`;
}
