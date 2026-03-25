import type { ProbabilityStudioState } from "../types";

export function CompareView({ state }: { state: ProbabilityStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Compare Notes</div>
                <div className="mt-4 space-y-3">
                    {state.compareNotes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            {note}
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Risk Register</div>
                <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">{state.summary.riskSignal ?? "Risk signal pending"}</div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">Primary result: {state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}</div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">Auxiliary: {state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}</div>
                    <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">Method: {state.analyticSolution?.exact.method_label ?? "client-side fallback"}</div>
                </div>
            </div>
        </div>
    );
}
