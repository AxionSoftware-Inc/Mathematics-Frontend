import React from "react";
import { Trash2 } from "lucide-react";
import type { DifferentialSavedExperiment } from "../types";

interface ScenarioPanelState {
    savedExperiments: DifferentialSavedExperiment[];
    experimentLabel: string;
    setExperimentLabel: (value: string) => void;
    saveCurrentExperiment: () => void;
    loadSavedExperiment: (experiment: DifferentialSavedExperiment) => void;
    removeSavedExperiment: (id: string) => void;
}

export function ScenarioPanel({ state }: { state: ScenarioPanelState }) {
    const {
        savedExperiments,
        experimentLabel,
        setExperimentLabel,
        saveCurrentExperiment,
        loadSavedExperiment,
        removeSavedExperiment,
    } = state;

    return (
        <div className="site-panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">Scenario Library</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Differential holatlarni snapshot qilib saqlang va keyin shu lane bilan qayta solishtiring.
                    </div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {savedExperiments.length} saved
                </div>
            </div>

            <div className="flex gap-3">
                <input
                    value={experimentLabel}
                    onChange={(event) => setExperimentLabel(event.target.value)}
                    placeholder="Scenario label"
                    className="h-11 flex-1 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                />
                <button
                    type="button"
                    onClick={saveCurrentExperiment}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90"
                >
                    Snapshot
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {savedExperiments.length ? savedExperiments.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0" onClick={() => loadSavedExperiment(item)}>
                                <div className="cursor-pointer text-sm font-black text-foreground transition-colors hover:text-accent">
                                    {item.label}
                                </div>
                                <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                                    {item.mode} / {item.expression}
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    p = {item.point} {item.result != null ? `| result: ${item.result}` : ""}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSavedExperiment(item.id)}
                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-8 text-center text-sm leading-7 text-muted-foreground">
                        Hozircha saqlangan scenario yo&apos;q.
                    </div>
                )}
            </div>
        </div>
    );
}
