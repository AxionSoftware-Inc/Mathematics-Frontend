import React from "react";
import { ChevronDown, Save, SlidersHorizontal } from "lucide-react";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { GeometryLaneBuilder } from "./geometry-lane-builder";
import type { IntegralClassification, IntegralCoordinateSystem, IntegralMode } from "../types";

export type IntegralProblemComposerV2Props = {
    mode: IntegralMode;
    setMode: (mode: IntegralMode) => void;
    coordinates: IntegralCoordinateSystem;
    setCoordinates: (val: IntegralCoordinateSystem) => void;
    expression: string;
    setExpression: (val: string) => void;
    lower: string;
    setLower: (val: string) => void;
    upper: string;
    setUpper: (val: string) => void;
    xMin: string;
    setXMin: (val: string) => void;
    xMax: string;
    setXMax: (val: string) => void;
    yMin: string;
    setYMin: (val: string) => void;
    yMax: string;
    setYMax: (val: string) => void;
    zMin: string;
    setZMin: (val: string) => void;
    zMax: string;
    setZMax: (val: string) => void;
    segments: string;
    setSegments: (val: string) => void;
    xResolution: string;
    setXResolution: (val: string) => void;
    yResolution: string;
    setYResolution: (val: string) => void;
    zResolution: string;
    setZResolution: (val: string) => void;
    requestAnalyticSolve: () => void;
    confirmNumericalSolve: () => void;
    solvePhase: string;
    activePresetDescription?: string;
    renderedProblemContent: string;
    analyticStatusTitle: string;
    analyticStatusBody: string;
    analyticStatusBadge: string;
    analyticStatusToneClass: string;
    classification: IntegralClassification;
    isResultStale?: boolean;
    saveResult?: () => void | Promise<unknown>;
    saveState?: "idle" | "saving" | "saved" | "error";
};

const modeOptions: Array<{ id: IntegralMode; symbol: string; label: string }> = [
    { id: "single", symbol: "∫", label: "Single" },
    { id: "double", symbol: "∬", label: "Double" },
    { id: "triple", symbol: "∭", label: "Triple" },
];

const inputClassName =
    "h-10 w-full rounded-[8px] border border-[#dfe4ea] bg-white px-3 text-[13px] text-[#20242b] outline-none placeholder:text-[#a1a7b0] focus:border-[#91add8]";

