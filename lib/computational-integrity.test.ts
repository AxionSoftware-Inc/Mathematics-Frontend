import { describe, expect, it } from "vitest";

import {
    buildChangeImpactMap,
    buildComputationalCitationMarkdown,
    buildReproducibilityCapsule,
    deterministicHash,
    stableStringify,
    summarizeComputationalTrust,
} from "./computational-integrity";

describe("computational integrity", () => {
    it("creates stable hashes independent of object key order", () => {
        const first = { b: 2, a: { y: 1, x: 0 } };
        const second = { a: { x: 0, y: 1 }, b: 2 };

        expect(stableStringify(first)).toBe(stableStringify(second));
        expect(deterministicHash(first)).toBe(deterministicHash(second));
    });

    it("builds a reproducibility capsule from saved-result metadata", () => {
        const capsule = buildReproducibilityCapsule({
            input: { expression: "x^2", lower: "0", upper: "1" },
            result: { value: "1/3" },
            metadata: {
                computation: {
                    method: "symbolic",
                    engine: "sympy",
                    engine_version: "1.13",
                    tolerance: "1e-10",
                },
                assumptions: ["x is real"],
                numeric_settings: { maxIterations: 1000 },
            },
            createdAt: "2026-05-11T10:00:00.000Z",
        });

        expect(capsule.method).toBe("symbolic");
        expect(capsule.engine).toBe("sympy");
        expect(capsule.assumptions).toEqual(["x is real"]);
        expect(capsule.sourceHash).toMatch(/^h[0-9a-f]{8}$/);
        expect(capsule.resultHash).toMatch(/^h[0-9a-f]{8}$/);
    });

    it("summarizes trust and change impact for outdated writer imports", () => {
        const metadata = {
            computation: { method: "integration_by_parts" },
            verification_certificate: { status: "verified", trust_score: 94, warnings: [] },
        };

        expect(summarizeComputationalTrust(metadata)).toEqual(
            expect.objectContaining({ label: "verified", score: 94 }),
        );

        const impact = buildChangeImpactMap({
            currentRevision: 1,
            latestRevision: 3,
            latestMetadata: metadata,
            currentIntegrity: { method: "substitution" },
        });

        expect(impact.stale).toBe(true);
        expect(impact.reason).toContain("integration_by_parts");
        expect(impact.affected.map((item) => item.label)).toContain("Python code");
    });

    it("formats computational citation markdown with capsule hashes", () => {
        const markdown = buildComputationalCitationMarkdown({
            resultId: "12345678-aaaa-bbbb-cccc-000000000000",
            title: "Integral result",
            moduleTitle: "Integral Studio",
            revision: 2,
            updatedAt: "2026-05-11T15:42:00.000Z",
            metadata: {
                reproducibility_capsule: {
                    method: "symbolic",
                    sourceHash: "hsource01",
                    resultHash: "hresult01",
                },
                verification_certificate: { status: "verified", trust_score: 91 },
            },
        });

        expect(markdown).toContain("Computed from R12345678");
        expect(markdown).toContain("trust: verified 91/100");
        expect(markdown).toContain("source hsource01");
    });
});
