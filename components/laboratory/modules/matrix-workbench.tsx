"use client";

import React from "react";
import { Activity, Grid2x2, Rows3 } from "lucide-react";

import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { parseNumericMatrix, runMatrixOperation, summarizeMatrix, type MatrixOperation } from "@/components/laboratory/math-utils";
import { createBroadcastChannel, LIVE_WRITER_EXPORT_KEY, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const operations: { value: MatrixOperation; label: string }[] = [
    { value: "multiply", label: "A x B" },
    { value: "add", label: "A + B" },
    { value: "determinant", label: "det(A)" },
    { value: "inverse", label: "A^-1" },
];

const exportGuides = {
    copy: {
        badge: "Matrix export",
        title: "Matrix natijasini nusxa olish",
        description: "Natija markdown blok ko'rinishida clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "A, B va natija bo'yicha matrix summary tayyorlanadi.",
            "Asosiy o'lchamlar, determinant, trace va row/column sum yoziladi.",
            "Mavjud maqolangdagi kerakli joyga o'zing qo'yasan.",
        ],
        note: "Mavjud maqola ustida ishlayotgan bo'lsang, bu eng xavfsiz oqim.",
    },
    send: {
        badge: "Writer import",
        title: "Matrix natijasini writer'ga yuborish",
        description: "Natija yangi writer draft'iga import qilinadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Matrix eksport local storage'ga vaqtincha yoziladi.",
            "Writer yangi draft ochadi.",
            "Export maqola boshiga avtomatik qo'shiladi.",
        ],
        note: "Agar aynan ochiq writer blokiga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type MatrixBlockId = "setup" | "bridge" | "result";

const matrixNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Inputs, operation va heatmap" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
    { id: "result" as const, label: "Result", description: "Summary, result va insight" },
];

