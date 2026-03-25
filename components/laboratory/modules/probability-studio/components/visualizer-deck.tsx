import type React from "react";

import type { ProbabilityAnalysisResult, ProbabilityMatrix, ProbabilityMode, ProbabilitySeriesPoint, ProbabilitySummary } from "../types";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
    return (
        <div className="grid grid-cols-[96px_1fr_64px] items-center gap-3">
            <div className="truncate text-xs font-semibold text-muted-foreground">{label}</div>
            <div className="h-3 overflow-hidden rounded-full bg-muted/20">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(6, max ? (value / max) * 100 : 0)}%` }} />
            </div>
            <div className="text-right font-mono text-xs text-foreground">{value.toFixed(2)}</div>
        </div>
    );
}

export function VisualizerDeck({
    mode,
    result,
    summary,
}: {
    mode: ProbabilityMode;
    result: ProbabilityAnalysisResult;
    summary: ProbabilitySummary;
}) {
    const histogram = result.histogram ?? [];
    const scatter = result.scatterSeries ?? [];
    const fit = result.fitSeries ?? [];
    const lineSeries = result.lineSeries ?? [];
    const trail = result.monteCarloTrail ?? [];
    const cloud = result.monteCarloCloud ?? [];
    const secondary = result.secondaryLineSeries ?? result.forecastSeries ?? [];
    const tertiary = result.tertiaryLineSeries ?? [];
    const quaternary = result.quaternaryLineSeries ?? [];
    const max = Math.max(0, ...histogram.map((bin) => bin.count));

    const primaryVisual = (() => {
        if (mode === "descriptive" && histogram.length) {
            return histogram.map((bin) => <Bar key={bin.label} label={bin.label} value={bin.count} max={max} />);
        }
        if (mode === "distributions" && lineSeries.length) {
            return <LinePlot points={lineSeries} highlight={scatter[0]} />;
        }
        if (mode === "inference" && scatter.length) {
            return <CategoryPlot points={scatter} />;
        }
        if (mode === "regression" && scatter.length) {
            return <ScatterFitPlot scatter={scatter} fit={fit} />;
        }
        if (mode === "bayesian" && lineSeries.length) {
            return <LinePlot points={lineSeries} />;
        }
        if (mode === "multivariate" && result.matrix) {
            return <Heatmap matrix={result.matrix} />;
        }
        if (mode === "time-series" && lineSeries.length) {
            return <LinePlot points={lineSeries} secondary={secondary} tertiary={tertiary} quaternary={quaternary} />;
        }
        if (trail.length) {
            return <LinePlot points={trail} reference={{ label: "pi", value: Math.PI }} />;
        }
        return (
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                Visual data pending.
            </div>
        );
    })();

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Primary Visual</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                            {mode === "regression"
                                ? "Trend / fit preview"
                                : mode === "monte-carlo"
                                  ? "Simulation convergence preview"
                                  : mode === "bayesian"
                                    ? "Posterior density profile"
                                    : mode === "multivariate"
                                      ? "Correlation structure"
                                      : mode === "time-series"
                                        ? "Temporal drift and forecast"
                                        : "Distribution / sample profile"}
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{summary.shape ?? mode}</div>
                </div>
                <div className="mt-4 space-y-3">{primaryVisual}</div>
            </div>

            {mode === "multivariate" && scatter.length ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Paired Scatter</div>
                    <div className="mt-4">
                        <ScatterFitPlot scatter={scatter} fit={[]} />
                    </div>
                </div>
            ) : null}

            {mode === "monte-carlo" && cloud.length ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Monte Carlo Cloud</div>
                    <div className="mt-4">
                        <ScatterFitPlot scatter={cloud} fit={[]} />
                    </div>
                </div>
            ) : null}

            {mode === "time-series" && result.densitySeries?.length ? (
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">ACF / PACF</div>
                    <div className="mt-4">
                        <LinePlot points={result.densitySeries} secondary={result.monteCarloTrail ?? []} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function LinePlot({
    points,
    secondary,
    tertiary,
    quaternary,
    highlight,
    reference,
}: {
    points: ProbabilitySeriesPoint[];
    secondary?: ProbabilitySeriesPoint[];
    tertiary?: ProbabilitySeriesPoint[];
    quaternary?: ProbabilitySeriesPoint[];
    highlight?: ProbabilitySeriesPoint;
    reference?: { label: string; value: number };
}) {
    const width = 420;
    const height = 260;
    const allPoints = [...points, ...(secondary ?? []), ...(tertiary ?? []), ...(quaternary ?? []), ...(highlight ? [highlight] : [])];
    const xs = allPoints.map((point) => point.x);
    const ys = allPoints.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys, reference?.value ?? Number.POSITIVE_INFINITY);
    const maxY = Math.max(...ys, reference?.value ?? Number.NEGATIVE_INFINITY);
    const project = (point: ProbabilitySeriesPoint) => {
        const x = 20 + ((point.x - minX) / Math.max(maxX - minX, 1e-9)) * (width - 40);
        const y = height - 20 - ((point.y - minY) / Math.max(maxY - minY, 1e-9)) * (height - 40);
        return { x, y };
    };
    const referenceY =
        reference !== undefined
            ? height - 20 - ((reference.value - minY) / Math.max(maxY - minY, 1e-9)) * (height - 40)
            : null;
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full rounded-2xl border border-border/60 bg-background">
            {referenceY !== null ? <line x1="20" x2={String(width - 20)} y1={String(referenceY)} y2={String(referenceY)} strokeDasharray="6 6" className="stroke-orange-500/70" /> : null}
            {secondary?.length ? (
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                    points={secondary.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            ) : null}
            {tertiary?.length ? (
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-600 dark:text-emerald-400"
                    points={tertiary.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            ) : null}
            {quaternary?.length ? (
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-violet-600 dark:text-violet-400"
                    points={quaternary.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            ) : null}
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-accent"
                points={points.map((point) => {
                    const projected = project(point);
                    return `${projected.x},${projected.y}`;
                }).join(" ")}
            />
            {highlight ? (() => {
                const projected = project(highlight);
                return <circle cx={projected.x} cy={projected.y} r="5" className="fill-orange-500" />;
            })() : null}
        </svg>
    );
}

function CategoryPlot({ points }: { points: ProbabilitySeriesPoint[] }) {
    const maxY = Math.max(...points.map((point) => point.y), 0.01);
    return (
        <div className="space-y-3">
            {points.map((point, index) => (
                <Bar key={`${index}-${point.y}`} label={index === 0 ? "control" : "variant"} value={point.y * 100} max={maxY * 100} />
            ))}
        </div>
    );
}

function ScatterFitPlot({ scatter, fit }: { scatter: ProbabilitySeriesPoint[]; fit: ProbabilitySeriesPoint[] }) {
    const width = 420;
    const height = 260;
    const all = fit.length ? [...scatter, ...fit] : scatter;
    const minX = Math.min(...all.map((point) => point.x));
    const maxX = Math.max(...all.map((point) => point.x));
    const minY = Math.min(...all.map((point) => point.y));
    const maxY = Math.max(...all.map((point) => point.y));
    const project = (point: ProbabilitySeriesPoint) => {
        const x = 20 + ((point.x - minX) / Math.max(maxX - minX, 1e-9)) * (width - 40);
        const y = height - 20 - ((point.y - minY) / Math.max(maxY - minY, 1e-9)) * (height - 40);
        return { x, y };
    };
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full rounded-2xl border border-border/60 bg-background">
            {fit.length ? (
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-accent"
                    points={fit.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            ) : null}
            {scatter.map((point, index) => {
                const projected = project(point);
                return <circle key={`${index}-${point.x}-${point.y}`} cx={projected.x} cy={projected.y} r="4" className="fill-foreground" />;
            })}
        </svg>
    );
}

function Heatmap({ matrix }: { matrix: ProbabilityMatrix }) {
    const maxAbs = Math.max(...matrix.values.flat().map((value) => Math.abs(value)), 1e-9);
    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[260px] gap-2" style={{ gridTemplateColumns: `80px repeat(${matrix.columnLabels.length}, minmax(48px, 1fr))` }}>
                <div />
                {matrix.columnLabels.map((label) => (
                    <div key={`col-${label}`} className="text-center text-[11px] font-bold text-muted-foreground">
                        {label}
                    </div>
                ))}
                {matrix.values.map((row, rowIndex) => (
                    <FragmentRow key={matrix.rowLabels[rowIndex] ?? rowIndex}>
                        <div className="flex items-center text-[11px] font-bold text-muted-foreground">{matrix.rowLabels[rowIndex] ?? `r${rowIndex + 1}`}</div>
                        {row.map((value, columnIndex) => {
                            const alpha = Math.abs(value) / maxAbs;
                            const positive = value >= 0;
                            return (
                                <div
                                    key={`${rowIndex}-${columnIndex}`}
                                    className={`rounded-xl border px-2 py-3 text-center font-mono text-xs ${
                                        positive
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                            : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                    }`}
                                    style={{ opacity: 0.45 + alpha * 0.55 }}
                                >
                                    {value.toFixed(2)}
                                </div>
                            );
                        })}
                    </FragmentRow>
                ))}
            </div>
        </div>
    );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
