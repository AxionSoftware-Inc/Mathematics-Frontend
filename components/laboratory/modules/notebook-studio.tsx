"use client";

import React from "react";
import { ArrowDown, ArrowUp, FileText, FunctionSquare, NotebookPen, Sigma, Trash2 } from "lucide-react";

import { ArticleRichContent } from "@/components/article-rich-content";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { analyzeSeries, analyzeTaylorApproximation, estimateLimit } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, queueWriterImport, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type NotebookCellType = "markdown" | "series" | "limit" | "taylor";

type NotebookCell =
    | { id: string; type: "markdown"; title: string; content: string }
    | { id: string; type: "series"; title: string; expression: string; start: string; count: string }
    | { id: string; type: "limit"; title: string; expression: string; point: string; radius: string }
    | { id: string; type: "taylor"; title: string; expression: string; center: string; order: string; radius: string };

const exportGuides = {
    copy: {
        badge: "Notebook export",
        title: "Notebook markdown export",
        description: "Barcha cell natijalari bitta markdown hujjat sifatida clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Notebook title va barcha cell'lar bitta tartibli markdown hujjatga yig'iladi.",
            "Markdown cell'lar matn sifatida, analysis cell'lar esa hisob natijalari bilan eksport qilinadi.",
            "Hosil bo'lgan hujjatni writer ichiga istalgan joyda joylashtirsa bo'ladi.",
        ],
        note: "Bu oqim hozirgi MVP uchun eng universal usul.",
    },
    send: {
        badge: "Writer import",
        title: "Notebook'ni writer'ga yuborish",
        description: "Butun notebook yangi writer draft sifatida import qilinadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Compiled notebook markdown local storage'ga vaqtincha yoziladi.",
            "Yangi writer draft ochiladi.",
            "Notebook hujjat boshiga import qilinadi va maqola sifatida davom ettiriladi.",
        ],
        note: "Mavjud writer ichidagi live block uchun pastdagi live bridge ishlatiladi.",
    },
} as const;

const notebookStorageKey = "mathsphere-notebook-studio-cells";

