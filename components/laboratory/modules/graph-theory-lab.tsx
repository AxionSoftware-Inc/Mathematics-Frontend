"use client";

import React from "react";
import { Network, Plus, Activity, Zap, Sparkles, Hash, MousePointer2, Share2, Target, Waypoints } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { calculateShortestPath, generateForceLayout, type GraphEdge, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type GraphBlockId = "setup" | "matrix" | "canvas" | "bridge";

const graphNotebookBlocks = [
    { id: "setup" as const, label: "Graph Data", description: "Nodes va Edges definition" },
    { id: "canvas" as const, label: "Topology View", description: "Force-directed visualization" },
    { id: "matrix" as const, label: "Analysis", description: "Shortest path va properties" },
    { id: "bridge" as const, label: "Bridge", description: "Export graph data" },
];

export function GraphTheoryLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [nodesInput, setNodesInput] = React.useState("A, B, C, D, E");
    const [edgesInput, setEdgesInput] = React.useState("A-B:1, B-C:2, C-D:1, D-E:5, A-D:10, B-E:1");
    const [startNode, setStartNode] = React.useState("A");
    const [endNode, setEndNode] = React.useState("E");
    
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const notebook = useLaboratoryNotebook<GraphBlockId>({
        storageKey: "mathsphere-lab-graph-notebook",
        definitions: graphNotebookBlocks,
        defaultBlocks: ["setup", "canvas"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const graphData = React.useMemo(() => {
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

        // Draw edges
        edges.forEach(edge => {
            const from = layout[edge.from];
            const to = layout[edge.to];
            if (!from || !to) return;

            const isPathEdge = path.some((n, i) => (n === edge.from && path[i+1] === edge.to) || (n === edge.to && path[i+1] === edge.from));
            
            ctx.beginPath();
            ctx.moveTo(centerX + from.x, centerY + from.y);
            ctx.lineTo(centerX + to.x, centerY + to.y);
            ctx.strokeStyle = isPathEdge ? "#f59e0b" : "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = isPathEdge ? 3 : 1;
            ctx.stroke();
            
            // Weight
            ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
            ctx.font = "9px Arial";
            ctx.fillText(edge.weight.toString(), centerX + (from.x + to.x)/2, centerY + (from.y + to.y)/2);
        });

        // Draw nodes
        nodes.forEach(id => {
            const pos = layout[id];
            if (!pos) return;

            const isPathNode = path.includes(id);
            const isBound = id === startNode || id === endNode;

            ctx.beginPath();
            ctx.arc(centerX + pos.x, centerY + pos.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = isPathNode ? "#f59e0b" : "#0f172a";
            ctx.fill();
            ctx.strokeStyle = isBound ? "var(--accent)" : "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = isPathNode ? "#000" : "#fff";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(id, centerX + pos.x, centerY + pos.y + 4);
        });
    }, [graphData, startNode, endNode]);

    const applyPreset = (p: any) => {
        setNodesInput(p.nodes);
        setEdgesInput(p.edges);
        const nodeArr = p.nodes.split(",").map((n:string) => n.trim());
        setStartNode(nodeArr[0]);
        setEndNode(nodeArr[nodeArr.length-1]);
    };

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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Topological Controls</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground">Force-Directed Layout Engine</div>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center shadow-lg shadow-emerald-500/5 transition-all">
                                    <Network className="mr-2 h-3.5 w-3.5" /> Graph Connected
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Nodes (Comma separated)</div><input value={nodesInput} onChange={e => setNodesInput(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Edges (from-to:weight)</div><input value={edgesInput} onChange={e => setEdgesInput(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("canvas") && (
                        <div className="site-panel-strong p-4 overflow-hidden flex flex-col bg-black min-h-[500px]">
                            <div className="mb-4 flex items-center justify-between px-2">
                                <div className="site-eyebrow text-accent">Topology Sandbox</div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-accent" />
                                        <div className="text-[9px] font-black uppercase text-muted-foreground">Boundary</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                                        <div className="text-[9px] font-black uppercase text-muted-foreground">Shortest Path</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex justify-center items-center">
                                <canvas ref={canvasRef} width={700} height={400} className="w-full h-full" />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("matrix") && graphData && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Waypoints className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Dijkstra Analysis</div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-4 space-y-2">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground">Start Node</div>
                                    <select value={startNode} onChange={e => setStartNode(e.target.value)} className="w-full bg-transparent font-black uppercase text-xs outline-none">
                                        {graphData.nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="site-outline-card p-4 space-y-2">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground">End Node</div>
                                    <select value={endNode} onChange={e => setEndNode(e.target.value)} className="w-full bg-transparent font-black uppercase text-xs outline-none">
                                        {graphData.nodes.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="site-outline-card p-4 bg-amber-500/5 border-amber-500/20">
                                    <div className="text-[9px] font-black uppercase text-amber-600 mb-1">Path Length</div>
                                    <div className="font-serif text-2xl font-black">{graphData.path.length ? graphData.path.length - 1 : '--'}</div>
                                </div>
                            </div>
                            {graphData.path.length > 0 && (
                                <div className="p-4 rounded-2xl bg-muted/5 border border-border/40 flex items-center flex-wrap gap-2">
                                    {graphData.path.map((n, i) => (
                                        <React.Fragment key={n}>
                                            <div className="h-8 w-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-xs">{n}</div>
                                            {i < graphData.path.length - 1 && <div className="h-px w-4 bg-muted-foreground" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-accent" />
                             <div className="site-eyebrow text-accent">Network Presets</div>
                         </div>
                         <div className="grid gap-2">
                            {LABORATORY_PRESETS.graph.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">Topology template</div>
                                    </div>
                                </button>
                            ))}
                         </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!graphData}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={() => {}}
                            onSend={() => {}}
                            onPush={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
