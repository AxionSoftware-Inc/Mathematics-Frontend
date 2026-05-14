"use client";

import React from "react";
import {
    BarChart3,
    BookOpenCheck,
    Braces,
    CheckCircle2,
    Download,
    FileText,
    FunctionSquare,
    Grid3X3,
    ListPlus,
    Play,
    Sigma,
    Table2,
    TextCursorInput,
} from "lucide-react";
import { compile } from "mathjs";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { PremiumFeatureBadge } from "@/components/premium-feature-badge";
import { fetchPublic } from "@/lib/api";
import { buildIntegralCodeForMode } from "@/lib/integral-code-generator";
import { fetchSavedLaboratoryResults, type SavedLaboratoryResult } from "@/lib/laboratory-results";
import { createNotebookDocument, fetchNotebookDocuments, updateNotebookDocument, type NotebookDocument } from "@/lib/notebook";

type NotebookBlockKind =
    | "text"
    | "formula"
    | "solve"
    | "graph"
    | "table"
    | "python"
    | "theorem"
    | "exercise"
    | "answer"
    | "export"
    | "lab-result";

type NotebookBlock = {
    id: string;
    kind: NotebookBlockKind;
    title: string;
    content: string;
    config?: Record<string, string>;
};

type NotebookSolveResult = {
    status: string;
    message?: string;
    exact?: {
        evaluated_latex?: string;
        antiderivative_latex?: string;
        numeric_approximation?: string;
        method_label?: string;
    };
};

type GraphPoint = { x: number; y: number };

