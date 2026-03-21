"use client";

import React from "react";
import { Timer, Activity, Zap, Sparkles, Compass, Layers3, Box, Info } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { calculateLorentz, getLightConeGeometry, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildParametricSurfaceData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { ArrowRight, Plus } from "lucide-react";

const exportGuides = {
    copy: {
        badge: "Relativity export",
        title: "Nisbiylik natijasini nusxalash",
        description: "Lorentz o'zgarishlari va vaqt kengayishi hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Lorentz faktori (gamma) va vaqt kengayishi qiymatlari yoziladi.",
            "Beta (v/c) nisbati va mass-energy ekvivalentligi malumotlari qo'shiladi.",
            "Markdown formatida chiroyli jadval va xulosa yaratiladi.",
        ],
        note: "Maqolaga fizik simulyatsiya natijalarini qo'shish uchun mos.",
    },
    send: {
        badge: "Writer import",
        title: "Fizika natijasini writer'ga yuborish",
        description: "Relativistik hisoborni writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Nisbiylik export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Gamma-faktor va length contraction natijalari draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type RelativityBlockId = "setup" | "lorentz" | "cone" | "bridge";

const relativityNotebookBlocks = [
    { id: "setup" as const, label: "Physics Setup", description: "Velocity (v) vs Speed of Light (c)" },
    { id: "lorentz" as const, label: "Lorentz Factors", description: "Gamma (γ) va Time Dilation" },
    { id: "cone" as const, label: "Light Cone", description: "3D Spacetime Geometry" },
    { id: "bridge" as const, label: "Bridge", description: "Export relativistic data" },
];

const RELATIVITY_WORKFLOW_TEMPLATES = [
    {
        id: "light-cone-audit",
        title: "Light Cone Causality",
        description: "Fazoviy vaqt strukturasida sabab-oqibat chegaralarini tahlil qilish.",
        mode: "cone" as const,
        presetLabel: "Speed of Light (c)",
        blocks: ["setup", "cone"] as const,
    },
    {
        id: "twin-paradox",
        title: "Twin Paradox Sim",
        description: "Vaqt kengayishi natijasida yuzaga keladigan relativistik effektlar.",
        mode: "kinematics" as const,
        presetLabel: "Ultrafast Electron",
        blocks: ["setup", "lorentz"] as const,
    },
] as const;

type RelAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type RelSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    v: string;
    mode: "kinematics" | "cone";
};

function formatNumber(value: number, digits = 8) {
    if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "--";
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildRelativityMarkdown(params: {
    v: number;
    lorentz: ReturnType<typeof calculateLorentz>;
    mode: "kinematics" | "cone";
}) {
    const { v, lorentz, mode } = params;
    const c = 299792458;
    const beta = v / c;

    return `## Laboratory Export: Special Relativity Analysis
        
### Velocity Parameters
- Velocity (v): ${v.toLocaleString()} m/s
- Light Speed (c): ${c.toLocaleString()} m/s
- Beta (v/c): ${beta.toFixed(6)}

### Relativistic Results
- Lorentz Factor (γ): ${formatNumber(lorentz.gamma)}
- Time Dilation (Δt'): ${formatNumber(lorentz.dilation)}s
- Length Contraction (1/γ): ${formatNumber(lorentz.lengthContraction)}m
- Relativistic Mass Ratio: ${formatNumber(lorentz.gamma)}`;
}

function buildRelativityLivePayload(params: {
    targetId: string;
    v: number;
    lorentz: ReturnType<typeof calculateLorentz>;
    mode: "kinematics" | "cone";
}): WriterBridgeBlockData {
    const { targetId, v, lorentz, mode } = params;
    const beta = v / 299792458;

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "relativity-lab",
        kind: "relativity",
        title: `Relativity Study: v=${beta.toFixed(3)}c`,
        summary: "Special relativity simulation: lorentz factor and time dilation results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Beta (v/c)", value: beta.toFixed(6) },
            { label: "Gamma", value: formatNumber(lorentz.gamma, 6) },
            { label: "Time Dilation", value: formatNumber(lorentz.dilation, 4) },
            { label: "Contraction", value: formatNumber(lorentz.lengthContraction, 4) },
        ],
        notes: [`Velocity: ${v.toLocaleString()} m/s`, `Mode: ${mode === "kinematics" ? "Special Relativity" : "Light Cone"}`],
    };
}

