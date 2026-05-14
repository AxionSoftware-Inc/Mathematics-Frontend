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
    { id: "python-basic", label: "Python basic", detail: "stdlib + Simpson skeleton" },
    { id: "python-scipy", label: "Python + NumPy/SciPy", detail: "method-aware numeric route" },
    { id: "python-sympy", label: "Python + SymPy", detail: "symbolic + verification certificate" },
    { id: "python-matplotlib", label: "Python + Matplotlib", detail: "plot + shaded area" },
    { id: "jupyter", label: "Jupyter notebook", detail: ".ipynb export" },
    { id: "colab", label: "Google Colab", detail: "Colab-ready notebook" },
    { id: "latex-appendix", label: "LaTeX appendix", detail: "lstlisting block" },
    { id: "api-call", label: "API call version", detail: "fetch backend endpoint" },
    { id: "production", label: "Clean production code", detail: "typed function + checks" },
    { id: "teaching", label: "Teaching code", detail: "step comments" },
];

function pyLiteral(value: string | undefined, fallback: string) {
    return JSON.stringify(value || fallback);
}

function methodLabel(method: string | undefined) {
    return (method || "auto").replace(/-/g, " ");
}

export function buildIntegralSympyCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "auto");

    return `"""
MathSphere Integral Reproduction Script
Selected method: ${methodLabel(input.solveMethod)}

Use this in Notebook, Code tab, Jupyter, or report appendix. It exposes parser,
method intent, symbolic result, numerical approximation, and verification checks.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any
import sympy as sp


@dataclass(frozen=True)
class IntegralConfig:
    expression: str
    lower: str
    upper: str
    variable: str = "x"
    selected_method: str = ${method}
    digits: int = 15


@dataclass(frozen=True)
class IntegralResult:
    method: str
    expression_latex: str
    antiderivative_latex: str | None
    exact_latex: str | None
    numeric_value: str | None
    verification: dict[str, Any]
    warnings: list[str]


def parse_config(config: IntegralConfig):
    x = sp.symbols(config.variable, real=True)
    return x, sp.sympify(config.expression), sp.sympify(config.lower), sp.sympify(config.upper)


def method_transform(expr: sp.Expr, x: sp.Symbol, method: str) -> sp.Expr:
    if method == "partial-fractions":
        return sp.apart(expr, x)
    if method == "series-expansion-integral":
        return sp.series(expr, x, 0, 10).removeO()
    if method == "special-functions":
        return expr.rewrite(sp.erf)
    return expr


def solve(config: IntegralConfig) -> IntegralResult:
    x, expr, lower, upper = parse_config(config)
    warnings: list[str] = []
    working_expr = method_transform(expr, x, config.selected_method)

    antiderivative = None
    exact = None
    try:
        antiderivative = sp.simplify(sp.integrate(working_expr, x))
    except Exception as exc:
        warnings.append(f"antiderivative failed: {exc}")

    try:
        exact = sp.simplify(sp.integrate(working_expr, (x, lower, upper)))
    except Exception as exc:
        warnings.append(f"definite integral failed: {exc}")

    derivative_residual = None
    boundary_residual = None
    if antiderivative is not None:
        derivative_residual = sp.simplify(sp.diff(antiderivative, x) - working_expr)
    if antiderivative is not None and exact is not None:
        boundary_residual = sp.simplify(antiderivative.subs(x, upper) - antiderivative.subs(x, lower) - exact)

    return IntegralResult(
        method=config.selected_method,
        expression_latex=sp.latex(expr),
        antiderivative_latex=sp.latex(antiderivative) if antiderivative is not None else None,
        exact_latex=sp.latex(exact) if exact is not None else None,
        numeric_value=str(sp.N(exact, config.digits)) if exact is not None else None,
        verification={
            "derivative_residual_latex": sp.latex(derivative_residual) if derivative_residual is not None else None,
            "boundary_residual_latex": sp.latex(boundary_residual) if boundary_residual is not None else None,
            "derivative_passed": derivative_residual == 0 if derivative_residual is not None else False,
            "boundary_passed": boundary_residual == 0 if boundary_residual is not None else False,
        },
        warnings=warnings,
    )


if __name__ == "__main__":
    result = solve(IntegralConfig(expression=${expr}, lower=${lower}, upper=${upper}))
    print(asdict(result))
`;
}

