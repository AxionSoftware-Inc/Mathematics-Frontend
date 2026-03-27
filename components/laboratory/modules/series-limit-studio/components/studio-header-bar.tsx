"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SERIES_LIMIT_WORKFLOW_TABS } from "../constants";
import type { SeriesLimitExperienceLevel, SeriesLimitPreset, SeriesLimitWorkspaceTab } from "../types";

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
    activeTab: SeriesLimitWorkspaceTab;
    setActiveTab: (value: SeriesLimitWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: (value: boolean) => void;
    experienceLevel: SeriesLimitExperienceLevel;
    setExperienceLevel: (value: SeriesLimitExperienceLevel) => void;
    presets: readonly SeriesLimitPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: SeriesLimitPreset) => void;
}) {
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
                    Series / Limit
                </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-2 rounded-2xl border border-divider/40 bg-background/70 p-1">
                {SERIES_LIMIT_WORKFLOW_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-muted/50"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <div className="mx-2 h-4 w-px bg-divider/40" />
                <button
                    type="button"
                    onClick={() => setTemplatesOpen(!templatesOpen)}
                    className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        templatesOpen ? "bg-accent text-white shadow-md" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                >
                    Problem Templates
                </button>
                <div className="ml-auto">
                    <select
                        value={experienceLevel}
                        onChange={(event) => setExperienceLevel(event.target.value as SeriesLimitExperienceLevel)}
                        className="h-10 rounded-xl border border-border/60 bg-background px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none transition focus:border-accent"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced</option>
                        <option value="research">Research</option>
                    </select>
                </div>

                {templatesOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(720px,94vw)] rounded-3xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Template Launchpad</div>
                                <div className="mt-1 text-xs text-muted-foreground">Series, limits va research presetlar tez tanlanadi.</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTemplatesOpen(false)}
                                className="rounded-xl border border-border/60 bg-background px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        applyPreset(preset);
                                        setTemplatesOpen(false);
                                    }}
                                    className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                                        activePresetLabel === preset.label ? "border-foreground/20 bg-foreground text-background" : "border-border/60 bg-muted/10 hover:border-accent/40"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className={`text-sm font-black ${activePresetLabel === preset.label ? "text-background" : "text-foreground"}`}>{preset.label}</div>
                                        {activePresetLabel === preset.label ? (
                                            <div className="rounded-full border border-background/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-background/80">
                                                Active
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className={`mt-1 line-clamp-3 text-xs leading-5 ${activePresetLabel === preset.label ? "text-background/80" : "text-muted-foreground"}`}>{preset.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
