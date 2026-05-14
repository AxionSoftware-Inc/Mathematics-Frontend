import React from "react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { MethodIntelligenceTable } from "@/components/laboratory/method-intelligence-table";
import { getLaboratoryMethodOptions, type LaboratoryMethodModule } from "@/components/laboratory/method-selector/method-registry";
import { buildMethodIntelligenceRows } from "@/lib/method-intelligence";

type CompareMetric = React.ComponentProps<typeof LaboratoryMetricCard>;
type CompareSection = {
    id: string;
    title: string;
    node: React.ReactNode;
    weight?: number;
};

export function LaboratoryCompareLayout({
    overviewCards = [],
    sections = [],
    methodModule,
    selectedMethod = "auto",
    exactResult,
    numericResult,
    elapsedMs = null,
}: {
    overviewCards?: CompareMetric[];
    sections?: CompareSection[];
    methodModule?: LaboratoryMethodModule;
    selectedMethod?: string;
    exactResult?: string;
    numericResult?: string;
    elapsedMs?: number | null;
}) {
    const methodRows = React.useMemo(
        () =>
            methodModule
                ? buildMethodIntelligenceRows({
                      options: getLaboratoryMethodOptions(methodModule),
                      selectedMethod,
                      exactResult,
                      numericResult,
                      elapsedMs,
                  })
                : [],
        [elapsedMs, exactResult, methodModule, numericResult, selectedMethod],
    );

    return (
        <div className="space-y-5">
            {overviewCards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card, index) => (
                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${index}`} {...card} />
                    ))}
                </div>
            ) : null}

            {methodRows.length ? <MethodIntelligenceTable rows={methodRows} /> : null}

            <div className="space-y-5 xl:columns-2 xl:gap-5 xl:space-y-0">
                {sections.map((section) => (
                    <div key={section.id} className="mb-5" style={{ breakInside: "avoid" }}>
                        {section.node}
                    </div>
                ))}
            </div>
        </div>
    );
}
