import type {
    ProbabilityAnalyticSolveResponse,
    ProbabilityBenchmarkSummary,
    ProbabilityContractSummary,
    ProbabilityMode,
    ProbabilitySummary,
} from "../types";

function normalizeText(value: string) {
    return value.replace(/\s+/g, "").toLowerCase();
}

function parseSampleSize(value?: string | null) {
    const size = Number(value ?? "");
    return Number.isFinite(size) ? size : null;
}

export function buildProbabilityContract(
    mode: ProbabilityMode,
    summary: ProbabilitySummary,
    analyticSolution: ProbabilityAnalyticSolveResponse | null,
): ProbabilityContractSummary {
    const backendContract = analyticSolution?.diagnostics?.contract;
    if (backendContract) {
        return {
            status: backendContract.status,
            riskLevel: backendContract.risk_level ?? "medium",
            readinessLabel: backendContract.readiness_label ?? "working",
            family: analyticSolution?.diagnostics?.family ?? summary.distributionFamily ?? mode,
            method: analyticSolution?.diagnostics?.method ?? analyticSolution?.exact.method_label ?? "pending",
            checks:
                backendContract.checks?.map((check) => ({
                    id: check.id,
                    label: check.label,
                    status: check.status,
                    detail: check.detail,
                })) ?? [],
            reviewNotes: backendContract.review_notes ?? [],
        };
    }

    const checks: ProbabilityContractSummary["checks"] = [];
    const sampleSize = parseSampleSize(summary.sampleSize);
    const method = analyticSolution?.diagnostics?.method ?? analyticSolution?.exact.method_label ?? "pending";
    const family = analyticSolution?.diagnostics?.family ?? summary.distributionFamily ?? mode;

    checks.push({
        id: "lane",
        label: "Analysis lane",
        status: "ok",
        detail: mode,
    });
    checks.push({
        id: "method",
        label: "Method signal",
        status: analyticSolution ? "ok" : "info",
        detail: method,
    });
    checks.push({
        id: "sample",
        label: "Sample support",
        status: sampleSize == null ? "info" : sampleSize >= 8 ? "ok" : "warn",
        detail: sampleSize == null ? "Analytic or model-driven lane." : `n = ${sampleSize}`,
    });

    let riskLevel: ProbabilityContractSummary["riskLevel"] = "low";
    let readinessLabel: ProbabilityContractSummary["readinessLabel"] = "publication_ready";
    const reviewNotes: string[] = [];

    if (mode === "regression") {
        const riskText = `${summary.riskSignal ?? ""} ${summary.residualSignal ?? ""} ${summary.outlierSignal ?? ""}`.toLowerCase();
        if (riskText.includes("review") || riskText.includes("needs")) {
            riskLevel = "medium";
            readinessLabel = "research_review";
            reviewNotes.push("Residual or classifier quality signal suggests reviewing model fit before publication use.");
        }
        if (sampleSize != null && sampleSize < 6) {
            riskLevel = "high";
            readinessLabel = "research_review";
            reviewNotes.push("Regression sample is very small for a stable publication-facing interpretation.");
        }
    } else if (mode === "time-series") {
        const stationarity = `${summary.stationarity ?? ""}`.toLowerCase();
        if (stationarity.includes("non") || stationarity.includes("drift")) {
            riskLevel = "medium";
            readinessLabel = "research_review";
            reviewNotes.push("Time-series signal indicates drift or weak stationarity; forecast claims should be scoped carefully.");
        }
    } else if (mode === "monte-carlo") {
        riskLevel = "medium";
        readinessLabel = "research_review";
        reviewNotes.push("Monte Carlo results should be read together with convergence and interval diagnostics.");
        if ((summary.convergenceSignal ?? "").toLowerCase().includes("slow")) {
            riskLevel = "high";
        }
    } else if (mode === "multivariate") {
        riskLevel = "medium";
        readinessLabel = "research_review";
        reviewNotes.push("Multivariate structure is interpretive; PCA and cluster outputs should be read with domain context.");
    } else if (mode === "inference") {
        const riskText = `${summary.riskSignal ?? ""}`.toLowerCase();
        if (riskText.includes("inconclusive") || riskText.includes("under-powered")) {
            riskLevel = "medium";
            readinessLabel = "working";
            reviewNotes.push("Inference signal is inconclusive or under-powered.");
        }
    } else if (mode === "descriptive" && sampleSize != null && sampleSize < 5) {
        riskLevel = "medium";
        readinessLabel = "working";
        reviewNotes.push("Very small descriptive samples should be treated as exploratory only.");
    } else if (mode === "bayesian") {
        reviewNotes.push("Posterior summaries are strongest when prior assumptions are reported alongside the final narrative.");
    }

    if (!analyticSolution) {
        if (readinessLabel === "publication_ready") {
            readinessLabel = "working";
        }
        if (riskLevel === "low") {
            riskLevel = "medium";
        }
        reviewNotes.push("Backend analytic packet is not available; this reading is frontend-derived.");
    }

    const status = riskLevel === "high" ? "warn" : riskLevel === "medium" ? "info" : "ok";

    return {
        status,
        riskLevel,
        readinessLabel,
        family,
        method,
        checks,
        reviewNotes,
    };
}

