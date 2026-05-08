"use client";

import { Link2, Plus, RadioTower } from "lucide-react";

import { type WriterBridgeTarget } from "@/lib/live-writer-bridge";

function formatSyncTime(value?: string) {
    if (!value) {
        return "--";
    }

    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function WriterLiveTargetsPanel({
    targets,
    onInsertTarget,
}: {
    targets: WriterBridgeTarget[];
    onInsertTarget: () => void;
}) {
    return (
        <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Live Sync</div>
                    <div className="mt-1 text-xl font-black">Laboratory live bloklari</div>
                </div>
                <button
                    type="button"
                    onClick={onInsertTarget}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-bold transition hover:border-foreground"
                >
                    <Plus className="h-4 w-4" />
                    Live blok qo&apos;shish
                </button>
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
                Bu blok laboratoriyadan kelgan natijani hujjat ichidagi aniq joyga qabul qiladi. Blok qo&apos;shilgach, laboratoriya sahifasida shu hujjat tanlanadi.
            </div>

            <div className="mt-4 space-y-2">
                {targets.length ? (
                    targets.map((target) => (
                        <div key={target.id} className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-black">{target.title}</div>
                                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                                        {target.sectionPath || "Document root"}
                                    </div>
                                    <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{target.id}</div>
                                    <div className="mt-2 text-[11px] text-muted-foreground">
                                        yangilanish {target.revision ?? 0} | oxirgi yuborish {formatSyncTime(target.lastPublishedAt)} | tasdiq {formatSyncTime(target.lastAcknowledgedAt)}
                                    </div>
                                </div>
                                <div className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    {target.status}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
                        Hali live blok yo&apos;q. `Live blok qo&apos;shish` bosib hujjatga joy qo&apos;shing.
                    </div>
                )}
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <RadioTower className="h-3.5 w-3.5" />
                Writer ochiq turganida live bloklar laboratoriyaga avtomatik ko&apos;rinadi.
            </div>

            <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Bitta maqolada bir nechta mustaqil live blok ishlatish mumkin.
            </div>
        </div>
    );
}
