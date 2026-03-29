import { LaboratoryCompareLayout } from "@/components/laboratory/laboratory-compare-layout";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import type { ProbabilityStudioState } from "../types";

export function CompareView({ state }: { state: ProbabilityStudioState }) {
    const overviewCards = [
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "client-side fallback", detail: "Primary probability lane", tone: "info" as const },
        { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Global risk register", tone: "warn" as const },
        { eyebrow: "Sample", value: state.summary.sampleSize ?? "pending", detail: "Dataset size", tone: "neutral" as const },
        { eyebrow: "Mode", value: state.mode, detail: "Active analysis family", tone: "success" as const },
    ];

    return (
        <LaboratoryCompareLayout
            overviewCards={overviewCards}
            sections={[
                {
                    id: "compare-notes",
                    title: "Compare Notes",
                    node: <Panel title="Compare Notes" items={state.compareNotes} />,
                    weight: 2,
                },
                {
                    id: "risk-register",
                    title: "Risk Register",
                    node: (
                        <Panel
                            title="Risk Register"
                            items={[
                                state.summary.riskSignal ?? "Risk signal pending",
                                `Primary result: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}`,
                                `Auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}`,
                                `Method: ${state.analyticSolution?.exact.method_label ?? "client-side fallback"}`,
                            ]}
                        />
                    ),
                    weight: 2,
                },
                {
                    id: "evidence",
                    title: "Evidence Stack",
                    node: (
                        <Panel
                            title="Evidence Stack"
                            items={[
                                `Mean / estimate: ${state.summary.mean ?? state.summary.posteriorMean ?? state.summary.monteCarloEstimate ?? "pending"}`,
                                `Median / IQR: ${state.summary.median ?? state.summary.iqr ?? "pending"}`,
                                `Variance / CI: ${state.summary.variance ?? state.summary.confidenceInterval ?? state.summary.credibleInterval ?? "pending"}`,
                                `Statistic: ${state.summary.testStatistic ?? state.summary.bayesFactor ?? "pending"}`,
                                `Forecast / predictive: ${state.summary.forecast ?? state.summary.posteriorPredictive ?? "pending"}`,
                            ]}
                        />
                    ),
                    weight: 1,
                },
                {
                    id: "diagnostics",
                    title: "Diagnostics",
                    node: (
                        <Panel
                            title="Diagnostics"
                            items={[
                                `Residual / outlier: ${state.summary.residualSignal ?? state.summary.outlierSignal ?? "pending"}`,
                                `Band / leverage: ${state.summary.intervalSignal ?? state.summary.leverageSignal ?? "pending"}`,
                                `Correlation / PCA: ${state.summary.correlationSignal ?? state.summary.pcaSignal ?? state.summary.explainedVariance ?? "pending"}`,
                                `ACF / PACF / forecast: ${state.summary.acfSignal ?? state.summary.pacfSignal ?? state.summary.forecastInterval ?? "pending"}`,
                                `Bootstrap / sampler / convergence: ${state.summary.bootstrapSignal ?? state.summary.samplerSignal ?? state.summary.convergenceSignal ?? "pending"}`,
                            ]}
                        />
                    ),
                    weight: 1,
                },
            ]}
        />
    );
}

function Panel({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        <PanelValue value={item} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PanelValue({ value }: { value: string }) {
    if (/[\\^_{}[\]]/.test(value)) {
        return <LaboratoryInlineMathMarkdown content={value} />;
    }

    return value;
}
