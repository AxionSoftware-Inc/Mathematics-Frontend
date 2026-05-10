"use client";

import React from "react";
import { CheckCircle2, Sigma } from "lucide-react";

export type LaboratoryMethodOption = {
    id: string;
    label: string;
    family: "analytic" | "numeric" | "hybrid";
    description: string;
    detail: string;
    engine?: string;
    status?: "active" | "adapter" | "planned";
    bestFor?: string[];
    parameters?: string[];
    limitations?: string[];
};

type MethodSelectorProps = {
    title?: string;
    value: string;
    options: LaboratoryMethodOption[];
    onChange: (value: string) => void;
};

const familyTone: Record<LaboratoryMethodOption["family"], string> = {
    analytic: "text-emerald-600",
    numeric: "text-sky-600",
    hybrid: "text-amber-600",
};

const statusLabel: Record<NonNullable<LaboratoryMethodOption["status"]>, string> = {
    active: "active",
    adapter: "code-ready",
    planned: "planned",
};

const statusTone: Record<NonNullable<LaboratoryMethodOption["status"]>, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    adapter: "border-sky-500/30 bg-sky-500/10 text-sky-700",
    planned: "border-muted-foreground/25 bg-muted/60 text-muted-foreground",
};

function MethodChips({ label, items }: { label: string; items?: string[] }) {
    if (!items?.length) return null;
    return (
        <div className="mt-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((item) => (
                    <span key={item} className="rounded-md border border-border/70 bg-background/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function MethodSelector({ title = "Method", value, options, onChange }: MethodSelectorProps) {
    return (
        <div className="site-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Method Selector</div>
                    <h3 className="mt-1 text-lg font-black tracking-tight">{title}</h3>
                </div>
                <Sigma className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid gap-3">
                {options.map((option) => {
                    const active = option.id === value;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChange(option.id)}
                            className={`rounded-2xl border p-4 text-left transition-colors ${
                                active
                                    ? "border-[var(--accent)]/45 bg-[var(--accent-soft)]"
                                    : "border-border/70 bg-background/60 hover:bg-muted/50"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-black">{option.label}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${familyTone[option.family]}`}>
                                            {option.family}
                                        </span>
                                        {option.engine ? (
                                            <span className="rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                                                {option.engine}
                                            </span>
                                        ) : null}
                                        {option.status ? (
                                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${statusTone[option.status]}`}>
                                                {statusLabel[option.status]}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground/80">{option.detail}</p>
                                    <MethodChips label="Best for" items={option.bestFor} />
                                    <MethodChips label="Parameters" items={option.parameters} />
                                    <MethodChips label="Limitations" items={option.limitations} />
                                </div>
                                {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent)]" /> : null}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
