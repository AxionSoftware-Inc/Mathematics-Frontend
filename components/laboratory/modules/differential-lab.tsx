/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { solveDifferentialEquation } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, LIVE_WRITER_EXPORT_KEY, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type DifferentialBlockId = "setup" | "table" | "plot" | "bridge";

const differentialNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "IVP inputlari" },
    { id: "table" as const, label: "Table", description: "Trajectory snapshot" },
    { id: "plot" as const, label: "Plot", description: "Euler va Heun curves" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
];

const exportGuides = {
    copy: {
        badge: "Differential export",
        title: "Differential natijasini nusxa olish",
        description: "Euler va Heun trajectory hisobotini markdown bo'lib clipboard'ga ko'chiradi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Derivative, initial values, step va trajectory summary bitta hisobotga yig'iladi.",
            "Clipboard'dagi matnni kerakli maqola bo'limiga paste qilasan.",
            "Trajectory jadvalidagi boshlang'ich nuqtalar ham izoh sifatida birga ketadi.",
        ],
        note: "Maqola ichida joyni o'zing tanlamoqchi bo'lsang, shu oqim qulay.",
    },
    send: {
        badge: "Writer import",
        title: "Differential natijasini writer'ga yuborish",
        description: "Differential hisobotini yangi draft'ga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Differential hisobot local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Trajectory summary draft boshiga qo'shiladi.",
        ],
        note: "Mavjud writer ichidagi live block uchun Live Writer Bridge ishlatiladi.",
    },
} as const;

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }

    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildDifferentialMarkdown(params: {
    derivative: string;
    x0: string;
    y0: string;
    step: string;
    steps: string;
    points: ReturnType<typeof solveDifferentialEquation>;
}) {
    const { derivative, x0, y0, step, steps, points } = params;
    const preview = points.slice(0, 6).map((point) => `- x=${point.x}, Euler=${point.euler}, Heun=${point.heun}`).join("\n");
    return `## Laboratory Export: Differential Lab

### Initial Value Problem
- y' = ${derivative}
- x0 = ${x0}
- y0 = ${y0}
- step = ${step}
- steps = ${steps}

### Trajectory Preview
${preview}
`;
}

function buildDifferentialLivePayload(params: {
    targetId: string;
    derivative: string;
    x0: string;
    y0: string;
    step: string;
    steps: string;
    points: ReturnType<typeof solveDifferentialEquation>;
}): WriterBridgeBlockData {
    const { targetId, derivative, x0, y0, step, steps, points } = params;
    const last = points[points.length - 1];
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "differential-lab",
        kind: "differential",
        title: `Differential lab: y' = ${derivative}`,
        summary: "Laboratoriyadan live yuborilgan Euler va Heun trajectory hisoboti.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "x0", value: x0 },
            { label: "y0", value: y0 },
            { label: "Step", value: step },
            { label: "Final Heun", value: last ? formatMetric(last.heun, 6) : "--" },
        ],
        notes: [
            `Derivative: ${derivative}`,
            `Steps used: ${steps}`,
            ...(last ? [`Final point: x=${last.x}, Euler=${last.euler}, Heun=${last.heun}`] : []),
        ],
        plotSeries: [
            {
                label: "Euler",
                color: "#2563eb",
                points: points.map((point) => ({ x: point.x, y: point.euler })),
            },
            {
                label: "Heun",
                color: "#f59e0b",
                points: points.map((point) => ({ x: point.x, y: point.heun })),
            },
        ],
    };
}

