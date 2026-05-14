import React from "react";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySolveLayout } from "@/components/laboratory/laboratory-solve-layout";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { MatrixStudioState } from "../types";

function toNumeric(rows: string[][]): number[][] {
    return rows.map((row) =>
        row.map((entry) => {
            const value = Number(entry);
            return Number.isFinite(value) ? value : 0;
        }),
    );
}

function toNumericVector(rows: string[]): number[] {
    return rows.map((entry) => {
        const value = Number(entry);
        return Number.isFinite(value) ? value : 0;
    });
}

function formatVector(values: number[]): string {
    return `[${values.map((value) => value.toFixed(3)).join(", ")}]`;
}

function matrixTimesVector(matrix: number[][], vector: number[]): number[] | null {
    if (!matrix.length || !vector.length || matrix[0]?.length !== vector.length) {
        return null;
    }
    return matrix.map((row) => row.reduce((sum, value, index) => sum + value * (vector[index] ?? 0), 0));
}

function determinant2x2(matrix: number[][]): number | null {
    if (matrix.length !== 2 || matrix[0]?.length !== 2 || matrix[1]?.length !== 2) {
        return null;
    }
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

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
    const numericMatrix = toNumeric(state.matrixRows);
    const numericVector = toNumericVector(state.rhsRows);
    const transformedVector = matrixTimesVector(numericMatrix, numericVector);
    const planeScale = determinant2x2(numericMatrix);
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const showMethodTrace = state.experienceLevel !== "beginner";
    const showAnalyticForms = state.experienceLevel === "research";
    const [showNumericalDetails, setShowNumericalDetails] = React.useState(false);
    const matrixShape = state.summary.shape ?? (state.matrixRows.length && state.matrixRows[0]?.length ? `${state.matrixRows.length}x${state.matrixRows[0].length}` : "pending");

    const derivationContent = hasAnalytic
        ? [
              `**Lane:** ${state.analyticSolution?.exact.method_label ?? "Analytic solve"}`,
              "",
              state.analyticSolution?.exact.result_latex ? `**Final form:** ${state.analyticSolution.exact.result_latex}` : null,
              state.analyticSolution?.exact.auxiliary_latex ? `**Auxiliary form:** ${state.analyticSolution.exact.auxiliary_latex}` : null,
              state.analyticSolution?.exact.numeric_approximation ? `**Approximation:** \`${state.analyticSolution.exact.numeric_approximation}\`` : null,
          ]
              .filter(Boolean)
              .join("\n")
        : [
              `**Analytic status:** closed-form result topilmadi yoki symbolic lane javob bermadi.`,
              "",
              `**Numerical lane:** ${state.mode} rejimida matrix audit va struktur reading tayyor.`,
              "",
              `Quyidagi tugma orqali numerical interpretation step-by-step ko'rinadi.`,
          ].join("\n");

    const fallbackSteps = [
        {
            title: "Matrix Parse",
            summary: `Input matrix ${matrixShape} shaklida o'qildi va ${state.mode} oilasiga moslandi.`,
            latex: null,
            tone: "neutral" as const,
        },
        {
            title: "Structural Audit",
            summary: `Rank ${state.summary.rank ?? "pending"}, determinant ${state.summary.determinant ?? "pending"}, condition ${state.summary.conditionNumber ?? "pending"} signallari yig'ildi.`,
            latex: null,
            tone: "info" as const,
        },
        {
            title: "Numerical Reading",
            summary: state.solveErrorMessage
                ? state.solveErrorMessage
                : `Solver ${state.summary.solverKind ?? "pending"} va residual ${state.summary.residualNorm ?? "pending"} orqali numerical result talqin qilindi.`,
            latex: state.analyticSolution?.exact.numeric_approximation ?? null,
            tone: "success" as const,
        },
    ];

    const displayedSteps = hasAnalytic ? state.analyticSolution?.exact.steps ?? [] : showNumericalDetails ? fallbackSteps : [];
    const finalResultSection = (
        <div className="site-lab-card p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Result Synthesis</div>
            {state.analyticSolution?.exact.result_latex ? (
                <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Final Answer</div>
                    <MathBlock value={state.analyticSolution.exact.result_latex} className="mt-3 text-base font-semibold text-foreground" />
                    {state.analyticSolution.exact.auxiliary_latex ? (
                        <MathBlock value={state.analyticSolution.exact.auxiliary_latex} className="mt-3 text-xs text-muted-foreground" />
                    ) : null}
                </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {state.mode === "algebra" ? (
                    <>
                        <MetricCard label="Determinant" value={state.summary.determinant ?? "pending"} />
                        <MetricCard label="Trace" value={state.summary.trace ?? "pending"} />
                        <MetricCard label="Rank" value={state.summary.rank ?? "pending"} />
                        <MetricCard label="Inverse" value={state.summary.inverseAvailable ? "available" : "not ready"} />
                        <MetricCard label="Condition" value={state.summary.conditionNumber ?? "pending"} />
                        <MetricCard label="Sparse" value={state.summary.sparseSummary ?? "pending"} />
                    </>
                ) : null}
                {state.mode === "transform" ? (
                    <>
                        <MetricCard label="Determinant" value={state.summary.determinant ?? "pending"} />
                        <MetricCard label="Trace" value={state.summary.trace ?? "pending"} />
                        <MetricCard label="Rank" value={state.summary.rank ?? "pending"} />
                        <MetricCard label="Area Scale" value={state.summary.determinant ?? "pending"} />
                        <MetricCard
                            label="Orientation"
                            value={planeScale == null ? "pending" : planeScale > 0 ? "preserved" : planeScale < 0 ? "reversed" : "collapsed"}
                        />
                        <MetricCard label="T(v)" value={transformedVector ? formatVector(transformedVector) : "pending"} />
                    </>
                ) : null}
                {state.mode === "systems" ? (
                    <>
                        <MetricCard label="Rank" value={state.summary.rank ?? "pending"} />
                        <MetricCard label="Solver" value={state.summary.solverKind ?? "pending"} />
                        <MetricCard label="Residual Norm" value={state.summary.residualNorm ?? "pending"} />
                        <MetricCard label="Least Squares" value={state.summary.leastSquaresSummary ?? "pending"} />
                        <MetricCard label="Stability" value={state.summary.stabilitySummary ?? "pending"} />
                        <MetricCard label="Condition" value={state.summary.conditionNumber ?? "pending"} />
                        <MetricCard label="Pivots" value={state.summary.pivotColumns?.length ? state.summary.pivotColumns.join(", ") : "pending"} />
                        <MetricCard label="Iterative" value={state.summary.iterativeSummary ?? "pending"} />
                    </>
                ) : null}
                {state.mode === "decomposition" ? (
                    <>
                        <MetricCard label="Rank" value={state.summary.rank ?? "pending"} />
                        <MetricCard label="Spectrum" value={state.summary.eigenSummary ?? "pending"} />
                        <MetricCard label="Spectral Radius" value={state.summary.spectralRadius ?? "pending"} />
                        <MetricCard label="SVD" value={state.summary.svdSummary ?? "pending"} />
                        <MetricCard label="Factor Audit" value={state.summary.factorAuditSummary ?? "pending"} />
                        <MetricCard label="Diagonalizable" value={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"} />
                        <MetricCard label="Factorizations" value={state.summary.decompositionSummary ?? "pending"} />
                    </>
                ) : null}
                {state.mode === "tensor" ? (
                    <>
                        <MetricCard label="Tensor Shape" value={state.summary.tensorShape ?? "pending"} />
                        <MetricCard label="Tensor Order" value={state.summary.tensorOrder ? String(state.summary.tensorOrder) : "pending"} />
                        <MetricCard label="Mode Ranks" value={state.summary.modeRanks?.join(", ") ?? "pending"} />
                        <MetricCard label="Contraction" value={state.summary.contractionSummary ?? "pending"} />
                        <MetricCard label="Tensor Product" value={state.summary.tensorProductSummary ?? "pending"} />
                        <MetricCard label="Tucker" value={state.summary.tuckerSummary ?? "pending"} />
                        <MetricCard label="CP Probe" value={state.summary.cpSummary ?? "pending"} />
                        <MetricCard label="Tensor Eigen" value={state.summary.tensorEigenSummary ?? "pending"} />
                    </>
                ) : null}
            </div>
            {state.solveErrorMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    {state.solveErrorMessage}
                </div>
            ) : null}
        </div>
    );
    const methodTraceSection = (
        <div className="site-lab-card p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Method Trace</div>
            <div className="mt-4 space-y-3">
                {displayedSteps.map((step, index) => (
                    <LaboratorySolveDetailCard
                        key={`${step.title}-${index}`}
                        id={String(index + 1)}
                        action={step.title}
                        result={step.summary}
                        formula={step.latex ?? undefined}
                        tone={(step.tone as "neutral" | "info" | "success" | "warn") ?? "neutral"}
                    />
                ))}
                {!displayedSteps.length ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-sm leading-6 text-muted-foreground">
                        Matrix lane auto-solve tayyor. Analytic form topilsa step-by-step shu yerda chiqadi; aks holda numerical fallback tugmasi shu blokni ochadi.
                    </div>
                ) : null}
            </div>
        </div>
    );

    return (
        <LaboratorySolveLayout
            control={
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
            }
            visual={
                <VisualizerDeck
                        mode={state.mode}
                        matrixRows={state.matrixRows}
                        rhsRows={state.rhsRows}
                        tensorSlices={state.tensorSlices}
                        summary={state.summary}
                        analyticSolution={state.analyticSolution}
                    />
            }
            derivation={
                <div className="space-y-4">
                    <div className="site-lab-card p-5">
                        <LaboratoryMathPanel
                            eyebrow={hasAnalytic ? "Analytic Derivation" : "Numerical Fallback"}
                            title={hasAnalytic ? "Closed-form reading" : "Analytic form unavailable"}
                            content={derivationContent}
                            accentClassName={hasAnalytic ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                        />
                        {!hasAnalytic ? (
                            <button
                                type="button"
                                onClick={() => setShowNumericalDetails((current) => !current)}
                                className="mt-4 inline-flex items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
                            >
                                {showNumericalDetails ? "Hide Numerical Steps" : "Run Numerical Solution View"}
                            </button>
                        ) : null}
                    </div>

                    <div className="site-lab-card p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Visualization Notes</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {state.visualNotes.map((note) => (
                                <div key={note} className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm font-semibold text-foreground">
                                    {note}
                                </div>
                            ))}
                        </div>
                        {state.rhsRows.length ? (
                            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Probe / RHS</div>
                                <div className="mt-2 font-mono text-sm text-foreground">{state.rhsRows.join(" ; ")}</div>
                            </div>
                        ) : null}
                    </div>
                </div>
            }
            sections={[
                { id: "final-result", node: finalResultSection, weight: 3 },
                showMethodTrace ? { id: "method-trace", node: methodTraceSection, weight: 2 } : null,
                showAnalyticForms && state.analyticSolution
                    ? {
                          id: "analytic-forms",
                          node: (
                              <div className="site-lab-card p-5">
                                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Analytic Forms</div>
                                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                                      <FormulaCard label="Parsed Input" value={state.analyticSolution.parser.expression_latex || state.analyticSolution.parser.expression_raw} />
                                      <FormulaCard label="Final Formula" value={state.analyticSolution.exact.result_latex ?? "pending"} />
                                      <FormulaCard label="Auxiliary Formula" value={state.analyticSolution.exact.auxiliary_latex ?? "pending"} />
                                  </div>
                              </div>
                          ),
                          weight: 2,
                      }
                    : null,
                state.mode === "transform" ? (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Transform Result</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <MetricCard label="Matrix A" value={state.matrixRows.map((row) => `[${row.join(", ")}]`).join(" ")} />
                            <MetricCard label="Probe v" value={state.rhsRows.length ? `[${state.rhsRows.join(", ")}]` : "pending"} />
                            <MetricCard label="T(v)" value={transformedVector ? formatVector(transformedVector) : state.analyticSolution?.exact.result_latex ?? "pending"} />
                            <MetricCard
                                label="Orientation"
                                value={planeScale == null ? "pending" : planeScale > 0 ? "preserved" : planeScale < 0 ? "reversed" : "collapsed"}
                            />
                            <MetricCard label="Area Scale" value={state.summary.determinant ?? (planeScale == null ? "pending" : planeScale.toFixed(3))} />
                            <MetricCard label="Trace" value={state.summary.trace ?? "pending"} />
                        </div>
                        {state.analyticSolution?.exact.auxiliary_latex ? (
                            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-foreground">
                                <LaboratoryInlineMathMarkdown content={state.analyticSolution.exact.auxiliary_latex} />
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Geometric Reading</div>
                        <div className="mt-4 grid gap-3">
                            <InsightCard title="Basis distortion" body="Transform preview o'ng panelda birlik kvadratni va probe vektorni qanday burayotganini ko'rsatadi." />
                            <InsightCard
                                title="Orientation change"
                                body={
                                    planeScale == null
                                        ? "2x2 transform bo'lsa orientation sign shu yerda aniq ko'rinadi."
                                        : planeScale > 0
                                          ? "Determinant musbat, orientatsiya saqlanadi."
                                          : planeScale < 0
                                            ? "Determinant manfiy, orientatsiya almashadi."
                                            : "Determinant nol, tekislik bir chiziqqa yoki nuqtaga qulaydi."
                                }
                            />
                            <InsightCard title="Analytic output" body={state.analyticSolution?.exact.result_latex ?? "Transform analytic result solve bilan shu yerda ko'rinadi."} />
                        </div>
                    </div>
                </div>
                ) : null,
                state.mode === "systems" ? (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Augmented Matrix</div>
                        <div className="mt-4 overflow-x-auto">
                            <div
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${Math.max((state.matrixRows[0]?.length ?? 0) + 1, 1)}, minmax(58px, 1fr))` }}
                            >
                                {state.matrixRows.flatMap((row, rowIndex) => [
                                    ...row.map((entry, columnIndex) => (
                                        <div key={`aug-${rowIndex}-${columnIndex}`} className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-4 text-center font-mono text-sm font-semibold text-foreground">
                                            {entry}
                                        </div>
                                    )),
                                    <div key={`rhs-${rowIndex}`} className="rounded-2xl border border-accent/30 bg-accent/10 px-3 py-4 text-center font-mono text-sm font-semibold text-foreground">
                                        {state.rhsRows[rowIndex] ?? "0"}
                                    </div>,
                                ])}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">System Audit</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <MetricCard label="Solver" value={state.summary.solverKind ?? "pending"} />
                            <MetricCard label="Residual" value={state.summary.residualNorm ?? "pending"} />
                            <MetricCard label="Condition" value={state.summary.conditionNumber ?? "pending"} />
                            <MetricCard label="Pivots" value={state.summary.pivotColumns?.length ? state.summary.pivotColumns.join(", ") : "pending"} />
                        </div>
                        <div className="mt-4 space-y-3">
                            {(state.analyticSolution?.exact.steps ?? [])
                                .filter((step) => /row|echelon|rref|solve/i.test(step.title))
                                .map((step) => (
                                    <InsightCard key={step.title} title={step.title} body={step.summary} />
                                ))}
                        </div>
                    </div>
                </div>
                ) : null,
                state.mode === "decomposition" ? (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Spectral Audit</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <MetricCard label="Spectrum" value={state.summary.eigenSummary ?? "pending"} />
                            <MetricCard label="Diagonalizable" value={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"} />
                            <MetricCard label="Spectral Radius" value={state.summary.spectralRadius ?? "pending"} />
                            <MetricCard label="Factorizations" value={state.summary.decompositionSummary ?? "pending"} />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Decomposition Panels</div>
                        <div className="mt-4 grid gap-3">
                            <InsightCard title="LU / QR / Cholesky" body={state.summary.decompositionSummary ?? "Factorization audit pending"} />
                            <InsightCard title="SVD" body={state.summary.svdSummary ?? "Singular spectrum pending"} />
                            <InsightCard title="Eigenvectors" body={state.analyticSolution?.exact.auxiliary_latex ?? "Eigenvector probe solve summary bilan shu yerda ko'rinadi."} />
                            <InsightCard title="Diagonalization" body={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "Diagonalizable structure detected." : "Matrix to'liq diagonalizable emas."} />
                        </div>
                    </div>
                </div>
                ) : null,
                state.mode === "tensor" ? (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Audit</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                    </div>

                    <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Factors</div>
                        <div className="mt-4 grid gap-3">
                            {(state.summary.modeSingularSummaries ?? []).map((detail) => (
                                <InsightCard key={detail} title="Mode Spectrum" body={detail} />
                            ))}
                            {(state.summary.contractionDetails ?? []).map((detail) => (
                                <InsightCard key={detail} title="Contraction Lane" body={detail} />
                            ))}
                            {(state.summary.tuckerFactorSummaries ?? []).map((detail) => (
                                <InsightCard key={detail} title="Tucker Factor" body={detail} />
                            ))}
                            {(state.summary.cpFactorSummaries ?? []).map((detail) => (
                                <InsightCard key={detail} title="CP Factor" body={detail} />
                            ))}
                            {!state.summary.modeSingularSummaries?.length &&
                            !state.summary.contractionDetails?.length &&
                            !state.summary.tuckerFactorSummaries?.length &&
                            !state.summary.cpFactorSummaries?.length ? (
                                <InsightCard title="Tensor factors" body="Mode-wise spectra, contraction lanes va factor summary solve bilan shu yerda ko'rinadi." />
                            ) : null}
                        </div>
                    </div>
                </div>
                ) : null,
            ].filter(Boolean).map((entry, index) =>
                "id" in (entry as object)
                    ? (entry as { id: string; node: React.ReactNode; weight?: number })
                    : { id: `extra-${index}`, node: entry as React.ReactNode, weight: 2 },
            )}
        />
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    const renderAsMath = /[\\^_{}[\]]|->|=>|=/.test(value);

    return (
        <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">
                {renderAsMath ? <MathBlock value={value} compact /> : value}
            </div>
        </div>
    );
}

function InsightCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="text-sm font-black text-foreground">{title}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">{body}</div>
        </div>
    );
}

function FormulaCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <MathBlock value={value} className="mt-3 text-sm leading-7 text-foreground" />
        </div>
    );
}

function MathBlock({
    value,
    className = "",
    compact = false,
}: {
    value?: string;
    className?: string;
    compact?: boolean;
}) {
    if (!value?.trim() || value === "pending") {
        return <div className={className}>pending</div>;
    }

    return (
        <div className={`${className} overflow-x-auto ${compact ? "[&_.katex-display]:my-1" : ""}`.trim()}>
            <LaboratoryInlineMathMarkdown content={value} />
        </div>
    );
}