export function IntegralProblemComposerV2(props: IntegralProblemComposerV2Props) {
    const {
        mode,
        setMode,
        coordinates,
        setCoordinates,
        expression,
        setExpression,
        lower,
        setLower,
        upper,
        setUpper,
        xMin,
        setXMin,
        xMax,
        setXMax,
        yMin,
        setYMin,
        yMax,
        setYMax,
        zMin,
        setZMin,
        zMax,
        setZMax,
        segments,
        setSegments,
        xResolution,
        setXResolution,
        yResolution,
        setYResolution,
        zResolution,
        setZResolution,
        requestAnalyticSolve,
        confirmNumericalSolve,
        solvePhase,
        activePresetDescription,
        renderedProblemContent,
        classification,
        isResultStale = false,
        saveResult,
        saveState = "idle",
    } = props;

    const geometryLaneActive =
        classification.kind === "line_integral_candidate" ||
        classification.kind === "surface_integral_candidate" ||
        classification.kind === "contour_integral_candidate";

    const coordinateOptions: Array<{ id: IntegralCoordinateSystem; label: string }> = [
        { id: "cartesian", label: "Cartesian" },
        ...(geometryLaneActive ? [{ id: "parametric" as const, label: "Parametric" }] : []),
        ...(classification.kind === "contour_integral_candidate"
            ? [{ id: "complex_plane" as const, label: "Complex plane" }]
            : []),
        ...(mode === "single" || mode === "double" ? [{ id: "polar" as const, label: "Polar" }] : []),
        ...(mode === "triple" ? [{ id: "cylindrical" as const, label: "Cylindrical" }] : []),
        ...(mode === "triple" ? [{ id: "spherical" as const, label: "Spherical" }] : []),
    ];

    const isLoading = solvePhase === "analytic-loading";
    const needsNumerical = solvePhase === "needs-numerical";
    const resultReady = solvePhase === "exact-ready" || solvePhase === "numerical-ready";

    const solveLabel = isLoading
        ? "Solving…"
        : isResultStale
          ? "Update solution"
          : solvePhase === "error"
            ? "Retry solve"
            : resultReady
              ? "Solve again"
              : "Solve";

    const rangeRows =
        mode === "single"
            ? [
                  { label: "x", min: lower, max: upper, setMin: setLower, setMax: setUpper },
              ]
            : mode === "double"
              ? [
                    { label: "x", min: xMin, max: xMax, setMin: setXMin, setMax: setXMax },
                    { label: "y", min: yMin, max: yMax, setMin: setYMin, setMax: setYMax },
                ]
              : [
                    { label: "x", min: xMin, max: xMax, setMin: setXMin, setMax: setXMax },
                    { label: "y", min: yMin, max: yMax, setMin: setYMin, setMax: setYMax },
                    { label: "z", min: zMin, max: zMax, setMin: setZMin, setMax: setZMax },
                ];

    return (
        <div className="overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white">
            <div className="border-b border-[#e7eaf0] px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#184eb8]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Integral setup</div>
                    </div>
                    {activePresetDescription ? (
                        <div className="max-w-[160px] text-right text-[10px] leading-4 text-[#858d98]">{activePresetDescription}</div>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8490]">Integral type</div>
                    <div className="grid grid-cols-3 gap-1 rounded-[9px] bg-[#f4f6f9] p-1">
                        {modeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setMode(option.id)}
                                className={`rounded-[7px] px-2 py-2.5 text-center ${
                                    mode === option.id
                                        ? "bg-white text-[#12254b] shadow-[0_1px_4px_rgba(25,35,50,0.08)]"
                                        : "text-[#747d89]"
                                }`}
                            >
                                <div className="font-serif text-lg leading-none">{option.symbol}</div>
                                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.09em]">{option.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <label className="block">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8490]">Expression</div>
                    <textarea
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                        rows={3}
                        spellCheck={false}
                        placeholder={mode === "single" ? "sin(x) + x^2 / 5" : mode === "double" ? "x^2 + y^2" : "x^2 + y^2 + z^2"}
                        className="min-h-[86px] w-full resize-y rounded-[9px] border border-[#dfe4ea] bg-[#fcfdff] px-3.5 py-3 font-mono text-[13px] leading-6 text-[#20242b] outline-none placeholder:text-[#a1a7b0] focus:border-[#91add8]"
                    />
                </label>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8490]">Bounds</div>
                        <div className="text-[10px] text-[#9aa1aa]">min → max</div>
                    </div>
                    <div className="space-y-2">
                        {rangeRows.map((row) => (
                            <div key={row.label} className="grid grid-cols-[26px_1fr_1fr] items-center gap-2">
                                <div className="font-serif text-[15px] text-[#424951]">{row.label}</div>
                                <input value={row.min} onChange={(event) => row.setMin(event.target.value)} className={inputClassName} placeholder="min" />
                                <input value={row.max} onChange={(event) => row.setMax(event.target.value)} className={inputClassName} placeholder="max" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[9px] border border-[#e3e7ed] bg-[#fafbfd] px-3 py-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8b939f]">Preview</div>
                    <div className="mt-2 overflow-x-auto text-[13px] text-[#262b32]">
                        <LaboratoryInlineMathMarkdown content={renderedProblemContent} />
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1 2xl:grid-cols-[1fr_auto]">
                    <button
                        type="button"
                        onClick={requestAnalyticSolve}
                        disabled={isLoading || !expression.trim()}
                        className="inline-flex h-11 items-center justify-center rounded-[9px] bg-[#0b1f46] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {solveLabel}
                    </button>
                    {needsNumerical ? (
                        <button
                            type="button"
                            onClick={confirmNumericalSolve}
                            className="inline-flex h-11 items-center justify-center rounded-[9px] border border-[#cbd7e8] bg-[#f5f8fd] px-4 text-[11px] font-semibold text-[#184eb8]"
                        >
                            Use numerical
                        </button>
                    ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#edf0f3] pt-3 text-[10px]">
                    <div className={resultReady && !isResultStale ? "font-semibold text-[#25704f]" : "text-[#838b96]"}>
                        {isLoading
                            ? "Symbolic analysis running"
                            : needsNumerical
                              ? "Exact form unavailable"
                              : resultReady && !isResultStale
                                ? "Result ready"
                                : isResultStale
                                  ? "Inputs changed"
                                  : "Ready to solve"}
                    </div>
                    {saveResult ? (
                        <button
                            type="button"
                            onClick={() => void saveResult()}
                            disabled={saveState === "saving" || !resultReady || isResultStale}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#66707c] disabled:opacity-40"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Save"}
                        </button>
                    ) : null}
                </div>

                <details className="group rounded-[9px] border border-[#e3e7ed] bg-[#fcfdff]">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#66707c]">
                        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5" />Advanced settings</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-4 border-t border-[#e8ebef] px-3.5 py-4">
                        <label className="block">
                            <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#8a929d]">Coordinates</div>
                            <select value={coordinates} onChange={(event) => setCoordinates(event.target.value as IntegralCoordinateSystem)} className={inputClassName}>
                                {coordinateOptions.map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                ))}
                            </select>
                        </label>

                        {mode === "single" ? (
                            <label className="block">
                                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#8a929d]">Sampling segments</div>
                                <input value={segments} onChange={(event) => setSegments(event.target.value)} className={inputClassName} inputMode="numeric" />
                            </label>
                        ) : (
                            <div>
                                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#8a929d]">Grid resolution</div>
                                <div className={`grid gap-2 ${mode === "triple" ? "grid-cols-3" : "grid-cols-2"}`}>
                                    <input value={xResolution} onChange={(event) => setXResolution(event.target.value)} className={inputClassName} placeholder="x" inputMode="numeric" />
                                    <input value={yResolution} onChange={(event) => setYResolution(event.target.value)} className={inputClassName} placeholder="y" inputMode="numeric" />
                                    {mode === "triple" ? (
                                        <input value={zResolution} onChange={(event) => setZResolution(event.target.value)} className={inputClassName} placeholder="z" inputMode="numeric" />
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {geometryLaneActive ? (
                            <GeometryLaneBuilder expression={expression} setExpression={setExpression} classification={classification} />
                        ) : null}
                    </div>
                </details>
            </div>
        </div>
    );
}
