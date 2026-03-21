"use client";

import React from "react";
import { Network, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, Share2, Target, Waypoints, Layers3, Box, Info, ArrowRight } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { calculateShortestPath, generateForceLayout, type GraphEdge, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
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
        badge: "Graph export",
        title: "Graf tahlilini nusxalash",
        description: "Graf topologiyasi va eng qisqa yo'l hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Tugunlar (Nodes) va qirralar (Edges) ro'yxati yoziladi.",
            "Dijkstra algoritmi bo'yicha eng qisqa yo'l zanjiri ko'rsatiladi.",
            "Markdown formatida graf munosabatlari va vaznlar jadvali yaratiladi.",
        ],
        note: "Tarmoqlar nazariyasi va optimallashtirish hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Graf natijasini writer'ga yuborish",
        description: "Topologik tahlilni writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Graph export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Visual topologiya va yo'nalishlar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type GraphBlockId = "setup" | "matrix" | "canvas" | "bridge";
type GraphComputation = {
    nodes: string[];
    edges: GraphEdge[];
    layout: Record<string, { x: number; y: number }>;
    path: string[];
};

const graphNotebookBlocks = [
    { id: "setup" as const, label: "Graph Data", description: "Nodes va Edges definition" },
    { id: "canvas" as const, label: "Topology View", description: "Force-directed visualization" },
    { id: "matrix" as const, label: "Analysis", description: "Shortest path va properties" },
    { id: "bridge" as const, label: "Bridge", description: "Export graph data" },
];

const GRAPH_WORKFLOW_TEMPLATES = [
    {
        id: "shortest-path-audit",
        title: "Shortest Path Audit",
        description: "Dijkstra algoritmi yordamida ikki nuqta orasidagi eng optimal yo'lni aniqlash.",
        startNode: "A",
        endNode: "E",
        presetLabel: "Route Optimization",
        blocks: ["setup", "matrix", "canvas"] as const,
    },
    {
        id: "topology-scan",
        title: "Cluster Centrality Scan",
        description: "Graf topologiyasini force-directed layout orqali vizuallashtirish va klasterlarni aniqlash.",
        startNode: "A",
        endNode: "B",
        presetLabel: "Cluster Network",
        blocks: ["setup", "canvas"] as const,
    },
] as const;

type GraphAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type GraphSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    nodesInput: string;
    edgesInput: string;
    startNode: string;
    endNode: string;
};

function buildGraphMarkdown(nodesInput: string, edgesInput: string, startNode: string, endNode: string, graphData: GraphComputation) {
    return `## Laboratory Export: Graph Theory Lab
        
### Topology Definition
- Nodes: ${nodesInput}
- Edge density: ${graphData.edges.length} connections processed.
- Path analysis: ${startNode} to ${endNode}

### Dijkstra Results
- Shortest Path: ${graphData.path.join(" -> ") || "No path found"}
- Sequence length: ${graphData.path.length ? graphData.path.length - 1 : 0}`;
}

function buildGraphLivePayload(targetId: string, startNode: string, endNode: string, graphData: GraphComputation): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "graph-theory-lab",
        kind: "graph-analysis",
        title: `Graph Path: ${startNode} → ${endNode}`,
        summary: "Graph topology and pathfinding optimization results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Nodes", value: String(graphData.nodes.length) },
            { label: "Edges", value: String(graphData.edges.length) },
            { label: "Path Step", value: String(graphData.path.length) },
        ],
        notes: [
            `Start: ${startNode}`,
            `End: ${endNode}`,
            `Path: ${graphData.path.join(" → ") || "none"}`,
        ],
        plotSeries: graphData.edges.map((edge, index) => {
            const from = graphData.layout[edge.from];
            const to = graphData.layout[edge.to];
            return {
                label: `edge-${index + 1}`,
                color: "#64748b",
                points: from && to ? [{ x: from.x, y: from.y }, { x: to.x, y: to.y }] : [],
            };
        }),
    };
}

