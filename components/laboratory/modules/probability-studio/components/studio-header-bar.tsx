"use client";

import { PROBABILITY_WORKFLOW_TABS } from "../constants";
import type { ProbabilityExperienceLevel, ProbabilityPreset, ProbabilityWorkspaceTab } from "../types";

export function StudioHeaderBar({
    activeTab,
    setActiveTab,
    templatesOpen,
    setTemplatesOpen,
    experienceLevel,
    setExperienceLevel,
    presets,
    activePresetLabel,
    applyPreset,
}: {
    activeTab: ProbabilityWorkspaceTab;
    setActiveTab: (value: ProbabilityWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: (value: boolean) => void;
    experienceLevel: ProbabilityExperienceLevel;
    setExperienceLevel: (value: ProbabilityExperienceLevel) => void;
    presets: readonly ProbabilityPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: ProbabilityPreset) => void;
}) {
    return (
        <div className="relative flex items-center justify-between gap-4 border-b border-border/50 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
                {PROBABILITY_WORKFLOW_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.id ? "bg-foreground text-background" : "bg-muted/20 text-foreground hover:bg-muted/35"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setTemplatesOpen(!templatesOpen)}
                    className="rounded-2xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
                >
                    Problem Templates
                </button>
                {templatesOpen ? (
                    <div className="absolute left-4 top-full z-30 mt-2 w-[520px] rounded-3xl border border-border/60 bg-background p-4 shadow-xl lg:left-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Probability Templates</div>
                        <div className="mt-4 grid gap-3">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        applyPreset(preset);
                                        setTemplatesOpen(false);
                                    }}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                                        activePresetLabel === preset.label ? "border-accent bg-accent/10" : "border-border/60 bg-muted/10 hover:border-accent/40"
                                    }`}
                                >
                                    <div className="text-sm font-black text-foreground">{preset.label}</div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{preset.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value as ProbabilityExperienceLevel)}
                className="h-10 rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
            >
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
                <option value="research">Research</option>
            </select>
        </div>
    );
}
