import React from "react";
import { Check, Clipboard, Code2, RotateCcw } from "lucide-react";

import { MonacoCodeEditor } from "@/components/laboratory/code-editor/monaco-code-editor";
import { LaboratoryAIExplainer } from "@/components/laboratory/ai-explainer/laboratory-ai-explainer";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { MethodSelector } from "@/components/laboratory/method-selector/method-selector";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";

import type { IntegralAnalyticSolveResponse, IntegralSolveMethod } from "../types";

type CodeViewProps = {
    analyticSolution: IntegralAnalyticSolveResponse | null;
    mode: string;
    expression: string;
    lower: string;
    upper: string;
    solveMethod: IntegralSolveMethod;
    setSolveMethod: (method: IntegralSolveMethod) => void;
};

function buildFallbackCode({ expression, lower, upper }: Pick<CodeViewProps, "expression" | "lower" | "upper">) {
    return `import sympy as sp

x = sp.symbols("x", real=True)
expr = sp.sympify(${JSON.stringify(expression || "sin(x)")})
lower = sp.sympify(${JSON.stringify(lower || "0")})
upper = sp.sympify(${JSON.stringify(upper || "1")})

antiderivative = sp.simplify(sp.integrate(expr, x))
definite_value = sp.simplify(sp.integrate(expr, (x, lower, upper)))
numeric_approximation = sp.N(definite_value, 15)

print("Antiderivative:", antiderivative)
print("Exact definite value:", definite_value)
print("Numeric approximation:", numeric_approximation)
`;
}

export function CodeView({ analyticSolution, mode, expression, lower, upper, solveMethod, setSolveMethod }: CodeViewProps) {
    const [copied, setCopied] = React.useState(false);
    const reproducibility = analyticSolution?.reproducibility;
    const generatedCode = reproducibility?.code || buildFallbackCode({ expression, lower, upper });
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <LaboratoryMetricCard
                        eyebrow="Engine"
                        value={reproducibility?.engine || "sympy"}
                        detail={`${reproducibility?.method || (mode === "single" ? "integrate" : "frontend estimator")} - ${reproducibility?.selected_method || solveMethod}`}
                        tone="info"
                    />
                    <LaboratoryMetricCard
                        eyebrow="Numeric"
                        value={reproducibility?.numeric_strategy || "sympy.N"}
                        detail="Hozir definite exact natijaning decimal check'i sifatida ishlaydi."
                        tone={analyticSolution?.status === "needs_numerical" ? "warn" : "success"}
                    />
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

            <div className="site-panel overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="site-eyebrow">Python / SymPy</div>
                        <div className="mt-1 text-sm font-semibold text-muted-foreground">
                            {isDirty ? "Edited code draft" : reproducibility ? "Real backend payload" : "Fallback template"}
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
        </div>
    );
}