export function GraphTheoryLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [nodesInput, setNodesInput] = React.useState("A, B, C, D, E");
    const [edgesInput, setEdgesInput] = React.useState("A-B:1, B-C:2, C-D:1, D-E:5, A-D:10, B-E:1");
    const [startNode, setStartNode] = React.useState("A");
    const [endNode, setEndNode] = React.useState("E");
    
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<GraphAnnotation[]>(() =>
        readStoredArray<GraphAnnotation>("mathsphere-lab-graph-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<GraphSavedExperiment[]>(() =>
        readStoredArray<GraphSavedExperiment>("mathsphere-lab-graph-experiments"),
    );

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const notebook = useLaboratoryNotebook<GraphBlockId>({
        storageKey: "mathsphere-lab-graph-notebook",
        definitions: graphNotebookBlocks,
        defaultBlocks: ["setup", "canvas"],
    });

    const graphData = React.useMemo<GraphComputation | null>(() => {
        try {
            const nodes = nodesInput.split(",").map(n => n.trim()).filter(Boolean);
            const edges: GraphEdge[] = edgesInput.split(",").map(e => {
                const [pair, wStr] = e.trim().split(":");
                const [from, to] = pair.split("-").map(n => n.trim());
                return { from, to, weight: Number(wStr) || 1 };
            }).filter(e => e.from && e.to);
            const layout = generateForceLayout(nodes, edges);
            const path = calculateShortestPath(nodes, edges, startNode, endNode);
            return { nodes, edges, layout, path };
        } catch { return null; }
    }, [nodesInput, edgesInput, startNode, endNode]);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !graphData) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { nodes, edges, layout, path } = graphData;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        edges.forEach(edge => {
            const from = layout[edge.from];
            const to = layout[edge.to];
            if (!from || !to) return;
            const isPathEdge = path.some((n, i) => (n === edge.from && path[i+1] === edge.to) || (n === edge.to && path[i+1] === edge.from));
            ctx.beginPath();
            ctx.moveTo(centerX + from.x, centerY + from.y);
            ctx.lineTo(centerX + to.x, centerY + to.y);
            ctx.strokeStyle = isPathEdge ? "#f59e0b" : "rgba(148, 163, 184, 0.25)";
            ctx.lineWidth = isPathEdge ? 4 : 1.5;
            ctx.stroke();
        });

        nodes.forEach(id => {
            const pos = layout[id];
            if (!pos) return;
            const isPathNode = path.includes(id);
            const isBound = id === startNode || id === endNode;
            ctx.beginPath();
            ctx.arc(centerX + pos.x, centerY + pos.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = isPathNode ? "#f59e0b" : "#0f172a";
            ctx.fill();
            if (isBound) { ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3; ctx.stroke(); }
            ctx.fillStyle = isPathNode ? "#000" : "#fff";
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(id, centerX + pos.x, centerY + pos.y + 4);
        });
    }, [graphData, startNode, endNode]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.graph)[number]) => {
        setNodesInput(preset.nodes);
        setEdgesInput(preset.edges);
        const nodeArr = preset.nodes.split(",").map((node) => node.trim());
        setStartNode(nodeArr[0]);
        setEndNode(nodeArr[nodeArr.length-1]);
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = GRAPH_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.graph.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setStartNode(template.startNode);
        setEndNode(template.endNode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-graph-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-graph-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!graphData,
        sourceLabel: "Graph Theory Lab",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildGraphMarkdown(nodesInput, edgesInput, startNode, endNode, graphData as GraphComputation),
        buildBlock: (targetId) => buildGraphLivePayload(targetId, startNode, endNode, graphData as GraphComputation),
        getDraftMeta: () => ({
            title: `Graph Analysis: ${startNode}→${endNode}`,
            abstract: "Topology and pathfinding results in discrete structures.",
            keywords: "graph,topology,shortest-path,dijkstra",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (graphData) {
            if (graphData.path.length === 0 && startNode !== endNode) {
                signals.push({ tone: "danger", label: "Disconnected", text: "Tanlangan tugunlar orasida yo'l aniqlanmadi." });
            } else if (graphData.edges.length > graphData.nodes.length * 2) {
                signals.push({ tone: "warn", label: "High Density", text: "Graf juda ko'p qirralarga ega, vizuallashtirish qiyin bo'lishi mumkin." });
            } else {
                signals.push({ tone: "info", label: "Healthy Mesh", text: "Graf topologiyasi bog'liqlik tahlili uchun tayyor." });
            }
        }
        return signals;
    }, [graphData, startNode, endNode]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Graph Topology Concepts",
        "- **Node (Tugun)**: Tarmoqdagi alohida element yoki nuqta.",
        "- **Edge (Qirra)**: Ikki tugun orasidagi munosabat yoki yo'l.",
        "- **Dijkstra**: Eng qisqa yo'lni topish uchun ishlatiladigan Greedy algoritm.",
        "- **Centrality**: Tugunning tarmoqdagi muhimlik darajasi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Network Analysis Report",
        `Nodes: ${graphData?.nodes.length || 0}`,
        `Edges: ${graphData?.edges.length || 0}`,
        "",
        "### Optimization Metrics",
        `- Start: ${startNode}`,
        `- End: ${endNode}`,
        `- Path Length: ${graphData?.path.length ? graphData.path.length - 1 : "infinite"}`,
        "- Network connectivity verified via force-directed simulation.",
    ].join("\n"), [graphData, startNode, endNode]);

    function addAnnotation() {
        const note: GraphAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Graph Note",
            note: annotationNote || "Topology observation.",
            anchor: `Node ${startNode}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: GraphSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Graph State",
            savedAt: new Date().toISOString(),
            nodesInput, edgesInput, startNode, endNode
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: GraphSavedExperiment) {
        setNodesInput(exp.nodesInput);
        setEdgesInput(exp.edgesInput);
        setStartNode(exp.startNode);
        setEndNode(exp.endNode);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Graph Theory Lab"
                description="Network topology explorer, Dijkstra pathfinding va connectivity tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={graphNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun topologik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-emerald-600">Topology Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Force-Directed Engine</div>
                                </div>
                                <div className="flex items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-lg shadow-emerald-500/5 transition-all">
                                    <Network className="mr-2 h-3.5 w-3.5" /> Graph Connected
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Nodes (A, B, C...)</div><input value={nodesInput} onChange={e => setNodesInput(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Edges (from-to:weight)</div><input value={edgesInput} onChange={e => setEdgesInput(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <div className="site-eyebrow text-emerald-600">Network Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.graph.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-emerald-600/5 hover:border-emerald-600/40 transition-all group text-left">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-emerald-600 font-serif">{p.label}</div>
                                        <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">Topology Scenario</div>
                                    </div>
                                    <Share2 className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-emerald-600" />
                                <div className="site-eyebrow text-emerald-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {GRAPH_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-emerald-600/40 bg-emerald-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-emerald-600/40 hover:bg-emerald-600/5"
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
                        eyebrow="Network Signals"
                        title="Topology monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-emerald-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-emerald-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-emerald-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-emerald-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40" />
                             <button onClick={saveExperiment} className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-emerald-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("canvas") && graphData && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Topology Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-4 overflow-hidden flex flex-col items-center bg-black min-h-[450px]">
                                    <div className="mb-4 flex items-center justify-between w-full px-2">
                                        <div className="site-eyebrow text-white/80 uppercase">Spatial View</div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <div className="text-[8px] font-black uppercase text-white/40">Nodes</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                <div className="text-[8px] font-black uppercase text-white/40">Path</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full flex items-center justify-center">
                                        <canvas ref={canvasRef} width={600} height={400} className="w-full h-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("matrix") && graphData && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Waypoints className="h-4 w-4 text-emerald-600" />
                                <div className="site-eyebrow text-emerald-600">Dijkstra Analysis</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="site-outline-card p-4 space-y-2">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground">Start/End Select</div>
                                    <div className="flex gap-2">
                                        <select value={startNode} onChange={e => setStartNode(e.target.value)} className="flex-1 bg-muted/10 rounded-lg p-2 font-black uppercase text-[10px] outline-none">
                                            {graphData.nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <select value={endNode} onChange={e => setEndNode(e.target.value)} className="flex-1 bg-muted/10 rounded-lg p-2 font-black uppercase text-[10px] outline-none">
                                            {graphData.nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="site-outline-card p-4 border-emerald-600/20 bg-emerald-600/5">
                                    <div className="text-[9px] font-black uppercase text-emerald-600 mb-1">Total Weight</div>
                                    <div className="font-serif text-2xl font-black">{graphData.path.length ? graphData.path.length - 1 : '--'}</div>
                                </div>
                            </div>

                            {graphData.path.length > 0 && (
                                <div className="p-5 rounded-2xl bg-muted/5 border border-border/40 flex items-center flex-wrap gap-3">
                                    {graphData.path.map((n, i) => (
                                        <React.Fragment key={n}>
                                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-xs shadow-lg shadow-amber-500/10">{n}</div>
                                            {i < graphData.path.length - 1 && <div className="h-px w-6 bg-muted-foreground/30 border-t-2 border-dashed border-muted-foreground/20" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Connectivity
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Tarmoq ichidagi barcha bog'liqliklar topologik jihatdan tekshirildi.</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Optimization
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Dijkstra algoritmi eng kam vaznli yo'lni muvaffaqiyatli aniqladi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!graphData}
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
