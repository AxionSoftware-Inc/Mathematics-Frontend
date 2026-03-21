"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Download, Loader2, Maximize2, RefreshCw } from "lucide-react";
import type { Config, Data, Layout } from "plotly.js";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic<PlotParams>(
    async () => {
        const [{ default: createPlotlyComponent }, plotlyModule] = await Promise.all([
            import("react-plotly.js/factory"),
            import("plotly.js-dist-min"),
        ]);

        return createPlotlyComponent(plotlyModule.default ?? plotlyModule);
    },
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[460px] flex-col items-center justify-center rounded-[2rem] border border-border/40 bg-muted/5 p-12">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent/70" />
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">Initializing plot engine</div>
            </div>
        ),
    },
);

type UnifiedPlotProps = {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    title?: string;
    height?: number;
    className?: string;
    onRefresh?: () => void;
    insights?: string[];
    snapshotFileName?: string;
};

const THREE_D_TRACE_TYPES = new Set(["scatter3d", "surface", "mesh3d", "volume"]);
type PlotlyModuleLike = {
    relayout: (target: unknown, update: Record<string, unknown>) => Promise<unknown>;
    toImage: (target: unknown, options: Record<string, unknown>) => Promise<string>;
};
type PlotGraphDivLike = Readonly<HTMLElement> & {
    on?: (eventName: string, handler: () => void) => void;
    removeListener?: (eventName: string, handler: () => void) => void;
};

function isThreeDimensional(data: Data[]) {
    return data.some((trace) => typeof trace?.type === "string" && THREE_D_TRACE_TYPES.has(trace.type));
}

