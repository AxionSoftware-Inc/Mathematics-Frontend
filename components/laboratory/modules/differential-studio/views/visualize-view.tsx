import React from "react";
import { VisualizerDeck } from "../components/visualizer-deck";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { MatrixResultPanel } from "../components/matrix-result-panel";
import type {
    DifferentialComputationSummary,
    DifferentialMetricCard,
    DifferentialValidationSignal,
    StepSweepEntry,
    DifferentialExtendedMode,
} from "../types";
import { DifferentialMathService } from "../services/math-service";

// ─── Sweep runner ─────────────────────────────────────────────────────────────

function useStepSweep(
    summary: DifferentialComputationSummary | null,
    expression: string,
    variable: string,
    point: string,
    mode: DifferentialExtendedMode,
): StepSweepEntry[] | null {
    return React.useMemo(() => {
        if (!summary || !expression) return null;
        const vars = variable.split(",").map((v) => v.trim()).filter(Boolean);
        const pts = point.split(",").map((p) => Number(p.trim())).filter(Number.isFinite);
        try {
            if (mode === "derivative") {
                return DifferentialMathService.approximateStepSweep(expression, vars[0] ?? "x", pts[0] ?? 0);
            }
            if (mode === "partial" || mode === "directional") {
                return DifferentialMathService.approximateGradientStepSweep(expression, vars, pts);
            }
            return null;
        } catch {
            return null;
        }
    }, [summary, expression, variable, point, mode]);
}

// ─── Sweep table ──────────────────────────────────────────────────────────────

function SweepPanel({ entries }: { entries: StepSweepEntry[] }) {
    const rows = entries.map((e) => [
        e.hLabel,
        e.value.toFixed(8),
        e.relError < 1e-8 ? "< 1e-8" : e.relError.toExponential(2),
        e.stability,
    ]);

    return (
        <div className="site-panel space-y-4 p-5">
            <div>
                <div className="site-eyebrow text-accent">Sensitivity Sweep</div>
                <div className="mt-1 text-xs text-muted-foreground">
                    Central difference value at varying step-size h = 1e-2 → 1e-8. Reveals floating-point instability region.
                </div>
            </div>
            <LaboratoryDataTable
                eyebrow="h sweep"
                title="Step-Size Stability"
                columns={["h", "Value", "Rel. Error", "Status"]}
                rows={rows}
                emptyMessage="No sweep"
            />
            <div className="rounded-xl bg-muted/10 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                <strong>Optimal h range:</strong> 1e-5 to 1e-6 for most smooth functions.
                Xato &lt; 1e-4 bo&apos;lganda &quot;Stable&quot; sifatida belgilanadi.
                Katta h → truncation error; kichik h → catastrophic cancellation.
            </div>
        </div>
    );
}

// ─── Validation signals builder ───────────────────────────────────────────────

