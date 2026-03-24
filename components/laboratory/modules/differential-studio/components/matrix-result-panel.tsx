import React from "react";
import type { DifferentialAnalyticSolveResponse, HessianSummary, JacobianSummary } from "../types";

type MatrixSummary = JacobianSummary | HessianSummary;

export function MatrixResultPanel({
    summary,
    analyticSolution,
    title,
}: {
    summary: MatrixSummary;
    analyticSolution?: DifferentialAnalyticSolveResponse | null;
    title?: string;
}) {
    const matrix = summary.matrix;
    const cols = matrix[0]?.length ?? 0;
    const determinantStatus = analyticSolution?.diagnostics?.matrix?.determinant_status;
    const criticalPointType =
        analyticSolution?.diagnostics?.matrix?.critical_point_type
        ?? (summary.type === "hessian" ? summary.criticalPointType : null);
    const eigenSignature =
        analyticSolution?.diagnostics?.matrix?.eigenvalue_signature
        ?? (summary.type === "hessian" ? summary.eigenvalueSignature : null);

    return (
        <div className="site-panel space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">{title ?? "Matrix Result"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {summary.type === "jacobian"
                            ? "Row-by-row local linearization matrix."
                            : "Second-order curvature matrix with critical-point diagnostics."}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                        {summary.type === "jacobian" ? `${summary.size.rows}x${summary.size.cols}` : `${summary.size}x${summary.size}`}
                    </span>
                    {determinantStatus ? (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                            {determinantStatus}
                        </span>
                    ) : null}
                </div>
            </div>

            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}
            >
                {matrix.flatMap((row, rowIndex) =>
                    row.map((cell, cellIndex) => (
                        <div
                            key={`${rowIndex}-${cellIndex}`}
                            className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-3 text-center"
                        >
                            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                {summary.type === "jacobian" ? `J${rowIndex + 1}${cellIndex + 1}` : `H${rowIndex + 1}${cellIndex + 1}`}
                            </div>
                            <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                                {cell.toFixed(5)}
                            </div>
                        </div>
                    )),
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Determinant</div>
                    <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                        {summary.determinant == null ? "n/a" : summary.determinant.toFixed(6)}
                    </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Trace</div>
                    <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                        {summary.trace == null ? "n/a" : summary.trace.toFixed(6)}
                    </div>
                </div>
                {criticalPointType ? (
                    <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Critical Point</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{criticalPointType}</div>
                    </div>
                ) : null}
                {eigenSignature ? (
                    <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Eigen Signature</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{eigenSignature}</div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
