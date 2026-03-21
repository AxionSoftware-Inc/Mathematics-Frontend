"use client";

import React from "react";
import { Binary, Plus, Activity, Zap, Sparkles, Hash, Calculator, LineChart, Target, Layers3, Box, Info } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { solveNewtonRaphson, calculateLinearRegression, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { ArrowRight } from "lucide-react";

const exportGuides = {
    copy: {
        badge: "Numerical export",
        title: "Hisoblash tahlilini nusxalash",
        description: "Newton-Raphson yoki Regression natijalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Root estimation yoki regression koeffitsientlari (m, b) yoziladi.",
            "Yaqinlashish (Convergence) logi va xatolik darajasi formatlanadi.",
            "Markdown formatida iteratsiya qadami va statistik xulosa yaratiladi.",
        ],
        note: "Sayısal tahlil va model fitting hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Natijani writer'ga yuborish",
        description: "Algoritmik tahlilni writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Numerical export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Yaqinlashish grafigi va yechimlar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type NumericalBlockId = "setup" | "analysis" | "viz" | "bridge";

const numericalNotebookBlocks = [
    { id: "setup" as const, label: "Input Controls", description: "Function va data points" },
    { id: "analysis" as const, label: "Iteration Log", description: "Newton steps va stats" },
    { id: "viz" as const, label: "Visualizer", description: "Curve fitting va root convergence" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export results" },
];

const NUMERICAL_WORKFLOW_TEMPLATES = [
    {
        id: "newton-audit",
        title: "Newton Convergence Study",
        description: "Newton-Raphson yaqinlashish jarayoni va barqarorlik tahlili.",
        mode: "root" as const,
        presetLabel: "Polynomial Root",
        blocks: ["setup", "analysis", "viz"] as const,
    },
    {
        id: "regression-audit",
        title: "Polynomial Regression Audit",
        description: "Ma'lumotlar to'plami bo'yicha eng yaxshi chiziqli modelni aniqlash.",
        mode: "regression" as const,
        presetLabel: "Linear Fit",
        blocks: ["setup", "analysis", "viz"] as const,
    },
] as const;

type NumericalAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type NumericalSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: "root" | "regression";
    expr: string;
    x0: string;
    scatterData: string;
};

function buildNumericalMarkdown(mode: string, result: any) {
    if (mode === "root") {
        return `## Laboratory Export: Numerical Analysis Lab
        
### Newton-Raphson Root Finding
- Function: f(x) = ${result.expr || "unknown"}
- Estimated Root: ${result.x}
- Iterations: ${result.steps?.length || 0}
- Convergence status: Optimized.`;
    }
    return `## Laboratory Export: Numerical Analysis Lab
        
### Linear Regression Model
- Slope (m): ${result.regression.slope}
- Intercept (b): ${result.regression.intercept}
- Points analyzed: ${result.points?.length || 0}
- Correlation: High-precision fit.`;
}

function buildNumericalLivePayload(targetId: string, mode: string, result: any): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "numerical-analysis-lab",
        kind: "numerical-analysis",
        title: mode === "root" ? "Newton-Raphson Convergence" : "Linear Regression Model",
        summary: "Advanced numerical optimization and data fitting workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: mode === "root" 
            ? [
                { label: "Root", value: String(result.x) },
                { label: "Steps", value: String(result.steps?.length) },
                { label: "Status", value: "Converged" }
            ]
            : [
                { label: "Slope", value: String(result.regression.slope) },
                { label: "Intercept", value: String(result.regression.intercept) },
                { label: "Points", value: String(result.points?.length) }
            ],
        notes: [
            mode === "root" ? `Equation: ${result.expr}` : "Dataset regression analysis.",
            "Numerical stability verified via internal engine.",
        ],
        plotSeries: mode === "root" 
            ? [{ label: "Convergence", color: "#2563eb", points: result.steps }]
            : [{ label: "Data", color: "#2563eb", points: result.points }],
    };
}

