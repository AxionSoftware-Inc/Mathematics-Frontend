import React from "react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot } from "@/components/laboratory/scientific-plot";
import { 
    IntegralMode, 
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary
} from "../types";
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

const { formatMetric } = LaboratoryFormattingService;

interface VisualizerDeckProps {
    mode: IntegralMode;
    summary: IntegralComputationSummary | null;
    previewVisualization: any;
    expression: string;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    doubleProfiles: any;
    tripleProfile: any;
    lower: string;
    upper: string;
    isResultStale?: boolean;
}

export function VisualizerDeck({
    mode,
    summary,
    previewVisualization,
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
    const singleSeriesPoints =
        mode === "single" && (isResultStale || !summary) && previewVisualization?.kind === "single"
            ? previewVisualization.samples
            : mode === "single" && summary
              ? (summary as SingleIntegralSummary).samples
              : [];
    const showSinglePreview = mode === "single" && previewVisualization?.kind === "single" && (isResultStale || !summary);

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
                                {mode === "single" ? (
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
                                {previewVisualization.kind === "single" ? (
                                    <CartesianPlot 
                                        title="Function preview" 
                                        highlightInterval={{ start: Number(lower), end: Number(upper) }}
                                        series={[{ label: "f(x)", color: "var(--accent)", points: previewVisualization.samples }]} 
                                    />
                                ) : previewVisualization.kind === "double" ? (
                                    <ScientificPlot
                                        type="surface"
                                        data={previewVisualization.summary.samples as Array<Record<string, unknown>>}
                                        title={`Preview: f(x,y) = ${expression}`}
                                        insights={[`${previewVisualization.gridLabel} preview grid`, "surface preview"]}
                                    />
                                ) : (
                                    <ScientificPlot
                                        type="volume"
                                        data={previewVisualization.summary.samples as Array<Record<string, unknown>>}
                                        title={`Preview: f(x,y,z) = ${expression}`}
                                        insights={[`${previewVisualization.gridLabel} preview grid`, "volume preview"]}
                                    />
                                )}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card bg-background p-4 shadow-sm">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Preview status</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">Lightweight visual ready</div>
                                </div>
                                <div className="site-outline-card bg-background p-4 shadow-sm">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mode</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{mode === "single" ? "Function trace" : mode === "double" ? "Surface preview" : "Volume preview"}</div>
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
