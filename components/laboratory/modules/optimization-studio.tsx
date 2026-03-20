"use client";

import React from "react";
import { Focus, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, TrendingDown, Target, BarChart2 } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { buildOptimizationLandscape, solveGradientDescent, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildScatter3DTrajectoryData, buildSurfaceData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type OptBlockId = "setup" | "surface" | "history" | "bridge";

const optNotebookBlocks = [
    { id: "setup" as const, label: "Optimization Setup", description: "Cost function va LR parameters" },
    { id: "surface" as const, label: "Convergence Map", description: "3D Gradient Descent path" },
    { id: "history" as const, label: "Loss Log", description: "Iterative steps va convergence speed" },
    { id: "bridge" as const, label: "Bridge", description: "Export training data" },
];

export function OptimizationStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [expr, setExpr] = React.useState("x^2 + y^2");
    const [x0, setX0] = React.useState("2.0");
    const [y0, setY0] = React.useState("2.0");
    const [lr, setLr] = React.useState("0.1");
    const [epochs, setEpochs] = React.useState("25");
    
    const notebook = useLaboratoryNotebook<OptBlockId>({
        storageKey: "mathsphere-lab-opt-notebook",
        definitions: optNotebookBlocks,
        defaultBlocks: ["setup", "surface"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const optimizationResult = React.useMemo(() => {
        try {
            return solveGradientDescent(expr, Number(x0), Number(y0), Number(lr), Number(epochs));
        } catch { return null; }
    }, [expr, x0, y0, lr, epochs]);

    const optimizationLandscape = React.useMemo(() => {
        if (!optimizationResult) {
            return null;
        }

        try {
            return buildOptimizationLandscape(expr, optimizationResult);
        } catch {
            return null;
        }
    }, [expr, optimizationResult]);

    const applyPreset = (p: any) => {
        setExpr(p.expr);
        setX0(p.x0);
        setY0(p.y0);
        setLr(p.lr || "0.1");
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Optimization Studio"
                description="Cost functions tahlili, Gradient Descent va parameter tuning."
                activeBlocks={notebook.activeBlocks}
                definitions={optNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Stochastic Gradient Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground">Parameter Space Analysis</div>
                                </div>
                                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 flex items-center shadow-lg shadow-violet-500/5 transition-all">
                                    <TrendingDown className="mr-2 h-3.5 w-3.5" /> Minimization Active
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Cost Function J(x, y)</div>
                                    <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Initial X</div><input value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Initial Y</div><input value={y0} onChange={e => setY0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rate (η)</div><input value={lr} onChange={e => setLr(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Epochs</div><input value={epochs} onChange={e => setEpochs(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("surface") && optimizationResult && optimizationLandscape && (
                        <div className="site-panel-strong p-6 space-y-4 min-h-[500px]">
                            <div className="site-eyebrow text-accent">Optimization Path (3D Landscape)</div>
                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                Cost surface va gradient descent yo&apos;li bitta sahnada ko&apos;rinadi, shu sabab minimizatsiya jarayoni ancha tushunarli bo&apos;ladi.
                            </p>
                            <div className="w-full h-[450px]">
                                <ScientificPlot 
                                    type="scatter3d" 
                                    data={[
                                        ...buildSurfaceData(optimizationLandscape.surfaceSamples, { label: "Loss surface", colorscale: "Turbo" }),
                                        ...buildScatter3DTrajectoryData(optimizationLandscape.path, {
                                            label: "Gradient descent path",
                                            lineColor: "#0f766e",
                                            startColor: "#ef4444",
                                            endColor: "#f59e0b",
                                        }),
                                    ]} 
                                    title={`Path to Minima (η=${lr})`}
                                    insights={["surface landscape", "descent trajectory", "camera presets"]}
                                    snapshotFileName="optimization-landscape"
                                />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("history") && optimizationResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Convergence Log</div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-5 bg-violet-500/5 border-violet-500/20"><div className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">Final Loss</div><div className="font-serif text-2xl font-black">{optimizationResult[optimizationResult.length - 1].z.toFixed(8)}</div></div>
                                <div className="site-outline-card p-5"><div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Final X</div><div className="font-serif text-2xl font-black">{optimizationResult[optimizationResult.length - 1].x.toFixed(4)}</div></div>
                                <div className="site-outline-card p-5"><div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Final Y</div><div className="font-serif text-2xl font-black">{optimizationResult[optimizationResult.length - 1].y.toFixed(4)}</div></div>
                            </div>
                            
                            <div className="h-[250px]">
                                <CartesianPlot 
                                    series={[{ label: "Loss Trend", color: "var(--accent)", points: optimizationResult.map((p, i) => ({ x: i, y: p.z })) }]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Cost Functions</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.optimization.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">Optimization preset</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!optimizationResult}
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
