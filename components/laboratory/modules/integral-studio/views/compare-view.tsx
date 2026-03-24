import React from "react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratoryResultLevelsPanel } from "@/components/laboratory/laboratory-result-levels-panel";

import { ScenarioPanel } from "../components/scenario-panel";
import { TrustPanel } from "../components/trust-panel";
import { StudioMetricCard } from "../presentation-types";

type CompareViewProps = {
    compareOverviewCards: StudioMetricCard[];
    trustPanelProps: React.ComponentProps<typeof TrustPanel>;
    resultLevelCards: React.ComponentProps<typeof LaboratoryResultLevelsPanel>["cards"];
    riskRegisterCards: StudioMetricCard[];
    methodAuditCards: StudioMetricCard[];
    scenarioPanelProps: React.ComponentProps<typeof ScenarioPanel>;
};

export function CompareView({
    compareOverviewCards,
    trustPanelProps,
    resultLevelCards,
    riskRegisterCards,
    methodAuditCards,
    scenarioPanelProps,
}: CompareViewProps) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
                {compareOverviewCards.map((card) => (
                    <LaboratoryMetricCard key={`compare-summary-${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-8">
                    <TrustPanel {...trustPanelProps} />
                    <LaboratoryResultLevelsPanel
                        cards={resultLevelCards}
                        eyebrow="Comparison Views"
                        description="Bir xil natijani tez, texnik va research darajada interpretatsiya qiling."
                    />
                </div>
                <div className="space-y-8">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Risk Register</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {riskRegisterCards.map((card) => (
                                <LaboratoryMetricCard key={`risk-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Method Audit Snapshot</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {methodAuditCards.map((card) => (
                                <LaboratoryMetricCard key={`compare-audit-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <ScenarioPanel {...scenarioPanelProps} />
                </div>
            </div>
        </div>
    );
}
