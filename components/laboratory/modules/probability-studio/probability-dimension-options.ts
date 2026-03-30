import type { ProbabilityMode } from "./types";

export type ProbabilityDimensionOption = {
    value: string;
    label: string;
    description: string;
};

const DIMENSION_OPTIONS: Record<ProbabilityMode, ProbabilityDimensionOption[]> = {
    descriptive: [
        { value: "sample profile", label: "Sample Profile", description: "Histogram va raw sample spread ko'rinishi." },
        { value: "outlier audit", label: "Outlier Audit", description: "Tukey fence va ekstremal observation signali." },
        { value: "quantile spread", label: "Quantile Spread", description: "Sorted sample va kvartil tasnifi." },
    ],
    distributions: [
        { value: "density profile", label: "Density Profile", description: "Asosiy density yoki mass ko'rinishi." },
        { value: "tail audit", label: "Tail Audit", description: "Nuqtaviy CDF va cumulative tail signal." },
        { value: "family compare", label: "Family Compare", description: "Primary family yonida comparison curve." },
    ],
    inference: [
        { value: "two-group test", label: "Two-Group Test", description: "Group estimate va statistic comparison." },
        { value: "confidence band", label: "Confidence Band", description: "Effect estimate va interval qatlami." },
        { value: "power audit", label: "Power Audit", description: "Effect-size bo'yicha test sensitivity." },
    ],
    regression: [
        { value: "fit line", label: "Fit Line", description: "Observed points va fitted response." },
        { value: "residual audit", label: "Residual Audit", description: "Residual drift va zero-baseline tekshiruvi." },
        { value: "forecast band", label: "Forecast Band", description: "Fit, extrapolation va uncertainty band." },
    ],
    bayesian: [
        { value: "posterior lane", label: "Posterior Lane", description: "Posterior density va updated belief." },
        { value: "credible interval", label: "Credible Interval", description: "Posterior region va mass concentration." },
        { value: "sampler diagnostics", label: "Sampler Diagnostics", description: "Running chain va mixing signali." },
    ],
    multivariate: [
        { value: "correlation map", label: "Correlation Map", description: "Matrix-based covariance structure." },
        { value: "pca projection", label: "PCA Projection", description: "PC score scatter va variance signal." },
        { value: "cluster audit", label: "Cluster Audit", description: "Projection space ichida cluster split." },
    ],
    "time-series": [
        { value: "trend lane", label: "Trend Lane", description: "Trend va smoothing qatlamlari." },
        { value: "seasonality audit", label: "Seasonality Audit", description: "Seasonal track va lag structure." },
        { value: "forecast interval", label: "Forecast Interval", description: "Forecast horizon va uncertainty band." },
    ],
    "monte-carlo": [
        { value: "simulation", label: "Simulation", description: "Primary simulation yoki cloud ko'rinishi." },
        { value: "convergence", label: "Convergence", description: "Running estimate va confidence band." },
        { value: "sampler compare", label: "Sampler Compare", description: "Ikki sampler yoki variance-reduction solishtiruvi." },
    ],
};

export function getProbabilityDimensionOptions(mode: ProbabilityMode) {
    return DIMENSION_OPTIONS[mode];
}

export function getDefaultProbabilityDimension(mode: ProbabilityMode) {
    return DIMENSION_OPTIONS[mode][0]?.value ?? "sample profile";
}

export function normalizeProbabilityDimension(mode: ProbabilityMode, dimension?: string | null) {
    const normalized = dimension?.trim().toLowerCase();
    const match = DIMENSION_OPTIONS[mode].find((option) => option.value === normalized);
    return match?.value ?? getDefaultProbabilityDimension(mode);
}

