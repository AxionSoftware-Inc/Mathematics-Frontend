export type SeriesLimitWorkspaceTab = "solve" | "code" | "visualize" | "compare" | "report";
export type SeriesLimitExperienceLevel = "beginner" | "advanced" | "research";
export type SeriesLimitMode = "limits" | "sequences" | "series" | "convergence" | "power-series";
export type SeriesLimitSolvePhase = "idle" | "auto-ready" | "analysis-ready";

export type SeriesLimitPreset = {
    label: string;
    mode: SeriesLimitMode;
    expression: string;
    auxiliary?: string;
    dimension: string;
    description: string;
};

export type SeriesLimitSummary = {
    detectedFamily?: string | null;
    candidateResult?: string | null;
    convergenceSignal?: string | null;
    dominantTerm?: string | null;
    radiusSignal?: string | null;
    riskSignal?: string | null;
    shape?: string | null;
    monotonicity?: string | null;
    boundedness?: string | null;
    testFamily?: string | null;
    secondaryTestFamily?: string | null;
    intervalSignal?: string | null;
    endpointSignal?: string | null;
    partialSumSignal?: string | null;
    asymptoticSignal?: string | null;
    asymptoticClass?: string | null;
    proofSignal?: string | null;
    comparisonSignal?: string | null;
    endpointDetails?: string[] | null;
    expansionSignal?: string | null;
    errorBoundSignal?: string | null;
    specialFamilySignal?: string | null;
};

export type SeriesLimitStep = {
    title: string;
    summary: string;
    latex?: string | null;
};

export type SeriesLimitSeriesPoint = {
    x: number;
    y: number;
};

export type SeriesLimitAnalysisResult = {
    summary: SeriesLimitSummary;
    steps: SeriesLimitStep[];
    finalFormula?: string | null;
    auxiliaryFormula?: string | null;
    lineSeries?: SeriesLimitSeriesPoint[];
    secondaryLineSeries?: SeriesLimitSeriesPoint[];
    tertiaryLineSeries?: SeriesLimitSeriesPoint[];
    quaternaryLineSeries?: SeriesLimitSeriesPoint[];
};

export type SeriesLimitAnalyticSolveResponse = {
    status: string;
    message: string;
    input: {
        mode: SeriesLimitMode;
        expression: string;
        auxiliary: string;
        dimension: string;
    };
    parser: {
        expression_raw: string;
        expression_latex?: string | null;
        auxiliary_raw: string;
    };
    diagnostics: {
        lane: SeriesLimitMode;
        method?: string | null;
        test_family?: string | null;
        risk?: string | null;
        convergence?: string | null;
    };
    summary: SeriesLimitSummary;
    exact: {
        method_label: string;
        result_latex?: string | null;
        auxiliary_latex?: string | null;
        numeric_approximation?: string | null;
        steps: SeriesLimitStep[];
    };
    preview?: {
        lineSeries?: SeriesLimitSeriesPoint[] | null;
        secondaryLineSeries?: SeriesLimitSeriesPoint[] | null;
        tertiaryLineSeries?: SeriesLimitSeriesPoint[] | null;
        quaternaryLineSeries?: SeriesLimitSeriesPoint[] | null;
    };
};

export type SeriesLimitContractSummary = {
    status: "ok" | "warn";
    riskLevel: "low" | "medium" | "high";
    readinessLabel: "publication_ready" | "research_review" | "working";
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

export type SeriesLimitBenchmarkSummary = {
    id: string;
    label: string;
    expectedValue: string;
    actualValue: string;
    status: "verified" | "review";
    detail: string;
};

export type SeriesLimitStudioState = {
    experienceLevel: SeriesLimitExperienceLevel;
    activeTab: SeriesLimitWorkspaceTab;
    mode: SeriesLimitMode;
    expression: string;
    auxiliaryExpression: string;
    dimension: string;
    solvePhase: SeriesLimitSolvePhase;
    isResultStale: boolean;
    activePresetLabel?: string;
    result: SeriesLimitAnalysisResult;
    analyticSolution: SeriesLimitAnalyticSolveResponse | null;
    summary: SeriesLimitSummary;
    contractSummary: SeriesLimitContractSummary;
    benchmarkSummary: SeriesLimitBenchmarkSummary | null;
    solveErrorMessage: string | null;
    visualNotes: string[];
    compareNotes: string[];
    reportNotes: string[];
    trustPanelProps: {
        state: {
            trustScore: number;
            analyticStatus: string;
            numericalSupport: boolean;
            convergence: "convergent" | "warning" | "unknown";
            hazards: string[];
            parserNotes?: string[];
            readinessLabel?: string;
            benchmarkLabel?: string | null;
        };
    };
    scenarioPanelProps: {
        state: {
            savedScenarios: SeriesLimitSavedScenario[];
            scenarioLabel: string;
            setScenarioLabel: (value: string) => void;
            saveCurrentScenario: () => void;
            loadSavedScenario: (scenario: SeriesLimitSavedScenario) => void;
            removeSavedScenario: (id: string) => void;
        };
    };
    annotationPanelProps: {
        state: {
            annotations: SeriesLimitAnnotation[];
            annotationAnchor: string;
            annotationTitle: string;
            setAnnotationTitle: (value: string) => void;
            annotationNote: string;
            setAnnotationNote: (value: string) => void;
            addAnnotationFromCurrentResult: () => void;
            removeAnnotation: (id: string) => void;
            canSave: boolean;
        };
    };
};

export type SeriesLimitSavedScenario = {
    id: string;
    label: string;
    savedAt: string;
    mode: SeriesLimitMode;
    expression: string;
    auxiliaryExpression: string;
    dimension: string;
    result: string | null;
};

export type SeriesLimitAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};
