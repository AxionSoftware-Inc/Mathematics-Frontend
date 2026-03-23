import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { IntegralExperienceLevel, IntegralWorkspaceTab } from "../types";

type HeaderTab = {
    id: IntegralWorkspaceTab;
    label: string;
};

type WorkflowTemplate = {
    id: string;
    title: string;
    description: string;
};

type ProblemPreset = {
    label: string;
    mode: string;
    expr: string;
};

type StudioHeaderBarProps = {
    activeTab: IntegralWorkspaceTab;
    setActiveTab: (tab: IntegralWorkspaceTab) => void;
    availableTabs: readonly IntegralWorkspaceTab[];
    tabs: readonly HeaderTab[];
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: IntegralExperienceLevel;
    setExperienceLevel: (value: IntegralExperienceLevel) => void;
    workflowTemplates: readonly WorkflowTemplate[];
    activeTemplateId: string | null;
    applyWorkflowTemplate: (id: string) => void;
    presets: readonly ProblemPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: ProblemPreset) => void;
    presetDescriptions: Record<string, string>;
};

export function StudioHeaderBar({
    activeTab,
    setActiveTab,
    availableTabs,
    tabs,
    templatesOpen,
    setTemplatesOpen,
    experienceLevel,
    setExperienceLevel,
    workflowTemplates,
    activeTemplateId,
    applyWorkflowTemplate,
    presets,
    activePresetLabel,
    applyPreset,
    presetDescriptions,
}: StudioHeaderBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Link
                    href="/laboratory"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                    Integral
                </div>
            </div>
            <div className="relative flex flex-wrap items-center gap-2 rounded-2xl border border-divider/40 bg-background/70 p-1">
                {tabs.filter((tab) => availableTabs.includes(tab.id)).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}
                    >
                        {tab.label}
                    </button>
                ))}
                <div className="mx-2 h-4 w-px bg-divider/40" />
                <button
                    type="button"
                    onClick={() => setTemplatesOpen((current) => !current)}
                    className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${templatesOpen ? "bg-accent text-white shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}
                >
                    Problem Templates
                </button>
                <div className="ml-auto">
                    <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value as IntegralExperienceLevel)}
                        className="h-10 rounded-xl border border-border/60 bg-background px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none transition-colors hover:border-accent/30 focus:border-accent"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced</option>
                        <option value="research">Research</option>
                    </select>
                </div>

                {templatesOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(720px,90vw)] rounded-3xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur">
                        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.35fr]">
                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Workflow Templates</div>
                                <div className="grid gap-2">
                                    {workflowTemplates.map((template) => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => {
                                                applyWorkflowTemplate(template.id);
                                                setTemplatesOpen(false);
                                            }}
                                            className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                                activeTemplateId === template.id
                                                    ? "border-accent/40 bg-accent/10"
                                                    : "border-border/60 bg-background/70 hover:border-accent/30 hover:bg-accent/5"
                                            }`}
                                        >
                                            <div className="text-[11px] font-black tracking-tight text-foreground">{template.title}</div>
                                            <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{template.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Presets</div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                applyPreset(preset);
                                                setTemplatesOpen(false);
                                            }}
                                            className={`rounded-2xl border p-3 text-left transition-all ${
                                                activePresetLabel === preset.label
                                                    ? "border-foreground/20 bg-foreground text-background"
                                                    : "border-border/60 bg-background/70 hover:border-foreground/20 hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className={`text-[10px] font-black uppercase tracking-[0.14em] ${activePresetLabel === preset.label ? "text-background/80" : "text-muted-foreground"}`}>
                                                {preset.mode}
                                            </div>
                                            <div className={`mt-2 text-sm font-black ${activePresetLabel === preset.label ? "text-background" : "text-foreground"}`}>
                                                {preset.label}
                                            </div>
                                            <div className={`mt-1 text-[10px] leading-5 ${activePresetLabel === preset.label ? "text-background/75" : "text-muted-foreground"}`}>
                                                {presetDescriptions[preset.label] || preset.expr}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
