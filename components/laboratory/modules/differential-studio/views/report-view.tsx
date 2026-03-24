import React from "react";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { AnnotationPanel } from "../components/annotation-panel";
import type {
    DifferentialAnalyticSolveResponse,
    DifferentialComputationSummary,
    DifferentialMetricCard,
} from "../types";

interface ReportViewState {
    reportExecutiveCards?: DifferentialMetricCard[];
    reportSupportCards?: DifferentialMetricCard[];
    annotationPanelProps: React.ComponentProps<typeof AnnotationPanel>;
    expression: string;
    variable: string;
    point: string;
    summary: DifferentialComputationSummary | null;
    mode: string;
    analyticSolution: DifferentialAnalyticSolveResponse | null;
}

function describePrimaryMetric(summary: DifferentialComputationSummary | null): string {
    if (!summary) return "Pending solve";
    if ("matrix" in summary) {
        return summary.type === "jacobian"
            ? `Jacobian ${summary.size.rows}x${summary.size.cols}`
            : `Hessian ${summary.size}x${summary.size}`;
    }
    if (summary.type === "gradient") {
        return `|grad f| = ${summary.magnitude.toFixed(6)}`;
    }
    if (summary.type === "directional") {
        return `D_u f = ${summary.directionalDerivative.toFixed(6)}`;
    }
    if (summary.type === "higher_order") {
        return `Taylor order ${summary.maxOrder}`;
    }
    if ("tangentLine" in summary) {
        return `Slope = ${summary.tangentLine.slope.toFixed(6)}`;
    }
    return `Rate = ${summary.partialAtPoint.toFixed(6)}`;
}

function describeAnalyticLaneResult(
    mode: string,
    analyticSolution: DifferentialAnalyticSolveResponse | null,
): string[] {
    if (!analyticSolution) return ["- Result pending"];

    if (mode === "ode" || mode === "pde" || mode === "sde") {
        return [
            `- Method: \`${analyticSolution.exact?.method_label ?? "specialized"}\``,
            `- Exact / primary form: \`${analyticSolution.exact?.derivative_latex ?? "n/a"}\``,
            `- Evaluated note: \`${analyticSolution.exact?.evaluated_latex ?? "n/a"}\``,
            `- Numeric approximation: \`${analyticSolution.exact?.numeric_approximation ?? "n/a"}\``,
        ];
    }

    return ["- Result pending"];
}

function describeResultBlock(summary: DifferentialComputationSummary | null): string[] {
    if (!summary) return ["- Result pending"];
    if ("matrix" in summary) {
        return summary.matrix.map((row, index) => `- Row ${index + 1}: [${row.map((value) => value.toFixed(5)).join(", ")}]`);
    }
    if (summary.type === "gradient") {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Gradient: \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Magnitude: \`${summary.magnitude.toFixed(6)}\``,
        ];
    }
    if (summary.type === "directional") {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Gradient: \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Unit direction: \`[${summary.unitDirection.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Directional derivative: \`${summary.directionalDerivative.toFixed(6)}\``,
        ];
    }
    if (summary.type === "higher_order") {
        return summary.derivatives.map((value, index) => `- Order ${index}: \`${value.toFixed(6)}\``);
    }
    if ("tangentLine" in summary) {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Derivative: \`${summary.derivativeAtPoint.toFixed(6)}\``,
            `- Tangent line: \`${summary.tangentLine.latex}\``,
        ];
    }
    return [
        `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
        `- Partial: \`${summary.partialAtPoint.toFixed(6)}\``,
        `- Variable: \`${summary.variable}\``,
    ];
}

