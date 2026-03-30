"use client";

import * as React from "react";

import type { SeriesLimitAnalysisResult, SeriesLimitMode, SeriesLimitSeriesPoint, SeriesLimitSummary } from "../types";

type PlotSeries = {
    label: string;
    points: SeriesLimitSeriesPoint[];
    tone: string;
    swatch: string;
    strokeWidth: number;
};

type Domain = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};

export function VisualizerDeck({
    mode,
    dimension,
    result,
    summary,
}: {
    mode: SeriesLimitMode;
    dimension: string;
    result: SeriesLimitAnalysisResult;
    summary: SeriesLimitSummary;
}) {
    const mainTitle =
        mode === "limits"
            ? "Approach atlas"
            : mode === "sequences"
              ? "Tail geometry"
              : mode === "power-series"
                ? "Coefficient and partial-sum lab"
                : "Convergence research canvas";

    const series: PlotSeries[] = (
        mode === "limits"
            ? [
                  { label: "Approach path", points: result.lineSeries ?? [], tone: "text-accent", swatch: "bg-accent", strokeWidth: 3 },
                  { label: dimension === "one-sided" ? "Left branch" : "One-sided track", points: result.secondaryLineSeries ?? [], tone: "text-sky-600 dark:text-sky-400", swatch: "bg-sky-500", strokeWidth: 2 },
                  { label: dimension === "one-sided" ? "Right branch" : "|f(x)| envelope", points: result.tertiaryLineSeries ?? [], tone: "text-emerald-600 dark:text-emerald-400", swatch: "bg-emerald-500", strokeWidth: 2 },
                  { label: "Oscillation envelope", points: result.quaternaryLineSeries ?? [], tone: "text-fuchsia-600 dark:text-fuchsia-400", swatch: "bg-fuchsia-500", strokeWidth: 2 },
              ]
            : [
                  { label: "Terms", points: result.lineSeries ?? [], tone: "text-accent", swatch: "bg-accent", strokeWidth: 3 },
                  { label: mode === "convergence" ? "Test / ratio track" : "Secondary track", points: result.secondaryLineSeries ?? [], tone: "text-sky-600 dark:text-sky-400", swatch: "bg-sky-500", strokeWidth: 2 },
                  { label: "|Terms| / envelope", points: result.tertiaryLineSeries ?? [], tone: "text-emerald-600 dark:text-emerald-400", swatch: "bg-emerald-500", strokeWidth: 2 },
                  { label: "Radius / endpoint track", points: result.quaternaryLineSeries ?? [], tone: "text-fuchsia-600 dark:text-fuchsia-400", swatch: "bg-fuchsia-500", strokeWidth: 2 },
              ]
    ).filter((entry) => entry.points.length);

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Primary Visual</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">{mainTitle}</div>
                    </div>
                    <div className="rounded-full border border-border/60 bg-muted/10 px-3 py-1 text-xs text-muted-foreground">
                        {summary.shape ?? mode}
                    </div>
                </div>
                <div className="mt-4">
                    <ResearchPlot mode={mode} series={series} summary={summary} />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <MetricPanel
                    title={mode === "power-series" ? "Radius / Endpoint Audit" : mode === "convergence" ? "Test Audit" : "Visual Audit"}
                    items={compactItems([
                        summary.candidateResult ?? "pending",
                        summary.convergenceSignal ?? summary.radiusSignal ?? "pending",
                        summary.partialSumSignal ?? summary.asymptoticSignal ?? "pending",
                        summary.expansionSignal ?? "expansion pending",
                    ])}
                />
                <MetricPanel
                    title="Structural Notes"
                    items={compactItems([
                        summary.dominantTerm ?? "pending",
                        summary.testFamily ?? "pending",
                        summary.secondaryTestFamily ?? "pending",
                        summary.asymptoticClass ?? "pending",
                        summary.proofSignal ?? "pending",
                        summary.endpointSignal ?? summary.boundedness ?? summary.riskSignal ?? "pending",
                    ])}
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

function ResearchPlot({ mode, series, summary }: { mode: SeriesLimitMode; series: PlotSeries[]; summary: SeriesLimitSummary }) {
    const width = 760;
    const height = 320;
    const padding = { top: 22, right: 18, bottom: 30, left: 52 };
    const all = series.flatMap((entry) => entry.points);

    const baseDomain = React.useMemo<Domain | null>(() => {
        if (!all.length) return null;
        const xs = all.map((point) => point.x);
        const ys = all.map((point) => point.y);
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
        };
    }, [all]);

    const [domain, setDomain] = React.useState<Domain | null>(baseDomain);
    const dragState = React.useRef<{ x: number; y: number } | null>(null);

    React.useEffect(() => {
        setDomain(baseDomain);
    }, [baseDomain]);

    if (!baseDomain || !domain) {
        return (
            <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                Visual preview pending.
            </div>
        );
    }

    const clampDomain = (next: Domain): Domain => {
        const minWidth = Math.max((baseDomain.maxX - baseDomain.minX) * 0.08, 1e-6);
        const minHeight = Math.max((baseDomain.maxY - baseDomain.minY) * 0.08, 1e-6);
        const widthSpan = Math.max(next.maxX - next.minX, minWidth);
        const heightSpan = Math.max(next.maxY - next.minY, minHeight);
        return {
            minX: next.minX,
            maxX: next.minX + widthSpan,
            minY: next.minY,
            maxY: next.minY + heightSpan,
        };
    };

    const project = (point: SeriesLimitSeriesPoint) => ({
        x: padding.left + ((point.x - domain.minX) / Math.max(domain.maxX - domain.minX, 1e-9)) * (width - padding.left - padding.right),
        y: height - padding.bottom - ((point.y - domain.minY) / Math.max(domain.maxY - domain.minY, 1e-9)) * (height - padding.top - padding.bottom),
    });

    const gridX = Array.from({ length: 6 }, (_, idx) => padding.left + (idx / 5) * (width - padding.left - padding.right));
    const gridY = Array.from({ length: 5 }, (_, idx) => padding.top + (idx / 4) * (height - padding.top - padding.bottom));
    const phaseSeries = series[0]?.points.slice(1).map((point, index) => ({
        x: series[0]?.points[index]?.y ?? point.y,
        y: point.y,
    })) ?? [];
    const energySeries = buildEnergySeries(series[0]?.points ?? [], series[1]?.points ?? []);

    const onWheel: React.WheelEventHandler<SVGSVGElement> = (event) => {
        event.preventDefault();
        const scale = event.deltaY > 0 ? 1.12 : 0.88;
        const midX = (domain.minX + domain.maxX) / 2;
        const midY = (domain.minY + domain.maxY) / 2;
        const halfWidth = ((domain.maxX - domain.minX) * scale) / 2;
        const halfHeight = ((domain.maxY - domain.minY) * scale) / 2;
        setDomain(clampDomain({ minX: midX - halfWidth, maxX: midX + halfWidth, minY: midY - halfHeight, maxY: midY + halfHeight }));
    };

    const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (event) => {
        dragState.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (event) => {
        if (!dragState.current) return;
        const dx = event.clientX - dragState.current.x;
        const dy = event.clientY - dragState.current.y;
        dragState.current = { x: event.clientX, y: event.clientY };
        const xSpan = domain.maxX - domain.minX;
        const ySpan = domain.maxY - domain.minY;
        const shiftX = (dx / Math.max(width - padding.left - padding.right, 1)) * xSpan;
        const shiftY = (dy / Math.max(height - padding.top - padding.bottom, 1)) * ySpan;
        setDomain({
            minX: domain.minX - shiftX,
            maxX: domain.maxX - shiftX,
            minY: domain.minY + shiftY,
            maxY: domain.maxY + shiftY,
        });
    };

    const onPointerUp = () => {
        dragState.current = null;
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3 rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] p-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    <span>Wheel: zoom</span>
                    <span>Drag: pan</span>
                    <button type="button" onClick={() => setDomain(baseDomain)} className="rounded-full border border-border/60 px-3 py-1 text-foreground">
                        Reset View
                    </button>
                </div>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-[320px] w-full rounded-2xl touch-none"
                    onWheel={onWheel}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    {gridX.map((x) => (
                        <line key={`gx-${x}`} x1={x} x2={x} y1={padding.top} y2={height - padding.bottom} className="stroke-border/50" strokeWidth="1" />
                    ))}
                    {gridY.map((y) => (
                        <line key={`gy-${y}`} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="stroke-border/50" strokeWidth="1" />
                    ))}
                    <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="stroke-muted-foreground/60" strokeWidth="1.5" />
                    <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} className="stroke-muted-foreground/60" strokeWidth="1.5" />
                    {series.map((entry) => (
                        <g key={entry.label} className={entry.tone}>
                            <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={entry.strokeWidth}
                                points={entry.points.map((point) => {
                                    const projected = project(point);
                                    return `${projected.x},${projected.y}`;
                                }).join(" ")}
                            />
                            {entry.points.map((point, index) => {
                                const projected = project(point);
                                return <circle key={`${entry.label}-${index}`} cx={projected.x} cy={projected.y} r="3" fill="currentColor" />;
                            })}
                        </g>
                    ))}
                    <text x={padding.left} y={16} className="fill-muted-foreground text-[11px]">
                        y in [{domain.minY.toFixed(3)}, {domain.maxY.toFixed(3)}]
                    </text>
                    <text x={width - padding.right - 110} y={height - 8} className="fill-muted-foreground text-[11px]">
                        x in [{domain.minX.toFixed(3)}, {domain.maxX.toFixed(3)}]
                    </text>
                </svg>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <LegendCard series={series} />
                <EndpointCard summary={summary} />
                {mode === "limits" ? <LimitSplitCard points={series[0]?.points ?? []} summary={summary} /> : null}
                {mode === "limits" ? <LimitDominanceCard points={series[2]?.points ?? []} summary={summary} /> : null}
                {mode === "limits" ? <InfinityComparisonCard points={series[0]?.points ?? []} summary={summary} /> : null}
                {mode === "limits" ? <OscillationBandCard points={series[2]?.points ?? []} summary={summary} /> : null}
                <MiniEnergyCard points={energySeries} />
                <MiniPhaseCard mode={mode} points={phaseSeries} summary={summary} />
            </div>
        </div>
    );
}

