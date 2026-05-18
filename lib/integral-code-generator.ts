import type { IntegralSolveMethod } from "@/components/laboratory/modules/integral-studio/types";

export type IntegralCodeExportMode =
    | "python-basic"
    | "python-scipy"
    | "python-sympy"
    | "python-matplotlib"
    | "jupyter"
    | "colab"
    | "latex-appendix"
    | "api-call"
    | "production"
    | "teaching";

export type IntegralCodeGeneratorInput = {
    expression: string;
    lower: string;
    upper: string;
    solveMethod?: IntegralSolveMethod | string;
};

export const integralCodeExportModes: Array<{ id: IntegralCodeExportMode; label: string; detail: string }> = [
    { id: "python-basic", label: "Python basic", detail: "stdlib + verified Simpson" },
    { id: "python-scipy", label: "Python + NumPy/SciPy", detail: "method-aware numeric benchmark" },
    { id: "python-sympy", label: "Python + SymPy", detail: "symbolic + verification capsule" },
    { id: "python-matplotlib", label: "Python + Matplotlib", detail: "plot + trust annotation" },
    { id: "jupyter", label: "Jupyter notebook", detail: ".ipynb research worksheet" },
    { id: "colab", label: "Google Colab", detail: "Colab-ready notebook" },
    { id: "latex-appendix", label: "LaTeX appendix", detail: "publication code appendix" },
    { id: "api-call", label: "API call version", detail: "backend solve request" },
    { id: "production", label: "Clean production code", detail: "typed, auditable, reusable" },
    { id: "teaching", label: "Teaching code", detail: "step comments + checks" },
];

const NUMERIC_METHODS = new Set(["numeric-check", "adaptive-quadrature", "gauss-legendre", "composite-simpson", "tanh-sinh", "monte-carlo", "numeric-only"]);

function pyLiteral(value: string | undefined, fallback: string) {
    return JSON.stringify(value || fallback);
}

function methodLabel(method: string | undefined) {
    return (method || "auto").replace(/-/g, " ");
}

function selectedMethod(input: IntegralCodeGeneratorInput) {
    return input.solveMethod || "auto";
}

function normalizeExportMethod(method: string | undefined) {
    return method || "auto";
}

