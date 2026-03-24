import React from "react";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";

import { SolverControl } from "../components/solver-control";
import { VisualizerDeck } from "../components/visualizer-deck";
import { StudioExactStep, StudioMetricCard, StudioSignal } from "../presentation-types";

type SolveViewProps = {
    solverControlProps: React.ComponentProps<typeof SolverControl>;
    visualizerProps: React.ComponentProps<typeof VisualizerDeck>;
    staleOverlay: React.ReactNode;
    stalePanelClassName: string;
    analyticDerivationTitle: string;
    analyticDerivationContent: string;
    analyticDerivationAccentClassName: string;
    showMethodTrace: boolean;
    methodTraceContent: string;
    exactSteps: StudioExactStep[];
    methodAuditCards: StudioMetricCard[];
    visibleSignals: StudioSignal[];
    assumptionCards: StudioMetricCard[];
};

export function SolveView({
    solverControlProps,
    visualizerProps,
    staleOverlay,
    stalePanelClassName,
    analyticDerivationTitle,
    analyticDerivationContent,
    analyticDerivationAccentClassName,
    showMethodTrace,
    methodTraceContent,
    exactSteps,
    methodAuditCards,
    visibleSignals,
    assumptionCards,
}: SolveViewProps) {
    return (
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
                <SolverControl {...solverControlProps} />
                <div className="space-y-4">
                    <div className="relative">
                        {staleOverlay}
                        <div className={stalePanelClassName}>
                            <LaboratoryMathPanel
                                eyebrow="Analytic Derivation"
                                title={analyticDerivationTitle}
                                content={analyticDerivationContent}
                                accentClassName={analyticDerivationAccentClassName}
                            />
                        </div>
                    </div>
                    {showMethodTrace ? (
                        <div className="relative">
                            {staleOverlay}
                            <div className={stalePanelClassName}>
                                <LaboratoryMathPanel
                                    eyebrow="Method Trace"
                                    title="Derivation strategy"
                                    content={methodTraceContent}
                                    accentClassName="text-sky-600"
                                />
                            </div>
                        </div>
                    ) : null}
                    {exactSteps.length ? (
                        <div className="relative">
                            {staleOverlay}
                            <div className={`grid gap-4 ${stalePanelClassName}`}>
                                {exactSteps.map((step, index) => (
                                    <LaboratorySolveDetailCard
                                        key={`${step.title}-${index}`}
                                        id={String(index + 1)}
                                        action={step.title}
                                        result={step.summary}
                                        formula={step.latex ? `$$${step.latex}$$` : undefined}
                                        tone={step.tone}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="space-y-8">
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <VisualizerDeck {...visualizerProps} />
                    </div>
                </div>
                <div className="relative">
                    {staleOverlay}
                    <div className={`grid gap-4 ${stalePanelClassName}`}>
                        <div className="site-panel space-y-3 p-4">
                            <div className="site-eyebrow text-sky-600">Method Audit</div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {methodAuditCards.map((card) => (
                                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                ))}
                            </div>
                        </div>
                        <LaboratorySignalPanel eyebrow="Runtime Signals" title="Validation va solver holati" items={visibleSignals} />
                        <div className="site-panel space-y-3 p-4">
                            <div className="site-eyebrow text-amber-600">Assumptions</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {assumptionCards.map((card) => (
                                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