function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `cell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultCell(type: NotebookCellType): NotebookCell {
    if (type === "markdown") {
        return {
            id: createId(),
            type,
            title: "Markdown note",
            content: "## New note\n\nBu yerda matematik tushuntirish, lemma yoki observation yozing.",
        };
    }
    if (type === "series") {
        return {
            id: createId(),
            type,
            title: "Series cell",
            expression: "1 / n^2",
            start: "1",
            count: "12",
        };
    }
    if (type === "limit") {
        return {
            id: createId(),
            type,
            title: "Limit cell",
            expression: "sin(x) / x",
            point: "0",
            radius: "1",
        };
    }
    return {
        id: createId(),
        type: "taylor",
        title: "Taylor cell",
        expression: "sin(x)",
        center: "0",
        order: "5",
        radius: "2",
    };
}

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }
    const absolute = Math.abs(value);
    if (absolute >= 1000) {
        return value.toExponential(3);
    }
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function summarizeCell(cell: NotebookCell) {
    if (cell.type === "markdown") {
        return { metrics: [{ label: "Words", value: String(cell.content.trim().split(/\s+/).filter(Boolean).length) }], notes: ["Markdown note cell"] };
    }
    if (cell.type === "series") {
        const analysis = analyzeSeries(cell.expression, Number(cell.start), Number(cell.count));
        return {
            metrics: [
                { label: "Verdict", value: analysis.diagnosticLabel },
                { label: "Partial", value: formatMetric(analysis.lastPartial, 4) },
                { label: "Ratio", value: formatMetric(analysis.ratioEstimate, 4) },
            ],
            notes: [analysis.commentary],
            plotSeries: [
                { label: "a_n", color: "#2563eb", points: analysis.points.map((point) => ({ x: point.n, y: point.term })) },
                { label: "S_n", color: "#f59e0b", points: analysis.points.map((point) => ({ x: point.n, y: point.partial })) },
            ],
            markdown: `### ${cell.title}\n- Type: series\n- Expression: \`${cell.expression}\`\n- Verdict: ${analysis.diagnosticLabel}\n- Partial sum: ${formatMetric(analysis.lastPartial, 6)}\n- Commentary: ${analysis.commentary}`,
        };
    }
    if (cell.type === "limit") {
        const analysis = estimateLimit(cell.expression, Number(cell.point), Number(cell.radius), 18);
        return {
            metrics: [
                { label: "Verdict", value: analysis.diagnosticLabel },
                { label: "Left", value: formatMetric(analysis.left, 4) },
                { label: "Right", value: formatMetric(analysis.right, 4) },
            ],
            notes: [analysis.commentary],
            plotSeries: [
                { label: "left", color: "#ef4444", points: [...analysis.leftApproach].sort((a, b) => a.x - b.x) },
                { label: "right", color: "#16a34a", points: [...analysis.rightApproach].sort((a, b) => a.x - b.x) },
            ],
            markdown: `### ${cell.title}\n- Type: limit\n- Expression: \`${cell.expression}\`\n- Verdict: ${analysis.diagnosticLabel}\n- Left: ${formatMetric(analysis.left, 6)}\n- Right: ${formatMetric(analysis.right, 6)}\n- Commentary: ${analysis.commentary}`,
        };
    }

    const analysis = analyzeTaylorApproximation(cell.expression, Number(cell.center), Number(cell.order), Number(cell.radius), 40);
    return {
        metrics: [
            { label: "Order", value: String(analysis.order) },
            { label: "Mean error", value: formatMetric(analysis.meanError, 6) },
            { label: "Max error", value: formatMetric(analysis.maxError, 6) },
        ],
        notes: [`Polynomial: ${analysis.polynomialExpression}`],
        coefficients: analysis.coefficients,
        plotSeries: [
            { label: "f(x)", color: "#1d4ed8", points: analysis.originalSamples },
            { label: "Taylor", color: "#d97706", points: analysis.approximationSamples },
        ],
        markdown: `### ${cell.title}\n- Type: Taylor\n- Function: \`${cell.expression}\`\n- Center: ${formatMetric(analysis.center, 6)}\n- Order: ${analysis.order}\n- Mean error: ${formatMetric(analysis.meanError, 6)}\n- Max error: ${formatMetric(analysis.maxError, 6)}\n- Polynomial: \`${analysis.polynomialExpression}\``,
    };
}

function compileNotebookMarkdown(title: string, cells: NotebookCell[]) {
    const sections = cells.map((cell) => summarizeCell(cell).markdown);
    return `# ${title}\n\n${sections.join("\n\n")}`;
}

function buildNotebookLivePayload(targetId: string, title: string, cells: NotebookCell[], activeCellId: string): WriterBridgeBlockData {
    const activeCell = cells.find((cell) => cell.id === activeCellId) ?? cells[0];
    const summary = activeCell ? summarizeCell(activeCell) : { metrics: [], notes: ["Notebook bo'sh"], plotSeries: [] };

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "notebook-studio",
        kind: "notebook",
        title: `Notebook Studio: ${title}`,
        summary: activeCell ? `Active cell: ${activeCell.title}` : "Notebook summary",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Cells", value: String(cells.length) },
            { label: "Active type", value: activeCell?.type || "none" },
            ...summary.metrics.slice(0, 3),
        ],
        notes: [
            `Notebook title: ${title}`,
            ...(summary.notes || []),
            ...cells.slice(0, 6).map((cell, index) => `Cell ${index + 1}: ${cell.title} [${cell.type}]`),
        ],
        coefficients: "coefficients" in summary ? summary.coefficients : undefined,
        plotSeries: "plotSeries" in summary ? summary.plotSeries : undefined,
    };
}

