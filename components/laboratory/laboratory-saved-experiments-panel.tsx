"use client";

import { Trash2 } from "lucide-react";

export type LaboratorySavedExperimentCard = {
    id: string;
    title: string;
    meta: string;
};

export function LaboratorySavedExperimentsPanel({
    items,
    experimentLabel,
    setExperimentLabel,
    onSave,
    onLoad,
    onDelete,
    eyebrow = "Save Experiments",
    description = "Qiziq scenario'larni keyin qayta tekshirish uchun snapshot qilib qo'ying.",
    emptyMessage = "Hozircha saved experiment yo'q.",
}: {
    items: readonly LaboratorySavedExperimentCard[];
    experimentLabel: string;
    setExperimentLabel: (value: string) => void;
    onSave: () => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    eyebrow?: string;
    description?: string;
    emptyMessage?: string;
}) {
    return (
        <div className="site-panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">{eyebrow}</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">{description}</div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {items.length} saved
                </div>
            </div>
            <div className="grid gap-3">
                <input
                    value={experimentLabel}
                    onChange={(event) => setExperimentLabel(event.target.value)}
                    placeholder="Experiment label"
                    className="h-11 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                />
                <button
                    type="button"
                    onClick={onSave}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/60 bg-background/75 px-4 text-sm font-bold transition hover:border-accent/40 hover:text-accent"
                >
                    Joriy experimentni saqlash
                </button>
            </div>
            <div className="grid gap-3">
                {items.length ? items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-black text-foreground">{item.title}</div>
                                <div className="mt-1 text-xs leading-6 text-muted-foreground">{item.meta}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onDelete(item.id)}
                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                                title="Experimentni o'chirish"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onLoad(item.id)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90"
                            >
                                Qayta yuklash
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