export function buildIntegralSympyCode(input: IntegralCodeGeneratorInput, variant: "standard" | "production" | "teaching" = "standard") {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(normalizeExportMethod(input.solveMethod), "auto");
    const teaching = variant === "teaching";
    const production = variant === "production";

    return `"""
MathSphere Integral Reproduction Script
Selected method: ${methodLabel(input.solveMethod)}
Mode: ${variant}

This script is designed for report appendices, notebooks, and local verification.
Pipeline:
Parser -> Normalizer -> Method detector -> Method executor -> Step generator ->
Verification engine -> Numerical fallback -> Visualization adapter -> Code generator ->
Report generator -> Dependency graph connector.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Literal
import hashlib
import json
import time
import sympy as sp

try:
    import numpy as np
except Exception:  # pragma: no cover - optional dependency in exported scripts
    np = None

try:
    from scipy import integrate as scipy_integrate
except Exception:  # pragma: no cover - optional dependency in exported scripts
    scipy_integrate = None


MethodName = Literal[
    "auto",
    "symbolic",
    "risch-heurisch",
    "substitution",
    "integration-by-parts",
    "partial-fractions",
    "trig-substitution",
    "numeric-check",
    "adaptive-quadrature",
    "gauss-legendre",
    "composite-simpson",
    "tanh-sinh",
    "monte-carlo",
    "residue-contour",
    "series-expansion-integral",
    "special-functions",
    "numeric-only",
]


@dataclass(frozen=True)
class IntegralConfig:
    expression: str
    lower: str
    upper: str
    variable: str = "x"
    selected_method: MethodName = ${method}
    digits: int = 15
    tolerance: str = "1e-10"
    max_subdivisions: int = 300
    series_center: str = "0"
    series_order: int = 10
    assumptions: tuple[str, ...] = ("x real", "interval finite unless bounds contain oo")
    require_symbolic: bool = ${production ? "False" : "False"}
    monte_carlo_samples: int = 200_000
    visualization_samples: int = 160


@dataclass(frozen=True)
class AssumptionSet:
    variable_domain: str
    parameter_constraints: tuple[str, ...]
    interval_finite: bool
    notes: tuple[str, ...]


@dataclass(frozen=True)
class StructuredIssue:
    code: str
    severity: Literal["info", "warning", "error"]
    message: str
    user_action: str
    details: dict[str, Any]


@dataclass(frozen=True)
class ParsedProblem:
    variable: sp.Symbol
    expression: sp.Expr
    lower: sp.Expr
    upper: sp.Expr
    expression_raw: str
    lower_raw: str
    upper_raw: str


@dataclass(frozen=True)
class NormalizedProblem:
    variable: sp.Symbol
    expression: sp.Expr
    working_expression: sp.Expr
    lower: sp.Expr
    upper: sp.Expr
    assumptions: AssumptionSet
    singularities: tuple[sp.Expr, ...]


@dataclass(frozen=True)
class MethodRecommendation:
    detected_structure: str
    recommended_method: str
    reason: str
    confidence_percent: int
    fallback_method: str


@dataclass(frozen=True)
class MethodExecution:
    method: str
    working_expression: sp.Expr
    antiderivative: sp.Expr | None
    exact: sp.Expr | None
    status: str


@dataclass(frozen=True)
class StepRecord:
    index: int
    title: str
    action: str
    method: str
    latex: str | None
    metadata: dict[str, Any]


@dataclass(frozen=True)
class VerificationResult:
    derivative_residual_latex: str | None
    boundary_residual_latex: str | None
    numerical_check: str | None
    independent_numeric_check: str | None
    symbolic_check_passed: bool
    numeric_sample_check_passed: bool | None
    domain_check_passed: bool
    singularity_check_passed: bool
    convergence_check_passed: bool
    derivative_passed: bool
    boundary_passed: bool
    numeric_consistent: bool | None


@dataclass(frozen=True)
class NumericalTrust:
    confidence_percent: int
    estimated_abs_error: str | None
    method: str
    tolerance: str
    warnings: list[str]


@dataclass(frozen=True)
class NumericalResult:
    value: str | None
    method: str
    estimated_abs_error: str | None
    runtime_ms: float
    used_scipy: bool
    route: str


@dataclass(frozen=True)
class VisualizationPayload:
    kind: str
    expression_latex: str
    x_values: list[float]
    y_values: list[float]
    annotations: list[str]


@dataclass(frozen=True)
class CodeAppendix:
    language: str
    mode: str
    entrypoint: str
    code: str


@dataclass(frozen=True)
class ReportSection:
    title: str
    content: str
    source: str


@dataclass(frozen=True)
class DependencyNode:
    id: str
    label: str
    depends_on: tuple[str, ...]
    status: str


@dataclass(frozen=True)
class ReproducibilityCapsule:
    input: str
    bounds: tuple[str, str]
    method: str
    engine: str
    engine_version: str
    assumptions: tuple[str, ...]
    numeric_settings: dict[str, Any]
    result_hash: str
    created_at_epoch: float


@dataclass(frozen=True)
class IntegralResult:
    status: str
    method: str
    method_recommendation: MethodRecommendation
    expression_latex: str
    working_expression_latex: str
    antiderivative_latex: str | None
    exact_latex: str | None
    numeric_value: str | None
    steps: list[StepRecord]
    verification: VerificationResult
    numerical: NumericalResult
    numerical_trust: NumericalTrust
    visualization: VisualizationPayload
    code_appendix: CodeAppendix
    report_sections: list[ReportSection]
    dependency_graph: list[DependencyNode]
    capsule: ReproducibilityCapsule
    issues: list[StructuredIssue]
    warnings: list[str]
    execution_time_ms: float


def add_issue(issues: list[StructuredIssue], code: str, severity: str, message: str, user_action: str, **details: Any) -> None:
    issues.append(StructuredIssue(code=code, severity=severity, message=message, user_action=user_action, details=details))


def add_step(steps: list[StepRecord], title: str, action: str, method: str, latex: str | None = None, **metadata: Any) -> None:
    steps.append(StepRecord(index=len(steps) + 1, title=title, action=action, method=method, latex=latex, metadata=metadata))


def parse_config(config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> ParsedProblem:
    x = sp.symbols(config.variable, real=True)
    local_dict = {
        config.variable: x,
        "sin": sp.sin,
        "cos": sp.cos,
        "tan": sp.tan,
        "asin": sp.asin,
        "acos": sp.acos,
        "atan": sp.atan,
        "sinh": sp.sinh,
        "cosh": sp.cosh,
        "exp": sp.exp,
        "log": sp.log,
        "ln": sp.log,
        "sqrt": sp.sqrt,
        "pi": sp.pi,
        "E": sp.E,
        "oo": sp.oo,
    }
    try:
        expr = sp.sympify(config.expression.replace("^", "**"), locals=local_dict)
        lower = sp.sympify(config.lower.replace("^", "**"), locals=local_dict)
        upper = sp.sympify(config.upper.replace("^", "**"), locals=local_dict)
    except Exception as exc:
        add_issue(
            issues,
            "PARSER_FAILED",
            "error",
            f"Input could not be parsed: {exc}",
            "Check expression syntax, variable name, and bound format.",
            expression=config.expression,
            lower=config.lower,
            upper=config.upper,
        )
        raise
    add_step(steps, "Parser", "Converted raw input into SymPy expressions.", "sympify", sp.latex(expr), lower_latex=sp.latex(lower), upper_latex=sp.latex(upper))
    return ParsedProblem(x, expr, lower, upper, config.expression, config.lower, config.upper)


def normalize_problem(parsed: ParsedProblem, config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> NormalizedProblem:
    expr = sp.cancel(sp.together(parsed.expression))
    lower = sp.simplify(parsed.lower)
    upper = sp.simplify(parsed.upper)
    interval_finite = not any(bound in {sp.oo, -sp.oo} for bound in (lower, upper))
    try:
        singularities = tuple(sp.singularities(expr, parsed.variable))
    except Exception as exc:
        add_issue(
            issues,
            "SINGULARITY_SCAN_UNRESOLVED",
            "warning",
            f"Singularity scan could not be completed: {exc}",
            "Use numerical quadrature with explicit breakpoints if the integrand has discontinuities.",
        )
        singularities = tuple()
    assumptions = AssumptionSet(
        variable_domain="real",
        parameter_constraints=tuple(item for item in config.assumptions if item != "x real"),
        interval_finite=interval_finite,
        notes=config.assumptions,
    )
    if not interval_finite:
        add_issue(
            issues,
            "IMPROPER_BOUNDS_DETECTED",
            "warning",
            "At least one integration bound is infinite.",
            "Run convergence analysis and prefer adaptive quadrature with tail handling.",
            lower=str(lower),
            upper=str(upper),
        )
    add_step(
        steps,
        "Normalizer",
        "Canonicalized expression and collected assumptions/singularities.",
        "together/cancel/simplify",
        sp.latex(expr),
        singularities=[sp.latex(item) for item in singularities],
        interval_finite=interval_finite,
    )
    return NormalizedProblem(parsed.variable, parsed.expression, expr, lower, upper, assumptions, singularities)


def singularities_inside_interval(problem: NormalizedProblem) -> list[sp.Expr]:
    if not problem.assumptions.interval_finite:
        return list(problem.singularities)
    inside: list[sp.Expr] = []
    for item in problem.singularities:
        try:
            value = float(sp.N(item))
            lower = float(sp.N(problem.lower))
            upper = float(sp.N(problem.upper))
            if min(lower, upper) < value < max(lower, upper):
                inside.append(item)
        except Exception:
            inside.append(item)
    return inside


def detect_method(problem: NormalizedProblem, config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> MethodRecommendation:
    x = problem.variable
    expr = problem.working_expression
    numerator, denominator = sp.fraction(expr)
    denominator_factor = sp.factor(denominator)
    internal_singularities = singularities_inside_interval(problem)
    detected = "general expression"
    recommended = "symbolic"
    reason = "No specialized structure was dominant; symbolic integration is the safest first route."
    confidence = 68

    if denominator != 1 and denominator.is_polynomial(x):
        detected = "rational function"
        recommended = "partial-fractions"
        reason = "Denominator is a factorable polynomial, so apart() can expose elementary terms."
        confidence = 90
    elif internal_singularities:
        detected = "singular or improper integral"
        recommended = "tanh-sinh" if problem.assumptions.interval_finite else "adaptive-quadrature"
        reason = "Possible singularities or improper bounds require numerical integration with breakpoints/convergence checks."
        confidence = 84
    elif expr.has(sp.erf, sp.gamma, sp.Ei) or any(func in str(expr) for func in ["bessel", "fresnel"]):
        detected = "special-function expression"
        recommended = "special-functions"
        reason = "The expression already contains or suggests special functions."
        confidence = 82
    elif expr.is_polynomial(x) or expr.has(sp.sin, sp.cos, sp.exp, sp.log):
        detected = "elementary symbolic candidate"
        recommended = "symbolic"
        reason = "Expression is an elementary candidate where SymPy closed-form integration is worth trying first."
        confidence = 76

    if config.selected_method != "auto":
        selected = config.selected_method
        reason = f"User selected '{selected}'. Auto detector would recommend '{recommended}' because: {reason}"
        recommended = selected

    add_step(
        steps,
        "Method detector",
        f"Detected: {detected}. Recommended: {recommended}. Reason: {reason}",
        "structure-analysis",
        sp.latex(expr),
        confidence_percent=confidence,
        denominator_factor_latex=sp.latex(denominator_factor),
    )
    return MethodRecommendation(detected, recommended, reason, confidence, "adaptive-quadrature")


def method_transform(expr: sp.Expr, x: sp.Symbol, method: str, config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> sp.Expr:

    if method == "partial-fractions":
        transformed = sp.apart(expr, x)
        if transformed == expr:
            add_issue(
                issues,
                "METHOD_TRANSFORM_NOOP",
                "info",
                "Partial fraction transform did not change the integrand.",
                "Keep auto/symbolic method or provide a rational expression.",
                method=method,
            )
        add_step(steps, "Method executor", "Expression transformed by apart().", method, sp.latex(transformed))
        return transformed

    if method == "series-expansion-integral":
        center = sp.sympify(config.series_center)
        add_issue(
            issues,
            "SERIES_APPROXIMATION_USED",
            "warning",
            f"Series approximation around x={center} up to order {config.series_order}.",
            "Validate convergence radius and compare with numerical quadrature before publication.",
            center=str(center),
            order=config.series_order,
        )
        transformed = sp.series(expr, x, center, config.series_order).removeO()
        add_step(steps, "Method executor", "Expression expanded into a series and integrated term-by-term.", method, sp.latex(transformed), center=str(center), order=config.series_order)
        return transformed

    if method == "special-functions":
        transformed = expr.rewrite(sp.erf).rewrite(sp.gamma).rewrite(sp.Ei)
        add_step(steps, "Method executor", "Expression rewritten toward special-function forms.", method, sp.latex(transformed))
        return transformed

    if method in {"substitution", "integration-by-parts", "trig-substitution", "risch-heurisch", "residue-contour"}:
        add_issue(
            issues,
            "MANUAL_METHOD_INTENT_RECORDED",
            "info",
            f"Method intent '{method}' recorded; exact symbolic execution remains SymPy-backed.",
            "Review generated deterministic steps before using them as a formal proof.",
            method=method,
        )
        add_step(steps, "Method executor", f"Manual method intent recorded: {method}.", method, sp.latex(expr))
        return expr

    add_step(steps, "Method executor", "No pre-transform was required.", method, sp.latex(expr))
    return expr


def should_skip_symbolic(method: str) -> bool:
    return method in {"numeric-only", "adaptive-quadrature", "gauss-legendre", "composite-simpson", "tanh-sinh", "monte-carlo"}


def is_zero(expr: sp.Expr | None) -> bool:
    if expr is None:
        return False
    candidates = [sp.simplify(expr), sp.trigsimp(expr), sp.cancel(expr), sp.factor(expr)]
    return any(candidate == 0 for candidate in candidates)


def estimate_runtime(problem: NormalizedProblem, method: str) -> str:
    complexity = sp.count_ops(problem.working_expression)
    if method in {"monte-carlo", "tanh-sinh"} or complexity > 120:
        return "seconds to minutes depending on tolerance and singularities"
    if method in {"adaptive-quadrature", "gauss-legendre", "composite-simpson"}:
        return "usually under a few seconds for one-dimensional finite bounds"
    return "usually under a few seconds for template-scale examples"


def numerical_fallback(problem: NormalizedProblem, method: str, config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> NumericalResult:
    started = time.perf_counter()
    expr, x, lower, upper = problem.working_expression, problem.variable, problem.lower, problem.upper
    route = "sympy.N(Integral)"
    estimated_error: str | None = config.tolerance
    value: str | None = None
    used_scipy = False
    singular_points = singularities_inside_interval(problem)

    if scipy_integrate is not None and np is not None and problem.assumptions.interval_finite:
        try:
            f = sp.lambdify(x, expr, "numpy")
            a = float(sp.N(lower))
            b = float(sp.N(upper))
            points = []
            for point in singular_points:
                try:
                    points.append(float(sp.N(point)))
                except Exception:
                    pass

            if method == "gauss-legendre":
                nodes, weights = np.polynomial.legendre.leggauss(128)
                mapped = 0.5 * (nodes + 1.0) * (b - a) + a
                y = np.asarray(f(mapped), dtype=float)
                numeric = 0.5 * (b - a) * np.sum(weights * y)
                route = "numpy.gauss_legendre(order=128)"
                value = str(float(numeric))
                estimated_error = None
            elif method == "composite-simpson":
                xs = np.linspace(a, b, 4001)
                ys = np.asarray(f(xs), dtype=float)
                numeric = scipy_integrate.simpson(ys, x=xs)
                route = "scipy.integrate.simpson(grid=4001)"
                value = str(float(numeric))
                estimated_error = None
            elif method == "monte-carlo":
                rng = np.random.default_rng(42)
                xs = rng.uniform(a, b, config.monte_carlo_samples)
                ys = np.asarray(f(xs), dtype=float)
                numeric = (b - a) * float(np.mean(ys))
                stderr = abs(b - a) * float(np.std(ys, ddof=1) / np.sqrt(config.monte_carlo_samples))
                route = f"numpy.monte_carlo(samples={config.monte_carlo_samples})"
                value = str(numeric)
                estimated_error = str(1.96 * stderr)
            else:
                numeric, error = scipy_integrate.quad(lambda t: float(f(t)), a, b, points=points or None, epsabs=float(config.tolerance), epsrel=float(config.tolerance), limit=config.max_subdivisions)
                route = "scipy.integrate.quad"
                value = str(float(numeric))
                estimated_error = str(float(error))
            used_scipy = True
        except Exception as exc:
            add_issue(
                issues,
                "SCIPY_NUMERICAL_FALLBACK_FAILED",
                "warning",
                f"SciPy numerical fallback failed: {exc}",
                "Try symbolic fallback, split the interval, or reduce singularity risk.",
                method=method,
            )

    if value is None:
        try:
            integral = sp.Integral(expr, (x, lower, upper))
            value = str(sp.N(integral, config.digits))
        except Exception as exc:
            add_issue(
                issues,
                "NUMERICAL_FALLBACK_FAILED",
                "error",
                f"Numerical fallback failed: {exc}",
                "Try adaptive quadrature with explicit breakpoints or simplify the integrand.",
                method=method,
            )
            route = "failed"

    add_step(
        steps,
        "Numerical fallback",
        f"Computed independent numeric check using {route}.",
        method,
        None,
        estimated_abs_error=estimated_error,
        runtime_estimate=estimate_runtime(problem, method),
        singular_points=[sp.latex(item) for item in singular_points],
    )
    return NumericalResult(value, route, estimated_error, round((time.perf_counter() - started) * 1000, 2), used_scipy, route)


def build_trust(method: str, exact: sp.Expr | None, numerical: NumericalResult, issues: list[StructuredIssue], config: IntegralConfig) -> NumericalTrust:
    confidence = 97 if exact is not None else 78
    if method in {"monte-carlo", "series-expansion-integral"}:
        confidence -= 18
    confidence -= min(35, sum(10 if issue.severity == "error" else 5 if issue.severity == "warning" else 1 for issue in issues))
    confidence = max(35, min(99, confidence))
    return NumericalTrust(
        confidence_percent=confidence,
        estimated_abs_error=numerical.estimated_abs_error,
        method=method,
        tolerance=config.tolerance,
        warnings=[issue.message for issue in issues if issue.severity != "info"],
    )


def hash_result(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def execute_method(problem: NormalizedProblem, config: IntegralConfig, recommendation: MethodRecommendation, issues: list[StructuredIssue], steps: list[StepRecord]) -> MethodExecution:
    method = recommendation.recommended_method
    working_expr = method_transform(problem.working_expression, problem.variable, method, config, issues, steps)
    antiderivative: sp.Expr | None = None
    exact: sp.Expr | None = None
    status = "partial"

    if should_skip_symbolic(method):
        add_issue(
            issues,
            "SYMBOLIC_PHASE_SKIPPED",
            "info",
            f"Symbolic phase skipped because selected method is '{method}'.",
            "Use symbolic or auto method if an exact form is required.",
        )
        return MethodExecution(method, working_expr, None, None, "numeric-only")

    try:
        antiderivative = sp.simplify(sp.integrate(working_expr, problem.variable))
        if isinstance(antiderivative, sp.Integral) or antiderivative.has(sp.Integral):
            add_issue(
                issues,
                "ANTIDERIVATIVE_UNEVALUATED",
                "warning",
                "SymPy returned an unevaluated antiderivative.",
                "Try special-functions, series expansion, or numerical quadrature.",
            )
            antiderivative = None
    except Exception as exc:
        add_issue(
            issues,
            "SYMBOLIC_ANTIDERIVATIVE_FAILED",
            "warning",
            f"Antiderivative failed: {exc}",
            "Try numeric method or series expansion.",
        )

    try:
        exact = sp.simplify(sp.integrate(working_expr, (problem.variable, problem.lower, problem.upper)))
        if isinstance(exact, sp.Integral) or exact.has(sp.Integral):
            add_issue(
                issues,
                "SYMBOLIC_INTEGRATION_FAILED",
                "warning",
                "Direct symbolic integration returned an unevaluated Integral.",
                "Try numerical quadrature with singularity analysis.",
            )
            exact = None
    except Exception as exc:
        add_issue(
            issues,
            "SYMBOLIC_INTEGRATION_FAILED",
            "warning",
            f"Direct symbolic integration failed: {exc}",
            "Try numeric method or series expansion.",
        )

    if exact is not None:
        status = "solved"
    elif antiderivative is not None:
        status = "primitive-only"
    add_step(
        steps,
        "Symbolic execution",
        "Computed antiderivative and definite integral when available.",
        method,
        sp.latex(exact) if exact is not None else None,
        antiderivative_latex=sp.latex(antiderivative) if antiderivative is not None else None,
        status=status,
    )
    return MethodExecution(method, working_expr, antiderivative, exact, status)


def verify_result(problem: NormalizedProblem, execution: MethodExecution, numerical: NumericalResult, config: IntegralConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> VerificationResult:
    derivative_residual = None
    boundary_residual = None
    if execution.antiderivative is not None:
        derivative_residual = sp.simplify(sp.diff(execution.antiderivative, problem.variable) - execution.working_expression)
    if execution.antiderivative is not None and execution.exact is not None:
        boundary_residual = sp.simplify(execution.antiderivative.subs(problem.variable, problem.upper) - execution.antiderivative.subs(problem.variable, problem.lower) - execution.exact)

    derivative_passed = is_zero(derivative_residual)
    boundary_passed = is_zero(boundary_residual)
    symbolic_check_passed = execution.exact is not None and (execution.antiderivative is None or derivative_passed) and (execution.antiderivative is None or boundary_passed)
    domain_check_passed = problem.assumptions.variable_domain == "real"
    singularity_check_passed = len(singularities_inside_interval(problem)) == 0 or execution.method in {"tanh-sinh", "adaptive-quadrature"}
    convergence_check_passed = problem.assumptions.interval_finite or execution.exact is not None

    numeric_consistent = None
    numeric_sample_check_passed = None
    if execution.exact is not None and numerical.value is not None:
        try:
            exact_float = float(sp.N(execution.exact))
            numeric_float = float(numerical.value)
            tolerance = max(float(config.tolerance), float(numerical.estimated_abs_error or config.tolerance) * 10)
            numeric_consistent = abs(exact_float - numeric_float) <= tolerance
            numeric_sample_check_passed = numeric_consistent
        except Exception:
            numeric_consistent = None

    if not singularity_check_passed:
        add_issue(
            issues,
            "SINGULARITY_CHECK_REQUIRES_REVIEW",
            "warning",
            "A possible singularity lies inside the interval and was not fully resolved.",
            "Split the interval or use a singularity-aware numerical method.",
        )
    if not convergence_check_passed:
        add_issue(
            issues,
            "CONVERGENCE_CHECK_REQUIRES_REVIEW",
            "warning",
            "Improper integral convergence could not be proven by this script.",
            "Run a dedicated convergence test or provide assumptions.",
        )

    add_step(
        steps,
        "Verification engine",
        "Checked symbolic residuals, numeric consistency, domain, singularities, and convergence.",
        execution.method,
        None,
        derivative_passed=derivative_passed,
        boundary_passed=boundary_passed,
        numeric_sample_check_passed=numeric_sample_check_passed,
        domain_check_passed=domain_check_passed,
        singularity_check_passed=singularity_check_passed,
        convergence_check_passed=convergence_check_passed,
    )
    return VerificationResult(
        derivative_residual_latex=sp.latex(derivative_residual) if derivative_residual is not None else None,
        boundary_residual_latex=sp.latex(boundary_residual) if boundary_residual is not None else None,
        numerical_check=str(sp.N(execution.exact, config.digits)) if execution.exact is not None else numerical.value,
        independent_numeric_check=numerical.value,
        symbolic_check_passed=symbolic_check_passed,
        numeric_sample_check_passed=numeric_sample_check_passed,
        domain_check_passed=domain_check_passed,
        singularity_check_passed=singularity_check_passed,
        convergence_check_passed=convergence_check_passed,
        derivative_passed=derivative_passed,
        boundary_passed=boundary_passed,
        numeric_consistent=numeric_consistent,
    )


def visualization_adapter(problem: NormalizedProblem, execution: MethodExecution, config: IntegralConfig, steps: list[StepRecord]) -> VisualizationPayload:
    xs: list[float] = []
    ys: list[float] = []
    annotations: list[str] = []
    if problem.assumptions.interval_finite:
        try:
            a = float(sp.N(problem.lower))
            b = float(sp.N(problem.upper))
            count = max(20, min(config.visualization_samples, 400))
            f = sp.lambdify(problem.variable, execution.working_expression, "math")
            for i in range(count):
                t = a + (b - a) * i / (count - 1)
                xs.append(float(t))
                try:
                    ys.append(float(f(t)))
                except Exception:
                    ys.append(float("nan"))
            annotations.append("Finite interval sampled for 2D visualization.")
        except Exception:
            annotations.append("Visualization sampling could not be produced for current bounds.")
    else:
        annotations.append("Improper bounds detected; use transformed finite-domain visualization.")
    add_step(steps, "Visualization adapter", "Prepared plot payload from the same working expression.", execution.method, None, samples=len(xs))
    return VisualizationPayload("2d-integral-area", sp.latex(execution.working_expression), xs, ys, annotations)


def code_generator(config: IntegralConfig, execution: MethodExecution, steps: list[StepRecord]) -> CodeAppendix:
    code = (
        "result = solve(IntegralConfig("
        f"expression={config.expression!r}, lower={config.lower!r}, upper={config.upper!r}, "
        f"selected_method={execution.method!r}))"
    )
    add_step(steps, "Code generator", "Created reproducible code appendix entrypoint.", execution.method, None)
    return CodeAppendix("python", "reproducible-integral-pipeline", "solve(IntegralConfig(...))", code)


def report_generator(problem: NormalizedProblem, execution: MethodExecution, verification: VerificationResult, numerical: NumericalResult, steps: list[StepRecord]) -> list[ReportSection]:
    sections = [
        ReportSection("Problem statement", f"Evaluate integral of {sp.sstr(problem.expression)} from {sp.sstr(problem.lower)} to {sp.sstr(problem.upper)}.", "parser"),
        ReportSection("Method", f"Selected method: {execution.method}. Working expression: {sp.sstr(execution.working_expression)}.", "method-executor"),
        ReportSection("Verification", f"Symbolic check: {verification.symbolic_check_passed}; numeric check: {verification.numeric_sample_check_passed}; singularity check: {verification.singularity_check_passed}.", "verification-engine"),
        ReportSection("Numerical fallback", f"Route: {numerical.route}; value: {numerical.value}; estimated error: {numerical.estimated_abs_error}.", "numerical-fallback"),
    ]
    add_step(steps, "Report generator", "Assembled report-ready sections from deterministic pipeline outputs.", execution.method, None, sections=len(sections))
    return sections


def dependency_graph_connector(steps: list[StepRecord], execution: MethodExecution, verification: VerificationResult) -> list[DependencyNode]:
    graph = [
        DependencyNode("problem", "Parsed problem", tuple(), "ready"),
        DependencyNode("normalized", "Normalized expression", ("problem",), "ready"),
        DependencyNode("method", f"Method: {execution.method}", ("normalized",), execution.status),
        DependencyNode("verification", "Verification certificate", ("method",), "ready" if verification.symbolic_check_passed or verification.numeric_sample_check_passed else "review"),
        DependencyNode("visualization", "Visualization payload", ("method",), "ready"),
        DependencyNode("code", "Code appendix", ("method", "verification"), "ready"),
        DependencyNode("report", "Report sections", ("method", "verification", "visualization", "code"), "ready"),
    ]
    add_step(steps, "Dependency graph connector", "Connected result, graph, code, and report dependencies for stale/outdated detection.", execution.method, None, nodes=len(graph))
    return graph


def solve(config: IntegralConfig) -> IntegralResult:
    started = time.perf_counter()
    issues: list[StructuredIssue] = []
    steps: list[StepRecord] = []
    parsed = parse_config(config, issues, steps)
    problem = normalize_problem(parsed, config, issues, steps)

    if any(isinstance(v, sp.Float) for v in [problem.lower, problem.upper]):
        add_issue(
            issues,
            "DECIMAL_BOUND_USED",
            "info",
            "A decimal bound was used; exact constants such as pi preserve symbolic precision.",
            "Use pi instead of 3.14159 when exact symbolic reporting matters.",
        )

    recommendation = detect_method(problem, config, issues, steps)
    execution = execute_method(problem, config, recommendation, issues, steps)
    numerical = numerical_fallback(problem, execution.method, config, issues, steps)
    numeric_value = str(sp.N(execution.exact, config.digits)) if execution.exact is not None else numerical.value
    status = execution.status if numeric_value is not None else "failed"
    verification = verify_result(problem, execution, numerical, config, issues, steps)
    visualization = visualization_adapter(problem, execution, config, steps)
    code_appendix = code_generator(config, execution, steps)
    report_sections = report_generator(problem, execution, verification, numerical, steps)
    dependency_graph = dependency_graph_connector(steps, execution, verification)
    trust = build_trust(execution.method, execution.exact, numerical, issues, config)
    capsule_payload = {
        "input": config.expression,
        "bounds": [config.lower, config.upper],
        "method": execution.method,
        "detected_structure": recommendation.detected_structure,
        "engine": "sympy",
        "engine_version": sp.__version__,
        "numeric_settings": {
            "digits": config.digits,
            "tolerance": config.tolerance,
            "max_subdivisions": config.max_subdivisions,
            "numeric_method": numerical.route,
        },
        "exact_latex": sp.latex(execution.exact) if execution.exact is not None else None,
        "numeric_value": numeric_value,
    }
    capsule = ReproducibilityCapsule(
        input=config.expression,
        bounds=(config.lower, config.upper),
        method=execution.method,
        engine="sympy",
        engine_version=sp.__version__,
        assumptions=config.assumptions,
        numeric_settings=capsule_payload["numeric_settings"],
        result_hash=hash_result(capsule_payload),
        created_at_epoch=time.time(),
    )

    return IntegralResult(
        status=status,
        method=execution.method,
        method_recommendation=recommendation,
        expression_latex=sp.latex(problem.expression),
        working_expression_latex=sp.latex(execution.working_expression),
        antiderivative_latex=sp.latex(execution.antiderivative) if execution.antiderivative is not None else None,
        exact_latex=sp.latex(execution.exact) if execution.exact is not None else None,
        numeric_value=numeric_value,
        steps=steps,
        verification=verification,
        numerical=numerical,
        numerical_trust=trust,
        visualization=visualization,
        code_appendix=code_appendix,
        report_sections=report_sections,
        dependency_graph=dependency_graph,
        capsule=capsule,
        issues=issues,
        warnings=[issue.message for issue in issues if issue.severity != "info"],
        execution_time_ms=round((time.perf_counter() - started) * 1000, 2),
    )


if __name__ == "__main__":
    config = IntegralConfig(
        expression=${expr},
        lower=${lower},
        upper=${upper},
        selected_method=${method},
        digits=15,
    )
    result = solve(config)
    print(json.dumps(asdict(result), indent=2, ensure_ascii=False))
${teaching ? "\n    # Teaching note: derivative_passed and boundary_passed are the first checks to inspect before using the answer in a report.\n" : ""}${production ? "\n    # Production note: persist result.capsule with your report so the computation can be reproduced later.\n" : ""}`;
}

function buildScipyCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "adaptive-quadrature");

    return `from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Callable
import json
import time
import numpy as np
import sympy as sp
from scipy import integrate


@dataclass(frozen=True)
class NumericIntegralConfig:
    expression: str
    lower: str
    upper: str
    selected_method: str = ${method}
    variable: str = "x"
    abs_tol: float = 1e-11
    rel_tol: float = 1e-11
    max_subdivisions: int = 300
    gauss_order: int = 96
    simpson_segments: int = 2000
    monte_carlo_samples: int = 200_000
    seed: int = 42


@dataclass(frozen=True)
class NumericIntegralResult:
    method: str
    value: float
    estimated_abs_error: float | None
    confidence_percent: int
    elapsed_ms: float
    warnings: list[str]


def parse(config: NumericIntegralConfig):
    x = sp.symbols(config.variable, real=True)
    local_dict = {config.variable: x, "sin": sp.sin, "cos": sp.cos, "tan": sp.tan, "exp": sp.exp, "log": sp.log, "ln": sp.log, "sqrt": sp.sqrt, "pi": sp.pi, "E": sp.E}
    expr = sp.sympify(config.expression.replace("^", "**"), locals=local_dict)
    a = float(sp.N(sp.sympify(config.lower.replace("^", "**"), locals=local_dict)))
    b = float(sp.N(sp.sympify(config.upper.replace("^", "**"), locals=local_dict)))
    f = sp.lambdify(x, expr, "numpy")
    return expr, a, b, lambda t: np.asarray(f(t), dtype=float)


def adaptive_quad(f: Callable[[float], float], a: float, b: float, config: NumericIntegralConfig):
    value, error = integrate.quad(lambda t: float(f(t)), a, b, epsabs=config.abs_tol, epsrel=config.rel_tol, limit=config.max_subdivisions)
    return float(value), float(error), "scipy.integrate.quad"


def quad_vec_strategy(f: Callable[[np.ndarray], np.ndarray], a: float, b: float, config: NumericIntegralConfig):
    value, error = integrate.quad_vec(lambda t: np.asarray([float(f(t))]), a, b, epsabs=config.abs_tol, epsrel=config.rel_tol)
    return float(value[0]), float(error), "scipy.integrate.quad_vec"


def nquad_strategy(f: Callable[[float], float], a: float, b: float, config: NumericIntegralConfig):
    value, error = integrate.nquad(lambda t: float(f(t)), [[a, b]], opts={"epsabs": config.abs_tol, "epsrel": config.rel_tol, "limit": config.max_subdivisions})
    return float(value), float(error), "scipy.integrate.nquad"


def gauss_legendre(f: Callable[[np.ndarray], np.ndarray], a: float, b: float, config: NumericIntegralConfig):
    nodes, weights = np.polynomial.legendre.leggauss(config.gauss_order)
    mapped = 0.5 * (nodes + 1.0) * (b - a) + a
    value = 0.5 * (b - a) * np.sum(weights * f(mapped))
    higher_nodes, higher_weights = np.polynomial.legendre.leggauss(config.gauss_order * 2)
    higher_mapped = 0.5 * (higher_nodes + 1.0) * (b - a) + a
    higher_value = 0.5 * (b - a) * np.sum(higher_weights * f(higher_mapped))
    return float(value), float(abs(higher_value - value)), f"gauss-legendre-{config.gauss_order}"


def composite_simpson(f: Callable[[np.ndarray], np.ndarray], a: float, b: float, config: NumericIntegralConfig):
    n = config.simpson_segments + (config.simpson_segments % 2)
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    h = (b - a) / n
    value = h / 3.0 * (ys[0] + ys[-1] + 4.0 * np.sum(ys[1:-1:2]) + 2.0 * np.sum(ys[2:-1:2]))
    config_half = NumericIntegralConfig(**{**asdict(config), "simpson_segments": max(2, n // 2)})
    n2 = config_half.simpson_segments + (config_half.simpson_segments % 2)
    xs2 = np.linspace(a, b, n2 + 1)
    ys2 = f(xs2)
    h2 = (b - a) / n2
    value2 = h2 / 3.0 * (ys2[0] + ys2[-1] + 4.0 * np.sum(ys2[1:-1:2]) + 2.0 * np.sum(ys2[2:-1:2]))
    return float(value), float(abs(value - value2) / 15.0), f"composite-simpson-{n}"


def monte_carlo(f: Callable[[np.ndarray], np.ndarray], a: float, b: float, config: NumericIntegralConfig):
    rng = np.random.default_rng(config.seed)
    xs = rng.uniform(a, b, config.monte_carlo_samples)
    values = f(xs)
    estimate = (b - a) * float(np.mean(values))
    stderr = abs(b - a) * float(np.std(values, ddof=1) / np.sqrt(config.monte_carlo_samples))
    return estimate, 1.96 * stderr, f"monte-carlo-{config.monte_carlo_samples}"


def solve(config: NumericIntegralConfig) -> NumericIntegralResult:
    started = time.perf_counter()
    _, a, b, f = parse(config)
    warnings: list[str] = []
    strategies = {
        "adaptive-quadrature": adaptive_quad,
        "numeric-check": adaptive_quad,
        "numeric-only": adaptive_quad,
        "tanh-sinh": adaptive_quad,
        "quad-vec": quad_vec_strategy,
        "nquad": nquad_strategy,
        "gauss-legendre": gauss_legendre,
        "composite-simpson": composite_simpson,
        "monte-carlo": monte_carlo,
    }
    if config.selected_method == "tanh-sinh":
        warnings.append("SciPy has no native tanh-sinh here; adaptive quad is used. Use mpmath.quadts for a strict tanh-sinh route.")
    if config.selected_method not in strategies:
        warnings.append(f"Selected method {config.selected_method!r} is analytic; adaptive quadrature used as independent numeric benchmark.")
    value, error, method_label = strategies.get(config.selected_method, adaptive_quad)(f, a, b, config)
    confidence = 98 if error is not None and error < max(config.abs_tol, 1e-14) * 10 else 88
    if warnings:
        confidence -= min(20, len(warnings) * 5)
    return NumericIntegralResult(
        method=method_label,
        value=float(value),
        estimated_abs_error=float(error) if error is not None else None,
        confidence_percent=max(35, confidence),
        elapsed_ms=round((time.perf_counter() - started) * 1000, 2),
        warnings=warnings,
    )


if __name__ == "__main__":
    result = solve(NumericIntegralConfig(expression=${expr}, lower=${lower}, upper=${upper}, selected_method=${method}))
    print(json.dumps(asdict(result), indent=2))
`;
}

function buildBasicCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "composite-simpson");

    return `from __future__ import annotations

import math
import time


selected_method = ${method}
expression = ${expr}
lower = ${lower}
upper = ${upper}


def safe_eval(x: float) -> float:
    allowed = {
        "x": x,
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "exp": math.exp,
        "sqrt": math.sqrt,
        "log": math.log,
        "ln": math.log,
        "pi": math.pi,
        "E": math.e,
    }
    return float(eval(expression.replace("^", "**"), {"__builtins__": {}}, allowed))


def composite_simpson(a: float, b: float, n: int = 2000) -> tuple[float, float]:
    if n % 2:
        n += 1
    h = (b - a) / n
    total = safe_eval(a) + safe_eval(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * safe_eval(a + i * h)
    value = total * h / 3.0

    half_n = max(2, n // 2)
    if half_n % 2:
        half_n += 1
    h2 = (b - a) / half_n
    total2 = safe_eval(a) + safe_eval(b)
    for i in range(1, half_n):
        total2 += (4 if i % 2 else 2) * safe_eval(a + i * h2)
    half_value = total2 * h2 / 3.0
    error_estimate = abs(value - half_value) / 15.0
    return value, error_estimate


if __name__ == "__main__":
    started = time.perf_counter()
    a = float(eval(lower.replace("^", "**"), {"__builtins__": {}}, {"pi": math.pi, "E": math.e}))
    b = float(eval(upper.replace("^", "**"), {"__builtins__": {}}, {"pi": math.pi, "E": math.e}))
    value, error = composite_simpson(a, b)
    print({
        "selected_method": selected_method,
        "numeric_value": value,
        "estimated_abs_error": error,
        "confidence_note": "stdlib Simpson route; use SymPy/SciPy modes for publication-grade audit",
        "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
    })
`;
}

function buildMatplotlibCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "adaptive-quadrature");

    return `from __future__ import annotations

import numpy as np
import sympy as sp
import matplotlib.pyplot as plt
from scipy.integrate import quad

x = sp.symbols("x", real=True)
expr = sp.sympify(${expr}.replace("^", "**"))
a = float(sp.N(sp.sympify(${lower}.replace("^", "**"))))
b = float(sp.N(sp.sympify(${upper}.replace("^", "**"))))
selected_method = ${method}
f = sp.lambdify(x, expr, "numpy")

value, error = quad(lambda t: float(f(t)), a, b, epsabs=1e-11, epsrel=1e-11, limit=300)
xs = np.linspace(a, b, 800)
ys = f(xs)

fig, ax = plt.subplots(figsize=(10, 5.5), dpi=140)
ax.plot(xs, ys, linewidth=2.2, label=f"f(x) = {sp.sstr(expr)}")
ax.fill_between(xs, ys, alpha=0.22, label="integrated area")
ax.axhline(0, color="black", linewidth=0.8, alpha=0.45)
ax.set_title(f"{selected_method}: integral = {value:.12g}; estimated error <= {error:.2e}")
ax.set_xlabel("x")
ax.set_ylabel("f(x)")
ax.grid(True, alpha=0.25)
ax.legend()
fig.tight_layout()
plt.show()
`;
}

function buildApiCallCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "auto");

    return `type IntegralSolveRequest = {
  mode: "single";
  expression: string;
  lower: string;
  upper: string;
  method: string;
  require_verification: boolean;
  include_reproducibility_capsule: boolean;
};

const payload: IntegralSolveRequest = {
  mode: "single",
  expression: ${expr},
  lower: ${lower},
  upper: ${upper},
  method: ${method},
  require_verification: true,
  include_reproducibility_capsule: true,
};

const response = await fetch("/api/laboratory/integral/solve/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(\`Integral solve failed: \${response.status} \${response.statusText}\`);
}

const result = await response.json();
console.log({
  status: result.status,
  method: result.reproducibility?.selected_method ?? payload.method,
  exact: result.exact?.evaluated_latex,
  numeric: result.exact?.numeric_approximation,
  verification: result.verification,
  reproducibility: result.reproducibility,
});
`;
}

function buildNotebook(mode: IntegralCodeExportMode, input: IntegralCodeGeneratorInput) {
    const sympy = buildIntegralSympyCode(input, "standard");
    const scipy = buildScipyCode(input);
    const cells = [
        { cell_type: "markdown", metadata: {}, source: ["# MathSphere integral worksheet\\n", `Selected method: ${methodLabel(input.solveMethod)}\\n`] },
        { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: sympy.split("\n").map((line) => `${line}\n`) },
    ];
    if (mode === "colab" || NUMERIC_METHODS.has(selectedMethod(input))) {
        cells.push({ cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: scipy.split("\n").map((line) => `${line}\n`) });
    }
    return JSON.stringify(
        {
            cells,
            metadata: {
                kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
                language_info: { name: "python" },
                ...(mode === "colab" ? { colab: { name: "mathsphere-integral-reproduction.ipynb" } } : {}),
            },
            nbformat: 4,
            nbformat_minor: 5,
        },
        null,
        2,
    );
}

export function buildIntegralCodeForMode(mode: IntegralCodeExportMode, input: IntegralCodeGeneratorInput) {
    if (mode === "python-sympy") return buildIntegralSympyCode(input, "standard");
    if (mode === "python-scipy") return buildScipyCode(input);
    if (mode === "python-basic") return buildBasicCode(input);
    if (mode === "python-matplotlib") return buildMatplotlibCode(input);
    if (mode === "api-call") return buildApiCallCode(input);
    if (mode === "production") return buildIntegralSympyCode(input, "production");
    if (mode === "teaching") return buildIntegralSympyCode(input, "teaching");
    if (mode === "latex-appendix") {
        return `\\appendix
\\section{Reproducible Integral Code}
\\begin{lstlisting}[language=Python]
${buildIntegralSympyCode(input, "production")}
\\end{lstlisting}
`;
    }
    return buildNotebook(mode, input);
}
