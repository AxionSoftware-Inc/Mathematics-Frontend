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
        <div className="overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white">
            <div className="border-b border-[#e8ebef] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">{meta.title}</div>
                    </div>
                    <div className="rounded-[7px] bg-[#f5f7fa] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#747d88]">
                        {activePresetLabel ?? "Custom"}
                    </div>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#6f7782]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Analysis</span>
                    <select
                        value={mode}
                        onChange={(event) => setMode(event.target.value as ProbabilityMode)}
                        className="h-10 w-full rounded-[8px] border border-[#dfe4ea] bg-white px-3 text-[12px] font-semibold text-[#20242b] outline-none focus:border-[#9db5dc]"
                    >
                        <option value="descriptive">Descriptive</option>
                        <option value="distributions">Distributions</option>
                        <option value="inference">Inference</option>
                        <option value="regression">Regression</option>
                        <option value="bayesian">Bayesian</option>
                        <option value="multivariate">Multivariate</option>
                        <option value="time-series">Time series</option>
                        <option value="monte-carlo">Monte Carlo</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Data / scenario</span>
                    <textarea
                        value={datasetExpression}
                        onChange={(event) => setDatasetExpression(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={meta.dataset}
                        className="min-h-[148px] w-full resize-y rounded-[8px] border border-[#dfe4ea] bg-[#fcfdff] px-3 py-3 font-mono text-[13px] leading-6 text-[#20242b] outline-none focus:border-[#9db5dc]"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Parameters</span>
                    <textarea
                        value={parameterExpression}
                        onChange={(event) => setParameterExpression(event.target.value)}
                        rows={3}
                        spellCheck={false}
                        placeholder={meta.params}
                        className="w-full resize-y rounded-[8px] border border-[#dfe4ea] bg-white px-3 py-2.5 font-mono text-[12px] leading-5 text-[#20242b] outline-none focus:border-[#9db5dc]"
                    />
                </label>

                <div className="rounded-[8px] border border-[#dfe4ea] bg-[#f8fafe] px-3 py-2.5 text-[11px] leading-5 text-[#626b76]">
                    Results refresh live as the dataset or parameters change.
                </div>

                <details className="rounded-[8px] border border-[#e2e6ec] bg-white">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#66707c]">Advanced settings</summary>
                    <div className="space-y-3 border-t border-[#edf0f3] p-3">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#7a838e]">Scope</span>
                            <select
                                value={active?.value ?? dimension}
                                onChange={(event) => setDimension(event.target.value)}
                                className="h-9 w-full rounded-[7px] border border-[#dfe4ea] bg-white px-3 text-[11px] font-semibold text-[#303640] outline-none"
                            >
                                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </label>
                        <div className="text-[11px] leading-5 text-[#7a838e]">{active?.description}</div>
                        <div className="text-[10px] text-[#9299a2]">Experience: {experienceLevel}</div>
                    </div>
                </details>
            </div>
        </div>
    );
}
