import React from "react";
import { Trash2 } from "lucide-react";
import type { SeriesLimitAnnotation } from "../types";

export function AnnotationPanel({
    state,
}: {
    state: {
        annotations: SeriesLimitAnnotation[];
        annotationAnchor: string;
        annotationTitle: string;
        setAnnotationTitle: (value: string) => void;
        annotationNote: string;
        setAnnotationNote: (value: string) => void;
        addAnnotationFromCurrentResult: () => void;
        removeAnnotation: (id: string) => void;
        canSave: boolean;
    };
}) {
    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Interactive Annotations</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Muhim convergence observation va interpretation’larni saqlang.
                    </div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {state.annotations.length} note
                </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-7 text-muted-foreground">
                Anchor: {state.annotationAnchor}
            </div>

            <div className="grid gap-3">
                <input
                    value={state.annotationTitle}
                    onChange={(event) => state.setAnnotationTitle(event.target.value)}
                    placeholder="Annotation title"
                    className="h-11 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                />
                <textarea
                    value={state.annotationNote}
                    onChange={(event) => state.setAnnotationNote(event.target.value)}
                    placeholder="Bu series/limit natija nimani anglatishini yozib qoldiring"
                    className="min-h-28 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-accent/40"
                />
                <button
                    type="button"
                    onClick={state.addAnnotationFromCurrentResult}
                    disabled={!state.canSave}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Joriy natijadan note saqlash
                </button>
            </div>

            <div className="grid gap-3">
                {state.annotations.length ? state.annotations.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-black text-foreground">{item.title}</div>
                                <div className="mt-1 text-xs leading-6 text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => state.removeAnnotation(item.id)}
                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-foreground">{item.note}</div>
                        <div className="mt-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs leading-6 text-muted-foreground">
                            {item.anchor}
                        </div>
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                        Hozircha annotation yo‘q.
                    </div>
                )}
            </div>
        </div>
    );
}
