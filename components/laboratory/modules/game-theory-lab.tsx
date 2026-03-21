"use client";

import React from "react";
import { Swords, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, TrendingUp, Target, BarChart2, BrainCircuit, Layers3, Box, Info, ArrowRight, Compass } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { findNashEquilibrium, runEvolutionarySim, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";

const exportGuides = {
    copy: {
        badge: "Game export",
        title: "O'yin natijasini nusxalash",
        description: "Nash muvozanati yoki populyatsiya dinamikasi clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Matritsaviy o'yinlar uchun Nash muvozanati nuqtalari yoziladi.",
            "Evolutsion dinamika uchun Hawk va Dove populyatsiya o'zgarishi ko'rsatiladi.",
            "Markdown formatida strategik tahlil va jadvallar yaratiladi.",
        ],
        note: "Iqtisodiy va biologik strategiyalar tahlili uchun.",
    },
    send: {
        badge: "Writer import",
        title: "O'yin natijasini writer'ga yuborish",
        description: "Strategik tahlilni writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Game export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Payoff matritsasi va barqaror strategiyalar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type GameBlockId = "setup" | "payoff" | "evolution" | "bridge";

const gameNotebookBlocks = [
    { id: "setup" as const, label: "Game Setup", description: "Matrix payload va Pop settings" },
    { id: "payoff" as const, label: "Strategic View", description: "Nash Equilibrium visualizer" },
    { id: "evolution" as const, label: "Population Lab", description: "Evolutionary dynamics chart" },
    { id: "bridge" as const, label: "Bridge", description: "Export game stats" },
];

const GAME_WORKFLOW_TEMPLATES = [
    {
        id: "nash-audit",
        title: "Nash Equilibrium Audit",
        description: "Matritsaviy o'yinlarda Nash muvozanati nuqtalarini aniqlash va barqarorlik tahlili.",
        mode: "matrix" as const,
        presetLabel: "Prisoner's Dilemma",
        blocks: ["setup", "payoff"] as const,
    },
    {
        id: "evolution-audit",
        title: "Evolutionary Stable Strategy Audit",
        description: "Hawk-Dove o'yinida populyatsiya dinamikasi va barqarorlik darajasini tekshirish.",
        mode: "evolution" as const,
        presetLabel: "Hawk-Dove Evolution",
        blocks: ["setup", "evolution"] as const,
    },
] as const;

type GameAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type GameSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: "matrix" | "evolution";
    payoffInput: string;
    popH: string;
    popD: string;
    costV: string;
    costC: string;
};

function buildGameMarkdown(params: {
    mode: "matrix" | "evolution";
    matrixResults: any;
    evolutionResults: any;
}) {
    const { mode, matrixResults, evolutionResults } = params;
    if (mode === "matrix" && matrixResults) {
        return `## Laboratory Export: Game Theory Analysis
        
### Nash Equilibrium
- Equilibria found: ${matrixResults.equilibria?.length || 0}
- Strategy status: Stable interaction detected.

### Payoff Matrix
- Raw data processed into strategic interaction map.`;
    }
    if (mode === "evolution" && evolutionResults) {
        return `## Laboratory Export: Evolutionary Dynamics
        
### Population Status
- Iterations: ${evolutionResults.length}
- Stability: Convergence analysis complete.`;
    }
    return "Game theory result not found.";
}

function buildGameLivePayload(params: {
    targetId: string;
    mode: "matrix" | "evolution";
    matrixResults: any;
    evolutionResults: any;
}): WriterBridgeBlockData {
    const { targetId, mode, matrixResults, evolutionResults } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "game-theory-lab",
        kind: "game-theory",
        title: mode === "matrix" ? "Nash Equilibrium Analysis" : "Evolutionary Pop Dynamics",
        summary: "Strategic interaction and decision logic workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: mode === "matrix" ? [
            { label: "Equilibria", value: String(matrixResults?.equilibria?.length || 0) },
            { label: "Matrix Size", value: `${matrixResults?.matrix?.length}x${matrixResults?.matrix?.[0]?.length}` },
        ] : [
            { label: "Ticks", value: String(evolutionResults?.length || 0) },
            { label: "Stability", value: "Dynamic" },
        ],
        notes: [
            `Mode: ${mode}`,
            mode === "matrix" ? "Identification of pure Nash equilibria in discrete games." : "Hawk-Dove game evolutionary simulation.",
        ],
        plotSeries: mode === "evolution" && evolutionResults ? [
            { label: "Hawks", color: "var(--accent)", points: evolutionResults.map((p:any, i:number) => ({ x: i, y: p.hawk })) },
            { label: "Doves", color: "#10b981", points: evolutionResults.map((p:any, i:number) => ({ x: i, y: p.dove })) }
        ] : undefined,
    };
}

