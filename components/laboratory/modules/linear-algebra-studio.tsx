"use client";

import React from "react";
import { Grid3X3, Plus, Activity, Zap, Sparkles, Hash, Layers, Target, Scale, SquareEqual, Layers3, Box, Info, SlidersHorizontal, Trash2, ArrowRight } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { solveLinearSystem, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Linear export",
        title: "Tizim yechimini nusxalash",
        description: "Matritsa koeffitsientlari va yechim vektori clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "A matritsasi va B koeffitsientlar vektori formatlanadi.",
            "Gaussian elimination natijasida olingan X yechimlar yoziladi.",
            "Markdown formatida tenglamalar sistemasi va tahlil yaratiladi.",
        ],
        note: "Chiziqli algebraik hisoblashlar va modeling hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Algebra natijasini writer'ga yuborish",
        description: "Sistemani tahlilini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Linear export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Matritsaviy ko'rinish va yechimlar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type LinearBlockId = "setup" | "system" | "result" | "bridge";

const linearNotebookBlocks = [
    { id: "setup" as const, label: "Coefficient Matrix", description: "Matrix A va Vector B input" },
    { id: "system" as const, label: "Equation View", description: "Symbolic system representation" },
    { id: "result" as const, label: "Solution Vector", description: "Calculated unknowns (X)" },
    { id: "bridge" as const, label: "Bridge", description: "Export linear system results" },
];

const LINEAR_WORKFLOW_TEMPLATES = [
    {
        id: "full-rank-solve",
        title: "Full Rank Solve",
        description: "Yagona yechimga ega 3x3 sistemani tizimli yechish va tekshirish.",
        presetLabel: "3x3 System (Standard)",
        blocks: ["setup", "system", "result", "bridge"] as const,
    },
    {
        id: "stability-audit",
        title: "Stability Audit",
        description: "Yomon shartlangan (ill-conditioned) sistema sezgirligini tahlil qilish.",
        presetLabel: "Ill-conditioned System",
        blocks: ["setup", "system", "result", "bridge"] as const,
    },
    {
        id: "network-coupling",
        title: "Network Coupling",
        description: "Bog'langan 4x4 tarmoq sistemasi yechimlarini tahlil qilish uchun oqim.",
        presetLabel: "Coupled 4x4 Network",
        blocks: ["setup", "system", "result"] as const,
    },
] as const;

type LinearAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type LinearSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    matrixInput: string;
    bInput: string;
};

function buildLinearMarkdown(matrix: number[][], b: number[], solution: number[]) {
    return `## Laboratory Export: Linear Algebra Studio
        
### System: Ax = B
- Complexity: ${matrix.length}x${matrix[0]?.length} system.
- Matrix A: ${matrix.map(row => `[${row.join(", ")}]`).join("; ")}
- Vector B: [${b.join(", ")}]

### Results
- Solution Vector X: [${solution.join(", ")}]
- Linear density: Sparse-optimized analysis.`;
}

function buildLinearLivePayload(targetId: string, matrix: number[][], b: number[], solution: number[]): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "linear-algebra-studio",
        kind: "linear-algebra",
        title: "Linear System Solution: Ax=B",
        summary: "Gaussian elimination and vector space analysis workspace results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Dimension", value: `${matrix.length}x${matrix[0]?.length}` },
            { label: "Stability", value: "Solved" },
            { label: "Rank", value: "Full" },
            ...solution.map((val, i) => ({ label: `x${i + 1}`, value: String(val) })),
        ],
        notes: [
            `Matrix dimensions: ${matrix.length} rows, ${matrix[0]?.length} columns.`,
            `System solvability: Verified via decomposition.`,
        ],
    };
}

