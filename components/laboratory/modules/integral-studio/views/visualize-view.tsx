import React from "react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";

import { VisualizerDeck } from "../components/visualizer-deck";
import { StudioMetricCard, StudioSignal } from "../presentation-types";
import type { IntegralExperienceLevel } from "../types";

type SweepSeriesLike = {
    title: string;
    plotSeries: React.ComponentProps<typeof CartesianPlot>["series"];
    metricLabel: string;
} | null;

type VisualizeViewProps = {
    visualizerProps: React.ComponentProps<typeof VisualizerDeck>;
    staleOverlay: React.ReactNode;
    stalePanelClassName: string;
    mode: "single" | "double" | "triple";
    methodTableRows: string[][];
    sampleTableRows: string[][];
    visualizeOverviewCards: StudioMetricCard[];
    methodAuditCards: StudioMetricCard[];
    visibleSignals: StudioSignal[];
    sweepSeries: SweepSeriesLike;
    sweepTableRows: string[][];
    sweepStart: string;
    setSweepStart: (value: string) => void;
    sweepEnd: string;
    setSweepEnd: (value: string) => void;
    experienceLevel: IntegralExperienceLevel;
};

export function VisualizeView({
    visualizerProps,
    staleOverlay,
    stalePanelClassName,
    mode,
    methodTableRows,
    sampleTableRows,
    visualizeOverviewCards,
    methodAuditCards,
    visibleSignals,
    sweepSeries,
    sweepTableRows,
    sweepStart,
    setSweepStart,
    sweepEnd,
    setSweepEnd,
    experienceLevel,
}: VisualizeViewProps) {
    const showTables = experienceLevel !== "beginner";
    const showSweep = experienceLevel === "research";
    const showSignals = experienceLevel === "research";
    const auditCards = experienceLevel === "advanced" ? visualizeOverviewCards : [...visualizeOverviewCards, ...methodAuditCards];

    return (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <VisualizerDeck {...visualizerProps} />
                    </div>
                </div>
                {showTables ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={`grid gap-8 lg:grid-cols-2 ${stalePanelClassName}`}>
                        <LaboratoryDataTable eyebrow="Metrics" title="Computation Audit" columns={["Metric", "Value", "Notes"]} rows={methodTableRows} emptyMessage="No metrics" />
                        <LaboratoryDataTable
                            eyebrow="Samples"
                            title="Rendered Data Points"
                            columns={mode === "single" ? ["x", "y"] : mode === "double" ? ["x", "y", "z"] : ["x", "y", "z", "val"]}
                            rows={sampleTableRows}
                            emptyMessage="No samples"
                        />
                    </div>
                </div>
                ) : null}
            </div>
            <div className="space-y-8">
                <div className="relative">
                    {staleOverlay}
                    <div className={`site-panel space-y-4 p-5 ${stalePanelClassName}`}>
                        <div className="site-eyebrow text-accent">Visual Audit</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {auditCards.map((card) => (
                                <LaboratoryMetricCard key={`visual-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                </div>
                {showSweep ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={`site-panel space-y-6 p-6 ${stalePanelClassName}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow text-accent">Sensitivity Sweep</div>
                                <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                    Segment yoki grid zichligi o&apos;zgarganda estimate driftini shu yerda kuzatasiz.
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input value={sweepStart} onChange={(e) => setSweepStart(e.target.value)} className="site-input w-20 text-center" />
                                <input value={sweepEnd} onChange={(e) => setSweepEnd(e.target.value)} className="site-input w-20 text-center" />
                            </div>
                        </div>
                        {sweepSeries ? (
                            <div className="grid gap-6">
                                <CartesianPlot title={sweepSeries.title} series={sweepSeries.plotSeries} />
                                <LaboratoryDataTable
                                    eyebrow="Sweep Table"
                                    title="Detailed Drift"
                                    columns={sweepSeries.metricLabel === "segments" ? ["Segments", "Simpson", "Midpoint", "Trapezoid"] : ["Grid", "Estimate", "Samples", "Z-Grid"]}
                                    rows={sweepTableRows}
                                    emptyMessage="No sweep"
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-6 text-sm leading-7 text-muted-foreground">
                                Sweep jadvali expression va domain yaroqli bo&apos;lganda shu yerda quriladi.
                            </div>
                        )}
                    </div>
                </div>
                ) : null}
                {showSignals ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <LaboratorySignalPanel eyebrow="Runtime Signals" title="Visualization validation" items={visibleSignals} />
                    </div>
                </div>
                ) : null}
            </div>
        </div>
    );
}
