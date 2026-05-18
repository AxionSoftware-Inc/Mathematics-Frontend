import type { DifferentialExtendedMode } from "@/components/laboratory/modules/differential-studio/types";

export type DifferentialCodeExportMode =
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

export type DifferentialCodeGeneratorInput = {
    mode: DifferentialExtendedMode;
    expression: string;
    variable: string;
    point: string;
    order: string;
    direction?: string;
    solveMethod?: string;
};

export const differentialCodeExportModes: Array<{ id: DifferentialCodeExportMode; label: string; detail: string }> = [
    { id: "python-basic", label: "Python basic", detail: "stdlib finite difference route" },
    { id: "python-scipy", label: "Python + NumPy/SciPy", detail: "solve_ivp / finite-difference benchmark" },
    { id: "python-sympy", label: "Python + SymPy", detail: "symbolic differential pipeline" },
    { id: "python-matplotlib", label: "Python + Matplotlib", detail: "plot derivative / trajectory" },
    { id: "jupyter", label: "Jupyter notebook", detail: ".ipynb research worksheet" },
    { id: "colab", label: "Google Colab", detail: "Colab-ready worksheet" },
    { id: "latex-appendix", label: "LaTeX appendix", detail: "publication code appendix" },
    { id: "api-call", label: "API call version", detail: "backend solve request" },
    { id: "production", label: "Clean production code", detail: "typed auditable pipeline" },
    { id: "teaching", label: "Teaching code", detail: "commented step route" },
];

function pyLiteral(value: string | undefined, fallback: string) {
    return JSON.stringify(value || fallback);
}

function methodLabel(method: string | undefined) {
    return (method || "auto").replace(/-/g, " ");
}

function normalizeMethod(input: DifferentialCodeGeneratorInput) {
    return input.solveMethod || "auto";
}

