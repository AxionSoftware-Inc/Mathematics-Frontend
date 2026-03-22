"use client";

import { type DirectionFieldSegment, type PlotPoint } from "@/components/laboratory/math-utils";

type DirectionFieldSeries = {
    label: string;
    color: string;
    points: PlotPoint[];
};

type DirectionFieldPointOverlay = {
    label: string;
    color: string;
    points: PlotPoint[];
    radius?: number;
};

function mapX(value: number, min: number, max: number, width: number) {
    const span = Math.max(max - min, Number.EPSILON);
    return ((value - min) / span) * width;
}

function mapY(value: number, min: number, max: number, height: number) {
    const span = Math.max(max - min, Number.EPSILON);
    return height - ((value - min) / span) * height;
}

function buildPath(points: PlotPoint[], xMin: number, xMax: number, yMin: number, yMax: number, width: number, height: number) {
    return points
        .map((point, index) => {
            const x = mapX(point.x, xMin, xMax, width);
            const y = mapY(point.y, yMin, yMax, height);
            return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
}

export function DirectionFieldPlot({
    title,
    segments,
    series = [],
    pointOverlays = [],
    xDomain,
    yDomain,
    height = 360,
}: {
    title?: string;
    segments: DirectionFieldSegment[];
    series?: DirectionFieldSeries[];
    pointOverlays?: DirectionFieldPointOverlay[];
    xDomain: [number, number];
    yDomain: [number, number];
    height?: number;
}) {
    const [xMin, xMax] = xDomain;
    const [yMin, yMax] = yDomain;
    const width = 900;
    const innerHeight = 520;

    if (!segments.length) {
        return null;
    }

    return (
        <div className="site-panel w-full overflow-hidden p-2">
            {title ? (
                <div className="px-5 pt-4 pb-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
                </div>
            ) : null}
            <div className="px-3 pb-3">
                <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.6))] p-3 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.58))]">
                    <svg viewBox={`0 0 ${width} ${innerHeight}`} className="w-full" style={{ height }}>
                        <defs>
                            <pattern id="direction-field-grid" width="90" height="52" patternUnits="userSpaceOnUse">
                                <path d="M 90 0 L 0 0 0 52" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
                            </pattern>
                        </defs>

                        <rect x="0" y="0" width={width} height={innerHeight} fill="url(#direction-field-grid)" rx="24" />

                        {xMin <= 0 && xMax >= 0 ? (
                            <line
                                x1={mapX(0, xMin, xMax, width)}
                                x2={mapX(0, xMin, xMax, width)}
                                y1={0}
                                y2={innerHeight}
                                stroke="rgba(100,116,139,0.35)"
                                strokeWidth="2"
                            />
                        ) : null}
                        {yMin <= 0 && yMax >= 0 ? (
                            <line
                                x1={0}
                                x2={width}
                                y1={mapY(0, yMin, yMax, innerHeight)}
                                y2={mapY(0, yMin, yMax, innerHeight)}
                                stroke="rgba(100,116,139,0.35)"
                                strokeWidth="2"
                            />
                        ) : null}

                        {segments.map((segment, index) => (
                            <line
                                key={`${segment.x1}-${segment.y1}-${index}`}
                                x1={mapX(segment.x1, xMin, xMax, width)}
                                y1={mapY(segment.y1, yMin, yMax, innerHeight)}
                                x2={mapX(segment.x2, xMin, xMax, width)}
                                y2={mapY(segment.y2, yMin, yMax, innerHeight)}
                                stroke="rgba(37,99,235,0.35)"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                        ))}

                        {series.map((entry) =>
                            entry.points.length ? (
                                <path
                                    key={entry.label}
                                    d={buildPath(entry.points, xMin, xMax, yMin, yMax, width, innerHeight)}
                                    fill="none"
                                    stroke={entry.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ) : null,
                        )}

                        {pointOverlays.map((overlay) =>
                            overlay.points.map((point, index) => (
                                <circle
                                    key={`${overlay.label}-${index}-${point.x}-${point.y}`}
                                    cx={mapX(point.x, xMin, xMax, width)}
                                    cy={mapY(point.y, yMin, yMax, innerHeight)}
                                    r={overlay.radius ?? 2.6}
                                    fill={overlay.color}
                                    opacity={0.8}
                                />
                            )),
                        )}
                    </svg>

                    {series.length || pointOverlays.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {series.map((entry) => (
                                <div
                                    key={entry.label}
                                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground"
                                >
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.label}
                                </div>
                            ))}
                            {pointOverlays.map((overlay) => (
                                <div
                                    key={overlay.label}
                                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground"
                                >
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: overlay.color }} />
                                    {overlay.label}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
