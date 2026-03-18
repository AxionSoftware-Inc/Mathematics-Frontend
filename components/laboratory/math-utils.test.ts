import { describe, expect, it } from "vitest";

import { analyzeAnalyticGeometry, analyzeSeries, analyzeTaylorApproximation, approximateIntegral, estimateLimit, parseNumericMatrix, runMatrixOperation, solveDifferentialEquation, summarizeMatrix } from "./math-utils";

describe("laboratory math utils", () => {
    it("parses numeric matrix text", () => {
        expect(parseNumericMatrix("1 2\n3 4")).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });

    it("multiplies matrices", () => {
        const result = runMatrixOperation("1 2\n3 4", "2 0\n1 2", "multiply");
        expect(result.matrix).toEqual([
            [4, 4],
            [10, 8],
        ]);
    });

    it("summarizes a matrix", () => {
        const summary = summarizeMatrix([
            [2, 1],
            [1, 3],
        ]);
        expect(summary.rows).toBe(2);
        expect(summary.columns).toBe(2);
        expect(summary.trace).toBe(5);
        expect(summary.determinant).toBe(5);
        expect(summary.rowSums).toEqual([3, 4]);
    });

    it("approximates a simple integral", () => {
        const summary = approximateIntegral("x", 0, 1, 20);
        expect(summary.midpoint).toBeCloseTo(0.5, 2);
        expect(summary.trapezoid).toBeCloseTo(0.5, 2);
        expect(summary.simpson).toBeCloseTo(0.5, 2);
    });

    it("solves a differential equation with monotonic time steps", () => {
        const points = solveDifferentialEquation("x + y", 0, 1, 0.1, 4);
        expect(points).toHaveLength(5);
        expect(points[0]).toEqual({ x: 0, euler: 1, heun: 1 });
        expect(points[4].x).toBeCloseTo(0.4, 6);
    });

    it("builds a partial sum series", () => {
        const summary = analyzeSeries("1 / n", 1, 12);
        expect(summary.points).toHaveLength(12);
        expect(summary.points[0].term).toBeCloseTo(1, 6);
        expect(summary.lastPartial).toBeCloseTo(3.103211, 5);
        expect(summary.diagnostic).toBe("slow-convergence");
        expect(summary.ratioEstimate).toBeCloseTo(0.916667, 5);
    });

    it("detects geometric divergence heuristically", () => {
        const summary = analyzeSeries("1.2^n", 1, 8);
        expect(summary.diagnostic).toBe("likely-divergent");
        expect(summary.absoluteTermTrend).toBe("up");
    });

    it("estimates a removable limit", () => {
        const summary = estimateLimit("sin(x) / x", 0, 1, 12);
        expect(summary.left).toBeCloseTo(1, 2);
        expect(summary.right).toBeCloseTo(1, 2);
        expect(summary.average).toBeCloseTo(1, 2);
        expect(summary.diagnostic).toBe("likely-exists");
    });

    it("flags one-sided mismatch limits", () => {
        const summary = estimateLimit("abs(x) / x", 0, 1, 12);
        expect(summary.diagnostic).toBe("one-sided-mismatch");
        expect(summary.gap).toBeCloseTo(2, 4);
    });

    it("builds a Taylor approximation around zero", () => {
        const summary = analyzeTaylorApproximation("sin(x)", 0, 5, 1, 25);
        expect(summary.coefficients[1]?.coefficient).toBeCloseTo(1, 6);
        expect(summary.coefficients[3]?.coefficient).toBeCloseTo(-1 / 6, 4);
        expect(summary.maxError).toBeLessThan(0.01);
    });

    it("analyzes analytic geometry for two lines", () => {
        const summary = analyzeAnalyticGeometry(
            { x: 0, y: 0 },
            { x: 4, y: 4 },
            { x: 0, y: 4 },
            { x: 4, y: 0 },
        );

        expect(summary.distanceAB).toBeCloseTo(5.656854, 5);
        expect(summary.midpointAB).toEqual({ x: 2, y: 2 });
        expect(summary.intersection).toEqual({ x: 2, y: 2 });
        expect(summary.isParallel).toBe(false);
    });
});
