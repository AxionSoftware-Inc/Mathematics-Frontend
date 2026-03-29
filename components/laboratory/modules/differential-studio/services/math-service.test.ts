import { describe, expect, it } from "vitest";

import { DifferentialMathService } from "./math-service";

describe("DifferentialMathService advanced lanes", () => {
    it("builds an ODE summary with trajectory and phase diagnostics", () => {
        const summary = DifferentialMathService.buildODESummary("y' = y - y^3; y(0)=0.5", "x", "y(0)=0.5");

        expect(summary.type).toBe("ode");
        expect(summary.samples.length).toBeGreaterThan(20);
        expect(summary.field.length).toBeGreaterThan(10);
        expect(summary.phaseSamples.length).toBeGreaterThan(10);
    });

    it("builds a PDE numeric summary with profile and stability ratio", () => {
        const summary = DifferentialMathService.buildPDESummary("u_t = 0.4*u_xx; u(x,0)=sin(x)", "x, t", "u(x,0)=sin(x)");

        expect(summary.type).toBe("pde");
        expect(summary.heatmapSamples.length).toBeGreaterThan(100);
        expect(summary.finalProfile.length).toBeGreaterThan(10);
        expect(summary.stabilityRatio).toBeGreaterThan(0);
    });

    it("builds an SDE ensemble summary with bands and histogram", () => {
        const summary = DifferentialMathService.buildSDESummary("dX = 0.4*X*dt + 0.2*X*dW", "X(0)=1; t:[0,1]; n=120", 24);

        expect(summary.type).toBe("sde");
        expect(summary.ensemblePaths).toHaveLength(24);
        expect(summary.meanPath.length).toBe(summary.lowerBand.length);
        expect(summary.upperBand.length).toBe(summary.meanPath.length);
        expect(summary.terminalHistogram.length).toBeGreaterThan(5);
    });
});
