import React from "react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot, buildScatter3DTrajectoryData } from "@/components/laboratory/scientific-plot";
import { 
    IntegralMode, 
    IntegralAnalyticSolveResponse,
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary
} from "../types";
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

const { formatMetric } = LaboratoryFormattingService;

type GeometryCurvePreview = {
    kind: string;
    lane: string;
    plotKind: string;
    title: string;
    details: string[];
    samples: Array<{ x: number; y: number; z?: number }>;
    dimension?: "2d" | "3d";
};

type GeometrySurfacePreview = {
    kind: string;
    lane: string;
    plotKind: string;
    title: string;
    details: string[];
    samples: Array<{ x: number; y: number; z: number }>;
};

type PreviewVisualization =
    | GeometryCurvePreview
    | GeometrySurfacePreview
    | {
        kind: string;
        samples: Array<{ x: number; y: number }>;
    }
    | {
        kind: string;
        gridLabel: string;
        summary: DoubleIntegralSummary | TripleIntegralSummary;
    }
    | null;

type SingleDiagnosticsLike = {
    relativeSpread?: number;
    stability?: string;
} | null;

type DoubleDiagnosticsLike = {
    gridCells?: number;
    peak?: number;
    mean?: number;
} | null;

type TripleDiagnosticsLike = {
    gridCells?: number;
    peak?: number;
    voxelVolume?: number;
} | null;

type DoubleProfilesLike = {
    xProfile: Array<{ x: number; y: number }>;
    yProfile: Array<{ x: number; y: number }>;
} | null;

type TripleProfileLike = Array<{ x: number; y: number }> | null;

interface VisualizerDeckProps {
    mode: IntegralMode;
    summary: IntegralComputationSummary | null;
    previewVisualization: PreviewVisualization;
    analyticSolution?: IntegralAnalyticSolveResponse | null;
    expression: string;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    singleDiagnostics: SingleDiagnosticsLike;
    doubleDiagnostics: DoubleDiagnosticsLike;
    tripleDiagnostics: TripleDiagnosticsLike;
    doubleProfiles: DoubleProfilesLike;
    tripleProfile: TripleProfileLike;
    lower: string;
    upper: string;
    isResultStale?: boolean;
}

