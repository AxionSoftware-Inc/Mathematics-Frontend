"use client";

import React, { useTransition } from "react";
import { Plus, Zap, Sparkles, Hash, Table as TableIcon, Box, ArrowRight, Activity, Maximize2, Layers3, Info } from "lucide-react";

import { runMatrixOperation, summarizeMatrix, calculateMatrixTransformation, type MatrixSummary, type MatrixOperationResult, type PlotPoint3D, type MatrixTransformation3D, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { buildWireframe3DData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { createDefaultBridgeGuides } from "@/components/live-writer-bridge/bridge-guides";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLabEngine } from "@/components/laboratory/lab-engine";

const exportGuides = {
    copy: {
        badge: "Matrix export",
        title: "Matrix tahlilini nusxalash",
        description: "Invariantlar, determinant va transformatsiya natijalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Matritsa (A) va uning asosiy ko'rsatkichlari (det, trace, norm) yoziladi.",
            "Tanlangan operatsiya (Inverse, Eigenvalues...) natijalari formatlanadi.",
            "3D transformatsiya va bazis mapping xulosasi markdown'ga qo'shiladi.",
        ],
        note: "Chiziqli algebra va fazoviy tahlillarni hujjatlashtirish uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Matrix natijasini writer'ga yuborish",
        description: "Tensor tahlilini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Matrix export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Vizual transformatsiya va matritsa jadvallari draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type MatrixBlockId = "setup" | "analysis" | "visualizer" | "bridge";

const matrixNotebookBlocks = [
    { id: "setup" as const, label: "Tensor Workspace", description: "Matrix definition va presets" },
    { id: "analysis" as const, label: "Algebraic Solver", description: "Solver natijalari va heatmap" },
    { id: "visualizer" as const, label: "Spatial Mapping", description: "2D/3D Geometric mapping" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Export va live push" },
];

const MATRIX_WORKFLOW_TEMPLATES = [
    {
        id: "volumetric-study",
        title: "Volumetric Study",
        description: "Determinant va 3D transformatsiya orqali hajm o'zgarishini tahlil qilish.",
        presetLabel: "Compound Rotation",
        blocks: ["setup", "visualizer", "analysis"] as const,
    },
    {
        id: "eigen-map-audit",
        title: "Eigen-Map Audit",
        description: "Xos qiymatlar va bazis mapping orqali chiziqli operatorni o'rganish.",
        presetLabel: "Hilbert 3x3",
        blocks: ["setup", "analysis", "visualizer"] as const,
    },
    {
        id: "inverse-stability",
        title: "Inverse Stability",
        description: "Teskari matritsa mavjudligi va shartlanganlik darajasini tekshirish.",
        presetLabel: "Non-uniform Scaling",
        blocks: ["setup", "analysis", "bridge"] as const,
    },
] as const;

type MatrixAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type MatrixSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    matrixAInput: string;
    operation: string;
};

function formatMatrixValue(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function serializeMatrix(matrix: number[][]) {
    return matrix.map((row) => row.map((value) => formatMatrixValue(value, 4)).join(" ")).join("\n");
}

function buildMatrixMarkdown(params: {
    matrixA: number[][];
    operation: string;
    summary: MatrixSummary | null;
    opResult: MatrixOperationResult | null;
    vectorTransformation: any;
    transformations: any;
}) {
    const { matrixA, operation, summary, opResult, vectorTransformation, transformations } = params;
    const lines = [
        "## Laboratory Export: Matrix Workbench",
        "",
        "### Operation Detail",
        `- Selected: ${operation.toUpperCase()}`,
        `- Solver label: ${opResult?.label || "--"}`,
        summary ? `- Dimension: ${summary.rows} x ${summary.columns} (Square: ${summary.isSquare})` : "",
        summary?.determinant !== null ? `- det(A): ${formatMatrixValue(summary?.determinant, 6)}` : "",
        summary?.trace !== null ? `- Trace: ${formatMatrixValue(summary?.trace, 6)}` : "",
        summary ? `- Frobenius norm: ${formatMatrixValue(summary.frobeniusNorm, 6)}` : "",
        "",
        "### Matrix A (Original)",
        "```text",
        serializeMatrix(matrixA),
        "```",
    ].filter(Boolean);

    if (opResult?.matrix?.length) {
        lines.push("", `### Result Matrix: ${opResult.label}`, "```text", serializeMatrix(opResult.matrix), "```");
    } else if (opResult?.values?.length) {
        lines.push("", "### Eigenvalues", ...opResult.values.map((v, i) => `- λ${i+1} = ${formatMatrixValue(v, 6)}`));
    } else if (typeof opResult?.scalar === "number") {
        lines.push("", `### Scalar Result: ${opResult.label}`, `- Value = ${formatMatrixValue(opResult.scalar, 6)}`);
    }

    if (transformations) {
        lines.push("", "### 3D Projection Analysis", `- Volume scale factor (det): ${formatMatrixValue(transformations.determinant, 6)}`, `- Vertices mapped: ${transformations.transformed.length}`);
    }

    return lines.join("\n");
}

function buildMatrixLivePayload(params: {
    targetId: string;
    matrixA: number[][];
    operation: string;
    summary: MatrixSummary | null;
    opResult: MatrixOperationResult | null;
    vectorTransformation: any;
    transformations: any;
}): WriterBridgeBlockData {
    const { targetId, matrixA, operation, summary, opResult, vectorTransformation, transformations } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "matrix-workbench",
        kind: "matrix-analysis",
        title: `Matrix Study: ${opResult?.label || operation}`,
        summary: "Advanced tensor decomposition and multidimensional mapping results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "det(A)", value: formatMatrixValue(summary?.determinant, 6) },
            { label: "Trace", value: formatMatrixValue(summary?.trace, 6) },
            { label: "Dimension", value: summary ? `${summary.rows}x${summary.columns}` : "--" },
        ],
        notes: [
            `Operation: ${operation.toUpperCase()}`,
            opResult?.note || "Direct algebraic solution complete.",
            transformations ? `3D transform determinant: ${formatMatrixValue(transformations.determinant, 6)}` : "",
        ].filter(Boolean),
        matrixTables: [
            { label: "Matrix A", matrix: matrixA },
            ...(opResult?.matrix?.length ? [{ label: opResult.label, matrix: opResult.matrix }] : []),
        ],
        plotSeries: vectorTransformation.length ? vectorTransformation.map((s:any) => ({ label: s.label, color: s.color, points: s.points })) : undefined,
    };
}

export function MatrixWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixAInput, setMatrixAInput] = React.useState("1 0 0\n0 1 0\n0 0 1");
    const [operation, setOperation] = React.useState<"determinant" | "inverse" | "eigenvalues" | "transpose">("determinant");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const [isPending, startTransition] = useTransition();
    const { setCalculating, setError } = useLabEngine();

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<MatrixAnnotation[]>(() =>
        readStoredArray<MatrixAnnotation>("mathsphere-lab-matrix-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<MatrixSavedExperiment[]>(() =>
        readStoredArray<MatrixSavedExperiment>("mathsphere-lab-matrix-experiments"),
    );

    const notebook = useLaboratoryNotebook<MatrixBlockId>({
        storageKey: "mathsphere-lab-matrix-notebook",
        definitions: matrixNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "visualizer"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const matrixA = React.useMemo(() => {
        try {
            return matrixAInput.trim().split("\n").map(row => row.trim().split(/\s+/).map(Number));
        } catch { return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; }
    }, [matrixAInput]);

    const { summary, opResult, transformations, vectorTransformation, calcError } = React.useMemo(() => {
        let errorMsg = "";
        let summaryRes: MatrixSummary | null = null;
        let opResultRes: MatrixOperationResult | null = null;
        let transformationsRes: MatrixTransformation3D | null = null;
        let vectorTransformationRes: any[] = [];
        try {
            summaryRes = summarizeMatrix(matrixA);
            opResultRes = runMatrixOperation(matrixA, operation, null);
            if (matrixA.length >= 2 && matrixA[0].length >= 2) {
                const i = { x: 1, y: 0 }; const j = { x: 0, y: 1 };
                const Ai = { x: matrixA[0][0] * i.x + (matrixA[0][1] || 0) * i.y, y: (matrixA[1]?.[0] || 0) * i.x + (matrixA[1]?.[1] || 0) * i.y };
                const Aj = { x: matrixA[0][0] * j.x + (matrixA[0][1] || 0) * j.y, y: (matrixA[1]?.[0] || 0) * j.x + (matrixA[1]?.[1] || 0) * j.y };
                vectorTransformationRes = [{ label: "Basis i", color: "var(--accent)", points: [{x: 0, y: 0}, {x: Ai.x, y: Ai.y}] }, { label: "Basis j", color: "#f59e0b", points: [{x: 0, y: 0}, {x: Aj.x, y: Aj.y}] }];
            }
            if (matrixA.length === 3 && matrixA[0].length === 3) transformationsRes = calculateMatrixTransformation(matrixA);
        } catch (error: any) { errorMsg = error.message || "Matrix computation failed."; }
        return { summary: summaryRes, opResult: opResultRes, transformations: transformationsRes, vectorTransformation: vectorTransformationRes, calcError: errorMsg };
    }, [matrixA, operation]);

    React.useEffect(() => { setError(calcError || null); }, [calcError, setError]);
    React.useEffect(() => { setCalculating(isPending); }, [isPending, setCalculating]);

    const originalTransformationTraces = React.useMemo(() => {
        if (!transformations) return [];
        return [
            ...buildWireframe3DData(transformations.original, transformations.edges, { label: "Original cube", lineColor: "#64748b", markerColor: "#94a3b8" }),
            ...transformations.basisVectors.map((v:any) => ({ type: "scatter3d", mode: "lines+markers", name: `${v.label} original`, x: v.original.map((p:any) => p.x), y: v.original.map((p:any) => p.y), z: v.original.map((p:any) => p.z), line: { width: 7, color: v.color }, marker: { size: [0, 5], color: [v.color, v.color] } })),
        ];
    }, [transformations]);

    const transformedTraces = React.useMemo(() => {
        if (!transformations) return [];
        return [
            ...buildWireframe3DData(transformations.transformed, transformations.edges, { label: "Transformed cube", lineColor: "#2563eb", markerColor: "#0f766e" }),
            ...transformations.basisVectors.map((v:any) => ({ type: "scatter3d", mode: "lines+markers", name: `${v.label} transformed`, x: v.transformed.map((p:any) => p.x), y: v.transformed.map((p:any) => p.y), z: v.transformed.map((p:any) => p.z), line: { width: 7, color: v.color }, marker: { size: [0, 5], color: [v.color, v.color] } })),
        ];
    }, [transformations]);

    const handleMatrixChange = (val: string) => { startTransition(() => { setMatrixAInput(val); }); };
    const applyPreset = (preset: (typeof LABORATORY_PRESETS.matrix)[number]) => { startTransition(() => { setMatrixAInput(preset.A); setOperation(preset.op as any); }); };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = MATRIX_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.matrix.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-matrix-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-matrix-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!opResult, sourceLabel: "Matrix Workbench", liveTargets, selectedLiveTargetId, setExportState, setGuideMode, buildMarkdown: () => buildMatrixMarkdown({ matrixA, operation, summary, opResult, vectorTransformation, transformations }), buildBlock: (targetId) => buildMatrixLivePayload({ targetId, matrixA, operation, summary, opResult, vectorTransformation, transformations }), getDraftMeta: () => ({ abstract: "Matrix study report including algebraic results and spatial mappings.", keywords: "matrix,algebra,eigenvalues,transform" }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (calcError) {
            signals.push({ tone: "danger", label: "Solver Alert", text: calcError });
        } else if (summary) {
            if (summary.determinant === 0) {
                signals.push({ tone: "warn", label: "Singular Matrix", text: "Determinant 0 ga teng. Teskari matritsa mavjud emas." });
            } else {
                signals.push({ tone: "neutral", label: "Stability", text: `Determinant: ${summary.determinant?.toFixed(4)}` });
            }
            if (summary.isSymmetric) {
                signals.push({ tone: "info", label: "Symmetric", text: "Matritsa simmetrik. Eigenvalues haqiqiy sonlar bo'lishi kafolatlanadi." });
            }
        }
        return signals;
    }, [calcError, summary]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Matrix Interpretation",
        "- **Linear Algebra** dagi matritsalar fazoni transformatsiya qilish operatorlaridir.",
        "- **Eigenvalues** bu transformatsiya o'zining asosiy yo'nalishlarini qanchalik kengaytirishini ko'rsatadi.",
        "- **3D Visualizer** bazis kubining qanday deformatsiyaga uchrashini ko'rsatadi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Matrix Analytical Report",
        `Target Operation: ${operation.toUpperCase()}`,
        "",
        "### Scalar Metrics",
        summary ? `- det(A) = ${summary.determinant?.toFixed(4)}` : "- N/A",
        summary ? `- Frobenius Norm = ${summary.frobeniusNorm.toFixed(4)}` : "- N/A",
        "",
        "### Final Deduction",
        "The matrix represents a linear transformation with specific spatial properties.",
    ].join("\n"), [operation, summary]);

    function addAnnotation() {
        if (!opResult) return;
        const note: MatrixAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Matrix Insight",
            note: annotationNote || "Current computational state.",
            anchor: `det(A): ${summary?.determinant?.toFixed(2) || "0"}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: MatrixSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Matrix Experiment",
            savedAt: new Date().toISOString(),
            matrixAInput,
            operation
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: MatrixSavedExperiment) {
        setMatrixAInput(exp.matrixAInput);
        setOperation(exp.operation as any);
    }

    return (
        <div className="space-y-6">
            <LaboratoryNotebookToolbar
                title={module.title || "Tensor Analytical Console"}
                description="Advanced Matrix Algebra Engine with multidimensional basis mapping and eigenvalues decomposition."
                activeBlocks={notebook.activeBlocks}
                definitions={matrixNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun tensor bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel relative overflow-hidden p-8 shadow-[0_45px_100px_-50px_rgba(15,23,42,0.42)]">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_50%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
                            <div className="relative space-y-8">
                                <div className="flex flex-wrap items-end justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                            <div className="site-eyebrow text-accent">Tensor Dimension Definition</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(["determinant", "inverse", "eigenvalues", "transpose"] as const).map(op => (
                                                <button key={op} onClick={() => setOperation(op)} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${operation === op ? 'bg-foreground text-background shadow-xl scale-105' : 'bg-muted/5 text-muted-foreground border border-border/40 hover:bg-muted/10'}`}>
                                                    {op}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-700 ${isPending ? "border-accent/40 bg-accent/5 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"}`}>
                                        <Activity className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.28em]">{isPending ? "Optimizing Space" : "Engine Stable"}</span>
                                    </div>
                                </div>
                                <div className="group relative">
                                    <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-accent/20 to-emerald-500/10 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
                                    <div className="relative">
                                        <div className="mb-3 flex items-center justify-between px-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">Input Rows / Tensor Map</div>
                                            <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-accent/60">
                                                <span>{summary?.rows || 0} x {summary?.columns || 0}</span>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <span>{summary?.isSquare ? "SQUARE" : "RECT"}</span>
                                            </div>
                                        </div>
                                        <textarea value={matrixAInput} onChange={e => handleMatrixChange(e.target.value)} className="min-h-[140px] w-full rounded-[1.75rem] border-2 border-border/40 bg-background/40 backdrop-blur-xl px-6 py-5 text-base font-mono font-bold italic tracking-tight focus:border-accent/60 focus:ring-4 focus:ring-accent/5 outline-none transition-all duration-500 shadow-sm" placeholder="e.g. 1 0 0\n0 1 0\n0 0 1" />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {summary && (
                                        <>
                                            <MetricCard label="det(A)" value={summary.determinant?.toFixed(2) ?? "N/A"} icon={<Maximize2 className="h-3 w-3" />} />
                                            <MetricCard label="Trace" value={summary.trace?.toFixed(2) ?? "N/A"} icon={<Hash className="h-3 w-3" />} />
                                            <MetricCard label="Fro-Norm" value={summary.frobeniusNorm.toFixed(3)} icon={<Activity className="h-3 w-3" />} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {MATRIX_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-accent/40 bg-accent/10"
                                                : "border-border/60 bg-muted/5 hover:border-accent/40 hover:bg-accent/5"
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

                    <div className="site-panel-strong p-8 ring-1 ring-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                         <div className="flex items-center gap-3 mb-6"><Sparkles className="h-5 w-5 text-accent" /><div className="site-eyebrow text-accent">Structural Presets</div></div>
                         <div className="grid gap-3">
                            {LABORATORY_PRESETS.matrix.map((preset) => (
                                <button key={preset.label} onClick={() => applyPreset(preset)} className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 transition-all duration-500 hover:border-accent/40 hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/5 overflow-hidden">
                                    <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-5 transition-opacity duration-700"><TableIcon className="h-12 w-12 text-accent" /></div>
                                    <div className="relative z-10">
                                        <div className="text-sm font-black italic tracking-tight text-foreground group-hover:text-accent font-serif transition-colors duration-500">{preset.label}</div>
                                        <div className="mt-1 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">{preset.op}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 ease-spring" />
                                </button>
                            ))}
                         </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Linear Signals"
                        title="Matrix health & properties"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-fuchsia-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-accent">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-accent text-white rounded-xl py-2 text-sm font-bold hover:bg-accent/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-accent">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40" />
                             <button onClick={saveExperiment} className="bg-accent text-white px-4 rounded-xl hover:bg-accent/80 transition-colors"><Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.operation} - {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Matrix Principles</div>
                        </div>
                        <div className="space-y-4 text-xs leading-relaxed text-muted-foreground italic font-serif">
                            <p>"Matritsalar chiziqli fazodagi o'zgarishlarni matematik ifodalaydi. Determinant bu o'zgarish natijasida hajmning qanchalik kengayishi yoki qisqarishini bildiradi."</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("analysis") && opResult && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                             <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Algebraic Deck</div>
                             <div className="mt-3">
                                 <div className="site-panel-strong p-8 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-4 mb-6">
                                         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                                             <Zap className="h-5 w-5 text-accent" />
                                         </div>
                                         <div className="site-eyebrow text-accent">{opResult.label} Solution</div>
                                    </div>

                                    {opResult.matrix ? (
                                        <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-muted/5 p-8 shadow-inner transition-colors hover:border-accent/20">
                                             <div className="relative flex justify-center">
                                                 <table className="border-separate border-spacing-2">
                                                    <tbody>
                                                        {opResult.matrix.map((row: number[], i: number) => (
                                                            <tr key={i}>
                                                                {row.map((cell: number, j: number) => (
                                                                    <td key={j} className="h-14 min-w-[70px] text-center rounded-xl border border-white/5 bg-white/5 text-sm font-mono font-black italic backdrop-blur-md transition-all duration-500 hover:bg-foreground hover:text-background">
                                                                        {cell.toFixed(4).replace(/\.?0+$/, "")}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                 </table>
                                             </div>
                                        </div>
                                    ) : opResult.values ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {opResult.values.map((value: number, i: number) => (
                                                <div key={i} className="site-outline-card p-4 bg-accent/5 border-accent/20 flex flex-col items-center">
                                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2">λ{i + 1}</div>
                                                    <div className="font-serif text-2xl font-black italic text-foreground">{value.toFixed(6).replace(/\.?0+$/, "")}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="relative site-panel p-8 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center text-white rounded-[2rem]">
                                            <div className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Scalar Result</div>
                                            <div className="font-serif text-5xl font-black italic">{typeof opResult.scalar === 'number' ? opResult.scalar.toFixed(6).replace(/\.?0+$/, "") : opResult.scalar}</div>
                                        </div>
                                    )}

                                    {vectorTransformation.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <div className="site-eyebrow text-muted-foreground">Basis Mapping</div>
                                            <div className="h-[300px]">
                                                <CartesianPlot series={vectorTransformation} height={300} />
                                            </div>
                                        </div>
                                    )}
                                 </div>
                             </div>
                        </div>
                    )}

                    {notebook.hasBlock("visualizer") && transformations && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <Box className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">3D Projection Dynamics</div>
                            </div>
                            <div className="grid gap-6">
                                <ScientificPlot type="scatter3d" data={originalTransformationTraces} title="Reference Basis" height={350} />
                                <ScientificPlot type="scatter3d" data={transformedTraces} title="Tensor Range" height={350} />
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground italic font-serif">
                                "Hajm o'zgarishi: {transformations.determinant !== null ? transformations.determinant.toFixed(3) : "--"} marta. Bu chiziqli operatorning fazoni 'siqish' yoki 'kengaytirish' darajasini ko'rsatadi."
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(opResult)}
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

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="site-outline-card relative group p-5 bg-background/40 backdrop-blur-sm border-white/5 transition-all duration-500 hover:bg-white/5 hover:border-white/10">
            <div className="absolute top-4 right-4 text-muted-foreground/20 group-hover:text-accent/30 transition-colors duration-500">{icon}</div>
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</div>
            <div className="mt-2 font-serif text-2xl font-black italic tracking-tighter text-foreground">{value}</div>
        </div>
    );
}
