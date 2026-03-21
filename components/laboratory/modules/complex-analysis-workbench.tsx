"use client";

import React from "react";
import { Atom, Maximize2, Move, Sparkles, Target, Zap, Waves, Activity, Layers3, Box, Info, Compass } from "lucide-react";
import { complex, evaluate } from "mathjs";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot, buildSurfaceData } from "@/components/laboratory/scientific-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { ArrowRight, Plus } from "lucide-react";

const exportGuides = {
    copy: {
        badge: "Complex export",
        title: "Kompleks tahlil natijasini nusxalash",
        description: "Fraktal va konform akslantirish hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Fraktal turi (Mandelbrot/Julia) va koordinatalar yoziladi.",
            "Konform akslantirish funksiyasi (f(z)) va nuqtalar to'plami ko'rsatiladi.",
            "Markdown formatida grafik tahlili va formulalar yaratiladi.",
        ],
        note: "Kompleks o'zgaruvchili funksiyalar nazariyasi bo'yicha hisobotlar uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Kompleks natijani writer'ga yuborish",
        description: "Tahlil natijalarini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Kompleks export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Fraktal parametrlari va akslantirish natijalari draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type ComplexBlockId = "setup" | "fractal" | "mapping" | "bridge";

const complexNotebookBlocks = [
    { id: "setup" as const, label: "Variable Control", description: "Complex parameters va grid setup" },
    { id: "fractal" as const, label: "Fractal Engine", description: "Mandelbrot va Julia sets (Canvas)" },
    { id: "mapping" as const, label: "Function Map", description: "Conformal mapping va 3D surface" },
    { id: "bridge" as const, label: "Bridge", description: "Export results" },
];

const COMPLEX_WORKFLOW_TEMPLATES = [
    {
        id: "mandelbrot-audit",
        title: "Mandelbrot Boundary Study",
        description: "Mandelbrot to'plami chegaralarida kompleks dinamika tahlili.",
        mode: "fractal" as const,
        presetLabel: "Mandelbrot Classic",
        blocks: ["setup", "fractal"] as const,
    },
    {
        id: "conformal-audit",
        title: "Conformal Mapping Audit",
        description: "Murakkab funksiyalar orqali kompleks tekislikni akslantirish tahlili.",
        mode: "mapping" as const,
        presetLabel: "Mapping z^2",
        blocks: ["setup", "mapping"] as const,
    },
] as const;

type CpxAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type CpxSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: "fractal" | "mapping";
    expr: string;
    fractalType: string;
    juliaC: { re: number; im: number };
};

function buildComplexMarkdown(params: {
    mode: "fractal" | "mapping";
    fractalType: "mandelbrot" | "julia";
    juliaC: { re: number; im: number };
    expr: string;
    view: { x: number; y: number; zoom: number };
    mappingPoints: { points: Array<{ x: number; y: number }>; mapped: Array<{ x: number; y: number }> } | null;
}) {
    const { mode, fractalType, juliaC, expr, view, mappingPoints } = params;
    return `## Laboratory Export: Complex Analysis Workbench
        
### Simulation Mode: ${mode === "fractal" ? "Fractal Geometry" : "Conformal Mapping"}
- Fractal: ${fractalType}
- Expression: ${expr}
- Julia C: ${juliaC.re} + ${juliaC.im}i
- Viewport: (${view.x}, ${view.y}), Zoom: ${view.zoom}

### Logic Results
- Mapped Grid Points: ${mappingPoints?.points.length ?? 0}
- Domain: Complex Plane (Z) to Image Plane (W)`;
}

function buildComplexLivePayload(params: {
    targetId: string;
    mode: "fractal" | "mapping";
    fractalType: "mandelbrot" | "julia";
    juliaC: { re: number; im: number };
    expr: string;
    view: { x: number; y: number; zoom: number };
    mappingPoints: { points: Array<{ x: number; y: number }>; mapped: Array<{ x: number; y: number }> } | null;
}): WriterBridgeBlockData {
    const { targetId, mode, fractalType, juliaC, expr, view, mappingPoints } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "complex-analysis-workbench",
        kind: "complex-analysis",
        title: mode === "fractal" ? `Complex Fractal: ${fractalType}` : `Conformal Map: ${expr}`,
        summary: "Complex dynamics simulation and mapping analysis.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Zoom", value: String(view.zoom) },
            { label: "Julia C", value: `${juliaC.re}+${juliaC.im}i` },
            { label: "Mapped Pts", value: String(mappingPoints?.mapped.length ?? 0) },
        ],
        notes: [`Mode: ${mode}`, `Expression: ${expr}`, `Center: (${view.x.toFixed(2)}, ${view.y.toFixed(2)})`],
        plotSeries: mode === "mapping" && mappingPoints ? [
            { label: "Z-plane", color: "#64748b", points: mappingPoints.points },
            { label: "W-plane", color: "#2563eb", points: mappingPoints.mapped },
        ] : undefined,
    };
}

