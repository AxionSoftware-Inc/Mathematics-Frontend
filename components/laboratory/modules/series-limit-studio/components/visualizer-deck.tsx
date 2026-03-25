import type { SeriesLimitAnalysisResult, SeriesLimitMode, SeriesLimitSeriesPoint, SeriesLimitSummary } from "../types";

export function VisualizerDeck({
    mode,
    result,
    summary,
}: {
    mode: SeriesLimitMode;
    result: SeriesLimitAnalysisResult;
    summary: SeriesLimitSummary;
}) {
    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Primary Visual</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                            {mode === "limits"
                                ? "Approach profile"
                                : mode === "sequences"
                                  ? "Sequence trajectory"
                                  : mode === "power-series"
                                    ? "Term / partial-sum profile"
                                    : "Term and partial-sum audit"}
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{summary.shape ?? mode}</div>
                </div>
                <div className="mt-4">
                    <LinePlot
                        points={result.lineSeries ?? []}
                        secondary={result.secondaryLineSeries ?? []}
                        tertiary={result.tertiaryLineSeries ?? []}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <MetricPanel
                    title="Visual Audit"
                    items={[
                        summary.candidateResult ?? "pending",
                        summary.convergenceSignal ?? summary.radiusSignal ?? "pending",
                        summary.partialSumSignal ?? summary.asymptoticSignal ?? "pending",
                    ]}
                />
                <MetricPanel
                    title="Structural Notes"
                    items={[
                        summary.dominantTerm ?? "pending",
                        summary.testFamily ?? "pending",
                        summary.secondaryTestFamily ?? "pending",
                        summary.asymptoticClass ?? "pending",
                        summary.proofSignal ?? "pending",
                        summary.endpointSignal ?? summary.boundedness ?? summary.riskSignal ?? "pending",
                    ]}
                />
            </div>
        </div>
    );
}

function MetricPanel({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{title}</div>
            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

function LinePlot({
    points,
    secondary,
    tertiary,
}: {
    points: SeriesLimitSeriesPoint[];
    secondary?: SeriesLimitSeriesPoint[];
    tertiary?: SeriesLimitSeriesPoint[];
}) {
    const width = 420;
    const height = 260;
    const all = [...points, ...(secondary ?? []), ...(tertiary ?? [])];
    if (!all.length) {
        return (
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                Visual preview pending.
            </div>
        );
    }
    const minX = Math.min(...all.map((point) => point.x));
    const maxX = Math.max(...all.map((point) => point.x));
    const minY = Math.min(...all.map((point) => point.y));
    const maxY = Math.max(...all.map((point) => point.y));
    const project = (point: SeriesLimitSeriesPoint) => {
        const x = 20 + ((point.x - minX) / Math.max(maxX - minX, 1e-9)) * (width - 40);
        const y = height - 20 - ((point.y - minY) / Math.max(maxY - minY, 1e-9)) * (height - 40);
        return { x, y };
    };
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full rounded-2xl border border-border/60 bg-background">
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
        </svg>
    );
}
