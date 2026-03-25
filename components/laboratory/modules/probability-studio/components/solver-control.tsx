import type { ProbabilityExperienceLevel, ProbabilityMode } from "../types";

const modeCopy: Record<ProbabilityMode, { label: string; helper: string; datasetPlaceholder: string; paramPlaceholder: string }> = {
    descriptive: {
        label: "Descriptive Statistics",
        helper: "Namuna ma'lumotlari, markaziy tendensiya va tarqalish signalini tez ko'rish uchun dataset kiriting.",
        datasetPlaceholder: "12, 15, 13, 17, 19, 18, 14, 16",
        paramPlaceholder: "bins=6",
    },
    distributions: {
        label: "Distributions",
        helper: "Nazariy taqsimotlar, tail probability va confidence intuition uchun parametrlar kiriting.",
        datasetPlaceholder: "x=1.96",
        paramPlaceholder: "family=normal; mu=0; sigma=1",
    },
    inference: {
        label: "Inference",
        helper: "AB test, hypothesis signal va confidence interval uchun grouped observation kiriting.",
        datasetPlaceholder: "control: 42/210; variant: 57/205",
        paramPlaceholder: "alpha=0.05",
    },
    regression: {
        label: "Regression",
        helper: "Trend, residual va fit quality signalini ko'rish uchun nuqtalar kiriting.",
        datasetPlaceholder: "(1,2.1), (2,2.9), (3,4.2), (4,5.1)",
        paramPlaceholder: "model=linear",
    },
    bayesian: {
        label: "Bayesian Inference",
        helper: "Prior va observation kiriting, posterior mean va credible interval shu lane'da quriladi.",
        datasetPlaceholder: "successes=58; trials=100",
        paramPlaceholder: "prior_alpha=2; prior_beta=3",
    },
    multivariate: {
        label: "Multivariate Statistics",
        helper: "Har qator bir observation, ustunlar esa variables. Covariance va correlation shu lane'da chiqadi.",
        datasetPlaceholder: "4.2, 1.1, 8.2; 4.8, 1.4, 8.9; 5.1, 1.7, 9.4",
        paramPlaceholder: "labels=signal, lag, output",
    },
    "time-series": {
        label: "Time Series",
        helper: "Ketma-ket kuzatuvlar, moving average, drift va qisqa forecast signalini quradi.",
        datasetPlaceholder: "112, 118, 121, 126, 133, 129, 138, 144",
        paramPlaceholder: "window=3; horizon=2",
    },
    "monte-carlo": {
        label: "Monte Carlo",
        helper: "Simulation estimate, sampling uncertainty va convergence intuition uchun scenario kiriting.",
        datasetPlaceholder: "inside-circle estimator",
        paramPlaceholder: "samples=5000; seed=42",
    },
};

export function SolverControl({
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
}: {
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
}) {
    const copy = modeCopy[mode];

    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Composer</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-foreground">{copy.label}</div>
                    <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.helper}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Preset</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{activePresetLabel ?? "Custom"}</div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.1fr_0.8fr]">
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Analysis Mode</span>
                    <select value={mode} onChange={(event) => setMode(event.target.value as ProbabilityMode)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent">
                        <option value="descriptive">Descriptive</option>
                        <option value="distributions">Distributions</option>
                        <option value="inference">Inference</option>
                        <option value="regression">Regression</option>
                        <option value="bayesian">Bayesian</option>
                        <option value="multivariate">Multivariate</option>
                        <option value="time-series">Time Series</option>
                        <option value="monte-carlo">Monte Carlo</option>
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Dimension Scope</span>
                    <input value={dimension} onChange={(event) => setDimension(event.target.value)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent" />
                </label>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Experience</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{experienceLevel}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">Probability, inference va simulation lane'lar shu shell ichida ishlaydi.</div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Dataset / Scenario</span>
                    <textarea
                        value={datasetExpression}
                        onChange={(event) => setDatasetExpression(event.target.value)}
                        rows={7}
                        spellCheck={false}
                        placeholder={copy.datasetPlaceholder}
                        className="min-h-[190px] w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                    />
                </label>
                <div className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Parameters</span>
                        <textarea
                            value={parameterExpression}
                            onChange={(event) => setParameterExpression(event.target.value)}
                            rows={5}
                            spellCheck={false}
                            placeholder={copy.paramPlaceholder}
                            className="w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                        />
                    </label>
                    <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Rendered Preview</div>
                        <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-background p-4 font-mono text-sm leading-7 text-foreground">
                            {datasetExpression}
                        </div>
                        {parameterExpression ? (
                            <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-background p-4 font-mono text-sm leading-7 text-foreground">
                                params = {parameterExpression}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
