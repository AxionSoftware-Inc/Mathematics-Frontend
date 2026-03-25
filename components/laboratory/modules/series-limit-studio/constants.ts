import type { SeriesLimitPreset } from "./types";

export const SERIES_LIMIT_PRESETS: readonly SeriesLimitPreset[] = [
    {
        label: "Classic Limit Probe",
        mode: "limits",
        expression: "(sin(x))/x",
        auxiliary: "x -> 0",
        dimension: "1 variable",
        description: "Foundational limit, local behavior va candidate result signalini ko'rsatadi.",
    },
    {
        label: "Sequence Convergence Deck",
        mode: "sequences",
        expression: "(1 + 1/n)^n",
        auxiliary: "n -> inf",
        dimension: "discrete",
        description: "Sequence limit, monotone behavior va asymptotic intuition uchun starter.",
    },
    {
        label: "Alternating Series Audit",
        mode: "series",
        expression: "sum((-1)^(n+1)/n, n=1..inf)",
        auxiliary: "alternating",
        dimension: "infinite series",
        description: "Alternating harmonic family, conditional convergence va partial sums showcase.",
    },
    {
        label: "Ratio Test Screen",
        mode: "convergence",
        expression: "sum(n!/n^n, n=1..inf)",
        auxiliary: "ratio test",
        dimension: "infinite series",
        description: "Convergence tooling, dominant term va test-family selection uchun.",
    },
    {
        label: "P-Series Threshold",
        mode: "convergence",
        expression: "sum(1/n^2, n=1..inf)",
        auxiliary: "comparison test",
        dimension: "infinite series",
        description: "P-series threshold, comparison va asymptotic class uchun aniq reference case.",
    },
    {
        label: "Power Series Radius",
        mode: "power-series",
        expression: "sum(x^n/n, n=1..inf)",
        auxiliary: "center=0",
        dimension: "power series",
        description: "Radius of convergence va local expansion workflow uchun starter preset.",
    },
    {
        label: "Endpoint Stress Test",
        mode: "power-series",
        expression: "sum(x^n/sqrt(n), n=1..inf)",
        auxiliary: "center=0",
        dimension: "power series",
        description: "Radius ichida va endpointlarda qaysi test ishlashini ko'rsatadigan stricter preset.",
    },
];

export const SERIES_LIMIT_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