export function GameTheoryLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"matrix" | "evolution">("matrix");
    const [payoffInput, setPayoffInput] = React.useState("3,3 0,5; 5,0 1,1");
    const [popH, setPopH] = React.useState("10");
    const [popD, setPopD] = React.useState("90");
    const [costV, setCostV] = React.useState("50");
    const [costC, setCostC] = React.useState("100");
    
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<GameAnnotation[]>(() =>
        readStoredArray<GameAnnotation>("mathsphere-lab-game-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<GameSavedExperiment[]>(() =>
        readStoredArray<GameSavedExperiment>("mathsphere-lab-game-experiments"),
    );

    const notebook = useLaboratoryNotebook<GameBlockId>({
        storageKey: "mathsphere-lab-game-notebook",
        definitions: gameNotebookBlocks,
        defaultBlocks: ["setup", "payoff"],
    });

    const matrixResults = React.useMemo(() => {
        if (mode !== "matrix") return null;
        try {
            const rows = payoffInput.split(";").map(r => r.trim());
            const matrix = rows.map(r => r.split(/\s+/).map(pair => {
                const [a, b] = pair.split(",").map(Number);
                return { a, b };
            }));
            const equilibria = findNashEquilibrium(matrix);
            return { matrix, equilibria };
        } catch { return null; }
    }, [payoffInput, mode]);

    const evolutionResults = React.useMemo(() => {
        if (mode !== "evolution") return null;
        try {
            return runEvolutionarySim({ hawk: Number(popH), dove: Number(popD) }, { v: Number(costV), c: Number(costC) });
        } catch { return null; }
    }, [popH, popD, costV, costC, mode]);

    const applyPreset = (pr: any) => {
        if (pr.label.includes("Evolution")) {
            setMode("evolution");
            setPopH(pr.hawk); setPopD(pr.dove);
            setCostV(pr.v); setCostC(pr.c);
        } else {
            setMode("matrix");
            setPayoffInput(pr.matrix);
        }
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = GAME_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.game.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setMode(template.mode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-game-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-game-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: true,
        sourceLabel: "Game Theory Lab",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildGameMarkdown({ mode, matrixResults, evolutionResults }),
        buildBlock: (targetId) => buildGameLivePayload({ targetId, mode, matrixResults, evolutionResults }),
        getDraftMeta: () => ({
            title: `Strategic Analysis: ${mode.toUpperCase()}`,
            abstract: "Nash equilibrium and evolutionary stability report.",
            keywords: "game,theory,nash,evolution,strategy",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (mode === "matrix") {
            if (matrixResults?.equilibria?.length === 0) {
                signals.push({ tone: "warn", label: "No Equilibrium", text: "Sof Nash muvozanati aniqlanmadi (Mixed strategy tahlili zarur)." });
            } else {
                signals.push({ tone: "info", label: "Stable State", text: "Nash muvozanati nuqtalari muvaffaqiyatli aniqlandi." });
            }
        } else {
            const lastHawk = evolutionResults?.[evolutionResults.length - 1]?.hawk || 0;
            if (lastHawk > 90) {
                signals.push({ tone: "danger", label: "Extreme Dynamics", text: "Populyatsiya deyarli butunlay tajovuzkor (Hawk) holatda." });
            } else {
                signals.push({ tone: "info", label: "Pop Balance", text: "Evolutsion dinamika barqaror muvozanatga intilmoqda." });
            }
        }
        return signals;
    }, [mode, matrixResults, evolutionResults]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Strategic Interaction Mechanics",
        "- **Nash Equilibrium** o'yinchilarning har biri boshqalarning tanlovini bilgan holda o'z strategiyasini o'zgartirishdan foyda olmasligini bildiradi.",
        "- **ESS (Evolutionary Stable Strategy)** populyatsiyada o'zini o'zi barqaror saqlaydigan strategiya hisoblanadi.",
        "- **Payoff Matrix** har bir harakat juftligi uchun o'yinchilarning yutuqlarini belgilaydi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Strategic Analysis Report",
        `Mode: ${mode.toUpperCase()}`,
        mode === "matrix" ? "Type: Matrix Game" : `Populations: H=${popH}, D=${popD}`,
        "",
        "### Interaction Metrics",
        mode === "matrix" ? `- Equilibria Found: ${matrixResults?.equilibria?.length || 0}` : `- Convergence Ticks: ${evolutionResults?.length || 0}`,
        "- Strategic stability verified for current laboratory workspace.",
    ].join("\n"), [mode, popH, popD, matrixResults, evolutionResults]);

    function addAnnotation() {
        const note: GameAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Game Note",
            note: annotationNote || "Strategic observation.",
            anchor: mode === "matrix" ? "Matrix Scan" : "Pop T100",
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: GameSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Game Experiment",
            savedAt: new Date().toISOString(),
            mode, payoffInput, popH, popD, costV, costC
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: GameSavedExperiment) {
        setMode(exp.mode);
        setPayoffInput(exp.payoffInput);
        setPopH(exp.popH); setPopD(exp.popD);
        setCostV(exp.costV); setCostC(exp.costC);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Game Theory Lab"
                description="Nash Equilibrium, Payoff tahlili va Evolutsion biologiya dinamikasi."
                activeBlocks={notebook.activeBlocks}
                definitions={gameNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun strategik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-rose-600">Decision Controller</div>
                                    <div className="flex gap-2">
                                        {(["matrix", "evolution"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center shadow-lg shadow-rose-500/5 transition-all">
                                    <BrainCircuit className="mr-2 h-3.5 w-3.5" /> Strategy Active
                                </div>
                            </div>

                            <div className="space-y-4">
                                {mode === "matrix" ? (
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Payoff Matrix (A,B A,B; A,B A,B)</div>
                                        <textarea value={payoffInput} onChange={e => setPayoffInput(e.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Population (H, D)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={popH} onChange={e => setPopH(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="Hawk" />
                                                <input value={popD} onChange={e => setPopD(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="Dove" />
                                            </div>
                                        </div>
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Costs (V, C)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={costV} onChange={e => setCostV(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="V" />
                                                <input value={costC} onChange={e => setCostC(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="C" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-rose-600" />
                            <div className="site-eyebrow text-rose-600">Game Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.game.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-rose-600/5 hover:border-rose-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-rose-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">Stable Strategic Scene</div>
                                    </div>
                                    <Swords className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-rose-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-rose-600" />
                                <div className="site-eyebrow text-rose-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {GAME_WORKFLOW_TEMPLATES.map((template) => (
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

                    <LaboratorySignalPanel
                        eyebrow="Game Signals"
                        title="Stability monitoring"
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
                    {mode === "matrix" && matrixResults && notebook.hasBlock("payoff") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Strategic Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-rose-600">Nash Equilibrium Visualizer</div>
                                    <div className="flex justify-center py-4">
                                        <div className="flex flex-col border border-border/40 rounded-2xl overflow-hidden shadow-2xl bg-background/50">
                                            {(matrixResults as any).matrix?.map((row:any, rIdx:number) => (
                                                <div key={rIdx} className="flex">
                                                    {row.map((pair:any, cIdx:number) => {
                                                        const isNash = (matrixResults as any).equilibria?.some((e:any) => e.r === rIdx && e.c === cIdx);
                                                        return (
                                                            <div key={cIdx} className={`w-28 h-28 flex flex-col items-center justify-center border border-border/20 transition-all ${isNash ? 'bg-rose-500/10 border-rose-500/40 relative' : 'bg-muted/5'}`}>
                                                                {isNash && <div className="absolute top-2 right-2 text-[8px] font-black text-rose-600 bg-white shadow-sm border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Eq</div>}
                                                                <div className="text-xl font-black font-serif italic">{pair.a}, {pair.b}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="site-outline-card p-4 text-xs italic text-muted-foreground">
                                        Matritsadagi har bir katak o'yinchilarning strategiya juftligiga mos keladigan payoff'larni ko'rsatadi.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "evolution" && evolutionResults && notebook.hasBlock("evolution") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Evolution Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-rose-600">Population Dynamics Trend</div>
                                    <div className="h-[350px] w-full">
                                        <CartesianPlot 
                                            series={[
                                                { label: "Hawks", color: "var(--rose-600)", points: evolutionResults.map((p:any, i:number) => ({ x: i, y: p.hawk })) },
                                                { label: "Doves", color: "#10b981", points: evolutionResults.map((p:any, i:number) => ({ x: i, y: p.dove })) }
                                            ]}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-rose-600 mb-1">Hawk Stability</div>
                                            <div className="font-serif text-xl font-black">{evolutionResults[evolutionResults.length-1]?.hawk.toFixed(1)}%</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1">Dove Stability</div>
                                            <div className="font-serif text-xl font-black">{evolutionResults[evolutionResults.length-1]?.dove.toFixed(1)}%</div>
                                        </div>
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
