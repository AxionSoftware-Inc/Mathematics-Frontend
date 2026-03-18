/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { analyzeAnalyticGeometry } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, LIVE_WRITER_EXPORT_KEY, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type PointKey = "ax" | "ay" | "bx" | "by" | "cx" | "cy" | "dx" | "dy";
type GeometryBlockId = "setup" | "analysis" | "plane" | "bridge";

const geometryNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Nuqtalar koordinatalari" },
    { id: "analysis" as const, label: "Analysis", description: "Distance, midpoint, line va intersection" },
    { id: "plane" as const, label: "Plane", description: "Koordinata tekisligi preview" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
];

const exportGuides = {
    copy: {
        badge: "Geometry export",
        title: "Geometry natijasini nusxa olish",
        description: "Asosiy geometry hisobotini markdown ko'rinishida clipboard'ga ko'chiradi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Nuqtalar, distance, midpoint, line equations va intersection bitta hisobotga yig'iladi.",
            "Clipboard'dagi matnni mavjud maqola ichiga kerakli joyda paste qilasan.",
            "Diagram tavsiflari ham izoh sifatida birga ketadi.",
        ],
        note: "Mavjud maqola ichida qayerga tushishini o'zing boshqarmoqchi bo'lsang, shu oqim to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Geometry natijasini writer'ga yuborish",
        description: "Geometry hisoboti yangi draft'ga import qilinadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Geometry hisobot local storage'ga vaqtincha yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Ochiq writer ichidagi live block uchun pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

function buildGeometryMarkdown(params: {
    values: Record<PointKey, string>;
    analysis: ReturnType<typeof analyzeAnalyticGeometry>;
}) {
    const { values, analysis } = params;
    return `## Laboratory Export: Geometry Studio

### Points
- A = (${values.ax}, ${values.ay})
- B = (${values.bx}, ${values.by})
- C = (${values.cx}, ${values.cy})
- D = (${values.dx}, ${values.dy})

### Computed Geometry
- Distance AB: ${analysis.distanceAB}
- Midpoint AB: (${analysis.midpointAB.x}, ${analysis.midpointAB.y})
- Line AB: ${analysis.lineAB.equation}
- Line CD: ${analysis.lineCD.equation}
- Intersection: ${analysis.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis.isParallel ? "Parallel" : "--"}
`;
}

function buildGeometryLivePayload(params: {
    targetId: string;
    values: Record<PointKey, string>;
    analysis: ReturnType<typeof analyzeAnalyticGeometry>;
}): WriterBridgeBlockData {
    const { targetId, values, analysis } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "geometry-studio",
        kind: "geometry",
        title: "Geometry studio result",
        summary: "Laboratoriyadan live yuborilgan analytic geometry hisoboti.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Distance AB", value: String(analysis.distanceAB) },
            { label: "Midpoint", value: `(${analysis.midpointAB.x}, ${analysis.midpointAB.y})` },
            { label: "Line AB", value: analysis.lineAB.equation },
            { label: "Line CD", value: analysis.lineCD.equation },
        ],
        notes: [
            `A=(${values.ax}, ${values.ay}), B=(${values.bx}, ${values.by})`,
            `C=(${values.cx}, ${values.cy}), D=(${values.dx}, ${values.dy})`,
            `Intersection: ${analysis.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis.isParallel ? "Parallel" : "--"}`,
        ],
        plotSeries: [
            { label: "Line AB", color: "#2563eb", points: analysis.lineAB.samples },
            { label: "Line CD", color: "#f59e0b", points: analysis.lineCD.samples },
            {
                label: "Points A/B",
                color: "#16a34a",
                points: [
                    { x: Number(values.ax), y: Number(values.ay) },
                    { x: Number(values.bx), y: Number(values.by) },
                ],
            },
            {
                label: "Points C/D",
                color: "#7c3aed",
                points: [
                    { x: Number(values.cx), y: Number(values.cy) },
                    { x: Number(values.dx), y: Number(values.dy) },
                ],
            },
            ...(analysis.intersection ? [{ label: "Intersection", color: "#dc2626", points: [analysis.intersection] }] : []),
        ],
    };
}

