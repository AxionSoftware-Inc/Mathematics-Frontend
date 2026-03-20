"use client";

import React from "react";
import { Activity, Sparkles, TrendingUp, Zap, Target, ArrowRight } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { analyzeSeries, type SeriesPoint, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type SeriesBlockId = "setup" | "analysis" | "bridge";

const seriesNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Series expr va presets" },
    { id: "analysis" as const, label: "Analysis", description: "Convergence va plotting" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live push" },
];

export function SeriesLimitsStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [expression, setExpression] = React.useState("1 / n^2");
    const [startIndex, setStartIndex] = React.useState("1");
    const [termCount, setTermCount] = React.useState("50");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const notebook = useLaboratoryNotebook<SeriesBlockId>({
        storageKey: "mathsphere-lab-series-notebook",
        definitions: seriesNotebookBlocks,
        defaultBlocks: ["setup", "analysis"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    let error = "";
    let analysis: any = null;

    try {
        analysis = analyzeSeries(expression, Number(startIndex), Number(termCount));
    } catch (e: any) {
        error = e.message;
    }

    const applyPreset = (p: any) => {
        setExpression(p.expr);
        setStartIndex(p.start);
        setTermCount(p.terms);
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Series & Limits"
                description="Infinite Series, Convergence diagnostics va Taylor analysis."
                activeBlocks={notebook.activeBlocks}
                definitions={seriesNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Qator tahlilini boshlash uchun bloklarni yoqig." />}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Series Logic Control</div>
                                    <div className="font-serif text-xl font-black uppercase text-foreground">Partial Sum Generator</div>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center">
                                    <TrendingUp className="mr-2 h-3.5 w-3.5" />
                                    Analysis Active
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">General Term, a_n (f(n))</div>
                                    <input value={expression} onChange={e => setExpression(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="site-outline-card p-4 space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start n0</div>
                                        <input value={startIndex} onChange={e => setStartIndex(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                    <div className="site-outline-card p-4 space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terms to Sum</div>
                                        <input value={termCount} onChange={e => setTermCount(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && analysis && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Partial Sum Trajectory</div>
                            <div className="w-full">
                                <CartesianPlot series={[{ label: "S_n", color: "var(--accent)", points: analysis.points.map((p: any) => ({ x: p.n, y: p.partialSum })) }]} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-5 bg-accent/5 border-accent/20 flex flex-col items-center">
                                    <div className="text-[9px] font-black uppercase tracking-tight text-accent mb-2 flex items-center"><Target className="mr-2 h-3 w-3" /> Potential Limit</div>
                                    <div className="font-serif text-3xl font-black">{(analysis.lastPartial ?? 0).toFixed(8)}</div>
                                </div>
                                <div className="site-outline-card p-5 flex flex-col items-center">
                                    <div className="text-[9px] font-black uppercase tracking-tight text-muted-foreground mb-2 flex items-center"><Activity className="mr-2 h-3 w-3" /> Last Term</div>
                                    <div className="font-serif text-xl font-black opacity-80">{(analysis.lastTerm ?? 0).toExponential(4)}</div>
                                </div>
                                <div className="site-outline-card p-5 flex flex-col items-center">
                                    <div className="text-[9px] font-black uppercase tracking-tight text-muted-foreground mb-2 flex items-center"><Zap className="mr-2 h-3 w-3" /> Diagnostics</div>
                                    <div className="text-xs font-black uppercase text-foreground">{analysis.diagnosticLabel || "--"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Classic Series Forms</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.series.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 hover:translate-x-1 transition-all group">
                                     <div className="text-left">
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent">{p.label}</div>
                                         <div className="text-[9px] font-mono text-muted-foreground">{p.expr}</div>
                                     </div>
                                     <div className="text-[8px] font-bold text-muted-foreground bg-muted/10 px-1.5 py-0.5 rounded uppercase">Preset</div>
                                 </button>
                             ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(analysis && !error)}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={{ copy: { badge: "Series Info", title: "Copy Trace", description: "Markdown result.", confirmLabel: "Copy", steps: [], note: "" }, send: { badge: "Import", title: "Generate Draft", description: "Send analysis to writer.", confirmLabel: "Send", steps: [], note: "" } } as any}
                            liveTargets={liveTargets}
                            onSelectTarget={setSelectedLiveTargetId}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onCopy={async () => {
                                await navigator.clipboard.writeText(`## Series Export`);
                                setExportState("copied");
                            }}
                            onSend={() => {
                                queueWriterImport({ version: 1, markdown: "Series analysis", block: { } as any, title: "Series Report", abstract: "Exported series result.", keywords: "series, calc" });
                                setExportState("sent");
                                window.location.assign("/write/new?source=laboratory");
                            }}
                            onPush={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
