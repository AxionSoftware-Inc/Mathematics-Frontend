import { describe, expect, it } from "vitest";

import { ProbabilityMathService } from "./math-service";

describe("ProbabilityMathService advanced lanes", () => {
    it("adds regression confidence bands for linear fits", () => {
        const result = ProbabilityMathService.analyze("regression", "(1,2);(2,4.1);(3,5.8);(4,8.2)", "model=linear");

        expect(result.summary.intervalSignal).toContain("95%");
        expect(result.intervalUpperSeries?.length).toBe(result.fitSeries?.length);
        expect(result.intervalLowerSeries?.length).toBe(result.fitSeries?.length);
    });

    it("builds multivariate explained variance and cluster balance", () => {
        const result = ProbabilityMathService.analyze(
            "multivariate",
            "2,3,4;3,5,6;4,6,7;8,9,10;9,10,12",
            "labels=a,b,c",
        );

        expect(result.summary.explainedVariance).toContain("%");
        expect(result.summary.clusterBalance).toContain("balance");
        expect(result.scatterSeries?.length).toBe(5);
    });

    it("builds time-series forecast intervals", () => {
        const result = ProbabilityMathService.analyze(
            "time-series",
            "10,11,12,13,14,15,16,17",
            "window=3;horizon=3;period=2",
        );

        expect(result.summary.forecastInterval).toContain("[");
        expect(result.intervalUpperSeries?.length).toBe(3);
        expect(result.intervalLowerSeries?.length).toBe(3);
    });

    it("reports monte-carlo convergence signals", () => {
        const result = ProbabilityMathService.analyze("monte-carlo", "", "method=pi;samples=1200;seed=7");

        expect(result.summary.convergenceSignal).toContain("stderr");
        expect(result.summary.confidenceInterval).toContain("[");
        expect(result.intervalUpperSeries?.length).toBeGreaterThan(5);
    });
});