function buildScipyCode(input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "adaptive-quadrature");
    return `import sympy as sp
import numpy as np
from scipy import integrate

x = sp.symbols("x", real=True)
expr = sp.sympify(${expr})
a = float(sp.N(sp.sympify(${lower})))
b = float(sp.N(sp.sympify(${upper})))
selected_method = ${method}
f = sp.lambdify(x, expr, "numpy")

def quad_adaptive():
    value, error = integrate.quad(lambda t: float(f(t)), a, b, epsabs=1e-11, epsrel=1e-11, limit=300)
    return {"method": "scipy.quad", "value": value, "estimated_error": error}

def gauss_legendre(order=96):
    nodes, weights = np.polynomial.legendre.leggauss(order)
    mapped = 0.5 * (nodes + 1.0) * (b - a) + a
    value = 0.5 * (b - a) * np.sum(weights * f(mapped))
    return {"method": f"gauss-legendre-{order}", "value": float(value), "estimated_error": None}

def composite_simpson(n=2000):
    if n % 2:
        n += 1
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    h = (b - a) / n
    value = h / 3.0 * (ys[0] + ys[-1] + 4.0 * np.sum(ys[1:-1:2]) + 2.0 * np.sum(ys[2:-1:2]))
    return {"method": f"composite-simpson-{n}", "value": float(value), "estimated_error": None}

strategies = {
    "adaptive-quadrature": quad_adaptive,
    "numeric-check": quad_adaptive,
    "gauss-legendre": gauss_legendre,
    "composite-simpson": composite_simpson,
}

print(strategies.get(selected_method, quad_adaptive)())
`;
}

export function buildIntegralCodeForMode(mode: IntegralCodeExportMode, input: IntegralCodeGeneratorInput) {
    const expr = pyLiteral(input.expression, "sin(x)");
    const lower = pyLiteral(input.lower, "0");
    const upper = pyLiteral(input.upper, "1");
    const method = pyLiteral(input.solveMethod, "auto");
    const sympy = buildIntegralSympyCode(input);

    if (mode === "python-sympy") return sympy;
    if (mode === "python-scipy") return buildScipyCode(input);
    if (mode === "python-basic") {
        return `import math

selected_method = ${method}

def f(x):
    return eval(${expr}, {"__builtins__": {}}, {"x": x, "sin": math.sin, "cos": math.cos, "exp": math.exp, "sqrt": math.sqrt, "log": math.log, "pi": math.pi})

def composite_simpson(a, b, n=1000):
    if n % 2:
        n += 1
    h = (b - a) / n
    total = f(a) + f(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * f(a + i * h)
    return total * h / 3

print({"method": selected_method, "value": composite_simpson(float(${lower}), float(${upper}))})
`;
    }
    if (mode === "python-matplotlib") {
        return `${buildScipyCode(input)}

import matplotlib.pyplot as plt
xs = np.linspace(a, b, 600)
ys = f(xs)
value = quad_adaptive()["value"]
plt.plot(xs, ys, label=str(expr))
plt.fill_between(xs, ys, alpha=0.22)
plt.title(f"{selected_method}: integral = {value:.12g}")
plt.grid(True, alpha=0.25)
plt.legend()
plt.show()
`;
    }
    if (mode === "api-call") {
        return `const response = await fetch("/api/laboratory/solve/integral/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mode: "single",
    expression: ${expr},
    lower: ${lower},
    upper: ${upper},
    method: ${method}
  })
});

console.log(await response.json());
`;
    }
    if (mode === "production" || mode === "teaching") return sympy;
    if (mode === "latex-appendix") {
        return `\\appendix
\\section{Code Appendix}
\\begin{lstlisting}[language=Python]
${sympy}
\\end{lstlisting}
`;
    }
    return JSON.stringify({
        cells: [
            { cell_type: "markdown", metadata: {}, source: ["# MathSphere integral worksheet\\n"] },
            { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: sympy.split("\n").map((line) => `${line}\n`) },
        ],
        metadata: {
            kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
            language_info: { name: "python" },
            ...(mode === "colab" ? { colab: { name: "mathsphere-integral.ipynb" } } : {}),
        },
        nbformat: 4,
        nbformat_minor: 5,
    }, null, 2);
}
