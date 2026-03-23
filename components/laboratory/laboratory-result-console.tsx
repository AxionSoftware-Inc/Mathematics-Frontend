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
    title = "Result Console",
    subtitle = "Yakuniy natija va keyingi action",
    result,
    workflowReadinessCards
}: LaboratoryResultConsoleProps) {
    return (
        <div className="site-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">{title}</div>
                    <div className="mt-2 text-lg font-black text-foreground">{subtitle}</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${result.sourceClassName}`}>
                    {result.sourceLabel}
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-border/60 bg-background px-5 py-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Primary result</div>
                    <div className="mt-3 font-serif text-3xl font-black tracking-tight text-foreground">
                        {result.headline}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">{result.subline}</div>
                    {result.latex ? (
                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                            <LaboratoryInlineMathMarkdown content={result.latex} />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-border/60 bg-background px-5 py-4 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Confidence</div>
                        <div className={`mt-2 text-base font-black ${result.confidenceClassName}`}>{result.confidenceLabel}</div>
                        <div className="mt-2 text-sm leading-7 text-muted-foreground">{result.confidenceDetail}</div>
                    </div>
                    <div className="rounded-3xl border border-border/60 bg-background px-5 py-4 shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Next action</div>
                        <div className="mt-2 text-sm leading-7 text-foreground">{result.nextAction}</div>
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        </div>
    );
}
