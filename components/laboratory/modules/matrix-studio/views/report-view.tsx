import type { MatrixStudioState } from "../types";

export function ReportView({ state }: { state: MatrixStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Research Packet Skeleton</div>
                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-foreground">
{`# Matrix Studio Report

mode: ${state.mode}
dimension: ${state.dimension}
determinant: ${state.summary.determinant ?? "pending"}
trace: ${state.summary.trace ?? "pending"}
rank: ${state.summary.rank ?? "pending"}
method: ${state.analyticSolution?.exact.method_label ?? "pending"}
condition_number: ${state.summary.conditionNumber ?? "pending"}
diagonalizable: ${state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"}
spectral_radius: ${state.summary.spectralRadius ?? "pending"}
residual_norm: ${state.summary.residualNorm ?? "pending"}
decomposition: ${state.summary.decompositionSummary ?? "pending"}
solver_kind: ${state.summary.solverKind ?? "pending"}
iterative: ${state.summary.iterativeSummary ?? "pending"}
svd: ${state.summary.svdSummary ?? "pending"}
sparse: ${state.summary.sparseSummary ?? "pending"}
tensor_shape: ${state.summary.tensorShape ?? "pending"}
mode_ranks: ${state.summary.modeRanks?.join(", ") ?? "pending"}
tensor_product: ${state.summary.tensorProductSummary ?? "pending"}
tucker: ${state.summary.tuckerSummary ?? "pending"}
cp_probe: ${state.summary.cpSummary ?? "pending"}
tensor_eigen: ${state.summary.tensorEigenSummary ?? "pending"}

## planned sections
- matrix/tensor family and dimension snapshot
- structural audit and conditioning interpretation
- decomposition or contraction lane notes
- sparse profile and solver roadmap`}
                    </pre>
                </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Next Export Layers</div>
                <div className="mt-4 space-y-3">
                    {state.reportNotes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm font-semibold text-foreground">
                            {note}
                        </div>
                    ))}
                    {state.analyticSolution?.exact.auxiliary_latex ? (
                        <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 font-mono text-xs text-foreground">
                            {state.analyticSolution.exact.auxiliary_latex}
                        </div>
                    ) : null}
                    {state.analyticSolution?.exact.steps?.length ? (
                        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Trace Headlines</div>
                            <div className="mt-3 space-y-2">
                                {state.analyticSolution.exact.steps.slice(0, 5).map((step) => (
                                    <div key={step.title} className="text-sm text-foreground">
                                        <span className="font-black">{step.title}:</span> {step.summary}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
