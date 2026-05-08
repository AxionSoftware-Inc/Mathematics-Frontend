export type ProbabilityWorkspaceTab = "solve" | "visualize" | "compare" | "report";
export type ProbabilityExperienceLevel = "beginner" | "advanced" | "research";
export type ProbabilityMode =
    | "descriptive"
    | "distributions"
    | "inference"
    | "regression"
    | "bayesian"
    | "multivariate"
    | "time-series"
    | "monte-carlo";
export type ProbabilitySolvePhase = "idle" | "auto-ready" | "analysis-ready";

export type ProbabilityPreset = {
    label: string;
    mode: ProbabilityMode;
    dataset: string;
    parameters?: string;
    dimension: string;
    description: string;
};

export type ProbabilitySummary = {
    sampleSize?: string | null;
    mean?: string | null;
    median?: string | null;
    variance?: string | null;
    stdDev?: string | null;
    iqr?: string | null;
    distributionFamily?: string | null;
    confidenceInterval?: string | null;
    pValue?: string | null;
    regressionFit?: string | null;
    monteCarloEstimate?: string | null;
    riskSignal?: string | null;
    shape?: string | null;
    posteriorMean?: string | null;
    credibleInterval?: string | null;
    covarianceSignal?: string | null;
    correlationSignal?: string | null;
    forecast?: string | null;
    drift?: string | null;
    stationarity?: string | null;
    skewness?: string | null;
    kurtosis?: string | null;
    power?: string | null;
    testStatistic?: string | null;
    residualSignal?: string | null;
    outlierSignal?: string | null;
    leverageSignal?: string | null;
    intervalSignal?: string | null;
    posteriorPredictive?: string | null;
    bayesFactor?: string | null;
    mcmcSignal?: string | null;
    pcaSignal?: string | null;
    explainedVariance?: string | null;
    clusterSignal?: string | null;
    clusterBalance?: string | null;
    mahalanobisSignal?: string | null;
    seasonality?: string | null;
    acfSignal?: string | null;
    pacfSignal?: string | null;
    forecastInterval?: string | null;
    bootstrapSignal?: string | null;
    varianceReduction?: string | null;
    samplerSignal?: string | null;
    convergenceSignal?: string | null;
};

export type ProbabilityStep = {
    title: string;
    summary: string;
    formula?: string | null;
};

export type ProbabilitySeriesPoint = {
    x: number;
    y: number;
};

export type ProbabilityBin = {
    label: string;
    count: number;
};

export type ProbabilityMatrix = {
    rowLabels: string[];
    columnLabels: string[];
    values: number[][];
};

export type ProbabilityAnalysisResult = {
    summary: ProbabilitySummary;
    steps: ProbabilityStep[];
    finalFormula?: string | null;
    auxiliaryFormula?: string | null;
    histogram?: ProbabilityBin[];
    lineSeries?: ProbabilitySeriesPoint[];
    secondaryLineSeries?: ProbabilitySeriesPoint[];
    scatterSeries?: ProbabilitySeriesPoint[];
    fitSeries?: ProbabilitySeriesPoint[];
    monteCarloTrail?: ProbabilitySeriesPoint[];
    monteCarloCloud?: ProbabilitySeriesPoint[];
    matrix?: ProbabilityMatrix;
    densitySeries?: ProbabilitySeriesPoint[];
    forecastSeries?: ProbabilitySeriesPoint[];
    tertiaryLineSeries?: ProbabilitySeriesPoint[];
    quaternaryLineSeries?: ProbabilitySeriesPoint[];
    intervalUpperSeries?: ProbabilitySeriesPoint[];
    intervalLowerSeries?: ProbabilitySeriesPoint[];
};

export type ProbabilityAnalyticSolveResponse = {
    status: string;
    message: string;
    input: {
        mode: ProbabilityMode;
        dataset: string;
        parameters: string;
        dimension: string;
    };
    parser: {
        dataset_raw: string;
        parameters_raw: string;
        dimension: string;
    };
    diagnostics: {
        lane: ProbabilityMode;
        sample_size?: number | null;
        family?: string | null;
        risk?: string | null;
        method?: string | null;
        contract?: {
            status: "ok" | "info" | "warn" | "error";
            risk_level?: "low" | "medium" | "high";
            readiness_label?: "publication_ready" | "research_review" | "working" | "blocked";
            checks?: Array<{
                id: string;
                label: string;
                status: "ok" | "info" | "warn" | "error";
                detail: string;
            }>;
            review_notes?: string[];
        };
    };
    summary: ProbabilitySummary;
    exact: {
        method_label: string;
        result_latex?: string | null;
        auxiliary_latex?: string | null;
        numeric_approximation?: string | null;
        steps: ProbabilityStep[];
    };
};

export type ProbabilityContractSummary = {
    status: "ok" | "info" | "warn" | "error";
    riskLevel: "low" | "medium" | "high";
    readinessLabel: "publication_ready" | "research_review" | "working" | "blocked";
    family: string;
    method: string;
    checks: Array<{
        id: string;
        label: string;
        status: "ok" | "info" | "warn" | "error";
        detail: string;
    }>;
    reviewNotes: string[];
};

export type ProbabilityBenchmarkSummary = {
    id: string;
    label: string;
    expectedValue: string;
    actualValue: string;
    absoluteError: number | null;
    status: "verified" | "review";
    detail: string;
};

export type ProbabilityStudioState = {
    experienceLevel: ProbabilityExperienceLevel;
    activeTab: ProbabilityWorkspaceTab;
    mode: ProbabilityMode;
    datasetExpression: string;
    parameterExpression: string;
    dimension: string;
    solvePhase: ProbabilitySolvePhase;
    isResultStale: boolean;
    activePresetLabel?: string;
    result: ProbabilityAnalysisResult;
    analyticSolution: ProbabilityAnalyticSolveResponse | null;
    summary: ProbabilitySummary;
    contractSummary: ProbabilityContractSummary;
    benchmarkSummary: ProbabilityBenchmarkSummary | null;
    solveErrorMessage: string | null;
    visualNotes: string[];
    compareNotes: string[];
    reportNotes: string[];
};
