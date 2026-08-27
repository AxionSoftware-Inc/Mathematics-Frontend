import React from "react";

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
        <div className="overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white">
            <div className="border-b border-[#e8ebef] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">{meta.title}</div>
                    </div>
                    <div className="rounded-[7px] bg-[#f5f7fa] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#747d88]">{activePresetLabel ?? "Custom"}</div>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#6f7782]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Analysis</span>
                    <select
                        value={mode}
                        onChange={(event) => setMode(event.target.value as SeriesLimitMode)}
                        className="h-10 w-full rounded-[8px] border border-[#dfe4ea] bg-white px-3 text-[12px] font-semibold text-[#20242b] outline-none focus:border-[#9db5dc]"
                    >
                        <option value="limits">Limits</option>
                        <option value="sequences">Sequences</option>
                        <option value="series">Series</option>
                        <option value="convergence">Convergence</option>
                        <option value="power-series">Power series</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Expression</span>
                    <textarea
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                        rows={5}
                        spellCheck={false}
                        placeholder={meta.expression}
                        className="min-h-[124px] w-full resize-y rounded-[8px] border border-[#dfe4ea] bg-[#fcfdff] px-3 py-3 font-mono text-[13px] leading-6 text-[#20242b] outline-none focus:border-[#9db5dc]"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Context</span>
                    <input
                        value={auxiliaryExpression}
                        onChange={(event) => setAuxiliaryExpression(event.target.value)}
                        placeholder={meta.context}
                        spellCheck={false}
                        className="h-10 w-full rounded-[8px] border border-[#dfe4ea] bg-white px-3 font-mono text-[12px] text-[#20242b] outline-none focus:border-[#9db5dc]"
                    />
                </label>

                <div className="overflow-x-auto rounded-[8px] border border-[#e1e5eb] bg-[#f8fafe] px-3 py-3 text-[12px] text-[#303640]">
                    <LaboratoryInlineMathMarkdown content={preview} />
                </div>

                <details className="rounded-[8px] border border-[#e2e6ec] bg-white">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#66707c]">Advanced settings</summary>
                    <div className="space-y-3 border-t border-[#edf0f3] p-3">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#7a838e]">Scope</span>
                            <select
                                value={resolvedDimension}
                                onChange={(event) => setDimension(event.target.value)}
                                className="h-9 w-full rounded-[7px] border border-[#dfe4ea] bg-white px-3 text-[11px] font-semibold text-[#303640] outline-none"
                            >
                                {availableDimensions.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        {auxiliaryExpression ? (
                            <div className="overflow-x-auto rounded-[7px] bg-[#f7f8fa] px-3 py-2 text-[11px] text-[#59616c]">
                                <LaboratoryInlineMathMarkdown content={auxPreview} />
                            </div>
                        ) : null}
                        <div className="grid gap-2 text-[10px] sm:grid-cols-2">
                            <div className="rounded-[7px] bg-[#f7f8fa] px-2.5 py-2 text-[#69727d]">Detected: <span className="font-semibold text-[#2f3540]">{copy[inferred].title}</span></div>
                            <div className="rounded-[7px] bg-[#f7f8fa] px-2.5 py-2 text-[#69727d]">Family: <span className="font-semibold text-[#2f3540]">{summary.detectedFamily ?? "pending"}</span></div>
                        </div>
                        <div className="text-[10px] text-[#9299a2]">Experience: {experienceLevel}</div>
                    </div>
                </details>
            </div>
        </div>
    );
}
