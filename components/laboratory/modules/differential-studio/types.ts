// ─── Core plot primitives ──────────────────────────────────────────────────────

export type PlotPoint = {
    x: number;
    y: number;
};

export type Plot3DPoint = {
    x: number;
    y: number;
    z: number;
};

// ─── Coordinate systems ────────────────────────────────────────────────────────

export type DifferentialCoordinateSystem =
    | "cartesian"
    | "polar"
    | "cylindrical"
    | "spherical";

// ─── Experience / tab system ───────────────────────────────────────────────────

export type DifferentialMode =
    | "derivative"      // f: R → R, nth-order
    | "partial"         // gradient ∇f, scalar field
    | "directional"     // D_u f in a given direction
    | "jacobian"        // F: Rⁿ → Rᵐ, full J matrix
    | "hessian";        // f: Rⁿ → R, full H matrix (curvature)

export type DifferentialExperienceLevel = "beginner" | "advanced" | "research";
export type DifferentialWorkspaceTab = "solve" | "code" | "visualize" | "compare" | "report";
export type DifferentialExtendedMode = DifferentialMode | "ode" | "pde" | "sde";

// ─── Solve pipeline state ──────────────────────────────────────────────────────

export type DifferentialSolvePhase =
    | "idle"
    | "analytic-loading"
    | "exact-ready"
    | "needs-numerical"
    | "numerical-ready"
    | "error";

/** Snapshot of all inputs at the moment of a solve request. */
export type DifferentialSolveSnapshot = {
    mode: DifferentialExtendedMode;
    expression: string;
    variable: string;
    point: string;
    order: string;
    direction: string;             // for directional derivative: "1, 0" or "1, 0, 0"
    coordinates: DifferentialCoordinateSystem;
};

// ─── Classification ────────────────────────────────────────────────────────────

export type DifferentialDetectedType =
    | "ordinary_derivative"
    | "higher_order_derivative"
    | "partial_derivative"
    | "gradient_candidate"
    | "directional_derivative"
    | "jacobian_candidate"
    | "hessian_candidate"
    | "ode_candidate"
    | "pde_candidate"
    | "sde_candidate"
    | "implicit_geometry_candidate"
    | "variational_candidate"
    | "unknown";

export type DifferentialClassification = {
    kind: DifferentialDetectedType;
    label: string;
    support: "supported" | "partial" | "unsupported";
    summary: string;
    notes: string[];
    coordinateNote?: string;
};

// ─── Computation summaries ─────────────────────────────────────────────────────

/** Ordinary derivative (single-variable, nth-order). */
export type DerivativeSummary = {
    type: "derivative";
    order: number;
    valueAtPoint: number;           // f(point)
    derivativeAtPoint: number;      // f^(n)(point)
    samples: PlotPoint[];           // function trace for chart
    tangentSamples: PlotPoint[];    // tangent line trace
    tangentLine: {
        slope: number;
        intercept: number;
        latex: string;
    };
};

/** Higher-order series with Taylor polynomial. */
export type HigherOrderDerivativeSummary = {
    type: "higher_order";
    valueAtPoint: number;
    derivatives: number[];          // [f(x0), f'(x0), f''(x0), ...]
    maxOrder: number;
    taylorSamples: PlotPoint[];     // Taylor polynomial curve
    functionSamples: PlotPoint[];   // actual function curve
};

/**
 * Partial derivative: single ∂f/∂x_i.
 * Also used as the result type returned by mode="partial" in older paths.
 */
export type PartialDerivativeSummary = {
    type: "partial";
    valueAtPoint: number;
    wrtVariable: string;
    partialAtPoint: number;
    variable: string;               // alias for wrtVariable (backwards compat)
    samples: PlotPoint[];
};

/** Full gradient ∇f (all partial derivatives). */
export type GradientSummary = {
    type: "gradient";
    valueAtPoint: number;
    gradient: number[];             // [∂f/∂x1, ∂f/∂x2, ...]
    magnitude: number;              // |∇f|
    samples: PlotPoint[];           // 1D trace (primary axis)
    arrowSamples: PlotPoint[];      // 2D arrow visualization
    latex: string;                  // column vector LaTeX
    latexComponents: string;        // individual partials LaTeX
};

/** Directional derivative D_u f. */
export type DirectionalDerivativeSummary = {
    type: "directional";
    valueAtPoint: number;
    gradient: number[];
    unitDirection: number[];
    directionalDerivative: number;
    magnitude: number;
    samples: PlotPoint[];
};

/** Jacobian matrix J ∈ R^{m×n}. */
export type JacobianSummary = {
    type: "jacobian";
    matrix: number[][];
    determinant: number | null;
    trace: number | null;
    size: { rows: number; cols: number };
    valueAtPoint: number[];
    funcCount: number;
    latex: string;
};

/** Hessian matrix H ∈ R^{n×n}. */
export type HessianSummary = {
    type: "hessian";
    matrix: number[][];
    determinant: number;
    trace: number;
    size: number;
    valueAtPoint: number;
    eigenvalueSignature:
        | "positive_definite"
        | "negative_definite"
        | "indefinite"
        | "semidefinite"
        | "unknown";
    criticalPointType: string;
    latex: string;
};

export type ODEFieldSample = {
    x: number;
    y: number;
    slope: number;
};