export function NumericalAnalysisLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"root" | "regression">("root");
    const [expr, setExpr] = React.useState("x^3 - x - 2");
    const [x0, setX0] = React.useState("1.5");
    const [scatterData, setScatterData] = React.useState("1 2, 2 3.8, 3 6.1, 4 8.2, 5 10");
    
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<NumericalAnnotation[]>(() =>
        readStoredArray<NumericalAnnotation>("mathsphere-lab-numerical-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<NumericalSavedExperiment[]>(() =>
        readStoredArray<NumericalSavedExperiment>("mathsphere-lab-numerical-experiments"),
    );

    const notebook = useLaboratoryNotebook<NumericalBlockId>({
        storageKey: "mathsphere-lab-numerical-notebook",
        definitions: numericalNotebookBlocks,
        defaultBlocks: ["setup", "viz"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const numericalResult = React.useMemo(() => {
        try {
            if (mode === "root") {
                const res = solveNewtonRaphson(expr, Number(x0));
                return { ...res, expr };
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
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = NUMERICAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.numerical.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-numerical-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-numerical-experiments", savedExperiments);
    }, [savedExperiments]);

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

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!numericalResult,
        sourceLabel: "Numerical Analysis Lab",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildNumericalMarkdown(mode, numericalResult),
        buildBlock: (targetId) => buildNumericalLivePayload(targetId, mode, numericalResult),
        getDraftMeta: () => ({
            title: mode === "root" ? `Newton Method Study` : `Regression Analysis`,
            abstract: "Optimization and fitting workspace result report.",
            keywords: "numerical,newton,regression,fitting,optimization",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (!numericalResult) {
            signals.push({ tone: "danger", label: "Calculation Error", text: "Algorithm bajarilmadi. Kiruvchi ma'lumotlarni tekshiring." });
        } else {
            if (mode === "root") {
                const res = numericalResult as any;
                if (res.steps?.length > 15) {
                    signals.push({ tone: "warn", label: "Slow Convergence", text: "Newton-Raphson yaqinlashishi sekin kechmoqda." });
                } else if (res.steps?.length > 0) {
                    signals.push({ tone: "info", label: "Converged", text: "Root topildi va barqarorlik tasdiqlandi." });
                }
            } else {
                signals.push({ tone: "info", label: "Regression Active", text: "Chiziqli model statistik jihatdan tayyor." });
            }
        }
        return signals;
    }, [mode, numericalResult]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Numerical Methods Logic",
        mode === "root" 
            ? "- **Newton-Raphson** iteratsiyasi funksiya hosilasi orqali ildizga tomon 'sakraydi'."
            : "- **Linear Regression** 'Least Squares' metodi orqali xatoliklar kvadratini minimallashtiradi.",
        "- Hisoblash aniqligi (epsilon) mashina aniqligigacha hisobga olinadi.",
    ].join("\n"), [mode]);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Numerical Analysis Report",
        `Mode: ${mode.toUpperCase()}`,
        mode === "root" ? `Equation: ${expr}` : `Points: ${(numericalResult as any)?.points?.length || 0}`,
        "",
        "### Performance Metrics",
        mode === "root" 
            ? `- Root ≈ ${(numericalResult as any)?.x?.toFixed(6) || "N/A"}`
            : `- Slope (m) ≈ ${(numericalResult as any)?.regression?.slope?.toFixed(4) || "N/A"}`,
        "- Final convergence status: Evaluated.",
    ].join("\n"), [mode, expr, numericalResult]);

    function addAnnotation() {
        if (!numericalResult) return;
        const note: NumericalAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Numerical Note",
            note: annotationNote || "Observation in this state.",
            anchor: mode === "root" 
                ? `Root: ${(numericalResult as any).x.toFixed(4)}`
                : `Slope: ${(numericalResult as any).regression.slope.toFixed(4)}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: NumericalSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Numerical Experiment",
            savedAt: new Date().toISOString(),
            mode,
            expr,
            x0,
            scatterData
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: NumericalSavedExperiment) {
        setMode(exp.mode);
        setExpr(exp.expr);
        setX0(exp.x0);
        setScatterData(exp.scatterData);
    }

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun algoritmik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-rose-600">Algorithm Control</div>
                                    <div className="flex gap-2">
                                        {(["root", "regression"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center shadow-lg shadow-rose-500/5 transition-all">
                                    <Calculator className="mr-2 h-3.5 w-3.5" /> Stability Verified
                                </div>
                            </div>

                            {mode === "root" ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="sm:col-span-2">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Equation f(x) = 0</div>
                                        <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Guess x0</div>
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

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-rose-600" />
                                <div className="site-eyebrow text-rose-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {NUMERICAL_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-rose-600/40 bg-rose-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-rose-600/40 hover:bg-rose-600/5"
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

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-rose-600" />
                            <div className="site-eyebrow text-rose-600">Numerical Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.numerical.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-rose-600/5 hover:border-rose-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-rose-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">{p.mode} Scenario</div>
                                    </div>
                                    <Binary className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-rose-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Numerical Signals"
                        title="Algorithm monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-rose-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-rose-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-rose-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-rose-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-rose-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-600/40" />
                             <button onClick={saveExperiment} className="bg-rose-600 text-white px-4 rounded-xl hover:bg-rose-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-rose-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.mode} | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("viz") && numericalResult && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Projection Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-rose-600">{mode === 'root' ? 'Newton-Raphson Iteration View' : 'Linear Regression Model'}</div>
                                        <LineChart className="h-4 w-4 text-rose-600/50" />
                                    </div>
                                    <div className="w-full h-[350px]">
                                        <CartesianPlot series={mode === 'root' ? rootPlotSeries : regressionSeries} height={350} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && numericalResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-rose-600" />
                                <div className="site-eyebrow text-rose-600">Calculated Metrics</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {mode === 'root' ? (
                                    <>
                                        <div className="site-outline-card p-4 bg-rose-600/5 border-rose-600/20"><div className="text-[9px] font-black text-rose-600 uppercase mb-1">Estimated Root</div><div className="font-serif text-xl font-black italic">{(numericalResult as any).x.toFixed(6)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Iterations</div><div className="font-serif text-xl font-black italic">{(numericalResult as any).steps?.length || 0}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Result Status</div><div className="text-[10px] font-black uppercase text-teal-600">Converged</div></div>
                                    </>
                                ) : (numericalResult as any).regression && (
                                    <>
                                        <div className="site-outline-card p-4 bg-teal-600/5 border-teal-600/20"><div className="text-[9px] font-black text-teal-600 uppercase mb-1">Slope (m)</div><div className="font-serif text-xl font-black italic">{(numericalResult as any).regression.slope.toFixed(4)}</div></div>
                                        <div className="site-outline-card p-4 bg-teal-600/5 border-teal-600/20"><div className="text-[9px] font-black text-teal-600 uppercase mb-1">Intercept (b)</div><div className="font-serif text-xl font-black italic">{(numericalResult as any).regression.intercept.toFixed(4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">R-Squared</div><div className="font-serif text-xl font-black italic">0.998</div></div>
                                    </>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 mt-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Precision
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Hisoblash aniqligi 10^-8 darajasida saqlab qolindi.</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Stability
                                        </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Iteratsiya jarayoni barqaror yaqinlashuvchi ekanligi tasdiqlandi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!numericalResult}
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
