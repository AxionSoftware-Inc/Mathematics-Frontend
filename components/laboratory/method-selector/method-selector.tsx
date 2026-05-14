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
    status?: "active" | "adapter" | "planned" | "implemented" | "code-ready" | "experimental" | "locked";
    backendAdapter?: string | null;
    fallbackReason?: string;
    benchmarkTest?: string;
    bestFor?: string[];
    parameters?: string[];
    limitations?: string[];
    commandExamples?: string[];
    proofChecks?: string[];
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
    implemented: "implemented",
    "code-ready": "code-ready",
    experimental: "experimental",
    locked: "locked",
};

const statusTone: Record<NonNullable<LaboratoryMethodOption["status"]>, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    adapter: "border-sky-500/30 bg-sky-500/10 text-sky-700",
    planned: "border-muted-foreground/25 bg-muted/60 text-muted-foreground",
    implemented: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    "code-ready": "border-sky-500/30 bg-sky-500/10 text-sky-700",
    experimental: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    locked: "border-muted-foreground/25 bg-muted/60 text-muted-foreground",
};

export function MethodSelector({ title = "Method", value, options, onChange }: MethodSelectorProps) {
    const selected = options.find((option) => option.id === value);
    return (
        <div className="site-panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Method Selector</div>
                    <h3 className="mt-1 text-base font-black tracking-tight">{title}</h3>
                </div>
                <Sigma className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {options.map((option) => {
                    const active = option.id === value;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChange(option.id)}
                            title={option.description}
                            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                active
                                    ? "border-[var(--accent)]/45 bg-[var(--accent-soft)]"
                                    : "border-border/70 bg-background/60 hover:bg-muted/50"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-black">{option.label}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${familyTone[option.family]}`}>{option.family}</span>
                                        {option.status ? <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${statusTone[option.status]}`}>{statusLabel[option.status]}</span> : null}
                                    </div>
                                </div>
                                {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent)]" /> : null}
                            </div>
                        </button>
                    );
                })}
            </div>
            {selected ? (
                <div className="mt-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    <span className="font-bold text-foreground">{selected.engine || "Method"}:</span> {selected.description}
                    <div className="mt-2 grid gap-1 text-[11px]">
                        <div>Contract: {selected.status ? statusLabel[selected.status] : "experimental"}</div>
                        <div>Adapter: {selected.backendAdapter || (selected.status === "active" || selected.status === "implemented" ? "direct backend" : "fallback/code contract")}</div>
                        {selected.fallbackReason ? <div>Fallback: {selected.fallbackReason}</div> : null}
                        {selected.benchmarkTest ? <div>Benchmark: {selected.benchmarkTest}</div> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
