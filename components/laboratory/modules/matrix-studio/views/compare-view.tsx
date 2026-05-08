import { LaboratoryCompareLayout } from "@/components/laboratory/laboratory-compare-layout";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import type { MatrixStudioState } from "../types";

export function CompareView({ state }: { state: MatrixStudioState }) {
    const overviewCards = [
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "pending", detail: "Primary matrix lane", tone: "info" as const },
        { eyebrow: "Shape", value: state.summary.shape ?? "pending", detail: "Matrix structure", tone: "neutral" as const },
        { eyebrow: "Condition", value: state.summary.conditionNumber ?? "pending", detail: "Stability cue", tone: "warn" as const },
        { eyebrow: "Readiness", value: state.analyticSolution?.diagnostics.contract?.readiness_label ?? "pending", detail: "Solver contract", tone: "success" as const },
    ];
    const compareNotesSection = (
        <Panel title="Method Compare" items={state.compareNotes} />
    );
    const auditSection = (
        <div className="site-lab-card p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Audit Snapshot</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <AuditCard label="Method" value={state.analyticSolution?.exact.method_label ?? "pending"} />
                <AuditCard label="Condition cue" value={state.summary.conditionLabel ?? "pending"} />
                <AuditCard label="Condition number" value={state.summary.conditionNumber ?? "pending"} />
                <AuditCard label="Diagonalizable" value={state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"} />
                <AuditCard label="Spectral radius" value={state.summary.spectralRadius ?? "pending"} />
                <AuditCard label="Residual norm" value={state.summary.residualNorm ?? "pending"} />
                <AuditCard label="Stability" value={state.summary.stabilitySummary ?? "pending"} />
                <AuditCard label="Least squares" value={state.summary.leastSquaresSummary ?? "pending"} />
                <AuditCard label="Solver kind" value={state.summary.solverKind ?? "pending"} />
                <AuditCard label="Iterative" value={state.summary.iterativeSummary ?? "pending"} />
                <AuditCard label="Contract" value={state.analyticSolution?.diagnostics.contract?.status ?? "pending"} />
                <AuditCard label="Risk" value={state.analyticSolution?.diagnostics.contract?.risk_level ?? "pending"} />
            </div>
        </div>
    );
    const tensorSection = (
        <Panel
            title="Structure Evidence"
            items={[
                `SVD: ${state.summary.svdSummary ?? "pending"}`,
                `Sparse: ${state.summary.sparseSummary ?? "pending"}`,
                `Tensor shape: ${state.summary.tensorShape ?? "pending"}`,
                `Mode ranks: ${state.summary.modeRanks?.join(", ") ?? "pending"}`,
                `Tensor product: ${state.summary.tensorProductSummary ?? "pending"}`,
                `Tucker: ${state.summary.tuckerSummary ?? "pending"}`,
                `CP probe: ${state.summary.cpSummary ?? "pending"}`,
                `Tensor eigen: ${state.summary.tensorEigenSummary ?? "pending"}`,
            ]}
        />
    );
    const evidenceSection = (
        <Panel
            title="Evidence Stack"
            items={[
                `Final result: ${state.analyticSolution?.exact.result_latex ?? "pending"}`,
                `Auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? "pending"}`,
                `Rank: ${state.summary.rank ?? "pending"}`,
                `Pivot columns: ${state.summary.pivotColumns?.join(", ") ?? "pending"}`,
                `Decomposition: ${state.summary.decompositionSummary ?? "pending"}`,
                `Factor audit: ${state.summary.factorAuditSummary ?? "pending"}`,
                ...(state.analyticSolution?.diagnostics.contract?.review_notes ?? []).map((note) => `Review: ${note}`),
            ]}
        />
    );

    return (
        <LaboratoryCompareLayout
            overviewCards={overviewCards}
            sections={[
                { id: "compare-notes", title: "Method Compare", node: compareNotesSection, weight: 2 },
                { id: "audit", title: "Audit Snapshot", node: auditSection, weight: 2 },
                { id: "evidence", title: "Evidence Stack", node: evidenceSection, weight: 1 },
                { id: "structure", title: "Structure Evidence", node: tensorSection, weight: 1 },
            ]}
        />
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

function Panel({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="site-lab-card p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm text-foreground">
                        <PanelValue value={item} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PanelValue({ value }: { value: string }) {
    if (/[\\^_{}[\]]/.test(value)) {
        return <LaboratoryInlineMathMarkdown content={value} />;
    }

    return value;
}