export function VisualizerDeck({
    mode,
    summary,
    previewVisualization,
    analyticSolution,
    expression,
    normalizedXResolution,
    normalizedYResolution,
    normalizedZResolution,
    singleDiagnostics,
    doubleDiagnostics,
    tripleDiagnostics,
    doubleProfiles,
    tripleProfile,
    lower,
    upper,
    isResultStale = false,
}: VisualizerDeckProps) {
    const previewSamples = previewVisualization && "samples" in previewVisualization ? previewVisualization.samples : [];
    const previewDetails = previewVisualization && "details" in previewVisualization ? previewVisualization.details : [];
    const previewLane = previewVisualization && "lane" in previewVisualization ? previewVisualization.lane : "";
    const previewTitle = previewVisualization && "title" in previewVisualization ? previewVisualization.title : "";
    const previewPlotKind = previewVisualization && "plotKind" in previewVisualization ? previewVisualization.plotKind : "";
    const previewSummary = previewVisualization && "summary" in previewVisualization ? previewVisualization.summary : null;
    const previewGridLabel = previewVisualization && "gridLabel" in previewVisualization ? previewVisualization.gridLabel : "Lightweight";
    const singleSeriesPoints =
        mode === "single" && (isResultStale || !summary) && previewVisualization?.kind === "single"
            ? previewSamples
            : mode === "single" && summary
              ? (summary as SingleIntegralSummary).samples
              : [];
    const showSinglePreview = mode === "single" && previewVisualization?.kind === "single" && (isResultStale || !summary);
    const showGeometryPreview = mode === "single" && previewVisualization?.kind === "geometry";
    const renderGeometryPreview = () => {
        if (!showGeometryPreview) {
            return null;
        }

        if (previewPlotKind === "curve3d") {
            return (
                <ScientificPlot
                    type="scatter3d"
                    data={buildScatter3DTrajectoryData(previewSamples, { label: "Parametric path" }) as Array<Record<string, unknown>>}
                    title={previewTitle}
                    insights={["3D parametric path", "trajectory, head/tail, and projections"]}
                />
            );
        }

        if (previewPlotKind === "surface") {
            return (
                <ScientificPlot
                    type="surface"
                    data={previewSamples as Array<Record<string, unknown>>}
                    title={previewTitle}
                    insights={["parametric patch preview", "lightweight geometry surface"]}
                />
            );
        }

        if (previewPlotKind === "complex-plane") {
            const poleTraces = analyticSolution?.exact.residue_analysis?.enclosed_poles.length
                ? [
                    {
                        type: "scatter",
                        mode: "markers+text",
                        x: analyticSolution.exact.residue_analysis.enclosed_poles.map((pole) => pole.pole.real),
                        y: analyticSolution.exact.residue_analysis.enclosed_poles.map((pole) => pole.pole.imag),
                        text: analyticSolution.exact.residue_analysis.enclosed_poles.map((pole) => pole.residue_latex),
                        textposition: "top center",
                        marker: { size: 11, color: "#ef4444" },
                        name: "Enclosed poles",
                        hovertemplate: "Re=%{x:.4f}<br>Im=%{y:.4f}<br>Residue=%{text}<extra></extra>",
                    },
                ]
                : [];
            return (
                <ScientificPlot
                    type="scatter2d"
                    data={[
                        {
                            type: "scatter",
                            mode: "lines",
                            x: previewSamples.map((point: { x: number; y: number }) => point.x),
                            y: previewSamples.map((point: { x: number; y: number }) => point.y),
                            line: { width: 3, color: "#2563eb" },
                            name: "Contour path",
                            hovertemplate: "Re=%{x:.4f}<br>Im=%{y:.4f}<extra></extra>",
                        },
                        ...poleTraces,
                    ] as Array<Record<string, unknown>>}
                    title={previewTitle}
                    insights={[
                        "complex-plane contour trace",
                        analyticSolution?.exact.residue_analysis
                            ? `${analyticSolution.exact.residue_analysis.enclosed_poles.length} enclosed pole markers`
                            : "path orientation audit",
                    ]}
                />
            );
        }

        return (
            <CartesianPlot
                title={previewTitle}
                series={[
                    {
                        label: previewLane === "contour" ? "Contour path" : "Parametric path",
                        color: "var(--accent)",
                        points: previewSamples,
                    },
                ]}
            />
        );
    };

    return (
        <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
            <div className="mt-3">
                <div className="site-panel-strong p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="site-eyebrow text-accent">Primary Visualization</div>
                        <div className="flex flex-wrap gap-2">
                            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {mode === "single" ? "2D plot" : mode === "double" ? "3D surface" : "3D volume"}
                            </div>
                            {((!summary && previewVisualization) || showSinglePreview) ? (
                                <div className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                                    Preview
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {summary || showSinglePreview ? (
                        <>
                            <div className="w-full">
                                {showGeometryPreview ? (
                                    <div className="grid gap-4">
                                        {renderGeometryPreview()}
                                        <div className="rounded-2xl border border-border/60 bg-background px-4 py-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Geometry Preview</div>
                                            <div className="mt-2 text-lg font-black text-foreground">{previewTitle}</div>
                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                {previewDetails.map((detail: string) => (
                                                    <div key={detail} className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-sm font-medium text-foreground">
                                                        {detail}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : mode === "single" ? (
                                    <CartesianPlot 
                                        title={showSinglePreview ? "Function preview" : "Function trace"}
                                        highlightInterval={{ start: Number(lower), end: Number(upper) }}
                                        series={[{ label: "f(x)", color: "var(--accent)", points: singleSeriesPoints }]} 
                                    />
                                ) : mode === "double" ? (
                                    <ScientificPlot
                                        type="surface"
                                        data={(summary as DoubleIntegralSummary).samples as Array<Record<string, unknown>>}
                                        title={`f(x,y) = ${expression}`}
                                        insights={[`${normalizedXResolution}x${normalizedYResolution} midpoint grid`, "surface relief", "x/y profile slices"]}
                                    />
                                ) : (
                                    <ScientificPlot
                                        type="volume"
                                        data={(summary as TripleIntegralSummary).samples as Array<Record<string, unknown>>}
                                        title={`f(x,y,z) = ${expression}`}
                                        insights={[`${normalizedXResolution}x${normalizedYResolution}x${normalizedZResolution} grid`, "volumetric isosurface", "density profile"]}
                                    />
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-4">
                                {mode === "single" && summary && !showSinglePreview ? (
                                    <>
                                        <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Simpson</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).simpson, 6)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Midpoint</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).midpoint, 6)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Trapezoid</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).trapezoid, 6)}</div></div>
                                        <div className="site-outline-card bg-muted/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Spread</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(singleDiagnostics?.relativeSpread || 0, 6)}</div><div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{singleDiagnostics?.stability}</div></div>
                                    </>
                                ) : showGeometryPreview ? (
                                    <>
                                        <div className="site-outline-card border-sky-500/20 bg-sky-500/10 p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Geometry lane</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">{previewLane}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Preview state</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">Parametric setup ready</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Solve path</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">Backend geometry solver</div>
                                        </div>
                                        <div className="site-outline-card bg-background p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Next step</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">Analyze and solve</div>
                                        </div>
                                    </>
                                ) : mode === "single" ? (
                                    <>
                                        <div className="site-outline-card border-sky-500/20 bg-sky-500/10 p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Preview status</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">Live trace ready</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Interval</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">
                                                [{lower}, {upper}]
                                            </div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Samples</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">{singleSeriesPoints.length}</div>
                                        </div>
                                        <div className="site-outline-card bg-background p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Next step</div>
                                            <div className="mt-2 text-sm font-bold text-foreground">Analyze and solve</div>
                                        </div>
                                    </>
                                ) : mode === "double" ? (
                                    <>
                                        <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Integral value</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as DoubleIntegralSummary).value, 6)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Grid cells</div><div className="mt-1 font-serif text-xl font-black">{doubleDiagnostics?.gridCells}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Peak height</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(doubleDiagnostics?.peak, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mean height</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(doubleDiagnostics?.mean, 4)}</div></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Integral value</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as TripleIntegralSummary).value, 6)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Grid cells</div><div className="mt-1 font-serif text-xl font-black">{tripleDiagnostics?.gridCells}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Peak density</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(tripleDiagnostics?.peak, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Voxel volume</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(tripleDiagnostics?.voxelVolume, 4)}</div></div>
                                    </>
                                )}
                            </div>

                            {mode === "double" && doubleProfiles ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <CartesianPlot title="x-average height profile" series={[{ label: "x-average", color: "#2563eb", points: doubleProfiles.xProfile }]} />
                                    <CartesianPlot title="y-average height profile" series={[{ label: "y-average", color: "#14b8a6", points: doubleProfiles.yProfile }]} />
                                </div>
                            ) : null}

                            {mode === "triple" && tripleProfile ? (
                                <CartesianPlot title="x-average density profile" series={[{ label: "density", color: "#7c3aed", points: tripleProfile }]} />
                            ) : null}
                        </>
                    ) : previewVisualization ? (
                        <>
                            <div className="rounded-2xl border border-sky-500/20 bg-background px-4 py-3 text-sm leading-7 text-muted-foreground shadow-sm">
                                Bu yengil preview. To&apos;liq natija, jadval va compare metric&apos;lar numerik solve tasdiqlangandan keyin chiqadi.
                            </div>
                            <div className="w-full">
                                {previewVisualization.kind === "geometry" ? (
                                    <div className="grid gap-4">
                                        {renderGeometryPreview()}
                                        <div className="rounded-2xl border border-border/60 bg-background px-4 py-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Geometry Preview</div>
                                            <div className="mt-2 text-lg font-black text-foreground">{previewTitle}</div>
                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                {previewDetails.map((detail: string) => (
                                                    <div key={detail} className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-sm font-medium text-foreground">
                                                        {detail}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : previewVisualization.kind === "single" ? (
                                    <CartesianPlot 
                                        title="Function preview" 
                                        highlightInterval={{ start: Number(lower), end: Number(upper) }}
                                        series={[{ label: "f(x)", color: "var(--accent)", points: previewSamples }]} 
                                    />
                                ) : previewVisualization.kind === "double" ? (
                                    <ScientificPlot
                                        type="surface"
                                        data={previewSummary?.samples as Array<Record<string, unknown>>}
                                        title={`Preview: f(x,y) = ${expression}`}
                                        insights={[`${previewGridLabel} preview grid`, "surface preview"]}
                                    />
                                ) : (
                                    <ScientificPlot
                                        type="volume"
                                        data={previewSummary?.samples as Array<Record<string, unknown>>}
                                        title={`Preview: f(x,y,z) = ${expression}`}
                                        insights={[`${previewGridLabel} preview grid`, "volume preview"]}
                                    />
                                )}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card bg-background p-4 shadow-sm">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Preview status</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{previewVisualization.kind === "geometry" ? "Geometry setup ready" : "Lightweight visual ready"}</div>
                                </div>
                                <div className="site-outline-card bg-background p-4 shadow-sm">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mode</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{previewVisualization.kind === "geometry" ? `${previewLane} lane` : mode === "single" ? "Function trace" : mode === "double" ? "Surface preview" : "Volume preview"}</div>
                                </div>
                                <div className="site-outline-card bg-background p-4 shadow-sm">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Next step</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">Solve confirmation needed</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-8 text-sm leading-7 text-muted-foreground">
                            Grafik va asosiy metric&apos;lar numerik result chiqqandan keyin shu yerda birinchi bo&apos;lib ko&apos;rinadi.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
