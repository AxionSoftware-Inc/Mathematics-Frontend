import React from "react";

import { LaboratoryReferenceSolveShell } from "@/components/laboratory/laboratory-reference-solve-shell";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { ProbabilityProblemComposerV2 } from "../components/probability-problem-composer-v2";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { ProbabilityStudioState } from "../types";

export function SolveViewV2({
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
    const primary = metrics.slice(0, 4);
    const support = metrics.slice(4);
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const steps = state.analyticSolution?.exact.steps?.length ? state.analyticSolution.exact.steps : state.result.steps;
    const finalFormula = state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? undefined;
    const auxiliaryFormula = state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? undefined;

    const result = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Result</div>
                    <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Statistical result</div>
                </div>
                <div className="text-[10px] text-[#949ba5]">Primary evidence first</div>
            </div>
            {finalFormula ? (
                <div className="mb-3 overflow-x-auto rounded-[8px] border border-[#dfe4ea] bg-[#f8fafe] px-4 py-3 text-[13px] text-[#20242b]">
                    <LaboratoryInlineMathMarkdown content={finalFormula} />
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
                eyebrow={hasAnalytic ? "Analytic interpretation" : "Statistical interpretation"}
                title={state.analyticSolution?.exact.method_label ?? modeTitle(state.mode)}
                content={[
                    auxiliaryFormula ? `**Supporting form:** ${auxiliaryFormula}` : null,
                    state.summary.riskSignal ? `**Risk:** ${state.summary.riskSignal}` : null,
                    state.summary.confidenceInterval ? `**Interval:** ${state.summary.confidenceInterval}` : null,
                    state.summary.pValue ? `**p-value:** ${state.summary.pValue}` : null,
                    state.visualNotes?.[0] ? `**Visual reading:** ${state.visualNotes[0]}` : null,
                    !auxiliaryFormula && !state.summary.riskSignal && !state.summary.confidenceInterval && !state.summary.pValue ? "The chart above is the primary evidence view for the current analysis." : null,
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
                            formula={getStepFormula(step)}
                            tone="neutral"
                        />
                    ))}
                </div>
            ) : null}
            {state.visualNotes?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {state.visualNotes.map((note) => (
                        <div key={note} className="rounded-[8px] border border-[#e2e6ec] bg-[#fcfdff] px-3 py-3 text-[12px] leading-5 text-[#66707c]">{note}</div>
                    ))}
                </div>
            ) : null}
        </div>
    );

    return (
        <LaboratoryReferenceSolveShell
            composer={
                <ProbabilityProblemComposerV2
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
            visual={<VisualizerDeck mode={state.mode} dimension={state.dimension} result={state.result} summary={state.summary} />}
            result={result}
            interpretation={interpretation}
            advanced={advanced}
            visualHint="Distribution, fit, uncertainty or simulation depending on the lane"
            advancedOpen={state.experienceLevel === "research"}
        />
    );
}

function modeTitle(mode: ProbabilityStudioState["mode"]) {
    if (mode === "descriptive") return "Descriptive statistics";
    if (mode === "distributions") return "Distribution analysis";
    if (mode === "inference") return "Inference";
    if (mode === "regression") return "Regression";
    if (mode === "bayesian") return "Bayesian inference";
    if (mode === "multivariate") return "Multivariate statistics";
    if (mode === "time-series") return "Time series";
    return "Monte Carlo";
}

