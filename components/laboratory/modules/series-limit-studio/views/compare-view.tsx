import type { SeriesLimitStudioState } from "../types";
import { TrustPanel } from "../components/trust-panel";
import { ScenarioPanel } from "../components/scenario-panel";

export function CompareView({ state }: { state: SeriesLimitStudioState }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <Panel title="Compare Summary" items={state.compareNotes} />
                <Panel
                    title="Risk Register"
                    items={[
                        `Risk: ${state.summary.riskSignal ?? "pending"}`,
                        `Dominant term: ${state.summary.dominantTerm ?? "pending"}`,
                        `Test family: ${state.summary.testFamily ?? "pending"}`,
                        `Secondary test: ${state.summary.secondaryTestFamily ?? "pending"}`,
                        `Asymptotic class: ${state.summary.asymptoticClass ?? "pending"}`,
                        `Proof signal: ${state.summary.proofSignal ?? "pending"}`,
                        `Interval / asymptotic: ${state.summary.intervalSignal ?? state.summary.asymptoticSignal ?? "pending"}`,
                        `Comparison: ${state.summary.comparisonSignal ?? "pending"}`,
                    ]}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <TrustPanel {...state.trustPanelProps} />
                <ScenarioPanel {...state.scenarioPanelProps} />
            </div>
        </div>
    );
}

function Panel({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
