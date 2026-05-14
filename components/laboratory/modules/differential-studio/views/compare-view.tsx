import React from "react";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratoryResultLevelsPanel } from "@/components/laboratory/laboratory-result-levels-panel";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { MethodIntelligenceTable } from "@/components/laboratory/method-intelligence-table";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";
import { buildMethodIntelligenceRows } from "@/lib/method-intelligence";
import { DifferentialMathService } from "../services/math-service";
import { ScenarioPanel } from "../components/scenario-panel";
import { TrustPanel } from "../components/trust-panel";
import type {
    DifferentialAnalyticSolveResponse,
    DifferentialMetricCard,
    DifferentialComputationSummary,
    DifferentialExtendedMode,
    StepSweepEntry,
} from "../types";

export interface CompareViewState {
    compareOverviewCards?: DifferentialMetricCard[];
    trustPanelProps?: React.ComponentProps<typeof TrustPanel>;
    scenarioPanelProps?: React.ComponentProps<typeof ScenarioPanel>;
    methodAuditCards?: DifferentialMetricCard[];
    riskRegisterCards?: DifferentialMetricCard[];
    summary?: DifferentialComputationSummary | null;
    expression?: string;
    variable?: string;
    point?: string;
    mode?: DifferentialExtendedMode;
    analyticSolution?: DifferentialAnalyticSolveResponse | null;
}

function useCompareSweep(
    summary: DifferentialComputationSummary | null | undefined,
    expression: string,
    variable: string,
    point: string,
    mode: DifferentialExtendedMode,
): StepSweepEntry[] {
    return React.useMemo(() => {
        if (!summary || !expression) return [];
        const vars = variable.split(",").map((entry) => entry.trim()).filter(Boolean);
        const pts = point.split(",").map((entry) => Number(entry.trim())).filter(Number.isFinite);

        try {
            if (mode === "derivative") {
                return DifferentialMathService.approximateStepSweep(expression, vars[0] ?? "x", pts[0] ?? 0);
            }
            if (mode === "partial" || mode === "directional") {
                return DifferentialMathService.approximateGradientStepSweep(expression, vars, pts);
            }
            return [];
        } catch {
            return [];
        }
    }, [expression, mode, point, summary, variable]);
}

