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

function sectionSpan(weight = 1) {
    if (weight >= 3) return "xl:col-span-8";
    if (weight === 2) return "xl:col-span-6";
    return "xl:col-span-4";
}

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
                <section>
                    <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">Comparison overview</div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {overviewCards.map((card, index) => (
                            <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${index}`} {...card} />
                        ))}
                    </div>
                </section>
            ) : null}

            {methodRows.length ? (
                <section>
                    <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">Method comparison</div>
                    <MethodIntelligenceTable rows={methodRows} />
                </section>
            ) : null}

            {sections.length ? (
                <section
                    className="border-t border-[#e6e9ee] pt-5"
                    style={{ contentVisibility: "auto", containIntrinsicSize: "720px" }}
                >
                    <div className="mb-3 px-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">Evidence & diagnostics</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Read the comparison in a fixed order</div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:[grid-auto-flow:dense]">
                        {sections.map((section) => (
                            <div key={section.id} className={`min-w-0 ${sectionSpan(section.weight)}`}>
                                {section.node}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
