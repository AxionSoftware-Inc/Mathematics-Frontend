"use client";

import React from "react";
import { Timer, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, TrendingUp, Target, BarChart2, Radio, Atom, Globe, Compass } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { calculateLorentz, getLightConeGeometry, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildParametricSurfaceData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type RelativityBlockId = "setup" | "lorentz" | "cone" | "bridge";

const relativityNotebookBlocks = [
    { id: "setup" as const, label: "Physics Setup", description: "Velocity (v) vs Speed of Light (c)" },
    { id: "lorentz" as const, label: "Lorentz Factors", description: "Gamma (γ) va Time Dilation" },
    { id: "cone" as const, label: "Light Cone", description: "3D Spacetime Geometry" },
    { id: "bridge" as const, label: "Bridge", description: "Export relativistic data" },
];

export function RelativityLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [v, setV] = React.useState("200000000"); // m/s
    const [mode, setMode] = React.useState<"kinematics" | "cone">("kinematics");

    const notebook = useLaboratoryNotebook<RelativityBlockId>({
        storageKey: "mathsphere-lab-relativity-notebook",
        definitions: relativityNotebookBlocks,
        defaultBlocks: ["setup", "lorentz"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const lorentzResult = React.useMemo(() => {
        return calculateLorentz(Number(v));
    }, [v]);

    const coneGeometry = React.useMemo(() => getLightConeGeometry(12), []);
    const coneTraces = React.useMemo(() => {
        return [
            ...buildParametricSurfaceData(coneGeometry.futureSurface, {
                label: "Future cone",
                colorscale: "Turbo",
                opacity: 0.34,
            }),
            ...buildParametricSurfaceData(coneGeometry.pastSurface, {
                label: "Past cone",
                colorscale: "Teal",
                opacity: 0.3,
            }),
            {
                type: "scatter3d",
                mode: "lines",
                x: coneGeometry.axis.map((point) => point.x),
                y: coneGeometry.axis.map((point) => point.y),
                z: coneGeometry.axis.map((point) => point.z),
                line: { color: "#0f172a", width: 7 },
                name: "Time axis",
            },
            ...coneGeometry.nullRays.map((ray, index) => ({
                type: "scatter3d",
                mode: "lines",
                x: ray.map((point) => point.x),
                y: ray.map((point) => point.y),
                z: ray.map((point) => point.z),
                line: { color: "rgba(245,158,11,0.88)", width: index % 2 === 0 ? 5 : 4 },
                name: `Null ray ${index + 1}`,
                showlegend: index < 2,
            })),
            ...coneGeometry.boundaryLoops.map((loop, index) => ({
                type: "scatter3d",
                mode: "lines",
                x: loop.map((point) => point.x),
                y: loop.map((point) => point.y),
                z: loop.map((point) => point.z),
                line: { color: index === 0 ? "#ef4444" : "#2563eb", width: 4, dash: "dot" },
                name: index === 0 ? "Future boundary" : "Past boundary",
            })),
        ];
    }, [coneGeometry]);

    const applyPreset = (p: any) => {
        if (p.type === "3d-cone") {
            setMode("cone");
        } else {
            setMode("kinematics");
            setV(p.v);
        }
    };

    const c = 299792458;

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Relativity Observatorio"
                description="Lorentz o'zgarishlari, Vaqt kengayishi va Fazoviy vaqt egri chiziqlari."
                activeBlocks={notebook.activeBlocks}
                definitions={relativityNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Physics Core</div>
                                    <div className="flex gap-2">
                                        {(["kinematics", "cone"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m === "kinematics" ? "Special Relativity" : "Light Cone Geometry"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center shadow-lg shadow-orange-500/5 transition-all">
                                    <Compass className="mr-2 h-3.5 w-3.5" /> Spacetime: Active
                                </div>
                            </div>

                            {mode === "kinematics" && (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Velocity (v) in m/s (c = 299,792,458)</div>
                                        <input type="number" value={v} onChange={e => setV(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                    <div className="site-outline-card p-4 flex items-center justify-between">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Relativistic Ratio (β = v/c)</div>
                                        <div className="text-xl font-black text-accent">{(Number(v) / c).toFixed(6)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "kinematics" && notebook.hasBlock("lorentz") && lorentzResult && (
                        <div className="space-y-6">
                             <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-6 bg-orange-500/5 border-orange-500/20">
                                    <div className="text-[10px] font-black uppercase text-orange-600 mb-1">Lorentz Factor (γ)</div>
                                    <div className="font-serif text-3xl font-black">{lorentzResult.gamma === Infinity ? '∞' : lorentzResult.gamma.toFixed(8)}</div>
                                </div>
                                <div className="site-outline-card p-6">
                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time Dilation (Δt&apos;)</div>
                                    <div className="font-serif text-3xl font-black">{lorentzResult.dilation === Infinity ? '∞' : lorentzResult.dilation.toFixed(8)}s</div>
                                </div>
                                <div className="site-outline-card p-6">
                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Contraction (1/γ)</div>
                                    <div className="font-serif text-3xl font-black">{lorentzResult.lengthContraction.toFixed(8)}m</div>
                                </div>
                            </div>

                            <div className="site-panel p-6 space-y-4">
                                <div className="site-eyebrow text-accent">Special Relativity Simulation</div>
                                <div className="h-[250px]">
                                    <CartesianPlot 
                                        series={[{ label: "Gamma vs Velocity (v/c)", color: "var(--accent)", points: Array.from({ length: 20 }, (_, i) => {
                                            const vel = (i / 19) * 0.999 * c;
                                            return { x: vel/c, y: calculateLorentz(vel).gamma };
                                        }) }]}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "cone" && notebook.hasBlock("cone") && (
                        <div className="site-panel-strong p-6 space-y-4 min-h-[500px]">
                            <div className="site-eyebrow text-accent">3D Light Cone Representation</div>
                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                Future va past cone endi haqiqiy surface sifatida chiziladi. Null raylar va vaqt o&apos;qi bilan spacetime sabab-oqibat tuzilishi aniq ko&apos;rinadi.
                            </p>
                            <div className="w-full h-[450px]">
                                <ScientificPlot 
                                    type="scatter3d" 
                                    data={coneTraces} 
                                    title="Future and Past Spacetime Geometry"
                                    insights={["future cone", "past cone", "null rays"]}
                                    snapshotFileName="relativity-light-cone"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Physics Presets</div>
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">
                            Maxsus nisbiylik nazariyasidagi daxshatli hodisalarni tekshirish uchun tayyor parametrlar.
                        </p>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.relativity.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.title || 'Special Relativity'}</div>
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
