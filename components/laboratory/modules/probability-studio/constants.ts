import type { ProbabilityPreset } from "./types";

export const PROBABILITY_PRESETS: readonly ProbabilityPreset[] = [
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
        label: "AB Test Inference",
        mode: "inference",
        dataset: "control: 42/210; variant: 57/205",
        parameters: "alpha=0.05",
        dimension: "2-group",
        description: "Hypothesis test, p-value va confidence interval signalini ochadi.",
    },
    {
        label: "Linear Trend Fit",
        mode: "regression",
        dataset: "(1,2.1), (2,2.9), (3,4.2), (4,5.1), (5,6.2)",
        parameters: "model=linear",
        dimension: "2d",
        description: "Regression fit, residual intuition va trend plot uchun.",
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
