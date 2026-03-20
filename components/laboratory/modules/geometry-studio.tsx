"use client";

import React from "react";
import { Activity, Target, Ruler, CircleDot, Move, Sparkles } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { analyzeAnalyticGeometry, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, createLaboratoryWriterDraftHref, queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type PointKey = "ax" | "ay" | "bx" | "by" | "cx" | "cy" | "dx" | "dy";
type GeometryBlockId = "setup" | "analysis" | "plane" | "bridge";

const geometryNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Nuqtalar koordinatalari" },
    { id: "analysis" as const, label: "Analysis", description: "Calculated distances va properties" },
    { id: "plane" as const, label: "Visual Plane", description: "Koordinata tekisligi preview" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live publishing" },
];

function MetricCard({ label, value, icon: Icon, highlight = false }: { label: string, value: string, icon: any, highlight?: boolean }) {
    return (
        <div className={`site-outline-card p-4 flex flex-col ${highlight ? 'bg-accent/5 border-accent/20' : 'bg-muted/5'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center mb-1 ${highlight ? 'text-accent' : 'text-muted-foreground'}`}>
                <Icon className="mr-2 h-3.5 w-3.5" />
                {label}
            </div>
            <div className="mt-1 font-serif text-2xl font-black">{value}</div>
        </div>
    );
}

export function GeometryStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [values, setValues] = React.useState<Record<PointKey, string>>({
        ax: "0", ay: "0", bx: "4", by: "3", cx: "0", cy: "4", dx: "5", dy: "0"
    });

    const notebook = useLaboratoryNotebook<GeometryBlockId>({
        storageKey: "mathsphere-lab-geometry-notebook",
        definitions: geometryNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "plane"],
    });

    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const updateValue = (key: PointKey, next: string) => {
        setValues((current) => ({ ...current, [key]: next }));
    };

    let error = "";
    let analysis: any = null;

    try {
        analysis = analyzeAnalyticGeometry(
            { x: Number(values.ax), y: Number(values.ay) },
            { x: Number(values.bx), y: Number(values.by) },
            { x: Number(values.cx), y: Number(values.cy) },
            { x: Number(values.dx), y: Number(values.dy) },
        );
    } catch (e: any) { error = e.message; }

    const applyPreset = (p: any) => {
        setValues({ ax: p.ax, ay: p.ay, bx: p.bx, by: p.by, cx: p.cx, cy: p.cy, dx: p.dx, dy: p.dy });
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Geometry Studio"
                description="Analitik geometriya, burchaklar va kesishishlar tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={geometryNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun bloklarni yoqig." />}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Coordinate Engine</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    { label: "Point A", x: "ax", y: "ay" },
                                    { label: "Point B", x: "bx", y: "by" },
                                    { label: "Point C", x: "cx", y: "cy" },
                                    { label: "Point D", x: "dx", y: "dy" },
                                ].map(p => (
                                    <div key={p.label} className="site-outline-card p-4 space-y-3">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.label}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input value={values[p.x as PointKey]} onChange={e => updateValue(p.x as PointKey, e.target.value)} className="h-9 rounded-xl border border-border bg-background/40 px-3 text-xs font-mono outline-none focus:border-accent" placeholder="x" />
                                            <input value={values[p.y as PointKey]} onChange={e => updateValue(p.y as PointKey, e.target.value)} className="h-9 rounded-xl border border-border bg-background/40 px-3 text-xs font-mono outline-none focus:border-accent" placeholder="y" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && analysis && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Computed Invariants</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <MetricCard label="Distance AB" value={String(analysis.distanceAB)} icon={Ruler} highlight />
                                <MetricCard label="Midpoint AB" value={`(${analysis.midpointAB.x}, ${analysis.midpointAB.y})`} icon={CircleDot} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="font-mono text-[11px] p-3 rounded-xl bg-background border border-border">AB: {analysis.lineAB.equation}</div>
                                <div className="font-mono text-[11px] p-3 rounded-xl bg-background border border-border">CD: {analysis.lineCD.equation}</div>
                            </div>
                            <MetricCard label="Intersection Result" value={analysis.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis.isParallel ? "Parallel Lines" : "None"} icon={Target} highlight />
                        </div>
                    )}

                    {notebook.hasBlock("plane") && analysis && (
                        <div className="site-panel p-6">
                             <div className="site-eyebrow text-accent mb-4">Coordinate Plane</div>
                             <CartesianPlot 
                                series={[
                                    { label: "Line AB", color: "#2563eb", points: analysis.lineAB.samples },
                                    { label: "Line CD", color: "#f59e0b", points: analysis.lineCD.samples },
                                    { label: "Points", color: "var(--accent)", points: [
                                        {x: Number(values.ax), y: Number(values.ay)},
                                        {x: Number(values.bx), y: Number(values.by)},
                                        {x: Number(values.cx), y: Number(values.cy)},
                                        {x: Number(values.dx), y: Number(values.dy)},
                                    ]}
                                ]}
                             />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Common Forms</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.geometry.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group">
                                    <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!error && !!analysis}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={{ copy: { badge: "Geometry", title: "Copy", description: "Export as MD.", confirmLabel: "Copy", steps: [], note: "" }, send: { badge: "Import", title: "Send", description: "New draft.", confirmLabel: "Send", steps: [], note: "" } } as any}
                            liveTargets={liveTargets}
                            onSelectTarget={setSelectedLiveTargetId}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onCopy={async () => {
                                await navigator.clipboard.writeText(`## Geometry Export`);
                                setExportState("copied");
                            }}
                            onSend={() => {
                                const requestId = queueWriterImport({ version: 1, markdown: "Geometry analysis", block: {} as any, title: "Geometry Report", abstract: "Exported results.", keywords: "geometry" });
                                setExportState("sent");
                                window.location.assign(createLaboratoryWriterDraftHref(requestId));
                            }}
                            onPush={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function ArrowRight({ className }: { className: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}
