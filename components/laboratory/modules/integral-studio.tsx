"use client";

import React from "react";
import { Activity, AreaChart, BetweenHorizontalStart, Waves } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { approximateIntegral } from "@/components/laboratory/math-utils";
import { createBroadcastChannel, queueWriterImport, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const presets = [
    { label: "sin(x)", expression: "sin(x)", lower: "0", upper: "3.14159", segments: "24" },
    { label: "x^2", expression: "x^2", lower: "0", upper: "3", segments: "18" },
    { label: "exp(-x^2)", expression: "exp(-x^2)", lower: "-2", upper: "2", segments: "30" },
    { label: "sin(x)+x^2/5", expression: "sin(x) + x^2 / 5", lower: "0", upper: "3.14", segments: "24" },
];

const exportGuides = {
    copy: {
        badge: "Integral export",
        title: "Integral natijasini nusxa olish",
        description: "Integral hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Midpoint, trapezoid va Simpson natijalari bitta hisobotga yig'iladi.",
            "Function, interval va segment soni ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Integral natijasini writer'ga yuborish",
        description: "Integral hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Integral export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type IntegralBlockId = "setup" | "bridge" | "analysis";

const integralNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Integral input va metrics" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
    { id: "analysis" as const, label: "Analysis", description: "Curve preview va method comparison" },
];

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }

    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildIntegralMarkdown(params: {
    expression: string;
    lower: number;
    upper: number;
    segments: number;
    summary: ReturnType<typeof approximateIntegral>;
}) {
    const { expression, lower, upper, segments, summary } = params;
    const spread = Math.max(summary.midpoint, summary.trapezoid, summary.simpson) - Math.min(summary.midpoint, summary.trapezoid, summary.simpson);

    return `## Laboratory Export: Integral Studio

### Problem
- Function: \`${expression}\`
- Interval: [${formatMetric(lower, 4)}, ${formatMetric(upper, 4)}]
- Segments: ${segments}

### Numerical Estimates
- Midpoint: ${formatMetric(summary.midpoint, 6)}
- Trapezoid: ${formatMetric(summary.trapezoid, 6)}
- Simpson: ${formatMetric(summary.simpson, 6)}
- Method spread: ${formatMetric(spread, 6)}
`;
}

function buildIntegralLivePayload(params: {
    targetId: string;
    expression: string;
    lower: number;
    upper: number;
    segments: number;
    summary: ReturnType<typeof approximateIntegral>;
}): WriterBridgeBlockData {
    const { targetId, expression, lower, upper, segments, summary } = params;
    const spread = Math.max(summary.midpoint, summary.trapezoid, summary.simpson) - Math.min(summary.midpoint, summary.trapezoid, summary.simpson);

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "integral-studio",
        kind: "integral",
        title: `Integral study: ${expression}`,
        summary: "Laboratoriyadan live yuborilgan integral hisoboti va usullar taqqoslashi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Lower", value: formatMetric(lower, 4) },
            { label: "Upper", value: formatMetric(upper, 4) },
            { label: "Midpoint", value: formatMetric(summary.midpoint, 6) },
            { label: "Simpson", value: formatMetric(summary.simpson, 6) },
        ],
        notes: [
            `Function: ${expression}`,
            `Trapezoid=${formatMetric(summary.trapezoid, 6)}`,
            `Segments=${segments}, method spread=${formatMetric(spread, 6)}`,
        ],
        plotSeries: [
            {
                label: "f(x)",
                color: "#2563eb",
                points: summary.samples,
            },
        ],
    };
}

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [expression, setExpression] = React.useState(String(module.config?.defaultExpression || "sin(x) + x^2 / 5"));
    const [lower, setLower] = React.useState(String(module.config?.defaultLower || 0));
    const [upper, setUpper] = React.useState(String(module.config?.defaultUpper || 3.14));
    const [segments, setSegments] = React.useState(String(module.config?.defaultSegments || 24));
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const notebook = useLaboratoryNotebook<IntegralBlockId>({
        storageKey: "mathsphere-lab-integral-notebook",
        definitions: integralNotebookBlocks,
        defaultBlocks: ["setup", "analysis"],
    });
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    let error = "";
    let summary: ReturnType<typeof approximateIntegral> | null = null;
    const numericLower = Number(lower);
    const numericUpper = Number(upper);
    const numericSegments = Number(segments);

    try {
        summary = approximateIntegral(expression, numericLower, numericUpper, numericSegments);
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : "Integral hisobida xato yuz berdi.";
    }

    const spread =
        summary !== null
            ? Math.max(summary.midpoint, summary.trapezoid, summary.simpson) - Math.min(summary.midpoint, summary.trapezoid, summary.simpson)
            : null;

    async function copyMarkdownExport() {
        if (!summary) {
            return;
        }

        await navigator.clipboard.writeText(
            buildIntegralMarkdown({
                expression,
                lower: numericLower,
                upper: numericUpper,
                segments: numericSegments,
                summary,
            }),
        );
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (!summary) {
            return;
        }

        queueWriterImport({
            version: 1,
            markdown: buildIntegralMarkdown({
                expression,
                lower: numericLower,
                upper: numericUpper,
                segments: numericSegments,
                summary,
            }),
            block: buildIntegralLivePayload({
                targetId: `import-integral-${Date.now()}`,
                expression,
                lower: numericLower,
                upper: numericUpper,
                segments: numericSegments,
                summary,
            }),
            title: `Integral study: ${expression}`,
            abstract: "Integral laboratoriyasidan eksport qilingan numerik integratsiya natijalari va grafik preview.",
            keywords: "integral, numerical integration, simpson, trapezoid",
        });
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !summary) {
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
            payload: buildIntegralLivePayload({
                targetId: selectedTarget.id,
                expression,
                lower: numericLower,
                upper: numericUpper,
                segments: numericSegments,
                summary,
            }),
        };

        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3">
            <LaboratoryNotebookToolbar
                title="Integral Notebook"
                description="Integral setup, analysis va writer bridge bloklarini alohida boshqaring."
                activeBlocks={notebook.activeBlocks}
                definitions={integralNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length ? (
                <LaboratoryNotebookEmptyState message="Integral studio faqat kerak bo'lgan bloklar bilan ochiladi." />
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
                <div className="space-y-4">
                    {notebook.hasBlock("setup") ? (
                    <div className="site-panel p-4 lg:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="site-eyebrow">Integral Setup</div>
                                <h2 className="mt-1 font-serif text-2xl font-black">Numerical Integration Studio</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Bir nechta usulni yonma-yon ko&apos;rib, interval va segmentlar integralga qanday ta&apos;sir qilishini kuzating.
                                </p>
                            </div>
                            <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                Client compute
                            </div>
                        </div>

                        <input
                            value={expression}
                            onChange={(event) => setExpression(event.target.value)}
                            className="mt-4 h-11 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                            placeholder="Masalan: exp(-x^2)"
                        />

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                { label: "Lower", value: lower, setValue: setLower },
                                { label: "Upper", value: upper, setValue: setUpper },
                                { label: "Segments", value: segments, setValue: setSegments },
                            ].map((field) => (
                                <div key={field.label}>
                                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{field.label}</div>
                                    <input
                                        value={field.value}
                                        onChange={(event) => field.setValue(event.target.value)}
                                        className="h-10 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setExpression(preset.expression);
                                        setLower(preset.lower);
                                        setUpper(preset.upper);
                                        setSegments(preset.segments);
                                    }}
                                    className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-foreground hover:text-foreground"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    ) : null}

                    {notebook.hasBlock("setup") ? (
                    <div className="site-panel-strong grid gap-3 p-4 lg:p-5 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: "Midpoint", value: summary?.midpoint, icon: Activity },
                            { label: "Trapezoid", value: summary?.trapezoid, icon: BetweenHorizontalStart },
                            { label: "Simpson", value: summary?.simpson, icon: AreaChart },
                            { label: "Spread", value: spread, icon: Waves },
                        ].map((metric) => (
                            <div key={metric.label} className="site-outline-card p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <metric.icon className="mr-1 inline h-3.5 w-3.5" />
                                    {metric.label}
                                </div>
                                <div className="mt-3 font-serif text-3xl font-black">{formatMetric(metric.value, 4)}</div>
                            </div>
                        ))}
                    </div>
                    ) : null}
                </div>

                {notebook.hasBlock("bridge") ? (
                    <LaboratoryBridgeCard
                        ready={Boolean(summary && !error)}
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

            {error ? <div className="rounded-[1.25rem] border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

            {notebook.hasBlock("analysis") && summary ? (
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="site-panel-strong p-4 lg:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="site-eyebrow">Curve Preview</div>
                                <h3 className="mt-1 font-serif text-2xl font-black">Function on the Interval</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Integral qiymati interval, funksiyaning shakli va segment soniga bog&apos;liq. Grafik shu narsani ko&apos;rsatadi.
                                </p>
                            </div>
                            <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                [{formatMetric(numericLower, 3)}, {formatMetric(numericUpper, 3)}]
                            </div>
                        </div>
                        <div className="mt-4">
                            <CartesianPlot
                                series={[
                                    {
                                        label: "f(x)",
                                        color: "#2563eb",
                                        points: summary.samples,
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="site-panel p-4 lg:p-5">
                            <div className="site-eyebrow">Method Comparison</div>
                            <div className="mt-3 space-y-3">
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    Midpoint va trapezoid orasidagi farq: {formatMetric(summary.midpoint - summary.trapezoid, 6)}
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    Simpson odatda eng barqaror estimate beradi: {formatMetric(summary.simpson, 6)}
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    Segmentlar soni ishlatilgani: {summary.segmentsUsed}
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    Method spread kichiklashsa, usullar o&apos;zaro yaqinlashadi va estimate ishonchliroq ko&apos;rinadi.
                                </div>
                            </div>
                        </div>

                        <div className="site-panel p-4 lg:p-5">
                            <div className="site-eyebrow">Why Client-Side</div>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                Bu modul client-side ishlaydi. Shuning uchun foydalanuvchi kiritgan har bir o&apos;zgarish serverga bormasdan darrov hisoblanadi va writer bridge bilan tez ulanadi.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
