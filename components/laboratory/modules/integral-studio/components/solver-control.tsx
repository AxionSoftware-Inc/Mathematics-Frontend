import React from "react";
import { Activity, ChevronDown, Orbit, SlidersHorizontal, Sparkles } from "lucide-react";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { IntegralClassification, IntegralCoordinateSystem, IntegralMode } from "../types";

interface SolverControlProps {
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
}

const modeOptions: Array<{ id: IntegralMode; label: string }> = [
    { id: "single", label: "Single" },
    { id: "double", label: "Double" },
    { id: "triple", label: "Triple" },
];

export function SolverControl({
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
    analyticStatusTitle,
    analyticStatusBody,
    analyticStatusBadge,
    analyticStatusToneClass,
    classification,
    isResultStale,
}: SolverControlProps) {
    const coordinateOptions: Array<{ id: IntegralCoordinateSystem; label: string }> = [
        { id: "cartesian", label: "Cartesian" },
        ...(mode === "single" || mode === "double" ? [{ id: "polar" as const, label: "Polar" }] : []),
        ...(mode === "triple" ? [{ id: "cylindrical" as const, label: "Cylindrical" }] : []),
        ...(mode === "triple" ? [{ id: "spherical" as const, label: "Spherical" }] : []),
    ];

    const variableHint =
        mode === "single"
            ? coordinates === "polar"
                ? "r, theta, x, y"
                : "x"
            : mode === "double"
              ? coordinates === "polar"
                    ? "r, theta, x, y"
                    : "x, y"
              : coordinates === "cylindrical"
                ? "r, theta, z, x, y"
                : coordinates === "spherical"
                  ? "rho, theta, phi, x, y, z"
                  : "x, y, z";

    const solveStatusLabel =
        solvePhase === "analytic-loading"
            ? "Analyzing"
            : solvePhase === "exact-ready"
              ? "Exact ready"
              : solvePhase === "needs-numerical"
                ? "Need confirm"
                : solvePhase === "error"
                  ? "Attention"
                  : "Ready";

    const samplingLabel =
        mode === "single"
            ? `${segments || "--"} segments`
            : `${xResolution || "--"} x ${yResolution || "--"}${mode === "triple" ? ` x ${zResolution || "--"}` : ""}`;
    const classificationToneClass =
        classification.support === "supported"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : classification.support === "partial"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";

    const insertSnippet = (snippet: string) => {
        if (snippet === "pi") {
            setExpression((expression ? `${expression} ` : "") + "pi");
            return;
        }

        setExpression(expression ? `${expression}${snippet}` : snippet);
    };

    const controlInputClassName =
        "h-11 w-full rounded-2xl border border-border/60 bg-background px-3.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/65 focus:border-accent/30 focus:ring-4 focus:ring-[var(--accent-soft)]";
    const controlMonoInputClassName = `${controlInputClassName} font-mono`;
    const selectShellClassName =
        "relative flex h-11 items-center rounded-2xl border border-border/60 bg-background transition-all focus-within:border-accent/30 focus-within:ring-4 focus-within:ring-[var(--accent-soft)]";
    const axisGroups =
        mode === "single"
            ? [
                  { key: "x", label: "x-range", min: lower, max: upper, setMin: setLower, setMax: setUpper, minPlaceholder: "lower", maxPlaceholder: "upper" },
              ]
            : mode === "double"
              ? [
                    { key: "x", label: "x-range", min: xMin, max: xMax, setMin: setXMin, setMax: setXMax, minPlaceholder: "x min", maxPlaceholder: "x max" },
                    { key: "y", label: "y-range", min: yMin, max: yMax, setMin: setYMin, setMax: setYMax, minPlaceholder: "y min", maxPlaceholder: "y max" },
                ]
              : [
                    { key: "x", label: "x-range", min: xMin, max: xMax, setMin: setXMin, setMax: setXMax, minPlaceholder: "x min", maxPlaceholder: "x max" },
                    { key: "y", label: "y-range", min: yMin, max: yMax, setMin: setYMin, setMax: setYMax, minPlaceholder: "y min", maxPlaceholder: "y max" },
                    { key: "z", label: "z-range", min: zMin, max: zMax, setMin: setZMin, setMax: setZMax, minPlaceholder: "z min", maxPlaceholder: "z max" },
                ];

    return (
        <div className="site-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-5 py-4">
                <div className="flex items-center gap-2">
                    <div className="site-eyebrow text-accent">Problem Composer</div>
                    {activePresetDescription ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10px] font-bold text-muted-foreground">
                            {activePresetDescription}
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        {samplingLabel}
                    </div>
                    <div className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                        <span className="inline-flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            {solveStatusLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                <div className="space-y-4">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_190px] 2xl:grid-cols-[minmax(0,1.45fr)_190px_128px]">
                        <div className="min-w-0 rounded-2xl border border-border/60 bg-background/70 p-1">
                            <div className="mb-2 px-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                Analysis Mode
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                            {modeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setMode(option.id)}
                                    className={`min-w-0 whitespace-nowrap rounded-xl border px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all sm:px-3 sm:text-[11px] sm:tracking-[0.16em] ${
                                        mode === option.id
                                            ? "border-foreground bg-foreground text-background shadow-sm"
                                            : "border-transparent bg-background text-muted-foreground hover:border-accent/20 hover:text-foreground"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
                            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                <Orbit className="h-3.5 w-3.5" />
                                Coordinates
                            </label>
                            <div className={selectShellClassName}>
                                <select
                                    value={coordinates}
                                    onChange={(e) => setCoordinates(e.target.value as IntegralCoordinateSystem)}
                                    className="h-full w-full cursor-pointer appearance-none bg-transparent px-3.5 pr-10 text-sm font-semibold text-foreground outline-none"
                                >
                                    {coordinateOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-2.5 py-3 xl:col-span-2 2xl:col-span-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Variables</div>
                            <div className="mt-2 flex min-h-[44px] items-center rounded-xl border border-border/50 bg-muted/10 px-2.5 text-sm font-medium text-foreground">
                                {variableHint}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Formula</div>
                            <div className="flex flex-wrap gap-2">
                                {["sin()", "cos()", "exp()", "sqrt()", "log()", "pi"].map((snippet) => (
                                    <button
                                        key={snippet}
                                        type="button"
                                        onClick={() => insertSnippet(snippet)}
                                        className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition hover:border-accent/35 hover:text-foreground"
                                    >
                                        {snippet}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            placeholder="Example: sin(x) + x^2 / 4"
                            className="mt-3 min-h-24 w-full resize-y rounded-2xl border-2 border-border/70 bg-background px-4 py-3 font-mono text-base leading-6 text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                        />
                        <div className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Detected Type</div>
                                    <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${classificationToneClass}`}>
                                        {classification.support}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-black text-foreground">{classification.label}</div>
                                <div className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-3">{classification.summary}</div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Rendered Preview</div>
                                <div className="mt-2 text-sm">
                                    <LaboratoryInlineMathMarkdown content={renderedProblemContent} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Analytic Status</div>
                                    <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${analyticStatusToneClass}`}>
                                        {analyticStatusBadge}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-black text-foreground">{analyticStatusTitle}</div>
                                <div className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-3">{analyticStatusBody}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Bounds</div>
                        <div className={`mt-3 grid gap-3 ${mode === "triple" ? "md:grid-cols-2 2xl:grid-cols-3" : mode === "double" ? "md:grid-cols-2" : ""}`}>
                            {axisGroups.map((axis) => (
                                <div key={axis.key} className="rounded-2xl border border-border/60 bg-background p-3">
                                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        {axis.label}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            value={axis.min}
                                            onChange={(e) => axis.setMin(e.target.value)}
                                            placeholder={axis.minPlaceholder}
                                            className={`${controlMonoInputClassName} text-center`}
                                        />
                                        <input
                                            value={axis.max}
                                            onChange={(e) => axis.setMax(e.target.value)}
                                            placeholder={axis.maxPlaceholder}
                                            className={`${controlMonoInputClassName} text-center`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {mode === "single" ? (
                            <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                                {classification.kind === "indefinite_single"
                                    ? "Chegaralar bo'sh bo'lsa system buni aniqmas integral deb ko'radi va symbolic primitive lane orqali yechishga urinadi."
                                    : "Chegaralar kiritilgan bo'lsa system buni definite integral deb ko'radi va analytic yoki numerical audit lane tanlaydi."}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Sampling
                        </label>
                        {mode === "single" ? (
                            <input
                                type="text"
                                value={segments}
                                onChange={(e) => setSegments(e.target.value)}
                                className={controlMonoInputClassName}
                            />
                        ) : (
                            <div className={`grid gap-2 ${mode === "triple" ? "md:grid-cols-2 2xl:grid-cols-3" : "md:grid-cols-2"}`}>
                                <input type="text" value={xResolution} onChange={(e) => setXResolution(e.target.value)} placeholder="x res" className={controlMonoInputClassName} />
                                <input type="text" value={yResolution} onChange={(e) => setYResolution(e.target.value)} placeholder="y res" className={controlMonoInputClassName} />
                                {mode === "triple" ? (
                                    <input type="text" value={zResolution} onChange={(e) => setZResolution(e.target.value)} placeholder="z res" className={controlMonoInputClassName} />
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={requestAnalyticSolve}
                            disabled={solvePhase === "analytic-loading"}
                            className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
                                isResultStale
                                    ? "border border-accent/40 bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
                                    : "site-btn-accent"
                            }`}
                        >
                            {solvePhase === "analytic-loading" ? "Analyzing..." : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Analyze And Solve
                                </>
                            )}
                        </button>
                        {solvePhase === "needs-numerical" ? (
                            <button
                                type="button"
                                onClick={confirmNumericalSolve}
                                className="w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-700 transition-all hover:bg-sky-500/20 dark:text-sky-300"
                            >
                                Confirm Numerical Execution
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