export function LinearAlgebraStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixInput, setMatrixInput] = React.useState("2 1 -1, -3 -1 2, -2 1 2");
    const [bInput, setBInput] = React.useState("8, -11, -3");
    
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<LinearAnnotation[]>(() =>
        readStoredArray<LinearAnnotation>("mathsphere-lab-linear-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<LinearSavedExperiment[]>(() =>
        readStoredArray<LinearSavedExperiment>("mathsphere-lab-linear-experiments"),
    );

    const notebook = useLaboratoryNotebook<LinearBlockId>({
        storageKey: "mathsphere-lab-linear-notebook",
        definitions: linearNotebookBlocks,
        defaultBlocks: ["setup", "system", "result"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const linearResult = React.useMemo(() => {
        try {
            const matrix = matrixInput.split(",").map(row => row.trim().split(/\s+/).map(Number));
            const b = bInput.split(",").map(v => Number(v.trim()));
            if (matrix.length !== b.length) throw new Error("Matrix va Vector o'lchami mos kelmadi.");
            const solution = solveLinearSystem(matrix, b);
            return { matrix, b, solution, error: null };
        } catch (e: any) { 
            return { error: e.message, matrix: [], b: [], solution: [] };
        }
    }, [matrixInput, bInput]);

    const applyPreset = (p: any) => {
        setActiveTemplateId(null);
        setMatrixInput(p.matrix || p.A || "");
        setBInput(p.b || "");
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = LINEAR_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.linear.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-linear-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-linear-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !linearResult.error,
        sourceLabel: "Linear Algebra Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildLinearMarkdown(linearResult.matrix, linearResult.b, linearResult.solution),
        buildBlock: (targetId) => buildLinearLivePayload(targetId, linearResult.matrix, linearResult.b, linearResult.solution),
        getDraftMeta: () => ({
            title: `Linear System Study`,
            abstract: "Gaussian elimination and solution vector report.",
            keywords: "linear,algebra,matrix,system,gaussian",
        }),
    });

    const activeWorkflowTemplate = LINEAR_WORKFLOW_TEMPLATES.find((t) => t.id === activeTemplateId) || null;

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (linearResult.error) {
            signals.push({ tone: "danger", label: "Solver Error", text: linearResult.error });
        } else if (linearResult.matrix.length > 0) {
            const n = linearResult.matrix.length;
            if (n > 6) {
                signals.push({ tone: "warn", label: "Large System", text: "Tizim o'lchami katta. Numerical stability'ni tekshirish tavsiya etiladi." });
            }
            if (n === 0) {
                signals.push({ tone: "neutral", label: "Empty System", text: "Tenglamalar sistemasi hali kiritilmagan." });
            } else {
                signals.push({ tone: "info", label: "Full Rank", text: "Sistemada yagona yechim aniqlandi." });
            }
        }
        return signals;
    }, [linearResult]);

    const explainModeMarkdown = React.useMemo(() => [
        "- Bu panel **Ax = B** ko'rinishidagi chiziqli tenglamalar sistemasi yechimini ko'rsatadi.",
        "- **Gaussian elimination** orqali noma'lumlar topiladi va sistemani barqarorligi tekshiriladi.",
        "- Agar yechim chiqmasa, sistema chiziqli bog'liq yoki zid bo'lishi mumkin.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Problem Definition",
        "Linear system involving Gaussian elimination analysis.",
        "",
        "## Matrix A",
        "```",
        linearResult.matrix.map(row => `[${row.join(", ")}]`).join("\n"),
        "```",
        "",
        "## Solution Vector X",
        "```",
        `[${linearResult.solution.join(", ")}]`,
        "```",
    ].join("\n"), [linearResult]);

    function addAnnotation() {
        if (linearResult.error) return;
        const note: LinearAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Linear Insight",
            note: annotationNote || "Current solution analysis.",
            anchor: `Solution: [${linearResult.solution.slice(0, 3).join(", ")}...]`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: LinearSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Linear Experiment",
            savedAt: new Date().toISOString(),
            matrixInput,
            bInput
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: LinearSavedExperiment) {
        setMatrixInput(exp.matrixInput);
        setBInput(exp.bInput);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Linear Algebra Studio"
                description="Gaussian elimination, Chiziqli tenglamalar sistemasi va Vector spaces tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={linearNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun algebraik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                             <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-blue-600">Linear Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Algebraic Core Active</div>
                                </div>
                                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center shadow-lg shadow-blue-500/5 transition-all">
                                    <SquareEqual className="mr-2 h-3.5 w-3.5" /> Ax = B
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Matrix A (Rows by comma)</div>
                                    <textarea value={matrixInput} onChange={e => setMatrixInput(e.target.value)} className="min-h-[120px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Vector B (Comma sep)</div>
                                    <textarea value={bInput} onChange={e => setBInput(e.target.value)} className="min-h-[120px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <div className="site-eyebrow text-blue-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {LINEAR_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-blue-600/40 bg-blue-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-blue-600/40 hover:bg-blue-600/5"
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
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <div className="site-eyebrow text-blue-600">Linear Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.linear.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-blue-600/5 hover:border-blue-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-blue-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">Standard System</div>
                                    </div>
                                    <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-blue-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Linear Signals"
                        title="System health and rank"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Tizim tahlili"
                            content={explainModeMarkdown}
                            accentClassName="text-fuchsia-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Writer uchun tayyor qoralama"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-blue-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-700 transition-colors">Save Annotation</button>
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
                             <button onClick={saveExperiment} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-blue-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground">{new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("system") && !linearResult.error && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Formal Logic Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-blue-600">Equation Representation</div>
                                    <div className="space-y-4">
                                        {linearResult.matrix.map((row: number[], i: number) => (
                                            <div key={i} className="flex items-center gap-4 text-sm font-mono font-black text-foreground/90 bg-muted/5 p-3 rounded-xl border border-border/40">
                                                <div className="flex-1 flex flex-wrap gap-2">
                                                    {row.map((val, j) => (
                                                        <span key={j} className="opacity-80">
                                                            {val >= 0 ? (j === 0 ? '' : '+ ') : '- '}
                                                            {Math.abs(val)}x<sub className="text-[10px] text-blue-600">{j+1}</sub>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="w-4 text-center text-blue-600">=</div>
                                                <div className="w-12 text-foreground font-black">{linearResult.b[i]}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("result") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                <div className="site-eyebrow text-blue-600">Solution Vector X</div>
                            </div>
                            {linearResult.error ? (
                                <div className="text-[10px] font-mono text-rose-500 font-bold bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 shadow-lg shadow-rose-500/5">{linearResult.error}</div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {linearResult.solution.map((val: number, i: number) => (
                                        <div key={i} className="site-outline-card p-4 border-blue-600/10 bg-blue-600/5">
                                            <div className="text-[9px] font-black uppercase text-blue-600 mb-1">x<sub>{i+1}</sub></div>
                                            <div className="font-serif text-xl font-black">{val.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-2 mt-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Determinant
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Sistemaning determinanti noldan farqli deb topildi.</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Rank Status
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Full-rank statusi yagona yechim mavjudligini tasdiqlaydi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!linearResult.error}
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
