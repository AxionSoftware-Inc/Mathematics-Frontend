"use client";

import React from "react";
import { Activity, Ruler, Move, Sparkles, Layers3, Box, Plus } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { analyzeAnalyticGeometry, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryWorkflowTemplatePanel } from "@/components/laboratory/laboratory-workflow-template-panel";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { usePersistedLabCollection } from "@/components/laboratory/use-persisted-lab-collection";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Geometry export",
        title: "Geometrik tahlilni nusxalash",
        description: "Nuqtalar, masofalar va kesishish nuqtalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Nuqtalarning (A, B, C, D) kartazian koordinatalari yoziladi.",
            "Chiziqlar tenglamalari (y = mx + b) va d-masofa ko'rsatiladi.",
            "Markdown formatida analitik xulosa va koordinatalar jadvali yaratiladi.",
        ],
        note: "Analitik geometriya va fazoviy hisob-kitoblar tahlili uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Geometriya natijasini writer'ga yuborish",
        description: "Analitik hisobotni writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Geometry export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Visual chizmalar va tenglamalar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type PointKey = "ax" | "ay" | "bx" | "by" | "cx" | "cy" | "dx" | "dy";
type GeometryBlockId = "setup" | "analysis" | "plane" | "bridge";

const geometryNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Nuqtalar koordinatalari" },
    { id: "analysis" as const, label: "Analysis", description: "Calculated distances va properties" },
    { id: "plane" as const, label: "Visual Plane", description: "Koordinata tekisligi preview" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live publishing" },
];

const GEOMETRY_WORKFLOW_TEMPLATES = [
    {
        id: "intersection-audit",
        title: "Intersection Logic Audit",
        description: "Ikki to'g'ri chiziqning kesishish nuqtasi va parallellik holatini tahlil qilish.",
        presetLabel: "Intersection A",
        blocks: ["setup", "analysis", "plane"] as const,
    },
    {
        id: "orthogonality-check",
        title: "Orthogonality Check",
        description: "Perpendikulyar chiziqlar va minimal masofalar tahlili.",
        presetLabel: "Parallel Lines",
        blocks: ["setup", "plane"] as const,
    },
] as const;

type GeoAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type GeoSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    values: Record<PointKey, string>;
};

type GeometryAnalysis = ReturnType<typeof analyzeAnalyticGeometry>;

function buildGeometryMarkdown(values: Record<PointKey, string>, analysis: GeometryAnalysis) {
    return `## Laboratory Export: Geometry Studio
        
### Coordinate Invariants
- Point A: (${values.ax}, ${values.ay})
- Point B: (${values.bx}, ${values.by})
- Dist(A, B): ${analysis.distanceAB}
- Mid(A, B): (${analysis.midpointAB.x}, ${analysis.midpointAB.y})

### Linear Systems
- Line AB: ${analysis.lineAB.equation}
- Line CD: ${analysis.lineCD.equation}
- Intersection: ${analysis.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis.isParallel ? "Parallel" : "None"}`;
}

function buildGeometryLivePayload(targetId: string, values: Record<PointKey, string>, analysis: GeometryAnalysis): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "geometry-studio",
        kind: "analytic-geometry",
        title: "Analytic Geometry Report",
        summary: "Linear systems and point-plane analysis workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Dist AB", value: String(analysis.distanceAB) },
            { label: "Parallel", value: analysis.isParallel ? "Yes" : "No" },
            { label: "Intersection", value: analysis.intersection ? "Detected" : "None" },
        ],
        notes: [
            `Line AB: ${analysis.lineAB.equation}`,
            `Line CD: ${analysis.lineCD.equation}`,
            `Midpoint AB: (${analysis.midpointAB.x}, ${analysis.midpointAB.y})`,
        ],
        plotSeries: [
            { label: "Line AB", color: "#2563eb", points: analysis.lineAB.samples },
            { label: "Line CD", color: "#f59e0b", points: analysis.lineCD.samples },
            { label: "Points", color: "var(--accent)", points: [
                {x: Number(values.ax), y: Number(values.ay)},
                {x: Number(values.bx), y: Number(values.by)},
                {x: Number(values.cx), y: Number(values.cy)},
                {x: Number(values.dx), y: Number(values.dy)},
            ]},
        ],
    };
}