function CellCard({
    cell,
    active,
    onSelect,
    onRemove,
    onMoveUp,
    onMoveDown,
    onChange,
}: {
    cell: NotebookCell;
    active: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onChange: (next: NotebookCell) => void;
}) {
    const baseClass = active ? "border-foreground bg-background" : "border-border bg-background/70";
    const summary = React.useMemo(() => {
        try {
            return summarizeCell(cell);
        } catch (error) {
            return {
                metrics: [{ label: "Status", value: "Error" }],
                notes: [error instanceof Error ? error.message : "Cell error"],
            };
        }
    }, [cell]);

    return (
        <div className={`rounded-[1.4rem] border p-4 transition ${baseClass}`} onClick={onSelect}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="site-eyebrow">{cell.type} cell</div>
                    <input
                        value={cell.title}
                        onChange={(event) => onChange({ ...cell, title: event.target.value } as NotebookCell)}
                        className="mt-1 w-full bg-transparent font-serif text-2xl font-black outline-none"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={(event) => { event.stopPropagation(); onMoveUp(); }} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onMoveDown(); }} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onRemove(); }} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {cell.type === "markdown" ? (
                    <>
                        <textarea
                            value={cell.content}
                            onChange={(event) => onChange({ ...cell, content: event.target.value })}
                            className="min-h-[180px] w-full rounded-[1.25rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                        />
                        <div className="rounded-[1.25rem] border border-border bg-background/55 p-4">
                            <ArticleRichContent content={cell.content} className="prose prose-neutral max-w-none text-sm dark:prose-invert" />
                        </div>
                    </>
                ) : null}

                {cell.type === "series" ? (
                    <>
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_120px]">
                            <input value={cell.expression} onChange={(event) => onChange({ ...cell, expression: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.start} onChange={(event) => onChange({ ...cell, start: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.count} onChange={(event) => onChange({ ...cell, count: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                        </div>
                        {"plotSeries" in summary && summary.plotSeries ? <CartesianPlot series={summary.plotSeries} /> : null}
                    </>
                ) : null}

                {cell.type === "limit" ? (
                    <>
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_120px]">
                            <input value={cell.expression} onChange={(event) => onChange({ ...cell, expression: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.point} onChange={(event) => onChange({ ...cell, point: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.radius} onChange={(event) => onChange({ ...cell, radius: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                        </div>
                        {"plotSeries" in summary && summary.plotSeries ? <CartesianPlot series={summary.plotSeries} /> : null}
                    </>
                ) : null}

                {cell.type === "taylor" ? (
                    <>
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_100px_100px_100px]">
                            <input value={cell.expression} onChange={(event) => onChange({ ...cell, expression: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.center} onChange={(event) => onChange({ ...cell, center: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.order} onChange={(event) => onChange({ ...cell, order: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                            <input value={cell.radius} onChange={(event) => onChange({ ...cell, radius: event.target.value })} className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none" />
                        </div>
                        {"plotSeries" in summary && summary.plotSeries ? <CartesianPlot series={summary.plotSeries} /> : null}
                    </>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summary.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-border/70 bg-background/60 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</div>
                            <div className="mt-2 font-serif text-xl font-black">{metric.value}</div>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    {summary.notes.map((note) => (
                        <div key={note} className="rounded-2xl border border-border/70 bg-background/55 px-3 py-2 text-sm leading-6 text-muted-foreground">
                            {note}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function NotebookStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [title, setTitle] = React.useState(String(module.config?.defaultTitle || "Untitled Math Notebook"));
    const [cells, setCells] = React.useState<NotebookCell[]>(() => {
        if (typeof window === "undefined") {
            return [createDefaultCell("markdown"), createDefaultCell("series")];
        }
        const raw = window.localStorage.getItem(notebookStorageKey);
        if (!raw) {
            return [createDefaultCell("markdown"), createDefaultCell("series")];
        }
        try {
            const parsed = JSON.parse(raw) as NotebookCell[];
            return Array.isArray(parsed) && parsed.length ? parsed : [createDefaultCell("markdown"), createDefaultCell("series")];
        } catch {
            return [createDefaultCell("markdown"), createDefaultCell("series")];
        }
    });
    const [activeCellId, setActiveCellId] = React.useState<string>("");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    React.useEffect(() => {
        if (!activeCellId && cells[0]) {
            setActiveCellId(cells[0].id);
        }
    }, [activeCellId, cells]);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(notebookStorageKey, JSON.stringify(cells));
        }
    }, [cells]);

    function addCell(type: NotebookCellType) {
        const next = createDefaultCell(type);
        setCells((current) => [...current, next]);
        setActiveCellId(next.id);
    }

    function updateCell(id: string, next: NotebookCell) {
        setCells((current) => current.map((cell) => (cell.id === id ? next : cell)));
    }

    function removeCell(id: string) {
        setCells((current) => current.filter((cell) => cell.id !== id));
        if (activeCellId === id) {
            setActiveCellId(cells.find((cell) => cell.id !== id)?.id || "");
        }
    }

    function moveCell(id: string, direction: -1 | 1) {
        setCells((current) => {
            const index = current.findIndex((cell) => cell.id === id);
            if (index === -1) return current;
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= current.length) return current;
            const clone = [...current];
            const [item] = clone.splice(index, 1);
            clone.splice(nextIndex, 0, item);
            return clone;
        });
    }

    async function copyMarkdownExport() {
        await navigator.clipboard.writeText(compileNotebookMarkdown(title, cells));
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        queueWriterImport({
            version: 1,
            markdown: compileNotebookMarkdown(title, cells),
            block: buildNotebookLivePayload(`import-notebook-${Date.now()}`, title, cells, activeCellId),
            title,
            abstract: "Notebook studio'dan eksport qilingan matematik hujjat va faol cell natijasi.",
            keywords: "notebook, mathematics, laboratory",
        });
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !cells.length) {
            return;
        }
        const channel = createBroadcastChannel();
        if (!channel) {
            return;
        }
        const message: LabPublishBroadcast = {
            type: "lab-publish",
            writerId: selectedTarget.writerId,
            targetId: selectedTarget.id,
            payload: buildNotebookLivePayload(selectedTarget.id, title, cells, activeCellId),
        };
        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3">
            <div className="site-panel p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="site-eyebrow">Notebook Studio</div>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full bg-transparent font-serif text-4xl font-black outline-none" />
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Jupyter-like mathematical notebook: rich cells, quick iteration, writer export va live bridge.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => addCell("markdown")} className="rounded-full border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"><FileText className="mr-2 inline h-4 w-4" />Markdown</button>
                        <button type="button" onClick={() => addCell("series")} className="rounded-full border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"><Sigma className="mr-2 inline h-4 w-4" />Series</button>
                        <button type="button" onClick={() => addCell("limit")} className="rounded-full border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"><FunctionSquare className="mr-2 inline h-4 w-4" />Limit</button>
                        <button type="button" onClick={() => addCell("taylor")} className="rounded-full border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"><NotebookPen className="mr-2 inline h-4 w-4" />Taylor</button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-3">
                    {cells.map((cell) => (
                        <CellCard
                            key={cell.id}
                            cell={cell}
                            active={cell.id === activeCellId}
                            onSelect={() => setActiveCellId(cell.id)}
                            onRemove={() => removeCell(cell.id)}
                            onMoveUp={() => moveCell(cell.id, -1)}
                            onMoveDown={() => moveCell(cell.id, 1)}
                            onChange={(next) => updateCell(cell.id, next)}
                        />
                    ))}
                </div>

                <div className="space-y-3 xl:sticky xl:top-24 xl:self-start">
                    <LaboratoryBridgeCard
                        ready={Boolean(cells.length)}
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

                    <div className="site-panel p-4">
                        <div className="site-eyebrow">Notebook Summary</div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Cells</div>
                                <div className="mt-2 font-serif text-3xl font-black">{cells.length}</div>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Active Cell</div>
                                <div className="mt-2 font-serif text-2xl font-black">{cells.find((cell) => cell.id === activeCellId)?.type || "--"}</div>
                            </div>
                        </div>
                        <div className="mt-4 rounded-[1.25rem] border border-border bg-background/55 p-3 text-sm leading-6 text-muted-foreground">
                            Bu MVP bosqich. Keyin Python, matrix, integral, proof va persisted notebook history qo&apos;shiladi.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
