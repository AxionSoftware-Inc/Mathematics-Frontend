import React from "react";
import dynamic from "next/dynamic";
import { Check, Clipboard, Code2, Download, RotateCcw } from "lucide-react";

import { MonacoCodeEditor } from "@/components/laboratory/code-editor/monaco-code-editor";
import { MethodSelector } from "@/components/laboratory/method-selector/method-selector";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";
import { buildIntegralCodeForMode } from "@/lib/integral-code-generator";

import type { IntegralAnalyticSolveResponse, IntegralSolveMethod } from "../types";

const LaboratoryAIExplainer = dynamic(
    () => import("@/components/laboratory/ai-explainer/laboratory-ai-explainer").then((mod) => mod.LaboratoryAIExplainer),
    {
        ssr: false,
        loading: () => <div className="site-panel p-5 text-sm font-semibold text-muted-foreground">Loading AI panel...</div>,
    },
);

type CodeViewProps = {
    analyticSolution: IntegralAnalyticSolveResponse | null;
    expression: string;
    lower: string;
    upper: string;
    solveMethod: IntegralSolveMethod;
    setSolveMethod: (method: IntegralSolveMethod) => void;
};

type CodeExportMode =
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

const codeExportModes: Array<{ id: CodeExportMode; label: string; detail: string }> = [
    { id: "python-basic", label: "Python basic", detail: "stdlib + math skeleton" },
    { id: "python-scipy", label: "Python + NumPy/SciPy", detail: "quad fallback route" },
    { id: "python-sympy", label: "Python + SymPy", detail: "exact symbolic reproduction" },
    { id: "python-matplotlib", label: "Python + Matplotlib", detail: "plot + shaded area" },
    { id: "jupyter", label: "Jupyter notebook", detail: ".ipynb export" },
    { id: "colab", label: "Google Colab", detail: "Colab-ready notebook" },
    { id: "latex-appendix", label: "LaTeX appendix", detail: "lstlisting block" },
    { id: "api-call", label: "API call version", detail: "fetch backend endpoint" },
    { id: "production", label: "Clean production code", detail: "typed function + checks" },
    { id: "teaching", label: "Teaching code", detail: "step comments" },
];

function pyLiteral(value: string, fallback: string) {
    return JSON.stringify(value || fallback);
}

function methodLabel(method: IntegralSolveMethod) {
    return method.replace(/-/g, " ");
}

function buildSympyCode({ expression, lower, upper, solveMethod }: Pick<CodeViewProps, "expression" | "lower" | "upper" | "solveMethod">) {
    const expr = pyLiteral(expression, "sin(x)");
    const a = pyLiteral(lower, "0");
    const b = pyLiteral(upper, "1");
    const method = pyLiteral(solveMethod, "auto");
    return `"""
MathSphere Integral Reproduction Script
Selected method: ${methodLabel(solveMethod)}

This script is intentionally verbose: it exposes parser normalization, selected
method intent, symbolic route, numerical fallback, verification, and report data.
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
    numeric_tolerance: float = 1e-10


@dataclass(frozen=True)
class IntegralResult:
    method: str
    expression_latex: str
    antiderivative_latex: str | None
    exact_latex: str | None
    numeric_value: str | None
    verification: dict[str, Any]
    warnings: list[str]


def parse_config(config: IntegralConfig) -> tuple[sp.Symbol, sp.Expr, sp.Expr, sp.Expr]:
    x = sp.symbols(config.variable, real=True)
    expr = sp.sympify(config.expression)
    lower = sp.sympify(config.lower)
    upper = sp.sympify(config.upper)
    return x, expr, lower, upper


def choose_symbolic_integrator(method: str):
    if method in {"risch-heurisch", "symbolic"}:
        return lambda expr, x: sp.integrate(expr, x, risch=False)
    if method == "partial-fractions":
        return lambda expr, x: sp.integrate(sp.apart(expr, x), x)
    if method == "series-expansion-integral":
        return lambda expr, x: sp.integrate(sp.series(expr, x, 0, 8).removeO(), x)
    if method == "special-functions":
        return lambda expr, x: sp.integrate(expr.rewrite(sp.erf), x)
    return lambda expr, x: sp.integrate(expr, x)


def derivative_check(F: sp.Expr | None, expr: sp.Expr, x: sp.Symbol) -> dict[str, Any]:
    if F is None:
        return {"available": False, "passed": False, "detail": "No antiderivative produced."}
    residual = sp.simplify(sp.diff(F, x) - expr)
    return {
        "available": True,
        "passed": residual == 0,
        "residual_latex": sp.latex(residual),
    }


def boundary_check(F: sp.Expr | None, exact: sp.Expr | None, lower: sp.Expr, upper: sp.Expr) -> dict[str, Any]:
    if F is None or exact is None:
        return {"available": False, "passed": False}
    via_ftc = sp.simplify(F.subs(x, upper) - F.subs(x, lower))
    residual = sp.simplify(via_ftc - exact)
    return {"available": True, "passed": residual == 0, "residual_latex": sp.latex(residual)}


def solve(config: IntegralConfig) -> IntegralResult:
    global x
    x, expr, lower, upper = parse_config(config)
    warnings: list[str] = []
    integrator = choose_symbolic_integrator(config.selected_method)

    antiderivative: sp.Expr | None = None
    exact: sp.Expr | None = None
    try:
        antiderivative = sp.simplify(integrator(expr, x))
    except Exception as exc:
        warnings.append(f"Symbolic antiderivative failed: {exc}")

    try:
        if config.selected_method == "series-expansion-integral":
            approx_expr = sp.series(expr, x, 0, 10).removeO()
            exact = sp.simplify(sp.integrate(approx_expr, (x, lower, upper)))
        else:
            exact = sp.simplify(sp.integrate(expr, (x, lower, upper)))
    except Exception as exc:
        warnings.append(f"Exact definite integration failed: {exc}")

    numeric_value = None
    if exact is not None:
        try:
            numeric_value = str(sp.N(exact, config.digits))
        except Exception as exc:
            warnings.append(f"Numeric evaluation failed: {exc}")

    verification = {
        "derivative": derivative_check(antiderivative, expr, x),
        "boundary": boundary_check(antiderivative, exact, lower, upper),
        "domain": "Review singularities and assumptions before publication.",
    }

    return IntegralResult(
        method=config.selected_method,
        expression_latex=sp.latex(expr),
        antiderivative_latex=sp.latex(antiderivative) if antiderivative is not None else None,
        exact_latex=sp.latex(exact) if exact is not None else None,
        numeric_value=numeric_value,
        verification=verification,
        warnings=warnings,
    )


if __name__ == "__main__":
    config = IntegralConfig(expression=${expr}, lower=${a}, upper=${b})
    result = solve(config)
    print(asdict(result))
`;
}