export type ODEPhaseSample = {
    x: number;
    y: number;
};

export type ODESummary = {
    type: "ode";
    family: "autonomous" | "nonautonomous";
    valueAtPoint: number;
    samples: PlotPoint[];
    field: ODEFieldSample[];
    phaseSamples: ODEPhaseSample[];
    equilibriumPoints: number[];
    stabilityLabel: "stable" | "unstable" | "mixed" | "undetermined";
    x0: number;
    y0: number;
};

export type PDEFieldSample = {
    x: number;
    y: number;
    z: number;
};

export type PDESummary = {
    type: "pde";
    family: "transport" | "heat";
    valueAtPoint: number;
    samples: PlotPoint[];
    heatmapSamples: PDEFieldSample[];
    finalProfile: PlotPoint[];
    stabilityRatio: number;
    grid: {
        nx: number;
        nt: number;
    };
};

export type SDESummary = {
    type: "sde";
    valueAtPoint: number;
    samples: PlotPoint[];
    ensemblePaths: PlotPoint[][];
    meanPath: PlotPoint[];
    lowerBand: PlotPoint[];
    upperBand: PlotPoint[];
    terminalHistogram: PlotPoint[];
    terminalMean: number;
    terminalStd: number;
    pathCount: number;
};

/** Union of all numerical computation summaries. */
export type DifferentialComputationSummary =
    | DerivativeSummary
    | HigherOrderDerivativeSummary
    | PartialDerivativeSummary
    | GradientSummary
    | DirectionalDerivativeSummary
    | JacobianSummary
    | HessianSummary
    | ODESummary
    | PDESummary
    | SDESummary;

// ─── Step-size sweep ──────────────────────────────────────────────────────────

export type StepSweepEntry = {
    h: number;
    hLabel: string;
    value: number;
    relError: number;
    stability: "Stable" | "Watch" | "Rough";
};

// ─── Backend analytic response ─────────────────────────────────────────────────

export type DifferentialAnalyticSolveResponse = {
    status: "exact" | "needs_numerical";
    message: string;
    diagnostics?: {
        continuity: "continuous" | "discontinuous" | "singular";
        differentiability: "differentiable" | "non_differentiable" | "partial";
        domain_analysis: {
            constraints: Array<{
                kind: string;
                label: string;
                detail: string;
                severity: string;
            }>;
            assumptions: string[];
            blockers: string[];
        };
        singularity_points?: Array<{
            variable: string;
            point: string;
            kind: string;
        }>;
        taxonomy?: {
            lane: string;
            family: string;
            tags: string[];
            summary: string;
        };
        directional?: {
            active: boolean;
            raw_direction?: string;
            normalized_direction_latex?: string | null;
        };
        matrix?: {
            lane: "jacobian" | "hessian";
            shape?: string;
            square?: boolean;
            determinant_status?: "invertible" | "near_singular" | "singular" | "not_applicable";
            critical_point_type?: string;
            eigenvalue_signature?: string;
        };
        contract?: {
            status: "ok" | "info" | "warn" | "error";
            checks: Array<{
                id: string;
                label: string;
                status: "ok" | "info" | "warn" | "error";
                detail: string;
            }>;
            completeness?: string;
            discretization?: string;
            family?: string;
            family_hint?: string;
            risk_level?: "low" | "medium" | "high";
            readiness_label?: string;
            blocker_count?: number;
            hazard_count?: number;
            review_notes?: string[];
        };
    };
    parser: {
        expression_raw: string;
        expression_normalized: string;
        expression_latex: string;
        variable: string;
        point_raw: string;
        point_normalized: string;
        notes: string[];
    };
    exact: {
        method_label: string | null;
        derivative_latex: string | null;
        evaluated_latex: string | null;
        numeric_approximation: string | null;
        determinant_latex?: string | null;
        trace_numeric?: string | null;
        critical_point_type?: string | null;
        eigenvalue_signature?: string | null;
        taxonomy_family?: string | null;
        steps: Array<{
            title: string;
            summary: string;
            latex: string | null;
            tone: "neutral" | "info" | "success" | "warn";
        }>;
    };
};

export type DifferentialBenchmarkSummary = {
    id: string;
    label: string;
    expectedValue: string;
    actualValue: string;
    absoluteError: number | null;
    status: "verified" | "review";
    detail: string;
};

// ─── Annotations & experiments ────────────────────────────────────────────────

export type DifferentialAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

export type DifferentialSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: DifferentialExtendedMode;
    expression: string;
    variable: string;
    point: string;
    order: string;
    direction: string;
    coordinates: DifferentialCoordinateSystem;
    result?: number | string | null;
};

// ─── Validation signals ───────────────────────────────────────────────────────

export type DifferentialValidationSignal = {
    field: string;
    tone: "warn" | "info" | "error";
    label: string;
    text: string;
    blocking: boolean;
};

// ─── Presentation helpers ─────────────────────────────────────────────────────

export type DifferentialTone = "neutral" | "info" | "success" | "warn";

export type DifferentialMetricCard = {
    eyebrow: string;
    value: string;
    detail: string;
    tone: DifferentialTone;
};

export type DifferentialExactStep = {
    title: string;
    summary: string;
    latex: string | null;
    tone: DifferentialTone;
};
