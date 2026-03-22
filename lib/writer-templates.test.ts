import { describe, expect, it } from "vitest";

import { DEFAULT_WRITER_PRESET_ID, DEFAULT_WRITER_TEMPLATE_ID, createDraftFromTemplate, getDefaultWriterTemplate, getDefaultWriterTemplatePreset, getWriterTemplate, getWriterTemplatePreset, resolveWriterTemplateAddOns, writerTemplates } from "./writer-templates";

describe("writer templates", () => {
    it("exposes a broad professional template set", () => {
        expect(writerTemplates.length).toBeGreaterThanOrEqual(14);
        expect(writerTemplates.map((template) => template.id)).toContain("research-paper");
        expect(writerTemplates.map((template) => template.id)).toContain("lab-report");
        expect(writerTemplates.map((template) => template.id)).toContain("textbook-manuscript");
        expect(writerTemplates.map((template) => template.id)).toContain("problem-book");
        expect(writerTemplates.map((template) => template.id)).toContain("lecture-book");
        expect(writerTemplates.map((template) => template.id)).toContain("olympiad-book");
        expect(writerTemplates.map((template) => template.id)).toContain(DEFAULT_WRITER_TEMPLATE_ID);
    });

    it("returns the default template when requested", () => {
        const template = getDefaultWriterTemplate();
        expect(template.id).toBe(DEFAULT_WRITER_TEMPLATE_ID);
    });

    it("returns the default quick preset when requested", () => {
        const preset = getDefaultWriterTemplatePreset();
        expect(preset.id).toBe(DEFAULT_WRITER_PRESET_ID);
        expect(getWriterTemplatePreset("lab-ready")?.templateId).toBe("lab-report");
        expect(getWriterTemplatePreset("book-ready")?.templateId).toBe("textbook-manuscript");
    });

    it("builds an editor draft from a template", () => {
        const template = getWriterTemplate("research-paper");
        expect(template).not.toBeNull();

        const draft = createDraftFromTemplate(template!);
        expect(draft.title.toLowerCase()).toContain("tadqiqot");
        expect(draft.content).toContain("##");
        expect(draft.status).toBe("draft");
        expect(draft.sections).toHaveLength(1);
    });

    it("supports legacy template ids for existing links", () => {
        expect(getWriterTemplate("research")?.id).toBe("research-paper");
        expect(getWriterTemplate("article")?.id).toBe("expository-article");
        expect(getWriterTemplate("book")?.id).toBe("textbook-manuscript");
        expect(getWriterTemplate("simple")?.id).toBe("simple-draft");
    });

    it("appends selected add-on snippets to the generated draft", () => {
        const template = getWriterTemplate("lab-report");
        const draft = createDraftFromTemplate(template!, ["lab-observation-pack", "delivery-checklist"]);

        expect(draft.content).toContain("Observation Log");
        expect(draft.content).toContain("Submission Checklist");
        expect(draft.sections[0]?.content).toContain("Observation Log");
        expect(resolveWriterTemplateAddOns(["delivery-checklist"])).toHaveLength(1);
    });

    it("creates book drafts as chapter-based documents", () => {
        const template = getWriterTemplate("textbook-manuscript");
        const draft = createDraftFromTemplate(template!, ["example-bank"]);

        expect(draft.document_kind).toBe("book");
        expect(draft.sections[0]?.kind).toBe("chapter");
        expect(draft.content).toContain("Mashqlar");
    });

    it("supports specialized book writing flows", () => {
        const olympiadDraft = createDraftFromTemplate(getWriterTemplate("olympiad-book")!, ["theorem-pack"]);
        const problemDraft = createDraftFromTemplate(getWriterTemplate("problem-book")!);

        expect(olympiadDraft.document_kind).toBe("book");
        expect(olympiadDraft.content).toContain("Challenge ladder");
        expect(problemDraft.content).toContain("### Hint");
    });
});
