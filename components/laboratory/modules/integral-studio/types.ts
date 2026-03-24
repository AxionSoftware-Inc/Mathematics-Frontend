export type PlotPoint = {
    x: number;
    y: number;
};

export type LaboratoryAnnotationItem = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

export type IntegralSummary = {
    midpoint: number;
    trapezoid: number;
    simpson: number;
    segmentsUsed: number;
    samples: PlotPoint[];
};

export type DoubleIntegralSummary = {
    value: number;
    samples: { x: number; y: number; z: number }[];
};

export type TripleIntegralSummary = {
    value: number;
    samples: { x: number; y: number; z: number; value: number }[];
};

export type IntegralBlockId =
    | "controls"
    | "visualizer"
    | "summary"
    | "exact"
    | "tables"
    | "sweep"
    | "insights"
    | "report"
    | "notes"
    | "experiments"
    | "bridge";

export type IntegralMode = "single" | "double" | "triple";
export type IntegralCoordinateSystem = "cartesian" | "polar" | "cylindrical" | "spherical";
export type IntegralExperienceLevel = "beginner" | "advanced" | "research";
export type IntegralWorkspaceTab = "solve" | "visualize" | "compare" | "report";
export type IntegralDetectedType =
    | "definite_single"
    | "indefinite_single"
    | "improper_infinite_bounds"
    | "improper_endpoint_singularity"
    | "definite_double"
    | "definite_triple"
    | "line_integral_candidate"
    | "surface_integral_candidate"
    | "contour_integral_candidate"
    | "unknown";

export type IntegralClassification = {
    kind: IntegralDetectedType;
    label: string;
    support: "supported" | "partial" | "unsupported";
    summary: string;
    notes: string[];
};

export type SingleIntegralSummary = IntegralSummary;
export type IntegralComputationSummary = SingleIntegralSummary | DoubleIntegralSummary | TripleIntegralSummary;

export type IntegralAnnotation = LaboratoryAnnotationItem;

export type IntegralSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: IntegralMode;
    coordinates: IntegralCoordinateSystem;
    expression: string;
    lower: string;
    upper: string;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
    segments: string;
    xResolution: string;
    yResolution: string;
    zResolution: string;
};

export type IntegralSolvePhase = "idle" | "analytic-loading" | "needs-numerical" | "exact-ready" | "numerical-ready" | "error";

export type IntegralSolveSnapshot = {
    mode: IntegralMode;
    coordinates: IntegralCoordinateSystem;
    expression: string;
    lower: string;
    upper: string;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
    segments: string;
    xResolution: string;
    yResolution: string;
    zResolution: string;
};

export type IntegralAnalyticSolveResponse = {
    status: "exact" | "needs_numerical";
    message: string;
    can_offer_numerical: boolean;
    parser: {
        expression_raw: string;
        expression_normalized: string;
        expression_latex: string;
        lower_raw: string;
        lower_normalized: string;
        lower_latex: string;
        upper_raw: string;
        upper_normalized: string;
        upper_latex: string;
        notes: string[];
    };
    exact: {
        method_label: string | null;
        method_summary: string | null;
        antiderivative_latex: string | null;
        definite_integral_latex: string | null;
        evaluated_latex: string | null;
        numeric_approximation: string | null;
        contains_special_functions: boolean;
        steps: Array<{
            title: string;
            summary: string;
            latex: string | null;
            tone: "neutral" | "info" | "success" | "warn";
        }>;
    };
};