const blockCatalog: Array<{ kind: NotebookBlockKind; label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [
    { kind: "text", label: "Text", icon: TextCursorInput, description: "Research notes, explanation, narrative." },
    { kind: "formula", label: "Formula", icon: Sigma, description: "LaTeX/math expression with rendered preview." },
    { kind: "solve", label: "Solve", icon: Play, description: "Live integral/worksheet computation block." },
    { kind: "graph", label: "Graph", icon: BarChart3, description: "Function sampling and visual profile." },
    { kind: "table", label: "Table", icon: Table2, description: "Generated numeric table from expression." },
    { kind: "python", label: "Python", icon: Braces, description: "Reproducibility code appendix." },
    { kind: "theorem", label: "Theorem", icon: BookOpenCheck, description: "Statement and proof container." },
    { kind: "exercise", label: "Exercise", icon: FunctionSquare, description: "Problem prompt block." },
    { kind: "answer", label: "Answer", icon: CheckCircle2, description: "Solution or hidden answer block." },
    { kind: "export", label: "Export", icon: Download, description: "Document export metadata." },
    { kind: "lab-result", label: "Lab Result", icon: BookOpenCheck, description: "Import saved Laboratory result." },
];

const starterBlocks: NotebookBlock[] = [
    {
        id: "title",
        kind: "text",
        title: "Heat Equation Analysis",
        content: "# Heat Equation Analysis\nA computational worksheet mixing explanation, formulas, solving, graphing, and exportable report content.",
    },
    {
        id: "formula-heat",
        kind: "formula",
        title: "Governing formula",
        content: "u_t = alpha u_xx",
    },
    {
        id: "solve-integral",
        kind: "solve",
        title: "Energy integral",
        content: "sin(x) + x^2 / 5",
        config: { variable: "x", lower: "0", upper: "3.14", segments: "800" },
    },
    {
        id: "graph-profile",
        kind: "graph",
        title: "Temperature profile",
        content: "exp(-0.4*x) * sin(x)",
        config: { xMin: "0", xMax: "10", samples: "160" },
    },
    {
        id: "proof-note",
        kind: "theorem",
        title: "Maximum principle note",
        content: "If alpha > 0 and boundary values are bounded, the heat profile remains bounded under the standard parabolic maximum principle.",
    },
    {
        id: "export-pack",
        kind: "export",
        title: "Export packet",
        content: "Include text, formulas, computed values, graph samples, code appendix, and proof notes.",
    },
];

function createBlock(kind: NotebookBlockKind): NotebookBlock {
    const id = `${kind}-${crypto.randomUUID()}`;
    const defaults: Record<NotebookBlockKind, NotebookBlock> = {
        text: { id, kind, title: "Text block", content: "Write a paragraph, derivation note, or section heading." },
        formula: { id, kind, title: "Formula block", content: "f(x) = sin(x) + x^2" },
        solve: { id, kind, title: "Solve block", content: "sin(x) + x^2 / 5", config: { variable: "x", lower: "0", upper: "3.14", segments: "800" } },
        graph: { id, kind, title: "Graph block", content: "sin(x)", config: { xMin: "-6.28", xMax: "6.28", samples: "180" } },
        table: { id, kind, title: "Table block", content: "sin(x) + x^2", config: { xMin: "0", xMax: "5", rows: "8" } },
        python: { id, kind, title: "Python code block", content: "import sympy as sp\nx = sp.symbols('x')\nsp.integrate(sp.sin(x), x)" },
        theorem: { id, kind, title: "Theorem / proof block", content: "Theorem statement.\n\nProof: ..." },
        exercise: { id, kind, title: "Exercise block", content: "Show that the computed profile satisfies the stated differential relation." },
        answer: { id, kind, title: "Answer block", content: "Answer and verification notes." },
        export: { id, kind, title: "Export block", content: "Export this worksheet to Writer, Markdown, LaTeX, or notebook JSON." },
        "lab-result": { id, kind, title: "Saved Lab result", content: "Select a saved laboratory result from the importer.", config: {} },
    };
    return defaults[kind];
}

function safeNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function evaluateExpression(expression: string, x: number) {
    const fn = compile(expression.replace(/\^/g, "^"));
    const value = fn.evaluate({ x, alpha: 1, pi: Math.PI, e: Math.E });
    return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}

function simpsonIntegral(expression: string, lower: number, upper: number, segments: number) {
    const n = Math.max(2, segments % 2 === 0 ? segments : segments + 1);
    const h = (upper - lower) / n;
    let total = evaluateExpression(expression, lower) + evaluateExpression(expression, upper);
    for (let i = 1; i < n; i += 1) {
        total += (i % 2 === 0 ? 2 : 4) * evaluateExpression(expression, lower + i * h);
    }
    return { value: (total * h) / 3, segments: n };
}

function sampleGraph(expression: string, xMin: number, xMax: number, samples: number): GraphPoint[] {
    const count = Math.max(16, Math.min(1200, samples));
    return Array.from({ length: count }, (_, index) => {
        const x = xMin + ((xMax - xMin) * index) / (count - 1);
        return { x, y: evaluateExpression(expression, x) };
    }).filter((point) => Number.isFinite(point.y));
}

function Sparkline({ points }: { points: GraphPoint[] }) {
    if (!points.length) {
        return <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">Graph data unavailable.</div>;
    }
    const width = 760;
    const height = 260;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const path = points.map((point, index) => {
        const x = ((point.x - minX) / spanX) * width;
        const y = height - ((point.y - minY) / spanY) * height;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full rounded-2xl border border-border/70 bg-background">
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" />
            <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="currentColor" className="text-border" strokeDasharray="6 8" />
        </svg>
    );
}

function updateBlock(blocks: NotebookBlock[], id: string, patch: Partial<NotebookBlock>) {
    return blocks.map((block) => (block.id === id ? { ...block, ...patch, config: patch.config ? { ...block.config, ...patch.config } : block.config } : block));
}

function blockToMarkdown(block: NotebookBlock) {
    if (block.kind === "formula") return `## ${block.title}\n\n$$${block.content}$$`;
    if (block.kind === "python") return `## ${block.title}\n\n\`\`\`python\n${block.content}\n\`\`\``;
    return `## ${block.title}\n\n${block.content}`;
}

function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function ComputationalNotebook() {
    const [blocks, setBlocks] = React.useState<NotebookBlock[]>(starterBlocks);
    const [activeBlockId, setActiveBlockId] = React.useState(starterBlocks[0].id);
    const [selectedBlockIds, setSelectedBlockIds] = React.useState<Set<string>>(() => new Set(starterBlocks.map((block) => block.id)));
    const [runAllState, setRunAllState] = React.useState<"idle" | "running">("idle");
    const [documentTitle, setDocumentTitle] = React.useState("Computational Worksheet");
    const [documentSummary, setDocumentSummary] = React.useState("Live worksheet with formulas, solving, graphs, code, proofs, and exports.");
    const [documentId, setDocumentId] = React.useState<string | null>(null);
    const [revision, setRevision] = React.useState<number | null>(null);
    const [documents, setDocuments] = React.useState<NotebookDocument[]>([]);
    const [savedResults, setSavedResults] = React.useState<SavedLaboratoryResult[]>([]);
    const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const activeBlock = blocks.find((block) => block.id === activeBlockId) ?? blocks[0];
    const markdown = React.useMemo(() => blocks.map(blockToMarkdown).join("\n\n"), [blocks]);
    const selectedMarkdown = React.useMemo(
        () => blocks.filter((block) => selectedBlockIds.has(block.id)).map(blockToMarkdown).join("\n\n"),
        [blocks, selectedBlockIds],
    );
    const dependencyGraph = React.useMemo(() => {
        const solveBlocks = blocks.filter((block) => block.kind === "solve");
        return blocks.map((block, index) => {
            const upstreamSolve = [...solveBlocks].reverse().find((candidate) => blocks.findIndex((item) => item.id === candidate.id) < index);
            const dependsOn =
                block.kind === "graph" || block.kind === "table" || block.kind === "answer" || block.kind === "export"
                    ? upstreamSolve?.id ?? null
                    : block.kind === "python"
                      ? upstreamSolve?.id ?? null
                      : null;
            return {
                id: block.id,
                title: block.title,
                kind: block.kind,
                dependsOn,
                stale: block.config?.stale === "true" || Boolean(dependsOn && blocks.find((item) => item.id === dependsOn)?.config?.stale === "true"),
            };
        });
    }, [blocks]);

    React.useEffect(() => {
        let alive = true;
        void Promise.allSettled([fetchNotebookDocuments(), fetchSavedLaboratoryResults({ ordering: "-updated_at" })]).then((results) => {
            if (!alive) return;
            const [docs, labResults] = results;
            if (docs.status === "fulfilled") setDocuments(docs.value);
            if (labResults.status === "fulfilled") setSavedResults(labResults.value);
        });
        return () => {
            alive = false;
        };
    }, []);

    const buildPayload = React.useCallback(() => ({
        title: documentTitle,
        summary: documentSummary,
        blocks,
        metadata: {
            schema_version: 1,
            document_standard: "mathsphere.computational_notebook",
            source: "notebook-ui",
            block_count: blocks.length,
            dependency_graph: dependencyGraph,
            stale_block_count: dependencyGraph.filter((item) => item.stale).length,
            connected_modules: Array.from(new Set(blocks.map((block) => block.kind === "lab-result" ? "laboratory-results" : block.kind))),
            updated_in_browser_at: new Date().toISOString(),
        },
    }), [blocks, dependencyGraph, documentSummary, documentTitle]);

    const saveDocument = React.useCallback(async () => {
        setSaveState("saving");
        setSaveError(null);
        try {
            const saved = documentId
                ? await updateNotebookDocument(documentId, buildPayload())
                : await createNotebookDocument(buildPayload());
            setDocumentId(saved.id);
            setRevision(saved.revision);
            setDocumentTitle(saved.title);
            setDocumentSummary(saved.summary);
            setBlocks(saved.blocks);
            setDocuments((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
            setSaveState("saved");
            window.setTimeout(() => setSaveState("idle"), 1600);
        } catch (error) {
            setSaveState("error");
            setSaveError(error instanceof Error ? error.message : "Notebook save failed.");
        }
    }, [buildPayload, documentId]);

    React.useEffect(() => {
        if (!documentId) return;
        const timer = window.setTimeout(() => {
            void saveDocument();
        }, 4000);
        return () => window.clearTimeout(timer);
    }, [blocks, documentId, documentSummary, documentTitle, saveDocument]);

    const addBlock = (kind: NotebookBlockKind) => {
        const block = createBlock(kind);
        setBlocks((current) => [...current, block]);
        setActiveBlockId(block.id);
    };

    const insertBlockAfter = (afterId: string, block: NotebookBlock) => {
        setBlocks((current) => {
            const index = current.findIndex((item) => item.id === afterId);
            if (index < 0) return [...current, block];
            return [...current.slice(0, index + 1), block, ...current.slice(index + 1)];
        });
        setActiveBlockId(block.id);
        setSelectedBlockIds((current) => new Set([...current, block.id]));
    };

    const runSolveBlockById = React.useCallback(async (blockId: string) => {
        const block = blocks.find((item) => item.id === blockId);
        if (!block || block.kind !== "solve") return;
        const cacheKey = `${block.content}|${block.config?.lower || "0"}|${block.config?.upper || "1"}|${block.config?.method || "auto"}`;
        if (block.config?.cacheKey === cacheKey && block.config?.backendStatus === "exact") {
            return;
        }
        const response = await fetchPublic("/api/laboratory/solve/integral/", {
            method: "POST",
            body: JSON.stringify({
                expression: block.content,
                lower: block.config?.lower || "0",
                upper: block.config?.upper || "1",
                method: block.config?.method || "auto",
            }),
        });
        const data = (await response.json()) as NotebookSolveResult;
        setBlocks((current) => updateBlock(current, blockId, {
            config: {
                cacheKey,
                backendStatus: response.ok ? data.status : "error",
                backendMessage: data.message || "",
                backendResultLatex: data.exact?.evaluated_latex || "",
                backendAntiderivativeLatex: data.exact?.antiderivative_latex || "",
                backendNumeric: data.exact?.numeric_approximation || "",
                backendMethod: data.exact?.method_label || block.config?.method || "auto",
                executedAt: new Date().toISOString(),
                stale: "false",
            },
        }));
    }, [blocks]);

    const runAll = async () => {
        setRunAllState("running");
        try {
            for (const block of blocks) {
                if (block.kind === "solve") {
                    await runSolveBlockById(block.id);
                }
            }
        } finally {
            setRunAllState("idle");
        }
    };

    const loadDocument = (document: NotebookDocument) => {
        setDocumentId(document.id);
        setRevision(document.revision);
        setDocumentTitle(document.title);
        setDocumentSummary(document.summary);
        setBlocks(document.blocks.length ? document.blocks : starterBlocks);
        setActiveBlockId(document.blocks[0]?.id ?? starterBlocks[0].id);
    };

    const importSavedResult = (result: SavedLaboratoryResult) => {
        const block: NotebookBlock = {
            id: `lab-result-${crypto.randomUUID()}`,
            kind: "lab-result",
            title: result.title,
            content: result.report_markdown || result.summary,
            config: {
                resultId: result.id,
                revision: String(result.revision),
                module: result.module_slug,
                mode: result.mode,
            },
        };
        setBlocks((current) => [...current, block]);
        setActiveBlockId(block.id);
    };

    const exportWorksheet = (format: "md" | "json" | "tex") => {
        if (format === "json") {
            downloadText("mathsphere-worksheet.json", JSON.stringify({ version: 1, title: "Computational Worksheet", blocks }, null, 2));
            return;
        }
        if (format === "tex") {
            downloadText("mathsphere-worksheet.tex", `\\documentclass{article}\n\\usepackage{amsmath,amssymb,listings}\n\\begin{document}\n\\begin{verbatim}\n${markdown}\n\\end{verbatim}\n\\end{document}`);
            return;
        }
        downloadText("mathsphere-worksheet.md", markdown);
    };

    const exportSelectedReport = () => {
        downloadText("mathsphere-selected-blocks-report.md", `# ${documentTitle}\n\n${selectedMarkdown || markdown}`);
    };

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="border-b border-border/70 bg-background">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="site-eyebrow text-accent">Computational Notebook</div>
                        <input value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} className="mt-1 w-full bg-transparent text-2xl font-black tracking-tight outline-none" />
                        <textarea value={documentSummary} onChange={(event) => setDocumentSummary(event.target.value)} className="mt-2 min-h-12 w-full max-w-3xl resize-none bg-transparent text-sm leading-6 text-muted-foreground outline-none" />
                        <div className="mt-2 text-xs font-semibold text-muted-foreground">
                            {documentId ? `Saved document ${documentId} · revision ${revision ?? 1}` : "Unsaved local worksheet"}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => void saveDocument()} disabled={saveState === "saving"} className="site-btn-accent px-4">
                            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save DB"}
                        </button>
                        <button onClick={() => void runAll()} disabled={runAllState === "running"} className="site-btn-accent px-4">
                            {runAllState === "running" ? "Running..." : "Run all"}
                        </button>
                        <button onClick={exportSelectedReport} className="site-btn px-4">Selected report</button>
                        <button onClick={() => exportWorksheet("md")} className="site-btn px-4">Markdown</button>
                        <button onClick={() => exportWorksheet("tex")} className="site-btn px-4">LaTeX</button>
                        <button onClick={() => exportWorksheet("json")} className="site-btn-accent px-4">Notebook JSON</button>
                    </div>
                </div>
                {saveState === "error" && saveError ? (
                    <div className="mx-auto max-w-[1600px] px-5 pb-4 text-sm font-semibold text-rose-600">{saveError}</div>
                ) : null}
            </div>

            <div className="mx-auto grid max-w-[1600px] gap-5 px-5 py-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <aside className="space-y-4">
                    <div className="site-panel p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="site-eyebrow">Blocks</div>
                            <ListPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="grid gap-2">
                            {blockCatalog.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.kind} onClick={() => addBlock(item.kind)} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3 text-left transition hover:bg-muted/50">
                                        <Icon className="mt-0.5 h-4 w-4 text-accent" />
                                        <span>
                                            <span className="block text-sm font-black">{item.label}</span>
                                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="site-panel p-4">
                        <div className="site-eyebrow text-emerald-600">Saved Lab Results</div>
                        <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                            {savedResults.length ? savedResults.slice(0, 12).map((result) => (
                                <button key={result.id} onClick={() => importSavedResult(result)} className="w-full rounded-xl border border-border/70 bg-background/70 p-3 text-left transition hover:bg-muted/50">
                                    <span className="block text-sm font-black">{result.title}</span>
                                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{result.module_title} · rev {result.revision}</span>
                                </button>
                            )) : (
                                <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs leading-5 text-muted-foreground">
                                    Saved laboratory result topilmadi yoki backend ulanmagan.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="space-y-4">
                    {blocks.map((block, index) => (
                        <NotebookBlockCard
                            key={block.id}
                            block={block}
                            index={index}
                            active={block.id === activeBlockId}
                            onFocus={() => setActiveBlockId(block.id)}
                            selected={selectedBlockIds.has(block.id)}
                            onToggleSelected={() => setSelectedBlockIds((current) => {
                                const next = new Set(current);
                                if (next.has(block.id)) next.delete(block.id);
                                else next.add(block.id);
                                return next;
                            })}
                            onChange={(patch) => {
                                const nextPatch = patch.content || patch.config ? { ...patch, config: { ...(patch.config || {}), stale: "true" } } : patch;
                                setBlocks((current) => updateBlock(current, block.id, nextPatch));
                            }}
                            onInsertBlockAfter={(nextBlock) => insertBlockAfter(block.id, nextBlock)}
                            onRemove={() => {
                                setBlocks((current) => current.filter((item) => item.id !== block.id));
                                if (activeBlockId === block.id) setActiveBlockId(blocks[0]?.id ?? "");
                            }}
                        />
                    ))}
                </main>

                <aside className="space-y-4">
                    <div className="site-panel p-5">
                        <div className="site-eyebrow text-sky-600">Outline</div>
                        <div className="mt-4 space-y-2">
                            {blocks.map((block, index) => (
                                <button
                                    key={block.id}
                                    onClick={() => setActiveBlockId(block.id)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                                        block.id === activeBlockId ? "border-accent/40 bg-[var(--accent-soft)] font-bold" : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    {index + 1}. {block.title}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="site-panel p-5">
                        <div className="site-eyebrow text-amber-600">Documents</div>
                        <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-1">
                            {documents.length ? documents.map((document) => (
                                <button key={document.id} onClick={() => loadDocument(document)} className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-left text-sm transition hover:bg-muted/50">
                                    <span className="block font-bold">{document.title}</span>
                                    <span className="text-xs text-muted-foreground">rev {document.revision}</span>
                                </button>
                            )) : (
                                <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs leading-5 text-muted-foreground">No saved notebooks yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="site-panel p-5">
                        <div className="site-eyebrow text-emerald-600">Inspector</div>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Active block</div>
                                <div className="mt-1 font-bold">{activeBlock?.title}</div>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Live status</div>
                                <div className="mt-1 font-bold text-emerald-600">DB connected</div>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Export blocks</div>
                                <div className="mt-1 font-bold">{blocks.length}</div>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Selected for report</div>
                                <div className="mt-1 font-bold">{selectedBlockIds.size}</div>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Execution order</div>
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    {blocks.filter((block) => block.kind === "solve").map((block, index) => (
                                        <div key={block.id}>{index + 1}. {block.title} {block.config?.stale === "true" ? "(stale)" : ""}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Dependency graph</div>
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                    {dependencyGraph.map((item) => (
                                        <div key={item.id}>
                                            {item.title} {item.dependsOn ? "-> depends on solve" : "-> source"} {item.stale ? "(stale)" : ""}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function NotebookBlockCard({
    block,
    index,
    active,
    selected,
    onFocus,
    onToggleSelected,
    onChange,
    onInsertBlockAfter,
    onRemove,
}: {
    block: NotebookBlock;
    index: number;
    active: boolean;
    selected: boolean;
    onFocus: () => void;
    onToggleSelected: () => void;
    onChange: (patch: Partial<NotebookBlock>) => void;
    onInsertBlockAfter: (block: NotebookBlock) => void;
    onRemove: () => void;
}) {
    const Icon = blockCatalog.find((item) => item.kind === block.kind)?.icon ?? FileText;
    const [runState, setRunState] = React.useState<"idle" | "running" | "error">("idle");

    const runSolveBlock = async () => {
        if (block.kind !== "solve") return;
        setRunState("running");
        try {
            const response = await fetchPublic("/api/laboratory/solve/integral/", {
                method: "POST",
                body: JSON.stringify({
                    expression: block.content,
                    lower: block.config?.lower || "0",
                    upper: block.config?.upper || "1",
                    method: block.config?.method || "auto",
                }),
            });
            const data = (await response.json()) as NotebookSolveResult;
            if (!response.ok) {
                throw new Error(data.message || "Backend solve failed.");
            }
            onChange({
                config: {
                    ...(block.config || {}),
                    backendStatus: data.status,
                    backendMessage: data.message || "",
                    backendResultLatex: data.exact?.evaluated_latex || "",
                    backendAntiderivativeLatex: data.exact?.antiderivative_latex || "",
                    backendNumeric: data.exact?.numeric_approximation || "",
                    backendMethod: data.exact?.method_label || block.config?.method || "auto",
                    executedAt: new Date().toISOString(),
                    stale: "false",
                },
            });
            setRunState("idle");
        } catch (error) {
            onChange({
                config: {
                    ...(block.config || {}),
                    backendStatus: "error",
                    backendMessage: error instanceof Error ? error.message : "Backend solve failed.",
                    executedAt: new Date().toISOString(),
                },
            });
            setRunState("error");
        }
    };

    const addCodeAppendix = () => {
        if (block.kind !== "solve") return;
        const codeBlock: NotebookBlock = {
            id: `code-${Date.now()}`,
            kind: "python",
            title: `${block.title || "Solve block"} code appendix`,
            content: buildIntegralCodeForMode("python-sympy", {
                expression: block.content,
                lower: block.config?.lower || "0",
                upper: block.config?.upper || "1",
                solveMethod: block.config?.method || "auto",
            }),
            config: {
                sourceBlockId: block.id,
                generatedFrom: "solve-block",
                method: block.config?.method || "auto",
            },
        };
        onInsertBlockAfter(codeBlock);
    };

    return (
        <section onClick={onFocus} className={`site-panel overflow-hidden ${active ? "ring-2 ring-accent/25" : ""}`}>
            <div className="flex flex-col gap-3 border-b border-border/70 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <input type="checkbox" checked={selected} onChange={onToggleSelected} onClick={(event) => event.stopPropagation()} className="h-4 w-4 accent-[var(--accent)]" />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Block {index + 1} · {block.kind}</div>
                        <input
                            value={block.title}
                            onChange={(event) => onChange({ title: event.target.value })}
                            className="mt-1 w-full bg-transparent text-lg font-black tracking-tight outline-none"
                        />
                        {block.config?.stale === "true" ? (
                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">Stale · run block to refresh</div>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {block.kind === "solve" ? (
                        <>
                            <button onClick={() => void runSolveBlock()} disabled={runState === "running"} className="site-btn-accent px-3 py-2 text-xs">
                                {runState === "running" ? "Running..." : "Run backend"}
                            </button>
                            <button onClick={addCodeAppendix} className="site-btn px-3 py-2 text-xs">
                                Add code
                            </button>
                        </>
                    ) : null}
                    <button onClick={onRemove} className="rounded-xl border border-border/70 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-rose-600">
                        Remove
                    </button>
                </div>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <BlockEditor block={block} onChange={onChange} />
                <BlockPreview block={block} />
            </div>
        </section>
    );
}

function BlockEditor({ block, onChange }: { block: NotebookBlock; onChange: (patch: Partial<NotebookBlock>) => void }) {
    return (
        <div className="space-y-3">
            <textarea
                value={block.content}
                onChange={(event) => onChange({ content: event.target.value })}
                className="min-h-36 w-full resize-y rounded-2xl border border-border/70 bg-background px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-accent/45 focus:ring-4 focus:ring-[var(--accent-soft)]"
            />
            {block.kind === "solve" ? (
                <div className="grid gap-2 sm:grid-cols-4">
                    {(["variable", "lower", "upper", "method"] as const).map((key) => (
                        <input key={key} value={block.config?.[key] ?? ""} onChange={(event) => onChange({ config: { ...(block.config || {}), [key]: event.target.value } })} placeholder={key} className="h-10 rounded-xl border border-border/70 bg-background px-3 font-mono text-sm outline-none" />
                    ))}
                </div>
            ) : null}
            {block.kind === "graph" || block.kind === "table" ? (
                <div className="grid gap-2 sm:grid-cols-3">
                    {(block.kind === "graph" ? ["xMin", "xMax", "samples"] : ["xMin", "xMax", "rows"]).map((key) => (
                        <input key={key} value={block.config?.[key] ?? ""} onChange={(event) => onChange({ config: { ...(block.config || {}), [key]: event.target.value } })} placeholder={key} className="h-10 rounded-xl border border-border/70 bg-background px-3 font-mono text-sm outline-none" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function BlockPreview({ block }: { block: NotebookBlock }) {
    try {
        if (block.kind === "formula") {
            return <PreviewShell title="Rendered formula"><LaboratoryInlineMathMarkdown content={`$$${block.content}$$`} /></PreviewShell>;
        }
        if (block.kind === "solve") {
            const lower = safeNumber(block.config?.lower, 0);
            const upper = safeNumber(block.config?.upper, 1);
            const segments = Math.round(safeNumber(block.config?.segments, 400));
            const result = simpsonIntegral(block.content, lower, upper, segments);
            const hasBackend = Boolean(block.config?.backendResultLatex || block.config?.backendMessage);
            return (
                <PreviewShell title="Live solve result">
                    <div className="mb-3">
                        <PremiumFeatureBadge label="Notebook compute" detail="backend solve block" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Metric label="Local method" value="Composite Simpson" />
                        <Metric label="Value" value={result.value.toPrecision(12)} />
                        <Metric label="Segments" value={String(result.segments)} />
                    </div>
                    {hasBackend ? (
                        <div className="mt-4 rounded-2xl border border-border/70 bg-background p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Backend certificate-ready result</div>
                            {block.config?.backendResultLatex ? (
                                <div className="mt-3 overflow-x-auto">
                                    <LaboratoryInlineMathMarkdown content={`$$${block.config.backendResultLatex}$$`} />
                                </div>
                            ) : null}
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <Metric label="Status" value={block.config?.backendStatus || "ready"} />
                                <Metric label="Method" value={block.config?.backendMethod || block.config?.method || "auto"} />
                                <Metric label="Numeric" value={block.config?.backendNumeric || "pending"} />
                            </div>
                            {block.config?.backendMessage ? (
                                <div className="mt-3 text-xs leading-5 text-muted-foreground">{block.config.backendMessage}</div>
                            ) : null}
                        </div>
                    ) : null}
                </PreviewShell>
            );
        }
        if (block.kind === "graph") {
            const points = sampleGraph(block.content, safeNumber(block.config?.xMin, -5), safeNumber(block.config?.xMax, 5), Math.round(safeNumber(block.config?.samples, 160)));
            return <PreviewShell title="Live graph"><Sparkline points={points} /></PreviewShell>;
        }
        if (block.kind === "table") {
            const rows = Math.max(2, Math.min(50, Math.round(safeNumber(block.config?.rows, 8))));
            const xMin = safeNumber(block.config?.xMin, 0);
            const xMax = safeNumber(block.config?.xMax, 5);
            const data = Array.from({ length: rows }, (_, index) => {
                const x = xMin + ((xMax - xMin) * index) / (rows - 1);
                return { x, y: evaluateExpression(block.content, x) };
            });
            return (
                <PreviewShell title="Generated table">
                    <div className="overflow-hidden rounded-2xl border border-border/70">
                        {data.map((row) => (
                            <div key={row.x} className="grid grid-cols-2 border-b border-border/50 px-3 py-2 text-sm last:border-b-0">
                                <span className="font-mono">{row.x.toFixed(4)}</span>
                                <span className="font-mono">{row.y.toFixed(8)}</span>
                            </div>
                        ))}
                    </div>
                </PreviewShell>
            );
        }
        if (block.kind === "python") {
            return <PreviewShell title="Code appendix"><pre className="overflow-auto rounded-2xl bg-foreground p-4 text-sm leading-6 text-background">{block.content}</pre></PreviewShell>;
        }
        if (block.kind === "theorem" || block.kind === "exercise" || block.kind === "answer" || block.kind === "export") {
            return <PreviewShell title="Document block"><div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{block.content}</div></PreviewShell>;
        }
        if (block.kind === "lab-result") {
            return (
                <PreviewShell title="Saved Laboratory result">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Metric label="Module" value={block.config?.module || "laboratory"} />
                        <Metric label="Mode" value={block.config?.mode || "result"} />
                        <Metric label="Revision" value={block.config?.revision || "1"} />
                    </div>
                    <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-border/70 bg-background p-4 text-sm leading-7 text-muted-foreground">
                        <LaboratoryInlineMathMarkdown content={block.content} />
                    </div>
                </PreviewShell>
            );
        }
        return <PreviewShell title="Text preview"><div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">{block.content}</div></PreviewShell>;
    } catch (error) {
        return (
            <PreviewShell title="Needs attention">
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-300">
                    {error instanceof Error ? error.message : "Block could not be evaluated."}
                </div>
            </PreviewShell>
        );
    }
}

function PreviewShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Grid3X3 className="h-3.5 w-3.5" />
                {title}
            </div>
            {children}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/70 bg-background p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
            <div className="mt-2 break-words font-mono text-sm font-black">{value}</div>
        </div>
    );
}
