import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MATRIX_WORKFLOW_TABS } from "../constants";
import type { MatrixExperienceLevel, MatrixPreset, MatrixWorkspaceTab } from "../types";

type Props = {
    activeTab: MatrixWorkspaceTab;
    setActiveTab: (tab: MatrixWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: MatrixExperienceLevel;
    setExperienceLevel: (value: MatrixExperienceLevel) => void;
    presets: readonly MatrixPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: MatrixPreset) => void;
};

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
}: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
                <Link
                    href="/laboratory"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                    Matrix
                </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-2 rounded-2xl border border-divider/40 bg-background/70 p-1">
                {MATRIX_WORKFLOW_TABS.map((tab) => (
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
                        onChange={(e) => setExperienceLevel(e.target.value as MatrixExperienceLevel)}
                        className="h-10 rounded-xl border border-border/60 bg-background px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none transition-colors hover:border-accent/30 focus:border-accent"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced</option>
                        <option value="research">Research</option>
                    </select>
                </div>

                {templatesOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(560px,92vw)] rounded-3xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Matrix Launchpad</div>
                                <div className="mt-1 text-xs text-muted-foreground">Starter oilalar va keyingi solver family roadmapi.</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTemplatesOpen(false)}
                                className="rounded-xl border border-border/60 bg-background px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        applyPreset(preset);
                                        setTemplatesOpen(false);
                                    }}
                                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                        activePresetLabel === preset.label
                                            ? "border-foreground/20 bg-foreground text-background"
                                            : "border-border/60 bg-background/70 hover:border-foreground/20 hover:bg-muted/30"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className={`text-sm font-black ${activePresetLabel === preset.label ? "text-background" : "text-foreground"}`}>
                                            {preset.label}
                                        </div>
                                        <div className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                                            activePresetLabel === preset.label
                                                ? "border-background/20 text-background/80"
                                                : "border-border/60 text-muted-foreground"
                                        }`}>
                                            {preset.mode}
                                        </div>
                                    </div>
                                    <div className={`mt-2 text-xs leading-5 ${activePresetLabel === preset.label ? "text-background/80" : "text-muted-foreground"}`}>
                                        {preset.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