export function ReportView({ state }: { state: ReportViewState }) {
    const {
        reportExecutiveCards = [],
        reportSupportCards = [],
        annotationPanelProps,
        expression,
        variable,
        point,
        summary,
        mode,
        analyticSolution,
    } = state;

    const taxonomyFamily = analyticSolution?.diagnostics?.taxonomy?.family ?? summary?.type ?? "pending";
    const domainNotes = analyticSolution?.diagnostics?.domain_analysis?.constraints ?? [];
    const matrixDiagnostics = analyticSolution?.diagnostics?.matrix;

    const reportSkeletonMarkdown = `
# Differential Evaluation Report

### Analysis Parameters
- **Formula:** \`${expression}\`
- **Mode:** \`${mode}\`
- **Variable focus:** ${variable}
- **Evaluation Point:** ${point}

### Core Results
- **Primary Metric:** \`${describePrimaryMetric(summary)}\`
${summary ? describeResultBlock(summary).join("\n") : describeAnalyticLaneResult(mode, analyticSolution).join("\n")}

### Symbolic Taxonomy
- **Family:** \`${taxonomyFamily}\`
- **Lane:** \`${analyticSolution?.diagnostics?.taxonomy?.lane ?? mode}\`
- **Tags:** \`${(analyticSolution?.diagnostics?.taxonomy?.tags ?? []).join(", ") || "n/a"}\`
- **Summary:** ${analyticSolution?.diagnostics?.taxonomy?.summary ?? "No taxonomy note"}
${analyticSolution?.exact?.method_label ? `- **Method label:** \`${analyticSolution.exact.method_label}\`` : ""}

### Domain And Diagnostics
- **Continuity:** \`${analyticSolution?.diagnostics?.continuity ?? "pending"}\`
- **Differentiability:** \`${analyticSolution?.diagnostics?.differentiability ?? "pending"}\`
- **Constraints:** \`${domainNotes.length}\`
${domainNotes.map((item) => `- ${item.label}: ${item.detail}`).join("\n")}
${matrixDiagnostics ? `- **Matrix status:** \`${matrixDiagnostics.determinant_status ?? "n/a"}\`` : ""}
${matrixDiagnostics?.critical_point_type ? `- **Critical point type:** ${matrixDiagnostics.critical_point_type}` : ""}
${mode === "sde" ? "- **Stochastic note:** single seeded path; ensemble statistics hali chiqarilmagan." : ""}

_Autogenerated by MathSphere Laboratory._
`.trim();

    const reportReadinessCards = [
        { eyebrow: "Markdown", value: `${reportSkeletonMarkdown.length} chars`, detail: "Content density", tone: "info" as const },
        { eyebrow: "Variables", value: String(variable.split(",").map((entry) => entry.trim()).filter(Boolean).length || 1), detail: "Observed spaces", tone: "neutral" as const },
        { eyebrow: "Result Type", value: summary?.type ?? "pending", detail: "Active report lane", tone: "success" as const },
        { eyebrow: "Taxonomy", value: taxonomyFamily, detail: "Symbolic family", tone: "info" as const },
    ] as DifferentialMetricCard[];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                {reportExecutiveCards.map((card, idx) => (
                    <LaboratoryMetricCard key={`report-exec-${idx}`} {...card} />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Export Packet</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {reportSupportCards.map((card, idx) => (
                                <LaboratoryMetricCard key={`report-support-${idx}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <LaboratoryMathPanel
                        eyebrow="Report Builder"
                        title="Research Markdown Skeleton"
                        content={reportSkeletonMarkdown}
                        accentClassName="text-amber-600"
                    />
                    <div className="flex flex-wrap gap-4">
                        <button className="site-btn px-6">Copy Report</button>
                        <button className="site-btn-accent px-6">Send to Writer</button>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Report Readiness</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {reportReadinessCards.map((card, idx) => (
                                <LaboratoryMetricCard key={`readiness-${idx}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <AnnotationPanel {...annotationPanelProps} />
                    <div className="site-panel space-y-4 p-6">
                        <div className="site-eyebrow text-accent">Live Bridge</div>
                        <div className="flex flex-wrap gap-3">
                            <button className="rounded-xl bg-muted px-4 py-2 text-xs font-bold text-muted-foreground transition-all">
                                Select Document
                            </button>
                            <button className="site-btn flex items-center gap-2">Push Live</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
