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

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
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
                <VisualizerDeck mode={state.mode} result={state.result} summary={state.summary} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Result Synthesis</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {metrics.map((metric) => (
                            <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                    </div>
                    {state.analyticSolution?.exact.result_latex || state.result.finalFormula ? (
                        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Formula</div>
                            <div className="mt-2 overflow-x-auto font-mono text-sm text-foreground">
                                {state.analyticSolution?.exact.result_latex ?? state.result.finalFormula}
                            </div>
                            {state.analyticSolution?.exact.auxiliary_latex || state.result.auxiliaryFormula ? (
                                <div className="mt-2 overflow-x-auto font-mono text-xs text-muted-foreground">
                                    {state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula}
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

                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Method Trace</div>
                    <div className="mt-4 space-y-3">
                        {(state.analyticSolution?.exact.steps.length ? state.analyticSolution.exact.steps : state.result.steps).map((step) => (
                            <div key={step.title} className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                                <div className="text-sm font-black text-foreground">{step.title}</div>
                                <div className="mt-1 text-sm leading-6 text-muted-foreground">{step.summary}</div>
                                {step.latex ? <div className="mt-3 overflow-x-auto font-mono text-xs text-foreground">{step.latex}</div> : null}
                            </div>
                        ))}
                        {!state.result.steps.length && !state.analyticSolution?.exact.steps.length ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                Solve trace pending.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {state.analyticSolution ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Analytic Forms</div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <FormulaCard label="Parsed Input" value={state.analyticSolution.parser.expression_latex || state.analyticSolution.parser.expression_raw} />
                        <FormulaCard label="Final Formula" value={state.analyticSolution.exact.result_latex ?? "pending"} />
                        <FormulaCard label="Auxiliary Formula" value={state.analyticSolution.exact.auxiliary_latex ?? "pending"} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">{value}</div>
        </div>
    );
}

function FormulaCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-3 overflow-x-auto font-mono text-sm leading-7 text-foreground">{value}</div>
        </div>
    );
}

function buildMetricCards(state: SeriesLimitStudioState) {
    if (state.mode === "limits") {
        return [
            { label: "Family", value: state.summary.detectedFamily ?? "pending" },
            { label: "Limit", value: state.summary.candidateResult ?? "pending" },
            { label: "Asymptotic", value: state.summary.asymptoticSignal ?? "pending" },
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
        { label: "Partial Sum", value: state.summary.partialSumSignal ?? "pending" },
        { label: "Dominant Term", value: state.summary.dominantTerm ?? "pending" },
        { label: "Expansion", value: state.summary.expansionSignal ?? "pending" },
        { label: "Risk", value: state.summary.riskSignal ?? "pending" },
    ];
}