function formatMetric(value: number | null | undefined, digits = 4) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }

    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function MatrixTable({ matrix }: { matrix: number[][] }) {
    return (
        <div className="overflow-x-auto rounded-[1.25rem] border border-border">
            <table className="min-w-full border-collapse text-center text-sm">
                <tbody>
                    {matrix.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((value, columnIndex) => (
                                <td key={`${rowIndex}-${columnIndex}`} className="border border-border px-4 py-3 font-semibold">
                                    {Number(value.toFixed(4))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MatrixHeatmap({ matrix, title }: { matrix: number[][]; title: string }) {
    const values = matrix.flat();
    const maxAbsolute = Math.max(...values.map((value) => Math.abs(value)), 1);

    return (
        <div className="rounded-[1.25rem] border border-border bg-background/60 p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${matrix[0]?.length || 1}, minmax(0, 1fr))` }}>
                {matrix.flatMap((row, rowIndex) =>
                    row.map((value, columnIndex) => {
                        const intensity = Math.min(Math.abs(value) / maxAbsolute, 1);
                        const hue = value >= 0 ? "160, 84%, 39%" : "0, 84%, 60%";
                        return (
                            <div
                                key={`${title}-${rowIndex}-${columnIndex}`}
                                className="flex aspect-square items-center justify-center rounded-2xl border border-border/60 text-sm font-black"
                                style={{ backgroundColor: `hsla(${hue}, ${0.12 + intensity * 0.45})` }}
                            >
                                {formatMetric(value, 2)}
                            </div>
                        );
                    }),
                )}
            </div>
        </div>
    );
}

function MatrixSummaryCard({
    title,
    summary,
}: {
    title: string;
    summary: ReturnType<typeof summarizeMatrix>;
}) {
    return (
        <div className="rounded-[1.25rem] border border-border bg-background/60 p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Size</div>
                    <div className="mt-2 font-serif text-2xl font-black">{summary.rows} x {summary.columns}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Frobenius</div>
                    <div className="mt-2 font-serif text-2xl font-black">{formatMetric(summary.frobeniusNorm, 3)}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Trace</div>
                    <div className="mt-2 font-serif text-2xl font-black">{formatMetric(summary.trace, 3)}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Determinant</div>
                    <div className="mt-2 font-serif text-2xl font-black">{formatMetric(summary.determinant, 3)}</div>
                </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3 text-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Row sums</div>
                    <div className="mt-2">{summary.rowSums.map((value) => formatMetric(value, 2)).join(", ")}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/65 p-3 text-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Column sums</div>
                    <div className="mt-2">{summary.columnSums.map((value) => formatMetric(value, 2)).join(", ")}</div>
                </div>
            </div>
        </div>
    );
}

function BasisTransformPreview({ matrix, title }: { matrix: number[][]; title: string }) {
    if (matrix.length !== 2 || matrix[0]?.length !== 2) {
        return (
            <div className="rounded-[1.25rem] border border-border bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
                {title}: basis transform preview faqat 2x2 matritsa uchun ko&apos;rsatiladi.
            </div>
        );
    }

    const origin = { x: 140, y: 140 };
    const scale = 28;
    const e1 = { x: matrix[0][0] * scale, y: -matrix[1][0] * scale };
    const e2 = { x: matrix[0][1] * scale, y: -matrix[1][1] * scale };

    const line = (dx: number, dy: number, color: string, label: string) => (
        <g key={label}>
            <line x1={origin.x} y1={origin.y} x2={origin.x + dx} y2={origin.y + dy} stroke={color} strokeWidth="4" strokeLinecap="round" />
            <circle cx={origin.x + dx} cy={origin.y + dy} r="4" fill={color} />
            <text x={origin.x + dx + 6} y={origin.y + dy - 6} fill={color} fontSize="12" fontWeight="700">
                {label}
            </text>
        </g>
    );

    return (
        <div className="rounded-[1.25rem] border border-border bg-background/60 p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
            <svg viewBox="0 0 280 280" className="h-[280px] w-full">
                <rect x="18" y="18" width="244" height="244" rx="24" fill="transparent" stroke="currentColor" className="text-border" />
                <line x1="140" y1="30" x2="140" y2="250" stroke="currentColor" className="text-border" />
                <line x1="30" y1="140" x2="250" y2="140" stroke="currentColor" className="text-border" />
                {line(scale, 0, "#94a3b8", "e1")}
                {line(0, -scale, "#cbd5e1", "e2")}
                {line(e1.x, e1.y, "#2563eb", "A(e1)")}
                {line(e2.x, e2.y, "#f59e0b", "A(e2)")}
            </svg>
        </div>
    );
}

function buildMatrixMarkdown(params: {
    operation: MatrixOperation;
    matrixA: number[][];
    matrixB: number[] | number[][];
    result: NonNullable<ReturnType<typeof runMatrixOperation>>;
    summaryA: ReturnType<typeof summarizeMatrix>;
    summaryB: ReturnType<typeof summarizeMatrix>;
    summaryResult: ReturnType<typeof summarizeMatrix> | null;
}) {
    const { operation, matrixA, matrixB, result, summaryA, summaryB, summaryResult } = params;
    return `## Laboratory Export: Matrix Workbench

### Operation
- Type: \`${operation}\`
- Output: ${result.label}
- Note: ${result.note}

### Matrix A
- Size: ${summaryA.rows} x ${summaryA.columns}
- Trace: ${formatMetric(summaryA.trace, 4)}
- Determinant: ${formatMetric(summaryA.determinant, 4)}
- Frobenius norm: ${formatMetric(summaryA.frobeniusNorm, 4)}

### Matrix B
- Size: ${summaryB.rows} x ${summaryB.columns}
- Trace: ${formatMetric(summaryB.trace, 4)}
- Determinant: ${formatMetric(summaryB.determinant, 4)}
- Frobenius norm: ${formatMetric(summaryB.frobeniusNorm, 4)}

### Result
- ${result.scalar !== undefined ? `Scalar: ${formatMetric(result.scalar, 6)}` : `Matrix size: ${summaryResult?.rows ?? 0} x ${summaryResult?.columns ?? 0}`}

\`\`\`
A =
${matrixA.map((row) => row.join(" ")).join("\n")}
\`\`\`

\`\`\`
B =
${(matrixB as number[][]).map((row) => row.join(" ")).join("\n")}
\`\`\`

${result.matrix ? `\`\`\`\nResult =\n${result.matrix.map((row) => row.join(" ")).join("\n")}\n\`\`\`` : ""}
`;
}

function buildMatrixLivePayload(params: {
    targetId: string;
    operation: MatrixOperation;
    result: NonNullable<ReturnType<typeof runMatrixOperation>>;
    matrixA: number[][];
    matrixB: number[][];
    summaryA: ReturnType<typeof summarizeMatrix>;
    summaryB: ReturnType<typeof summarizeMatrix>;
    summaryResult: ReturnType<typeof summarizeMatrix> | null;
}): WriterBridgeBlockData {
    const { targetId, operation, result, matrixA, matrixB, summaryA, summaryB, summaryResult } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "matrix-workbench",
        kind: "matrix",
        title: `Matrix workbench: ${result.label}`,
        summary: "Laboratoriyadan live yuborilgan matrix hisoboti, summary va natija matritsasi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Operation", value: operation },
            { label: "A size", value: `${summaryA.rows} x ${summaryA.columns}` },
            { label: "B size", value: `${summaryB.rows} x ${summaryB.columns}` },
            { label: "Output", value: result.scalar !== undefined ? formatMetric(result.scalar, 4) : `${summaryResult?.rows ?? 0} x ${summaryResult?.columns ?? 0}` },
        ],
        notes: [
            result.note,
            `trace(A)=${formatMetric(summaryA.trace, 4)}, det(A)=${formatMetric(summaryA.determinant, 4)}`,
            `trace(B)=${formatMetric(summaryB.trace, 4)}, det(B)=${formatMetric(summaryB.determinant, 4)}`,
        ],
        matrixTables: [
            { label: "Matrix A", matrix: matrixA },
            { label: "Matrix B", matrix: matrixB },
            ...(result.matrix ? [{ label: result.label, matrix: result.matrix }] : []),
        ],
    };
}

export function MatrixWorkbenchModule({ module }: { module: LaboratoryModuleMeta }) {
    const [matrixAInput, setMatrixAInput] = React.useState(String(module.config?.defaultA || "2 1\n1 3"));
    const [matrixBInput, setMatrixBInput] = React.useState(String(module.config?.defaultB || "1 0\n4 2"));
    const [operation, setOperation] = React.useState<MatrixOperation>("multiply");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const notebook = useLaboratoryNotebook<MatrixBlockId>({
        storageKey: "mathsphere-lab-matrix-notebook",
        definitions: matrixNotebookBlocks,
        defaultBlocks: ["setup", "result"],
    });
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    let error = "";
    let matrixA: number[][] | null = null;
    let matrixB: number[][] | null = null;
    let result: ReturnType<typeof runMatrixOperation> | null = null;
    let summaryA: ReturnType<typeof summarizeMatrix> | null = null;
    let summaryB: ReturnType<typeof summarizeMatrix> | null = null;
    let summaryResult: ReturnType<typeof summarizeMatrix> | null = null;

    try {
        matrixA = parseNumericMatrix(matrixAInput);
        matrixB = parseNumericMatrix(matrixBInput);
        result = runMatrixOperation(matrixAInput, matrixBInput, operation);
        summaryA = summarizeMatrix(matrixA);
        summaryB = summarizeMatrix(matrixB);
        summaryResult = result.matrix ? summarizeMatrix(result.matrix) : null;
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : "Matritsa hisobida xato yuz berdi.";
    }

    async function copyMarkdownExport() {
        if (!matrixA || !matrixB || !result || !summaryA || !summaryB) {
            return;
        }

        await navigator.clipboard.writeText(
            buildMatrixMarkdown({
                operation,
                matrixA,
                matrixB,
                result,
                summaryA,
                summaryB,
                summaryResult,
            }),
        );
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (!matrixA || !matrixB || !result || !summaryA || !summaryB) {
            return;
        }

        window.localStorage.setItem(
            LIVE_WRITER_EXPORT_KEY,
            buildMatrixMarkdown({
                operation,
                matrixA,
                matrixB,
                result,
                summaryA,
                summaryB,
                summaryResult,
            }),
        );
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !matrixA || !matrixB || !result || !summaryA || !summaryB) {
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
            payload: buildMatrixLivePayload({
                targetId: selectedTarget.id,
                operation,
                result,
                matrixA,
                matrixB,
                summaryA,
                summaryB,
                summaryResult,
            }),
        };

        channel.postMessage(message);
        channel.close();
    }

    return (
        <div className="space-y-3">
            <LaboratoryNotebookToolbar
                title="Matrix Notebook"
                description="Setup, result va writer bridge bloklarini kerak bo'lsa ochib-yoping."
                activeBlocks={notebook.activeBlocks}
                definitions={matrixNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length ? (
                <LaboratoryNotebookEmptyState message="Matrix workbench katta bo'lsa ham faqat kerakli bo'limlar ko'rinadi." />
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4">
                    {notebook.hasBlock("setup") ? (
                    <div className="site-panel p-4 lg:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="site-eyebrow">Matrix Inputs</div>
                                <h2 className="mt-1 font-serif text-2xl font-black">Visual Matrix Workbench</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Matritsalarni faqat hisoblamaydi, balki ularning o&apos;lchami, energiyasi va 2x2 transformatsiyasini ham ko&apos;rsatadi.
                                </p>
                            </div>
                            <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                {operation}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <div>
                                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Matrix A</div>
                                <textarea
                                    value={matrixAInput}
                                    onChange={(event) => setMatrixAInput(event.target.value)}
                                    className="h-40 w-full rounded-[1.25rem] border border-border bg-transparent p-4 font-mono text-sm outline-none"
                                />
                            </div>
                            <div>
                                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Matrix B</div>
                                <textarea
                                    value={matrixBInput}
                                    onChange={(event) => setMatrixBInput(event.target.value)}
                                    className="h-40 w-full rounded-[1.25rem] border border-border bg-transparent p-4 font-mono text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {operations.map((item) => {
                                const active = item.value === operation;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setOperation(item.value)}
                                        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    ) : null}

                    {notebook.hasBlock("setup") && matrixA && matrixB && !error ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                            <MatrixHeatmap matrix={matrixA} title="Heatmap A" />
                            <MatrixHeatmap matrix={matrixB} title="Heatmap B" />
                        </div>
                    ) : null}
                </div>

                {notebook.hasBlock("bridge") ? (
                    <LaboratoryBridgeCard
                        ready={Boolean(matrixA && matrixB && result && !error)}
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

            {notebook.hasBlock("result") && result && matrixA && matrixB && summaryA && summaryB && !error ? (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="site-panel-strong p-4 lg:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow">Result</div>
                                    <h3 className="mt-1 font-serif text-3xl font-black">{result.label}</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.note}</p>
                                </div>
                                <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <Activity className="mr-2 inline h-3.5 w-3.5" />
                                    Live matrix diagnostics
                                </div>
                            </div>

                            {result.scalar !== undefined ? (
                                <div className="mt-4 rounded-[1.25rem] border border-border bg-background/60 p-6 text-center font-serif text-5xl font-black">
                                    {formatMetric(result.scalar, 6)}
                                </div>
                            ) : null}
                            {result.matrix ? <div className="mt-4"><MatrixTable matrix={result.matrix} /></div> : null}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <MatrixSummaryCard title="Summary A" summary={summaryA} />
                            <MatrixSummaryCard title="Summary B" summary={summaryB} />
                            {summaryResult ? <MatrixSummaryCard title="Summary Result" summary={summaryResult} /> : null}
                            {result.matrix ? <MatrixHeatmap matrix={result.matrix} title={result.label} /> : null}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <BasisTransformPreview matrix={matrixA} title="Basis transform of A" />
                        {result.matrix ? <BasisTransformPreview matrix={result.matrix} title={`Basis transform of ${result.label}`} /> : null}

                        <div className="site-panel p-4 lg:p-5">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                <Rows3 className="h-3.5 w-3.5" />
                                Matrix insight
                            </div>
                            <div className="mt-3 space-y-3">
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    A ning row sum&apos;lari: {summaryA.rowSums.map((value) => formatMetric(value, 2)).join(", ")}
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    B ning column sum&apos;lari: {summaryB.columnSums.map((value) => formatMetric(value, 2)).join(", ")}
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    2x2 holatda basis preview vectorlarni qanday cho&apos;zish yoki burishni darrov ko&apos;rsatadi.
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                                    Natijani writer&apos;ga markdown, yangi draft yoki live block sifatida yuborish standart bridge panel orqali ishlaydi.
                                </div>
                            </div>
                            <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <Grid2x2 className="h-3.5 w-3.5" />
                                Bu bridge pattern yangi laboratoriya modullarida ham qayta ishlatiladi.
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
