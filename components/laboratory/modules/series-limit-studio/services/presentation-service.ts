import type {
    SeriesLimitAnalyticSolveResponse,
    SeriesLimitBenchmarkSummary,
    SeriesLimitContractSummary,
    SeriesLimitMode,
    SeriesLimitSummary,
} from "../types";

function normalize(value: string) {
    return value.replace(/\s+/g, "").toLowerCase();
}

export function buildSeriesLimitContract(
    mode: SeriesLimitMode,
    summary: SeriesLimitSummary,
    analyticSolution: SeriesLimitAnalyticSolveResponse | null,
): SeriesLimitContractSummary {
    const checks: SeriesLimitContractSummary["checks"] = [
        { id: "lane", label: "Analysis lane", status: "ok", detail: mode },
        { id: "method", label: "Method signal", status: analyticSolution ? "ok" : "info", detail: analyticSolution?.exact.method_label ?? "frontend preview" },
        { id: "family", label: "Detected family", status: summary.detectedFamily ? "ok" : "info", detail: summary.detectedFamily ?? "pending" },
    ];

    let riskLevel: SeriesLimitContractSummary["riskLevel"] = "low";
    let readinessLabel: SeriesLimitContractSummary["readinessLabel"] = analyticSolution ? "publication_ready" : "working";
    const reviewNotes: string[] = [];

    const riskText = `${summary.riskSignal ?? ""} ${summary.proofSignal ?? ""} ${summary.endpointSignal ?? ""}`.toLowerCase();
    if (riskText.includes("unresolved") || riskText.includes("incomplete") || riskText.includes("inconclusive")) {
        riskLevel = "medium";
        readinessLabel = "research_review";
        reviewNotes.push("Proof or endpoint audit remains incomplete for the active series / limit lane.");
    }
    if ((summary.specialFamilySignal ?? "").toLowerCase().includes("research")) {
        riskLevel = "medium";
        readinessLabel = "research_review";
    }
    if (mode === "power-series" && summary.endpointSignal && !summary.endpointSignal.toLowerCase().includes("ready")) {
        riskLevel = "medium";
        readinessLabel = "research_review";
        reviewNotes.push("Power-series endpoint classification should be confirmed before publication use.");
    }
    if (mode === "convergence" && (summary.testFamily ?? "").toLowerCase().includes("pending")) {
        riskLevel = "medium";
        readinessLabel = "working";
    }
    if (!analyticSolution) {
        reviewNotes.push("Backend analytic packet is not available; current trust signal is preview-derived.");
    }

    const status = riskLevel === "low" ? "ok" : "warn";
    return {
        status,
        riskLevel,
        readinessLabel,
        family: summary.detectedFamily ?? mode,
        method: analyticSolution?.exact.method_label ?? "frontend preview",
        checks,
        reviewNotes,
    };
}

export function evaluateSeriesLimitBenchmark(
    mode: SeriesLimitMode,
    expression: string,
    auxiliary: string,
    summary: SeriesLimitSummary,
): SeriesLimitBenchmarkSummary | null {
    const normalizedExpression = normalize(expression);
    const normalizedAuxiliary = normalize(auxiliary);

    if (mode === "limits" && normalizedExpression === "sin(x)/x") {
        const actual = summary.candidateResult ?? "";
        const ok = actual.includes("1");
        return {
            id: "limit-sinx-over-x",
            label: "Sine quotient benchmark",
            expectedValue: "1",
            actualValue: actual || "pending",
            status: ok ? "verified" : "review",
            detail: "lim sin(x)/x as x→0 should equal 1.",
        };
    }

    if (mode === "series" && normalizedExpression === "1/n^2") {
        const actual = summary.convergenceSignal ?? "";
        return {
            id: "series-p-series",
            label: "p-series benchmark",
            expectedValue: "convergent",
            actualValue: actual || "pending",
            status: actual.toLowerCase().includes("convergent") ? "verified" : "review",
            detail: "Σ 1/n^2 should converge.",
        };
    }

    if (mode === "power-series" && normalizedExpression === "x^n" && normalizedAuxiliary.includes("center=0")) {
        const actual = summary.radiusSignal ?? "";
        return {
            id: "power-series-geometric",
            label: "Geometric radius benchmark",
            expectedValue: "R = 1",
            actualValue: actual || "pending",
            status: actual.includes("1") ? "verified" : "review",
            detail: "Geometric power series around 0 should have radius 1.",
        };
    }

    return null;
}
