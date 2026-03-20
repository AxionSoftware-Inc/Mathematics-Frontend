"use client";

import React, { useTransition } from "react";
import { Copy, Plus, Send, Zap, Sparkles, Hash, Table as TableIcon, Box, ArrowRight, Activity, Loader2, Maximize2 } from "lucide-react";
import { runMatrixOperation, summarizeMatrix, calculateMatrixTransformation, type MatrixSummary, type MatrixOperationResult, type PlotPoint3D, type MatrixTransformation3D, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildWireframe3DData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLabEngine } from "@/components/laboratory/lab-engine";

type MatrixBlockId = "setup" | "analysis" | "visualizer" | "bridge";

const matrixNotebookBlocks = [
    { id: "setup" as const, label: "Tensor Workspace", description: "Matrix definition va presets" },
    { id: "analysis" as const, label: "Algebraic Solver", description: "Solver natijalari va heatmap" },
    { id: "visualizer" as const, label: "Spatial Mapping", description: "2D/3D Geometric mapping" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live push" },
];

export function MatrixWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixAInput, setMatrixAInput] = React.useState("1 0 0\n0 1 0\n0 0 1");
    const [operation, setOperation] = React.useState<"determinant" | "inverse" | "eigenvalues" | "transpose">("determinant");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [isPending, startTransition] = useTransition();
    
    const { setCalculating, setError } = useLabEngine();

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

    // DERIVED DATA
    const { 
        summary, 
        opResult, 
        transformations, 
        vectorTransformation, 
        calcError 
    } = React.useMemo(() => {
        let errorMsg = "";
        let summaryRes: MatrixSummary | null = null;
        let opResultRes: MatrixOperationResult | null = null;
        let transformationsRes: MatrixTransformation3D | null = null;
        let vectorTransformationRes: Array<{ label: string; color: string; points: Array<{ x: number; y: number }> }> = [];

        try {
            summaryRes = summarizeMatrix(matrixA);
            opResultRes = runMatrixOperation(matrixA, operation, null);
            
            if (matrixA.length >= 2 && matrixA[0].length >= 2) {
                const i = { x: 1, y: 0 };
                const j = { x: 0, y: 1 };
                const Ai = { 
                    x: matrixA[0][0] * i.x + (matrixA[0][1] || 0) * i.y, 
                    y: (matrixA[1]?.[0] || 0) * i.x + (matrixA[1]?.[1] || 0) * i.y 
                };
                const Aj = { 
                    x: matrixA[0][0] * j.x + (matrixA[0][1] || 0) * j.y, 
                    y: (matrixA[1]?.[0] || 0) * j.x + (matrixA[1]?.[1] || 0) * j.y 
                };
                
                vectorTransformationRes = [
                    { label: "Basis i", color: "var(--accent)", points: [{x: 0, y: 0}, {x: Ai.x, y: Ai.y}] },
                    { label: "Basis j", color: "#f59e0b", points: [{x: 0, y: 0}, {x: Aj.x, y: Aj.y}] },
                ];
            }

            if (matrixA.length === 3 && matrixA[0].length === 3) {
                transformationsRes = calculateMatrixTransformation(matrixA);
            }
        } catch (e: any) {
            errorMsg = e.message;
        }

        return { 
            summary: summaryRes, 
            opResult: opResultRes, 
            transformations: transformationsRes, 
            vectorTransformation: vectorTransformationRes,
            calcError: errorMsg
        };
    }, [matrixA, operation]);

    React.useEffect(() => {
        setError(calcError || null);
    }, [calcError, setError]);

    const originalTransformationTraces = React.useMemo(() => {
        if (!transformations) {
            return [];
        }

        return [
            ...buildWireframe3DData(transformations.original, transformations.edges, {
                label: "Original cube",
                lineColor: "#64748b",
                markerColor: "#94a3b8",
            }),
            ...transformations.basisVectors.map((vector) => ({
                type: "scatter3d",
                mode: "lines+markers",
                name: `${vector.label} original`,
                x: vector.original.map((point: PlotPoint3D) => point.x),
                y: vector.original.map((point: PlotPoint3D) => point.y),
                z: vector.original.map((point: PlotPoint3D) => point.z),
                line: { width: 7, color: vector.color },
                marker: { size: [0, 5], color: [vector.color, vector.color] },
            })),
        ];
    }, [transformations]);

    const transformedTraces = React.useMemo(() => {
        if (!transformations) {
            return [];
        }

        return [
            ...buildWireframe3DData(transformations.transformed, transformations.edges, {
                label: "Transformed cube",
                lineColor: "#2563eb",
                markerColor: "#0f766e",
            }),
            ...transformations.basisVectors.map((vector) => ({
                type: "scatter3d",
                mode: "lines+markers",
                name: `${vector.label} transformed`,
                x: vector.transformed.map((point: PlotPoint3D) => point.x),
                y: vector.transformed.map((point: PlotPoint3D) => point.y),
                z: vector.transformed.map((point: PlotPoint3D) => point.z),
                line: { width: 7, color: vector.color },
                marker: { size: [0, 5], color: [vector.color, vector.color] },
            })),
        ];
    }, [transformations]);

    const handleMatrixChange = (val: string) => {
        startTransition(() => {
            setMatrixAInput(val);
        });
    };

    const applyPreset = (p: any) => {
        startTransition(() => {
            setMatrixAInput(p.A);
            setOperation(p.op);
        });
    };

    return (
        <div className="space-y-6">
            <LaboratoryNotebookToolbar
                title="Tensor Analytical Console"
                description="Advanced Matrix Algebra Engine with multidimensional basis mapping and eigenvalues decomposition."
                activeBlocks={notebook.activeBlocks}
                definitions={matrixNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-8 min-w-0">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel relative overflow-hidden p-8 shadow-[0_45px_100px_-50px_rgba(15,23,42,0.42)]">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_50%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
                            
                            <div className="relative space-y-8">
                                <div className="flex flex-wrap items-end justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                            <div className="site-eyebrow text-accent">Tensor Dimension Definition</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(["determinant", "inverse", "eigenvalues", "transpose"] as const).map(op => (
                                                <button 
                                                    key={op} 
                                                    onClick={() => setOperation(op)} 
                                                    className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                                        operation === op 
                                                            ? 'bg-foreground text-background shadow-xl scale-105' 
                                                            : 'bg-muted/5 text-muted-foreground border border-border/40 hover:bg-muted/10'
                                                    }`}
                                                >
                                                    {op}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-700 ${isPending ? "border-accent/40 bg-accent/5 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"}`}>
                                        <Activity className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.28em]">{isPending ? "Optimizing Space" : "Engine Stable"}</span>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-accent/20 to-emerald-500/10 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
                                    <div className="relative">
                                        <div className="mb-3 flex items-center justify-between px-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">Input Rows / Tensor Map</div>
                                            <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-accent/60">
                                                <span>{summary?.rows || 0} x {summary?.columns || 0}</span>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <span>{summary?.isSquare ? "SQUARE" : "RECT"}</span>
                                            </div>
                                        </div>
                                        <textarea 
                                            value={matrixAInput} 
                                            onChange={e => handleMatrixChange(e.target.value)} 
                                            className="min-h-[140px] w-full rounded-[1.75rem] border-2 border-border/40 bg-background/40 backdrop-blur-xl px-6 py-5 text-base font-mono font-bold italic tracking-tight focus:border-accent/60 focus:ring-4 focus:ring-accent/5 outline-none transition-all duration-500 shadow-sm" 
                                            placeholder="e.g. 1 0 0\n0 1 0\n0 0 1"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {summary && (
                                        <>
                                            <MetricCard label="det(A)" value={summary.determinant?.toFixed(2) ?? "N/A"} icon={<Maximize2 className="h-3 w-3" />} />
                                            <MetricCard label="Trace" value={summary.trace?.toFixed(2) ?? "N/A"} icon={<Hash className="h-3 w-3" />} />
                                            <MetricCard label="Fro-Norm" value={summary.frobeniusNorm.toFixed(3)} icon={<Activity className="h-3 w-3" />} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && opResult && (
                        <div className="site-panel-strong relative overflow-hidden p-8 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.5)]">
                             <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-accent/5 to-transparent" />
                             
                             <div className="relative space-y-8">
                                <div className="flex items-center gap-4">
                                     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                                         <Zap className="h-5 w-5 text-accent" />
                                     </div>
                                     <div className="site-eyebrow text-accent">Algebraic Kernel: {opResult.label}</div>
                                </div>

                                {opResult.matrix ? (
                                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-muted/5 p-12 shadow-inner transition-colors hover:border-accent/20">
                                         <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                                         <div className="relative flex justify-center">
                                             <table className="border-separate border-spacing-4">
                                                <tbody>
                                                    {opResult.matrix.map((row: any, i: number) => (
                                                        <tr key={i}>
                                                            {row.map((cell: any, j: number) => (
                                                                <td key={j} className="h-16 min-w-[80px] text-center rounded-2xl border border-white/5 bg-white/5 text-lg font-mono font-black italic shadow-sm backdrop-blur-md transition-all duration-500 hover:bg-foreground hover:text-background hover:-translate-y-1 hover:shadow-xl">
                                                                    {typeof cell === 'number' ? cell.toFixed(4).replace(/\.?0+$/, "") : cell}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                             </table>
                                         </div>
                                    </div>
                                ) : opResult.values ? (
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {opResult.values.map((v: any, i: number) => (
                                            <div key={i} className="site-outline-card group relative p-6 bg-accent/5 border-accent/20 flex flex-col items-center overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:bg-accent/10">
                                                <div className="absolute -right-4 -top-4 text-accent/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                                                    <Zap className="h-16 w-16" />
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-accent/60 mb-3">Eigen λ_{i+1}</div>
                                                <div className="font-serif text-3xl font-black italic tracking-tighter text-foreground">{typeof v === 'number' ? v.toFixed(6).replace(/\.?0+$/, "") : String(v)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative site-panel p-10 bg-gradient-to-br from-slate-900 via-accent-dark to-slate-900 ring-2 ring-white/10 flex flex-col items-center text-white rounded-[2.5rem] shadow-2xl shadow-accent/40">
                                        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                                                <Sparkles className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-3">Scalar Magnitude</div>
                                            <div className="font-serif text-6xl font-black italic tracking-tighter shadow-sm">{typeof opResult.scalar === 'number' ? opResult.scalar.toFixed(6).replace(/\.?0+$/, "") : opResult.scalar}</div>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {notebook.hasBlock("visualizer") && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {/* 2D Vector View */}
                            {vectorTransformation.length > 0 && (
                                <div className="site-panel p-8 space-y-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.32)]">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-5">
                                        <div className="flex items-center gap-4">
                                            <Activity className="h-5 w-5 text-accent" />
                                            <div className="site-eyebrow text-accent">Basis Mapping Essence</div>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Calculated Real-time</div>
                                    </div>
                                    <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
                                        <div className="h-[400px]">
                                            <CartesianPlot series={vectorTransformation} height={400} />
                                        </div>
                                        <div className="flex flex-col justify-center space-y-6">
                                            <div className="space-y-4">
                                                <div className="h-px w-12 bg-accent/30" />
                                                <p className="text-sm leading-relaxed text-muted-foreground italic font-serif">
                                                    Matritsa chiziqli fazoni qanday egishini kuzating. Rangli o'qlar - bu x va y bazislarining yangi holati.
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-accent" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground/80">Basis I (Transformed)</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground/80">Basis J (Transformed)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3D Cube View */}
                            {transformations && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <Box className="h-5 w-5 text-accent" />
                                        <div className="site-eyebrow text-accent tracking-[0.3em]">UNIT CUBE PROJECTION MAP</div>
                                    </div>
                                    <p className="px-2 text-sm leading-6 text-muted-foreground">
                                        Har bir kub endi wireframe, vertex va bazis vektorlar bilan chiziladi. Shu sabab aylantirish, shear va scale farqi darhol ko&apos;rinadi.
                                        {typeof transformations.determinant === "number" ? ` det(A) = ${transformations.determinant.toFixed(3)}.` : ""}
                                    </p>
                                    <div className="grid gap-8 lg:grid-cols-2">
                                        <ScientificPlot 
                                            type="scatter3d" 
                                            data={originalTransformationTraces} 
                                            title="Standard Euclidean Basis (I)" 
                                            height={450} 
                                            insights={["reference cube", "basis vectors", "camera presets"]}
                                            snapshotFileName="matrix-original-cube"
                                        />
                                        <ScientificPlot 
                                            type="scatter3d" 
                                            data={transformedTraces} 
                                            title="Projected Tensor Range (A)" 
                                            height={450} 
                                            insights={["transformed cube", "basis deformation", "determinant view"]}
                                            snapshotFileName="matrix-transformed-cube"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* PRESETS PANEL */}
                    <div className="site-panel-strong p-8 ring-1 ring-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                         <div className="flex items-center gap-3 mb-6">
                             <Sparkles className="h-5 w-5 text-accent" />
                             <div className="site-eyebrow text-accent">Structural Presets</div>
                         </div>
                         <div className="grid gap-3">
                            {LABORATORY_PRESETS.matrix.map(p => (
                                <button 
                                    key={p.label} 
                                    onClick={() => applyPreset(p)} 
                                    className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 transition-all duration-500 hover:border-accent/40 hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/5 overflow-hidden"
                                >
                                    <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-5 transition-opacity duration-700">
                                        <TableIcon className="h-12 w-12 text-accent" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-sm font-black italic tracking-tight text-foreground group-hover:text-accent font-serif transition-colors duration-500">{p.label}</div>
                                        <div className="mt-1 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">{p.op} {(p as any).type ? `• ${(p as any).type}` : ''}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 ease-spring" />
                                </button>
                            ))}
                         </div>
                    </div>

                    <div className="site-panel-strong p-8 ring-1 ring-white/10">
                         <div className="flex items-center gap-3 mb-6">
                             <Activity className="h-5 w-5 text-accent" />
                             <div className="site-eyebrow text-accent">Engine Status</div>
                         </div>
                         <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                 <span className="text-xs font-medium text-muted-foreground">Computation Thread</span>
                                 <span className="text-[10px] font-black uppercase text-emerald-500">Active</span>
                             </div>
                             <div className="flex items-center justify-between">
                                 <span className="text-xs font-medium text-muted-foreground">Visualization Stream</span>
                                 <span className="text-[10px] font-black uppercase text-emerald-500">WebGL 2.0</span>
                             </div>
                             <div className="pt-4 border-t border-white/5">
                                 <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">Mathjs Engine Cluster</div>
                                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                     <div className={`h-full bg-accent transition-all duration-1000 ${isPending ? "w-1/2 translate-x-1/2" : "w-full"}`} />
                                 </div>
                             </div>
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

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="site-outline-card relative group p-5 bg-background/40 backdrop-blur-sm border-white/5 transition-all duration-500 hover:bg-white/5 hover:border-white/10">
            <div className="absolute top-4 right-4 text-muted-foreground/20 group-hover:text-accent/30 transition-colors duration-500">
                {icon}
            </div>
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</div>
            <div className="mt-2 font-serif text-2xl font-black italic tracking-tighter text-foreground">{value}</div>
        </div>
    );
}