function LegendCard({ series }: { series: PlotSeries[] }) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Legend</div>
            <div className="mt-4 space-y-3">
                {series.map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className={`h-2.5 w-8 rounded-full ${entry.swatch}`} />
                            <div className="text-sm font-medium text-foreground">{entry.label}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.points.length} pts</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EndpointCard({ summary }: { summary: SeriesLimitSummary }) {
    const details = summary.endpointDetails?.length ? summary.endpointDetails : [summary.endpointSignal ?? "Endpoint audit pending"];
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Endpoint Proofs</div>
            <div className="mt-4 space-y-3">
                {details.map((detail) => (
                    <div key={detail} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm leading-6 text-foreground">
                        {detail}
                    </div>
                ))}
            </div>
        </div>
    );
}

function MiniEnergyCard({ points }: { points: SeriesLimitSeriesPoint[] }) {
    const width = 280;
    const height = 160;
    if (!points.length) {
        return (
            <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Remainder Energy</div>
                <div className="mt-3 text-sm text-muted-foreground">Need both term and partial-sum tracks for remainder-energy view.</div>
            </div>
        );
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xSpan = Math.max(maxX - minX, 1e-9);
    const ySpan = Math.max(maxY - minY, 1e-9);
    const project = (point: SeriesLimitSeriesPoint) => ({
        x: 18 + ((point.x - minX) / xSpan) * (width - 36),
        y: height - 18 - ((point.y - minY) / ySpan) * (height - 36),
    });
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Remainder Energy</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[160px] w-full rounded-2xl border border-border/60 bg-muted/10">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-amber-600 dark:text-amber-400"
                    points={points.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            </svg>
        </div>
    );
}

function LimitSplitCard({ points, summary }: { points: SeriesLimitSeriesPoint[]; summary: SeriesLimitSummary }) {
    const negative = points.filter((point) => point.x < 0);
    const positive = points.filter((point) => point.x > 0);
    const leftCount = negative.length || Math.floor(points.length / 2);
    const leftPoints = negative.length ? negative : points.slice(0, leftCount);
    const rightPoints = positive.length ? positive : points.slice(leftCount);

    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">One-Sided Split</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniBranchChart title="Left Branch" points={leftPoints} tone="text-sky-600 dark:text-sky-400" />
                <MiniBranchChart title="Right Branch" points={rightPoints} tone="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {summary.proofSignal ?? "one-sided analysis pending"}
            </div>
        </div>
    );
}

