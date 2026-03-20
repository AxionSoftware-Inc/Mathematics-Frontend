"use client";

import React from "react";
import { Copy, Plus, Send, Zap, Sparkles, Hash, Table as TableIcon, Box, ArrowRight, Activity } from "lucide-react";
import { runMatrixOperation, summarizeMatrix, calculateMatrixTransformation, type MatrixSummary, type MatrixOperationResult, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type MatrixBlockId = "setup" | "analysis" | "visualizer" | "bridge";

const matrixNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Matrix definition va presets" },
    { id: "analysis" as const, label: "Operation", description: "Solver natijalari va heatmap" },
    { id: "visualizer" as const, label: "Visualizer", description: "2D/3D Geometric mapping" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live push" },
];

export function MatrixWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixAInput, setMatrixAInput] = React.useState("1 0 0\n0 1 0\n0 0 1");
    const [operation, setOperation] = React.useState<"determinant" | "inverse" | "eigenvalues" | "transpose">("determinant");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    
    const notebook = useLaboratoryNotebook<MatrixBlockId>({
        storageKey: "mathsphere-lab-matrix-notebook",
        definitions: matrixNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "visualizer"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const matrixA = React.useMemo(() => {
        try {
            return matrixAInput.trim().split("\n").map(row => row.trim().split(/\s+/).map(Number));
        } catch { return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; }
    }, [matrixAInput]);

    let error = "";
    let summary: any = null;
    let opResult: any = null;
    let transformations: any = null;
    let vectorTransformation: any[] = [];

    try {
        summary = summarizeMatrix(matrixA);
        opResult = runMatrixOperation(matrixA, operation, null);
        
        if (matrixA.length >= 2 && matrixA[0].length >= 2) {
            // 2D Transformation vectors (Basis mapping)
            const i = { x: 1, y: 0 };
            const j = { x: 0, y: 1 };
            const Ai = { 
                x: matrixA[0][0] * i.x + matrixA[0][1] * i.y, 
                y: matrixA[1][0] * i.x + matrixA[1][1] * i.y 
            };
            const Aj = { 
                x: matrixA[0][0] * j.x + matrixA[0][1] * j.y, 
                y: matrixA[1][0] * j.x + matrixA[1][1] * j.y 
            };
            
            vectorTransformation = [
                { label: "Original i", color: "#94a3b8", points: [{x: 0, y: 0}, {x: i.x, y: i.y}] },
                { label: "Original j", color: "#cbd5e1", points: [{x: 0, y: 0}, {x: j.x, y: j.y}] },
                { label: "Transformed i", color: "var(--accent)", points: [{x: 0, y: 0}, {x: Ai.x, y: Ai.y}] },
                { label: "Transformed j", color: "#f59e0b", points: [{x: 0, y: 0}, {x: Aj.x, y: Aj.y}] },
            ];
        }

        if (matrixA.length === 3 && matrixA[0].length === 3) {
            transformations = calculateMatrixTransformation(matrixA);
        }
    } catch (e: any) {
        error = e.message;
    }

    const applyPreset = (p: any) => {
        setMatrixAInput(p.A);
        setOperation(p.op);
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Matrix Workbench"
                description="Linear Algebra solver, Eigenvalues va 3D Transformation visualizer."
                activeBlocks={notebook.activeBlocks}
                definitions={matrixNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Linear Space Definition</div>
                                    <div className="flex gap-2">
                                        {(["determinant", "inverse", "eigenvalues", "transpose"] as const).map(op => (
                                            <button key={op} onClick={() => setOperation(op)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${operation === op ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{op}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center">
                                    <TableIcon className="mr-2 h-3.5 w-3.5" /> Simulation Ready
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Matrix A (Rows or Tensor fields)</div>
                                <textarea value={matrixAInput} onChange={e => setMatrixAInput(e.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {summary && (
                                    <>
                                        <div className="site-outline-card p-4"><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">det(A)</div><div className="mt-1 font-serif text-xl font-black">{summary.determinant ?? '--'}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">tr(A)</div><div className="mt-1 font-serif text-xl font-black">{summary.trace ?? '--'}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fro-Norm</div><div className="mt-1 font-serif text-xl font-black">{summary.frobeniusNorm.toFixed(3)}</div></div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && opResult && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Algebraic Solver: {opResult.label}</div>
                            {opResult.matrix ? (
                                <div className="overflow-x-auto rounded-3xl border border-border/60 bg-muted/5 p-8 flex flex-col items-center">
                                     <table className="border-separate border-spacing-3">
                                        <tbody>
                                            {opResult.matrix.map((row: any, i: number) => (
                                                <tr key={i}>
                                                    {row.map((cell: any, j: number) => (
                                                        <td key={j} className="h-12 min-w-[64px] text-center rounded-xl border border-border/40 bg-background/50 text-sm font-mono font-bold text-foreground transition-all hover:bg-accent hover:text-white">
                                                            {typeof cell === 'number' ? cell.toFixed(4).replace(/\.?0+$/, "") : cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                     </table>
                                </div>
                            ) : opResult.values ? (
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {opResult.values.map((v: any, i: number) => (
                                        <div key={i} className="site-outline-card p-5 bg-accent/5 border-accent/20 flex flex-col items-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">λ_{i+1}</div>
                                            <div className="font-serif text-2xl font-black">{typeof v === 'number' ? v.toFixed(6).replace(/\.?0+$/, "") : String(v)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="site-outline-card p-8 bg-accent/90 flex flex-col items-center text-white rounded-[2rem] shadow-xl shadow-accent/20">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Result Value</div>
                                    <div className="font-serif text-5xl font-black">{typeof opResult.scalar === 'number' ? opResult.scalar.toFixed(6).replace(/\.?0+$/, "") : opResult.scalar}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {notebook.hasBlock("visualizer") && (
                        <div className="space-y-6">
                            {/* 2D Vector View */}
                            {vectorTransformation.length > 0 && (
                                <div className="site-panel p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-accent">2D Geometric Essence (Basis Transformation)</div>
                                        <Activity className="h-4 w-4 text-accent/50" />
                                    </div>
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <CartesianPlot
                                            series={vectorTransformation}
                                        />
                                        <div className="p-5 rounded-2xl bg-muted/5 border border-border/60 flex flex-col justify-center">
                                            <div className="text-sm leading-relaxed text-muted-foreground italic font-serif">
                                                Ushbu grafik matritsaning asosiy (bazis) vektorlarni qanday o&apos;zgartirishini ko&apos;rsatadi. 
                                                Ko&apos;k va sarg&apos;ish o&apos;qlar - bu matritsa ta&apos;siridan keyingi yangi bazislar. 
                                                Chiziqli algebraning mohiyati aynan shu egilishdadir.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3D Cube View */}
                            {transformations && (
                                <div className="site-panel p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-accent">3D Linear Mapping (Unit Cube Projection)</div>
                                        <Box className="h-4 w-4 text-accent/50" />
                                    </div>
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <ScientificPlot type="scatter3d" data={transformations.original} title="Input Basis (I)" />
                                        <ScientificPlot type="scatter3d" data={transformations.transformed} title="Output Range (A)" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-accent" />
                             <div className="site-eyebrow text-accent">Structural Presets</div>
                         </div>
                         <div className="grid gap-2">
                            {LABORATORY_PRESETS.matrix.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.op} {(p as any).type ? `• ${(p as any).type}` : ''}</div>
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))}
                         </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(opResult)}
                            exportState={exportState}
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
