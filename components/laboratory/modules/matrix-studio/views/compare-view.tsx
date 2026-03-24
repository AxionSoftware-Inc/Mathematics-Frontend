import type { MatrixStudioState } from "../types";

export function CompareView({ state }: { state: MatrixStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Method Compare</div>
                <div className="mt-4 space-y-3">
                    {state.compareNotes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm font-semibold text-foreground">
                            {note}
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Audit Snapshot</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <AuditCard label="Method" value={state.analyticSolution?.exact.method_label ?? "pending"} />
                    <AuditCard label="Condition cue" value={state.summary.conditionLabel ?? "pending"} />
                    <AuditCard label="Condition number" value={state.summary.conditionNumber ?? "pending"} />
                    <AuditCard label="Diagonalizable" value={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"} />
                    <AuditCard label="Spectral radius" value={state.summary.spectralRadius ?? "pending"} />
                    <AuditCard label="Residual norm" value={state.summary.residualNorm ?? "pending"} />
                    <AuditCard label="Solver kind" value={state.summary.solverKind ?? "pending"} />
                    <AuditCard label="Iterative" value={state.summary.iterativeSummary ?? "pending"} />
                    <AuditCard label="SVD" value={state.summary.svdSummary ?? "pending"} />
                    <AuditCard label="Sparse" value={state.summary.sparseSummary ?? "pending"} />
                    <AuditCard label="Tensor shape" value={state.summary.tensorShape ?? "pending"} />
                    <AuditCard label="Mode ranks" value={state.summary.modeRanks?.join(", ") ?? "pending"} />
                    <AuditCard label="Tensor product" value={state.summary.tensorProductSummary ?? "pending"} />
                    <AuditCard label="Tucker" value={state.summary.tuckerSummary ?? "pending"} />
                    <AuditCard label="CP probe" value={state.summary.cpSummary ?? "pending"} />
                    <AuditCard label="Tensor eigen" value={state.summary.tensorEigenSummary ?? "pending"} />
                </div>
                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm leading-6 text-muted-foreground">
                    LU / QR / SVD compare, sparse vs dense audit, tensor mode unfolding ranks va contraction benchmark shu tabda bir joyga yig'iladi.
                </div>
            </div>
        </div>
    );
}

function AuditCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-sm font-black text-foreground">{value}</div>
        </div>
    );
}
