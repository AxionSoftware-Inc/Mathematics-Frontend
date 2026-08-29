import React from "react";

import { AxBadge, AxDisclosure, AxField, AxInput, AxPanel, AxSelect, AxTextarea } from "@/components/axion";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { buildSeriesLimitAuxPreview, buildSeriesLimitPreview, inferSeriesLimitMode } from "../series-limit-input";
import type { SeriesLimitExperienceLevel, SeriesLimitMode, SeriesLimitSummary } from "../types";

const copy: Record<SeriesLimitMode, { title: string; helper: string; expression: string; context: string }> = {
    limits: { title: "Limit", helper: "Enter the expression and the point or direction of approach.", expression: "(sin(x))/x", context: "x -> 0" },
    sequences: { title: "Sequence", helper: "Inspect tail behavior and convergence of a discrete sequence.", expression: "(1 + 1/n)^n", context: "n -> inf" },
    series: { title: "Infinite series", helper: "Analyze convergence, dominant behavior and partial sums.", expression: "sum((-1)^(n+1)/n, n=1..inf)", context: "alternating" },
    convergence: { title: "Convergence test", helper: "Choose a series and audit the most appropriate test family.", expression: "sum(n!/n^n, n=1..inf)", context: "ratio test" },
    "power-series": { title: "Power series", helper: "Inspect radius, interval and endpoint behavior.", expression: "sum(x^n/n, n=1..inf)", context: "center=0" },
};

const dimensions: Record<SeriesLimitMode, string[]> = {
    limits: ["1 variable", "one-sided", "asymptotic", "oscillatory"],
    sequences: ["discrete", "tail behavior", "stability"],
    series: ["infinite series", "oscillatory series", "summability", "harmonic-derived"],
    convergence: ["test audit", "comparison lane", "borderline singular"],
    "power-series": ["power series", "endpoint audit", "radius study"],
};

export type SeriesLimitProblemComposerV2Props = {
    mode: SeriesLimitMode;
    setMode: (value: SeriesLimitMode) => void;
    expression: string;
    setExpression: (value: string) => void;
    auxiliaryExpression: string;
    setAuxiliaryExpression: (value: string) => void;
    dimension: string;
    setDimension: (value: string) => void;
    experienceLevel: SeriesLimitExperienceLevel;
    activePresetLabel?: string;
    summary: SeriesLimitSummary;
};

export function SeriesLimitProblemComposerV2({
    mode,
    setMode,
    expression,
    setExpression,
    auxiliaryExpression,
    setAuxiliaryExpression,
    dimension,
    setDimension,
    experienceLevel,
    activePresetLabel,
    summary,
}: SeriesLimitProblemComposerV2Props) {
    const inferred = React.useMemo(() => inferSeriesLimitMode(expression, auxiliaryExpression, mode), [auxiliaryExpression, expression, mode]);
    const meta = copy[mode];
    const availableDimensions = dimensions[mode];
    const resolvedDimension = availableDimensions.includes(dimension) ? dimension : availableDimensions[0];
    const preview = React.useMemo(() => buildSeriesLimitPreview(mode, expression, auxiliaryExpression), [auxiliaryExpression, expression, mode]);
    const auxPreview = React.useMemo(() => buildSeriesLimitAuxPreview(mode, auxiliaryExpression), [auxiliaryExpression, mode]);

    React.useEffect(() => {
        if (resolvedDimension !== dimension) setDimension(resolvedDimension);
    }, [dimension, resolvedDimension, setDimension]);

    return (
        <AxPanel className="overflow-hidden">
            <div className="border-b border-[var(--ax-line)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[var(--ax-text)]">{meta.title}</div>
                    </div>
                    <AxBadge>{activePresetLabel ?? "Custom"}</AxBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--ax-text-soft)]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <AxField label="Analysis">
                    <AxSelect value={mode} onChange={(event) => setMode(event.target.value as SeriesLimitMode)} className="text-[12px] font-semibold">
                        <option value="limits">Limits</option>
                        <option value="sequences">Sequences</option>
                        <option value="series">Series</option>
                        <option value="convergence">Convergence</option>
                        <option value="power-series">Power series</option>
                    </AxSelect>
                </AxField>

                <AxField label="Expression">
                    <AxTextarea
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                        rows={5}
                        spellCheck={false}
                        placeholder={meta.expression}
                        className="min-h-[124px] font-mono text-[13px]"
                    />
                </AxField>

                <AxField label="Context">
                    <AxInput
                        value={auxiliaryExpression}
                        onChange={(event) => setAuxiliaryExpression(event.target.value)}
                        placeholder={meta.context}
                        spellCheck={false}
                        className="font-mono text-[12px]"
                    />
                </AxField>

                <div className="overflow-x-auto rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-accent-soft)] px-3 py-3 text-[12px] text-[var(--ax-text)]">
                    <LaboratoryInlineMathMarkdown content={preview} />
                </div>

                <AxDisclosure title="Advanced settings" hint="Scope, detected family and context preview">
                    <div className="space-y-3">
                        <AxField label="Scope">
                            <AxSelect value={resolvedDimension} onChange={(event) => setDimension(event.target.value)} className="h-9 text-[11px] font-semibold">
                                {availableDimensions.map((item) => <option key={item} value={item}>{item}</option>)}
                            </AxSelect>
                        </AxField>
                        {auxiliaryExpression ? (
                            <div className="overflow-x-auto rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-3 py-2 text-[11px] text-[var(--ax-text-soft)]">
                                <LaboratoryInlineMathMarkdown content={auxPreview} />
                            </div>
                        ) : null}
                        <div className="grid gap-2 text-[10px] sm:grid-cols-2">
                            <div className="rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-2.5 py-2 text-[var(--ax-text-soft)]">Detected: <span className="font-semibold text-[var(--ax-text)]">{copy[inferred].title}</span></div>
                            <div className="rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-2.5 py-2 text-[var(--ax-text-soft)]">Family: <span className="font-semibold text-[var(--ax-text)]">{summary.detectedFamily ?? "pending"}</span></div>
                        </div>
                        <div className="text-[10px] text-[var(--ax-text-faint)]">Experience: {experienceLevel}</div>
                    </div>
                </AxDisclosure>
            </div>
        </AxPanel>
    );
}
