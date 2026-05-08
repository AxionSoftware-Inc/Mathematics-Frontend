import { describe, expect, it } from "vitest";

import { buildSeriesLimitContract, evaluateSeriesLimitBenchmark } from "./presentation-service";

describe("buildSeriesLimitContract", () => {
    it("marks unresolved endpoint audits for review", () => {
        const contract = buildSeriesLimitContract(
            "power-series",
            {
                detectedFamily: "power series",
                endpointSignal: "unresolved endpoints",
            },
            null,
        );

        expect(contract.readinessLabel).toBe("research_review");
        expect(contract.riskLevel).toBe("medium");
    });
});

describe("evaluateSeriesLimitBenchmark", () => {
    it("verifies the sine quotient limit", () => {
        const benchmark = evaluateSeriesLimitBenchmark("limits", "sin(x)/x", "", {
            candidateResult: "1",
        });

        expect(benchmark?.status).toBe("verified");
    });

    it("verifies the p-series convergence benchmark", () => {
        const benchmark = evaluateSeriesLimitBenchmark("series", "1/n^2", "", {
            convergenceSignal: "convergent by p-series test",
        });

        expect(benchmark?.status).toBe("verified");
    });
});
