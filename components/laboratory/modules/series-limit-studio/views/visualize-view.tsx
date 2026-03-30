import { VisualizerDeck } from "../components/visualizer-deck";
import type { SeriesLimitStudioState } from "../types";

export function VisualizeView({ state }: { state: SeriesLimitStudioState }) {
    return (
        <div className="space-y-4">
            <VisualizerDeck mode={state.mode} dimension={state.dimension} result={state.result} summary={state.summary} />
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <AuditPanel title="Computation Audit" notes={state.visualNotes} />
                <AuditPanel title="Rendered Data Points" notes={state.compareNotes} />
            </div>
        </div>
    );
}

function AuditPanel({ title, notes }: { title: string; notes: string[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {notes.map((note) => (
                    <div key={note} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        {note}
                    </div>
                ))}
            </div>
        </div>
    );
}
