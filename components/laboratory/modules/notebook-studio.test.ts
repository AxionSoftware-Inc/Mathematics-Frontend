import { describe, expect, it } from "vitest";

function compileNotebookMarkdown(title: string, cells: Array<{ title: string; markdown?: string }>) {
    const sections = cells
        .map((cell) => cell.markdown)
        .filter((section): section is string => typeof section === "string" && section.length > 0);

    return `# ${title}\n\n${sections.join("\n\n")}`;
}

describe("notebook export", () => {
    it("does not emit undefined sections when markdown cells are present", () => {
        const markdown = compileNotebookMarkdown("Notebook", [
            { title: "Intro", markdown: "### Intro\n\nMatn" },
            { title: "Series", markdown: "### Series\n\nNatija" },
        ]);

        expect(markdown).toContain("### Intro");
        expect(markdown).not.toContain("undefined");
    });

    it("skips cells that do not provide markdown output", () => {
        const markdown = compileNotebookMarkdown("Notebook", [
            { title: "Broken" },
            { title: "Series", markdown: "### Series\n\nNatija" },
        ]);

        expect(markdown).toContain("### Series");
        expect(markdown).not.toContain("Broken");
        expect(markdown).not.toContain("undefined");
    });
});
