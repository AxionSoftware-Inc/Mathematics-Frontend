import React from "react";
import { INTEGRAL_PRESETS, INTEGRAL_WORKFLOW_TEMPLATES } from "../constants";

interface TemplateCommandBarProps {
    activeTemplateId: string | null;
    activePresetLabel?: string;
    applyWorkflowTemplate: (id: string) => void;
    applyPreset: (preset: (typeof INTEGRAL_PRESETS)[number]) => void;
}

export function TemplateCommandBar({
    activeTemplateId,
    activePresetLabel,
    applyWorkflowTemplate,
    applyPreset,
}: TemplateCommandBarProps) {
    return (
        <div className="site-panel p-4 space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr]">
                <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Workflow Templates</div>
                    <div className="flex flex-wrap gap-2">
                        {INTEGRAL_WORKFLOW_TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => applyWorkflowTemplate(template.id)}
                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                                    activeTemplateId === template.id
                                        ? "border-accent/40 bg-accent text-white shadow-lg shadow-accent/20"
                                        : "border-border/60 bg-background/70 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                                }`}
                                title={template.description}
                            >
                                {template.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Presets</div>
                    <div className="flex flex-wrap gap-2">
                        {INTEGRAL_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                                    activePresetLabel === preset.label
                                        ? "border-foreground bg-foreground text-background shadow-lg shadow-slate-900/10"
                                        : "border-border/60 bg-background/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                                }`}
                                title={preset.expr}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
