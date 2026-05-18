import { describe, expect, it } from "vitest";

import { buildIntegralCodeForMode } from "./integral-code-generator";

describe("integral code generator", () => {
    const input = {
        expression: "sin(x) + x^2 / 5",
        lower: "0",
        upper: "pi",
    };

    it("generates a production-grade SymPy reproduction script", () => {
        const code = buildIntegralCodeForMode("production", { ...input, solveMethod: "partial-fractions" });

        expect(code).toContain("class IntegralConfig");
        expect(code).toContain("Parser -> Normalizer -> Method detector -> Method executor");
        expect(code).toContain("class MethodRecommendation");
        expect(code).toContain("class StructuredIssue");
        expect(code).toContain("class StepRecord");
        expect(code).toContain("class VerificationResult");
        expect(code).toContain("class ReproducibilityCapsule");
        expect(code).toContain("def detect_method");
        expect(code).toContain("Verification engine");
        expect(code).toContain("selected_method: MethodName = \"partial-fractions\"");
        expect(code).toContain("sp.apart(expr, x)");
        expect(code.length).toBeGreaterThan(10_000);
    });

    it("changes generated code when the selected method changes", () => {
        const partialFractions = buildIntegralCodeForMode("python-sympy", { ...input, solveMethod: "partial-fractions" });
        const series = buildIntegralCodeForMode("python-sympy", { ...input, solveMethod: "series-expansion-integral" });

        expect(partialFractions).not.toBe(series);
        expect(partialFractions).toContain("selected_method: MethodName = \"partial-fractions\"");
        expect(series).toContain("selected_method: MethodName = \"series-expansion-integral\"");
        expect(series).toContain("sp.series(expr, x, center, config.series_order).removeO()");
    });

    it("emits a real numeric strategy table for SciPy modes", () => {
        const code = buildIntegralCodeForMode("python-scipy", { ...input, solveMethod: "gauss-legendre" });

        expect(code).toContain("def adaptive_quad");
        expect(code).toContain("def quad_vec_strategy");
        expect(code).toContain("def nquad_strategy");
        expect(code).toContain("def gauss_legendre");
        expect(code).toContain("def composite_simpson");
        expect(code).toContain("def monte_carlo");
        expect(code).toContain("selected_method: str = \"gauss-legendre\"");
    });
});