export function UnifiedPlotRenderer({
    data,
    layout: layoutOverrides,
    config: configOverrides,
    title,
    height = 500,
    className,
    onRefresh,
    insights,
    snapshotFileName,
}: UnifiedPlotProps) {
    const graphRef = useRef<PlotGraphDivLike | null>(null);
    const [revision, setRevision] = useState(0);
    const [cameraRevision, setCameraRevision] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
    const hasData = data.length > 0;
    const is3D = useMemo(() => isThreeDimensional(data), [data]);

    const defaultCamera = useMemo(
        () => ({
            eye: { x: 1.55, y: 1.3, z: 1.2 },
            center: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 0, z: 1 },
        }),
        [],
    );

    const finalizedLayout = useMemo(() => {
        const axisStyle = {
            gridcolor: "rgba(148, 163, 184, 0.18)",
            zerolinecolor: "rgba(148, 163, 184, 0.34)",
            tickfont: { size: 10, color: "rgba(82,82,91,0.9)" },
            titlefont: { size: 11, color: "rgba(39,39,42,0.98)" },
            showbackground: true,
            backgroundcolor: "rgba(248,250,252,0.14)",
            showspikes: false,
        };
        const withAxisTitle = (text: string) => ({
            ...axisStyle,
            title: { text },
        });
        const cartesianAxis = withAxisTitle("");

        const baseLayout: Partial<Layout> = {
            title: title
                ? {
                      text: title,
                      font: { family: "var(--font-serif)", size: 14, color: "#111827" },
                      x: 0.03,
                      xanchor: "left",
                      yanchor: "top",
                  }
                : undefined,
            autosize: true,
            height,
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            margin: { l: 20, r: 20, b: 36, t: title ? 58 : 24 },
            font: { family: "var(--font-serif)", color: "#3f3f46" },
            showlegend: data.some((trace) => typeof trace?.name === "string" && trace.name.trim().length > 0),
            legend: {
                orientation: "h",
                x: 0,
                y: -0.12,
                xanchor: "left",
                yanchor: "top",
                bgcolor: "rgba(255,255,255,0.45)",
                bordercolor: "rgba(148,163,184,0.16)",
                borderwidth: 1,
                font: { size: 10, color: "#52525b" },
            },
            hovermode: is3D ? false : "closest",
            uirevision: is3D ? `lab-3d-${cameraRevision}` : "lab-2d",
            scene: is3D
                ? {
                      xaxis: withAxisTitle("x"),
                      yaxis: withAxisTitle("y"),
                      zaxis: withAxisTitle("z"),
                      dragmode: "orbit",
                      aspectmode: "data",
                      camera: defaultCamera,
                      bgcolor: "rgba(255,255,255,0.01)",
                  }
                : undefined,
        };

        const mergedScene = is3D
            ? {
                  ...(baseLayout.scene || {}),
                  ...(layoutOverrides?.scene || {}),
                  camera: defaultCamera,
                  xaxis: { ...((baseLayout.scene as Layout["scene"])?.xaxis || {}), ...(layoutOverrides?.scene?.xaxis || {}) },
                  yaxis: { ...((baseLayout.scene as Layout["scene"])?.yaxis || {}), ...(layoutOverrides?.scene?.yaxis || {}) },
                  zaxis: { ...((baseLayout.scene as Layout["scene"])?.zaxis || {}), ...(layoutOverrides?.scene?.zaxis || {}) },
              }
            : undefined;

        const mergedLayout = {
            ...baseLayout,
            ...layoutOverrides,
        } as Partial<Layout>;

        if (is3D) {
            mergedLayout.scene = mergedScene;
            delete mergedLayout.xaxis;
            delete mergedLayout.yaxis;
        } else {
            mergedLayout.xaxis = { ...cartesianAxis, ...(layoutOverrides?.xaxis || {}) };
            mergedLayout.yaxis = { ...cartesianAxis, ...(layoutOverrides?.yaxis || {}) };
            delete mergedLayout.scene;
        }

        return mergedLayout;
    }, [cameraRevision, data, defaultCamera, height, is3D, layoutOverrides, title]);

    const finalizedConfig = useMemo(
        () =>
            ({
                displayModeBar: false,
                displaylogo: false,
                responsive: true,
                scrollZoom: false,
                doubleClick: "reset+autosize" as const,
                ...configOverrides,
            }) satisfies Partial<Config>,
        [configOverrides],
    );

    const handleHardRefresh = useCallback(() => {
        setError(null);
        setRevision((current) => current + 1);
        onRefresh?.();
    }, [onRefresh]);

    const handleResetCamera = useCallback(() => {
        setError(null);
        setCameraRevision((current) => current + 1);
        setRevision((current) => current + 1);
    }, []);

    const applyCameraPreset = useCallback(async (camera: { eye: { x: number; y: number; z: number }; center: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }) => {
        const graphDiv = graphRef.current;
        if (!graphDiv) {
            return;
        }

        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            await plotly.relayout(graphDiv, { "scene.camera": camera } as Record<string, unknown>);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Kamera presetini qo'llashda xato yuz berdi.");
        }
    }, []);

    const handleSnapshotExport = useCallback(async () => {
        const graphDiv = graphRef.current;
        if (!graphDiv) {
            return;
        }

        setIsExportingSnapshot(true);
        setError(null);

        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            const imageUrl = await plotly.toImage(graphDiv, {
                format: "png",
                width: 1600,
                height: Math.max(900, Math.round(height * 2)),
                scale: 2,
            });
            const anchor = document.createElement("a");
            anchor.href = imageUrl;
            anchor.download = `${snapshotFileName || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "laboratory-plot")}.png`;
            anchor.click();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Snapshot export bajarilmadi.");
        } finally {
            setIsExportingSnapshot(false);
        }
    }, [height, snapshotFileName, title]);

    const cameraPresets = useMemo(
        () => [
            {
                id: "iso",
                label: "Iso",
                camera: defaultCamera,
            },
            {
                id: "top",
                label: "Top",
                camera: { eye: { x: 0.01, y: 0.01, z: 2.3 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } },
            },
            {
                id: "front",
                label: "Front",
                camera: { eye: { x: 0, y: -2.35, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
            },
            {
                id: "side",
                label: "Side",
                camera: { eye: { x: 2.35, y: 0, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
            },
        ],
        [defaultCamera],
    );

    useEffect(() => {
        const graphDiv = graphRef.current;
        if (!graphDiv || typeof graphDiv.on !== "function") {
            return;
        }

        const handleContextLost = () => {
            setError("WebGL context reset bo'ldi. Grafik qayta tiklanmoqda.");
            setRevision((current) => current + 1);
        };

        graphDiv.on("plotly_webglcontextlost", handleContextLost);

        return () => {
            if (typeof graphDiv.removeListener === "function") {
                graphDiv.removeListener("plotly_webglcontextlost", handleContextLost);
            }
        };
    }, [revision]);

    if (!hasData) {
        return (
            <div className={`flex h-[${height}px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/60 bg-background/40 p-10 ${className || ""}`}>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">No plot data</div>
                <p className="mt-3 max-w-md text-center text-sm leading-6 text-muted-foreground">
                    Vizualizatsiya uchun yetarli nuqta yoki surface ma&apos;lumot hali tayyor emas.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`site-panel relative overflow-hidden border-border/50 bg-background/35 p-1 shadow-[0_40px_100px_-52px_rgba(15,23,42,0.55)] transition-all duration-500 hover:shadow-[0_52px_110px_-52px_rgba(15,23,42,0.62)] ${className || ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.13),transparent_72%)] blur-3xl" />

            <div className={`absolute right-4 top-4 z-40 flex gap-2 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 md:opacity-35"}`}>
                <button
                    type="button"
                    onClick={handleHardRefresh}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground/40 hover:text-foreground"
                    title="Grafikni qayta qurish"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={handleSnapshotExport}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground/40 hover:text-foreground"
                    title="PNG snapshot eksport"
                    disabled={isExportingSnapshot}
                >
                    {isExportingSnapshot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
                {is3D ? (
                    <button
                        type="button"
                        onClick={handleResetCamera}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground/40 hover:text-foreground"
                        title="3D kamerani tiklash"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <div className="pointer-events-none absolute left-5 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]" />
                {is3D ? "3D engine stable" : "2D engine stable"}
            </div>

            {is3D ? (
                <div className="absolute left-5 top-16 z-30 flex flex-wrap gap-2">
                    {cameraPresets.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyCameraPreset(preset.camera)}
                            className="rounded-full border border-border/45 bg-background/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition hover:border-foreground/40 hover:text-foreground"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {insights?.length ? (
                <div className="absolute inset-x-5 top-28 z-30 flex flex-wrap gap-2">
                    {insights.map((insight) => (
                        <div
                            key={insight}
                            className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-sky-700 backdrop-blur dark:text-sky-200"
                        >
                            {insight}
                        </div>
                    ))}
                </div>
            ) : null}

            {error ? (
                <div className="absolute inset-x-4 bottom-4 z-40 rounded-2xl border border-amber-400/30 bg-amber-500/12 px-4 py-3 text-sm text-amber-700 backdrop-blur dark:text-amber-300">
                    <div className="inline-flex items-center gap-2 font-bold">
                        <AlertTriangle className="h-4 w-4" />
                        Plot recovery notice
                    </div>
                    <div className="mt-1 leading-6">{error}</div>
                </div>
            ) : null}

            <Plot
                key={`${revision}-${cameraRevision}`}
                revision={revision}
                data={data}
                layout={finalizedLayout}
                config={finalizedConfig}
                useResizeHandler={true}
                style={{ width: "100%", height: `${height}px` }}
                className="relative z-10 h-full w-full"
                onInitialized={(_, graphDiv) => {
                    graphRef.current = graphDiv;
                }}
                onUpdate={(_, graphDiv) => {
                    graphRef.current = graphDiv;
                }}
                onError={(nextError) => {
                    setError(nextError instanceof Error ? nextError.message : "Plotly render xatosi.");
                }}
            />
        </div>
    );
}
