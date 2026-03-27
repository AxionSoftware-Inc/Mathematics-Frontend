import React from "react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";

type CompareMetric = React.ComponentProps<typeof LaboratoryMetricCard>;
type CompareSection = {
    id: string;
    title: string;
    node: React.ReactNode;
    weight?: number;
};

function distributeSections(sections: CompareSection[]) {
    const left: CompareSection[] = [];
    const right: CompareSection[] = [];
    let leftWeight = 0;
    let rightWeight = 0;

    for (const section of sections) {
        const weight = section.weight ?? 1;
        if (leftWeight <= rightWeight) {
            left.push(section);
            leftWeight += weight;
        } else {
            right.push(section);
            rightWeight += weight;
        }
    }

    return { left, right };
}

export function LaboratoryCompareLayout({
    overviewCards = [],
    sections = [],
}: {
    overviewCards?: CompareMetric[];
    sections?: CompareSection[];
}) {
    const { left, right } = distributeSections(sections);

    return (
        <div className="space-y-6">
            {overviewCards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card, index) => (
                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${index}`} {...card} />
                    ))}
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-6">
                    {left.map((section) => (
                        <React.Fragment key={section.id}>{section.node}</React.Fragment>
                    ))}
                </div>
                <div className="space-y-6">
                    {right.map((section) => (
                        <React.Fragment key={section.id}>{section.node}</React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
