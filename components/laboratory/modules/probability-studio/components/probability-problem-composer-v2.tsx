import { AxBadge, AxField, AxPanel, AxSelect, AxTextarea } from "@/components/axion";
import type { ProbabilityExperienceLevel, ProbabilityMode } from "../types";
import { getProbabilityDimensionOptions } from "../probability-dimension-options";

const modeCopy: Record<ProbabilityMode, { title: string; helper: string; dataset: string; params: string }> = {
    descriptive: { title: "Descriptive statistics", helper: "Summarize center, spread and outliers from a sample.", dataset: "12, 15, 13, 17, 19, 18, 14, 16", params: "bins=6" },
    distributions: { title: "Distribution", helper: "Evaluate a distribution family and its probability structure.", dataset: "x=1.96", params: "family=normal; mu=0; sigma=1" },
    inference: { title: "Inference", helper: "Run a compact hypothesis or A/B comparison.", dataset: "control: 42/210; variant: 57/205", params: "alpha=0.05" },
    regression: { title: "Regression", helper: "Fit a relation and inspect residual quality.", dataset: "(1,2.1), (2,2.9), (3,4.2), (4,5.1)", params: "model=linear" },
    bayesian: { title: "Bayesian inference", helper: "Combine prior assumptions with observed evidence.", dataset: "successes=58; trials=100", params: "prior_alpha=2; prior_beta=3" },
    multivariate: { title: "Multivariate statistics", helper: "Inspect covariance, correlation and principal structure.", dataset: "4.2, 1.1, 8.2; 4.8, 1.4, 8.9; 5.1, 1.7, 9.4", params: "labels=signal, lag, output" },
    "time-series": { title: "Time series", helper: "Inspect drift, seasonality and a short forecast.", dataset: "112, 118, 121, 126, 133, 129, 138, 144", params: "window=3; horizon=2" },
    "monte-carlo": { title: "Monte Carlo", helper: "Estimate a quantity and inspect sampling uncertainty.", dataset: "inside-circle estimator", params: "samples=5000; seed=42" },
};

export type ProbabilityProblemComposerV2Props = {
    mode: ProbabilityMode;
    setMode: (value: ProbabilityMode) => void;
    datasetExpression: string;
    setDatasetExpression: (value: string) => void;
    parameterExpression: string;
    setParameterExpression: (value: string) => void;
    dimension: string;
    setDimension: (value: string) => void;
    experienceLevel: ProbabilityExperienceLevel;
    activePresetLabel?: string;
};

export function ProbabilityProblemComposerV2({
    mode,
    setMode,
    datasetExpression,
    setDatasetExpression,
    parameterExpression,
    setParameterExpression,
    dimension,
    setDimension,
    experienceLevel,
    activePresetLabel,
}: ProbabilityProblemComposerV2Props) {
    const meta = modeCopy[mode];
    const options = getProbabilityDimensionOptions(mode);
    const active = options.find((item) => item.value === dimension) ?? options[0];

    return (
        <AxPanel className="overflow-hidden">
            <div className="border-b border-[var(--ax-line)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[var(--ax-text)]">{meta.title}</div>
                    </div>
                    <AxBadge>{activePresetLabel ?? "Custom"}</AxBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--ax-text-soft)]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <AxField label="Analysis">
                    <AxSelect value={mode} onChange={(event) => setMode(event.target.value as ProbabilityMode)} className="text-[12px] font-semibold">
                        <option value="descriptive">Descriptive</option>
                        <option value="distributions">Distributions</option>
                        <option value="inference">Inference</option>
                        <option value="regression">Regression</option>
                        <option value="bayesian">Bayesian</option>
                        <option value="multivariate">Multivariate</option>
                        <option value="time-series">Time series</option>
                        <option value="monte-carlo">Monte Carlo</option>
                    </AxSelect>
                </AxField>

                <AxField label="Data / scenario">
                    <AxTextarea
                        value={datasetExpression}
                        onChange={(event) => setDatasetExpression(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={meta.dataset}
                        className="min-h-[148px] font-mono text-[13px]"
                    />
                </AxField>

                <AxField label="Parameters">
                    <AxTextarea
                        value={parameterExpression}
                        onChange={(event) => setParameterExpression(event.target.value)}
                        rows={3}
                        spellCheck={false}
                        placeholder={meta.params}
                        className="min-h-[84px] font-mono text-[12px]"
                    />
                </AxField>

                <div className="rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-accent-soft)] px-3 py-2.5 text-[11px] leading-5 text-[var(--ax-text-soft)]">
                    Results refresh live as the dataset or parameters change.
                </div>

                <details className="rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface)]">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--ax-text-soft)]">Advanced settings</summary>
                    <div className="space-y-3 border-t border-[var(--ax-line)] p-3">
                        <AxField label="Scope">
                            <AxSelect
                                value={active?.value ?? dimension}
                                onChange={(event) => setDimension(event.target.value)}
                                className="h-9 text-[11px] font-semibold"
                            >
                                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </AxSelect>
                        </AxField>
                        <div className="text-[11px] leading-5 text-[var(--ax-text-soft)]">{active?.description}</div>
                        <div className="text-[10px] text-[var(--ax-text-faint)]">Experience: {experienceLevel}</div>
                    </div>
                </details>
            </div>
        </AxPanel>
    );
}
