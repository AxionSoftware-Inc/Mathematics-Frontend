import React from "react";

import type { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import type { IntegralBenchmarkSummary } from "../types";

interface TrustPanelProps {
    solverStatusText: string;
    warningSignals: LaboratorySignal[];
    visibleWarnings: LaboratorySignal[];
    parserNotes: string[];
    researchReadiness: string;
    researchRisk: "low" | "medium" | "high";
    exactnessTier: string;
    blockerCount: number;
    benchmarkSummary: IntegralBenchmarkSummary | null;
}

export function TrustPanel({
    solverStatusText,
    warningSignals,
    visibleWarnings,
    parserNotes,
    researchReadiness,
    researchRisk,
    exactnessTier,
    blockerCount,
    benchmarkSummary,
}: TrustPanelProps) {
    return (
        <div className="site-panel p-6">
            <div className="site-eyebrow text-accent">Trust Panel</div>
            <div className="mt-2 text-lg font-black text-foreground">Validation, solver va research contract holati</div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Solver state</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{solverStatusText}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Warnings</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{warningSignals.length}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Research readiness</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{researchReadiness}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Risk / blockers</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{researchRisk} · {blockerCount}</div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Exactness tier</div>
                <div className="mt-2 text-sm leading-7 text-muted-foreground">{exactnessTier}</div>
            </div>

            {benchmarkSummary ? (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Benchmark confidence</div>
                    <div className="mt-2 text-sm font-bold text-foreground">
                        {benchmarkSummary.label} · {benchmarkSummary.status === "verified" ? "verified" : "review"}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Expected {benchmarkSummary.expectedValue}, actual {benchmarkSummary.actualValue}.
                        {benchmarkSummary.absoluteError !== null ? ` Error ${benchmarkSummary.absoluteError.toExponential(2)}.` : ""}
                    </div>
                </div>
            ) : null}

            <div className="mt-4 space-y-3">
                {visibleWarnings.length ? visibleWarnings.map((item) => (
                    <div key={`${item.label}-${item.text}`} className="rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{item.label}</div>
                        <div className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</div>
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                        Hozircha keskin warning yo&apos;q. Solver oqimi tinch ko&apos;rinmoqda.
                    </div>
                )}
            </div>

            {parserNotes.length ? (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Parser notes</div>
                    <ul className="mt-2 space-y-1 text-sm leading-7 text-muted-foreground">
                        {parserNotes.slice(0, 3).map((note) => (
                            <li key={note}>{note}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