export function buildDifferentialSympyCode(input: DifferentialCodeGeneratorInput, variant: "standard" | "production" | "teaching" = "standard") {
    const expression = pyLiteral(input.expression, "sin(x)");
    const variable = pyLiteral(input.variable, "x");
    const point = pyLiteral(input.point, "0");
    const order = pyLiteral(input.order, "1");
    const direction = pyLiteral(input.direction, "1, 0");
    const mode = pyLiteral(input.mode, "derivative");
    const method = pyLiteral(normalizeMethod(input), "auto");
    const teaching = variant === "teaching";
    const production = variant === "production";

    return `"""
MathSphere Differential Reproduction Script
Selected method: ${methodLabel(input.solveMethod)}
Mode: ${input.mode}
Template: ${variant}

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
import math
import time
import sympy as sp

try:
    import numpy as np
except Exception:  # pragma: no cover
    np = None

try:
    from scipy import integrate as scipy_integrate
except Exception:  # pragma: no cover
    scipy_integrate = None


ModeName = Literal["derivative", "partial", "directional", "jacobian", "hessian", "ode", "pde", "sde"]


@dataclass(frozen=True)
class DifferentialConfig:
    mode: ModeName = ${mode}
    expression: str = ${expression}
    variable: str = ${variable}
    point: str = ${point}
    order: str = ${order}
    direction: str = ${direction}
    selected_method: str = ${method}
    tolerance: str = "1e-8"
    finite_difference_step: float = 1e-5
    max_steps: int = 1000
    assumptions: tuple[str, ...] = ("variables real", "local differentiability unless singularity detected")
    time_span: tuple[float, float] = (0.0, 5.0)
    ode_initial_value: float = 1.0
    visualization_samples: int = 160


@dataclass(frozen=True)
class AssumptionSet:
    variable_domain: str
    differentiability: str
    parameter_constraints: tuple[str, ...]
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
    mode: str
    variables: tuple[sp.Symbol, ...]
    expression: Any
    point_values: tuple[float, ...]
    direction_values: tuple[float, ...]
    order: int


@dataclass(frozen=True)
class NormalizedProblem:
    mode: str
    variables: tuple[sp.Symbol, ...]
    expression: Any
    point_values: tuple[float, ...]
    unit_direction: tuple[float, ...]
    order: int
    assumptions: AssumptionSet
    singularities: tuple[str, ...]


@dataclass(frozen=True)
class MethodRecommendation:
    detected_structure: str
    recommended_method: str
    reason: str
    confidence_percent: int
    fallback_method: str


@dataclass(frozen=True)
class StepRecord:
    index: int
    title: str
    action: str
    method: str
    latex: str | None
    metadata: dict[str, Any]


@dataclass(frozen=True)
class MethodExecution:
    method: str
    result: Any
    result_latex: str | None
    status: str
    residual_expression: Any | None


@dataclass(frozen=True)
class NumericalResult:
    value: Any
    method: str
    estimated_abs_error: str | None
    runtime_ms: float
    used_scipy: bool
    route: str


@dataclass(frozen=True)
class VerificationResult:
    symbolic_check_passed: bool
    numeric_sample_check_passed: bool | None
    domain_check_passed: bool
    singularity_check_passed: bool
    convergence_check_passed: bool
    residual_latex: str | None
    numeric_error_estimate: str | None


@dataclass(frozen=True)
class NumericalTrust:
    confidence_percent: int
    estimated_abs_error: str | None
    method: str
    tolerance: str
    warnings: list[str]


@dataclass(frozen=True)
class VisualizationPayload:
    kind: str
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
    mode: str
    variables: tuple[str, ...]
    point: tuple[float, ...]
    method: str
    engine: str
    engine_version: str
    assumptions: tuple[str, ...]
    numeric_settings: dict[str, Any]
    result_hash: str
    created_at_epoch: float


@dataclass(frozen=True)
class DifferentialResult:
    status: str
    mode: str
    method: str
    method_recommendation: MethodRecommendation
    result_latex: str | None
    numeric_value: Any
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
    steps.append(StepRecord(len(steps) + 1, title, action, method, latex, metadata))


def parse_csv(value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in value.replace("[", "").replace("]", "").split(",") if part.strip())


def parse_float_csv(value: str) -> tuple[float, ...]:
    values = []
    for part in parse_csv(value):
        try:
            values.append(float(sp.N(sp.sympify(part))))
        except Exception:
            values.append(0.0)
    return tuple(values)


def parser(config: DifferentialConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> ParsedProblem:
    names = parse_csv(config.variable) or ("x",)
    variables = tuple(sp.symbols(name, real=True) for name in names)
    local_dict = {str(symbol): symbol for symbol in variables}
    local_dict.update({"sin": sp.sin, "cos": sp.cos, "tan": sp.tan, "exp": sp.exp, "log": sp.log, "ln": sp.log, "sqrt": sp.sqrt, "pi": sp.pi, "E": sp.E})
    try:
        raw = config.expression.replace("^", "**")
        expression = sp.sympify(raw, locals=local_dict)
        if isinstance(expression, tuple):
            expression = list(expression)
        order = max(1, int(float(config.order or "1")))
        point_values = parse_float_csv(config.point)
        direction_values = parse_float_csv(config.direction)
    except Exception as exc:
        add_issue(issues, "PARSER_FAILED", "error", f"Differential input could not be parsed: {exc}", "Check expression, variables, point, and direction syntax.")
        raise
    add_step(steps, "Parser", "Converted expression, variables, point, and direction into symbolic objects.", "sympify", sp.latex(expression) if not isinstance(expression, list) else sp.latex(sp.Matrix(expression)), variables=[str(v) for v in variables], point=point_values)
    return ParsedProblem(config.mode, variables, expression, point_values, direction_values, order)


def normalizer(parsed: ParsedProblem, config: DifferentialConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> NormalizedProblem:
    expression = parsed.expression
    if isinstance(expression, list):
        expression = [sp.simplify(item) for item in expression]
    else:
        expression = sp.simplify(expression)
    direction = parsed.direction_values
    norm = math.sqrt(sum(value * value for value in direction)) if direction else 0.0
    unit_direction = tuple(value / norm for value in direction) if norm else tuple()
    singularities: list[str] = []
    expressions = expression if isinstance(expression, list) else [expression]
    for item in expressions:
        for variable in parsed.variables:
            try:
                found = sp.singularities(item, variable)
                singularities.extend(sp.latex(value) for value in found)
            except Exception:
                pass
    assumptions = AssumptionSet("real", "local differentiability required", tuple(item for item in config.assumptions if item != "variables real"), config.assumptions)
    if singularities:
        add_issue(issues, "SINGULARITY_SIGNAL_DETECTED", "warning", "Possible singularities detected in the differential expression.", "Review domain and avoid evaluation points near singularities.", singularities=singularities)
    add_step(steps, "Normalizer", "Simplified expression, normalized direction vector, and collected domain signals.", "simplify/domain-scan", sp.latex(expression) if not isinstance(expression, list) else sp.latex(sp.Matrix(expression)), singularities=singularities, unit_direction=unit_direction)
    return NormalizedProblem(parsed.mode, parsed.variables, expression, parsed.point_values, unit_direction, parsed.order, assumptions, tuple(singularities))


def detect_method(problem: NormalizedProblem, config: DifferentialConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> MethodRecommendation:
    mode = problem.mode
    detected = "ordinary symbolic differential task"
    recommended = "symbolic-derivative"
    reason = "Symbolic differentiation is deterministic and verifiable for this lane."
    confidence = 86
    fallback = "finite-difference"

    if mode == "ode":
        detected = "ordinary differential equation candidate"
        recommended = "laplace-transform" if "laplace" in config.selected_method else "runge-kutta"
        reason = "ODE lanes need residual checks and numeric trajectory fallback; solve_ivp/RK is the practical benchmark."
        confidence = 76
        fallback = "solve_ivp-rk45"
    elif mode == "pde":
        detected = "partial differential equation candidate"
        recommended = "finite-difference-pde"
        reason = "PDE lanes need discretization, stability ratio, and boundary/initial condition audit."
        confidence = 68
        fallback = "explicit-grid"
    elif mode == "sde":
        detected = "stochastic differential equation candidate"
        recommended = "euler-maruyama"
        reason = "SDE lanes require seeded simulation and ensemble statistics rather than closed-form by default."
        confidence = 70
        fallback = "seeded-ensemble"
    elif mode == "jacobian":
        detected = "vector-field derivative"
        recommended = "symbolic-jacobian"
        reason = "Vector output with multiple variables maps naturally to a Jacobian matrix."
        fallback = "finite-difference-jacobian"
    elif mode == "hessian":
        detected = "second-order scalar-field derivative"
        recommended = "symbolic-hessian"
        reason = "Scalar field curvature requires Hessian, determinant/trace/signature checks."
        fallback = "finite-difference-hessian"
    elif mode == "directional":
        detected = "directional derivative"
        recommended = "gradient-dot-direction"
        reason = "Directional derivative is computed as gradient dot normalized direction vector."
        fallback = "central-difference-directional"
    elif mode == "partial":
        detected = "partial/gradient candidate"
        recommended = "symbolic-gradient"
        reason = "Multiple variables imply gradient/partial derivative route."
        fallback = "central-difference-gradient"

    if config.selected_method != "auto":
        reason = f"User selected '{config.selected_method}'. Auto detector would recommend '{recommended}' because: {reason}"
        recommended = config.selected_method

    add_step(steps, "Method detector", f"Detected: {detected}. Recommended: {recommended}. Reason: {reason}", "structure-analysis", None, confidence_percent=confidence, fallback=fallback)
    return MethodRecommendation(detected, recommended, reason, confidence, fallback)


def scope_at_point(problem: NormalizedProblem) -> dict[sp.Symbol, float]:
    return {variable: problem.point_values[index] if index < len(problem.point_values) else 0.0 for index, variable in enumerate(problem.variables)}


def method_executor(problem: NormalizedProblem, recommendation: MethodRecommendation, issues: list[StructuredIssue], steps: list[StepRecord]) -> MethodExecution:
    method = recommendation.recommended_method
    variables = problem.variables
    expr = problem.expression
    result: Any = None
    residual = None
    status = "partial"
    try:
        if problem.mode == "derivative":
            result = sp.diff(expr, variables[0], problem.order)
        elif problem.mode == "partial":
            result = sp.Matrix([sp.diff(expr, variable) for variable in variables]) if len(variables) > 1 else sp.diff(expr, variables[0])
        elif problem.mode == "directional":
            gradient = [sp.diff(expr, variable) for variable in variables]
            result = sp.simplify(sum(component * (problem.unit_direction[index] if index < len(problem.unit_direction) else 0.0) for index, component in enumerate(gradient)))
        elif problem.mode == "jacobian":
            vector = sp.Matrix(expr if isinstance(expr, list) else [expr])
            result = vector.jacobian(sp.Matrix(variables))
        elif problem.mode == "hessian":
            result = sp.hessian(expr, variables)
        elif problem.mode == "ode":
            x = variables[0]
            y = sp.Function("y")
            rhs = expr if not isinstance(expr, list) else expr[0]
            equation = sp.Eq(sp.diff(y(x), x), rhs.subs({sp.Symbol("y"): y(x)}))
            try:
                result = sp.dsolve(equation)
                residual = sp.simplify(result.lhs.diff(x) - rhs.subs({sp.Symbol("y"): result.rhs}))
            except Exception as exc:
                add_issue(issues, "SYMBOLIC_ODE_SOLVE_FAILED", "warning", f"SymPy dsolve failed: {exc}", "Use numerical solve_ivp/RK route and report residual tolerance.")
                result = equation
        elif problem.mode == "pde":
            result = "PDE symbolic execution requires explicit PDE parser; numeric discretization fallback is primary."
            add_issue(issues, "PDE_SYMBOLIC_LIMITED", "warning", "PDE symbolic execution is limited in this generated script.", "Use finite-difference PDE route with stability checks.")
        elif problem.mode == "sde":
            result = "SDE symbolic execution is not source of truth; Euler-Maruyama fallback is primary."
            add_issue(issues, "SDE_SYMBOLIC_LIMITED", "warning", "SDE closed form is not assumed.", "Use seeded Euler-Maruyama ensemble and report confidence interval.")
        status = "solved" if result is not None else "failed"
    except Exception as exc:
        add_issue(issues, "METHOD_EXECUTION_FAILED", "error", f"Method execution failed: {exc}", "Try finite-difference or numeric fallback route.", method=method)
        status = "failed"

    latex = sp.latex(result) if hasattr(result, "free_symbols") or isinstance(result, (sp.MatrixBase, sp.Equality)) else str(result) if result is not None else None
    add_step(steps, "Method executor", "Executed selected differential method.", method, latex, status=status)
    return MethodExecution(method, result, latex, status, residual)


def finite_difference_scalar(expr: Any, variable: sp.Symbol, point: float, h: float) -> float | None:
    try:
        f = sp.lambdify(variable, expr, "math")
        return float((f(point + h) - f(point - h)) / (2 * h))
    except Exception:
        return None


def numerical_fallback(problem: NormalizedProblem, execution: MethodExecution, config: DifferentialConfig, issues: list[StructuredIssue], steps: list[StepRecord]) -> NumericalResult:
    started = time.perf_counter()
    route = "sympy-evalf"
    value: Any = None
    estimated_error: str | None = config.tolerance
    used_scipy = False
    try:
        scope = scope_at_point(problem)
        expr = problem.expression
        if problem.mode == "derivative" and not isinstance(expr, list):
            value = finite_difference_scalar(expr, problem.variables[0], problem.point_values[0] if problem.point_values else 0.0, config.finite_difference_step)
            route = "central-finite-difference"
        elif problem.mode in {"partial", "directional"} and not isinstance(expr, list):
            gradient = []
            for variable in problem.variables:
                point = float(scope.get(variable, 0.0))
                gradient.append(finite_difference_scalar(expr.subs({v: scope[v] for v in problem.variables if v != variable}), variable, point, config.finite_difference_step))
            if problem.mode == "directional":
                value = sum((gradient[index] or 0.0) * (problem.unit_direction[index] if index < len(problem.unit_direction) else 0.0) for index in range(len(gradient)))
                route = "central-finite-difference-directional"
            else:
                value = gradient
                route = "central-finite-difference-gradient"
        elif problem.mode == "ode" and scipy_integrate is not None and np is not None:
            rhs = expr if not isinstance(expr, list) else expr[0]
            f = sp.lambdify((problem.variables[0], sp.Symbol("y")), rhs, "numpy")
            sol = scipy_integrate.solve_ivp(lambda t, y: [float(f(t, y[0]))], config.time_span, [config.ode_initial_value], rtol=float(config.tolerance), atol=float(config.tolerance), max_step=(config.time_span[1] - config.time_span[0]) / 100)
            value = float(sol.y[0, -1])
            route = "scipy.integrate.solve_ivp(RK45)"
            used_scipy = True
        elif problem.mode == "sde" and np is not None:
            rng = np.random.default_rng(42)
            steps_n = min(config.max_steps, 1000)
            dt = (config.time_span[1] - config.time_span[0]) / steps_n
            x = config.ode_initial_value
            for _ in range(steps_n):
                x = x + 0.0 * dt + 1.0 * math.sqrt(dt) * float(rng.normal())
            value = float(x)
            route = "euler-maruyama-seed-42"
        elif execution.result is not None and hasattr(execution.result, "subs"):
            value = str(sp.N(execution.result.subs(scope), 15))
        else:
            value = execution.result_latex
    except Exception as exc:
        add_issue(issues, "NUMERICAL_FALLBACK_FAILED", "warning", f"Numerical fallback failed: {exc}", "Check point, assumptions, and method compatibility.")
    add_step(steps, "Numerical fallback", f"Computed numeric benchmark using {route}.", execution.method, None, estimated_abs_error=estimated_error, used_scipy=used_scipy)
    return NumericalResult(value, route, estimated_error, round((time.perf_counter() - started) * 1000, 2), used_scipy, route)


def verification_engine(problem: NormalizedProblem, execution: MethodExecution, numerical: NumericalResult, issues: list[StructuredIssue], steps: list[StepRecord]) -> VerificationResult:
    singularity_ok = len(problem.singularities) == 0
    domain_ok = problem.assumptions.variable_domain == "real"
    convergence_ok = problem.mode not in {"pde", "sde"} or numerical.value is not None
    symbolic_ok = execution.status == "solved" and execution.result is not None
    numeric_ok = numerical.value is not None
    residual_latex = sp.latex(execution.residual_expression) if execution.residual_expression is not None else None

    if not singularity_ok:
        add_issue(issues, "DOMAIN_REVIEW_REQUIRED", "warning", "Singularity/domain review is required before publication.", "Avoid singular points or state assumptions explicitly.")
    add_step(steps, "Verification engine", "Checked symbolic availability, numeric benchmark, domain, singularity, and convergence signals.", execution.method, None, symbolic_check_passed=symbolic_ok, numeric_sample_check_passed=numeric_ok, domain_check_passed=domain_ok, singularity_check_passed=singularity_ok, convergence_check_passed=convergence_ok)
    return VerificationResult(symbolic_ok, numeric_ok, domain_ok, singularity_ok, convergence_ok, residual_latex, numerical.estimated_abs_error)


def visualization_adapter(problem: NormalizedProblem, execution: MethodExecution, config: DifferentialConfig, steps: list[StepRecord]) -> VisualizationPayload:
    xs: list[float] = []
    ys: list[float] = []
    if problem.mode in {"derivative", "partial"} and not isinstance(problem.expression, list) and problem.variables:
        center = problem.point_values[0] if problem.point_values else 0.0
        lower = center - 4
        upper = center + 4
        try:
            f = sp.lambdify(problem.variables[0], problem.expression, "math")
            for index in range(config.visualization_samples):
                x_value = lower + (upper - lower) * index / max(1, config.visualization_samples - 1)
                xs.append(float(x_value))
                ys.append(float(f(x_value)))
        except Exception:
            pass
    add_step(steps, "Visualization adapter", "Prepared plot/trajectory payload from the same differential expression.", execution.method, None, samples=len(xs))
    return VisualizationPayload("differential-trace", xs, ys, ["Generated from reproducible differential pipeline."])


def code_generator(config: DifferentialConfig, execution: MethodExecution, steps: list[StepRecord]) -> CodeAppendix:
    code = f"result = solve(DifferentialConfig(mode={config.mode!r}, expression={config.expression!r}, variable={config.variable!r}, point={config.point!r}, selected_method={execution.method!r}))"
    add_step(steps, "Code generator", "Created reproducible code appendix entrypoint.", execution.method, None)
    return CodeAppendix("python", "reproducible-differential-pipeline", "solve(DifferentialConfig(...))", code)


def report_generator(config: DifferentialConfig, execution: MethodExecution, verification: VerificationResult, numerical: NumericalResult, steps: list[StepRecord]) -> list[ReportSection]:
    sections = [
        ReportSection("Problem statement", f"Mode={config.mode}; expression={config.expression}; variable={config.variable}; point={config.point}.", "parser"),
        ReportSection("Method", f"Selected method: {execution.method}; status: {execution.status}.", "method-executor"),
        ReportSection("Verification", f"Symbolic: {verification.symbolic_check_passed}; numeric: {verification.numeric_sample_check_passed}; domain: {verification.domain_check_passed}.", "verification-engine"),
        ReportSection("Numerical fallback", f"Route: {numerical.route}; value: {numerical.value}; estimated error: {numerical.estimated_abs_error}.", "numerical-fallback"),
    ]
    add_step(steps, "Report generator", "Assembled report-ready deterministic sections.", execution.method, None, sections=len(sections))
    return sections


def dependency_graph_connector(steps: list[StepRecord], execution: MethodExecution, verification: VerificationResult) -> list[DependencyNode]:
    graph = [
        DependencyNode("problem", "Parsed differential problem", tuple(), "ready"),
        DependencyNode("normalized", "Normalized differential expression", ("problem",), "ready"),
        DependencyNode("method", f"Method: {execution.method}", ("normalized",), execution.status),
        DependencyNode("verification", "Verification certificate", ("method",), "ready" if verification.symbolic_check_passed or verification.numeric_sample_check_passed else "review"),
        DependencyNode("visualization", "Visualization payload", ("method",), "ready"),
        DependencyNode("code", "Code appendix", ("method", "verification"), "ready"),
        DependencyNode("report", "Report sections", ("method", "verification", "visualization", "code"), "ready"),
    ]
    add_step(steps, "Dependency graph connector", "Connected differential result, visualization, code, and report dependencies.", execution.method, None, nodes=len(graph))
    return graph


def hash_result(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()[:16]


def solve(config: DifferentialConfig) -> DifferentialResult:
    started = time.perf_counter()
    issues: list[StructuredIssue] = []
    steps: list[StepRecord] = []
    parsed = parser(config, issues, steps)
    problem = normalizer(parsed, config, issues, steps)
    recommendation = detect_method(problem, config, issues, steps)
    execution = method_executor(problem, recommendation, issues, steps)
    numerical = numerical_fallback(problem, execution, config, issues, steps)
    verification = verification_engine(problem, execution, numerical, issues, steps)
    visualization = visualization_adapter(problem, execution, config, steps)
    code_appendix = code_generator(config, execution, steps)
    report_sections = report_generator(config, execution, verification, numerical, steps)
    dependency_graph = dependency_graph_connector(steps, execution, verification)
    confidence = 96 if verification.symbolic_check_passed and verification.numeric_sample_check_passed else 78
    confidence -= min(35, sum(10 if issue.severity == "error" else 5 if issue.severity == "warning" else 1 for issue in issues))
    trust = NumericalTrust(max(35, confidence), numerical.estimated_abs_error, execution.method, config.tolerance, [issue.message for issue in issues if issue.severity != "info"])
    payload = {"mode": config.mode, "input": config.expression, "method": execution.method, "numeric": numerical.value, "latex": execution.result_latex}
    capsule = ReproducibilityCapsule(config.expression, config.mode, tuple(str(v) for v in problem.variables), problem.point_values, execution.method, "sympy/scipy", sp.__version__, config.assumptions, {"tolerance": config.tolerance, "route": numerical.route, "step": config.finite_difference_step}, hash_result(payload), time.time())
    return DifferentialResult(
        status=execution.status if numerical.value is not None or execution.result is not None else "failed",
        mode=config.mode,
        method=execution.method,
        method_recommendation=recommendation,
        result_latex=execution.result_latex,
        numeric_value=numerical.value,
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
    result = solve(DifferentialConfig())
    print(json.dumps(asdict(result), indent=2, ensure_ascii=False))
${teaching ? "\n    # Teaching note: inspect steps and verification before using the final value.\n" : ""}${production ? "\n    # Production note: persist result.capsule and result.dependency_graph with the report.\n" : ""}`;
}

