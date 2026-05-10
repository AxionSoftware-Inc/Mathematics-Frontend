export type MatrixWorkspaceTab = "solve" | "code" | "visualize" | "compare" | "report";
export type MatrixExperienceLevel = "beginner" | "advanced" | "research";
export type MatrixMode = "algebra" | "decomposition" | "systems" | "transform" | "tensor";

export type MatrixPreset = {
    label: string;
    mode: MatrixMode;
    matrix: string;
    rhs?: string;
    dimension: string;
    description: string;
};

export type MatrixComputationSummary = {
    determinant?: string | null;
    trace?: string | null;
    rank?: string | null;
    inverseAvailable?: boolean;
    eigenSummary?: string | null;
    systemSummary?: string | null;
    conditionLabel?: string | null;
    shape?: string | null;
    conditionNumber?: string | null;
    diagonalizable?: boolean | null;
    pivotColumns?: number[];
    spectralRadius?: string | null;
    residualNorm?: string | null;
    decompositionSummary?: string | null;
    solverKind?: string | null;
    stabilitySummary?: string | null;
    leastSquaresSummary?: string | null;
    factorAuditSummary?: string | null;
    svdSummary?: string | null;
    singularValueMagnitudes?: number[];
    iterativeSummary?: string | null;
    sparseSummary?: string | null;
    tensorSummary?: string | null;
    tensorShape?: string | null;
    tensorOrder?: number | null;
    modeRanks?: string[] | null;
    contractionSummary?: string | null;
    contractionDetails?: string[] | null;
    tensorProductSummary?: string | null;
    tuckerSummary?: string | null;
    cpSummary?: string | null;
    tensorEigenSummary?: string | null;
    tensorSliceNorms?: number[] | null;
    modeSingularSummaries?: string[] | null;
    tensorBlockNorms?: number[] | null;
    tuckerFactorSummaries?: string[] | null;
    cpFactorSummaries?: string[] | null;
};

export type MatrixSolvePhase = "idle" | "auto-ready" | "analysis-ready";

export type MatrixStep = {
    title: string;
    summary: string;
    latex?: string | null;
    tone?: string;
};

export type MatrixAnalyticSolveResponse = {
    status: string;
    message: string;
    input: {
        mode: MatrixMode;
        expression: string;
        rhs: string;
        dimension: string;
    };
    parser: {
        expression_raw: string;
        expression_latex: string;
        rhs_raw: string;
        dimension: string;
    };
    diagnostics: {
        shape: string;
        square: boolean;
        rank: number;
        mode: MatrixMode;
        condition_number?: string | null;
        pivot_columns?: number[];
        diagonalizable?: boolean | null;
        contract?: {
            status: "ok" | "info" | "warn" | "error";
            checks: Array<{
                id: string;
                label: string;
                status: "ok" | "info" | "warn" | "error";
                detail: string;
            }>;
            risk_level?: "low" | "medium" | "high";
            readiness_label?: string;
            hazard_count?: number;
            review_notes?: string[];
        };
    };
    summary: MatrixComputationSummary;
    exact: {
        method_label: string;
        result_latex?: string | null;
        auxiliary_latex?: string | null;
        numeric_approximation?: string | null;
        steps: MatrixStep[];
    };
};

export type MatrixStudioState = {
    experienceLevel: MatrixExperienceLevel;
    activeTab: MatrixWorkspaceTab;
    mode: MatrixMode;
    matrixExpression: string;
    rhsExpression: string;
    dimension: string;
    solvePhase: MatrixSolvePhase;
    isResultStale: boolean;
    activePresetLabel?: string;
    summary: MatrixComputationSummary;
    analyticSolution: MatrixAnalyticSolveResponse | null;
    solveErrorMessage: string | null;
    matrixRows: string[][];
    rhsRows: string[];
    tensorSlices: string[][][];
    visualNotes: string[];
    compareNotes: string[];
    reportNotes: string[];
};

export type MatrixVisualizerSummary = Pick<
    MatrixComputationSummary,
    | "shape"
    | "conditionNumber"
    | "pivotColumns"
    | "spectralRadius"
    | "residualNorm"
    | "solverKind"
    | "svdSummary"
    | "singularValueMagnitudes"
    | "iterativeSummary"
    | "sparseSummary"
    | "tensorSummary"
    | "tensorShape"
    | "tensorOrder"
    | "modeRanks"
    | "contractionSummary"
    | "contractionDetails"
    | "tensorProductSummary"
    | "tuckerSummary"
    | "cpSummary"
    | "tensorEigenSummary"
    | "tensorSliceNorms"
    | "modeSingularSummaries"
    | "tensorBlockNorms"
    | "tuckerFactorSummaries"
    | "cpFactorSummaries"
    | "diagonalizable"
    | "decompositionSummary"
    | "stabilitySummary"
    | "leastSquaresSummary"
    | "factorAuditSummary"
>;
