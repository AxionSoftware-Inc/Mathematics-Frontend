import React from "react";
import dynamic from "next/dynamic";
import { Check, Clipboard, Code2, Download, RotateCcw } from "lucide-react";

import { MonacoCodeEditor } from "@/components/laboratory/code-editor/monaco-code-editor";
import { MethodSelector } from "@/components/laboratory/method-selector/method-selector";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";
import { buildDifferentialCodeForMode, differentialCodeExportModes, type DifferentialCodeExportMode } from "@/lib/differential-code-generator";

import type { DifferentialAnalyticSolveResponse, DifferentialExtendedMode } from "../types";

const LaboratoryAIExplainer = dynamic(
    () => import("@/components/laboratory/ai-explainer/laboratory-ai-explainer").then((mod) => mod.LaboratoryAIExplainer),
    {
        ssr: false,
        loading: () => <div className="site-panel p-5 text-sm font-semibold text-muted-foreground">Loading AI panel...</div>,
    },
);

type CodeViewProps = {
    analyticSolution: DifferentialAnalyticSolveResponse | null;
    mode: DifferentialExtendedMode;
    expression: string;
    variable: string;
    point: string;
    order: string;
    direction: string;
};

export function CodeView({ analyticSolution, mode, expression, variable, point, order, direction }: CodeViewProps) {
    const [method, setMethod] = React.useState("auto");
    const [exportMode, setExportMode] = React.useState<DifferentialCodeExportMode>("python-sympy");
    const [copied, setCopied] = React.useState(false);
    const generatedCode = React.useMemo(
        () => buildDifferentialCodeForMode(exportMode, { mode, expression, variable, point, order, direction, solveMethod: method }),
        [direction, exportMode, expression, method, mode, order, point, variable],
    );
    const [code, setCode] = React.useState(generatedCode);
    const [isDirty, setIsDirty] = React.useState(false);
    const selectedExportMode = differentialCodeExportModes.find((item) => item.id === exportMode);

    React.useEffect(() => {
        setCode(generatedCode);
        setIsDirty(false);
    }, [generatedCode]);

    const aiPayload = React.useMemo(
        () => ({
            module: "differential",
            expression,
            expression_latex: analyticSolution?.parser?.expression_latex,
            result_latex: analyticSolution?.exact?.evaluated_latex || analyticSolution?.exact?.derivative_latex,
            numeric_approximation: analyticSolution?.exact?.numeric_approximation,
            method: {
                selected_method: method,
                label: analyticSolution?.exact?.method_label,
                mode,
            },
            steps: analyticSolution?.exact?.steps || [],
            reproducibility: {
                engine: "sympy/scipy",
                selected_method: method,
                pipeline: "parser-normalizer-detector-executor-verifier-numeric-visual-code-report-graph",
            },
        }),
        [analyticSolution, expression, method, mode],
    );

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
        const extension = exportMode === "jupyter" || exportMode === "colab" ? "ipynb" : exportMode === "latex-appendix" ? "tex" : exportMode === "api-call" ? "ts" : "py";
        const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mathsphere-differential-${exportMode}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4">
                <MethodSelector
                    title="Differential / ODE method"
                    value={method}
                    options={getLaboratoryMethodOptions("differential")}
                    onChange={setMethod}
                />

                <div className="site-panel p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            <Code2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="site-eyebrow">Reproduce</div>
                            <h2 className="text-lg font-black tracking-tight">Differential pipeline code</h2>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Kod mode, expression, variable, point, order va method tanlovidan qayta quriladi. Method almashtirilsa
                        parser, detector, executor, verification va numerical fallback yo&apos;li ham kodda o&apos;zgaradi.
                    </p>
                </div>

                <LaboratoryAIExplainer payload={aiPayload} disabled={!analyticSolution} />
            </div>

            <div className="space-y-4">
                <div className="site-panel overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="site-eyebrow">Code Generator</div>
                            <div className="mt-1 text-sm font-semibold text-muted-foreground">
                                {isDirty ? "Edited code draft" : `${selectedExportMode?.label || "Generated"} template`} · {method.replace(/-/g, " ")}
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
                        {differentialCodeExportModes.map((option) => (
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
