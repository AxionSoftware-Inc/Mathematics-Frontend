"use client";

import React from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { analyzeSeries, analyzeTaylorApproximation, estimateLimit } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, LIVE_WRITER_EXPORT_KEY, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const seriesPresets = [
    { label: "p-series", expression: "1 / n^2", start: "1", count: "14" },
    { label: "harmonic", expression: "1 / n", start: "1", count: "16" },
    { label: "alternating", expression: "(-1)^(n + 1) / n", start: "1", count: "18" },
    { label: "geometric growth", expression: "1.2^n", start: "1", count: "10" },
];

const limitPresets = [
    { label: "sin(x)/x", expression: "sin(x) / x", point: "0", radius: "1" },
    { label: "(1-cos x)/x^2", expression: "(1 - cos(x)) / x^2", point: "0", radius: "1" },
    { label: "(x^2-1)/(x-1)", expression: "(x^2 - 1) / (x - 1)", point: "1", radius: "1" },
    { label: "abs(x)/x", expression: "abs(x) / x", point: "0", radius: "1" },
];

const taylorPresets = [
    { label: "sin(x)", expression: "sin(x)", center: "0", order: "5", radius: "2" },
    { label: "exp(x)", expression: "exp(x)", center: "0", order: "5", radius: "2" },
    { label: "ln(1+x)", expression: "log(1 + x)", center: "0", order: "5", radius: "0.8" },
    { label: "cos(x)", expression: "cos(x)", center: "0", order: "6", radius: "2" },
];

const diagnosticStyles = {
    "likely-convergent": "border-emerald-300/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    "slow-convergence": "border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    "likely-divergent": "border-rose-300/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    inconclusive: "border-border bg-muted/40 text-foreground",
    "likely-exists": "border-emerald-300/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    "one-sided-mismatch": "border-rose-300/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    "likely-unbounded": "border-fuchsia-300/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    unstable: "border-border bg-muted/40 text-foreground",
} as const;

const exportGuides = {
    copy: {
        badge: "Markdown export",
        title: "Markdown nusxa olish",
        description: "Natija clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olishni davom ettirish",
        steps: [
            "Series, limit va Taylor natijalari bitta markdown bo'limga yig'iladi.",
            "Clipboard'dagi matnni kerakli maqola joyiga paste qilasan.",
            "Grafik tavsifi va koeffitsientlar ham birga ketadi.",
        ],
        note: "Qaysi maqola va qaysi joyga tushishini o'zing nazorat qilasan.",
    },
    send: {
        badge: "Writer import",
        title: "Writer'ga yuborish",
        description: "Export yangi writer draft'iga tushadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Natija local storage orqali vaqtincha saqlanadi.",
            "Yangi writer draft ochiladi.",
            "Laboratoriya bloki draft boshiga import qilinadi.",
        ],
        note: "Mavjud ochiq maqola uchun `Live Writer Bridge`dan foydalaning.",
    },
} as const;

type SeriesBlockId = "series" | "limit" | "taylor" | "bridge";

const blockDefinitions = [
    { id: "series" as const, label: "Series" },
    { id: "limit" as const, label: "Limit" },
    { id: "taylor" as const, label: "Taylor" },
    { id: "bridge" as const, label: "Writer Bridge" },
];

const defaultBlocks: SeriesBlockId[] = ["series"];
const blockStorageKey = "mathsphere-series-limits-blocks";

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

function CompactMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
            <div className="mt-2 font-serif text-2xl font-black">{value}</div>
        </div>
    );
}

