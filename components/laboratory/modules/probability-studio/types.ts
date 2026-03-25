export type ProbabilityWorkspaceTab = "solve" | "visualize" | "compare" | "report";
export type ProbabilityExperienceLevel = "beginner" | "advanced" | "research";
export type ProbabilityMode = "descriptive" | "distributions" | "inference" | "regression" | "monte-carlo";
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
    variance?: string | null;
    stdDev?: string | null;
    distributionFamily?: string | null;
    confidenceInterval?: string | null;
    pValue?: string | null;
    regressionFit?: string | null;
    monteCarloEstimate?: string | null;
    riskSignal?: string | null;
    shape?: string | null;
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

export type ProbabilityAnalysisResult = {
    summary: ProbabilitySummary;
    steps: ProbabilityStep[];
    finalFormula?: string | null;
    auxiliaryFormula?: string | null;
    histogram?: ProbabilityBin[];
    lineSeries?: ProbabilitySeriesPoint[];
    scatterSeries?: ProbabilitySeriesPoint[];
    fitSeries?: ProbabilitySeriesPoint[];
    monteCarloTrail?: ProbabilitySeriesPoint[];
    monteCarloCloud?: ProbabilitySeriesPoint[];
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
    solveErrorMessage: string | null;
    visualNotes: string[];
    compareNotes: string[];
    reportNotes: string[];
};
