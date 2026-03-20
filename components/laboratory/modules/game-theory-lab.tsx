"use client";

import React from "react";
import { Swords, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, TrendingUp, Target, BarChart2, BrainCircuit } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { findNashEquilibrium, runEvolutionarySim, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";

type GameBlockId = "setup" | "payoff" | "evolution" | "bridge";

const gameNotebookBlocks = [
    { id: "setup" as const, label: "Game Setup", description: "Matrix payload va Pop settings" },
    { id: "payoff" as const, label: "Strategic View", description: "Nash Equilibrium visualizer" },
    { id: "evolution" as const, label: "Population Lab", description: "Evolutionary dynamics chart" },
    { id: "bridge" as const, label: "Bridge", description: "Export game stats" },
];

export function GameTheoryLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"matrix" | "evolution">("matrix");
    
    // Matrix State
    const [payoffInput, setPayoffInput] = React.useState("3,3 0,5; 5,0 1,1");
    
    // Evolution State
    const [popH, setPopH] = React.useState("10");
    const [popD, setPopD] = React.useState("90");
    const [costV, setCostV] = React.useState("50");
    const [costC, setCostC] = React.useState("100");

    const notebook = useLaboratoryNotebook<GameBlockId>({
        storageKey: "mathsphere-lab-game-notebook",
        definitions: gameNotebookBlocks,
        defaultBlocks: ["setup", "payoff"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const matrixResults = React.useMemo(() => {
        if (mode !== "matrix") return null;
        try {
            const rows = payoffInput.split(";").map(r => r.trim());
            const matrix = rows.map(r => r.split(/\s+/).map(pair => {
                const [a, b] = pair.split(",").map(Number);
                return { a, b };
            }));
            const equilibria = findNashEquilibrium(matrix);
            return { matrix, equilibria };
        } catch { return { error: "Matrix format xato." }; }
    }, [payoffInput, mode]);

    const evolutionResults = React.useMemo(() => {
        if (mode !== "evolution") return null;
        try {
            return runEvolutionarySim({ hawk: Number(popH), dove: Number(popD) }, { v: Number(costV), c: Number(costC) });
        } catch { return null; }
    }, [popH, popD, costV, costC, mode]);

    const applyPreset = (pr: any) => {
        if (pr.label.includes("Evolution")) {
            setMode("evolution");
            setPopH(pr.hawk); setPopD(pr.dove);
            setCostV(pr.v); setCostC(pr.c);
        } else {
            setMode("matrix");
            setPayoffInput(pr.matrix);
        }
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Game Theory Lab"
                description="Nash Equilibrium, Payoff tahlili va Evolutsion biologiya dinamikasi."
                activeBlocks={notebook.activeBlocks}
                definitions={gameNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Decision Logic Center</div>
                                    <div className="flex gap-2">
                                        {(["matrix", "evolution"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center">
                                    <BrainCircuit className="mr-2 h-3.5 w-3.5" /> Strategy: Stable
                                </div>
                            </div>

                            {mode === "matrix" ? (
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Payoff Matrix (A,B A,B; A,B A,B)</div>
                                    <textarea value={payoffInput} onChange={e => setPayoffInput(e.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase">Hawk Pop</div><input value={popH} onChange={e => setPopH(e.target.value)} className="w-full bg-transparent font-mono text-xs font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase">Dove Pop</div><input value={popD} onChange={e => setPopD(e.target.value)} className="w-full bg-transparent font-mono text-xs font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase">Reward (V)</div><input value={costV} onChange={e => setCostV(e.target.value)} className="w-full bg-transparent font-mono text-xs font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase">Cost (C)</div><input value={costC} onChange={e => setCostC(e.target.value)} className="w-full bg-transparent font-mono text-xs font-bold outline-none" /></div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "matrix" && matrixResults && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Strategic Interaction Map</div>
                            <div className="grid justify-center">
                                <div className="flex flex-col border border-border/60 rounded-2xl overflow-hidden shadow-2xl">
                                    {(matrixResults as any).matrix?.map((row:any, rIdx:number) => (
                                        <div key={rIdx} className="flex">
                                            {row.map((pair:any, cIdx:number) => {
                                                const isNash = (matrixResults as any).equilibria?.some((e:any) => e.r === rIdx && e.c === cIdx);
                                                return (
                                                    <div key={cIdx} className={`w-32 h-32 flex flex-col items-center justify-center border border-border/40 transition-colors ${isNash ? 'bg-rose-500/10 border-rose-500/30' : 'bg-muted/5'}`}>
                                                        {isNash && <div className="absolute -mt-20 text-[8px] font-black text-rose-600 bg-rose-200 px-2 py-0.5 rounded-full uppercase">Nash Eq</div>}
                                                        <div className="text-xl font-black">{pair.a}, {pair.b}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "evolution" && evolutionResults && (
                        <div className="site-panel-strong p-6 space-y-4">
                            <div className="site-eyebrow text-accent">Population Dynamics Chart</div>
                            <div className="h-[400px]">
                                <CartesianPlot 
                                    series={[
                                        { label: "Hawks (Aggressive)", color: "var(--accent)", points: evolutionResults.map((p, i) => ({ x: i, y: p.hawk })) },
                                        { label: "Doves (Passive)", color: "#10b981", points: evolutionResults.map((p, i) => ({ x: i, y: p.dove })) }
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-accent" />
                             <div className="site-eyebrow text-accent">Game Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.game.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">Scenario template</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={true}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={() => {}}
                            onSend={() => {}}
                            onPush={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
