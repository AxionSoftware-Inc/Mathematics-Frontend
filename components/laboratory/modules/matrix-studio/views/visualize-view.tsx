import type { MatrixStudioState } from "../types";
import { VisualizerDeck } from "../components/visualizer-deck";

export function VisualizeView({ state }: { state: MatrixStudioState }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <VisualizerDeck
                mode={state.mode}
                matrixRows={state.matrixRows}
                rhsRows={state.rhsRows}
                tensorSlices={state.tensorSlices}
                summary={state.summary}
                analyticSolution={state.analyticSolution}
            />

            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
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
                {state.analyticSolution?.exact.result_latex ? (
                    <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visual Lane Result</div>
                        <div className="mt-2 overflow-x-auto font-mono text-sm text-foreground">{state.analyticSolution.exact.result_latex}</div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