export function GeometryStudioModule({ module: _module }: { module: LaboratoryModuleMeta }) {
    void _module;
    const [values, setValues] = React.useState<Record<PointKey, string>>({
        ax: "0", ay: "0", bx: "4", by: "3", cx: "0", cy: "4", dx: "5", dy: "0"
    });

    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [annotations, setAnnotations] = usePersistedLabCollection<GeoAnnotation>("mathsphere-lab-geo-annotations");
    const [savedExperiments, setSavedExperiments] = usePersistedLabCollection<GeoSavedExperiment>("mathsphere-lab-geo-experiments");

    const notebook = useLaboratoryNotebook<GeometryBlockId>({
        storageKey: "mathsphere-lab-geometry-notebook",
        definitions: geometryNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "plane"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const updateValue = (key: PointKey, next: string) => {
        setValues((current) => ({ ...current, [key]: next }));
    };

    const analysis = React.useMemo(() => {
        try {
            return analyzeAnalyticGeometry(
                { x: Number(values.ax), y: Number(values.ay) },
                { x: Number(values.bx), y: Number(values.by) },
                { x: Number(values.cx), y: Number(values.cy) },
                { x: Number(values.dx), y: Number(values.dy) },
            );
        } catch { return null; }
    }, [values]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.geometry)[number]) => {
        setValues({ ax: preset.ax, ay: preset.ay, bx: preset.bx, by: preset.by, cx: preset.cx, cy: preset.cy, dx: preset.dx, dy: preset.dy });
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = GEOMETRY_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.geometry.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!analysis,
        sourceLabel: "Geometry Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildGeometryMarkdown(values, analysis as GeometryAnalysis),
        buildBlock: (targetId) => buildGeometryLivePayload(targetId, values, analysis as GeometryAnalysis),
        getDraftMeta: () => ({
            title: "Analytic Geometry Report",
            abstract: "Detailed point and line interaction results.",
            keywords: "geometry,analytic,plane,line,intersection",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (analysis?.isParallel) {
            signals.push({ tone: "warn", label: "Parallel Lines", text: "Chiziqlar parallel, kesishish nuqtasi mavjud emas." });
        } else if (analysis?.intersection) {
            signals.push({ tone: "info", label: "Intersection Found", text: `Chiziqlar (${analysis.intersection.x}, ${analysis.intersection.y}) nuqtasida kesishadi.` });
        }
        if (analysis && analysis.distanceAB === 0) {
            signals.push({ tone: "danger", label: "Zero Distance", text: "A va B nuqtalari ustma-ust tushgan." });
        }
        return signals;
    }, [analysis]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Analytic Geometry Principles",
        "- **Cartesian Plane** nuqtalarni (x, y) juftligi orqali ifodalash imkonini beradi.",
        "- **Distance Formula** Evklid metrikasi asosida ikki nuqta orasidagi masofani hisoblaydi.",
        "- **Linear Equations** y = mx + b ko'rinishida chiziqlarni tavsiflaydi.",
        "- **Intersection** ikki tenglamaning umumiy yechimidir.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Geometric Analysis Report",
        `Points Setup: A(${values.ax}, ${values.ay}), B(${values.bx}, ${values.by})`,
        "",
        "### Invariants",
        analysis ? `- Dist(A, B): ${analysis.distanceAB}` : "- Data pending",
        analysis ? `- Midpoint: (${analysis.midpointAB.x}, ${analysis.midpointAB.y})` : "- Data pending",
        "",
        "### System Verdict",
        analysis?.intersection ? "- Single intersection point detected." : analysis?.isParallel ? "- System is parallel." : "- No intersection in real plane.",
    ].join("\n"), [values, analysis]);

    function addAnnotation() {
        const note: GeoAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Geometry Note",
            note: annotationNote || "Visual observation.",
            anchor: analysis?.intersection ? `Int: (${analysis.intersection.x}, ${analysis.intersection.y})` : "General",
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: GeoSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Geometry Experiment",
            savedAt: new Date().toISOString(),
            values: { ...values }
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: GeoSavedExperiment) {
        setValues(exp.values);
    }

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun geometrik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-blue-600">Coordinate Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Analytic Engine Active</div>
                                </div>
                                <div className="flex items-center rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-lg shadow-blue-500/5 transition-all">
                                    <Move className="mr-2 h-3.5 w-3.5" /> Cartesian Mode
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    { label: "Point A", x: "ax", y: "ay" },
                                    { label: "Point B", x: "bx", y: "by" },
                                    { label: "Point C", x: "cx", y: "cy" },
                                    { label: "Point D", x: "dx", y: "dy" },
                                ].map(p => (
                                    <div key={p.label} className="site-outline-card p-4 space-y-3">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.label} (x, y)</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input value={values[p.x as PointKey]} onChange={e => updateValue(p.x as PointKey, e.target.value)} className="h-9 rounded-xl border border-border bg-background/40 px-3 text-xs font-mono outline-none focus:border-accent" placeholder="x" />
                                            <input value={values[p.y as PointKey]} onChange={e => updateValue(p.y as PointKey, e.target.value)} className="h-9 rounded-xl border border-border bg-background/40 px-3 text-xs font-mono outline-none focus:border-accent" placeholder="y" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <LaboratoryWorkflowTemplatePanel
                            templates={GEOMETRY_WORKFLOW_TEMPLATES}
                            activeTemplateId={activeTemplateId}
                            onApply={applyWorkflowTemplate}
                            accentClassName="text-blue-600"
                        />
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <div className="site-eyebrow text-blue-600">Geometry Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.geometry.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-blue-600/5 hover:border-blue-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-blue-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">Analytical Scene</div>
                                    </div>
                                    <Ruler className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-blue-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Geometric Signals"
                        title="Analytic monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-blue-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-blue-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-600/80 transition-colors">Save Annotation</button>
                        </div>
                        <div className="space-y-2 mt-4">
                            {annotations.map(a => (
                                <div key={a.id} className="p-3 rounded-xl border border-border/60 bg-muted/5">
                                    <div className="text-xs font-bold">{a.title}</div>
                                    <div className="text-[10px] text-muted-foreground mt-1">{a.note}</div>
                                    <div className="text-[9px] mt-2 opacity-50">{a.anchor}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-blue-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600/40" />
                             <button onClick={saveExperiment} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-blue-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("analysis") && analysis && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Invariants Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-blue-600">Calculated Metrics</div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="site-outline-card p-4 border-blue-600/20 bg-blue-600/5">
                                            <div className="text-[9px] font-bold uppercase text-blue-600 mb-1">Dist(A, B)</div>
                                            <div className="font-serif text-xl font-black">{analysis.distanceAB}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Mid(A, B)</div>
                                            <div className="font-serif text-lg font-black italic">{analysis.midpointAB.x}, {analysis.midpointAB.y}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="site-outline-card p-4">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-2">Equation AB</div>
                                            <div className="font-mono text-[10px] font-bold text-muted-foreground">{analysis.lineAB.equation}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-2">Equation CD</div>
                                            <div className="font-mono text-[10px] font-bold text-muted-foreground">{analysis.lineCD.equation}</div>
                                        </div>
                                    </div>

                                    <div className="site-outline-card p-4 bg-muted/5">
                                        <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Intersection</div>
                                        <div className="font-serif text-xl font-black text-foreground">
                                            {analysis.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis.isParallel ? "Parallel Lines" : "None"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("plane") && analysis && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <div className="site-eyebrow text-blue-600">Coordinate Space</div>
                            </div>
                            <div className="h-[350px] w-full">
                                <CartesianPlot 
                                    series={[
                                        { label: "Line AB", color: "#2563eb", points: analysis.lineAB.samples },
                                        { label: "Line CD", color: "#f59e0b", points: analysis.lineCD.samples },
                                        { label: "Vertices", color: "var(--accent)", points: [
                                            {x: Number(values.ax), y: Number(values.ay)},
                                            {x: Number(values.bx), y: Number(values.by)},
                                            {x: Number(values.cx), y: Number(values.cy)},
                                            {x: Number(values.dx), y: Number(values.dy)},
                                        ]}
                                    ]}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Geometric Insight
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground">
                                        Ikki chiziq orasidagi munosabatlar analitik tekislikda hisoblanmoqda.
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Invariance
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground">
                                        Distansiya va nuqtararo munosabatlar Evklid metrikasi asosida topildi.
                                    </div>
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
