"use client";

import React from "react";
import { Focus, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, TrendingDown, Target, BarChart2, Layers3, Box, Info } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { buildOptimizationLandscape, solveGradientDescent, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildScatter3DTrajectoryData, buildSurfaceData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
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
        badge: "Opt export",
        title: "Optimizatsiya tahlilini nusxalash",
        description: "Gradient Descent va Loss history natijalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Minimizatsiya qilinayotgan funksiya va o'rganish tezligi (η) yoziladi.",
            "Yakuniy nuqta (x, y) va Loss qiymati hisoblanadi.",
            "Markdown formatida iteratsiya logi va yaqinlashish statistikasi yaratiladi.",
        ],
        note: "Machine Learning va konveks optimizatsiya hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Optimizatsiya natijasini writer'ga yuborish",
        description: "Tahlil natijasini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Optimizatsiya export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "3D sirt grafigi va loss trend draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type OptBlockId = "setup" | "surface" | "history" | "bridge";

const optNotebookBlocks = [
    { id: "setup" as const, label: "Optimization Setup", description: "Cost function va LR parameters" },
    { id: "surface" as const, label: "Convergence Map", description: "3D Gradient Descent path" },
    { id: "history" as const, label: "Loss Log", description: "Iterative steps va convergence speed" },
    { id: "bridge" as const, label: "Bridge", description: "Export training data" },
];

const OPT_WORKFLOW_TEMPLATES = [
    {
        id: "convex-audit",
        title: "Convex Valley Convergence",
        description: "Konveks funksiyada global minimumga yaqinlashish tahlili.",
        presetLabel: "Convex Paraboloid",
        blocks: ["setup", "surface", "history"] as const,
    },
    {
        id: "lr-stability",
        title: "Learning Rate Stability",
        description: "Turli LR qiymatlarida yaqinlashish barqarorligini tekshirish.",
        presetLabel: "Rosenbrock Valley",
        blocks: ["setup", "surface", "history"] as const,
    },
] as const;

type OptAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type OptSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    expr: string;
    x0: string;
    y0: string;
    lr: string;
    epochs: string;
};

function buildOptimizationMarkdown(expr: string, lr: string, result: any) {
    const last = result[result.length - 1];
    return `## Laboratory Export: Optimization Studio
        
### Optimization Parameters
- Cost Function: J(x, y) = ${expr}
- Learning Rate (η): ${lr}
- Epochs: ${result.length}

### Convergence Result
- Final Coordinates: (${last.x.toFixed(6)}, ${last.y.toFixed(6)})
- Final Loss (J): ${last.z.toFixed(10)}

### Loss History Snippet
- Start Loss: ${result[0].z.toFixed(4)}
- Mid Loss: ${result[Math.floor(result.length / 2)].z.toFixed(4)}
- Convergence reached via Gradient Descent steering.`;
}

function buildOptimizationLivePayload(targetId: string, expr: string, lr: string, result: any): WriterBridgeBlockData {
    const last = result[result.length - 1];
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "optimization-studio",
        kind: "optimization-analysis",
        title: `Minimizing: J = ${expr}`,
        summary: "Gradient descent optimization and cost surface exploration workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Final Loss", value: String(last.z.toFixed(6)) },
            { label: "Rate", value: lr },
            { label: "Epochs", value: String(result.length) },
        ],
        notes: [
            `Coordinates: (${last.x.toFixed(4)}, ${last.y.toFixed(4)})`,
            `Surface expression: ${expr}`,
            "Convergence monitored via iterative gradient logging.",
        ],
        plotSeries: [
            { label: "Loss History", color: "#8b5cf6", points: result.map((p: any, i: number) => ({ x: i, y: p.z })) }
        ],
    };
}