function buildSignalsFromSummary(
    summary: DifferentialComputationSummary | null,
): DifferentialValidationSignal[] {
    if (!summary) return [];
    const signals: DifferentialValidationSignal[] = [];

    if ("magnitude" in summary && typeof summary.magnitude === "number") {
        if (summary.magnitude < 1e-8) {
            signals.push({
                field: "gradient",
                tone: "info",
                label: "Near-Zero Gradient",
                text: "Gradient magnitudesi juda kichik — bu kritik nuqta (minimum/maximum/saddle) bo'lishi mumkin.",
                blocking: false,
            });
        }
        if (!Number.isFinite(summary.magnitude)) {
            signals.push({
                field: "gradient",
                tone: "error",
                label: "Infinite Gradient",
                text: "Gradient magnitudesi cheksiz — singularlik hududida yoki noto'g'ri nuqtada.",
                blocking: true,
            });
        }
    }

    if ("determinant" in summary && summary.determinant !== null) {
        const det = typeof summary.determinant === "number" ? summary.determinant : null;
        if (det !== null && Math.abs(det) < 1e-8) {
            signals.push({
                field: "matrix",
                tone: "warn",
                label: "Near-Singular Matrix",
                text: `det ≈ ${det.toExponential(2)} — matritsa deyarli singular, numerical inversion unstable.`,
                blocking: false,
            });
        }
    }

    if ("eigenvalueSignature" in summary && summary.eigenvalueSignature === "unknown") {
        signals.push({
            field: "hessian",
            tone: "warn",
            label: "Indefinite Classification",
            text: "Hessian tasnifi aniqlanmadi — nuqtada baholashni tekshiring.",
            blocking: false,
        });
    }

    if ("derivatives" in summary) {
        const ho = summary as import("../types").HigherOrderDerivativeSummary;
        if (ho.derivatives.some((d) => !Number.isFinite(d))) {
            signals.push({
                field: "derivative",
                tone: "error",
                label: "NaN in Derivative Series",
                text: "Biror tartibda hosila sonli emas — ifoda yoki nuqtani tekshiring.",
                blocking: true,
            });
        }
    }

    return signals;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VisualizeViewState {
    isResultStale: boolean;
    visualizeOverviewCards: DifferentialMetricCard[];
    methodAuditCards: DifferentialMetricCard[];
    methodTableRows: string[][];
    sampleTableRows: string[][];
    summary: DifferentialComputationSummary | null;
    error: string;
    solveErrorMessage: string;
    expression: string;
    variable: string;
    point: string;
    mode: DifferentialExtendedMode;
    solvePhase: string;
    analyticSolution?: import("../types").DifferentialAnalyticSolveResponse | null;
}

function isMatrixSummary(
    summary: DifferentialComputationSummary | null,
): summary is Extract<DifferentialComputationSummary, { matrix: number[][] }> {
    return Boolean(summary && "matrix" in summary);
}

export function VisualizeView({ state }: { state: VisualizeViewState }) {
    const {
        isResultStale,
        visualizeOverviewCards,
        methodAuditCards,
        methodTableRows,
        sampleTableRows,
        summary,
        expression,
        variable,
        point,
        mode,
    } = state;

    const stepSweep = useStepSweep(summary, expression, variable, point, mode);
    const signals = React.useMemo(
        () => buildSignalsFromSummary(summary),
        [summary],
    );

    const staleOverlay = isResultStale ? (
        <div className="absolute inset-0 z-10 rounded-3xl bg-background/50 backdrop-blur-[2px] transition-all pointer-events-none" />
    ) : null;
    const staleClass = isResultStale
        ? "opacity-40 grayscale focus-within:relative focus-within:z-20 focus-within:opacity-100 focus-within:grayscale-0"
        : "";

    return (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left column: visualizer + tables */}
            <div className="space-y-6">
                <div className="relative">
                    {staleOverlay}
                    <div className={staleClass}>
                        <VisualizerDeck state={{ ...state, stepSweep: stepSweep ?? undefined }} />
                    </div>
                </div>

                {isMatrixSummary(summary) && (
                    <div className="relative">
                        {staleOverlay}
                        <div className={staleClass}>
                            <MatrixResultPanel
                                summary={summary}
                                analyticSolution={state.analyticSolution}
                                title="Matrix Result"
                            />
                        </div>
                    </div>
                )}

                <div className="relative">
                    {staleOverlay}
                    <div className={`grid gap-6 lg:grid-cols-2 ${staleClass}`}>
                        <LaboratoryDataTable
                            eyebrow="Metrics"
                            title="Computation Audit"
                            columns={["Metric", "Value", "Notes"]}
                            rows={methodTableRows}
                            emptyMessage="Hali natija yo'q"
                        />
                        <LaboratoryDataTable
                            eyebrow="Samples"
                            title="Rendered Data Points"
                            columns={mode === "derivative" ? ["x", "f(x)"] : ["axis", "slice"]}
                            rows={sampleTableRows}
                            emptyMessage="Namunalar mavjud emas"
                        />
                    </div>
                </div>
            </div>

            {/* Right column: audit cards + sweep + signals */}
            <div className="space-y-6">
                <div className="relative">
                    {staleOverlay}
                    <div className={`site-panel space-y-4 p-5 ${staleClass}`}>
                        <div className="site-eyebrow text-accent">Visual Audit</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {visualizeOverviewCards?.map((card) => (
                                <LaboratoryMetricCard
                                    key={`voc-${card.eyebrow}-${card.value}`}
                                    {...card}
                                />
                            ))}
                        </div>
                        {methodAuditCards?.length > 0 && (
                            <>
                                <div className="border-t border-border/40" />
                                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                                    {methodAuditCards.map((card) => (
                                        <LaboratoryMetricCard
                                            key={`mac-${card.eyebrow}-${card.value}`}
                                            {...card}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Step sweep (derivative mode only) */}
                {stepSweep && stepSweep.length > 0 && (
                    <div className="relative">
                        {staleOverlay}
                        <div className={staleClass}>
                            <SweepPanel entries={stepSweep} />
                        </div>
                    </div>
                )}

                {/* Runtime signals */}
                <div className="relative">
                    {staleOverlay}
                    <div className={staleClass}>
                        <LaboratorySignalPanel
                            eyebrow="Runtime Signals"
                            title="Numerical Validation"
                            items={signals.map((s) => ({
                                label: s.label,
                                text: s.text,
                                tone: (s.tone === "error" ? "danger" : s.tone) as "warn" | "info" | "danger" | "neutral",
                            }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
