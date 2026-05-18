import { describe, expect, it } from "vitest";

import {
    analyzeWriterDocument,
    compareWriterRevisions,
    createWriterRevisionSnapshot,
} from "./writer-intelligence";

describe("writer intelligence", () => {
    it("detects missing and unused bibliography keys", () => {
        const content = `
# Draft

We cite [Euler1748] and [Gauss1801].

## Ishlatilgan adabiyotlar

- [Euler1748] Euler reference
- [Unused1899] Unused reference
`;
        const report = analyzeWriterDocument(content, [
            { id: "1", title: "Draft", slug: "draft", kind: "section", progress_state: "drafting", order: 1, content },
        ]);

        expect(report.missingBibliographyKeys).toEqual(["Gauss1801"]);
        expect(report.unusedBibliographyKeys).toEqual(["Unused1899"]);
        expect(report.preflight.status).toBe("blocked");
    });

    it("detects duplicate headings and undefined symbol candidates", () => {
        const content = `
## Method
$F = ma + q$

## Method
$q = x + y + q$
`;
        const report = analyzeWriterDocument(content, [
            { id: "1", title: "Method", slug: "method", kind: "section", progress_state: "drafting", order: 1, content },
        ]);

        expect(report.duplicateHeadingTitles[0]?.title).toBe("Method");
        expect(report.undefinedSymbolCandidates.some((item) => item.symbol === "q")).toBe(true);
    });

    it("creates snapshots and compares revisions", () => {
        const snapshot = createWriterRevisionSnapshot({
            id: "snap-1",
            label: "Checkpoint",
            title: "Draft",
            abstract: "A",
            content: "## A\n\nOne two three",
            sectionCount: 1,
        });
        const comparison = compareWriterRevisions("## A\n\nOne two three four five", snapshot.content, "B", snapshot.abstract);

        expect(snapshot.wordCount).toBe(5);
        expect(comparison.addedWords).toBe(2);
        expect(comparison.changedAbstract).toBe(true);
    });
});
