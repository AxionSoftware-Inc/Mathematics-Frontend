import { describe, expect, it } from "vitest";

import { assumptionsToStatements, buildAssumptionImpactSummary, inferAssumptions } from "./assumptions";

describe("assumption manager contract", () => {
    it("infers lightweight real-domain assumptions from input text", () => {
        const assumptions = inferAssumptions({ input: { expression: "x^2 + a*sin(t)" } });

        expect(assumptionsToStatements(assumptions)).toContain("x in R");
        expect(assumptionsToStatements(assumptions)).toContain("a in R");
        expect(assumptionsToStatements(assumptions)).toContain("t in R");
    });

    it("summarizes impact when assumptions change", () => {
        const previous = inferAssumptions({ input: { expression: "x^2" } });
        const next = [...previous, { id: "user-a", variable: "a", statement: "a > 0", kind: "sign" as const, source: "user" as const }];

        const impact = buildAssumptionImpactSummary(next, previous);

        expect(impact.changed).toBe(1);
        expect(impact.affected).toContain("verification certificate");
    });
});