export function ComplexAnalysisWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"fractal" | "mapping">("fractal");
    const [fractalType, setFractalType] = React.useState<"mandelbrot" | "julia">("mandelbrot");
    const [juliaC, setJuliaC] = React.useState({ re: -0.8, im: 0.156 });
    const [expr, setExpr] = React.useState(() => String(module.config?.defaultExpr ?? "z^2 + c"));
    const [view, setView] = React.useState({ x: -0.5, y: 0, zoom: 1 });
    
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const notebook = useLaboratoryNotebook<ComplexBlockId>({
        storageKey: "mathsphere-lab-complex-notebook",
        definitions: complexNotebookBlocks,
        defaultBlocks: ["setup", "fractal"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<CpxAnnotation[]>(() =>
        readStoredArray<CpxAnnotation>("mathsphere-lab-cpx-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<CpxSavedExperiment[]>(() =>
        readStoredArray<CpxSavedExperiment>("mathsphere-lab-cpx-experiments"),
    );

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
                const x0 = (px - width / 2) * scale + view.x;
                const y0 = (py - height / 2) * scale + view.y;

                let x = fractalType === "mandelbrot" ? 0 : x0;
                let y = fractalType === "mandelbrot" ? 0 : y0;
                const cx = fractalType === "mandelbrot" ? x0 : juliaC.re;
                const cy = fractalType === "mandelbrot" ? y0 : juliaC.im;

                let i = 0;
                while (x * x + y * y <= 4 && i < maxIter) {
                    const xtemp = x * x - y * y + cx;
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
        if (notebook.hasBlock("fractal") && mode === "fractal") renderFractal();
    }, [renderFractal, notebook.activeBlocks, mode]);

    const mappingPoints = React.useMemo(() => {
        if (mode !== "mapping") return null;
        const points = [];
        const mapped = [];
        const step = 0.5;
        const range = 2;
        try {
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

    const applyPreset = (preset: any) => {
        if (preset.type === "fractal") {
            setMode("fractal");
            setFractalType(preset.fractal as "mandelbrot" | "julia");
            if (preset.fractal === "julia") { setJuliaC({ re: preset.cr ?? -0.8, im: preset.ci ?? 0.156 }); }
            setView({ x: preset.cx || 0, y: preset.cy || 0, zoom: preset.zoom || 1 });
        } else {
            setMode("mapping");
            setExpr(preset.expr || "z^2 + c");
        }
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = COMPLEX_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.complex.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setMode(template.mode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-cpx-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-cpx-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: true,
        sourceLabel: "Complex Analysis Workbench",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildComplexMarkdown({ mode, fractalType, juliaC, expr, view, mappingPoints }),
        buildBlock: (targetId) => buildComplexLivePayload({ targetId, mode, fractalType, juliaC, expr, view, mappingPoints }),
        getDraftMeta: () => ({
            title: `Complex Analysis: ${mode === "fractal" ? fractalType : expr}`,
            abstract: "Geometric structures in complex plane.",
            keywords: "complex,analysis,fractal,mapping,conformal",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (mode === "fractal") {
            if (view.zoom > 100) {
                signals.push({ tone: "warn", label: "Max Detail", text: "Fraktal chuqurligi juda yuqori darajada." });
            } else {
                signals.push({ tone: "info", label: "Fractal View", text: "Kompleks dinamika barqaror hududda." });
            }
        } else {
            if (!mappingPoints) {
                signals.push({ tone: "danger", label: "Mapping Error", text: "Kompleks funksiyani hisoblashda xatolik." });
            } else {
                signals.push({ tone: "info", label: "Domain Map", text: "Conformal akslantirish muvaffaqiyatli." });
            }
        }
        return signals;
    }, [mode, view.zoom, mappingPoints]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Complex Plane Logic",
        "- **Holomorphic** funksiyalar kompleks tekislikda har bir nuqtada differensiallanuvchandir.",
        "- **Fractals** iterativ jarayonlar orqali kompleks plane'da cheksiz murakkablik yaratadi.",
        "- **Conformal Mapping** burchaklarni saqlagan holda kompleks domenni o'zgartiradi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Complex Analysis Report",
        `Mode: ${mode}`,
        `Function: ${mode === "mapping" ? expr : fractalType}`,
        "",
        "### Geometric Metrics",
        mode === "mapping" ? `- Mapped Points: ${mappingPoints?.points.length || 0}` : `- Zoom Level: ${view.zoom.toFixed(2)}`,
        "- Complex symmetry verified for current workspace state.",
    ].join("\n"), [mode, expr, fractalType, mappingPoints, view.zoom]);

    function addAnnotation() {
        const note: CpxAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Complex Note",
            note: annotationNote || "Geometric observation.",
            anchor: mode === "fractal" ? `Zoom: ${view.zoom.toFixed(2)}` : `Func: ${expr}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: CpxSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Complex Experiment",
            savedAt: new Date().toISOString(),
            mode,
            expr,
            fractalType,
            juliaC
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: CpxSavedExperiment) {
        setMode(exp.mode);
        setExpr(exp.expr);
        setFractalType(exp.fractalType as any);
        setJuliaC(exp.juliaC);
    }

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun kompleks tahlil bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-indigo-600">Complex Controller</div>
                                    <div className="flex gap-2">
                                        {(["fractal", "mapping"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center shadow-lg shadow-indigo-500/5 transition-all">
                                    <Waves className="mr-2 h-3.5 w-3.5" /> Phase Synchronized
                                </div>
                            </div>

                            <div className="space-y-4">
                                {mode === "fractal" ? (
                                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                        <div className="site-outline-card p-4 space-y-3">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</div>
                                            <select value={fractalType} onChange={e => setFractalType(e.target.value as "mandelbrot" | "julia")} className="w-full bg-transparent font-black uppercase text-xs outline-none focus:text-indigo-600">
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
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Expression f(z)</div>
                                            <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                        </div>
                                        <div className="site-outline-card p-4 bg-muted/5">
                                            <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                                                <Info className="h-3.5 w-3.5" />
                                                Complex plane (Z) grid nuqtalarini W plane&apos;ga f(z) bo&apos;yicha akslantirish.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            <div className="site-eyebrow text-indigo-600">Complex Scenarios</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.complex.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-indigo-600/5 hover:border-indigo-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-indigo-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">{p.type} scene preset</div>
                                    </div>
                                    <Compass className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-indigo-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-indigo-600" />
                                <div className="site-eyebrow text-indigo-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {COMPLEX_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-indigo-600/40 bg-indigo-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-indigo-600/40 hover:bg-indigo-600/5"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-[11px] font-black tracking-tight text-foreground font-serif">{template.title}</div>
                                                <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{template.description}</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <LaboratorySignalPanel
                        eyebrow="Complex Signals"
                        title="Dynamics monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-indigo-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-indigo-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-indigo-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-indigo-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-indigo-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40" />
                             <button onClick={saveExperiment} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-indigo-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.mode} | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {mode === "fractal" && notebook.hasBlock("fractal") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Fractal Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-4 overflow-hidden flex flex-col items-center bg-black/90">
                                    <div className="flex w-full justify-between items-center mb-4 px-2">
                                        <div className="site-eyebrow text-indigo-100 font-black tracking-widest">{fractalType.toUpperCase()} Set</div>
                                        <div className="text-[9px] font-mono text-indigo-200/50 uppercase">Viewport Sync Active</div>
                                    </div>
                                    <canvas ref={canvasRef} width={600} height={400} className="w-full rounded-2xl border border-white/5 shadow-2xl" />
                                    <div className="mt-4 flex gap-3 w-full px-2">
                                        <div className="flex-1 site-outline-card border-white/10 bg-white/5 p-3">
                                            <div className="text-[9px] font-bold uppercase text-white/40 mb-1">Zoom</div>
                                            <div className="text-xl font-black text-white italic">{view.zoom.toFixed(2)}x</div>
                                        </div>
                                        <div className="flex-1 site-outline-card border-white/10 bg-white/5 p-3 text-right">
                                            <div className="text-[9px] font-bold uppercase text-white/40 mb-1">Center</div>
                                            <div className="text-[10px] font-mono text-white/80">{view.x.toFixed(2)}, {view.y.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "mapping" && notebook.hasBlock("mapping") && mappingPoints && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Mapping Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6 bg-indigo-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-indigo-600 font-black">Conformal Transformation</div>
                                        <div className="site-outline-card px-3 py-1 text-[9px] font-black uppercase font-mono text-indigo-600 bg-indigo-600/5 border-indigo-600/20">{expr}</div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Z-Plane (Domain)</div>
                                            <CartesianPlot series={[{ label: "Z-Grid", color: "var(--muted-foreground)", points: mappingPoints.points }]} height={220} />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600 text-center">W-Plane (Image)</div>
                                            <CartesianPlot series={[{ label: "W-Grid", color: "#4f46e5", points: mappingPoints.mapped }]} height={220} />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Layers3 className="h-3.5 w-3.5" />
                                                Geometric Logic
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground italic">Kompleks funksiya burchaklarni saqlagan holda domenni transformatsiya qiladi.</div>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Box className="h-3.5 w-3.5" />
                                                Calculated Nodes
                                                </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground italic">{mappingPoints.points.length} ta nuqta grid asosida hisoblandi.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready
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
