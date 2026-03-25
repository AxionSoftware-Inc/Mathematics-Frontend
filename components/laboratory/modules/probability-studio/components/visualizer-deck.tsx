import type { ProbabilityAnalysisResult, ProbabilityMode, ProbabilitySeriesPoint, ProbabilitySummary } from "../types";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
    return (
        <div className="grid grid-cols-[72px_1fr_64px] items-center gap-3">
            <div className="text-xs font-semibold text-muted-foreground">{label}</div>
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
    const max = Math.max(0, ...histogram.map((bin) => bin.count));

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Primary Visual</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                            {mode === "regression" ? "Trend / fit preview" : mode === "monte-carlo" ? "Simulation convergence preview" : "Distribution / sample profile"}
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{summary.shape ?? mode}</div>
                </div>
                <div className="mt-4 space-y-3">
                    {mode === "descriptive" && histogram.length ? (
                        histogram.map((bin) => <Bar key={bin.label} label={bin.label} value={bin.count} max={max} />)
                    ) : mode === "distributions" && lineSeries.length ? (
                        <LinePlot points={lineSeries} highlight={scatter[0]} />
                    ) : mode === "inference" && scatter.length ? (
                        <CategoryPlot points={scatter} />
                    ) : mode === "regression" && scatter.length ? (
                        <ScatterFitPlot scatter={scatter} fit={fit} />
                    ) : trail.length ? (
                        <LinePlot points={trail} />
                    ) : (
                        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                            Visual data pending.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LinePlot({ points, highlight }: { points: ProbabilitySeriesPoint[]; highlight?: ProbabilitySeriesPoint }) {
    const width = 420;
    const height = 260;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const project = (point: ProbabilitySeriesPoint) => {
        const x = 20 + ((point.x - minX) / Math.max(maxX - minX, 1e-9)) * (width - 40);
        const y = height - 20 - ((point.y - minY) / Math.max(maxY - minY, 1e-9)) * (height - 40);
        return `${x},${y}`;
    };
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full rounded-2xl border border-border/60 bg-background">
            <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" points={points.map(project).join(" ")} />
            {highlight ? <circle cx={project(highlight).split(",")[0]} cy={project(highlight).split(",")[1]} r="5" className="fill-orange-500" /> : null}
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
    const all = [...scatter, ...fit];
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
            {scatter.map((point, index) => {
                const projected = project(point);
                return <circle key={`${index}-${point.x}-${point.y}`} cx={projected.x} cy={projected.y} r="4" className="fill-foreground" />;
            })}
        </svg>
    );
}