export function GeometryStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [values, setValues] = React.useState<Record<PointKey, string>>({
        ax: String(module.config?.defaultAx ?? 0),
        ay: String(module.config?.defaultAy ?? 0),
        bx: String(module.config?.defaultBx ?? 4),
        by: String(module.config?.defaultBy ?? 3),
        cx: String(module.config?.defaultCx ?? 0),
        cy: String(module.config?.defaultCy ?? 4),
        dx: String(module.config?.defaultDx ?? 5),
        dy: String(module.config?.defaultDy ?? 0),
    });
    const notebook = useLaboratoryNotebook<GeometryBlockId>({
        storageKey: "mathsphere-lab-geometry-notebook",
        definitions: geometryNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "plane"],
    });
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const updateValue = (key: PointKey, next: string) => {
        setValues((current) => ({ ...current, [key]: next }));
    };

    let error = "";
    let analysis: ReturnType<typeof analyzeAnalyticGeometry> | null = null;

    try {
        analysis = analyzeAnalyticGeometry(
            { x: Number(values.ax), y: Number(values.ay) },
            { x: Number(values.bx), y: Number(values.by) },
            { x: Number(values.cx), y: Number(values.cy) },
            { x: Number(values.dx), y: Number(values.dy) },
        );
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : "Geometry modulida xato yuz berdi.";
    }

    async function copyMarkdownExport() {
        if (!analysis) {
            return;
        }

        await navigator.clipboard.writeText(buildGeometryMarkdown({ values, analysis }));
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (!analysis) {
            return;
        }

        window.localStorage.setItem(LIVE_WRITER_EXPORT_KEY, buildGeometryMarkdown({ values, analysis }));
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !analysis) {
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
            payload: buildGeometryLivePayload({
                targetId: selectedTarget.id,
                values,
                analysis,
            }),
        };

        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3">
            <LaboratoryNotebookToolbar
                title="Geometry Notebook"
                description="Setup, computed geometry va plane preview bloklarini kerak bo'lsa boshqaring."
                activeBlocks={notebook.activeBlocks}
                definitions={geometryNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length ? (
                <LaboratoryNotebookEmptyState message="Geometry modulida ham faqat kerakli bloklar ko'rinadi." />
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                {notebook.hasBlock("setup") ? (
                <div className="site-panel p-6">
                    <div className="site-eyebrow">Analytic Geometry Inputs</div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {[
                            { label: "A(x, y)", xKey: "ax" as PointKey, yKey: "ay" as PointKey },
                            { label: "B(x, y)", xKey: "bx" as PointKey, yKey: "by" as PointKey },
                            { label: "C(x, y)", xKey: "cx" as PointKey, yKey: "cy" as PointKey },
                            { label: "D(x, y)", xKey: "dx" as PointKey, yKey: "dy" as PointKey },
                        ].map((point) => (
                            <div key={point.label} className="site-outline-card p-4">
                                <div className="text-sm font-semibold text-muted-foreground">{point.label}</div>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <input
                                        value={values[point.xKey]}
                                        onChange={(event) => updateValue(point.xKey, event.target.value)}
                                        className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
                                        placeholder="x"
                                    />
                                    <input
                                        value={values[point.yKey]}
                                        onChange={(event) => updateValue(point.yKey, event.target.value)}
                                        className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
                                        placeholder="y"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {error ? <div className="mt-5 rounded-[1.25rem] border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
                </div>
                ) : null}

                {notebook.hasBlock("analysis") ? (
                <div className="site-panel-strong p-6">
                    <div className="site-eyebrow">Computed Geometry</div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="site-outline-card p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Distance AB</div>
                            <div className="mt-3 font-serif text-3xl font-black">{analysis?.distanceAB ?? "--"}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Midpoint AB</div>
                            <div className="mt-3 font-serif text-3xl font-black">
                                {analysis ? `(${analysis.midpointAB.x}, ${analysis.midpointAB.y})` : "--"}
                            </div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Line AB</div>
                            <div className="mt-3 break-words text-sm font-semibold text-muted-foreground">{analysis?.lineAB.equation ?? "--"}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Line CD</div>
                            <div className="mt-3 break-words text-sm font-semibold text-muted-foreground">{analysis?.lineCD.equation ?? "--"}</div>
                        </div>
                    </div>
                    <div className="mt-4 site-outline-card p-4">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Intersection</div>
                        <div className="mt-3 font-serif text-3xl font-black">
                            {analysis?.intersection ? `(${analysis.intersection.x}, ${analysis.intersection.y})` : analysis?.isParallel ? "Parallel" : "--"}
                        </div>
                    </div>
                </div>
                ) : null}
            </div>

            {notebook.hasBlock("plane") && analysis ? (
                <div className="site-panel-strong p-6">
                    <div className="site-eyebrow">Geometry Plane</div>
                    <div className="mt-4">
                        <CartesianPlot
                            series={[
                                { label: "Line AB", color: "#2563eb", points: analysis.lineAB.samples },
                                { label: "Line CD", color: "#f59e0b", points: analysis.lineCD.samples },
                                {
                                    label: "Points A/B",
                                    color: "#16a34a",
                                    points: [
                                        { x: Number(values.ax), y: Number(values.ay) },
                                        { x: Number(values.bx), y: Number(values.by) },
                                    ],
                                },
                                {
                                    label: "Points C/D",
                                    color: "#7c3aed",
                                    points: [
                                        { x: Number(values.cx), y: Number(values.cy) },
                                        { x: Number(values.dx), y: Number(values.dy) },
                                    ],
                                },
                                ...(analysis.intersection
                                    ? [
                                          {
                                              label: "Intersection",
                                              color: "#dc2626",
                                              points: [analysis.intersection],
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Bu modul keyinroq circle, triangle centers, conic sections va coordinate transforms bilan o'sadi.
                    </p>
                </div>
            ) : null}

            {notebook.hasBlock("bridge") ? (
                <LaboratoryBridgeCard
                    ready={Boolean(analysis && !error)}
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
        </div>
    );
}