function buildScipyCode(props: Pick<CodeViewProps, "expression" | "lower" | "upper" | "solveMethod">) {
    const expr = pyLiteral(props.expression, "sin(x)");
    const lower = pyLiteral(props.lower, "0");
    const upper = pyLiteral(props.upper, "1");
    const method = pyLiteral(props.solveMethod, "adaptive-quadrature");
    return `from __future__ import annotations

import sympy as sp
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


def gauss_legendre(order: int = 96):
    nodes, weights = np.polynomial.legendre.leggauss(order)
    mapped = 0.5 * (nodes + 1.0) * (b - a) + a
    value = 0.5 * (b - a) * np.sum(weights * f(mapped))
    return {"method": f"gauss-legendre-{order}", "value": float(value), "estimated_error": None}


def composite_simpson(n: int = 2000):
    if n % 2:
        n += 1
    xs = np.linspace(a, b, n + 1)
    ys = f(xs)
    h = (b - a) / n
    value = h / 3.0 * (ys[0] + ys[-1] + 4.0 * np.sum(ys[1:-1:2]) + 2.0 * np.sum(ys[2:-1:2]))
    return {"method": f"composite-simpson-{n}", "value": float(value), "estimated_error": None}


def tanh_sinh():
    value = integrate.quad(lambda t: float(f(t)), a, b, points=[a, b], epsabs=1e-12, epsrel=1e-12, limit=500)[0]
    return {"method": "endpoint-aware-adaptive", "value": float(value), "estimated_error": None}


strategies = {
    "adaptive-quadrature": quad_adaptive,
    "numeric-check": quad_adaptive,
    "gauss-legendre": gauss_legendre,
    "composite-simpson": composite_simpson,
    "tanh-sinh": tanh_sinh,
    "monte-carlo": lambda: {"method": "monte-carlo-not-recommended-for-1d", "value": composite_simpson()["value"], "estimated_error": None},
}

result = strategies.get(selected_method, quad_adaptive)()
print(result)
`;
}

