import type { SeriesLimitStudioState } from "../types";
import { AnnotationPanel } from "../components/annotation-panel";

export function ReportView({ state }: { state: SeriesLimitStudioState }) {
    return (
        <div className="space-y-4">
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
                        {`# Series / Limit Report
- mode: ${state.mode}
- family: ${state.summary.detectedFamily ?? "pending"}
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- convergence: ${state.summary.convergenceSignal ?? state.summary.radiusSignal ?? "pending"}
- test family: ${state.summary.testFamily ?? "pending"}
- secondary test: ${state.summary.secondaryTestFamily ?? "pending"}
- asymptotic class: ${state.summary.asymptoticClass ?? "pending"}
- proof signal: ${state.summary.proofSignal ?? "pending"}
- endpoint notes: ${state.summary.endpointSignal ?? "pending"}
- risk: ${state.summary.riskSignal ?? "pending"}`}
                    </div>
                </div>
            </div>

            <AnnotationPanel {...state.annotationPanelProps} />
        </div>
    );
}