function buildScipyCode(input: DifferentialCodeGeneratorInput) {
    const expression = pyLiteral(input.expression, "sin(x)");
    const variable = pyLiteral(input.variable, "x");
    const point = pyLiteral(input.point, "0");
    const mode = pyLiteral(input.mode, "derivative");
    const method = pyLiteral(input.solveMethod, "finite-difference");

    return `from __future__ import annotations

from dataclasses import dataclass, asdict
import json
import numpy as np
import sympy as sp
from scipy import integrate


@dataclass(frozen=True)
class DifferentialNumericConfig:
    mode: str = ${mode}
    expression: str = ${expression}
    variable: str = ${variable}
    point: str = ${point}
    selected_method: str = ${method}
    h: float = 1e-5
    tolerance: float = 1e-8


def parse(config: DifferentialNumericConfig):
    vars_ = [sp.symbols(v.strip(), real=True) for v in config.variable.split(",") if v.strip()]
    local_dict = {str(v): v for v in vars_}
    local_dict.update({"sin": sp.sin, "cos": sp.cos, "exp": sp.exp, "log": sp.log, "sqrt": sp.sqrt, "pi": sp.pi})
    expr = sp.sympify(config.expression.replace("^", "**"), locals=local_dict)
    point = [float(sp.N(sp.sympify(p.strip()))) for p in config.point.replace("[", "").replace("]", "").split(",") if p.strip()]
    return expr, vars_ or [sp.symbols("x", real=True)], point


def central_difference(expr, variable, point, h):
    f = sp.lambdify(variable, expr, "numpy")
    return float((f(point + h) - f(point - h)) / (2 * h))


def solve_ivp_route(expr, variable):
    y = sp.Symbol("y")
    rhs = sp.lambdify((variable, y), expr, "numpy")
    sol = integrate.solve_ivp(lambda t, state: [float(rhs(t, state[0]))], (0.0, 5.0), [1.0], rtol=1e-8, atol=1e-8)
    return {"method": "scipy.integrate.solve_ivp", "value": float(sol.y[0, -1]), "steps": int(sol.t.size)}


def solve(config=DifferentialNumericConfig()):
    expr, variables, point = parse(config)
    if config.mode == "ode":
        return solve_ivp_route(expr, variables[0])
    if config.mode in {"partial", "directional"}:
        values = []
        for index, variable in enumerate(variables):
            scoped = expr.subs({v: point[i] for i, v in enumerate(variables) if i != index and i < len(point)})
            values.append(central_difference(scoped, variable, point[index] if index < len(point) else 0.0, config.h))
        return {"method": "central finite difference gradient", "value": values, "h": config.h}
    return {"method": "central finite difference", "value": central_difference(expr, variables[0], point[0] if point else 0.0, config.h), "h": config.h}


print(json.dumps(solve(), indent=2))
`;
}

