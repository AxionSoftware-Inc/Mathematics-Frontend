import React from "react";

type TrustTone = "success" | "info" | "warn";

function toneClass(tone: TrustTone) {
    if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (tone === "warn") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

export function TrustPanel({
    state,
}: {
    state: {
        trustScore: number;
        analyticStatus: string;
        numericalSupport: boolean;
        convergence: "convergent" | "warning" | "unknown";
        hazards: string[];
        parserNotes?: string[];
    };
}) {
    const tone: TrustTone = state.trustScore >= 85 ? "success" : state.trustScore >= 60 ? "info" : "warn";

    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Trust Panel</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Symbolic lane, local preview va convergence diagnostics birga o‘qiladi.
                    </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass(tone)}`}>
                    Trust {state.trustScore}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Analytic Lane" value={state.analyticStatus} />
                <Metric label="Convergence" value={state.convergence} />
                <Metric label="Numerical Support" value={state.numericalSupport ? "Available" : "Missing"} />
                <Metric label="Hazards" value={String(state.hazards.length)} />
            </div>

            <div className="space-y-3">
                {state.hazards.length ? state.hazards.map((hazard) => (
                    <div key={hazard} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-200">
                        {hazard}
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                        Hozircha keskin hazard ko‘rinmadi. Series / limit lane barqaror.
                    </div>
                )}
            </div>

            {state.parserNotes?.length ? (
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Parser notes</div>
                    <ul className="mt-2 space-y-1 text-sm leading-7 text-muted-foreground">
                        {state.parserNotes.slice(0, 4).map((note) => (
                            <li key={note}>{note}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-sm font-bold text-foreground">{value}</div>
        </div>
    );
}
