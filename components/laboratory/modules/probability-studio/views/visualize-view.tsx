import { VisualizerDeck } from "../components/visualizer-deck";
import type { ProbabilityStudioState } from "../types";

export function VisualizeView({ state }: { state: ProbabilityStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <VisualizerDeck mode={state.mode} result={state.result} summary={state.summary} />
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Visualization Notes</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {state.visualNotes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm font-semibold text-foreground">
                            {note}
                        </div>
                    ))}
                </div>
                {state.result.auxiliaryFormula ? (
                    <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 font-mono text-sm text-foreground">{state.result.auxiliaryFormula}</div>
                ) : null}
            </div>
        </div>
    );
}
