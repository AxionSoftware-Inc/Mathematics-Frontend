import React from "react";

import { IntegralClassification } from "../types";
import { GeometryLaneDraft, GeometryLaneService } from "../services/geometry-lane-service";

type Props = {
    expression: string;
    setExpression: (value: string) => void;
    classification: IntegralClassification;
};

function resolveLaneKind(classification: IntegralClassification): "line" | "surface" | "contour" | null {
    if (classification.kind === "line_integral_candidate") return "line";
    if (classification.kind === "surface_integral_candidate") return "surface";
    if (classification.kind === "contour_integral_candidate") return "contour";
    return null;
}

export function GeometryLaneBuilder({ expression, setExpression, classification }: Props) {
    const laneKind = resolveLaneKind(classification);
    const [draft, setDraft] = React.useState<GeometryLaneDraft | null>(laneKind ? GeometryLaneService.parse(expression, laneKind) : null);

    React.useEffect(() => {
        if (!laneKind) {
            setDraft(null);
            return;
        }
        setDraft(GeometryLaneService.parse(expression, laneKind));
    }, [expression, laneKind]);

    if (!laneKind || !draft) {
        return null;
    }

    const contourPathPresets = [
        { label: "Unit circle", value: "exp(I*t)" },
        { label: "Upper arc", value: "exp(I*t)" },
        { label: "Shifted circle", value: "1 + exp(I*t)" },
    ];

    const inputClassName =
        "h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/65 focus:border-accent/30 focus:ring-4 focus:ring-[var(--accent-soft)]";

    const patchDraft = (updater: (current: GeometryLaneDraft) => GeometryLaneDraft) => {
        setDraft((current) => {
            if (!current) return current;
            const next = updater(current);
            setExpression(GeometryLaneService.build(next));
            return next;
        });
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Geometry Builder</div>
                    <div className="mt-1 text-sm font-black text-foreground">
                        {laneKind === "line" ? "Line integral composer" : laneKind === "surface" ? "Surface integral composer" : "Contour integral composer"}
                    </div>
                </div>
                <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    classification.support === "supported"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}>
                    {classification.support === "supported" ? "solver lane active" : "builder mode"}
                </div>
            </div>

            {draft.kind === "line" ? (
                <div className="mt-4 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => {
                                const next = current as any;
                                return { ...next, dimension: "2d", path: next.path.slice(0, 2), r: "0" };
                            })}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.dimension === "2d" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            2D path
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => {
                                const next = current as any;
                                return { ...next, dimension: "3d", path: next.path.length === 3 ? next.path : [...next.path, "t"] };
                            })}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.dimension === "3d" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            3D path
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...current as GeometryLaneDraft & { kind: "line" }, kind: "line", variant: "vector" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.variant === "vector" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            Vector field
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...current as GeometryLaneDraft & { kind: "line" }, kind: "line", variant: "scalar" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.variant === "scalar" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            Scalar field
                        </button>
                    </div>

                    {draft.variant === "vector" ? (
                        <div className={`grid gap-2 ${draft.dimension === "3d" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                            <input value={draft.p} onChange={(e) => patchDraft((current) => ({ ...(current as any), p: e.target.value }))} placeholder="P(x,y,z)" className={inputClassName} />
                            <input value={draft.q} onChange={(e) => patchDraft((current) => ({ ...(current as any), q: e.target.value }))} placeholder="Q(x,y,z)" className={inputClassName} />
                            {draft.dimension === "3d" ? (
                                <input value={draft.r} onChange={(e) => patchDraft((current) => ({ ...(current as any), r: e.target.value }))} placeholder="R(x,y,z)" className={inputClassName} />
                            ) : null}
                        </div>
                    ) : (
                        <input value={draft.scalarField} onChange={(e) => patchDraft((current) => ({ ...(current as any), scalarField: e.target.value }))} placeholder="f(x,y,z)" className={inputClassName} />
                    )}

                    <div className={`grid gap-2 ${draft.dimension === "3d" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                        {draft.path.slice(0, draft.dimension === "3d" ? 3 : 2).map((entry, index) => (
                            <input
                                key={index}
                                value={entry}
                                onChange={(e) => patchDraft((current) => ({
                                    ...(current as any),
                                    path: (current as any).path.map((item: string, itemIndex: number) => itemIndex === index ? e.target.value : item),
                                }))}
                                placeholder={`path ${index + 1}`}
                                className={inputClassName}
                            />
                        ))}
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <input value={draft.parameter} onChange={(e) => patchDraft((current) => ({ ...(current as any), parameter: e.target.value || "t" }))} placeholder="parameter" className={inputClassName} />
                        <input value={draft.intervalStart} onChange={(e) => patchDraft((current) => ({ ...(current as any), intervalStart: e.target.value }))} placeholder="start" className={inputClassName} />
                        <input value={draft.intervalEnd} onChange={(e) => patchDraft((current) => ({ ...(current as any), intervalEnd: e.target.value }))} placeholder="end" className={inputClassName} />
                    </div>
                </div>
            ) : null}

            {draft.kind === "surface" ? (
                <div className="mt-4 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...(current as any), variant: "vector" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.variant === "vector" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            Flux field
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...(current as any), variant: "scalar" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.variant === "scalar" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            Scalar field
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...(current as any), orientation: "positive" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.orientation === "positive" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            + normal
                        </button>
                        <button
                            type="button"
                            onClick={() => patchDraft((current) => ({ ...(current as any), orientation: "negative" }))}
                            className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${draft.orientation === "negative" ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background text-muted-foreground"}`}
                        >
                            - normal
                        </button>
                    </div>

                    {draft.variant === "vector" ? (
                        <div className="grid gap-2 md:grid-cols-3">
                            {draft.field.map((entry, index) => (
                                <input
                                    key={index}
                                    value={entry}
                                    onChange={(e) => patchDraft((current) => ({
                                        ...(current as any),
                                        field: (current as any).field.map((item: string, itemIndex: number) => itemIndex === index ? e.target.value : item),
                                    }))}
                                    placeholder={`F${index + 1}`}
                                    className={inputClassName}
                                />
                            ))}
                        </div>
                    ) : (
                        <input value={draft.scalarField} onChange={(e) => patchDraft((current) => ({ ...(current as any), scalarField: e.target.value }))} placeholder="f(x,y,z)" className={inputClassName} />
                    )}

                    <div className="grid gap-2 md:grid-cols-3">
                        {draft.patch.map((entry, index) => (
                            <input
                                key={index}
                                value={entry}
                                onChange={(e) => patchDraft((current) => ({
                                    ...(current as any),
                                    patch: (current as any).patch.map((item: string, itemIndex: number) => itemIndex === index ? e.target.value : item),
                                }))}
                                placeholder={`patch ${index + 1}`}
                                className={inputClassName}
                            />
                        ))}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2 grid-cols-2">
                            <input value={draft.uStart} onChange={(e) => patchDraft((current) => ({ ...(current as any), uStart: e.target.value }))} placeholder="u start" className={inputClassName} />
                            <input value={draft.uEnd} onChange={(e) => patchDraft((current) => ({ ...(current as any), uEnd: e.target.value }))} placeholder="u end" className={inputClassName} />
                        </div>
                        <div className="grid gap-2 grid-cols-2">
                            <input value={draft.vStart} onChange={(e) => patchDraft((current) => ({ ...(current as any), vStart: e.target.value }))} placeholder="v start" className={inputClassName} />
                            <input value={draft.vEnd} onChange={(e) => patchDraft((current) => ({ ...(current as any), vEnd: e.target.value }))} placeholder="v end" className={inputClassName} />
                        </div>
                    </div>
                </div>
            ) : null}

            {draft.kind === "contour" ? (
                <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {contourPathPresets.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => patchDraft((current) => ({ ...(current as any), path: preset.value }))}
                                className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition hover:border-accent/35 hover:text-foreground"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <input value={draft.field} onChange={(e) => patchDraft((current) => ({ ...(current as any), field: e.target.value }))} placeholder="f(z)" className={inputClassName} />
                    <input value={draft.path} onChange={(e) => patchDraft((current) => ({ ...(current as any), path: e.target.value }))} placeholder="z(t)" className={inputClassName} />
                    <div className="grid gap-2 md:grid-cols-3">
                        <input value={draft.parameter} onChange={(e) => patchDraft((current) => ({ ...(current as any), parameter: e.target.value || "t" }))} placeholder="parameter" className={inputClassName} />
                        <input value={draft.intervalStart} onChange={(e) => patchDraft((current) => ({ ...(current as any), intervalStart: e.target.value }))} placeholder="start" className={inputClassName} />
                        <input value={draft.intervalEnd} onChange={(e) => patchDraft((current) => ({ ...(current as any), intervalEnd: e.target.value }))} placeholder="end" className={inputClassName} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
