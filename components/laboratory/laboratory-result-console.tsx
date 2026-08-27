import React from "react";
import { LaboratoryMetricCard } from "./laboratory-metric-card";
import { LaboratoryInlineMathMarkdown } from "./laboratory-inline-math-markdown";

interface LaboratoryResultConsoleProps {
    title?: string;
    subtitle?: string;
    result: {
        source: string;
        sourceLabel: string;
        sourceClassName: string;
        headline: string;
        subline: string;
        latex: string | null;
        confidenceLabel: string;
        confidenceDetail: string;
        confidenceClassName: string;
        nextAction: string;
    };
    workflowReadinessCards: Array<{
        eyebrow: string;
        value: string;
        detail: string;
        tone: string;
    }>;
}

export function LaboratoryResultConsole({
    title = "Result",
    subtitle = "Primary mathematical output",
    result,
    workflowReadinessCards,
}: LaboratoryResultConsoleProps) {
    return (
        <section className="overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7eaf0] px-5 py-3.5">
                <div>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">{title}</div>
                    <div className="mt-1 text-[12px] text-[#737c88]">{subtitle}</div>
                </div>
                <div className={`rounded-[7px] border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${result.sourceClassName}`}>
                    {result.sourceLabel}
                </div>
            </div>

            <div className="grid lg:grid-cols-[1.45fr_0.55fr]">
                <div className="min-w-0 px-5 py-5 lg:border-r lg:border-[#e7eaf0]">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8a929d]">Primary result</div>
                    <div className="mt-2 break-words font-serif text-[clamp(2rem,4vw,3.7rem)] leading-[1.02] tracking-[-0.045em] text-[#12151a]">
                        {result.headline}
                    </div>
                    <div className="mt-3 max-w-3xl text-[13px] leading-6 text-[#66707c]">{result.subline}</div>
                    {result.latex ? (
                        <div className="mt-4 overflow-x-auto rounded-[8px] border border-[#e2e6ec] bg-[#fbfcfe] px-4 py-3 text-[#20252c]">
                            <LaboratoryInlineMathMarkdown content={result.latex} />
                        </div>
                    ) : null}
                </div>

                <div className="grid border-t border-[#e7eaf0] lg:border-t-0">
                    <div className="border-b border-[#e7eaf0] px-4 py-4">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8a929d]">Confidence</div>
                        <div className={`mt-1.5 text-[14px] font-semibold ${result.confidenceClassName}`}>{result.confidenceLabel}</div>
                        <div className="mt-1.5 text-[11px] leading-5 text-[#707985]">{result.confidenceDetail}</div>
                    </div>
                    <div className="px-4 py-4">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8a929d]">Next action</div>
                        <div className="mt-1.5 text-[12px] leading-5 text-[#343b45]">{result.nextAction}</div>
                    </div>
                </div>
            </div>

            {workflowReadinessCards.length ? (
                <div className="grid gap-2 border-t border-[#e7eaf0] bg-[#fafbfd] p-3 sm:grid-cols-2 xl:grid-cols-4">
                    {workflowReadinessCards.map((card) => (
                        <LaboratoryMetricCard
                            key={`${card.eyebrow}-${card.value}`}
                            eyebrow={card.eyebrow}
                            value={card.value}
                            detail={card.detail}
                            tone={card.tone as "neutral" | "info" | "success" | "warn"}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
