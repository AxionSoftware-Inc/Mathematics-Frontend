"use client";

import { PlotPoint } from "@/components/laboratory/math-utils";

type PlotSeries = {
    label: string;
    color: string;
    points: PlotPoint[];
};

function toPath(points: PlotPoint[], width: number, height: number, xMin: number, xMax: number, yMin: number, yMax: number) {
    const usableWidth = width - 40;
    const usableHeight = height - 40;

    return points
        .map((point, index) => {
            const x = 20 + ((point.x - xMin) / Math.max(xMax - xMin, 1e-9)) * usableWidth;
            const y = height - 20 - ((point.y - yMin) / Math.max(yMax - yMin, 1e-9)) * usableHeight;
            return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
}

export function CartesianPlot({
    series,
    height = 280,
}: {
    series: PlotSeries[];
    height?: number;
}) {
    const points = series.flatMap((entry) => entry.points);
    if (!points.length) {
        return null;
    }

    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const width = 680;

    return (
        <div className="site-outline-card overflow-hidden p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
                <rect x="20" y="20" width={width - 40} height={height - 40} rx="18" fill="transparent" stroke="currentColor" className="text-border" />
                {series.map((entry) => (
                    <g key={entry.label}>
                        <path
                            d={toPath(entry.points, width, height, xMin, xMax, yMin, yMax)}
                            fill="none"
                            stroke={entry.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        {entry.points.map((point, index) => {
                            const x = 20 + ((point.x - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 40);
                            const y = height - 20 - ((point.y - yMin) / Math.max(yMax - yMin, 1e-9)) * (height - 40);
                            return <circle key={`${entry.label}-${index}`} cx={x} cy={y} r="3.5" fill={entry.color} />;
                        })}
                    </g>
                ))}
            </svg>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                {series.map((entry) => (
                    <div key={entry.label} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