export function RelativityLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [v, setV] = React.useState(() => String(module.config?.defaultV ?? "200000000"));
    const [mode, setMode] = React.useState<"kinematics" | "cone">("kinematics");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<RelAnnotation[]>(() =>
        readStoredArray<RelAnnotation>("mathsphere-lab-rel-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<RelSavedExperiment[]>(() =>
        readStoredArray<RelSavedExperiment>("mathsphere-lab-rel-experiments"),
    );

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
            setV(String(p.v));
        }
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = RELATIVITY_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.relativity.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setMode(template.mode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-rel-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-rel-experiments", savedExperiments);
    }, [savedExperiments]);

    const c = 299792458;

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: true,
        sourceLabel: "Relativity Observatorio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildRelativityMarkdown({ v: Number(v), lorentz: lorentzResult, mode }),
        buildBlock: (targetId) => buildRelativityLivePayload({ targetId, v: Number(v), lorentz: lorentzResult, mode }),
        getDraftMeta: () => ({
            title: `Relativistic Analysis (v=${(Number(v)/c).toFixed(3)}c)`,
            abstract: "Spacetime dilation and lorentz transformation results.",
            keywords: "relativity,lorentz,gamma,dilation",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        const beta = Number(v) / c;
        if (beta > 0.9999) {
            signals.push({ tone: "danger", label: "Causality Limit", text: "Yorug'lik tezligiga juda yaqin. Lorentz faktor singulyar holatda." });
        } else if (beta > 0.8) {
            signals.push({ tone: "warn", label: "High Relativistic", text: "Vaqt kengayishi sezilarli darajada ortib ketdi." });
        } else {
            signals.push({ tone: "info", label: "Stable Frame", text: "Lorentz o'zgarishlari klassik chegaraga yaqin." });
        }
        return signals;
    }, [v, c]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Relativity Principles",
        "- **Time Dilation** orqali harakatdagi soat qo'zg'almas kuzatuvchiga nisbatan sekinroq yuradi.",
        "- **Length Contraction** harakat yo'nalishi bo'yicha masofalarni qisqartiradi.",
        "- **Light Cone** har bir nuqta uchun sabab-oqibat o'zaro bog'liqlik chegarasidir.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Relativity Analysis Report",
        `Velocity: ${v} m/s`,
        `Beta Ratio: ${(Number(v)/c).toFixed(6)}`,
        "",
        "### Physics Metrics",
        `- Gamma Factor = ${lorentzResult.gamma.toFixed(6)}`,
        `- Time Dilation = ${lorentzResult.dilation.toFixed(4)}s`,
        "- Spacetime causality structure verified within the light cone.",
    ].join("\n"), [v, c, lorentzResult]);

    function addAnnotation() {
        const note: RelAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Physics Observation",
            note: annotationNote || "Observation in this frame.",
            anchor: `Beta: ${(Number(v)/c).toFixed(4)}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: RelSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Relativity Experiment",
            savedAt: new Date().toISOString(),
            v,
            mode
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: RelSavedExperiment) {
        setV(exp.v);
        setMode(exp.mode);
    }

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun fizik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-orange-600">Physics Core</div>
                                    <div className="flex gap-2">
                                        {(["kinematics", "cone"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m === "kinematics" ? "Special Relativity" : "Light Cone"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center shadow-lg shadow-orange-500/5">
                                    <Compass className="mr-2 h-3.5 w-3.5" />
                                    Spacetime Active
                                </div>
                            </div>

                            {mode === "kinematics" && (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Velocity (v) m/s (max: 299,792,457)</div>
                                        <input type="number" value={v} onChange={e => setV(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="site-outline-card p-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Beta Ratio (β)</div>
                                            <div className="mt-1 text-xl font-black text-orange-600">{(Number(v) / c).toFixed(8)}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Light speed (%)</div>
                                            <div className="mt-1 text-xl font-black">{(Number(v) / c * 100).toFixed(4)}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-orange-600" />
                                <div className="site-eyebrow text-orange-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {RELATIVITY_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-orange-600/40 bg-orange-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-orange-600/40 hover:bg-orange-600/5"
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
                            <Sparkles className="h-4 w-4 text-orange-600" />
                            <div className="site-eyebrow text-orange-600">Physics Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.relativity.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-orange-600/5 hover:border-orange-600/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-orange-600 font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.title || 'Special Relativity'}</div>
                                    </div>
                                    <Timer className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-orange-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Relativity Signals"
                        title="Spacetime monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-orange-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-orange-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-orange-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-orange-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-orange-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-600/40" />
                             <button onClick={saveExperiment} className="bg-orange-600 text-white px-4 rounded-xl hover:bg-orange-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-orange-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.v} m/s | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {mode === "kinematics" && notebook.hasBlock("lorentz") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Lorentz Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="site-eyebrow text-orange-600">Relativistic Analysis</div>
                                        <div className="site-outline-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">β = {(Number(v)/c).toFixed(4)}</div>
                                    </div>
                                    
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="site-outline-card p-6 bg-orange-600/5 border-orange-600/20">
                                            <div className="text-[10px] font-black uppercase text-orange-600 mb-1">Gamma (γ)</div>
                                            <div className="font-serif text-3xl font-black">{lorentzResult.gamma === Infinity ? '∞' : formatNumber(lorentzResult.gamma, 6)}</div>
                                        </div>
                                        <div className="site-outline-card p-6">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time Dilation</div>
                                            <div className="font-serif text-3xl font-black">{lorentzResult.dilation === Infinity ? '∞' : formatNumber(lorentzResult.dilation, 4)}s</div>
                                        </div>
                                        <div className="site-outline-card p-6">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Contraction</div>
                                            <div className="font-serif text-3xl font-black">{formatNumber(lorentzResult.lengthContraction, 4)}m</div>
                                        </div>
                                    </div>

                                    <div className="h-[250px] w-full">
                                        <CartesianPlot 
                                            title="Gamma Factor Growth"
                                            series={[{ label: "Gamma vs v/c", color: "var(--accent)", points: Array.from({ length: 25 }, (_, i) => {
                                                const vel = (i / 24) * 0.995 * c;
                                                return { x: vel/c, y: calculateLorentz(vel).gamma };
                                            }) }]}
                                        />
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Layers3 className="h-3.5 w-3.5" />
                                                Spacetime Insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                Cozibaviylik kuchi ortgan sari vaqtning nisbiy o'zgarishi geometrik progressiya bilan o'sib boradi.
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Box className="h-3.5 w-3.5" />
                                                Energy Insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                Relativistik massa o'sishi va kinetik energiya gamma faktori bilan to'g'ridan-to'g'ri bog'liq.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "cone" && notebook.hasBlock("cone") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Geometric Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-orange-600">3D Light Cone Representation</div>
                                    <div className="w-full h-[400px]">
                                        <ScientificPlot 
                                            type="scatter3d" 
                                            data={coneTraces} 
                                            title="Spacetime Causality Structure"
                                            insights={["future cone", "past cone", "null rays"]}
                                        />
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <p className="text-sm leading-6 text-muted-foreground italic font-serif">
                                            "Nur konusi fazoviy vaqtning sabab-oqibat chegarasini belgilaydi. Hech qanday signal konus tashqarisiga chiqa olmaydi."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={true}
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
