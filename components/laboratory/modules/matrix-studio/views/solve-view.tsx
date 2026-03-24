import { SolverControl } from "../components/solver-control";
import type { MatrixStudioState } from "../types";

export function SolveView({
    state,
    actions,
}: {
    state: MatrixStudioState;
    actions: {
        setMode: (value: MatrixStudioState["mode"]) => void;
        setMatrixExpression: (value: string) => void;
        setRhsExpression: (value: string) => void;
        setDimension: (value: string) => void;
    };
}) {
    return (
        <div className="space-y-4">
            <SolverControl
                mode={state.mode}
                setMode={actions.setMode}
                matrixExpression={state.matrixExpression}
                setMatrixExpression={actions.setMatrixExpression}
                rhsExpression={state.rhsExpression}
                setRhsExpression={actions.setRhsExpression}
                dimension={state.dimension}
                setDimension={actions.setDimension}
                experienceLevel={state.experienceLevel}
                activePresetLabel={state.activePresetLabel}
            />

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Result Synthesis</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MetricCard label="Determinant" value={state.summary.determinant ?? "pending"} />
                        <MetricCard label="Trace" value={state.summary.trace ?? "pending"} />
                        <MetricCard label="Rank" value={state.summary.rank ?? "pending"} />
                        <MetricCard label="Inverse" value={state.summary.inverseAvailable ? "available" : "not ready"} />
                        <MetricCard label="Condition" value={state.summary.conditionNumber ?? "pending"} />
                        <MetricCard label="Pivots" value={state.summary.pivotColumns?.length ? state.summary.pivotColumns.join(", ") : "pending"} />
                        <MetricCard label="Spectral Radius" value={state.summary.spectralRadius ?? "pending"} />
                        <MetricCard label="Residual Norm" value={state.summary.residualNorm ?? "pending"} />
                        <MetricCard label="Iterative" value={state.summary.iterativeSummary ?? "pending"} />
                        <MetricCard label="SVD" value={state.summary.svdSummary ?? "pending"} />
                        <MetricCard label="Sparse" value={state.summary.sparseSummary ?? "pending"} />
                        <MetricCard label="Tensor Shape" value={state.summary.tensorShape ?? "pending"} />
                        <MetricCard label="Mode Ranks" value={state.summary.modeRanks?.join(", ") ?? "pending"} />
                        <MetricCard label="Tensor Product" value={state.summary.tensorProductSummary ?? "pending"} />
                        <MetricCard label="Tucker" value={state.summary.tuckerSummary ?? "pending"} />
                        <MetricCard label="CP Probe" value={state.summary.cpSummary ?? "pending"} />
                        <MetricCard label="Tensor Eigen" value={state.summary.tensorEigenSummary ?? "pending"} />
                    </div>
                    {state.analyticSolution?.exact.result_latex ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Primary Result</div>
                            <div className="mt-2 overflow-x-auto font-mono text-sm text-foreground">{state.analyticSolution.exact.result_latex}</div>
                            {state.analyticSolution.exact.auxiliary_latex ? (
                                <div className="mt-3 overflow-x-auto font-mono text-xs text-muted-foreground">{state.analyticSolution.exact.auxiliary_latex}</div>
                            ) : null}
                        </div>
                    ) : null}
                    {state.solveErrorMessage ? (
                        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                            {state.solveErrorMessage}
                        </div>
                    ) : null}
                </div>

                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Method Trace</div>
                    <div className="mt-4 space-y-3">
                        {(state.analyticSolution?.exact.steps ?? []).map((step) => (
                            <div key={step.title} className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                                <div className="text-sm font-black text-foreground">{step.title}</div>
                                <div className="mt-1 text-sm leading-6 text-muted-foreground">{step.summary}</div>
                                {step.latex ? <div className="mt-3 overflow-x-auto font-mono text-xs text-foreground">{step.latex}</div> : null}
                            </div>
                        ))}
                        {!state.analyticSolution ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-sm leading-6 text-muted-foreground">
                                Matrix lane auto-solve tayyor. Determinant, systems, decomposition va transform oilalari shu blokda symbolic trace bilan ko‘rinadi.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {state.mode === "decomposition" ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Spectral Audit</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <MetricCard label="Spectrum" value={state.summary.eigenSummary ?? "pending"} />
                        <MetricCard label="Diagonalizable" value={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"} />
                        <MetricCard label="Spectral Radius" value={state.summary.spectralRadius ?? "pending"} />
                        <MetricCard label="Factorizations" value={state.summary.decompositionSummary ?? "pending"} />
                    </div>
                    {state.summary.svdSummary ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">
                            <span className="font-black">Singular values:</span> {state.summary.svdSummary}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {state.mode === "tensor" ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Audit</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <MetricCard label="Tensor Order" value={state.summary.tensorOrder ? String(state.summary.tensorOrder) : "pending"} />
                        <MetricCard label="Tensor Shape" value={state.summary.tensorShape ?? "pending"} />
                        <MetricCard label="Mode Ranks" value={state.summary.modeRanks?.join(" / ") ?? "pending"} />
                        <MetricCard label="Contraction" value={state.summary.contractionSummary ?? "pending"} />
                        <MetricCard label="Tensor Product" value={state.summary.tensorProductSummary ?? "pending"} />
                        <MetricCard label="Tucker" value={state.summary.tuckerSummary ?? "pending"} />
                        <MetricCard label="CP Probe" value={state.summary.cpSummary ?? "pending"} />
                        <MetricCard label="Tensor Eigen" value={state.summary.tensorEigenSummary ?? "pending"} />
                    </div>
                    {state.summary.tensorSummary ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">
                            {state.summary.tensorSummary}
                        </div>
                    ) : null}
                    {state.summary.contractionDetails?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {state.summary.contractionDetails.map((detail) => (
                                <div key={detail} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {state.summary.modeSingularSummaries?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {state.summary.modeSingularSummaries.map((detail) => (
                                <div key={detail} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {state.summary.tuckerFactorSummaries?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {state.summary.tuckerFactorSummaries.map((detail) => (
                                <div key={detail} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {state.summary.cpFactorSummaries?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {state.summary.cpFactorSummaries.map((detail) => (
                                <div key={detail} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">{value}</div>
        </div>
    );
}
