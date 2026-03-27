import type { SeriesLimitStudioState } from "../types";
import { AnnotationPanel } from "../components/annotation-panel";

export function ReportView({ state }: { state: SeriesLimitStudioState }) {
    const reportBody = `# Series / Limit Research Report

## Problem Statement
- mode: ${state.mode}
- expression: ${state.expression}
- auxiliary: ${state.auxiliaryExpression || "none"}
- dimension: ${state.dimension}

## Classification
- family: ${state.summary.detectedFamily ?? "pending"}
- shape: ${state.summary.shape ?? "pending"}
- asymptotic class: ${state.summary.asymptoticClass ?? "pending"}
- dominant term: ${state.summary.dominantTerm ?? "pending"}

## Main Result
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- convergence: ${state.summary.convergenceSignal ?? state.summary.radiusSignal ?? "pending"}
- partial sum signal: ${state.summary.partialSumSignal ?? "pending"}
- interval signal: ${state.summary.intervalSignal ?? state.summary.asymptoticSignal ?? "pending"}
- error bound: ${state.summary.errorBoundSignal ?? "pending"}
- special family: ${state.summary.specialFamilySignal ?? "pending"}

## Proof Architecture
- primary test: ${state.summary.testFamily ?? "pending"}
- secondary test: ${state.summary.secondaryTestFamily ?? "pending"}
- proof signal: ${state.summary.proofSignal ?? "pending"}
- comparison signal: ${state.summary.comparisonSignal ?? "pending"}

## Endpoint / Tail Audit
- endpoint signal: ${state.summary.endpointSignal ?? "pending"}
- endpoint details: ${(state.summary.endpointDetails ?? ["pending"]).join(" | ")}
- monotonicity: ${state.summary.monotonicity ?? "pending"}
- boundedness: ${state.summary.boundedness ?? "pending"}

## Diagnostics
- expansion: ${state.summary.expansionSignal ?? "pending"}
- risk: ${state.summary.riskSignal ?? "pending"}
- method: ${state.analyticSolution?.exact.method_label ?? "client-side preview"}
`;
    const abstractText =
        state.mode === "limits"
            ? `${state.summary.detectedFamily ?? "This limit"} was analyzed through ${state.summary.specialFamilySignal ?? "a symbolic"} lane. The current limit is ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}, with local risk signal ${state.summary.riskSignal ?? "pending"} and error proxy ${state.summary.errorBoundSignal ?? "pending"}.`
            : `${state.summary.detectedFamily ?? "This lane"} was analyzed in ${state.mode} mode. The current result is ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}, supported by ${state.summary.testFamily ?? "pending"} with ${state.summary.secondaryTestFamily ?? "pending"} as a backup lane. Risk remains ${state.summary.riskSignal ?? "pending"}.`;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Executive Report</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {state.reportNotes.map((note) => (
                            <div key={note} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                {note}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Submission Abstract</div>
                    <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm leading-7 text-foreground">
                        {abstractText}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Research Skeleton</div>
                    <div className="rounded-full border border-border/60 bg-muted/10 px-3 py-1 text-xs text-muted-foreground">
                        notebook-ready outline
                    </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-muted/10 p-4 font-mono text-sm leading-7 text-foreground">
                    <pre className="whitespace-pre-wrap">{reportBody}</pre>
                </div>
            </div>

            <AnnotationPanel {...state.annotationPanelProps} />
        </div>
    );
}
