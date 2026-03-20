"use client";

import React from "react";
import { Atom, Maximize2, Move, Sparkles, Target, Zap, Waves, Activity } from "lucide-react";
import { complex, evaluate } from "mathjs";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot, buildSurfaceData } from "@/components/laboratory/scientific-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type ComplexBlockId = "setup" | "fractal" | "mapping" | "bridge";

const complexNotebookBlocks = [
    { id: "setup" as const, label: "Variable Control", description: "Complex parameters va grid setup" },
    { id: "fractal" as const, label: "Fractal Engine", description: "Mandelbrot va Julia sets (Canvas)" },
    { id: "mapping" as const, label: "Function Map", description: "Conformal mapping va 3D surface" },
    { id: "bridge" as const, label: "Bridge", description: "Export results" },
];

export function ComplexAnalysisWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"fractal" | "mapping">("fractal");
    const [fractalType, setFractalType] = React.useState<"mandelbrot" | "julia">("mandelbrot");
    const [juliaC, setJuliaC] = React.useState({ re: -0.8, im: 0.156 });
    const [expr, setExpr] = React.useState("z^2 + c");
    const [view, setView] = React.useState({ x: -0.5, y: 0, zoom: 1 });
    
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const notebook = useLaboratoryNotebook<ComplexBlockId>({
        storageKey: "mathsphere-lab-complex-notebook",
        definitions: complexNotebookBlocks,
        defaultBlocks: ["setup", "fractal"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    // Fractal rendering logic (optimized Canvas)
    const renderFractal = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const maxIter = 100;
        const scale = 2 / (width * view.zoom);

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                let x0 = (px - width / 2) * scale + view.x;
                let y0 = (py - height / 2) * scale + view.y;

                let x = fractalType === "mandelbrot" ? 0 : x0;
                let y = fractalType === "mandelbrot" ? 0 : y0;
                let cx = fractalType === "mandelbrot" ? x0 : juliaC.re;
                let cy = fractalType === "mandelbrot" ? y0 : juliaC.im;

                let i = 0;
                while (x * x + y * y <= 4 && i < maxIter) {
                    let xtemp = x * x - y * y + cx;
                    y = 2 * x * y + cy;
                    x = xtemp;
                    i++;
                }

                const offset = (py * width + px) * 4;
                if (i === maxIter) {
                    data[offset] = data[offset + 1] = data[offset + 2] = 0;
                } else {
                    const color = i * 2.5;
                    data[offset] = color;
                    data[offset + 1] = color * 0.5;
                    data[offset + 2] = 128 + color * 0.5;
                }
                data[offset + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }, [fractalType, view, juliaC]);

    React.useEffect(() => {
        if (notebook.hasBlock("fractal")) renderFractal();
    }, [renderFractal, notebook.activeBlocks]);

    // Mapping logic
    const mappingPoints = React.useMemo(() => {
        if (mode !== "mapping") return null;
        const points = [];
        const mapped = [];
        const step = 0.5;
        const range = 2;
        try {
            const compiled = evaluate(expr.replace(/z/g, "complex(x, y)")); // Simplified for preview
            for (let x = -range; x <= range; x += step) {
                for (let y = -range; y <= range; y += step) {
                    const z = complex(x, y);
                    const res = evaluate(expr, { z });
                    points.push({ x, y });
                    mapped.push({ x: res.re, y: res.im });
                }
            }
            return { points, mapped };
        } catch { return null; }
    }, [expr, mode]);

    const applyPreset = (p: any) => {
        if (p.type === "fractal") {
            setMode("fractal");
            setFractalType(p.fractal);
            if (p.fractal === "julia") { setJuliaC({ re: p.cr, im: p.ci }); }
            setView({ x: p.cx || 0, y: p.cy || 0, zoom: p.zoom || 1 });
        } else {
            setMode("mapping");
            setExpr(p.expr);
        }
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Complex Analysis Workbench"
                description="Holomorphic functions, Fractals va Conformal mappings."
                activeBlocks={notebook.activeBlocks}
                definitions={complexNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Complex Logic Center</div>
                                    <div className="flex gap-2">
                                        {(["fractal", "mapping"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center">
                                    <Waves className="mr-2 h-3.5 w-3.5" /> Phase Sync
                                </div>
                            </div>

                            {mode === "fractal" ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="site-outline-card p-4 space-y-3">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</div>
                                        <select value={fractalType} onChange={e => setFractalType(e.target.value as any)} className="w-full bg-transparent font-black uppercase text-xs outline-none">
                                            <option value="mandelbrot">Mandelbrot</option>
                                            <option value="julia">Julia</option>
                                        </select>
                                    </div>
                                    {fractalType === "julia" && (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1"><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">C Real</div><input value={juliaC.re} onChange={e => setJuliaC({...juliaC, re: Number(e.target.value)})} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                            <div className="site-outline-card p-4 space-y-1"><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">C Imag</div><input value={juliaC.im} onChange={e => setJuliaC({...juliaC, im: Number(e.target.value)})} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Expression f(z)</div>
                                    <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "fractal" && notebook.hasBlock("fractal") && (
                        <div className="site-panel-strong p-4 overflow-hidden flex justify-center bg-black">
                            <canvas ref={canvasRef} width={600} height={400} className="rounded-2xl border border-border/20 shadow-2xl" />
                        </div>
                    )}

                    {mode === "mapping" && notebook.hasBlock("mapping") && mappingPoints && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Conformal Mapping View</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Original Z Plane</div>
                                    <CartesianPlot series={[{ label: "Z-Grid", color: "var(--muted-foreground)", points: mappingPoints.points }]} />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-accent text-center">Mapped W Plane</div>
                                    <CartesianPlot series={[{ label: "W-Grid", color: "var(--accent)", points: mappingPoints.mapped }]} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Complex Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.complex.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.type}</div>
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
                            onPush={() => {}}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
