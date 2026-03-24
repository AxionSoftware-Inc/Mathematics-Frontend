import { useEffect, useMemo, useRef } from "react";

import type { MatrixAnalyticSolveResponse, MatrixComputationSummary, MatrixMode } from "../types";

type VisualizerDeckProps = {
    mode: MatrixMode;
    matrixRows: string[][];
    rhsRows: string[];
    tensorSlices: string[][][];
    summary: MatrixComputationSummary;
    analyticSolution: MatrixAnalyticSolveResponse | null;
};

function toNumeric(rows: string[][]): number[][] {
    return rows.map((row) =>
        row.map((entry) => {
            const value = Number(entry);
            return Number.isFinite(value) ? value : 0;
        }),
    );
}

function cellTone(value: number, maxAbs: number): string {
    if (!maxAbs) {
        return "rgba(148, 163, 184, 0.16)";
    }
    const ratio = Math.min(Math.abs(value) / maxAbs, 1);
    return value >= 0 ? `rgba(14, 165, 233, ${0.12 + ratio * 0.5})` : `rgba(248, 113, 113, ${0.12 + ratio * 0.5})`;
}

function parseSparseRatio(summary: MatrixComputationSummary): number | null {
    if (!summary.sparseSummary) {
        return null;
    }
    const match = summary.sparseSummary.match(/(\d+(?:\.\d+)?)%/);
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
}

function TransformCanvas({ matrix, rhsRows }: { matrix: number[][]; rhsRows: string[] }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || matrix.length < 2 || matrix[0]?.length < 2) {
            return;
        }

        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 52;
        const vector = rhsRows.length >= 2 ? [Number(rhsRows[0]) || 1, Number(rhsRows[1]) || 1] : [1, 1];
        const transformed = [
            matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
            matrix[1][0] * vector[0] + matrix[1][1] * vector[1],
        ];

        const toCanvas = ([x, y]: [number, number]) => [centerX + x * scale, centerY - y * scale] as const;

        context.clearRect(0, 0, width, height);
        context.fillStyle = "#fafaf9";
        context.fillRect(0, 0, width, height);

        context.strokeStyle = "rgba(148, 163, 184, 0.55)";
        context.lineWidth = 1;
        for (let index = -4; index <= 4; index += 1) {
            const x = centerX + index * scale;
            const y = centerY + index * scale;
            context.beginPath();
            context.moveTo(x, 20);
            context.lineTo(x, height - 20);
            context.stroke();
            context.beginPath();
            context.moveTo(20, y);
            context.lineTo(width - 20, y);
            context.stroke();
        }

        context.strokeStyle = "rgba(15, 23, 42, 0.7)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(20, centerY);
        context.lineTo(width - 20, centerY);
        context.stroke();
        context.beginPath();
        context.moveTo(centerX, 20);
        context.lineTo(centerX, height - 20);
        context.stroke();

        const transformedSquare: [number, number][] = [
            [0, 0],
            [matrix[0][0], matrix[1][0]],
            [matrix[0][0] + matrix[0][1], matrix[1][0] + matrix[1][1]],
            [matrix[0][1], matrix[1][1]],
        ];

        context.fillStyle = "rgba(14, 165, 233, 0.18)";
        context.strokeStyle = "rgba(14, 165, 233, 0.9)";
        context.lineWidth = 2;
        context.beginPath();
        transformedSquare.forEach((point, index) => {
            const [x, y] = toCanvas(point);
            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });
        const [startX, startY] = toCanvas(transformedSquare[0]);
        context.lineTo(startX, startY);
        context.fill();
        context.stroke();

        const drawVector = (vectorPoint: [number, number], stroke: string) => {
            const [x, y] = toCanvas(vectorPoint);
            context.strokeStyle = stroke;
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.lineTo(x, y);
            context.stroke();
        };

        drawVector([vector[0], vector[1]], "rgba(15, 23, 42, 0.9)");
        drawVector([transformed[0], transformed[1]], "rgba(234, 88, 12, 0.92)");
    }, [matrix, rhsRows]);

    return (
        <div className="rounded-3xl border border-border/60 bg-muted/10 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Transform Preview</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">Probe vector and transformed unit square</div>
                </div>
                <div className="text-xs text-muted-foreground">2D affine intuition</div>
            </div>
            <canvas ref={canvasRef} width={420} height={300} className="mt-4 h-[300px] w-full rounded-2xl border border-border/60 bg-background" />
        </div>
    );
}

