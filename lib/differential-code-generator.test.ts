import { describe, expect, it } from "vitest";

import { buildDifferentialCodeForMode } from "./differential-code-generator";

describe("differential code generator", () => {
    const input = {
        mode: "derivative" as const,
        expression: "sin(x) + x^2",
        variable: "x",
        point: "1",
        order: "1",
        direction: "1, 0",
    };

    it("generates a production-grade differential pipeline script", () => {
        const code = buildDifferentialCodeForMode("production", { ...input, solveMethod: "symbolic-derivative" });

        expect(code).toContain("Parser -> Normalizer -> Method detector -> Method executor");
        expect(code).toContain("class DifferentialConfig");
        expect(code).toContain("class MethodRecommendation");
        expect(code).toContain("class StructuredIssue");
        expect(code).toContain("class VerificationResult");
        expect(code).toContain("class ReproducibilityCapsule");
        expect(code).toContain("def detect_method");
        expect(code).toContain("def verification_engine");
        expect(code).toContain('selected_method: str = "symbolic-derivative"');
        expect(code.length).toBeGreaterThan(10_000);
    });

    it("changes generated code when the selected method changes", () => {
        const symbolic = buildDifferentialCodeForMode("python-sympy", { ...input, solveMethod: "symbolic-derivative" });
        const numeric = buildDifferentialCodeForMode("python-sympy", { ...input, solveMethod: "finite-difference" });

        expect(symbolic).not.toBe(numeric);
        expect(symbolic).toContain('selected_method: str = "symbolic-derivative"');
        expect(numeric).toContain('selected_method: str = "finite-difference"');
    });

    it("emits SciPy routes for numeric ODE/fallback modes", () => {
        const code = buildDifferentialCodeForMode("python-scipy", {
            mode: "ode",
            expression: "x + y",
            variable: "x",
            point: "0",
            order: "1",
            solveMethod: "runge-kutta",
        });

        expect(code).toContain("scipy.integrate.solve_ivp");
        expect(code).toContain("central_difference");
        expect(code).toContain('selected_method: str = "runge-kutta"');
    });
});
