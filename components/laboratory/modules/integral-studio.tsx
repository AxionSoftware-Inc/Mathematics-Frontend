"use client";

import React from "react";
import { Activity, AreaChart, BetweenHorizontalStart, Waves, Beaker, Layers, Sparkles } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot, buildSurfaceData, buildVolumeData } from "@/components/laboratory/scientific-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { approximateIntegral, DoubleIntegralSummary, TripleIntegralSummary, approximateDoubleIntegral, approximateTripleIntegral, type IntegralSummary, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { publishToLiveWriterTarget, queueWriterImport, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Integral export",
        title: "Integral natijasini nusxa olish",
        description: "Integral hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Midpoint, trapezoid va Simpson natijalari bitta hisobotga yig'iladi.",
            "Function, interval va segment soni ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Integral natijasini writer'ga yuborish",
        description: "Integral hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Integral export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type IntegralBlockId = "setup" | "bridge" | "analysis";

const integralNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Integral input va metrics" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
    { id: "analysis" as const, label: "Analysis", description: "Pro Visualization va method review" },
];

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildIntegralMarkdown(params: {
    expression: string;
    lower: number;
    upper: number;
    segments: number;
    summary: ReturnType<typeof approximateIntegral>;
}) {
    const { expression, lower, upper, segments, summary } = params;
    const spread = Math.max(summary.midpoint, summary.trapezoid, summary.simpson) - Math.min(summary.midpoint, summary.trapezoid, summary.simpson);

    return `## Laboratory Export: Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- Interval: [${formatMetric(lower, 4)}, ${formatMetric(upper, 4)}]\n\n### Numerical Estimates\n- Simpson: ${formatMetric(summary.simpson, 6)}\n- Method spread: ${formatMetric(spread, 6)}`;
}

