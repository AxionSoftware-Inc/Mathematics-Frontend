"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, LayoutTemplate } from "lucide-react";

type HeaderTab = {
    id: string;
    label: string;
};

type TemplateItem = {
    id: string;
    title: string;
    description: string;
    badge?: string;
    meta?: string;
    recommended?: boolean;
    active?: boolean;
    onSelect: () => void;
};

type TemplateSection = {
    id: string;
    title: string;
    items: TemplateItem[];
};

export function LaboratoryStudioHeader({
    moduleLabel,
    tabs,
    activeTab,
    setActiveTab,
    experienceLevel,
    setExperienceLevel,
    templatesOpen,
    onToggleTemplates,
    onCloseTemplates,
    templateSections,
}: {
    moduleLabel: string;
    tabs: readonly HeaderTab[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    experienceLevel: string;
    setExperienceLevel: (level: string) => void;
    templatesOpen: boolean;
    onToggleTemplates: () => void;
    onCloseTemplates: () => void;
    templateSections: TemplateSection[];
}) {
    const shellRef = React.useRef<HTMLDivElement | null>(null);
    const totalTemplates = templateSections.reduce((sum, section) => sum + section.items.length, 0);
    const widthClass =
        totalTemplates <= 6
            ? "w-[min(560px,92vw)]"
            : totalTemplates <= 10
              ? "w-[min(720px,94vw)]"
              : "w-[min(920px,96vw)]";
    const gridClass =
        totalTemplates <= 6
            ? "sm:grid-cols-2"
            : totalTemplates <= 10
              ? "sm:grid-cols-2 xl:grid-cols-3"
              : "sm:grid-cols-2 xl:grid-cols-4";

    React.useEffect(() => {
        if (!templatesOpen) {
            return;
        }

        function handlePointerDown(event: MouseEvent) {
            if (!shellRef.current?.contains(event.target as Node)) {
                onCloseTemplates();
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCloseTemplates();
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onCloseTemplates, templatesOpen]);

    return (
        <div ref={shellRef} className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
                <Link
                    href="/laboratory"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
                    {moduleLabel}
                </div>
            </div>

            <div className="relative flex flex-1 flex-wrap items-center gap-2 rounded-2xl border border-divider/40 bg-background/70 p-1 lg:flex-none">
                {tabs.map((tab) => (
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

                <div className="mx-1 hidden h-4 w-px bg-divider/40 sm:block" />

                <button
                    type="button"
                    onClick={onToggleTemplates}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        templatesOpen ? "bg-accent text-white shadow-md" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Templates
                    <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px]">{totalTemplates}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${templatesOpen ? "rotate-180" : ""}`} />
                </button>

                <div className="ml-auto">
                    <select
                        value={experienceLevel}
                        onChange={(event) => setExperienceLevel(event.target.value)}
                        className="h-10 rounded-xl border border-border/60 bg-background px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none transition-colors hover:border-accent/30 focus:border-accent"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced</option>
                        <option value="research">Research</option>
                    </select>
                </div>
            </div>

            {templatesOpen ? (
                <div className={`absolute right-4 top-[calc(100%+12px)] z-30 rounded-3xl border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur lg:right-6 ${widthClass}`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Template Launchpad</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                Compact preset panel. Tashqarini bosing yoki `Esc` orqali yopiladi.
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onCloseTemplates}
                            className="rounded-xl border border-border/60 bg-background px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                        >
                            Close
                        </button>
                    </div>

                    <div className="space-y-4">
                        {templateSections.map((section) => (
                            <div key={section.id} className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                                        {section.title}
                                    </div>
                                    <div className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                        {section.items.length}
                                    </div>
                                </div>
                                <div className={`grid gap-2 ${gridClass}`}>
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                item.onSelect();
                                                onCloseTemplates();
                                            }}
                                            className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                                item.active
                                                    ? "border-accent/40 bg-accent/10"
                                                    : "border-border/60 bg-background/70 hover:border-accent/30 hover:bg-accent/5"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="min-w-0 text-sm font-black text-foreground">{item.title}</div>
                                                    {(item.meta || item.recommended) ? (
                                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                                            {item.meta ? (
                                                                <div className="rounded-full border border-border/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                                                    {item.meta}
                                                                </div>
                                                            ) : null}
                                                            {item.recommended ? (
                                                                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-600">
                                                                    Recommended
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                {item.badge ? (
                                                    <div className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                                        {item.badge}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
