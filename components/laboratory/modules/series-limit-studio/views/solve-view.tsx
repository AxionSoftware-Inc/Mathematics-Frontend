import React from "react";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySolveLayout } from "@/components/laboratory/laboratory-solve-layout";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";

import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { SeriesLimitStudioState } from "../types";

export function SolveView({
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
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const [showNumericalDetails, setShowNumericalDetails] = React.useState(false);
    const finalFormula = state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? undefined;
    const auxiliaryFormula = state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? undefined;
    const derivationContent = hasAnalytic
        ? [
              `**Lane:** ${state.analyticSolution?.exact.method_label ?? "Analytic series / limit lane"}`,
              "",
              state.analyticSolution?.exact.result_latex ? `**Final form:** ${state.analyticSolution.exact.result_latex}` : null,
              state.analyticSolution?.exact.auxiliary_latex ? `**Auxiliary form:** ${state.analyticSolution.exact.auxiliary_latex}` : null,
              state.analyticSolution?.exact.numeric_approximation ? `**Approximation:** \`${state.analyticSolution.exact.numeric_approximation}\`` : null,
          ]
              .filter(Boolean)
              .join("\n")
        : [
              `**Analytic status:** symbolic answer topilmadi yoki yopiq shaklga kelmadi.`,
              "",
              `**Numerical lane:** local sampling, asymptotic audit va convergence signals tayyor.`,
              "",
              `Quyidagi tugma numerical derivation bosqichlarini ko'rsatadi.`,
          ].join("\n");
    const displayedSteps = hasAnalytic
        ? state.analyticSolution?.exact.steps ?? []
        : showNumericalDetails
          ? state.result.steps
          : [];
    const finalResultSection = (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Result Synthesis</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metrics.map((metric) => (
                    <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                ))}
            </div>
            {finalFormula ? (
                <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Formula</div>
                    <div className="mt-2 overflow-x-auto text-sm text-foreground">
                        <MathBlock value={finalFormula} fallback="Formula pending." />
                    </div>
                    {auxiliaryFormula ? (
                        <div className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                            <MathBlock value={auxiliaryFormula} fallback="Auxiliary formula pending." />
                        </div>
                    ) : null}
                </div>
            ) : null}
            {state.solveErrorMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    {state.solveErrorMessage}
                </div>
            ) : null}
        </div>
    );
    const methodTraceSection = (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Method Trace</div>
            <div className="mt-4 space-y-3">
                {displayedSteps.map((step, index) => (
                    <LaboratorySolveDetailCard
                        key={`${step.title}-${index}`}
                        id={String(index + 1)}
                        action={step.title}
                        result={step.summary}
                        formula={step.latex ?? undefined}
                        tone="neutral"
                    />
                ))}
                {!displayedSteps.length ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        Analytic derivation topilsa shu yerda chiqadi; bo‘lmasa numerical fallback tugmasi bosqichlarni ochadi.
                    </div>
                ) : null}
            </div>
        </div>
    );

    return (
        <LaboratorySolveLayout
            control={
                <SolverControl
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
            visual={<VisualizerDeck mode={state.mode} result={state.result} summary={state.summary} />}
            derivation={
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <LaboratoryMathPanel
                        eyebrow={hasAnalytic ? "Analytic Derivation" : "Numerical Fallback"}
                        title={hasAnalytic ? "Series / limit derivation" : "Analytic form unavailable"}
                        content={derivationContent}
                        accentClassName={hasAnalytic ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                    />
                    {!hasAnalytic ? (
                        <button
                            type="button"
                            onClick={() => setShowNumericalDetails((current) => !current)}
                            className="mt-4 inline-flex items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
                        >
                            {showNumericalDetails ? "Hide Numerical Steps" : "Run Numerical Solution View"}
                        </button>
                    ) : null}
                </div>
            }
            sections={[
                { id: "final-result", node: finalResultSection, weight: 2 },
                { id: "method-trace", node: methodTraceSection, weight: 2 },
                state.analyticSolution
                    ? {
                          id: "analytic-forms",
                          node: (
                              <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Analytic Forms</div>
                                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                                      <FormulaCard label="Parsed Input" value={state.analyticSolution.parser.expression_latex || state.analyticSolution.parser.expression_raw} />
                                      <FormulaCard label="Final Formula" value={state.analyticSolution.exact.result_latex ?? "pending"} />
                                      <FormulaCard label="Auxiliary Formula" value={state.analyticSolution.exact.auxiliary_latex ?? "pending"} />
                                  </div>
                              </div>
                          ),
                          weight: 2,
                      }
                    : null,
            ].filter(Boolean) as { id: string; node: React.ReactNode; weight?: number }[]}
        />
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    const renderAsMath = shouldRenderAsMath(label, value);

    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">
                {renderAsMath ? <MathBlock value={value} fallback="pending" compact /> : value}
            </div>
        </div>
    );
}

function FormulaCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-3 overflow-x-auto text-sm leading-7 text-foreground">
                <MathBlock value={value} fallback="pending" />
            </div>
        </div>
    );
}

