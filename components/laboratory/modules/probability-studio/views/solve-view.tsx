import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { ProbabilityStudioState } from "../types";

export function SolveView({
    state,
    actions,
}: {
    state: ProbabilityStudioState;
    actions: {
        setMode: (value: ProbabilityStudioState["mode"]) => void;
        setDatasetExpression: (value: string) => void;
        setParameterExpression: (value: string) => void;
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
                    datasetExpression={state.datasetExpression}
                    setDatasetExpression={actions.setDatasetExpression}
                    parameterExpression={state.parameterExpression}
                    setParameterExpression={actions.setParameterExpression}
                    dimension={state.dimension}
                    setDimension={actions.setDimension}
                    experienceLevel={state.experienceLevel}
                    activePresetLabel={state.activePresetLabel}
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
                            <div className="mt-2 font-mono text-sm text-foreground">{state.analyticSolution?.exact.result_latex ?? state.result.finalFormula}</div>
                            {state.analyticSolution?.exact.auxiliary_latex || state.result.auxiliaryFormula ? (
                                <div className="mt-2 font-mono text-xs text-muted-foreground">{state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula}</div>
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
                                {"formula" in step && typeof step.formula === "string" ? <div className="mt-3 overflow-x-auto font-mono text-xs text-foreground">{step.formula}</div> : null}
                                {"latex" in step && typeof step.latex === "string" ? <div className="mt-3 overflow-x-auto font-mono text-xs text-foreground">{step.latex}</div> : null}
                            </div>
                        ))}
                        {!state.result.steps.length && !state.analyticSolution?.exact.steps.length ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                Solve trace pending.
                            </div>
                        ) : null}
                        {state.visualNotes.map((note) => (
                            <div key={note} className="rounded-2xl border border-border/60 bg-muted/5 px-4 py-3 text-xs text-muted-foreground">
                                {note}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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

function buildMetricCards(state: ProbabilityStudioState) {
    const common = [{ label: "Sample Size", value: state.summary.sampleSize ?? "pending" }];
    switch (state.mode) {
        case "descriptive":
            return [
                ...common,
                { label: "Mean", value: state.summary.mean ?? "pending" },
                { label: "Variance", value: state.summary.variance ?? "pending" },
                { label: "Std Dev", value: state.summary.stdDev ?? "pending" },
                { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            ];
        case "distributions":
            return [
                ...common,
                { label: "Family", value: state.summary.distributionFamily ?? "pending" },
                { label: "Mean", value: state.summary.mean ?? "pending" },
                { label: "Std Dev", value: state.summary.stdDev ?? "pending" },
                { label: "CDF", value: state.summary.confidenceInterval ?? "pending" },
            ];
        case "inference":
            return [
                ...common,
                { label: "p-value", value: state.summary.pValue ?? "pending" },
                { label: "CI", value: state.summary.confidenceInterval ?? "pending" },
                { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            ];
        case "regression":
            return [
                ...common,
                { label: "Fit", value: state.summary.regressionFit ?? "pending" },
                { label: "Quality", value: state.summary.riskSignal ?? "pending" },
                { label: "Forecast", value: state.summary.forecast ?? "pending" },
            ];
        case "bayesian":
            return [
                ...common,
                { label: "Posterior Mean", value: state.summary.posteriorMean ?? "pending" },
                { label: "Credible Interval", value: state.summary.credibleInterval ?? "pending" },
                { label: "Family", value: state.summary.distributionFamily ?? "pending" },
            ];
        case "multivariate":
            return [
                ...common,
                { label: "Means", value: state.summary.mean ?? "pending" },
                { label: "Covariance", value: state.summary.covarianceSignal ?? "pending" },
                { label: "Correlation", value: state.summary.correlationSignal ?? "pending" },
            ];
        case "time-series":
            return [
                ...common,
                { label: "Drift", value: state.summary.drift ?? "pending" },
                { label: "Forecast", value: state.summary.forecast ?? "pending" },
                { label: "Stationarity", value: state.summary.stationarity ?? "pending" },
                { label: "Lag Signal", value: state.summary.riskSignal ?? "pending" },
            ];
        case "monte-carlo":
            return [
                ...common,
                { label: "Estimate", value: state.summary.monteCarloEstimate ?? "pending" },
                { label: "Error", value: state.summary.variance ?? "pending" },
                { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            ];
        default:
            return common;
    }
}
