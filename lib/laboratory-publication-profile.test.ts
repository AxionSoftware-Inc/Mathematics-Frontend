import { describe, expect, it } from "vitest";

import type { WriterBridgeBlockData } from "@/lib/live-writer-bridge";

import {
    applyPublicationProfileToBlock,
    applyPublicationProfileToMarkdown,
} from "./laboratory-publication-profile";

function buildBlock(): WriterBridgeBlockData {
    return {
        id: "lab-1",
        status: "ready",
        moduleSlug: "integral-studio",
        kind: "integral",
        title: "Gamma Integral",
        summary: "Closed-form and numerical agreement were confirmed.",
        generatedAt: "2026-04-02T12:00:00.000Z",
        metrics: [
            { label: "Readiness", value: "publication" },
            { label: "Risk", value: "low" },
            { label: "Benchmark", value: "matched" },
            { label: "Method", value: "symbolic" },
            { label: "Fallback", value: "quadrature" },
        ],
        notes: [
            "Exact value matches benchmark.",
            "Numeric fallback agrees to 8 digits.",
            "Endpoint behavior is stable.",
            "No domain hazards detected.",
        ],
        coefficients: [
            { order: 0, derivativeValue: 1, coefficient: 1 },
            { order: 1, derivativeValue: 2, coefficient: 2 },
            { order: 2, derivativeValue: 3, coefficient: 3 },
            { order: 3, derivativeValue: 4, coefficient: 4 },
            { order: 4, derivativeValue: 5, coefficient: 5 },
        ],
        matrixTables: [
            { label: "Table A", matrix: [[1, 2]] },
            { label: "Table B", matrix: [[3, 4]] },
        ],
        plotSeries: [
            { label: "Primary curve", color: "#000", points: [{ x: 0, y: 0 }] },
            { label: "Residual", color: "#111", points: [{ x: 1, y: 1 }] },
        ],
    };
}

describe("laboratory publication profiles", () => {
    it("shrinks packets for summary profile", () => {
        const block = applyPublicationProfileToBlock(buildBlock(), "summary");

        expect(block.profile).toBe("summary");
        expect(block.title).toBe("Gamma Integral - Summary");
        expect(block.metrics).toHaveLength(4);
        expect(block.notes).toHaveLength(3);
        expect(block.coefficients).toHaveLength(4);
        expect(block.matrixTables).toHaveLength(1);
        expect(block.plotSeries).toHaveLength(1);
    });

    it("keeps visual assets and removes derivation-heavy fields for figures profile", () => {
        const block = applyPublicationProfileToBlock(buildBlock(), "figures");

        expect(block.profile).toBe("figures");
        expect(block.title).toBe("Gamma Integral - Figures");
        expect(block.coefficients).toBeUndefined();
        expect(block.plotSeries).toHaveLength(2);
        expect(block.matrixTables).toHaveLength(2);
        expect(block.notes).toEqual(["Visual profile selected for publication figures."]);
    });

    it("builds appendix markdown with reproducibility footer", () => {
        const baseMarkdown = "# Gamma Integral\n\nBody";
        const block = applyPublicationProfileToBlock(buildBlock(), "appendix");
        const markdown = applyPublicationProfileToMarkdown(baseMarkdown, block, "appendix");

        expect(markdown).toContain("## Verification Appendix");
        expect(markdown).toContain("- profile: appendix");
        expect(markdown).toContain("- metric count: 5");
    });

    it("builds summary markdown from the shaped block", () => {
        const block = applyPublicationProfileToBlock(buildBlock(), "summary");
        const markdown = applyPublicationProfileToMarkdown("# Raw", block, "summary");

        expect(markdown).toContain("# Gamma Integral - Summary");
        expect(markdown).toContain("## Key Signals");
        expect(markdown).not.toContain("Fallback");
    });
});
