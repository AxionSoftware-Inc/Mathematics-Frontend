import React from "react";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySolveLayout } from "@/components/laboratory/laboratory-solve-layout";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
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
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const [showNumericalDetails, setShowNumericalDetails] = React.useState(false);
    const finalFormula = state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? undefined;
    const auxiliaryFormula = state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? undefined;
    const derivationContent = hasAnalytic
        ? [
              `**Lane:** ${state.analyticSolution?.exact.method_label ?? "Analytic probability lane"}`,
              "",
              state.analyticSolution?.exact.result_latex ? `**Final form:** ${state.analyticSolution.exact.result_latex}` : null,
              state.analyticSolution?.exact.auxiliary_latex ? `**Auxiliary form:** ${state.analyticSolution.exact.auxiliary_latex}` : null,
              state.analyticSolution?.exact.numeric_approximation ? `**Approximation:** \`${state.analyticSolution.exact.numeric_approximation}\`` : null,
          ]
              .filter(Boolean)
              .join("\n")
        : [
              `**Analytic status:** closed-form ehtimollik ifodasi topilmadi.`,
              "",
              `**Numerical lane:** sample/statistical analysis tayyor.`,
              "",
              `Quyidagi tugma numerical derivation bosqichlarini ochadi.`,
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
                    <MathBlock value={finalFormula} className="mt-2 text-sm text-foreground" />
                    {auxiliaryFormula ? (
                        <MathBlock value={auxiliaryFormula} className="mt-2 text-xs text-muted-foreground" />
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
                        formula={getStepFormula(step)}
                        tone="neutral"
                    />
                ))}
                {!displayedSteps.length ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        Analytic derivation topilsa shu yerda chiqadi; bo‘lmasa numerical fallback tugmasi bosqichlarni ochadi.
                    </div>
                ) : null}
                {state.visualNotes.map((note) => (
                    <div key={note} className="rounded-2xl border border-border/60 bg-muted/5 px-4 py-3 text-xs text-muted-foreground">
                        {note}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <LaboratorySolveLayout
            control={
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
            }
            visual={<VisualizerDeck mode={state.mode} result={state.result} summary={state.summary} />}
            derivation={
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <LaboratoryMathPanel
                        eyebrow={hasAnalytic ? "Analytic Derivation" : "Numerical Fallback"}
                        title={hasAnalytic ? "Probability derivation" : "Analytic form unavailable"}
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
            ]}
        />
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    const renderAsMath = /[\\^_{}[\]]|=|P\(|E\[|Var\(|\bmu\b|\bsigma\b/i.test(value);

    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">
                {renderAsMath ? <MathBlock value={value} compact /> : value}
            </div>
        </div>
    );
}

function MathBlock({
    value,
    className = "",
    compact = false,
}: {
    value?: string;
    className?: string;
    compact?: boolean;
}) {
    if (!value?.trim() || value === "pending") {
        return <div className={className}>pending</div>;
    }

    return (
        <div className={`${className} overflow-x-auto ${compact ? "[&_.katex-display]:my-1" : ""}`.trim()}>
            <LaboratoryInlineMathMarkdown content={value} />
        </div>
    );
}

function getStepFormula(step: unknown) {
    if (!step || typeof step !== "object") {
        return undefined;
    }

    if ("formula" in step && typeof step.formula === "string") {
        return step.formula;
    }

    if ("latex" in step && typeof step.latex === "string") {
        return step.latex;
    }

    return undefined;
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
                { label: "Statistic", value: state.summary.testStatistic ?? state.summary.confidenceInterval ?? "pending" },
            ];
        case "inference":
            return [
                ...common,
                { label: "p-value", value: state.summary.pValue ?? "pending" },
                { label: "CI", value: state.summary.confidenceInterval ?? "pending" },
                { label: "Statistic", value: state.summary.testStatistic ?? "pending" },
                { label: "Power", value: state.summary.power ?? "pending" },
                { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            ];
        case "regression":
            return [
                ...common,
                { label: "Fit", value: state.summary.regressionFit ?? "pending" },
                { label: "Quality", value: state.summary.riskSignal ?? "pending" },
                { label: "Residual", value: state.summary.residualSignal ?? "pending" },
                { label: "Outlier", value: state.summary.outlierSignal ?? "pending" },
                { label: "Forecast", value: state.summary.forecast ?? "pending" },
            ];
        case "bayesian":
            return [
                ...common,
                { label: "Posterior Mean", value: state.summary.posteriorMean ?? "pending" },
                { label: "Credible Interval", value: state.summary.credibleInterval ?? "pending" },
                { label: "Predictive", value: state.summary.posteriorPredictive ?? "pending" },
                { label: "Bayes Factor", value: state.summary.bayesFactor ?? "pending" },
                { label: "MCMC", value: state.summary.mcmcSignal ?? "pending" },
            ];
        case "multivariate":
            return [
                ...common,
                { label: "Means", value: state.summary.mean ?? "pending" },
                { label: "Covariance", value: state.summary.covarianceSignal ?? "pending" },
                { label: "Correlation", value: state.summary.correlationSignal ?? "pending" },
                { label: "PCA", value: state.summary.pcaSignal ?? "pending" },
                { label: "Distance", value: state.summary.mahalanobisSignal ?? "pending" },
                { label: "Clusters", value: state.summary.clusterSignal ?? "pending" },
            ];
        case "time-series":
            return [
                ...common,
                { label: "Drift", value: state.summary.drift ?? "pending" },
                { label: "Forecast", value: state.summary.forecast ?? "pending" },
                { label: "Stationarity", value: state.summary.stationarity ?? "pending" },
                { label: "Seasonality", value: state.summary.seasonality ?? "pending" },
                { label: "ACF", value: state.summary.acfSignal ?? "pending" },
                { label: "PACF", value: state.summary.pacfSignal ?? "pending" },
                { label: "Lag Signal", value: state.summary.riskSignal ?? "pending" },
            ];
        case "monte-carlo":
            return [
                ...common,
                { label: "Estimate", value: state.summary.monteCarloEstimate ?? "pending" },
                { label: "Error", value: state.summary.variance ?? "pending" },
                { label: "Bootstrap", value: state.summary.bootstrapSignal ?? "pending" },
                { label: "Variance Reduction", value: state.summary.varianceReduction ?? "pending" },
                { label: "Sampler", value: state.summary.samplerSignal ?? "pending" },
                { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            ];
        default:
            return common;
    }
}