export function OptimizationStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [expr, setExpr] = React.useState("x^2 + y^2");
    const [x0, setX0] = React.useState("2.0");
    const [y0, setY0] = React.useState("2.0");
    const [lr, setLr] = React.useState("0.1");
    const [epochs, setEpochs] = React.useState("25");
    
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<OptAnnotation[]>(() =>
        readStoredArray<OptAnnotation>("mathsphere-lab-opt-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<OptSavedExperiment[]>(() =>
        readStoredArray<OptSavedExperiment>("mathsphere-lab-opt-experiments"),
    );

    const notebook = useLaboratoryNotebook<OptBlockId>({
        storageKey: "mathsphere-lab-opt-notebook",
        definitions: optNotebookBlocks,
        defaultBlocks: ["setup", "surface"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const optimizationResult = React.useMemo(() => {
        try {
            return solveGradientDescent(expr, Number(x0), Number(y0), Number(lr), Number(epochs));
        } catch { return null; }
    }, [expr, x0, y0, lr, epochs]);

    const optimizationLandscape = React.useMemo(() => {
        if (!optimizationResult) return null;
        try {
            return buildOptimizationLandscape(expr, optimizationResult);
        } catch { return null; }
    }, [expr, optimizationResult]);

    const applyPreset = (p: any) => {
        setExpr(p.expr);
        setX0(p.x0);
        setY0(p.y0);
        setLr(p.lr || "0.1");
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = OPT_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.optimization.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-opt-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-opt-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!optimizationResult,
        sourceLabel: "Optimization Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildOptimizationMarkdown(expr, lr, optimizationResult),
        buildBlock: (targetId) => buildOptimizationLivePayload(targetId, expr, lr, optimizationResult),
        getDraftMeta: () => ({
            title: `Minimizing ${expr}`,
            abstract: "Detailed optimization trajectory and cost analysis report.",
            keywords: "optimization,gradient,descent,loss,minimization",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (!optimizationResult) {
            signals.push({ tone: "danger", label: "Gradient Failure", text: "Minimizatsiya hisoblanmadi. Funksiyani tekshiring." });
        } else {
            const last = optimizationResult[optimizationResult.length - 1];
            if (last.z > 1) {
                signals.push({ tone: "warn", label: "High Residual", text: "Minimumga yetarlicha yaqinlashilmadi." });
            } else {
                signals.push({ tone: "info", label: "Optimal State", text: "Gradient descent barqaror nuqtaga yetdi." });
            }
        }
        return signals;
    }, [optimizationResult]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Optimization Mechanics",
        "- **Gradient Descent** funksiya kamayish yo'nalishini gradient vektori orqali aniqlaydi.",
        "- **Learning Rate (η)** har bir iteratsiyada qadam kattaligini belgilaydi.",
        "- **Rosenbrock** kabi 'narrow valley' funksiyalar yaqinlashish uchun ko'proq iteratsiya talab qiladi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Optimization Study Report",
        `Function: ${expr}`,
        `Learning Rate: ${lr}`,
        "",
        "### Performance Metrics",
        optimizationResult ? `- Final Loss (J) = ${optimizationResult[optimizationResult.length - 1].z.toFixed(8)}` : "- N/A",
        "- Minimum coordinates successfully mapped in 3D space.",
    ].join("\n"), [expr, lr, optimizationResult]);

    function addAnnotation() {
        if (!optimizationResult) return;
        const note: OptAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Opt Note",
            note: annotationNote || "Gradient trend observation.",
            anchor: `Loss: ${optimizationResult[optimizationResult.length - 1].z.toFixed(4)}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: OptSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Optimization Experiment",
            savedAt: new Date().toISOString(),
            expr,
            x0,
            y0,
            lr,
            epochs
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: OptSavedExperiment) {
        setExpr(exp.expr);
        setX0(exp.x0);
        setY0(exp.y0);
        setLr(exp.lr);
        setEpochs(exp.epochs);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Optimization Studio"
                description="Cost functions tahlili, Gradient Descent va parameter tuning."
                activeBlocks={notebook.activeBlocks}
                definitions={optNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun optimallash bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-violet-600">Optimization Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Minimization Engine</div>
                                </div>
                                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 flex items-center shadow-lg shadow-violet-500/5 transition-all">
                                    <TrendingDown className="mr-2 h-3.5 w-3.5" /> Steepest Descent Active
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Cost Function J(x, y)</div>
                                    <input value={expr} onChange={e => setExpr(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <div className="site-outline-card p-4 space-y-2"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Initial X</div><input value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-4 space-y-2"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Initial Y</div><input value={y0} onChange={e => setY0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-4 space-y-2"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rate (η)</div><input value={lr} onChange={e => setLr(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-4 space-y-2"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Max Epochs</div><input value={epochs} onChange={e => setEpochs(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                </div>
                            </div>
                        </div>
                    )}
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-violet-600" />
                                <div className="site-eyebrow text-violet-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {OPT_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-violet-600/40 bg-violet-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-violet-600/40 hover:bg-violet-600/5"
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
                            <Sparkles className="h-4 w-4 text-violet-600" />
                            <div className="site-eyebrow text-violet-600">Surface Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.optimization.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-violet-600/5 hover:border-violet-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-violet-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">Loss Surface Scenario</div>
                                    </div>
                                    <Target className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Optimization Signals"
                        title="Descent monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-violet-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-violet-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-violet-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-violet-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-violet-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-violet-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-violet-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-violet-600/40" />
                             <button onClick={saveExperiment} className="bg-violet-600 text-white px-4 rounded-xl hover:bg-violet-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-violet-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.expr} | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("surface") && optimizationResult && optimizationLandscape && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Projection Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6 flex flex-col min-h-[500px]">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-violet-600 font-black tracking-widest">Convergence Map (3D)</div>
                                        <Focus className="h-4 w-4 text-violet-600/50" />
                                    </div>
                                    <div className="w-full h-[400px] flex-grow">
                                        <ScientificPlot 
                                            type="scatter3d" 
                                            data={[
                                                ...buildSurfaceData(optimizationLandscape.surfaceSamples, { label: "Loss surface", colorscale: "Turbo" }),
                                                ...buildScatter3DTrajectoryData(optimizationLandscape.path, {
                                                    label: "Gradient descent path",
                                                    lineColor: "#4c1d95",
                                                    startColor: "#ef4444",
                                                    endColor: "#f59e0b",
                                                }),
                                            ]} 
                                            title={`Minima Path (η=${lr})`}
                                            insights={["surface landscape", "descent trajectory", "camera presets"]}
                                            snapshotFileName="optimization-landscape"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("history") && optimizationResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-violet-600" />
                                <div className="site-eyebrow text-violet-600">Calculated Epoch Stats</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                <div className="site-outline-card p-4 bg-violet-600/5 border-violet-600/20 shadow-lg shadow-violet-600/5"><div className="text-[9px] font-black text-violet-600 uppercase mb-1">Final Loss (J)</div><div className="font-serif text-xl font-black italic">{optimizationResult[optimizationResult.length - 1].z.toFixed(8)}</div></div>
                                <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Final X</div><div className="font-serif text-xl font-black italic">{optimizationResult[optimizationResult.length - 1].x.toFixed(4)}</div></div>
                                <div className="site-outline-card p-4"><div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Final Y</div><div className="font-serif text-xl font-black italic">{optimizationResult[optimizationResult.length - 1].y.toFixed(4)}</div></div>
                            </div>
                            
                            <div className="h-[220px]">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Loss Reduction Trend</div>
                                <CartesianPlot 
                                    series={[{ label: "Loss Value", color: "#8b5cf6", points: optimizationResult.map((p: any, i: number) => ({ x: i, y: p.z })) }]}
                                    height={180}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 mt-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Gradient Logic
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Gradient vektori boyicha minimallashuv barqaror davom etdi.</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Global Minimum
                                        </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Iteratsiyalar yakuniga ko'ra optimal nuqta topildi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!optimizationResult}
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
