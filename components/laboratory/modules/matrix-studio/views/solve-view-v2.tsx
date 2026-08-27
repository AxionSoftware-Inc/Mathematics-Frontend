import React from "react";

import { LaboratoryReferenceSolveShell } from "@/components/laboratory/laboratory-reference-solve-shell";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";
import { MatrixProblemComposerV2 } from "../components/matrix-problem-composer-v2";
import { VisualizerDeck } from "../components/visualizer-deck";
import type { MatrixStudioState } from "../types";

export function SolveViewV2({
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
    const hasAnalytic = Boolean(state.analyticSolution?.exact.result_latex || state.analyticSolution?.exact.steps.length);
    const steps = state.analyticSolution?.exact.steps ?? [];
    const cards = buildPrimaryCards(state);

    const result = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Result</div>
                    <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Matrix result</div>
                </div>
                <div className="text-[10px] text-[#949ba5]">Structure first · detailed audit below</div>
            </div>
            {state.analyticSolution?.exact.result_latex ? (
                <div className="mb-3 overflow-x-auto rounded-[8px] border border-[#dfe4ea] bg-[#f8fafe] px-4 py-3 text-[13px] text-[#20242b]">
                    <LaboratoryInlineMathMarkdown content={state.analyticSolution.exact.result_latex} />
                </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => <LaboratoryMetricCard key={card.eyebrow} {...card} />)}
            </div>
        </section>
    );

    const interpretation = (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white p-4">
            <LaboratoryMathPanel
                eyebrow={hasAnalytic ? "Analytic interpretation" : "Structural interpretation"}
                title={state.analyticSolution?.exact.method_label ?? modeTitle(state.mode)}
                content={[
                    state.analyticSolution?.exact.auxiliary_latex ? `**Auxiliary:** ${state.analyticSolution.exact.auxiliary_latex}` : null,
                    state.summary.decompositionSummary ? `**Decomposition:** ${state.summary.decompositionSummary}` : null,
                    state.summary.systemSummary ? `**System:** ${state.summary.systemSummary}` : null,
                    state.visualNotes?.[0] ? `**Visual reading:** ${state.visualNotes[0]}` : null,
                    !state.analyticSolution?.exact.auxiliary_latex && !state.summary.decompositionSummary && !state.summary.systemSummary ? "The visualization above is the primary structural reading for this matrix." : null,
                ].filter(Boolean).join("\n\n")}
                accentClassName={hasAnalytic ? "text-emerald-600" : "text-[#184eb8]"}
            />
        </section>
    );

    const advanced = (
        <div className="space-y-4">
            {steps.length ? (
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <LaboratorySolveDetailCard
                            key={`${step.title}-${index}`}
                            id={String(index + 1)}
                            action={step.title}
                            result={step.summary}
                            formula={step.latex ?? undefined}
                            tone={(step.tone as "neutral" | "info" | "success" | "warn") ?? "neutral"}
                        />
                    ))}
                </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {buildAuditCards(state).map((card) => <LaboratoryMetricCard key={card.eyebrow} {...card} />)}
            </div>
            {state.visualNotes?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {state.visualNotes.map((note) => (
                        <div key={note} className="rounded-[8px] border border-[#e2e6ec] bg-[#fcfdff] px-3 py-3 text-[12px] leading-5 text-[#66707c]">{note}</div>
                    ))}
                </div>
            ) : null}
        </div>
    );

    return (
        <LaboratoryReferenceSolveShell
            composer={
                <MatrixProblemComposerV2
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
            result={result}
            interpretation={interpretation}
            advanced={advanced}
            visualHint="Heatmap, transform geometry, decomposition or tensor structure"
            advancedOpen={state.experienceLevel === "research"}
        />
    );
}

function modeTitle(mode: MatrixStudioState["mode"]) {
    if (mode === "algebra") return "Matrix algebra";
    if (mode === "decomposition") return "Spectral decomposition";
    if (mode === "systems") return "Linear system";
    if (mode === "transform") return "Linear transform";
    return "Tensor analysis";
}

function buildPrimaryCards(state: MatrixStudioState) {
    if (state.mode === "systems") {
        return [
            { eyebrow: "Rank", value: state.summary.rank ?? "pending", detail: "Matrix rank", tone: "neutral" as const },
            { eyebrow: "Solver", value: state.summary.solverKind ?? "pending", detail: "Active numerical lane", tone: "info" as const },
            { eyebrow: "Residual", value: state.summary.residualNorm ?? "pending", detail: "Solution residual", tone: "success" as const },
            { eyebrow: "Condition", value: state.summary.conditionNumber ?? "pending", detail: "Sensitivity signal", tone: "neutral" as const },
        ];
    }
    if (state.mode === "decomposition") {
        return [
            { eyebrow: "Rank", value: state.summary.rank ?? "pending", detail: "Matrix rank", tone: "neutral" as const },
            { eyebrow: "Spectral radius", value: state.summary.spectralRadius ?? "pending", detail: "Largest spectral magnitude", tone: "info" as const },
            { eyebrow: "SVD", value: state.summary.svdSummary ?? "pending", detail: "Singular structure", tone: "success" as const },
            { eyebrow: "Diagonalizable", value: state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no", detail: "Eigenbasis status", tone: "neutral" as const },
        ];
    }
    if (state.mode === "tensor") {
        return [
            { eyebrow: "Shape", value: state.summary.tensorShape ?? "pending", detail: "Tensor dimensions", tone: "neutral" as const },
            { eyebrow: "Order", value: state.summary.tensorOrder ? String(state.summary.tensorOrder) : "pending", detail: "Tensor order", tone: "info" as const },
            { eyebrow: "Mode ranks", value: state.summary.modeRanks?.join(", ") ?? "pending", detail: "Multilinear ranks", tone: "success" as const },
            { eyebrow: "Contraction", value: state.summary.contractionSummary ?? "pending", detail: "Current contraction", tone: "neutral" as const },
        ];
    }
    return [
        { eyebrow: "Determinant", value: state.summary.determinant ?? "pending", detail: "Area / volume scale", tone: "info" as const },
        { eyebrow: "Rank", value: state.summary.rank ?? "pending", detail: "Independent directions", tone: "success" as const },
        { eyebrow: "Trace", value: state.summary.trace ?? "pending", detail: "Diagonal sum", tone: "neutral" as const },
        { eyebrow: "Condition", value: state.summary.conditionNumber ?? "pending", detail: "Numerical sensitivity", tone: "neutral" as const },
    ];
}

function buildAuditCards(state: MatrixStudioState) {
    return [
        { eyebrow: "Shape", value: state.summary.shape ?? "pending", detail: "Input shape", tone: "neutral" as const },
        { eyebrow: "Sparse", value: state.summary.sparseSummary ?? "pending", detail: "Sparsity signal", tone: "neutral" as const },
        { eyebrow: "Stability", value: state.summary.stabilitySummary ?? "pending", detail: "Numerical stability", tone: "info" as const },
        { eyebrow: "Factor audit", value: state.summary.factorAuditSummary ?? "pending", detail: "Factorization check", tone: "neutral" as const },
    ];
}
