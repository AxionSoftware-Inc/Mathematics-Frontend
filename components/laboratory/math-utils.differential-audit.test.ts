import { describe, expect, it } from "vitest";

import {
    buildDirectionField,
    buildPlanarNullclineField,
    buildPlanarVectorField,
    buildSingleDifferentialAudit,
    buildSystemTrajectoryAudit,
    sampleSingleEquationPhaseLine,
    solveDifferentialEquation,
    solveODESystem,
} from "./math-utils";

describe("differential laboratory audit helpers", () => {
    it("detects stable equilibria on a phase-line slice", () => {
        const phaseLine = sampleSingleEquationPhaseLine("y * (1 - y)", 0, -0.5, 1.5, 80);

        expect(phaseLine.samples.length).toBeGreaterThan(40);
        expect(phaseLine.equilibria.some((entry) => Math.abs(entry.y - 1) < 0.08)).toBe(true);
        expect(phaseLine.equilibria.some((entry) => entry.stability === "stable")).toBe(true);
    });

    it("builds a refined reference audit for a single equation", () => {
        const points = solveDifferentialEquation("-0.8 * y", 0, 4, 0.1, 30);
        const audit = buildSingleDifferentialAudit("-0.8 * y", points, 0, 4, 0.1, 30);

        expect(audit.referenceSeries.length).toBeGreaterThan(points.length);
        expect(audit.referenceGapSeries).toHaveLength(points.length);
        expect(audit.meanReferenceGap).toBeGreaterThanOrEqual(0);
        expect(audit.recommendedStep).toBeLessThanOrEqual(0.1);
    });

    it("samples a client-side direction field grid", () => {
        const segments = buildDirectionField("x - y", -2, 2, -3, 3, 12, 10);

        expect(segments.length).toBeGreaterThan(50);
        expect(segments.every((segment) => Number.isFinite(segment.slope))).toBe(true);
    });

    it("builds a phase-plane vector field and nullcline samples", () => {
        const field = buildPlanarVectorField("y", "-x", -2, 2, -2, 2, 12, 10);
        const nullclines = buildPlanarNullclineField("y", "-x", -2, 2, -2, 2, 24, 24);

        expect(field.length).toBeGreaterThan(60);
        expect(nullclines.xNullcline.length).toBeGreaterThan(8);
        expect(nullclines.yNullcline.length).toBeGreaterThan(8);
    });

    it("builds radius and speed profiles for ode systems", () => {
        const system = solveODESystem({ x: "y", y: "-x" }, { x: 1, y: 0 }, 0, 2, 0.05);
        const audit = buildSystemTrajectoryAudit(system, false);

        expect(audit.radiusSeries).toHaveLength(system.length);
        expect(audit.speedSeries.length).toBe(system.length - 1);
        expect(audit.peakSpeed).toBeGreaterThan(0);
        expect(audit.footprint).toBeGreaterThan(0);
    });
});
