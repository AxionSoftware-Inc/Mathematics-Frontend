import type { ProbabilityStudioState } from "../types";

export function ReportView({ state }: { state: ProbabilityStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Executive Report</div>
                <div className="mt-4 space-y-3">
                    {state.reportNotes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            {note}
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Research Skeleton</div>
                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 font-mono text-sm leading-7 text-foreground">
                    {`# Probability Report\n- mode: ${state.mode}\n- sample size: ${state.summary.sampleSize ?? "pending"}\n- method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}\n- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}\n- auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}\n- risk: ${state.summary.riskSignal ?? "pending"}`}
                </div>
            </div>
        </div>
    );
}
