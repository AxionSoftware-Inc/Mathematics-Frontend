import React from "react";
import { Trash2 } from "lucide-react";
import { IntegralAnnotation } from "../types";

interface AnnotationPanelProps {
    annotations: IntegralAnnotation[];
    annotationAnchor: string;
    annotationTitle: string;
    setAnnotationTitle: (val: string) => void;
    annotationNote: string;
    setAnnotationNote: (val: string) => void;
    addAnnotationFromCurrentResult: () => void;
    setAnnotations: (updater: (prev: IntegralAnnotation[]) => IntegralAnnotation[]) => void;
    summary: any;
    error: string;
}

export function AnnotationPanel({
    annotations,
    annotationAnchor,
    annotationTitle,
    setAnnotationTitle,
    annotationNote,
    setAnnotationNote,
    addAnnotationFromCurrentResult,
    setAnnotations,
    summary,
    error,
}: AnnotationPanelProps) {
    return (
        <div className="site-panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">Interactive Annotations</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                        Integral estimate bo&apos;yicha muhim observation&apos;larni note qilib saqlang.
                    </div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {annotations.length} note
                </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-7 text-muted-foreground">
                Anchor: {annotationAnchor}
            </div>
            <div className="grid gap-3">
                <input
                    value={annotationTitle}
                    onChange={(event) => setAnnotationTitle(event.target.value)}
                    placeholder="Annotation title"
                    className="h-11 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                />
                <textarea
                    value={annotationNote}
                    onChange={(event) => setAnnotationNote(event.target.value)}
                    placeholder="Bu estimate nimani anglatishini yozib qoldiring"
                    className="min-h-28 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-accent/40"
                />
                <button
                    type="button"
                    onClick={addAnnotationFromCurrentResult}
                    disabled={!summary || Boolean(error)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Joriy natijadan note saqlash
                </button>
            </div>
            <div className="grid gap-3">
                {annotations.length ? annotations.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-black text-foreground">{item.title}</div>
                                <div className="mt-1 text-xs leading-6 text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnnotations((current) => current.filter((entry) => entry.id !== item.id))}
                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                                title="Note ni o'chirish"
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
                        Hozircha annotation yo&apos;q. Current estimate bo&apos;yicha note saqlab boring.
                    </div>
                )}
            </div>
        </div>
    );
}
