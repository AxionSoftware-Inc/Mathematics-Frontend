import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { LaboratoryCompareLayout } from "@/components/laboratory/laboratory-compare-layout";

import type { SeriesLimitStudioState } from "../types";
import { TrustPanel } from "../components/trust-panel";
import { ScenarioPanel } from "../components/scenario-panel";

export function CompareView({ state }: { state: SeriesLimitStudioState }) {
    const endpointItems = compactItems(
        state.summary.endpointDetails?.length ? state.summary.endpointDetails : [state.summary.endpointSignal ?? "Endpoint audit pending"],
    );

    const proofItems = compactItems([
        `Primary proof: ${state.summary.proofSignal ?? "pending"}`,
        `Primary test: ${state.summary.testFamily ?? "pending"}`,
        `Secondary test: ${state.summary.secondaryTestFamily ?? "pending"}`,
        `Comparison signal: ${state.summary.comparisonSignal ?? "pending"}`,
        `Asymptotic class: ${state.summary.asymptoticClass ?? "pending"}`,
        `Expansion signal: ${state.summary.expansionSignal ?? "pending"}`,
    ]);
    const limitItems = compactItems([
        `Detected family: ${state.summary.detectedFamily ?? "pending"}`,
        `Research lane: ${state.summary.specialFamilySignal ?? "pending"}`,
        `Error bound: ${state.summary.errorBoundSignal ?? "pending"}`,
        `Asymptotic cue: ${state.summary.asymptoticSignal ?? "pending"}`,
        `Risk: ${state.summary.riskSignal ?? "pending"}`,
    ]);
    const overviewCards = [
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "pending", detail: "Primary compare lane", tone: "info" as const },
        { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Global convergence risk", tone: "warn" as const },
        { eyebrow: "Result", value: state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending", detail: "Current best result", tone: "success" as const },
        { eyebrow: "Family", value: state.summary.detectedFamily ?? "pending", detail: "Detected structure", tone: "neutral" as const },
    ];

    return (
        <LaboratoryCompareLayout
            overviewCards={overviewCards}
            sections={[
                { id: "summary", title: "Compare Summary", node: <Panel title="Compare Summary" items={state.compareNotes} />, weight: 2 },
                {
                    id: "risk",
                    title: "Risk Register",
                    node: (
                        <Panel
                            title="Risk Register"
                            items={compactItems([
                                `Risk: ${state.summary.riskSignal ?? "pending"}`,
                                `Dominant term: ${state.summary.dominantTerm ?? "pending"}`,
                                `Interval / asymptotic: ${state.summary.intervalSignal ?? state.summary.asymptoticSignal ?? "pending"}`,
                                `Tail / partial sum: ${state.summary.partialSumSignal ?? state.summary.boundedness ?? "pending"}`,
                            ])}
                        />
                    ),
                    weight: 1,
                },
                { id: "branch", title: "Branch", node: <Panel title={state.mode === "limits" ? "Limit Branch" : "Proof Stack"} items={state.mode === "limits" ? limitItems : proofItems} />, weight: 1 },
                { id: "endpoint", title: "Endpoint", node: <Panel title={state.mode === "limits" ? "One-Sided Audit" : "Endpoint Audit"} items={endpointItems} />, weight: 1 },
                {
                    id: "evidence",
                    title: "Evidence Stack",
                    node: (
                        <Panel
                            title="Evidence Stack"
                            items={compactItems([
                                `Result: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}`,
                                `Convergence: ${state.summary.convergenceSignal ?? state.summary.radiusSignal ?? "pending"}`,
                                `Monotonicity: ${state.summary.monotonicity ?? "pending"}`,
                                `Boundedness: ${state.summary.boundedness ?? "pending"}`,
                            ])}
                        />
                    ),
                    weight: 1,
                },
                { id: "trust", title: "Trust", node: <TrustPanel {...state.trustPanelProps} />, weight: 1 },
                { id: "scenario", title: "Scenario", node: <ScenarioPanel {...state.scenarioPanelProps} />, weight: 1 },
            ]}
        />
    );
}

function Panel({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        <PanelValue value={item} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PanelValue({ value }: { value: string }) {
    if (/[\\^_{}]/.test(value)) {
        return <LaboratoryInlineMathMarkdown content={toMathMarkdown(value)} />;
    }

    return value;
}

function compactItems(items: string[]) {
    const filtered = items.filter((item) => !item.toLowerCase().includes("pending"));
    return filtered.length ? filtered : ["Awaiting solver evidence."];
}

function toMathMarkdown(value: string) {
    const [prefix, raw] = value.split(/:\s(.+)/);
    if (!raw) return value;
    return `${prefix}: $$${raw.trim()}$$`;
}
