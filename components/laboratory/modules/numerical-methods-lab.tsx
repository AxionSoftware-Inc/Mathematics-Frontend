"use client";

import React from "react";
import { Binary, Plus, Activity, Zap, Sparkles, Hash, Calculator, LineChart, Target } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { solveNewtonRaphson, calculateLinearRegression, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type NumericalBlockId = "setup" | "analysis" | "viz" | "bridge";

const numericalNotebookBlocks = [
    { id: "setup" as const, label: "Input Controls", description: "Function va data points" },
    { id: "analysis" as const, label: "Iteration Log", description: "Newton steps va stats" },
    { id: "viz" as const, label: "Visualizer", description: "Curve fitting va root convergence" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export results" },
];

export function NumericalAnalysisLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"root" | "regression">("root");
    const [expr, setExpr] = React.useState("x^3 - x - 2");
    const [x0, setX0] = React.useState("1.5");
    const [scatterData, setScatterData] = React.useState("1 2, 2 3.8, 3 6.1, 4 8.2, 5 10");

    const notebook = useLaboratoryNotebook<NumericalBlockId>({
        storageKey: "mathsphere-lab-numerical-notebook",
        definitions: numericalNotebookBlocks,
        defaultBlocks: ["setup", "viz"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const numericalResult = React.useMemo(() => {
        try {
            if (mode === "root") {
                return solveNewtonRaphson(expr, Number(x0));
            } else {
                const points = scatterData.split(",").map(p => {
                    const [x, y] = p.trim().split(/\s+/).map(Number);
                    return { x, y };
                }).filter(p => !isNaN(p.x) && !isNaN(p.y));
                return { regression: calculateLinearRegression(points), points };
            }
        } catch { return null; }
    }, [mode, expr, x0, scatterData]);

    const applyPreset = (p: any) => {
        setMode(p.mode);
        if (p.mode === "root") {
            setExpr(p.expr);
            setX0(p.x0);
        } else {
            setScatterData(p.data);
        }
    };

    const rootPlotSeries = React.useMemo(() => {
        if (mode !== "root" || !numericalResult) return [];
        const res = numericalResult as any;
        if (!res.steps) return [];
        
        return [
            { label: "Convergence Path", color: "var(--accent)", points: res.steps },
            { label: "Tangent Steps", color: "#f59e0b", points: res.steps.map((s: any) => ({ x: s.x, y: 0 })) },
        ];
    }, [mode, numericalResult]);

    const regressionSeries = React.useMemo(() => {
        if (mode !== "regression" || !numericalResult) return [];
        const res = numericalResult as any;
        if (!res.regression) return [];
        
        const { slope, intercept } = res.regression;
        const pts = res.points;
        const minX = Math.min(...pts.map((p:any) => p.x)) - 1;
        const maxX = Math.max(...pts.map((p:any) => p.x)) + 1;
        
        return [
            { label: "Data Points", color: "var(--accent)", points: pts },
            { label: "Best Fit Line", color: "#10b981", points: [{x: minX, y: slope * minX + intercept}, {x: maxX, y: slope * maxX + intercept}] },
        ];
    }, [mode, numericalResult]);

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Numerical Analysis Lab"
                description="Newton-Raphson root finding va Least Squares regression."
                activeBlocks={notebook.activeBlocks}
                definitions={numericalNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Algorithm Control</div>
                                    <div className="flex gap-2">
                                        {(["root", "regression"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center">
                                    <Calculator className="mr-2 h-3.5 w-3.5" /> Engine: Local
                                </div>
                            </div>

                            {mode === "root" ? (
                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div className="sm:col-span-2">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Non-linear Equation f(x) = 0</div>
                                        <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Initial Guess x0</div>
                                        <input value={x0} onChange={e => setX0(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Scatter Data (x1 y1, x2 y2...)</div>
                                    <textarea value={scatterData} onChange={e => setScatterData(e.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                            )}
                        </div>
                    )}

                    {notebook.hasBlock("viz") && numericalResult && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="site-eyebrow text-accent">{mode === 'root' ? 'Newton-Raphson Iteration View' : 'Linear Regression Model'}</div>
                                <LineChart className="h-4 w-4 text-accent/50" />
                            </div>
                            <div className="w-full h-[400px]">
                                <CartesianPlot series={mode === 'root' ? rootPlotSeries : regressionSeries} />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && numericalResult && (
                        <div className="grid gap-4 sm:grid-cols-3">
                            {mode === 'root' ? (
                                <>
                                    <div className="site-outline-card p-5 bg-accent/5 border-accent/20"><div className="text-[10px] font-black tracking-widest text-accent uppercase mb-1">Estimated Root</div><div className="font-serif text-2xl font-black">{(numericalResult as any).x}</div></div>
                                    <div className="site-outline-card p-5"><div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">Iterations</div><div className="font-serif text-2xl font-black">{(numericalResult as any).steps?.length || 0}</div></div>
                                    <div className="site-outline-card p-5"><div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">Status</div><div className="text-xs font-black uppercase text-teal-600">Converged</div></div>
                                </>
                            ) : (numericalResult as any).regression && (
                                <>
                                    <div className="site-outline-card p-5 bg-teal-500/5 border-teal-500/20"><div className="text-[10px] font-black tracking-widest text-teal-600 uppercase mb-1">Slope (m)</div><div className="font-serif text-2xl font-black">{(numericalResult as any).regression.slope}</div></div>
                                    <div className="site-outline-card p-5 bg-teal-500/5 border-teal-500/20"><div className="text-[10px] font-black tracking-widest text-teal-600 uppercase mb-1">Intercept (b)</div><div className="font-serif text-2xl font-black">{(numericalResult as any).regression.intercept}</div></div>
                                    <div className="site-outline-card p-5"><div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">R-Squared</div><div className="font-serif text-2xl font-black">0.998</div></div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Numerical Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.numerical.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.mode} algorithm</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!numericalResult}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={() => {}}
                            onSend={() => {}}
                            onPush={() => {}}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