function MathBlock({ value, fallback, compact = false }: { value?: string; fallback: string; compact?: boolean }) {
    if (!value?.trim() || value === "pending") {
        return <div className="text-sm text-muted-foreground">{fallback}</div>;
    }

    return <div className={compact ? "[&_.katex-display]:my-1" : undefined}><LaboratoryInlineMathMarkdown content={toMathMarkdown(value)} /></div>;
}

function shouldRenderAsMath(label: string, value: string) {
    if (!value || value === "pending") return false;
    if (["Expansion", "Limit", "Tail Limit", "Radius", "Interval", "Partial Sum", "Dominant Term"].includes(label)) return true;
    return /[\\^_{}]/.test(value);
}

function toMathMarkdown(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("$$")) return trimmed;
    if (trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) return trimmed;
    return `$$${trimmed}$$`;
}

function buildMetricCards(state: SeriesLimitStudioState) {
    if (state.mode === "limits") {
        return [
            { label: "Family", value: state.summary.detectedFamily ?? "pending" },
            { label: "Limit", value: state.summary.candidateResult ?? "pending" },
            { label: "Asymptotic", value: state.summary.asymptoticSignal ?? "pending" },
            { label: "Proof Lane", value: state.summary.proofSignal ?? "pending" },
            { label: "Error Bound", value: state.summary.errorBoundSignal ?? "pending" },
            { label: "Research Family", value: state.summary.specialFamilySignal ?? "pending" },
            { label: "Expansion", value: state.summary.expansionSignal ?? "pending" },
            { label: "Risk", value: state.summary.riskSignal ?? "pending" },
        ];
    }
    if (state.mode === "sequences") {
        return [
            { label: "Tail Limit", value: state.summary.candidateResult ?? "pending" },
            { label: "Monotonicity", value: state.summary.monotonicity ?? "pending" },
            { label: "Boundedness", value: state.summary.boundedness ?? "pending" },
            { label: "Expansion", value: state.summary.expansionSignal ?? "pending" },
            { label: "Risk", value: state.summary.riskSignal ?? "pending" },
        ];
    }
    if (state.mode === "power-series") {
        return [
            { label: "Radius", value: state.summary.radiusSignal ?? "pending" },
            { label: "Interval", value: state.summary.intervalSignal ?? "pending" },
            { label: "Endpoints", value: state.summary.endpointSignal ?? "pending" },
            { label: "Expansion", value: state.summary.expansionSignal ?? "pending" },
            { label: "Partial Sum", value: state.summary.partialSumSignal ?? "pending" },
        ];
    }
    return [
        { label: "Family", value: state.summary.detectedFamily ?? "pending" },
        { label: "Convergence", value: state.summary.convergenceSignal ?? "pending" },
        { label: "Test Family", value: state.summary.testFamily ?? "pending" },
        { label: "Secondary Test", value: state.summary.secondaryTestFamily ?? "pending" },
        { label: "Partial Sum", value: state.summary.partialSumSignal ?? "pending" },
        { label: "Dominant Term", value: state.summary.dominantTerm ?? "pending" },
        { label: "Error Bound", value: state.summary.errorBoundSignal ?? "pending" },
        { label: "Special Family", value: state.summary.specialFamilySignal ?? "pending" },
        { label: "Expansion", value: state.summary.expansionSignal ?? "pending" },
        { label: "Singularity", value: state.summary.endpointSignal ?? "pending" },
        { label: "Risk", value: state.summary.riskSignal ?? "pending" },
    ];
}