function buildMetricCards(state: ProbabilityStudioState) {
    const common = [{ eyebrow: "Sample size", value: state.summary.sampleSize ?? "pending", detail: "Observed sample", tone: "neutral" as const }];
    switch (state.mode) {
        case "descriptive":
            return [...common,
                { eyebrow: "Mean", value: state.summary.mean ?? "pending", detail: "Central tendency", tone: "info" as const },
                { eyebrow: "Std dev", value: state.summary.stdDev ?? "pending", detail: "Spread", tone: "neutral" as const },
                { eyebrow: "Median", value: state.summary.median ?? "pending", detail: "Robust center", tone: "success" as const },
                { eyebrow: "IQR", value: state.summary.iqr ?? "pending", detail: "Middle spread", tone: "neutral" as const },
                { eyebrow: "Outliers", value: state.summary.outlierSignal ?? "pending", detail: "Outlier signal", tone: "warn" as const },
            ];
        case "distributions":
            return [...common,
                { eyebrow: "Family", value: state.summary.distributionFamily ?? "pending", detail: "Distribution family", tone: "info" as const },
                { eyebrow: "Mean", value: state.summary.mean ?? "pending", detail: "Expected value", tone: "neutral" as const },
                { eyebrow: "Std dev", value: state.summary.stdDev ?? "pending", detail: "Scale", tone: "neutral" as const },
                { eyebrow: "Statistic", value: state.summary.testStatistic ?? state.summary.confidenceInterval ?? "pending", detail: "Current evaluation", tone: "success" as const },
            ];
        case "inference":
            return [...common,
                { eyebrow: "p-value", value: state.summary.pValue ?? "pending", detail: "Evidence level", tone: "info" as const },
                { eyebrow: "Confidence interval", value: state.summary.confidenceInterval ?? "pending", detail: "Estimated range", tone: "success" as const },
                { eyebrow: "Statistic", value: state.summary.testStatistic ?? "pending", detail: "Test statistic", tone: "neutral" as const },
                { eyebrow: "Power", value: state.summary.power ?? "pending", detail: "Detection power", tone: "neutral" as const },
                { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Decision risk", tone: "warn" as const },
            ];
        case "regression":
            return [...common,
                { eyebrow: "Fit", value: state.summary.regressionFit ?? "pending", detail: "Model fit", tone: "success" as const },
                { eyebrow: "Residual", value: state.summary.residualSignal ?? "pending", detail: "Residual quality", tone: "neutral" as const },
                { eyebrow: "Forecast", value: state.summary.forecast ?? "pending", detail: "Forecast", tone: "info" as const },
                { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Model quality", tone: "warn" as const },
            ];
        case "bayesian":
            return [...common,
                { eyebrow: "Posterior mean", value: state.summary.posteriorMean ?? "pending", detail: "Posterior center", tone: "success" as const },
                { eyebrow: "Credible interval", value: state.summary.credibleInterval ?? "pending", detail: "Posterior interval", tone: "info" as const },
                { eyebrow: "Bayes factor", value: state.summary.bayesFactor ?? "pending", detail: "Evidence ratio", tone: "neutral" as const },
                { eyebrow: "MCMC", value: state.summary.mcmcSignal ?? "pending", detail: "Sampling status", tone: "neutral" as const },
            ];
        case "multivariate":
            return [...common,
                { eyebrow: "Covariance", value: state.summary.covarianceSignal ?? "pending", detail: "Joint variation", tone: "info" as const },
                { eyebrow: "Correlation", value: state.summary.correlationSignal ?? "pending", detail: "Linear relation", tone: "success" as const },
                { eyebrow: "PCA", value: state.summary.pcaSignal ?? "pending", detail: "Principal structure", tone: "neutral" as const },
                { eyebrow: "Explained", value: state.summary.explainedVariance ?? "pending", detail: "Explained variance", tone: "neutral" as const },
            ];
        case "time-series":
            return [...common,
                { eyebrow: "Drift", value: state.summary.drift ?? "pending", detail: "Long-term movement", tone: "info" as const },
                { eyebrow: "Forecast", value: state.summary.forecast ?? "pending", detail: "Near-term forecast", tone: "success" as const },
                { eyebrow: "Stationarity", value: state.summary.stationarity ?? "pending", detail: "Stationarity", tone: "neutral" as const },
                { eyebrow: "Seasonality", value: state.summary.seasonality ?? "pending", detail: "Seasonality", tone: "neutral" as const },
            ];
        case "monte-carlo":
            return [...common,
                { eyebrow: "Estimate", value: state.summary.monteCarloEstimate ?? "pending", detail: "Simulation estimate", tone: "success" as const },
                { eyebrow: "CI", value: state.summary.confidenceInterval ?? "pending", detail: "Simulation interval", tone: "info" as const },
                { eyebrow: "Convergence", value: state.summary.convergenceSignal ?? "pending", detail: "Sampling convergence", tone: "neutral" as const },
                { eyebrow: "Sampler", value: state.summary.samplerSignal ?? "pending", detail: "Sampling strategy", tone: "neutral" as const },
            ];
    }
}

function getStepFormula(step: unknown) {
    if (!step || typeof step !== "object") return undefined;
    if ("formula" in step && typeof step.formula === "string") return step.formula;
    if ("latex" in step && typeof step.latex === "string") return step.latex;
    return undefined;
}