function buildCodeForMode(mode: CodeExportMode, props: Pick<CodeViewProps, "expression" | "lower" | "upper" | "solveMethod">, backendCode: string) {
    const expr = pyLiteral(props.expression, "sin(x)");
    const lower = pyLiteral(props.lower, "0");
    const upper = pyLiteral(props.upper, "1");
    const method = pyLiteral(props.solveMethod, "auto");
    const sympyCode = buildSympyCode(props);
    if (mode === "python-sympy") return sympyCode;
    if (mode === "python-basic") {
        return `"""
Dependency-light numerical reproduction.
Selected method: ${methodLabel(props.solveMethod)}
"""

import math

def f(x: float) -> float:
    return eval(${expr}, {"__builtins__": {}}, {"x": x, "sin": math.sin, "cos": math.cos, "exp": math.exp, "sqrt": math.sqrt, "log": math.log, "pi": math.pi})

def composite_simpson(a: float, b: float, n: int = 1000) -> float:
    if n % 2:
        n += 1
    h = (b - a) / n
    total = f(a) + f(b)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * f(a + i * h)
    return total * h / 3

if __name__ == "__main__":
    print({
        "selected_method": ${method},
        "value": composite_simpson(float(${lower}), float(${upper})),
        "notes": "stdlib Simpson route; use SymPy/SciPy modes for publication-grade audit",
    })
`;
    }
    if (mode === "python-scipy") {
        return buildScipyCode(props);
    }
    if (mode === "python-matplotlib") {
        return `import sympy as sp
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import quad

x = sp.symbols("x", real=True)
expr = sp.sympify(${expr})
selected_method = ${method}
f = sp.lambdify(x, expr, "numpy")
a = float(sp.N(sp.sympify(${lower})))
b = float(sp.N(sp.sympify(${upper})))
xs = np.linspace(a, b, 600)
ys = f(xs)
value, error = quad(lambda t: float(f(t)), a, b)

plt.plot(xs, ys, label=str(expr))
plt.fill_between(xs, ys, alpha=0.25)
plt.title(f"{selected_method}: integral = {value:.12g}, error ~= {error:.2e}")
plt.xlabel("x")
plt.ylabel("f(x)")
plt.grid(True, alpha=0.25)
plt.legend()
plt.show()
`;
    }
    if (mode === "api-call") {
        return `const response = await fetch("/api/laboratory/integral/solve/", {
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
    if (mode === "production") {
        return `from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
import sympy as sp

@dataclass(frozen=True)
class IntegralResult:
    selected_method: str
    antiderivative: sp.Expr
    exact_value: sp.Expr
    numeric_value: float
    derivative_check_passed: bool
    warnings: tuple[str, ...]

def solve_integral(expression: str, lower: str, upper: str, method: str = ${method}, digits: int = 15) -> IntegralResult:
    x = sp.symbols("x", real=True)
    expr = sp.sympify(expression)
    a = sp.sympify(lower)
    b = sp.sympify(upper)
    working_expr = sp.apart(expr, x) if method == "partial-fractions" else expr
    antiderivative = sp.simplify(sp.integrate(working_expr, x))
    exact = sp.simplify(sp.integrate(working_expr, (x, a, b)))
    derivative_residual = sp.simplify(sp.diff(antiderivative, x) - working_expr)
    return IntegralResult(
        selected_method=method,
        antiderivative=antiderivative,
        exact_value=exact,
        numeric_value=float(sp.N(exact, digits)),
        derivative_check_passed=derivative_residual == 0,
        warnings=tuple(),
    )

print(solve_integral(${expr}, ${lower}, ${upper}, ${method}))
`;
    }
    if (mode === "teaching") {
        return `import sympy as sp

# 1. Define the symbolic variable.
x = sp.symbols("x", real=True)

# 2. Parse the user expression and bounds.
expr = sp.sympify(${expr})
lower = sp.sympify(${lower})
upper = sp.sympify(${upper})

# 3. Choose a method-aware symbolic transformation.
selected_method = ${method}
working_expr = sp.apart(expr, x) if selected_method == "partial-fractions" else expr

# 4. Find an antiderivative F(x).
F = sp.simplify(sp.integrate(working_expr, x))

# 5. Apply the fundamental theorem of calculus: F(upper) - F(lower).
exact = sp.simplify(sp.integrate(working_expr, (x, lower, upper)))

# 6. Verify derivative and produce a decimal check for reporting.
derivative_residual = sp.simplify(sp.diff(F, x) - working_expr)
numeric = sp.N(exact, 15)

print("Selected method =", selected_method)
print("F(x) =", F)
print("Exact integral =", exact)
print("Derivative residual =", derivative_residual)
print("Decimal check =", numeric)
`;
    }
    if (mode === "latex-appendix") {
        return `\\appendix
\\section{Code Appendix}
\\begin{lstlisting}[language=Python]
${sympyCode}
\\end{lstlisting}
`;
    }
    const notebookCode = mode === "colab" ? `${sympyCode}\n\n# Optional SciPy numerical route\n${buildScipyCode(props)}` : sympyCode;
    return JSON.stringify({
        cells: [
            { cell_type: "markdown", metadata: {}, source: ["# Integral reproduction notebook\\n", "Generated by MathSphere Laboratory."] },
            { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: notebookCode.split("\n").map((line) => `${line}\n`) },
        ],
        metadata: {
            kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
            language_info: { name: "python" },
            ...(mode === "colab" ? { colab: { name: "mathsphere-integral-report.ipynb" } } : {}),
        },
        nbformat: 4,
        nbformat_minor: 5,
    }, null, 2);
}

export function CodeView({ analyticSolution, expression, lower, upper, solveMethod, setSolveMethod }: CodeViewProps) {
    const [copied, setCopied] = React.useState(false);
    const [exportMode, setExportMode] = React.useState<CodeExportMode>("python-sympy");
    const reproducibility = analyticSolution?.reproducibility;
    const generatedCode = React.useMemo(
        () => buildIntegralCodeForMode(exportMode, { expression, lower, upper, solveMethod }),
        [exportMode, expression, lower, solveMethod, upper],
    );
    const [code, setCode] = React.useState(generatedCode);
    const [isDirty, setIsDirty] = React.useState(false);
    const notes = reproducibility?.notes || [
        "Run Solve first to receive backend-generated reproduction metadata.",
        "The fallback snippet mirrors the definite single-integral SymPy path.",
    ];
    const aiPayload = React.useMemo(
        () => ({
            module: "integral",
            expression,
            expression_latex: analyticSolution?.parser?.expression_latex,
            lower,
            upper,
            result_latex: analyticSolution?.exact?.evaluated_latex,
            numeric_approximation: analyticSolution?.exact?.numeric_approximation,
            method: {
                selected_method: reproducibility?.selected_method || solveMethod,
                family: reproducibility?.method_family,
                label: reproducibility?.method,
                summary: reproducibility?.method_summary,
                numeric_strategy: reproducibility?.numeric_strategy,
            },
            steps: analyticSolution?.exact?.steps || [],
            reproducibility: reproducibility || {},
        }),
        [analyticSolution, expression, lower, reproducibility, solveMethod, upper],
    );

    React.useEffect(() => {
        if (!isDirty) {
            setCode(generatedCode);
        }
    }, [generatedCode, isDirty]);

    const resetGeneratedCode = () => {
        setCode(generatedCode);
        setIsDirty(false);
    };

    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    const downloadCode = () => {
        const extension = exportMode === "jupyter" || exportMode === "colab" ? "ipynb" : exportMode === "latex-appendix" ? "tex" : exportMode === "api-call" ? "js" : "py";
        const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mathsphere-integral-${exportMode}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4">
                <MethodSelector
                    title="Integral solve method"
                    value={solveMethod}
                    options={getLaboratoryMethodOptions("integral")}
                    onChange={(value) => setSolveMethod(value as IntegralSolveMethod)}
                />

                <div className="site-panel p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            <Code2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="site-eyebrow">Reproduce</div>
                            <h2 className="text-lg font-black tracking-tight">Backend generated SymPy code</h2>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Bu panel solver ichida nima ishlayotganini ochadi. Kod research notebook yoki lokal Python muhitida
                        qayta bajarish uchun mo&apos;ljallangan.
                    </p>
                </div>

                <div className="site-panel p-5">
                    <div className="site-eyebrow text-amber-600">Notes</div>
                    <div className="mt-4 space-y-3">
                        {notes.map((note) => (
                            <div key={note} className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
                                {note}
                            </div>
                        ))}
                    </div>
                </div>

                <LaboratoryAIExplainer payload={aiPayload} disabled={!analyticSolution} />
            </div>

            <div className="space-y-4">
            <div className="site-panel overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="site-eyebrow">Code Generator</div>
                        <div className="mt-1 text-sm font-semibold text-muted-foreground">
                            {isDirty ? "Edited code draft" : `${codeExportModes.find((item) => item.id === exportMode)?.label} template`}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={resetGeneratedCode}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={copyCode}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy code"}
                        </button>
                        <button
                            type="button"
                            onClick={downloadCode}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
                <MonacoCodeEditor
                    value={code}
                    onChange={(nextCode) => {
                        setCode(nextCode);
                        setIsDirty(nextCode !== generatedCode);
                    }}
                    height="680px"
                />
            </div>
                <div className="site-panel p-4">
                    <div className="site-eyebrow text-sky-600">Code export modes</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {codeExportModes.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    setExportMode(option.id);
                                    setIsDirty(false);
                                }}
                                title={option.detail}
                                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                                    exportMode === option.id ? "border-accent/40 bg-[var(--accent-soft)]" : "border-border/70 bg-background/60 hover:bg-muted/50"
                                }`}
                            >
                                <div className="truncate text-xs font-black">{option.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
