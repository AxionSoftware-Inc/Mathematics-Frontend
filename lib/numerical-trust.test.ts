import { describe, expect, it } from "vitest";

import { buildNumericalTrustMeter, numericalTrustToMarkdown } from "./numerical-trust";

describe("numerical trust meter", () => {
    it("reports high confidence for close exact/numeric values", () => {
        const meter = buildNumericalTrustMeter({
            method: "adaptive quadrature",
            exactValue: 1,
            numericValue: 1 + 1e-10,
            tolerance: "1e-8",
        });

        expect(meter.confidence).toBeGreaterThanOrEqual(80);
        expect(meter.stability).toBe("stable");
        expect(numericalTrustToMarkdown(meter)).toContain("Numerical Trust Meter");
    });

    it("penalizes warnings and missing independent numeric value", () => {
        const meter = buildNumericalTrustMeter({
            method: "numeric fallback",
            warnings: ["sharp peak near endpoint"],
        });

        expect(meter.confidence).toBeLessThan(80);
        expect(meter.warnings).toContain("No independent numeric value is available.");
    });
});
