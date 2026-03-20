"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Config, Data, Layout } from "plotly.js";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-border/40 bg-muted/5 p-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
            <div className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">Initializing engine...</div>
        </div>
    ),
});

type ScientificPlotProps = {
    type: "surface" | "scatter3d" | "scatter2d";
    data: Array<Record<string, unknown>>;
    title?: string;
    height?: number;
    className?: string;
    layoutOverrides?: Partial<Layout>;
    configOverrides?: Partial<Config>;
};

type PlotPointLike = {
    x: number;
    y: number;
    z?: number;
};

function mergeIfObject(base: Record<string, unknown>, value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return base;
    }

    return {
        ...base,
        ...value,
    };
}

export function ScientificPlot({
    type,
    data,
    title,
    height = 450,
    className,
    layoutOverrides,
    configOverrides,
}: ScientificPlotProps) {
    const normalizedData = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        if (data[0] && "type" in data[0]) return data as unknown as Data[];

        const points = data as PlotPointLike[];

        if (type === "scatter3d") {
            return [
                {
                    x: points.map((point) => point.x),
                    y: points.map((point) => point.y),
                    z: points.map((point) => point.z ?? 0),
                    type: "scatter3d" as const,
                    mode: "lines" as const,
                    line: {
                        width: 5,
                        color: "#0f766e",
                    },
                    opacity: 0.94,
                } satisfies Partial<Data> as Data,
            ] satisfies Data[];
        }

        if (type === "scatter2d") {
            return [
                {
                    x: points.map((point) => point.x),
                    y: points.map((point) => point.y),
                    type: "scatter" as const,
                    mode: "lines" as const,
                    line: {
                        width: 3,
                        color: "#1d4ed8",
                    },
                    opacity: 0.94,
                } satisfies Partial<Data> as Data,
            ] satisfies Data[];
        }

        return data as Data[];
    }, [data, type]);

    const showLegend = normalizedData.some((trace) => typeof trace?.name === "string" && trace.name.trim().length > 0);

    const layout = React.useMemo(() => {
        const baseSceneAxis = {
            showbackground: false,
            backgroundcolor: "transparent",
            gridcolor: "rgba(148, 163, 184, 0.14)",
            zerolinecolor: "rgba(148, 163, 184, 0.22)",
            tickfont: { size: 10, color: "#71717a" },
            titlefont: { size: 11, color: "#52525b" },
        };

        const baseLayout: Record<string, unknown> = {
            title: title
                ? {
                      text: title,
                      font: { family: "inherit", size: 13, color: "#111827" },
                      x: 0.02,
                  }
                : undefined,
            autosize: true,
            height,
            margin: { l: 8, r: 8, b: 8, t: title ? 52 : 8 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { family: "inherit", color: "#52525b" },
            showlegend: showLegend,
            legend: {
                orientation: "h",
                x: 0,
                y: 1.12,
                font: { size: 11, color: "#52525b" },
            },
            scene: {
                xaxis: {
                    ...baseSceneAxis,
                    title: "x",
                },
                yaxis: {
                    ...baseSceneAxis,
                    title: "y",
                },
                zaxis: {
                    ...baseSceneAxis,
                    title: "z",
                },
                aspectmode: "cube",
                camera: {
                    eye: { x: 1.45, y: 1.28, z: 1.24 },
                },
            },
            xaxis: {
                gridcolor: "rgba(148, 163, 184, 0.14)",
                zerolinecolor: "rgba(148, 163, 184, 0.22)",
                tickfont: { size: 10, color: "#71717a" },
            },
            yaxis: {
                gridcolor: "rgba(148, 163, 184, 0.14)",
                zerolinecolor: "rgba(148, 163, 184, 0.22)",
                tickfont: { size: 10, color: "#71717a" },
            },
        };

        const merged = {
            ...baseLayout,
            ...layoutOverrides,
        } as Record<string, unknown>;

        merged.scene = mergeIfObject(baseLayout.scene as Record<string, unknown>, layoutOverrides?.scene);
        merged.xaxis = mergeIfObject(baseLayout.xaxis as Record<string, unknown>, layoutOverrides?.xaxis);
        merged.yaxis = mergeIfObject(baseLayout.yaxis as Record<string, unknown>, layoutOverrides?.yaxis);

        if ((merged.scene as Record<string, unknown>)?.xaxis) {
            (merged.scene as Record<string, unknown>).xaxis = mergeIfObject(
                ((baseLayout.scene as Record<string, unknown>).xaxis as Record<string, unknown>) || {},
                (layoutOverrides?.scene as Record<string, unknown> | undefined)?.xaxis,
            );
        }

        if ((merged.scene as Record<string, unknown>)?.yaxis) {
            (merged.scene as Record<string, unknown>).yaxis = mergeIfObject(
                ((baseLayout.scene as Record<string, unknown>).yaxis as Record<string, unknown>) || {},
                (layoutOverrides?.scene as Record<string, unknown> | undefined)?.yaxis,
            );
        }

        if ((merged.scene as Record<string, unknown>)?.zaxis) {
            (merged.scene as Record<string, unknown>).zaxis = mergeIfObject(
                ((baseLayout.scene as Record<string, unknown>).zaxis as Record<string, unknown>) || {},
                (layoutOverrides?.scene as Record<string, unknown> | undefined)?.zaxis,
            );
        }

        return merged;
    }, [height, layoutOverrides, showLegend, title]);

    const config = React.useMemo(
        () => ({
            displayModeBar: false,
            responsive: true,
            scrollZoom: false,
            ...configOverrides,
        }),
        [configOverrides],
    );

    return (
        <div
            className={`site-panel relative w-full overflow-hidden border-border/60 bg-background/40 p-2 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.6)] transition-all duration-500 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.72)] ${
                className || ""
            }`}
        >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.12),transparent_72%)] blur-2xl" />
            <Plot
                data={normalizedData as Data[]}
                layout={layout as Partial<Layout>}
                config={config}
                useResizeHandler={true}
                className="relative z-10 h-full w-full"
            />
        </div>
    );
}

export function buildSurfaceData(samples: { x: number; y: number; z: number }[]) {
    return [
        {
            x: samples.map((sample) => sample.x),
            y: samples.map((sample) => sample.y),
            z: samples.map((sample) => sample.z),
            type: "mesh3d",
            intensity: samples.map((sample) => sample.z),
            colorscale: "Viridis",
            opacity: 0.84,
            showscale: false,
        },
    ];
}

export function buildVolumeData(samples: { x: number; y: number; z: number; value: number }[]) {
    return [
        {
            x: samples.map((sample) => sample.x),
            y: samples.map((sample) => sample.y),
            z: samples.map((sample) => sample.z),
            mode: "markers",
            type: "scatter3d",
            marker: {
                size: 4,
                color: samples.map((sample) => sample.value),
                colorscale: "Plasma",
                opacity: 0.64,
                showscale: false,
            },
        },
    ];
}
