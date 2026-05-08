import React from "react";
import type { DifferentialBenchmarkSummary } from "../types";

type TrustTone = "success" | "info" | "warn";

interface TrustPanelState {
    trustScore: number;
    analyticStatus: string;
    numericalSupport: boolean;
    convergence: "convergent" | "warning" | "unknown";
    hazards: string[];
    parserNotes?: string[];
    researchReadiness?: string;
    contractStatus?: "ok" | "info" | "warn" | "error";
    benchmarkSummary?: DifferentialBenchmarkSummary | null;
}

function toneClass(tone: TrustTone) {
    if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (tone === "warn") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

export function TrustPanel({ state }: { state: TrustPanelState }) {
    const {
        trustScore,
        analyticStatus,
        numericalSupport,
        convergence,
        hazards,
        parserNotes = [],
        researchReadiness = "review",
        contractStatus = "info",
        benchmarkSummary = null,
    } = state;
    const tone: TrustTone = trustScore >= 85 ? "success" : trustScore >= 60 ? "info" : "warn";

    return (
        <div className="site-panel p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">Trust Panel</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Symbolic va numerical lane birga o&apos;qiladi. Past score bo&apos;lsa local point va expressionni qayta tekshirish kerak.
                    </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass(tone)}`}>
                    Trust {trustScore}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Analytic lane</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{analyticStatus}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Convergence</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{convergence}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Numerical support</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{numericalSupport ? "Available" : "Missing"}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Hazards</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{hazards.length}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Research readiness</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{researchReadiness}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Contract</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{contractStatus}</div>
                </div>
            </div>

            {benchmarkSummary ? (
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Benchmark confidence</div>
                    <div className="mt-2 text-sm font-bold text-foreground">
                        {benchmarkSummary.label} · {benchmarkSummary.status}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Expected {benchmarkSummary.expectedValue}, actual {benchmarkSummary.actualValue}.
                        {benchmarkSummary.absoluteError !== null ? ` Error ${benchmarkSummary.absoluteError.toExponential(2)}.` : ""}
                    </div>
                </div>
            ) : null}

            <div className="space-y-3">
                {hazards.length ? hazards.map((hazard) => (
                    <div key={hazard} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-200">
                        {hazard}
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                        Hozircha keskin hazard ko&apos;rinmadi. Differential lane lokal ravishda barqaror.
                    </div>
                )}
            </div>

            {parserNotes.length ? (
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
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
