import { describe, expect, it } from "vitest";

import { analyzeQuantumState, getSchrodingerStates } from "./math-utils";

describe("quantum helpers", () => {
    it("normalizes invalid Bloch angles into a safe state analysis", () => {
        const analysis = analyzeQuantumState(Number.NaN, Number.POSITIVE_INFINITY);

        expect(analysis.theta).toBeCloseTo(Math.PI / 2, 3);
        expect(analysis.phi).toBe(0);
        expect(analysis.zeroProbability + analysis.oneProbability).toBeCloseTo(1, 3);
    });

    it("generates stationary states with normalized probability density samples", () => {
        const states = getSchrodingerStates(3, 120);

        expect(states).toHaveLength(121);
        expect(states[0]?.prob).toBeGreaterThanOrEqual(0);
        expect(states.some((point) => point.prob > 0.1)).toBe(true);
    });
});
