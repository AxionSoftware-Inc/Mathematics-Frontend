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
export type IntegralCoordinateSystem = "cartesian" | "polar" | "cylindrical" | "spherical" | "parametric" | "complex_plane";
export type IntegralExperienceLevel = "beginner" | "advanced" | "research";
export type IntegralWorkspaceTab = "solve" | "code" | "visualize" | "compare" | "report";
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

export type IntegralConstraintSeverity = "info" | "warn" | "blocker";

export type IntegralDomainConstraint = {
    kind: string;
    label: string;
    detail: string;
    severity: IntegralConstraintSeverity;
};

export type IntegralHazardDetail = {
    kind: string;
    label: string;
    detail: string;
    severity: "info" | "warn";
};

export type IntegralPiecewiseRegion = {
    kind: string;
    region: string;
    behavior: string;
    boundary: string;
};

export type IntegralAnalyticSolveResponse = {
    status: "exact" | "needs_numerical";
    message: string;
    can_offer_numerical: boolean;
    diagnostics?: {
        convergence: "convergent" | "divergent" | "unresolved" | "not_applicable";
        convergence_detail: string;
        convergence_reason: string;
        singularity: "none" | "possible" | "endpoint";
        domain_constraints: string[];
        hazards: string[];
        domain_analysis: {
            constraints: IntegralDomainConstraint[];
            assumptions: string[];
            blockers: string[];
        };
        hazard_details: IntegralHazardDetail[];
        piecewise: {
            active: boolean;
            source: string;
            split_count: number;
            regions: IntegralPiecewiseRegion[];
        };
        research: {
            exactness_tier: string;
            domain_risk_level: "low" | "medium" | "high";
            readiness_label: string;
            blocker_count: number;
            hazard_count: number;
            piecewise_active: boolean;
            special_function_signal: boolean;
            review_notes: string[];
        };
    };
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
    reproducibility?: {
        language: string;
        libraries: string[];
        engine: string;
        method: string;
        method_summary: string;
        status: string;
        numeric_strategy: string;
        editable: boolean;
        code: string;
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
        residue_analysis?: {
            orientation: string;
            center_latex: string;
            radius_latex: string;
            enclosed_poles: Array<{
                pole_latex: string;
                pole: { real: number; imag: number };
                residue_latex: string;
            }>;
            theorem_value_latex: string;
            direct_value_match: boolean;
            path_samples: Array<{ x: number; y: number }>;
        } | null;
        steps: Array<{
            title: string;
            summary: string;
            latex: string | null;
            tone: "neutral" | "info" | "success" | "warn";
        }>;
    };
};

export type IntegralBenchmarkSummary = {
    id: string;
    label: string;
    expectedValue: string;
    actualValue: string;
    absoluteError: number | null;
    status: "verified" | "review";
    detail: string;
};
