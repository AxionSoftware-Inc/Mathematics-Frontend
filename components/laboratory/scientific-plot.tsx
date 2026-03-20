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
    } = {},
) {
    const cleanPoints = points.filter((point) => isFinitePoint(point.x) && isFinitePoint(point.y) && isFinitePoint(point.z));
    if (!cleanPoints.length) {
        return [] as Data[];
    }

    const label = options.label || "Trajectory";
    const firstPoint = cleanPoints[0];
    const lastPoint = cleanPoints[cleanPoints.length - 1];

    const traces: Data[] = [
        {
            type: "scatter3d",
            mode: cleanPoints.length > 1 ? "lines" : "markers",
            name: label,
            x: cleanPoints.map((point) => point.x),
            y: cleanPoints.map((point) => point.y),
            z: cleanPoints.map((point) => point.z as number),
            line: {
                width: 6,
                color: options.lineColor || "#2563eb",
            },
            marker: {
                size: 4,
                color: options.lineColor || "#2563eb",
                opacity: 0.82,
            },
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
        } as Data,
    ];

    if (cleanPoints.length > 1) {
        traces.push(
            {
                type: "scatter3d",
                mode: "markers",
                name: `${label} start`,
                x: [firstPoint.x],
                y: [firstPoint.y],
                z: [firstPoint.z as number],
                marker: {
                    size: 6,
                    color: options.startColor || "#14b8a6",
                    line: { width: 1.5, color: "rgba(255,255,255,0.85)" },
                },
                hovertemplate: "Start<br>x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
            } as Data,
            {
                type: "scatter3d",
                mode: "markers",
                name: `${label} end`,
                x: [lastPoint.x],
                y: [lastPoint.y],
                z: [lastPoint.z as number],
                marker: {
                    size: 7,
                    color: options.endColor || "#f59e0b",
                    line: { width: 1.5, color: "rgba(255,255,255,0.85)" },
                },
                hovertemplate: "End<br>x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<extra></extra>",
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
            x: cleanPoints.map((point) => point.x),
            y: cleanPoints.map((point) => point.y),
            z: cleanPoints.map((point) => point.z as number),
            marker: {
                size: markerSize,
                color: markerValues,
                colorscale: options.colorscale || "Plasma",
                opacity: cleanPoints.length > 500 ? 0.42 : 0.62,
                showscale: false,
                line: { width: 0 },
            },
            hovertemplate: "x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<br>value=%{marker.color:.4f}<extra></extra>",
        } as Data,
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
            } as Data,
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
        } as Data,
    ];
}

export function buildVolumeData(
    samples: Array<{ x: number; y: number; z: number; value: number }>,
    options: {
        label?: string;
        colorscale?: string;
    } = {},
) {
    return buildPointCloudData(samples, {
        label: options.label || "Volume density",
        colorscale: options.colorscale || "Plasma",
    });
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
