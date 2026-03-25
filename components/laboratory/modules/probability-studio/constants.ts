import type { ProbabilityPreset } from "./types";

export const PROBABILITY_PRESETS: readonly ProbabilityPreset[] = [
    {
        label: "Time-Series Demand Pulse",
        mode: "time-series",
        dataset: "112, 118, 121, 126, 133, 129, 138, 144, 149, 153, 159, 166",
        parameters: "window=3; horizon=2",
        dimension: "1d temporal",
        description: "Trend, moving average, forecast va lag-1 signalini bir joyda ko'rsatadigan showcase.",
    },
    {
        label: "Signal Noise Snapshot",
        mode: "descriptive",
        dataset: "12, 15, 13, 17, 19, 18, 14, 16, 20, 22",
        parameters: "bins=6",
        dimension: "1d",
        description: "Descriptive summary, spread audit va histogram ko'rish uchun tez showcase.",
    },
    {
        label: "Normal Tail Audit",
        mode: "distributions",
        dataset: "x=1.96",
        parameters: "family=normal; mu=0; sigma=1",
        dimension: "1d",
        description: "Normal taqsimot, tail probability va confidence intuition uchun.",
    },
    {
        label: "Bayesian Conversion Audit",
        mode: "bayesian",
        dataset: "successes=58; trials=100",
        parameters: "prior_alpha=2; prior_beta=3",
        dimension: "posterior lane",
        description: "Beta-binomial posterior, credible interval va posterior density uchun.",
    },
    {
        label: "AB Test Inference",
        mode: "inference",
        dataset: "control: 42/210; variant: 57/205",
        parameters: "alpha=0.05",
        dimension: "2-group",
        description: "Hypothesis test, p-value va confidence interval signalini ochadi.",
    },
    {
        label: "Quadratic Response Fit",
        mode: "regression",
        dataset: "(1,2.4), (2,3.1), (3,4.9), (4,7.8), (5,11.6), (6,16.1)",
        parameters: "model=quadratic",
        dimension: "2d",
        description: "Linear emas, quadratic fit, residual signal va forecast intuition uchun.",
    },
    {
        label: "Correlation Matrix Atlas",
        mode: "multivariate",
        dataset: "4.2, 1.1, 8.2; 4.8, 1.4, 8.9; 5.1, 1.7, 9.4; 5.7, 2.0, 10.1; 6.3, 2.3, 10.8",
        parameters: "labels=signal, lag, output",
        dimension: "3-variable",
        description: "Covariance, correlation heatmap va paired scatter ko'rish uchun.",
    },
    {
        label: "Monte Carlo Pi Deck",
        mode: "monte-carlo",
        dataset: "inside-circle estimator",
        parameters: "samples=5000; seed=42",
        dimension: "simulation",
        description: "Monte Carlo estimate, variance signal va convergence intuition uchun.",
    },
];

export const PROBABILITY_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