export function evaluateProbabilityBenchmark(
    mode: ProbabilityMode,
    dataset: string,
    parameters: string,
    summary: ProbabilitySummary,
): ProbabilityBenchmarkSummary | null {
    const normalizedDataset = normalizeText(dataset);
    const normalizedParams = normalizeText(parameters);

    if (mode === "descriptive" && normalizedDataset === "1,2,3,4,5") {
        const actual = Number(summary.mean ?? "");
        const expected = 3;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "descriptive-mean-sequence",
            label: "Descriptive mean benchmark",
            expectedValue: expected.toFixed(3),
            actualValue: summary.mean ?? "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 1e-6 ? "verified" : "review",
            detail: "Mean of 1,2,3,4,5 should equal 3.",
        };
    }

    if (mode === "bayesian" && normalizedDataset === "successes=58;trials=100" && normalizedParams.includes("prior_alpha=2") && normalizedParams.includes("prior_beta=3")) {
        const actual = Number(summary.posteriorMean ?? "");
        const expected = 60 / 105;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "bayesian-beta-binomial",
            label: "Beta-binomial posterior benchmark",
            expectedValue: expected.toFixed(3),
            actualValue: summary.posteriorMean ?? "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.01 ? "verified" : "review",
            detail: "Posterior mean with alpha=2, beta=3, successes=58, trials=100 should be 60/105.",
        };
    }

    if (mode === "distributions" && normalizedDataset === "x=0" && normalizedParams.includes("family=normal") && normalizedParams.includes("mu=0") && normalizedParams.includes("sigma=1")) {
        const value = summary.confidenceInterval ?? "";
        const match = value.match(/=\s*([0-9.]+)/);
        const actual = match ? Number(match[1]) : NaN;
        const expected = 0.5;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "distribution-normal-origin",
            label: "Normal CDF benchmark",
            expectedValue: expected.toFixed(4),
            actualValue: Number.isFinite(actual) ? actual.toFixed(4) : "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.01 ? "verified" : "review",
            detail: "For N(0,1), P(X<=0) should equal 0.5.",
        };
    }

    if (mode === "regression" && normalizedDataset === "(1,2.1),(2,2.9),(3,4.2),(4,5.1),(5,6.2)" && normalizedParams.includes("model=linear")) {
        const fit = summary.regressionFit ?? "";
        const match = fit.match(/y\s*~=\s*([+-]?\d+(?:\.\d+)?)x\s*\+\s*([+-]?\d+(?:\.\d+)?)/i);
        const slope = match ? Number(match[1]) : NaN;
        const intercept = match ? Number(match[2]) : NaN;
        const expectedSlope = 1.03;
        const expectedIntercept = 1.03;
        const absoluteError = Number.isFinite(slope) && Number.isFinite(intercept) ? Math.max(Math.abs(slope - expectedSlope), Math.abs(intercept - expectedIntercept)) : null;
        return {
            id: "regression-linear-fit",
            label: "Linear regression benchmark",
            expectedValue: `slope=${expectedSlope.toFixed(2)}, intercept=${expectedIntercept.toFixed(2)}`,
            actualValue: Number.isFinite(slope) && Number.isFinite(intercept) ? `slope=${slope.toFixed(2)}, intercept=${intercept.toFixed(2)}` : "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.08 ? "verified" : "review",
            detail: "Canonical 5-point linear fit should stay near slope 1.03 and intercept 1.03.",
        };
    }

    if (mode === "multivariate" && normalizedDataset === "1,2,3;2,3,4;3,4,5;4,5,6") {
        const explained = Number((summary.explainedVariance ?? "").replace("%", ""));
        const actual = Number.isFinite(explained) ? explained : NaN;
        const expected = 100;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "multivariate-perfect-line",
            label: "PCA dominance benchmark",
            expectedValue: "100.0%",
            actualValue: Number.isFinite(actual) ? `${actual.toFixed(1)}%` : "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.2 ? "verified" : "review",
            detail: "Perfectly collinear rows should concentrate essentially all variance in PC1.",
        };
    }

    if (mode === "time-series" && normalizedDataset === "10,11,12,13,14,15,17,18" && normalizedParams.includes("window=3") && normalizedParams.includes("horizon=2")) {
        const actual = Number((summary.forecast ?? "").split("~=")[1] ?? "");
        const expected = 20.4642857143;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "time-series-drift-forecast",
            label: "Trend forecast benchmark",
            expectedValue: expected.toFixed(3),
            actualValue: Number.isFinite(actual) ? actual.toFixed(3) : "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.02 ? "verified" : "review",
            detail: "Linear trend forecast for the canonical 8-point series should land near 20.464.",
        };
    }

    if (mode === "monte-carlo" && normalizedParams.includes("method=sampler_compare") && normalizedParams.includes("samples=1500") && normalizedParams.includes("seed=7")) {
        const actual = Number((summary.samplerSignal ?? "").split("~=")[1] ?? "");
        const expected = Math.PI;
        const absoluteError = Number.isFinite(actual) ? Math.abs(actual - expected) : null;
        return {
            id: "monte-carlo-pi-benchmark",
            label: "Stratified pi benchmark",
            expectedValue: expected.toFixed(4),
            actualValue: Number.isFinite(actual) ? actual.toFixed(4) : "pending",
            absoluteError,
            status: absoluteError != null && absoluteError <= 0.12 ? "verified" : "review",
            detail: "Stratified Monte Carlo estimate should stay acceptably close to pi for the canonical sampler-compare case.",
        };
    }

    return null;
}