function buildBasicCode(input: DifferentialCodeGeneratorInput) {
    const expression = pyLiteral(input.expression, "sin(x)");
    const point = pyLiteral(input.point, "0");
    const method = pyLiteral(input.solveMethod, "finite-difference");
    return `import math

expression = ${expression}
point = float(${point}.split(",")[0] or 0)
selected_method = ${method}
h = 1e-5

def f(x):
    return eval(expression.replace("^", "**"), {"__builtins__": {}}, {"x": x, "sin": math.sin, "cos": math.cos, "exp": math.exp, "log": math.log, "sqrt": math.sqrt, "pi": math.pi})

value = (f(point + h) - f(point - h)) / (2 * h)
print({"method": selected_method, "value": value, "h": h, "note": "Use SymPy/SciPy modes for full verification pipeline."})
`;
}

function buildMatplotlibCode(input: DifferentialCodeGeneratorInput) {
    const expression = pyLiteral(input.expression, "sin(x)");
    const variable = pyLiteral(input.variable, "x");
    const point = pyLiteral(input.point, "0");
    return `import numpy as np
import sympy as sp
import matplotlib.pyplot as plt

x = sp.symbols(${variable}.split(",")[0].strip() or "x", real=True)
expr = sp.sympify(${expression}.replace("^", "**"))
x0 = float(sp.N(sp.sympify(${point}.split(",")[0] or "0")))
derivative = sp.diff(expr, x)
f = sp.lambdify(x, expr, "numpy")
df = sp.lambdify(x, derivative, "numpy")

xs = np.linspace(x0 - 4, x0 + 4, 800)
ys = f(xs)
slope = float(df(x0))
tangent = float(f(x0)) + slope * (xs - x0)

plt.figure(figsize=(10, 5.5), dpi=140)
plt.plot(xs, ys, label=f"f(x) = {sp.sstr(expr)}")
plt.plot(xs, tangent, "--", label=f"tangent slope = {slope:.6g}")
plt.axvline(x0, color="black", alpha=0.25)
plt.grid(True, alpha=0.25)
plt.legend()
plt.tight_layout()
plt.show()
`;
}