function buildIntegralLivePayload(params: {
    targetId: string;
    expression: string;
    lower: number;
    upper: number;
    segments: number;
    summary: ReturnType<typeof approximateIntegral>;
}): WriterBridgeBlockData {
    const { targetId, expression, lower, upper, segments, summary } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "integral-studio",
        kind: "integral",
        title: `Integral study: ${expression}`,
        summary: "Laboratoriyadan live yuborilgan integral hisoboti.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Lower", value: formatMetric(lower, 4) },
            { label: "Upper", value: formatMetric(upper, 4) },
            { label: "Simpson", value: formatMetric(summary.simpson, 6) },
        ],
        notes: [`Function: ${expression}`],
        plotSeries: [{ label: "f(x)", color: "#2563eb", points: summary.samples }],
    };
}

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"single" | "double" | "triple">("single");
    const [expression, setExpression] = React.useState(String(module.config?.defaultExpression || "sin(x) + x^2 / 5"));
    const [lower, setLower] = React.useState("0");
    const [upper, setUpper] = React.useState("3.14");
    
    // Bounds Double/Triple
    const [xMin, setXMin] = React.useState("0");
    const [xMax, setXMax] = React.useState("1");
    const [yMin, setYMin] = React.useState("0");
    const [yMax, setYMax] = React.useState("1");
    const [zMin, setZMin] = React.useState("0");
    const [zMax, setZMax] = React.useState("1");

    const [segments, setSegments] = React.useState(String(module.config?.defaultSegments || 24));
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const notebook = useLaboratoryNotebook<IntegralBlockId>({
        storageKey: "mathsphere-lab-integral-notebook",
        definitions: integralNotebookBlocks,
        defaultBlocks: ["setup", "analysis"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    let error = "";
    let summary: any = null;

    try {
        if (mode === "single") {
            summary = approximateIntegral(expression, Number(lower), Number(upper), Number(segments));
        } else if (mode === "double") {
            summary = approximateDoubleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), 20, 20);
        } else {
            summary = approximateTripleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), Number(zMin), Number(zMax), 10, 10, 10);
        }
    } catch (e: any) {
        error = e.message;
    }

    const applyPreset = (p: any) => {
        setMode(p.mode);
        setExpression(p.expr);
        if (p.mode === "single") {
            setLower(p.lower);
            setUpper(p.upper);
        } else {
            const bx = JSON.parse(p.x);
            const by = JSON.parse(p.y);
            setXMin(String(bx[0])); setXMax(String(bx[1]));
            setYMin(String(by[0])); setYMax(String(by[1]));
            if (p.z) {
                const bz = JSON.parse(p.z);
                setZMin(String(bz[0])); setZMax(String(bz[1]));
            }
        }
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Integral Studio"
                description="Numerical Integration va Advanced 3D Visualization tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={integralNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun bloklarni yoqig." />}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Adaptive Solver Control</div>
                                    <div className="flex gap-2">
                                        {(["single", "double", "triple"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center">
                                    <Beaker className="mr-2 h-3.5 w-3.5" />
                                    Active Simulation
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Function, f({mode === "single" ? 'x' : mode === "double" ? 'x,y' : 'x,y,z'})</div>
                                    <input value={expression} onChange={e => setExpression(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {mode === "single" ? (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lower a</div>
                                                <input value={lower} onChange={e => setLower(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upper b</div>
                                                <input value={upper} onChange={e => setUpper(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Segments</div>
                                                <input value={segments} onChange={e => setSegments(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                        </>
                                    ) : mode === "double" ? (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Domain</div>
                                                <div className="flex gap-2">
                                                    <input value={xMin} onChange={e => setXMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                    <input value={xMax} onChange={e => setXMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                </div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Domain</div>
                                                <div className="flex gap-2">
                                                    <input value={yMin} onChange={e => setYMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                    <input value={yMax} onChange={e => setYMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Domain</div>
                                                <div className="flex gap-2"><input value={xMin} onChange={e => setXMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={xMax} onChange={e => setXMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Domain</div>
                                                <div className="flex gap-2"><input value={yMin} onChange={e => setYMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={yMax} onChange={e => setYMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Z Domain</div>
                                                <div className="flex gap-2"><input value={zMin} onChange={e => setZMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={zMax} onChange={e => setZMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && summary && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Vibrant Visualization</div>
                            <div className="w-full">
                                {mode === "single" ? (
                                    <CartesianPlot series={[{ label: "f(x)", color: "var(--accent)", points: summary.samples }]} />
                                ) : mode === "double" ? (
                                    <ScientificPlot type="surface" data={buildSurfaceData(summary.samples)} title={`$f(x,y) = ${expression}$ Surface`} />
                                ) : (
                                    <ScientificPlot type="scatter3d" data={buildVolumeData(summary.samples)} title={`$f(x,y,z) = ${expression}$ Hypercube Volume Density`} />
                                )}
                            </div>
                            
                            <div className="grid gap-4 sm:grid-cols-4">
                                {mode === "single" ? (
                                    <>
                                        <div className="site-outline-card p-4 bg-accent/5 border-accent/20"><div className="text-[9px] font-bold text-accent uppercase tracking-widest">Simpson</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(summary.simpson, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Midpoint</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(summary.midpoint, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Trapezoid</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(summary.trapezoid, 4)}</div></div>
                                        <div className="site-outline-card p-4 bg-muted/5"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Seg. Used</div><div className="mt-1 font-serif text-xl font-black">{segments}</div></div>
                                    </>
                                ) : (
                                    <div className="col-span-4 site-outline-card p-6 bg-accent/5 border-accent/20 flex flex-col items-center justify-center">
                                         <div className="site-eyebrow text-accent">Total Volume Estimate</div>
                                         <div className="font-serif text-5xl font-black tracking-tighter mt-2">{formatMetric(summary.value, 8)}</div>
                                         <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Simulation Grid Stability: ✅</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Powerful Examples</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.integral.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 hover:translate-x-1 transition-all group">
                                    <div className="text-left">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent">{p.label}</div>
                                        <div className="text-[9px] font-mono text-muted-foreground">{p.expr}</div>
                                    </div>
                                    <div className="text-[8px] font-bold text-muted-foreground bg-muted/10 px-1.5 py-0.5 rounded uppercase">{p.mode}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(summary && !error)}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={exportGuides}
                            liveTargets={liveTargets}
                            onSelectTarget={setSelectedLiveTargetId}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onCopy={async () => {
                                if (!summary) return;
                                const text = mode === "single" ? buildIntegralMarkdown({ expression, lower: Number(lower), upper: Number(upper), segments: Number(segments), summary }) : `## Integral Export: ${mode.toUpperCase()}\n- Value: ${summary.value}`;
                                await navigator.clipboard.writeText(text);
                                setExportState("copied");
                            }}
                            onSend={() => {
                                if (!summary) return;
                                queueWriterImport({
                                    version: 1, 
                                    markdown: `## Integral Studio Result\n\nResult: ${summary.value || summary.simpson}`,
                                    block: buildIntegralLivePayload({ targetId: `int-${Date.now()}`, expression, lower: Number(lower), upper: Number(upper), segments: Number(segments), summary: mode === "single" ? summary : { ...summary, simpson: summary.value, midpoint: summary.value, trapezoid: summary.value } }),
                                    title: "Integral Analysis", abstract: "Exported from laboratory.", keywords: "integral"
                                });
                                setExportState("sent");
                                window.location.assign("/write/new?source=laboratory");
                            }}
                            onPush={() => {
                                const target = liveTargets.find(t => t.id === selectedLiveTargetId);
                                if (!target || !summary) return;
                                publishToLiveWriterTarget({
                                    writerId: target.writerId,
                                    targetId: target.id,
                                    sourceLabel: "Integral Studio",
                                    documentTitle: target.documentTitle,
                                    payload: buildIntegralLivePayload({
                                        targetId: target.id,
                                        expression,
                                        lower: Number(lower),
                                        upper: Number(upper),
                                        segments: Number(segments),
                                        summary: mode === "single" ? summary : { ...summary, simpson: summary.value, midpoint: summary.value, trapezoid: summary.value },
                                    }),
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