function TensorNetworkCanvas({
    shape,
    contractions,
    hasModeProduct,
}: {
    shape: string | null | undefined;
    contractions: string[];
    hasModeProduct: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#fafaf9";
        context.fillRect(0, 0, width, height);

        const center = { x: width / 2, y: height / 2 };
        const tensorColor = "rgba(15, 23, 42, 0.92)";
        const accent = "rgba(14, 165, 233, 0.92)";
        const warn = "rgba(249, 115, 22, 0.92)";

        const drawNode = (x: number, y: number, label: string, fill: string) => {
            context.fillStyle = fill;
            context.strokeStyle = "rgba(148, 163, 184, 0.5)";
            context.lineWidth = 2;
            context.beginPath();
            context.roundRect(x - 44, y - 18, 88, 36, 14);
            context.fill();
            context.stroke();
            context.fillStyle = "#f8fafc";
            context.font = "bold 12px Segoe UI";
            context.textAlign = "center";
            context.fillText(label, x, y + 4);
        };

        const drawEdge = (x1: number, y1: number, x2: number, y2: number, label: string, color: string) => {
            context.strokeStyle = color;
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            context.fillStyle = "rgba(15, 23, 42, 0.75)";
            context.font = "11px Segoe UI";
            context.textAlign = "center";
            context.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 8);
        };

        drawNode(center.x, center.y, shape ? `T ${shape}` : "Tensor", tensorColor);

        const modeNodes = [
            { x: center.x, y: 54, label: "mode-1" },
            { x: width - 84, y: center.y, label: "mode-2" },
            { x: center.x, y: height - 54, label: "mode-3" },
        ];
        modeNodes.forEach((node) => {
            drawNode(node.x, node.y, node.label, accent);
            drawEdge(center.x, center.y, node.x, node.y, node.label, accent);
        });

        contractions.forEach((label, index) => {
            const x = 86 + index * 122;
            const y = height - 26;
            drawNode(x, y, label.replace(" -> ", " "), warn);
            drawEdge(center.x, center.y + 18, x, y - 18, "contract", warn);
        });

        if (hasModeProduct) {
            drawNode(width - 92, 54, "mode-n product", warn);
            drawEdge(center.x + 30, center.y - 18, width - 92, 54, "operator", warn);
        }
    }, [contractions, hasModeProduct, shape]);

    return <canvas ref={canvasRef} width={540} height={260} className="h-[260px] w-full rounded-2xl border border-border/60 bg-background" />;
}