export function DifferentialLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [derivative, setDerivative] = React.useState(String(module.config?.defaultDerivative || "x - y"));
    const [x0, setX0] = React.useState(String(module.config?.defaultX0 || 0));
    const [y0, setY0] = React.useState(String(module.config?.defaultY0 || 1));
    const [step, setStep] = React.useState(String(module.config?.defaultStep || 0.2));
    const [steps, setSteps] = React.useState(String(module.config?.defaultSteps || 20));
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const notebook = useLaboratoryNotebook<DifferentialBlockId>({
        storageKey: "mathsphere-lab-differential-notebook",
        definitions: differentialNotebookBlocks,
        defaultBlocks: ["setup", "plot"],
    });
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    let error = "";
    let points: ReturnType<typeof solveDifferentialEquation> = [];

    try {
        points = solveDifferentialEquation(derivative, Number(x0), Number(y0), Number(step), Number(steps));
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : "Differensial hisobida xato yuz berdi.";
    }

    async function copyMarkdownExport() {
        if (!points.length || error) {
            return;
        }

        await navigator.clipboard.writeText(buildDifferentialMarkdown({ derivative, x0, y0, step, steps, points }));
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (!points.length || error) {
            return;
        }

        window.localStorage.setItem(LIVE_WRITER_EXPORT_KEY, buildDifferentialMarkdown({ derivative, x0, y0, step, steps, points }));
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !points.length || error) {
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
            payload: buildDifferentialLivePayload({
                targetId: selectedTarget.id,
                derivative,
                x0,
                y0,
                step,
                steps,
                points,
            }),
        };

        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3">
            <LaboratoryNotebookToolbar
                title="Differential Notebook"
                description="IVP setup, trajectory table va plot bloklarini alohida boshqaring."
                activeBlocks={notebook.activeBlocks}
                definitions={differentialNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length ? (
                <LaboratoryNotebookEmptyState message="Differential modul ham block-based workspace bo'ldi." />
            ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
                {notebook.hasBlock("setup") ? (
                <div className="site-panel p-6">
                    <div className="site-eyebrow">Initial Value Problem</div>
                    <input
                        value={derivative}
                        onChange={(event) => setDerivative(event.target.value)}
                        className="mt-4 h-12 w-full rounded-full border border-border bg-transparent px-5 text-sm outline-none"
                    />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {[
                            { label: "x0", value: x0, setValue: setX0 },
                            { label: "y0", value: y0, setValue: setY0 },
                            { label: "Step", value: step, setValue: setStep },
                            { label: "Steps", value: steps, setValue: setSteps },
                        ].map((field) => (
                            <div key={field.label}>
                                <div className="text-sm font-semibold text-muted-foreground">{field.label}</div>
                                <input
                                    value={field.value}
                                    onChange={(event) => field.setValue(event.target.value)}
                                    className="mt-2 h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                ) : null}

                {notebook.hasBlock("table") ? (
                <div className="site-panel-strong p-6">
                    <div className="site-eyebrow">Trajectory Snapshot</div>
                    <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-border">
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-border bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3">x</th>
                                    <th className="px-4 py-3">Euler</th>
                                    <th className="px-4 py-3">Heun</th>
                                </tr>
                            </thead>
                            <tbody>
                                {points.slice(0, 8).map((point) => (
                                    <tr key={point.x} className="border-b border-border last:border-b-0">
                                        <td className="px-4 py-3">{point.x}</td>
                                        <td className="px-4 py-3">{point.euler}</td>
                                        <td className="px-4 py-3">{point.heun}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                ) : null}
            </div>

            <div className="space-y-6">
                {notebook.hasBlock("plot") ? (
                <div className="site-panel p-6">
                    <div className="site-eyebrow">Solution Curves</div>
                    {error ? <div className="mt-4 rounded-[1.25rem] border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}
                    {!!points.length ? (
                        <div className="mt-4">
                            <CartesianPlot
                                series={[
                                    {
                                        label: "Euler",
                                        color: "#2563eb",
                                        points: points.map((point) => ({ x: point.x, y: point.euler })),
                                    },
                                    {
                                        label: "Heun",
                                        color: "#f59e0b",
                                        points: points.map((point) => ({ x: point.x, y: point.heun })),
                                    },
                                ]}
                            />
                        </div>
                    ) : null}
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Shu modul keyinroq server-side symbolic solverga ko'chirilishi mumkin, lekin hozir interaktivlik uchun client-side juda to'g'ri.
                    </p>
                </div>
                ) : null}

                {notebook.hasBlock("bridge") ? (
                    <LaboratoryBridgeCard
                        ready={Boolean(points.length && !error)}
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
        </div>
        </div>
    );
}
