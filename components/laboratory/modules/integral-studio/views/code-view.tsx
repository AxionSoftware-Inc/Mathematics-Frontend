import React from "react";
import { Check, Clipboard, Code2 } from "lucide-react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";

import type { IntegralAnalyticSolveResponse } from "../types";

type CodeViewProps = {
    analyticSolution: IntegralAnalyticSolveResponse | null;
    mode: string;
    expression: string;
    lower: string;
    upper: string;
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

export function CodeView({ analyticSolution, mode, expression, lower, upper }: CodeViewProps) {
    const [copied, setCopied] = React.useState(false);
    const reproducibility = analyticSolution?.reproducibility;
    const code = reproducibility?.code || buildFallbackCode({ expression, lower, upper });
    const notes = reproducibility?.notes || [
        "Run Solve first to receive backend-generated reproduction metadata.",
        "The fallback snippet mirrors the definite single-integral SymPy path.",
    ];

    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4">
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
                        detail={reproducibility?.method || (mode === "single" ? "integrate" : "frontend estimator")}
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
            </div>

            <div className="site-panel overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="site-eyebrow">Python / SymPy</div>
                        <div className="mt-1 text-sm font-semibold text-muted-foreground">
                            {reproducibility ? "Real backend payload" : "Fallback template"}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={copyCode}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy code"}
                    </button>
                </div>
                <pre className="max-h-[680px] overflow-auto bg-slate-950 p-5 text-[12px] leading-6 text-slate-100">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}
