"use client";

import React from "react";
import { Check, Clipboard, RotateCcw } from "lucide-react";

import { LaboratoryAIExplainer } from "@/components/laboratory/ai-explainer/laboratory-ai-explainer";
import { MonacoCodeEditor } from "@/components/laboratory/code-editor/monaco-code-editor";
import { MethodSelector } from "@/components/laboratory/method-selector/method-selector";
import { getLaboratoryMethodOptions, type LaboratoryMethodModule } from "@/components/laboratory/method-selector/method-registry";

type LabCodeInsightPanelProps = {
    module: LaboratoryMethodModule;
    title: string;
    expression: string;
    secondary?: string;
    analyticSolution: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getParser(solution: Record<string, unknown> | null) {
    return asRecord(solution?.parser);
}

function getExact(solution: Record<string, unknown> | null) {
    return asRecord(solution?.exact);
}

function getSteps(solution: Record<string, unknown> | null) {
    const steps = getExact(solution).steps;
    return Array.isArray(steps) ? (steps as Array<Record<string, unknown>>) : [];
}

function getString(record: Record<string, unknown>, key: string) {
    const value = record[key];
    return typeof value === "string" ? value : "";
}

function getResultLatex(solution: Record<string, unknown> | null) {
    const exact = getExact(solution);
    return (
        getString(exact, "evaluated_latex") ||
        getString(exact, "result_latex") ||
        getString(exact, "derivative_latex") ||
        getString(exact, "final_latex") ||
        getString(exact, "auxiliary_latex")
    );
}

function buildCode(module: LaboratoryMethodModule, expression: string, secondary = "", solution: Record<string, unknown> | null, method: string) {
    const parser = getParser(solution);
    const exact = getExact(solution);
    const diagnostics = asRecord(solution?.diagnostics);
    const resultLatex = getResultLatex(solution);
    return `# MathSphere ${module} reproducibility draft
# Selected method: ${method}

import sympy as sp

raw_expression = ${JSON.stringify(expression || parser.expression_raw || "")}
secondary_input = ${JSON.stringify(secondary || "")}

# Backend parser latex:
# ${getString(parser, "expression_latex") || resultLatex || "pending"}

# Backend method:
# ${getString(exact, "method_label") || getString(diagnostics, "method") || "pending"}

# Backend result latex:
# ${resultLatex || "pending"}

# Edit this draft for local experiments.
print("expression:", raw_expression)
print("secondary:", secondary_input)
`;
}

export function LabCodeInsightPanel({ module, title, expression, secondary, analyticSolution }: LabCodeInsightPanelProps) {
    const options = getLaboratoryMethodOptions(module);
    const [method, setMethod] = React.useState(options[0]?.id ?? "auto");
    const generatedCode = React.useMemo(
        () => buildCode(module, expression, secondary, analyticSolution, method),
        [analyticSolution, expression, method, module, secondary],
    );
    const [code, setCode] = React.useState(generatedCode);
    const [isDirty, setIsDirty] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        if (!isDirty) {
            setCode(generatedCode);
        }
    }, [generatedCode, isDirty]);

    const aiPayload = React.useMemo(
        () => ({
            module,
            expression,
            expression_latex: getString(getParser(analyticSolution), "expression_latex") || undefined,
            result_latex: getResultLatex(analyticSolution),
            numeric_approximation: getString(getExact(analyticSolution), "numeric_approximation") || null,
            method: {
                selected_method: method,
                label: getString(getExact(analyticSolution), "method_label"),
                summary: getString(asRecord(analyticSolution?.diagnostics), "method"),
            },
            steps: getSteps(analyticSolution),
            reproducibility: {
                engine: "sympy",
                selected_method: method,
            },
        }),
        [analyticSolution, expression, method, module],
    );

    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-4">
                <MethodSelector title={`${title} method`} value={method} options={options} onChange={setMethod} />
                <LaboratoryAIExplainer payload={aiPayload} disabled={!analyticSolution} />
            </div>

            <div className="site-panel overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="site-eyebrow">Code draft</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                            {isDirty ? "Edited code draft" : "Generated from solver payload"}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setCode(generatedCode);
                                setIsDirty(false);
                            }}
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
