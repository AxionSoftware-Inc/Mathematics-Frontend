import React from "react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";

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
}: {
    overviewCards?: CompareMetric[];
    sections?: CompareSection[];
}) {
    return (
        <div className="space-y-5">
            {overviewCards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card, index) => (
                        <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${index}`} {...card} />
                    ))}
                </div>
            ) : null}

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
