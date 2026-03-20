"use client";

import React from "react";
import { Grid3X3, Plus, Activity, Zap, Sparkles, Hash, Layers, Target, Scale, SquareEqual } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { solveLinearSystem, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type LinearBlockId = "setup" | "system" | "result" | "bridge";

const linearNotebookBlocks = [
    { id: "setup" as const, label: "Coefficient Matrix", description: "Matrix A va Vector B input" },
    { id: "system" as const, label: "Equation View", description: "Symbolic system representation" },
    { id: "result" as const, label: "Solution Vector", description: "Calculated unknowns (X)" },
    { id: "bridge" as const, label: "Bridge", description: "Export linear system results" },
];

export function LinearAlgebraStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixInput, setMatrixInput] = React.useState("2 1 -1, -3 -1 2, -2 1 2");
    const [bInput, setBInput] = React.useState("8, -11, -3");
    const [status, setStatus] = React.useState<"idle" | "solving" | "done" | "error">("idle");
    
    const notebook = useLaboratoryNotebook<LinearBlockId>({
        storageKey: "mathsphere-lab-linear-notebook",
        definitions: linearNotebookBlocks,
        defaultBlocks: ["setup", "system", "result"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const linearResult = React.useMemo(() => {
        try {
            const matrix = matrixInput.split(",").map(row => row.trim().split(/\s+/).map(Number));
            const b = bInput.split(",").map(v => Number(v.trim()));
            
            if (matrix.length !== b.length) throw new Error("Matrix va Vector o'lchami mos kelmadi.");
            
            const solution = solveLinearSystem(matrix, b);
            return { matrix, b, solution };
        } catch (e: any) { 
            return { error: e.message };
        }
    }, [matrixInput, bInput]);

    const applyPreset = (p: any) => {
        setMatrixInput(p.matrix);
        setBInput(p.b);
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Linear Algebra Studio"
                description="Gaussian elimination, Chiziqli tenglamalar sistemasi va Vector spaces tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={linearNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Linear Space Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground">Gaussian Elimination Solver</div>
                                </div>
                                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center shadow-lg shadow-blue-500/5 transition-all">
                                    <SquareEqual className="mr-2 h-3.5 w-3.5" /> Ax = B
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Coefficient Matrix A (Rows by comma)</div>
                                    <textarea value={matrixInput} onChange={e => setMatrixInput(e.target.value)} className="min-h-[120px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Constant Vector B (Comma sep)</div>
                                    <textarea value={bInput} onChange={e => setBInput(e.target.value)} className="min-h-[120px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("system") && linearResult && !linearResult.error && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Formal Equation Representation</div>
                            <div className="grid gap-4">
                                {(linearResult as any).matrix.map((row: number[], i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-mono font-black text-foreground/80">
                                        <div className="flex-1 flex gap-2">
                                            {row.map((val, j) => (
                                                <span key={j} className="opacity-80">
                                                    {val >= 0 ? (j === 0 ? '' : '+ ') : '- '}
                                                    {Math.abs(val)}x<sub>{j+1}</sub>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="w-4 text-center text-accent">=</div>
                                        <div className="w-12 text-accent">{(linearResult as any).b[i]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("result") && linearResult && (
                        <div className="site-panel p-6 space-y-6">
                             <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Solution Vector X</div>
                            </div>
                            {linearResult.error ? (
                                <div className="text-sm font-mono text-rose-500 font-bold bg-rose-500/5 p-4 rounded-xl border border-rose-500/20">{linearResult.error}</div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-4">
                                    {(linearResult as any).solution.map((val: number, i: number) => (
                                        <div key={i} className="site-outline-card p-5 bg-blue-500/5 border-blue-500/20">
                                            <div className="text-[10px] font-black uppercase text-blue-600 mb-1">x<sub>{i+1}</sub></div>
                                            <div className="font-serif text-2xl font-black">{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Linear Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.linear.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">System configuration</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!linearResult.error}
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
