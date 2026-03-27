import React from "react";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySolveLayout } from "@/components/laboratory/laboratory-solve-layout";
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
    solveOverviewCards: StudioMetricCard[];
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
    solveOverviewCards,
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
    const resultSection = (
        <div className="site-panel space-y-3 p-4">
            <div className="site-eyebrow text-accent">Final Result</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {solveOverviewCards.map((card) => (
                    <LaboratoryMetricCard key={`solve-${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );
    const methodTraceSection = showMethodTrace ? (
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
    ) : null;
    const exactStepsSection = exactSteps.length ? (
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
    ) : null;
    const auditSection = (
        <div className="site-panel space-y-3 p-4">
            <div className="site-eyebrow text-sky-600">Method Audit</div>
            <div className="grid gap-3 sm:grid-cols-3">
                {methodAuditCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );
    const signalsSection = <LaboratorySignalPanel eyebrow="Runtime Signals" title="Validation va solver holati" items={visibleSignals} />;
    const assumptionsSection = (
        <div className="site-panel space-y-3 p-4">
            <div className="site-eyebrow text-amber-600">Assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
                {assumptionCards.map((card) => (
                    <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </div>
    );

    return (
        <LaboratorySolveLayout
            control={<SolverControl {...solverControlProps} />}
            visual={
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <VisualizerDeck {...visualizerProps} />
                    </div>
                </div>
            }
            derivation={
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
            }
            sections={[
                { id: "result", node: resultSection, weight: 2 },
                methodTraceSection ? { id: "method-trace", node: methodTraceSection, weight: 2 } : null,
                exactStepsSection ? { id: "exact-steps", node: exactStepsSection, weight: 2 } : null,
                { id: "audit", node: auditSection, weight: 1 },
                { id: "signals", node: signalsSection, weight: 1 },
                { id: "assumptions", node: assumptionsSection, weight: 1 },
            ].filter(Boolean) as { id: string; node: React.ReactNode; weight?: number }[]}
        />
    );
}