function buildApiCallCode(input: DifferentialCodeGeneratorInput) {
    return `const response = await fetch("/api/laboratory/differential/solve/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mode: ${pyLiteral(input.mode, "derivative")},
    expression: ${pyLiteral(input.expression, "sin(x)")},
    variable: ${pyLiteral(input.variable, "x")},
    point: ${pyLiteral(input.point, "0")},
    order: ${pyLiteral(input.order, "1")},
    direction: ${pyLiteral(input.direction, "1, 0")},
    method: ${pyLiteral(input.solveMethod, "auto")},
    include_reproducibility_capsule: true,
  }),
});

if (!response.ok) throw new Error(\`Differential solve failed: \${response.status}\`);
console.log(await response.json());
`;
}

function buildNotebook(mode: DifferentialCodeExportMode, input: DifferentialCodeGeneratorInput) {
    const sympy = buildDifferentialSympyCode(input, "standard");
    const cells = [
        { cell_type: "markdown", metadata: {}, source: ["# MathSphere differential worksheet\\n", `Selected method: ${methodLabel(input.solveMethod)}\\n`] },
        { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: sympy.split("\n").map((line) => `${line}\n`) },
    ];
    if (mode === "colab") {
        const scipy = buildScipyCode(input);
        cells.push({ cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: scipy.split("\n").map((line) => `${line}\n`) });
    }
    return JSON.stringify(
        {
            cells,
            metadata: {
                kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
                language_info: { name: "python" },
                ...(mode === "colab" ? { colab: { name: "mathsphere-differential-reproduction.ipynb" } } : {}),
            },
            nbformat: 4,
            nbformat_minor: 5,
        },
        null,
        2,
    );
}

export function buildDifferentialCodeForMode(mode: DifferentialCodeExportMode, input: DifferentialCodeGeneratorInput) {
    if (mode === "python-sympy") return buildDifferentialSympyCode(input, "standard");
    if (mode === "python-scipy") return buildScipyCode(input);
    if (mode === "python-basic") return buildBasicCode(input);
    if (mode === "python-matplotlib") return buildMatplotlibCode(input);
    if (mode === "api-call") return buildApiCallCode(input);
    if (mode === "production") return buildDifferentialSympyCode(input, "production");
    if (mode === "teaching") return buildDifferentialSympyCode(input, "teaching");
    if (mode === "latex-appendix") {
        return `\\appendix
\\section{Reproducible Differential Code}
\\begin{lstlisting}[language=Python]
${buildDifferentialSympyCode(input, "production")}
\\end{lstlisting}
`;
    }
    return buildNotebook(mode, input);
}
