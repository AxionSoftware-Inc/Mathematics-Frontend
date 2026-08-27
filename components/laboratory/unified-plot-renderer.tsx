"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
            <div className="flex h-[420px] items-center justify-center rounded-[10px] border border-[#e1e5eb] bg-[#fbfcfe]">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-[#737c88]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#184eb8]" />
                    Initializing plot engine
                </div>
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

type PlotlyModuleLike = {
    relayout: (target: unknown, update: Record<string, unknown>) => Promise<unknown>;
    toImage: (target: unknown, options: Record<string, unknown>) => Promise<string>;
};

type PlotGraphDivLike = HTMLElement;

const THREE_D_TRACE_TYPES = new Set(["scatter3d", "surface", "mesh3d", "volume"]);

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
    const [error, setError] = useState<string | null>(null);
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
            gridcolor: "rgba(148,163,184,0.16)",
            zerolinecolor: "rgba(100,116,139,0.24)",
            tickfont: { size: 10, color: "#66707d" },
            titlefont: { size: 11, color: "#303740" },
            showbackground: false,
            showspikes: false,
        };

        const baseLayout: Partial<Layout> = {
            title: title
                ? {
                      text: title,
                      font: { family: "var(--font-playfair)", size: 14, color: "#171a20" },
                      x: 0.025,
                      xanchor: "left",
                  }
                : undefined,
            autosize: true,
            height,
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            margin: { l: 24, r: 20, b: 34, t: title ? 52 : 22 },
            font: { family: "var(--font-inter)", color: "#4f5965" },
            showlegend: data.some((trace) => typeof trace?.name === "string" && trace.name.trim().length > 0),
            legend: {
                orientation: "h",
                x: 0,
                y: -0.12,
                bgcolor: "rgba(255,255,255,0)",
                font: { size: 10, color: "#606a76" },
            },
            hovermode: is3D ? false : "closest",
            uirevision: is3D ? "mathsphere-3d" : "mathsphere-2d",
        };

        const merged = { ...baseLayout, ...layoutOverrides } as Partial<Layout>;

        if (is3D) {
            merged.scene = {
                xaxis: { ...axisStyle, title: { text: "x" }, ...(layoutOverrides?.scene?.xaxis || {}) },
                yaxis: { ...axisStyle, title: { text: "y" }, ...(layoutOverrides?.scene?.yaxis || {}) },
                zaxis: { ...axisStyle, title: { text: "z" }, ...(layoutOverrides?.scene?.zaxis || {}) },
                dragmode: "orbit",
                aspectmode: "data",
                camera: layoutOverrides?.scene?.camera || defaultCamera,
                bgcolor: "rgba(255,255,255,0)",
                ...(layoutOverrides?.scene || {}),
            };
            delete merged.xaxis;
            delete merged.yaxis;
        } else {
            merged.xaxis = { ...axisStyle, ...(layoutOverrides?.xaxis || {}) };
            merged.yaxis = { ...axisStyle, ...(layoutOverrides?.yaxis || {}) };
            delete merged.scene;
        }

        return merged;
    }, [data, defaultCamera, height, is3D, layoutOverrides, title]);

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

    const applyCamera = useCallback(async (camera: { eye: { x: number; y: number; z: number }; center: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }) => {
        if (!graphRef.current) return;
        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            await plotly.relayout(graphRef.current, { "scene.camera": camera });
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Camera update failed.");
        }
    }, []);

    const handleSnapshotExport = useCallback(async () => {
        if (!graphRef.current) return;
        setIsExportingSnapshot(true);
        setError(null);
        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            const imageUrl = await plotly.toImage(graphRef.current, {
                format: "png",
                width: 1400,
                height: Math.max(800, Math.round(height * 1.7)),
                scale: 1.5,
            });
            const anchor = document.createElement("a");
            anchor.href = imageUrl;
            anchor.download = `${snapshotFileName || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "laboratory-plot")}.png`;
            anchor.click();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Snapshot export failed.");
        } finally {
            setIsExportingSnapshot(false);
        }
    }, [height, snapshotFileName, title]);

    const cameraPresets = useMemo(
        () => [
            { id: "iso", label: "Iso", camera: defaultCamera },
            { id: "top", label: "Top", camera: { eye: { x: 0.01, y: 0.01, z: 2.3 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } } },
            { id: "front", label: "Front", camera: { eye: { x: 0, y: -2.35, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } } },
            { id: "side", label: "Side", camera: { eye: { x: 2.35, y: 0, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } } },
        ],
        [defaultCamera],
    );

    if (!hasData) {
        return (
            <div className={`flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#dfe4ea] bg-[#fbfcfe] p-10 ${className || ""}`} style={{ height }}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b8490]">No plot data</div>
                <p className="mt-2 max-w-md text-center text-sm leading-6 text-[#727b87]">Visualization data is not ready yet.</p>
            </div>
        );
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-[10px] border border-[#e0e5eb] bg-white ${className || ""}`}
            style={{ contain: "layout paint" }}
        >
            <div className="absolute right-3 top-3 z-40 flex gap-1.5 opacity-40 md:opacity-25 md:group-hover:opacity-100">
                <button type="button" onClick={handleHardRefresh} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#dfe4ea] bg-white text-[#69727e]" title="Refresh plot">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleSnapshotExport} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#dfe4ea] bg-white text-[#69727e]" title="Export PNG" disabled={isExportingSnapshot}>
                    {isExportingSnapshot ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </button>
                {is3D ? (
                    <button type="button" onClick={() => applyCamera(defaultCamera)} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#dfe4ea] bg-white text-[#69727e]" title="Reset camera">
                        <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>

            {is3D ? (
                <div className="absolute left-3 top-3 z-30 flex gap-1.5">
                    {cameraPresets.map((preset) => (
                        <button key={preset.id} type="button" onClick={() => applyCamera(preset.camera)} className="rounded-[6px] border border-[#e0e5eb] bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#68717d]">
                            {preset.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {insights?.length ? (
                <div className="absolute inset-x-3 top-12 z-30 flex flex-wrap gap-1.5">
                    {insights.map((insight) => (
                        <div key={insight} className="rounded-[6px] border border-[#d8e5f8] bg-[#f4f8ff] px-2 py-1 text-[9px] font-semibold text-[#315f9e]">{insight}</div>
                    ))}
                </div>
            ) : null}

            {error ? (
                <div className="absolute inset-x-3 bottom-3 z-40 rounded-[8px] border border-[#f1d7a0] bg-[#fff9eb] px-3 py-2 text-xs text-[#8a5a05]">
                    <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-3.5 w-3.5" />Plot notice</div>
                    <div className="mt-1">{error}</div>
                </div>
            ) : null}

            <Plot
                key={revision}
                revision={revision}
                data={data}
                layout={finalizedLayout}
                config={finalizedConfig}
                useResizeHandler={true}
                style={{ width: "100%", height: `${height}px` }}
                className="h-full w-full"
                onInitialized={(_, graphDiv) => {
                    graphRef.current = graphDiv as unknown as HTMLElement;
                }}
                onUpdate={(_, graphDiv) => {
                    graphRef.current = graphDiv as unknown as HTMLElement;
                }}
                onError={(nextError) => {
                    setError(nextError instanceof Error ? nextError.message : "Plot rendering failed.");
                }}
            />
        </div>
    );
}