export function CompareView({ state }: { state: CompareViewState }) {
    const {
        compareOverviewCards = [],
        trustPanelProps = { state: { trustScore: 0, analyticStatus: "missing", numericalSupport: false, convergence: "unknown", hazards: [] } },
        scenarioPanelProps = {
            state: {
                savedExperiments: [],
                experimentLabel: "",
                setExperimentLabel: () => {},
                saveCurrentExperiment: () => {},
                loadSavedExperiment: () => {},
                removeSavedExperiment: () => {},
            },
        },
        methodAuditCards = [],
        riskRegisterCards = [],
        summary = null,
        expression = "",
        variable = "x",
        point = "0",
        mode = "derivative",
        analyticSolution = null,
    } = state;

    const sweepEntries = useCompareSweep(summary, expression, variable, point, mode);

    const comparisonCards = React.useMemo(() => {
        if (!sweepEntries.length) return [] as DifferentialMetricCard[];
        const stableCount = sweepEntries.filter((entry) => entry.stability === "Stable").length;
        const roughCount = sweepEntries.filter((entry) => entry.stability === "Rough").length;
        const spread = Math.max(...sweepEntries.map((entry) => entry.value)) - Math.min(...sweepEntries.map((entry) => entry.value));

        return [
            { eyebrow: "Stable h", value: String(stableCount), detail: "Trusted step sizes", tone: "success" as const },
            { eyebrow: "Rough h", value: String(roughCount), detail: "Unstable edge cases", tone: roughCount > 0 ? "warn" as const : "neutral" as const },
            { eyebrow: "Method Spread", value: spread.toExponential(2), detail: "Observed numeric spread", tone: "info" as const },
        ];
    }, [sweepEntries]);
    const methodIntelligenceRows = React.useMemo(
        () =>
            buildMethodIntelligenceRows({
                options: getLaboratoryMethodOptions("differential"),
                selectedMethod: mode,
                exactResult: analyticSolution?.exact?.derivative_latex ?? analyticSolution?.exact?.evaluated_latex ?? undefined,
                numericResult: summary && "valueAtPoint" in summary ? String(summary.valueAtPoint) : undefined,
            }),
        [analyticSolution, mode, summary],
    );

    const resultLevelsCards = React.useMemo(() => {
        if (!summary && analyticSolution?.status === "exact") {
            return [
                {
                    label: "Quick read",
                    tone: "text-accent",
                    summary: mode === "ode" ? "ODE lane symbolic solution berdi; compare bu yerda solver family va constraints signalini ko'rsatadi." : mode === "pde" ? "PDE symbolic lane limited family ichida ishladi; asosiy signal yechim oilasi va domain assumptions." : "SDE lane stochastic sample-path berdi; compare bu yerda pathwise confidence va discretization signalini ko'rsatadi.",
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: analyticSolution.exact?.method_label ? `Method: ${analyticSolution.exact.method_label}. Taxonomy: ${analyticSolution.diagnostics?.taxonomy?.family ?? "specialized"}.` : "Specialized lane result.",
                },
                {
                    label: "Research",
                    tone: "text-amber-600",
                    summary: mode === "sde" ? "Single seeded path bilan cheklangan; ensemble compare keyingi bosqichda kerak." : "Boundary/initial assumptions va solver family report bilan birga o'qilishi kerak.",
                },
            ];
        }
        if (!summary) return [];
        if ("matrix" in summary) {
            return [
                {
                    label: "Quick read",
                    tone: "text-accent",
                    summary: `${summary.type === "jacobian" ? "Transformation sensitivity" : "Curvature signature"}: matrix lane needs row-by-row audit, not a single curve.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: "Determinant, trace va row structure asosiy signal. Matrix result panelidan har bir qatorni o'qing.",
                },
                {
                    label: "Research",
                    tone: "text-amber-600",
                    summary: "Local linearization yoki second-order test sifatida talqin qiling. Qatorlarni variables va evaluation point bilan bog'lang.",
                },
            ];
        }

        if (summary.type === "ode") {
            return [
                {
                    label: "Quick read",
                    tone: "text-accent",
                    summary: `Trajectory reaches ${summary.valueAtPoint.toFixed(4)} with ${summary.stabilityLabel} phase behaviour.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Equilibria: ${summary.equilibriumPoints.length ? summary.equilibriumPoints.map((item) => item.toFixed(2)).join(", ") : "none"}. Family: ${summary.family}.`,
                },
                {
                    label: "Research",
                    tone: "text-amber-600",
                    summary: "Read the trajectory together with phase portrait and equilibrium classification.",
                },
            ];
        }

        if (summary.type === "pde") {
            return [
                {
                    label: "Quick read",
                    tone: "text-accent",
                    summary: `${summary.family} lane evolved on a ${summary.grid.nx}x${summary.grid.nt} mesh.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Explicit stability ratio ${summary.stabilityRatio.toFixed(4)}. Final spatial profile is available in the visual deck.`,
                },
                {
                    label: "Research",
                    tone: "text-amber-600",
                    summary: "Use this as a first numeric surrogate, not as a general PDE solver framework.",
                },
            ];
        }

        if (summary.type === "sde") {
            return [
                {
                    label: "Quick read",
                    tone: "text-accent",
                    summary: `${summary.pathCount} ensemble paths produced terminal mean ${summary.terminalMean.toFixed(4)}.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Terminal std ${summary.terminalStd.toFixed(4)}; compare mean path with ±1σ bands and histogram.`,
                },
                {
                    label: "Research",
                    tone: "text-amber-600",
                    summary: "Stochastic interpretation should rely on ensemble spread, not on one representative path.",
                },
            ];
        }

        return [
            {
                label: "Quick read",
                tone: "text-accent",
                summary: `${mode === "directional" ? "Projected change" : "Local slope"}: tanlangan nuqta yaqinidagi asosiy differensial signal.`,
            },
            {
                label: "Technical",
                tone: "text-sky-600",
                summary: sweepEntries.length ? "h-sweep active: bir nechta step size bo'yicha numerik barqarorlik tekshirildi." : "Single-pass estimate: hozircha bitta numerik baholash ishlatilmoqda.",
            },
            {
                label: "Research",
                tone: "text-amber-600",
                summary: `${mode === "partial" || mode === "directional" ? "Field sensitivity" : "Tangent fidelity"}: solve, visualize va compare qatlamlarini bir-biriga bog'laydi.`,
            },
        ];
    }, [analyticSolution, mode, summary, sweepEntries.length]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                {compareOverviewCards.map((card, index) => (
                    <LaboratoryMetricCard key={`compare-summary-${index}`} {...card} />
                ))}
            </div>

            {comparisonCards.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    {comparisonCards.map((card) => (
                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                    ))}
                </div>
            )}

            <MethodIntelligenceTable rows={methodIntelligenceRows} />

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                    <TrustPanel {...trustPanelProps} />
                    <LaboratoryResultLevelsPanel
                        cards={resultLevelsCards}
                        eyebrow="Comparison Views"
                        description="Bir xil differensial natijani tez, texnik va research darajada yonma-yon o'qing."
                    />
                    {sweepEntries.length > 0 && (
                        <LaboratoryDataTable
                            eyebrow="h sweep"
                            title="Method Spread Audit"
                            columns={["h", "Value", "Rel. Error", "Status"]}
                            rows={sweepEntries.map((entry) => [
                                entry.hLabel,
                                entry.value.toFixed(8),
                                entry.relError < 1e-8 ? "< 1e-8" : entry.relError.toExponential(2),
                                entry.stability,
                            ])}
                            emptyMessage="Sweep data yo'q"
                        />
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Risk Register</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {riskRegisterCards.map((card, index) => (
                                <LaboratoryMetricCard key={`risk-${index}`} {...card} />
                            ))}
                        </div>
                    </div>

                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Method Audit Snapshot</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {methodAuditCards.map((card, index) => (
                                <LaboratoryMetricCard key={`compare-audit-${index}`} {...card} />
                            ))}
                        </div>
                    </div>

                    <ScenarioPanel {...scenarioPanelProps} />
                </div>
            </div>
        </div>
    );
}