function CompactPresetRow({ items, onApply }: { items: { label: string }[]; onApply: (label: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => onApply(item.label)}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-foreground hover:text-foreground"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

function BlockToolbar({
    activeBlocks,
    onAddBlock,
    onRemoveBlock,
}: {
    activeBlocks: SeriesBlockId[];
    onAddBlock: (blockId: SeriesBlockId) => void;
    onRemoveBlock: (blockId: SeriesBlockId) => void;
}) {
    return (
        <div className="site-panel p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow">Notebook Workspace</div>
                    <h2 className="mt-1 font-serif text-2xl font-black">Addable Analysis Blocks</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Kerakli blokni qo&apos;shib ishlating. Hamma bo&apos;limlar birdan ochilmaydi.
                    </p>
                </div>
                <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {activeBlocks.length} active block
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {blockDefinitions.map((block) => {
                    const active = activeBlocks.includes(block.id);
                    return (
                        <button
                            key={block.id}
                            type="button"
                            onClick={() => (active ? onRemoveBlock(block.id) : onAddBlock(block.id))}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                                active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                            {active ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {block.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function buildLiveTaylorPayload(params: { targetId: string; taylorExpression: string; taylor: ReturnType<typeof analyzeTaylorApproximation> }): WriterBridgeBlockData {
    const { targetId, taylorExpression, taylor } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "series-limits-studio",
        kind: "taylor",
        title: `Taylor approximation: ${taylorExpression}`,
        summary: "Laboratoriyadan live yuborilgan Taylor yaqinlashuvi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Center", value: formatMetric(taylor.center, 6) },
            { label: "Order", value: String(taylor.order) },
            { label: "Mean error", value: formatMetric(taylor.meanError, 6) },
            { label: "Max error", value: formatMetric(taylor.maxError, 6) },
        ],
        notes: [`Function: ${taylorExpression}`, `Polynomial: ${taylor.polynomialExpression}`],
        coefficients: taylor.coefficients,
        plotSeries: [
            { label: "f(x)", color: "#1d4ed8", points: taylor.originalSamples },
            { label: "Taylor", color: "#d97706", points: taylor.approximationSamples },
        ],
    };
}

function buildLaboratoryMarkdown(params: {
    seriesExpression: string;
    limitExpression: string;
    taylorExpression: string;
    series: ReturnType<typeof analyzeSeries>;
    limit: ReturnType<typeof estimateLimit>;
    taylor: ReturnType<typeof analyzeTaylorApproximation>;
}) {
    const { seriesExpression, limitExpression, taylorExpression, series, limit, taylor } = params;
    return `## Laboratory Export: Series, Limits and Taylor Analysis

### Series Convergence
- Expression: \`${seriesExpression}\`
- Verdict: ${series.diagnosticLabel}
- Partial sum: ${formatMetric(series.lastPartial, 6)}
- Last term: ${formatMetric(series.lastTerm, 6)}
- Ratio estimate: ${formatMetric(series.ratioEstimate, 6)}

### Limit Analysis
- Expression: \`${limitExpression}\`
- Verdict: ${limit.diagnosticLabel}
- Left approach: ${formatMetric(limit.left, 6)}
- Right approach: ${formatMetric(limit.right, 6)}
- Gap: ${formatMetric(limit.gap, 6)}

### Taylor Approximation
- Function: \`${taylorExpression}\`
- Center: ${formatMetric(taylor.center, 6)}
- Order: ${taylor.order}
- Polynomial: \`${taylor.polynomialExpression}\`
- Mean error: ${formatMetric(taylor.meanError, 6)}
- Max error: ${formatMetric(taylor.maxError, 6)}
`;
}

export function SeriesLimitsStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [seriesExpression, setSeriesExpression] = React.useState(String(module.config?.defaultSeriesExpression || "1 / n^2"));
    const [startIndex, setStartIndex] = React.useState(String(module.config?.defaultSeriesStart || 1));
    const [termCount, setTermCount] = React.useState(String(module.config?.defaultSeriesCount || 12));
    const [limitExpression, setLimitExpression] = React.useState(String(module.config?.defaultLimitExpression || "sin(x) / x"));
    const [limitPoint, setLimitPoint] = React.useState(String(module.config?.defaultLimitPoint || 0));
    const [radius, setRadius] = React.useState(String(module.config?.defaultLimitRadius || 1));
    const [taylorExpression, setTaylorExpression] = React.useState("sin(x)");
    const [taylorCenter, setTaylorCenter] = React.useState("0");
    const [taylorOrder, setTaylorOrder] = React.useState("5");
    const [taylorRadius, setTaylorRadius] = React.useState("2");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<keyof typeof exportGuides | null>(null);
    const [activeBlocks, setActiveBlocks] = React.useState<SeriesBlockId[]>(() => {
        if (typeof window === "undefined") {
            return defaultBlocks;
        }
        const raw = window.localStorage.getItem(blockStorageKey);
        if (!raw) {
            return defaultBlocks;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return defaultBlocks;
            }
            const valid = parsed.filter((item): item is SeriesBlockId => blockDefinitions.some((block) => block.id === item));
            return valid.length ? valid : defaultBlocks;
        } catch {
            return defaultBlocks;
        }
    });
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const deferredSeriesExpression = React.useDeferredValue(seriesExpression);
    const deferredLimitExpression = React.useDeferredValue(limitExpression);
    const deferredTaylorExpression = React.useDeferredValue(taylorExpression);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(blockStorageKey, JSON.stringify(activeBlocks));
        }
    }, [activeBlocks]);

    let error = "";
    let series: ReturnType<typeof analyzeSeries> | null = null;
    let limit: ReturnType<typeof estimateLimit> | null = null;
    let taylor: ReturnType<typeof analyzeTaylorApproximation> | null = null;

    try {
        series = analyzeSeries(deferredSeriesExpression, Number(startIndex), Number(termCount));
        limit = estimateLimit(deferredLimitExpression, Number(limitPoint), Number(radius), 18);
        taylor = analyzeTaylorApproximation(deferredTaylorExpression, Number(taylorCenter), Number(taylorOrder), Number(taylorRadius), 40);
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : "Series yoki limit modulida xato yuz berdi.";
    }

    const seriesRows = series?.points.slice(-6).reverse() ?? [];
    const limitRows = limit?.leftApproach.map((leftPoint, index) => ({
        delta: Math.abs(leftPoint.x - limit.point),
        left: leftPoint.y,
        right: limit.rightApproach[index]?.y ?? null,
    })).slice(-6).reverse() ?? [];
    const coefficientRows = taylor?.coefficients ?? [];

    function addBlock(blockId: SeriesBlockId) {
        setActiveBlocks((current) => (current.includes(blockId) ? current : [...current, blockId]));
    }

    function removeBlock(blockId: SeriesBlockId) {
        setActiveBlocks((current) => current.filter((item) => item !== blockId));
    }

    async function copyMarkdownExport() {
        if (!series || !limit || !taylor) return;
        await navigator.clipboard.writeText(
            buildLaboratoryMarkdown({
                seriesExpression: deferredSeriesExpression,
                limitExpression: deferredLimitExpression,
                taylorExpression: deferredTaylorExpression,
                series,
                limit,
                taylor,
            }),
        );
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (!series || !limit || !taylor) return;
        window.localStorage.setItem(
            LIVE_WRITER_EXPORT_KEY,
            buildLaboratoryMarkdown({
                seriesExpression: deferredSeriesExpression,
                limitExpression: deferredLimitExpression,
                taylorExpression: deferredTaylorExpression,
                series,
                limit,
                taylor,
            }),
        );
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !taylor) return;
        const channel = createBroadcastChannel();
        if (!channel) return;
        const message: LabPublishBroadcast = {
            type: "lab-publish",
            writerId: selectedTarget.writerId,
            targetId: selectedTarget.id,
            payload: buildLiveTaylorPayload({
                targetId: selectedTarget.id,
                taylorExpression: deferredTaylorExpression,
                taylor,
            }),
        };
        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3" data-module={module.slug}>
            <BlockToolbar activeBlocks={activeBlocks} onAddBlock={addBlock} onRemoveBlock={removeBlock} />
            {error ? <div className="rounded-[1.25rem] border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
            {!activeBlocks.length ? (
                <div className="site-panel p-5">
                    <div className="site-eyebrow">Empty notebook</div>
                    <h2 className="mt-1 font-serif text-2xl font-black">Hozircha analysis block yoqilmagan.</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Tepadan kerakli bloklarni qo&apos;shing. Shu pattern bilan modul juda katta bo&apos;lsa ham sahifa bir yo&apos;la to&apos;lib ketmaydi.
                    </p>
                </div>
            ) : null}

            {activeBlocks.includes("series") && series && !error ? (
                <div className="site-panel p-4 lg:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="site-eyebrow">Series Block</div>
                            <h2 className="mt-1 font-serif text-2xl font-black">Convergence Workbench</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{series.commentary}</p>
                        </div>
                        <div className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${diagnosticStyles[series.diagnostic]}`}>
                            {series.diagnosticLabel}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_280px]">
                        <div className="space-y-3 rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <input
                                value={seriesExpression}
                                onChange={(event) => setSeriesExpression(event.target.value)}
                                className="h-11 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                placeholder="Masalan: (-1)^(n+1) / n"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    value={startIndex}
                                    onChange={(event) => setStartIndex(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Start n"
                                />
                                <input
                                    value={termCount}
                                    onChange={(event) => setTermCount(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Terms"
                                />
                            </div>
                            <CompactPresetRow
                                items={seriesPresets}
                                onApply={(label) => {
                                    const preset = seriesPresets.find((entry) => entry.label === label);
                                    if (!preset) return;
                                    setSeriesExpression(preset.expression);
                                    setStartIndex(preset.start);
                                    setTermCount(preset.count);
                                }}
                            />
                        </div>

                        <div className="rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <CartesianPlot
                                series={[
                                    { label: "a_n", color: "#2563eb", points: series.points.map((point) => ({ x: point.n, y: point.term })) },
                                    { label: "S_n", color: "#f59e0b", points: series.points.map((point) => ({ x: point.n, y: point.partial })) },
                                ]}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <CompactMetric label="Partial sum" value={formatMetric(series.lastPartial, 4)} />
                                <CompactMetric label="Last term" value={formatMetric(series.lastTerm, 4)} />
                                <CompactMetric label="Tail drift" value={formatMetric(series.tailRange, 4)} />
                                <CompactMetric label="Ratio" value={formatMetric(series.ratioEstimate, 4)} />
                            </div>
                            <div className="overflow-hidden rounded-[1.25rem] border border-border">
                                <div className="grid grid-cols-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <div>n</div>
                                    <div>a_n</div>
                                    <div>S_n</div>
                                </div>
                                {seriesRows.map((point) => (
                                    <div key={point.n} className="grid grid-cols-3 border-b border-border/70 px-3 py-2.5 text-sm last:border-b-0">
                                        <div className="font-semibold">{point.n}</div>
                                        <div>{formatMetric(point.term, 6)}</div>
                                        <div>{formatMetric(point.partial, 6)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeBlocks.includes("limit") && limit && !error ? (
                <div className="site-panel p-4 lg:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="site-eyebrow">Limit Block</div>
                            <h2 className="mt-1 font-serif text-2xl font-black">One-Sided Scanner</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{limit.commentary}</p>
                        </div>
                        <div className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${diagnosticStyles[limit.diagnostic]}`}>
                            {limit.diagnosticLabel}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_280px]">
                        <div className="space-y-3 rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <input
                                value={limitExpression}
                                onChange={(event) => setLimitExpression(event.target.value)}
                                className="h-11 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                placeholder="Masalan: (1 - cos(x)) / x^2"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    value={limitPoint}
                                    onChange={(event) => setLimitPoint(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Point a"
                                />
                                <input
                                    value={radius}
                                    onChange={(event) => setRadius(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Radius"
                                />
                            </div>
                            <CompactPresetRow
                                items={limitPresets}
                                onApply={(label) => {
                                    const preset = limitPresets.find((entry) => entry.label === label);
                                    if (!preset) return;
                                    setLimitExpression(preset.expression);
                                    setLimitPoint(preset.point);
                                    setRadius(preset.radius);
                                }}
                            />
                        </div>

                        <div className="rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <CartesianPlot
                                series={[
                                    { label: "left approach", color: "#ef4444", points: [...limit.leftApproach].sort((a, b) => a.x - b.x) },
                                    { label: "right approach", color: "#16a34a", points: [...limit.rightApproach].sort((a, b) => a.x - b.x) },
                                    {
                                        label: "average level",
                                        color: "#0f172a",
                                        points: [
                                            { x: limit.samples[0]?.x ?? limit.point - 1, y: limit.average },
                                            { x: limit.samples[limit.samples.length - 1]?.x ?? limit.point + 1, y: limit.average },
                                        ],
                                    },
                                ]}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <CompactMetric label="Left" value={formatMetric(limit.left, 4)} />
                                <CompactMetric label="Right" value={formatMetric(limit.right, 4)} />
                                <CompactMetric label="Gap" value={formatMetric(limit.gap, 4)} />
                                <CompactMetric label="f(a)" value={formatMetric(limit.centerValue, 4)} />
                            </div>
                            <div className="overflow-hidden rounded-[1.25rem] border border-border">
                                <div className="grid grid-cols-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <div>delta</div>
                                    <div>left</div>
                                    <div>right</div>
                                </div>
                                {limitRows.map((row) => (
                                    <div key={`${row.delta}-${row.left}`} className="grid grid-cols-3 border-b border-border/70 px-3 py-2.5 text-sm last:border-b-0">
                                        <div className="font-semibold">{formatMetric(row.delta, 6)}</div>
                                        <div>{formatMetric(row.left, 6)}</div>
                                        <div>{formatMetric(row.right, 6)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeBlocks.includes("taylor") && taylor && !error ? (
                <div className="site-panel p-4 lg:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="site-eyebrow">Taylor Block</div>
                            <h2 className="mt-1 font-serif text-2xl font-black">Approximation Studio</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Funksiya bilan uning Taylor yaqinlashuvini bir intervalda taqqoslang.
                            </p>
                        </div>
                        <div className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            <Sparkles className="mr-2 inline h-3.5 w-3.5" />
                            order {taylor.order}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_280px]">
                        <div className="space-y-3 rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <input
                                value={taylorExpression}
                                onChange={(event) => setTaylorExpression(event.target.value)}
                                className="h-11 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                placeholder="Masalan: sin(x)"
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <input
                                    value={taylorCenter}
                                    onChange={(event) => setTaylorCenter(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Center"
                                />
                                <input
                                    value={taylorOrder}
                                    onChange={(event) => setTaylorOrder(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Order"
                                />
                                <input
                                    value={taylorRadius}
                                    onChange={(event) => setTaylorRadius(event.target.value)}
                                    className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    placeholder="Radius"
                                />
                            </div>
                            <CompactPresetRow
                                items={taylorPresets}
                                onApply={(label) => {
                                    const preset = taylorPresets.find((entry) => entry.label === label);
                                    if (!preset) return;
                                    setTaylorExpression(preset.expression);
                                    setTaylorCenter(preset.center);
                                    setTaylorOrder(preset.order);
                                    setTaylorRadius(preset.radius);
                                }}
                            />
                            <div className="rounded-[1.25rem] border border-border bg-background/60 p-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Polynomial</div>
                                <div className="mt-2 overflow-x-auto font-mono text-sm leading-7">{taylor.polynomialExpression}</div>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-border bg-background/55 p-3">
                            <CartesianPlot
                                series={[
                                    { label: "f(x)", color: "#1d4ed8", points: taylor.originalSamples },
                                    { label: "Taylor", color: "#d97706", points: taylor.approximationSamples },
                                ]}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <CompactMetric label="Center value" value={formatMetric(taylor.centerValue, 4)} />
                                <CompactMetric label="Mean error" value={formatMetric(taylor.meanError, 6)} />
                                <CompactMetric label="Max error" value={formatMetric(taylor.maxError, 6)} />
                                <CompactMetric label="Terms" value={String(taylor.coefficients.length)} />
                            </div>
                            <div className="overflow-hidden rounded-[1.25rem] border border-border">
                                <div className="grid grid-cols-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <div>order</div>
                                    <div>f^k(a)</div>
                                    <div>coef</div>
                                </div>
                                {coefficientRows.map((row) => (
                                    <div key={row.order} className="grid grid-cols-3 border-b border-border/70 px-3 py-2.5 text-sm last:border-b-0">
                                        <div className="font-semibold">{row.order}</div>
                                        <div>{formatMetric(row.derivativeValue, 6)}</div>
                                        <div>{formatMetric(row.coefficient, 6)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeBlocks.includes("bridge") ? (
                <LaboratoryBridgeCard
                    ready={!error && Boolean(series && limit && taylor)}
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
            ) : null}

            <div className="site-panel p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Notebook mode
                    </div>
                    <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Dense layout
                    </div>
                    <div className="rounded-full border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Scale-friendly
                    </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Endi bu modul block-based ishlaydi: kerakli analysis blockni qo&apos;shasiz, ishlatasiz, yopasiz. Shu pattern keyin boshqa modullarga ham yoyiladi.
                </p>
            </div>
        </div>
    );
}