function LimitDominanceCard({ points, summary }: { points: SeriesLimitSeriesPoint[]; summary: SeriesLimitSummary }) {
    const width = 280;
    const height = 160;
    if (!points.length) {
        return (
            <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Dominance Lens</div>
                <div className="mt-3 text-sm text-muted-foreground">Envelope data unavailable for this limit.</div>
            </div>
        );
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xSpan = Math.max(maxX - minX, 1e-9);
    const ySpan = Math.max(maxY - minY, 1e-9);
    const project = (point: SeriesLimitSeriesPoint) => ({
        x: 18 + ((point.x - minX) / xSpan) * (width - 36),
        y: height - 18 - ((point.y - minY) / ySpan) * (height - 36),
    });
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Dominance Lens</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Envelope / blow-up profile</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[160px] w-full rounded-2xl border border-border/60 bg-muted/10">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-emerald-600 dark:text-emerald-400"
                    points={points.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            </svg>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {summary.errorBoundSignal ?? summary.riskSignal ?? "dominance notes pending"}
            </div>
        </div>
    );
}

function SideStat({ title, value, detail }: { title: string; value: string; detail: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        </div>
    );
}

function MiniBranchChart({ title, points, tone }: { title: string; points: SeriesLimitSeriesPoint[]; tone: string }) {
    const width = 150;
    const height = 120;
    if (!points.length) {
        return <SideStat title={title} value="pending" detail="no samples" />;
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xSpan = Math.max(maxX - minX, 1e-9);
    const ySpan = Math.max(maxY - minY, 1e-9);
    const project = (point: SeriesLimitSeriesPoint) => ({
        x: 12 + ((point.x - minX) / xSpan) * (width - 24),
        y: height - 12 - ((point.y - minY) / ySpan) * (height - 24),
    });
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
            <div className="mt-1 text-sm font-bold text-foreground">{points.at(-1)?.y?.toFixed(4) ?? "pending"}</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-[120px] w-full rounded-xl border border-border/50 bg-background">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={tone}
                    points={points.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
            </svg>
        </div>
    );
}

function InfinityComparisonCard({ points, summary }: { points: SeriesLimitSeriesPoint[]; summary: SeriesLimitSummary }) {
    const isInfinityLane = (summary.detectedFamily ?? "").includes("infinite");
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Infinity Comparison</div>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm text-foreground">
                {isInfinityLane
                    ? `Dominant-term reading: ${summary.dominantTerm ?? "pending"}`
                    : "Not currently in an infinity-limit branch."}
            </div>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
                {points.length ? `Observed approach window has ${points.length} samples.` : "No infinity samples available."}
            </div>
        </div>
    );
}

function OscillationBandCard({ points, summary }: { points: SeriesLimitSeriesPoint[]; summary: SeriesLimitSummary }) {
    const width = 280;
    const height = 110;
    const isOscillatory = (summary.detectedFamily ?? "").includes("oscillatory");
    if (!isOscillatory || !points.length) {
        return (
            <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Oscillation Band</div>
                <div className="mt-3 text-sm text-muted-foreground">Oscillation envelope appears only for oscillatory limit branches.</div>
            </div>
        );
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const xSpan = Math.max(maxX - minX, 1e-9);
    const ySpan = Math.max(maxY, 1e-9);
    const project = (point: SeriesLimitSeriesPoint) => ({
        x: 12 + ((point.x - minX) / xSpan) * (width - 24),
        y: height - 12 - (point.y / ySpan) * (height - 24),
    });
    const mirrored = [...points].reverse().map((point) => ({ x: point.x, y: -point.y }));
    const polygon = [...points, ...mirrored].map((point) => {
        const projected = project({ x: point.x, y: Math.abs(point.y) });
        const py = point.y >= 0 ? projected.y : height - projected.y;
        return `${projected.x},${py}`;
    }).join(" ");
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Oscillation Band</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[110px] w-full rounded-2xl border border-border/60 bg-muted/10">
                <polygon points={polygon} className="fill-emerald-500/20 stroke-emerald-500/60" strokeWidth="1.5" />
            </svg>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {summary.proofSignal ?? "oscillation analysis pending"}
            </div>
        </div>
    );
}

function MiniPhaseCard({
    mode,
    points,
    summary,
}: {
    mode: SeriesLimitMode;
    points: SeriesLimitSeriesPoint[];
    summary: SeriesLimitSummary;
}) {
    const width = 280;
    const height = 180;
    if (!points.length) {
        return (
            <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Secondary Lens</div>
                <div className="mt-3 text-sm text-muted-foreground">Phase-style preview requires at least two primary points.</div>
            </div>
        );
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xSpan = Math.max(maxX - minX, 1e-9);
    const ySpan = Math.max(maxY - minY, 1e-9);
    const project = (point: SeriesLimitSeriesPoint) => ({
        x: 18 + ((point.x - minX) / xSpan) * (width - 36),
        y: height - 18 - ((point.y - minY) / ySpan) * (height - 36),
    });

    return (
        <div className="rounded-3xl border border-border/50 bg-background p-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Secondary Lens</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
                {mode === "sequences" ? "Phase portrait" : "State transition map"}
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[180px] w-full rounded-2xl border border-border/60 bg-muted/10">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-fuchsia-600 dark:text-fuchsia-400"
                    points={points.map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                    }).join(" ")}
                />
                {points.map((point, index) => {
                    const projected = project(point);
                    return <circle key={index} cx={projected.x} cy={projected.y} r="2.5" className="fill-fuchsia-600 dark:fill-fuchsia-400" />;
                })}
            </svg>
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {summary.proofSignal ?? "phase notes pending"}
            </div>
        </div>
    );
}

function buildEnergySeries(terms: SeriesLimitSeriesPoint[], partials: SeriesLimitSeriesPoint[]) {
    if (!terms.length || !partials.length) return [];
    const partialMap = new Map(partials.map((point) => [point.x, point.y]));
    return terms.map((point) => ({
        x: point.x,
        y: Math.abs(point.y) + Math.abs(partialMap.get(point.x) ?? 0),
    }));
}

function compactItems(items: string[]) {
    const filtered = items.filter((item) => {
        const normalized = item.trim().toLowerCase();
        return normalized && normalized !== "pending" && normalized !== "expansion pending";
    });

    return filtered.length ? filtered : ["Awaiting stronger structural signal."];
}
