"use client";

import React from "react";
import { Activity, Sparkles, TrendingUp, Zap, Target, ArrowRight, Layers3, Box, Info } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { analyzeSeries, type SeriesPoint, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Series export",
        title: "Qator tahlilini nusxalash",
        description: "Yaqinlashish testi va qisman yig'indi natijalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Umumiy had (a_n) va qatorning dastlabki yig'indisi hisoblanadi.",
            "Yaqinlashish (Convergence) diagnostikasi va limit qiymati formatlanadi.",
            "Markdown formatida qator trayektoriyasi va tahlili yaratiladi.",
        ],
        note: "Matematik analiz va qatorlar nazariyasi hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Qator natijasini writer'ga yuborish",
        description: "Limit tahlilini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Series export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Qisman yig'indilar grafigi va diagnostika draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type SeriesBlockId = "setup" | "analysis" | "bridge";

const seriesNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Series expr va presets" },
    { id: "analysis" as const, label: "Analysis", description: "Convergence va plotting" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live push" },
];

function buildSeriesMarkdown(expression: string, startIndex: string, termCount: string, analysis: any) {
    return `## Laboratory Export: Series Studio
        
### Series Definition
- Expression (a_n): ${expression}
- Range: n=${startIndex} to n=${termCount}

### Convergence Analysis
- Diagnostic verdict: ${analysis.diagnosticLabel}
- Potential limit (S_n): ${analysis.lastPartial}
- Final term (a_N): ${analysis.lastTerm}
- Commentary: ${analysis.commentary}`;
}

function buildSeriesLivePayload(targetId: string, expression: string, startIndex: string, termCount: string, analysis: any): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "series-limits-studio",
        kind: "series-analysis",
        title: `Series: ${expression}`,
        summary: "Sequence convergence and partial sum trajectory analysis workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Verdict", value: analysis.diagnosticLabel },
            { label: "S_n", value: String(analysis.lastPartial?.toFixed(6) || "--") },
            { label: "n_max", value: termCount },
        ],
        notes: [
            `Expression: ${expression}`,
            analysis.commentary,
            `Final term: ${analysis.lastTerm}`,
        ],
        plotSeries: [
            { label: "a_n", color: "#3b82f6", points: analysis.points.map((p:any) => ({ x: p.n, y: p.value })) },
            { label: "S_n", color: "#f59e0b", points: analysis.points.map((p:any) => ({ x: p.n, y: p.partialSum })) },
        ],
    };
}

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

    const { analysis, error } = React.useMemo(() => {
        try {
            const res = analyzeSeries(expression, Number(startIndex), Number(termCount));
            return { analysis: res, error: null };
        } catch (e: any) { return { analysis: null, error: e.message }; }
    }, [expression, startIndex, termCount]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.series)[number]) => {
        setExpression(preset.expr);
        setStartIndex(preset.start);
        setTermCount(preset.terms);
    };

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!analysis,
        sourceLabel: "Series Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildSeriesMarkdown(expression, startIndex, termCount, analysis),
        buildBlock: (targetId) => buildSeriesLivePayload(targetId, expression, startIndex, termCount, analysis),
        getDraftMeta: () => ({
            title: `Series Study: ${expression}`,
            abstract: "Detailed convergence and partial sum report from analysis engine.",
            keywords: "series,convergence,limit,calculus",
        }),
    });

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun limit bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-blue-600">Series Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Partial Sum Engine</div>
                                </div>
                                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center shadow-lg shadow-blue-500/5 transition-all">
                                    <TrendingUp className="mr-2 h-3.5 w-3.5" /> Stable Convergence
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">General Term (a_n)</div>
                                    <input value={expression} onChange={e => setExpression(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="site-outline-card p-4 space-y-2">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start n0</div>
                                        <input value={startIndex} onChange={e => setStartIndex(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                    <div className="site-outline-card p-4 space-y-2">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Max n</div>
                                        <input value={termCount} onChange={e => setTermCount(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <div className="site-eyebrow text-blue-600">Series Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.series.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-blue-600/5 hover:border-blue-600/40 transition-all group text-left">
                                     <div className="min-w-0">
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-blue-600 font-serif">{p.label}</div>
                                         <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">{p.expr} Scenario</div>
                                     </div>
                                     <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-blue-600 transition-colors" />
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("analysis") && analysis && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Projection Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-blue-600 font-black">Sum Trajectory</div>
                                        <Activity className="h-4 w-4 text-blue-600/50" />
                                    </div>
                                    <div className="h-[350px]">
                                        <CartesianPlot series={[{ label: "S_n", color: "var(--accent)", points: analysis.points.map((p:any) => ({ x: p.n, y: p.partialSum })) }]} height={350} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && analysis && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                <div className="site-eyebrow text-blue-600">Diagnostic Summary</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                <div className="site-outline-card p-4 bg-blue-600/5 border-blue-600/20 shadow-lg shadow-blue-600/5"><div className="text-[9px] font-black text-blue-600 uppercase mb-1">Potential Limit</div><div className="font-serif text-xl font-black italic">{(analysis.lastPartial ?? 0).toFixed(8)}</div></div>
                                <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Final Term (a_n)</div><div className="font-serif text-xl font-black italic opacity-80">{(analysis.lastTerm ?? 0).toExponential(4)}</div></div>
                                <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Verdict</div><div className="text-[10px] font-black uppercase text-foreground">{analysis.diagnosticLabel || "--"}</div></div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 mt-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Convergence
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">{analysis.commentary}</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Sum Precision
                                        </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Qisman yig'indilar trayektoriyasi limitga qarab intilishi tahlil qilindi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                         <LaboratoryBridgeCard
                            ready={!!analysis}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={exportGuides}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={copyMarkdownExport}
                            onSend={sendToWriter}
                            onPush={pushLiveResult}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