export function VisualizerDeck({ mode, matrixRows, rhsRows, tensorSlices, summary, analyticSolution }: VisualizerDeckProps) {
    const numeric = useMemo(() => toNumeric(matrixRows), [matrixRows]);
    const tensorNumeric = useMemo(() => tensorSlices.map((slice) => toNumeric(slice)), [tensorSlices]);
    const maxAbs = useMemo(
        () => Math.max(0, ...numeric.flat().map((value) => Math.abs(value))),
        [numeric],
    );
    const tensorMaxAbs = useMemo(
        () => Math.max(0, ...tensorNumeric.flat(2).map((value) => Math.abs(value))),
        [tensorNumeric],
    );
    const sparseRatio = parseSparseRatio(summary);
    const singularValues = summary.singularValueMagnitudes ?? [];
    const maxSingular = Math.max(0, ...singularValues);
    const showTransform = mode === "transform" && numeric.length === 2 && numeric[0]?.length === 2;
    const operationSteps = analyticSolution?.exact.steps?.filter((step) =>
        /row|echelon|rref|solve|factor|spectrum|transform/i.test(step.title),
    ) ?? [];
    const sliceNorms = summary.tensorSliceNorms ?? [];
    const maxSliceNorm = Math.max(0, ...sliceNorms);
    const modeSpectra = summary.modeSingularSummaries ?? [];
    const blockNorms = summary.tensorBlockNorms ?? [];
    const maxBlockNorm = Math.max(0, ...blockNorms);
    const contractionLabels = summary.contractionDetails ?? [];

    return (
        <div className="space-y-4">
            {showTransform ? <TransformCanvas matrix={numeric} rhsRows={rhsRows} /> : null}

            <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Matrix Heatmap</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">Signed intensity of the active matrix coefficients</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {summary.shape ?? `${matrixRows.length}x${matrixRows[0]?.length ?? 0}`}
                    </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${Math.max(matrixRows[0]?.length ?? 1, 1)}, minmax(64px, 1fr))` }}
                    >
                        {numeric.flatMap((row, rowIndex) =>
                            row.map((value, columnIndex) => (
                                <div
                                    key={`${rowIndex}-${columnIndex}`}
                                    className="rounded-2xl border border-border/50 px-3 py-4 text-center font-mono text-sm font-semibold text-foreground"
                                    style={{ backgroundColor: cellTone(value, maxAbs) }}
                                >
                                    {matrixRows[rowIndex]?.[columnIndex] ?? value.toFixed(2)}
                                </div>
                            )),
                        )}
                    </div>
                </div>
            </div>

            {mode === "tensor" ? (
                <div className="space-y-4">
                    <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Slices</div>
                                <div className="mt-1 text-sm font-semibold text-foreground">Frontal slice heatmaps for rank-3 tensor input</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{summary.tensorShape ?? `${tensorSlices.length} slices`}</div>
                        </div>
                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                            {tensorNumeric.slice(0, 3).map((slice, sliceIndex) => (
                                <div key={`slice-${sliceIndex}`} className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Slice {sliceIndex + 1}</div>
                                    <div
                                        className="mt-3 grid gap-1"
                                        style={{ gridTemplateColumns: `repeat(${Math.max(slice[0]?.length ?? 1, 1)}, minmax(24px, 1fr))` }}
                                    >
                                        {slice.flatMap((row, rowIndex) =>
                                            row.map((value, columnIndex) => (
                                                <div
                                                    key={`tensor-${sliceIndex}-${rowIndex}-${columnIndex}`}
                                                    className="rounded-lg border border-border/40 px-2 py-3 text-center font-mono text-xs font-semibold text-foreground"
                                                    style={{ backgroundColor: cellTone(value, tensorMaxAbs) }}
                                                >
                                                    {tensorSlices[sliceIndex]?.[rowIndex]?.[columnIndex] ?? value.toFixed(2)}
                                                </div>
                                            )),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Slice Energy</div>
                            {sliceNorms.length ? (
                                <div className="mt-4 space-y-3">
                                    {sliceNorms.map((value, index) => (
                                        <div key={`${index}-${value}`} className="grid grid-cols-[56px_1fr_72px] items-center gap-3">
                                            <div className="text-xs font-semibold text-muted-foreground">slice {index + 1}</div>
                                            <div className="h-3 overflow-hidden rounded-full bg-muted/20">
                                                <div
                                                    className="h-full rounded-full bg-accent"
                                                    style={{ width: `${Math.max(6, maxSliceNorm ? (value / maxSliceNorm) * 100 : 0)}%` }}
                                                />
                                            </div>
                                            <div className="text-right font-mono text-xs text-foreground">{value.toFixed(4)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-3 text-sm text-muted-foreground">Slice norms tensor audit kelganda shu yerda ko‘rinadi.</div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Structural Audit</div>
                            <div className="mt-4 space-y-3">
                                {[
                                    summary.tensorProductSummary,
                                    summary.tuckerSummary,
                                    summary.cpSummary,
                                    summary.tensorEigenSummary,
                                ]
                                    .filter(Boolean)
                                    .map((item) => (
                                        <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                            {item}
                                        </div>
                                    ))}
                                {!summary.tensorProductSummary && !summary.tuckerSummary && !summary.cpSummary && !summary.tensorEigenSummary ? (
                                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                                        Tensor structural summaries solve natijasi bilan shu yerda ko‘rinadi.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Mode Spectra</div>
                            <div className="mt-4 space-y-3">
                                {modeSpectra.length ? (
                                    modeSpectra.map((line) => (
                                        <div key={line} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm font-semibold text-foreground">
                                            {line}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                                        Mode unfolding singular summaries shu yerda ko‘rinadi.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Contraction Lanes</div>
                            <div className="mt-4 space-y-3">
                                {summary.contractionDetails?.length ? (
                                    summary.contractionDetails.map((line) => (
                                        <div key={line} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm font-semibold text-foreground">
                                            {line}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                                        Probe vector mos bo‘lsa mode contractionlar shu yerda ko‘rinadi.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Tensor Network View</div>
                                <div className="mt-1 text-sm font-semibold text-foreground">Mode edges, contraction hooks and operator lane</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{summary.tensorOrder ? `order ${summary.tensorOrder}` : "tensor"}</div>
                        </div>
                        <div className="mt-4">
                            <TensorNetworkCanvas
                                shape={summary.tensorShape}
                                contractions={contractionLabels}
                                hasModeProduct={Boolean(summary.contractionDetails?.some((item) => item.includes("Mode-4 product") || item.includes("Mode-") && item.includes("product")))}
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Higher-Order Blocks</div>
                        {blockNorms.length ? (
                            <div className="mt-4 space-y-3">
                                {blockNorms.map((value, index) => (
                                    <div key={`${index}-${value}`} className="grid grid-cols-[64px_1fr_72px] items-center gap-3">
                                        <div className="text-xs font-semibold text-muted-foreground">block {index + 1}</div>
                                        <div className="h-3 overflow-hidden rounded-full bg-muted/20">
                                            <div
                                                className="h-full rounded-full bg-accent"
                                                style={{ width: `${Math.max(6, maxBlockNorm ? (value / maxBlockNorm) * 100 : 0)}%` }}
                                            />
                                        </div>
                                        <div className="text-right font-mono text-xs text-foreground">{value.toFixed(4)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                                Higher-order block energy faqat `###` bilan berilgan tensorlarda ko‘rinadi.
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Pivot Structure</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {summary.pivotColumns?.length ? (
                            summary.pivotColumns.map((pivot) => (
                                <div key={pivot} className="rounded-full border border-border/60 bg-muted/15 px-3 py-1.5 text-xs font-semibold text-foreground">
                                    Pivot c{pivot + 1}
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground">Pivot structure not reported for this lane.</div>
                        )}
                    </div>
                    {summary.conditionNumber ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            Condition number: <span className="font-semibold">{summary.conditionNumber}</span>
                        </div>
                    ) : null}
                </div>

                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Sparse Profile</div>
                    {sparseRatio !== null ? (
                        <>
                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted/20">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, Math.min(sparseRatio, 100))}%` }} />
                            </div>
                            <div className="mt-3 text-sm font-semibold text-foreground">{summary.sparseSummary}</div>
                        </>
                    ) : (
                        <div className="mt-3 text-sm text-muted-foreground">Sparse density summary appears when a solver lane reports matrix sparsity.</div>
                    )}
                    {summary.iterativeSummary ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            Iterative lane: <span className="font-semibold">{summary.iterativeSummary}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Sparsity Pattern</div>
                    <div className="mt-4 overflow-x-auto">
                        <div
                            className="grid gap-1"
                            style={{ gridTemplateColumns: `repeat(${Math.max(matrixRows[0]?.length ?? 1, 1)}, minmax(18px, 1fr))` }}
                        >
                            {numeric.flatMap((row, rowIndex) =>
                                row.map((value, columnIndex) => (
                                    <div
                                        key={`pattern-${rowIndex}-${columnIndex}`}
                                        className={`h-5 rounded-md border border-border/40 ${value === 0 ? "bg-muted/10" : "bg-accent/80"}`}
                                        title={`r${rowIndex + 1} c${columnIndex + 1}`}
                                    />
                                )),
                            )}
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        Non-zero structure matrix zichligi va sparse-friendly zonalarni ko‘rsatadi.
                    </div>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Operation Trace</div>
                            <div className="mt-1 text-sm font-semibold text-foreground">Elimination, factorization yoki transform oqimi</div>
                        </div>
                        {summary.diagonalizable != null ? (
                            <div className="text-xs text-muted-foreground">
                                Diagonalizable: {summary.diagonalizable ? "yes" : "no"}
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-4 space-y-3">
                        {operationSteps.length ? (
                            operationSteps.slice(0, 5).map((step, index) => (
                                <div key={`${step.title}-${index}`} className="grid grid-cols-[28px_1fr] gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-muted/15 text-xs font-black text-foreground">
                                        {index + 1}
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                                        <div className="text-sm font-bold text-foreground">{step.title}</div>
                                        <div className="mt-1 text-xs leading-5 text-muted-foreground">{step.summary}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                                Trace preview analytic solve tayyor bo‘lganda shu yerda ko‘rinadi.
                            </div>
                        )}
                        {summary.decompositionSummary ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                                Decomposition lane: <span className="font-semibold">{summary.decompositionSummary}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Singular Spectrum</div>
                            <div className="mt-1 text-sm font-semibold text-foreground">Relative magnitude of singular values</div>
                        </div>
                        {summary.svdSummary ? <div className="text-xs text-muted-foreground">{summary.svdSummary}</div> : null}
                    </div>
                    {singularValues.length ? (
                        <div className="mt-4 space-y-3">
                            {singularValues.map((value, index) => (
                                <div key={`${index}-${value}`} className="grid grid-cols-[56px_1fr_72px] items-center gap-3">
                                    <div className="text-xs font-semibold text-muted-foreground">s{index + 1}</div>
                                    <div className="h-3 overflow-hidden rounded-full bg-muted/20">
                                        <div
                                            className="h-full rounded-full bg-accent"
                                            style={{ width: `${Math.max(6, maxSingular ? (value / maxSingular) * 100 : 0)}%` }}
                                        />
                                    </div>
                                    <div className="text-right font-mono text-xs text-foreground">{value.toFixed(4)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-muted-foreground">Singular values appear when decomposition audit is available.</div>
                    )}
                </div>

                <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Residual / Stability</div>
                    <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            Residual norm: <span className="font-semibold">{summary.residualNorm ?? "Not reported"}</span>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            Spectral radius: <span className="font-semibold">{summary.spectralRadius ?? "Not reported"}</span>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                            Solver lane: <span className="font-semibold">{summary.solverKind ?? "Direct"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
