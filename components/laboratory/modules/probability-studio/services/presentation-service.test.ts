import { describe, expect, it } from "vitest";

import { buildProbabilityContract, evaluateProbabilityBenchmark } from "./presentation-service";

describe("buildProbabilityContract", () => {
    it("marks small regression samples as research review", () => {
        const contract = buildProbabilityContract(
            "regression",
            {
                sampleSize: "5",
                riskSignal: "review residual spread",
                residualSignal: "rmse ~= 0.8",
            },
            null,
        );

        expect(contract.readinessLabel).toBe("research_review");
        expect(contract.riskLevel).toBe("high");
    });

    it("marks distribution lanes as publication ready when analytic packet exists", () => {
        const contract = buildProbabilityContract(
            "distributions",
            {
                sampleSize: "analytic",
                distributionFamily: "normal",
            },
            {
                status: "exact",
                message: "",
                input: { mode: "distributions", dataset: "", parameters: "", dimension: "1d" },
                parser: { dataset_raw: "", parameters_raw: "", dimension: "1d" },
                diagnostics: { lane: "distributions", family: "normal", risk: "model", method: "closed form" },
                summary: {},
                exact: { method_label: "Normal Distribution Audit", steps: [] },
            },
        );

        expect(contract.readinessLabel).toBe("publication_ready");
        expect(contract.status).toBe("ok");
    });

    it("prefers backend contract when available", () => {
        const contract = buildProbabilityContract(
            "time-series",
            {
                sampleSize: "8",
                riskSignal: "stable drift lane",
                stationarity: "trend present",
            },
            {
                status: "exact",
                message: "",
                input: { mode: "time-series", dataset: "", parameters: "", dimension: "1d temporal" },
                parser: { dataset_raw: "", parameters_raw: "", dimension: "1d temporal" },
                diagnostics: {
                    lane: "time-series",
                    family: "time-series",
                    risk: "stable drift lane",
                    method: "trend + moving average",
                    contract: {
                        status: "info",
                        risk_level: "medium",
                        readiness_label: "research_review",
                        checks: [{ id: "lane", label: "Analysis lane", status: "ok", detail: "time-series" }],
                        review_notes: ["Review forecast drift before publication use."],
                    },
                },
                summary: {},
                exact: { method_label: "Trend / Forecast Audit", steps: [] },
            },
        );

        expect(contract.readinessLabel).toBe("research_review");
        expect(contract.status).toBe("info");
        expect(contract.reviewNotes).toContain("Review forecast drift before publication use.");
    });
});

describe("evaluateProbabilityBenchmark", () => {
    it("verifies the descriptive mean benchmark", () => {
        const benchmark = evaluateProbabilityBenchmark("descriptive", "1,2,3,4,5", "", {
            mean: "3.000",
        });

        expect(benchmark?.status).toBe("verified");
    });

    it("verifies the beta-binomial posterior benchmark", () => {
        const benchmark = evaluateProbabilityBenchmark(
            "bayesian",
            "successes=58; trials=100",
            "prior_alpha=2; prior_beta=3",
            { posteriorMean: "0.571" },
        );

        expect(benchmark?.status).toBe("verified");
    });

    it("verifies the canonical linear regression benchmark", () => {
        const benchmark = evaluateProbabilityBenchmark(
            "regression",
            "(1,2.1), (2,2.9), (3,4.2), (4,5.1), (5,6.2)",
            "model=linear",
            { regressionFit: "y ~= 1.030x + 1.030" },
        );

        expect(benchmark?.status).toBe("verified");
    });

    it("verifies the canonical time-series forecast benchmark", () => {
        const benchmark = evaluateProbabilityBenchmark(
            "time-series",
            "10,11,12,13,14,15,17,18",
            "window=3; horizon=2",
            { forecast: "t+2 ~= 20.464" },
        );

        expect(benchmark?.status).toBe("verified");
    });
});
