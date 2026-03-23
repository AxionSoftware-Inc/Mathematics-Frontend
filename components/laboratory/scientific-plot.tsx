"use client";

import React from "react";
import type { Data, Layout } from "plotly.js";

import { UnifiedPlotRenderer } from "./unified-plot-renderer";

export type ScientificPlotType = "surface" | "scatter3d" | "scatter2d" | "mesh3d" | "volume";

export type PlotPointLike = {
    x: number;
    y: number;
    z?: number;
    value?: number;
};

export type ParametricSurface = {
    x: number[][];
    y: number[][];
    z: number[][];
};

type ScientificPlotProps = {
    type: ScientificPlotType;
    data: Array<Record<string, unknown>>;
    title?: string;
    height?: number;
    className?: string;
    layoutOverrides?: Partial<Layout>;
    configOverrides?: Record<string, unknown>;
    insights?: string[];
    snapshotFileName?: string;
};

function isFinitePoint(value: unknown) {
    return typeof value === "number" && Number.isFinite(value);
}

function roundKey(value: number) {
    return value.toFixed(6);
}

function withAlphaColor(color: string | undefined, fallback: string, alpha: number) {
    if (!color) {
        return fallback;
    }

    const normalized = color.trim();
    if (/^#([0-9a-f]{6})$/i.test(normalized)) {
        const hex = normalized.slice(1);
        const red = Number.parseInt(hex.slice(0, 2), 16);
        const green = Number.parseInt(hex.slice(2, 4), 16);
        const blue = Number.parseInt(hex.slice(4, 6), 16);
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    return fallback;
}

function isPlotlyTraceArray(data: Array<Record<string, unknown>>) {
    return data.every((item) => item && typeof item === "object" && "type" in item);
}

export function buildScatter3DTrajectoryData(
    points: PlotPointLike[],
    options: {
        label?: string;
        lineColor?: string;
        startColor?: string;
        endColor?: string;
        revealRatio?: number;
        colorscale?: string | Array<[number, string]>;
        maxSamples?: number;
    } = {},
) {
    const cleanPoints = points.filter((point) => isFinitePoint(point.x) && isFinitePoint(point.y) && isFinitePoint(point.z));
    if (!cleanPoints.length) {
        return [] as Data[];
    }

    const sampleTrajectory = (input: PlotPointLike[], maxSamples: number) => {
        if (input.length <= maxSamples) {
            return input;
        }

        const step = (input.length - 1) / Math.max(1, maxSamples - 1);
        const sampled = Array.from({ length: maxSamples }, (_, index) => input[Math.min(input.length - 1, Math.round(index * step))]);
        return sampled.filter((point, index) => index === 0 || point !== sampled[index - 1]);
    };

    const normalizedRevealRatio = Math.max(0.02, Math.min(1, options.revealRatio ?? 1));
    const visibleCount = Math.max(1, Math.ceil(cleanPoints.length * normalizedRevealRatio));
    const visiblePoints = sampleTrajectory(cleanPoints.slice(0, visibleCount), Math.max(60, options.maxSamples ?? 900));
    const label = options.label || "Trajectory";
    const firstPoint = visiblePoints[0];
    const visibleLastPoint = visiblePoints[visiblePoints.length - 1];
    const xValues = visiblePoints.map((point) => point.x);
    const yValues = visiblePoints.map((point) => point.y);
    const zValues = visiblePoints.map((point) => point.z as number);
    const xPlane = Math.min(...xValues);
    const yPlane = Math.min(...yValues);
    const zPlane = Math.min(...zValues);
    const projectionColor = withAlphaColor(options.lineColor, "rgba(37, 99, 235, 0.22)", 0.22);
    const glowColor = withAlphaColor(options.lineColor, "rgba(37, 99, 235, 0.16)", 0.16);
    const lineColor = options.lineColor || "#2563eb";
    const gradientScale = options.colorscale || [
        [0, "#67e8f9"],
        [0.45, lineColor],
        [1, options.endColor || "#f59e0b"],
    ];

    const traces: Data[] = [
        {
            type: "scatter3d",
            mode: visiblePoints.length > 1 ? "lines" : "markers",
            name: `${label} glow`,
            x: xValues,
            y: yValues,
            z: zValues,
            line: {
                width: 12,
                color: glowColor,
            },
            marker: {
                size: 0,
                opacity: 0,
            },
            hoverinfo: "skip",
            showlegend: false,
        } as Data,
        {
            type: "scatter3d",
            mode: visiblePoints.length > 1 ? "lines" : "markers",
            name: label,
            x: xValues,
            y: yValues,
            z: zValues,
            line: {
                width: 6,
                color: lineColor,
            },
            marker: {
                size: 4,
                color: lineColor,
                opacity: 0.82,
            },
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
        } as Data,
    ];

    if (visiblePoints.length > 1) {
        traces.push({
            type: "scatter3d",
            mode: "markers",
            name: `${label} gradient trail`,
            x: xValues,
            y: yValues,
            z: zValues,
            marker: {
                size: visiblePoints.length > 600 ? 2.2 : 3.2,
                color: visiblePoints.map((_, index) => index / Math.max(1, visiblePoints.length - 1)),
                colorscale: gradientScale,
                opacity: 0.95,
                line: { width: 0 },
                showscale: false,
            },
            hoverinfo: "skip",
            showlegend: false,
        } as Data);

        traces.push(
            {
                type: "scatter3d",
                mode: "lines",
                name: `${label} xy projection`,
                x: xValues,
                y: yValues,
                z: visiblePoints.map(() => zPlane),
                line: {
                    width: 2,
                    color: projectionColor,
                    dash: "dot",
                },
                hoverinfo: "skip",
                showlegend: false,
            } as Data,
            {
                type: "scatter3d",
                mode: "lines",
                name: `${label} xz projection`,
                x: xValues,
                y: visiblePoints.map(() => yPlane),
                z: zValues,
                line: {
                    width: 2,
                    color: projectionColor,
                    dash: "dot",
                },
                hoverinfo: "skip",
                showlegend: false,
            } as Data,
            {
                type: "scatter3d",
                mode: "lines",
                name: `${label} yz projection`,
                x: visiblePoints.map(() => xPlane),
                y: yValues,
                z: zValues,
                line: {
                    width: 2,
                    color: projectionColor,
                    dash: "dot",
                },
                hoverinfo: "skip",
                showlegend: false,
            } as Data,
        );
    }

    if (visiblePoints.length > 1) {
        traces.push(
            {
                type: "scatter3d",
                mode: "markers",
                name: `${label} start`,
                x: [firstPoint.x],
                y: [firstPoint.y],
                z: [firstPoint.z as number],
                marker: {
                    size: 7,
                    color: options.startColor || "#14b8a6",
                    line: { width: 2, color: "rgba(255,255,255,0.92)" },
                },
                hovertemplate: "Start<br>x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
            } as Data,
            {
                type: "scatter3d",
                mode: "markers",
                name: normalizedRevealRatio >= 0.999 ? `${label} end` : `${label} head`,
                x: [visibleLastPoint.x],
                y: [visibleLastPoint.y],
                z: [visibleLastPoint.z as number],
                marker: {
                    size: normalizedRevealRatio >= 0.999 ? 8 : 10,
                    color: options.endColor || "#f59e0b",
                    line: { width: 2, color: "rgba(255,255,255,0.92)" },
                },
                hovertemplate: `${normalizedRevealRatio >= 0.999 ? "End" : "Trail head"}<br>x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>`,
            } as Data,
        );
    }

    return traces;
}

export function buildPointCloudData(
    points: PlotPointLike[],
    options: {
        label?: string;
        colorscale?: string;
    } = {},
) {
    const cleanPoints = points.filter((point) => isFinitePoint(point.x) && isFinitePoint(point.y) && isFinitePoint(point.z));
    if (!cleanPoints.length) {
        return [] as Data[];
    }

    const markerValues = cleanPoints.map((point) => point.value ?? point.z ?? 0);
    const markerSize = cleanPoints.length > 900 ? 2 : cleanPoints.length > 300 ? 3 : 4.5;

    return [
        {
            type: "scatter3d",
            mode: "markers",
            name: options.label || "Point cloud",
            x: cleanPoints.map((point) => point.x) as any,
            y: cleanPoints.map((point) => point.y) as any,
            z: cleanPoints.map((point) => point.z as number) as any,
            marker: {
                size: markerSize,
                color: markerValues,
                colorscale: options.colorscale || "Plasma",
                opacity: cleanPoints.length > 500 ? 0.42 : 0.62,
                showscale: false,
                line: { width: 0 },
            },
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<br>value=%{marker.color:.4f}<extra></extra>",
        } as any as Data,
    ];
}

export function buildWireframe3DData(
    points: PlotPointLike[],
    edges: Array<[number, number]>,
    options: {
        label?: string;
        lineColor?: string;
        markerColor?: string;
    } = {},
) {
    const cleanPoints = points.filter((point) => isFinitePoint(point.x) && isFinitePoint(point.y) && isFinitePoint(point.z));
    if (!cleanPoints.length) {
        return [] as Data[];
    }

    const edgeX: Array<number | null> = [];
    const edgeY: Array<number | null> = [];
    const edgeZ: Array<number | null> = [];

    edges.forEach(([fromIndex, toIndex]) => {
        const from = cleanPoints[fromIndex];
        const to = cleanPoints[toIndex];
        if (!from || !to) {
            return;
        }

        edgeX.push(from.x, to.x, null);
        edgeY.push(from.y, to.y, null);
        edgeZ.push(from.z as number, to.z as number, null);
    });

    return [
        {
            type: "scatter3d",
            mode: "lines",
            name: options.label || "Wireframe",
            x: edgeX,
            y: edgeY,
            z: edgeZ,
            line: {
                width: 5,
                color: options.lineColor || "#2563eb",
            },
            hoverinfo: "skip",
        } as Data,
        {
            type: "scatter3d",
            mode: "markers",
            name: `${options.label || "Wireframe"} vertices`,
            x: cleanPoints.map((point) => point.x),
            y: cleanPoints.map((point) => point.y),
            z: cleanPoints.map((point) => point.z as number),
            marker: {
                size: 4.5,
                color: options.markerColor || options.lineColor || "#2563eb",
                opacity: 0.88,
            },
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
        } as Data,
    ];
}

export function buildSurfaceData(
    samples: Array<{ x: number; y: number; z: number }>,
    options: {
        label?: string;
        colorscale?: string;
    } = {},
) {
    const cleanSamples = samples.filter((sample) => isFinitePoint(sample.x) && isFinitePoint(sample.y) && isFinitePoint(sample.z));
    if (!cleanSamples.length) {
        return [] as Data[];
    }

    const xValues = [...new Set(cleanSamples.map((sample) => roundKey(sample.x)))].map(Number).sort((left, right) => left - right);
    const yValues = [...new Set(cleanSamples.map((sample) => roundKey(sample.y)))].map(Number).sort((left, right) => left - right);
    const sampleMap = new Map(cleanSamples.map((sample) => [`${roundKey(sample.x)}::${roundKey(sample.y)}`, sample.z] as const));

    const zGrid = yValues.map((y) =>
        xValues.map((x) => {
            const value = sampleMap.get(`${roundKey(x)}::${roundKey(y)}`);
            return typeof value === "number" ? value : null;
        }),
    );

    const hasFullGrid = zGrid.every((row) => row.every((value) => typeof value === "number"));
    if (hasFullGrid && xValues.length > 1 && yValues.length > 1) {
        return [
            {
                type: "surface",
                name: options.label || "Surface",
                x: xValues,
                y: yValues,
                z: zGrid,
                colorscale: options.colorscale || "Viridis",
                showscale: false,
                opacity: 0.96,
                contours: {
                    z: {
                        show: true,
                        usecolormap: true,
                        highlightwidth: 1,
                        project: { z: true },
                    },
                },
                hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
            } as any as Data,
        ];
    }

    return [
        {
            type: "mesh3d",
            name: options.label || "Surface approximation",
            x: cleanSamples.map((sample) => sample.x),
            y: cleanSamples.map((sample) => sample.y),
            z: cleanSamples.map((sample) => sample.z),
            intensity: cleanSamples.map((sample) => sample.z),
            colorscale: options.colorscale || "Viridis",
            showscale: false,
            opacity: 0.82,
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
        } as Data,
    ];
}

export function buildParametricSurfaceData(
    surface: ParametricSurface,
    options: {
        label?: string;
        colorscale?: string;
        opacity?: number;
        showscale?: boolean;
    } = {},
) {
    return [
        {
            type: "surface",
            name: options.label || "Parametric surface",
            x: surface.x,
            y: surface.y,
            z: surface.z,
            colorscale: options.colorscale || "Viridis",
            showscale: options.showscale ?? false,
            opacity: options.opacity ?? 0.72,
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
        } as any as Data,
    ];
}

export function buildVolumeData(
    samples: Array<{ x: number; y: number; z: number; value: number }>,
    options: {
        label?: string;
        colorscale?: string;
    } = {},
) {
    if (!samples.length) return [] as Data[];

    const x = samples.map(s => s.x);
    const y = samples.map(s => s.y);
    const z = samples.map(s => s.z);
    const value = samples.map(s => s.value);

    return [
        {
            type: "isosurface",
            name: options.label || "Volumetric Density",
            x: x,
            y: y,
            z: z,
            value: value,
            isomin: Math.min(...value),
            isomax: Math.max(...value),
            surface: { count: 3, fill: 0.7, pattern: 'odd' },
            caps: {
                x: { show: true },
                y: { show: true },
                z: { show: true }
            },
            spaceframe: { show: true, fill: 0.15 },
            contour: { show: true, width: 2, color: 'white' },
            colorscale: options.colorscale || "Plasma",
            opacity: 0.35,
            showscale: false,
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<br>density=%{value:.4f}<extra></extra>",
        } as any as Data
    ];
}

export function ScientificPlot({
    type,
    data,
    title,
    height = 460,
    className,
    layoutOverrides,
    configOverrides,
    insights,
    snapshotFileName,
}: ScientificPlotProps) {
    const normalizedData = React.useMemo(() => {
        if (!data.length) {
            return [] as Data[];
        }

        if (isPlotlyTraceArray(data)) {
            return data as Data[];
        }

        const points = data as PlotPointLike[];

        if (type === "scatter3d") {
            return buildScatter3DTrajectoryData(points);
        }

        if (type === "scatter2d") {
            return [
                {
                    type: "scatter",
                    mode: "lines",
                    x: points.map((point) => point.x),
                    y: points.map((point) => point.y),
                    line: { width: 3, color: "#2563eb" },
                    hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<extra></extra>",
                } as Data,
            ];
        }

        if (type === "surface") {
            return buildSurfaceData(points as Array<{ x: number; y: number; z: number }>);
        }

        if (type === "volume") {
            return buildVolumeData(points as Array<{ x: number; y: number; z: number; value: number }>);
        }

        if (type === "mesh3d") {
            return buildPointCloudData(points, { label: "3D mesh points", colorscale: "Viridis" });
        }

        return data as Data[];
    }, [data, type]);

    return (
        <UnifiedPlotRenderer
            data={normalizedData}
            title={title}
            height={height}
            className={className}
            layout={layoutOverrides}
            config={configOverrides}
            insights={insights}
            snapshotFileName={snapshotFileName}
        />
    );
}
