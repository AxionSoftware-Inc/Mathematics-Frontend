"use client";

export type LaboratoryWorkflowTemplateItem = {
    id: string;
    title: string;
    description: string;
};

export function LaboratoryWorkflowTemplatePanel({
    templates,
    activeTemplateId,
    onApply,
    eyebrow = "Problem Templates",
    accentClassName = "text-accent",
}: {
    templates: readonly LaboratoryWorkflowTemplateItem[];
    activeTemplateId: string | null;
    onApply: (templateId: string) => void;
    eyebrow?: string;
    accentClassName?: string;
}) {
    return (
        <div className="site-panel p-6 space-y-4">
            <div className={`site-eyebrow ${accentClassName}`}>{eyebrow}</div>
            <div className="grid gap-2">
                {templates.map((template) => (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => onApply(template.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                            activeTemplateId === template.id
                                ? "border-accent/40 bg-accent/10"
                                : "border-border/60 bg-muted/5 hover:border-accent/40 hover:bg-accent/5"
                        }`}
                    >
                        <div className="text-[11px] font-black tracking-tight text-foreground font-serif">{template.title}</div>
                        <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{template.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
