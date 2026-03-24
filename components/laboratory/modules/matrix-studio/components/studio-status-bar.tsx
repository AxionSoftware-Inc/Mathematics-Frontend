import { Boxes, Sparkles } from "lucide-react";

import type { MatrixMode, MatrixSolvePhase } from "../types";

export function StudioStatusBar({
    solvePhase,
    isResultStale,
    mode,
}: {
    solvePhase: MatrixSolvePhase;
    isResultStale: boolean;
    mode: MatrixMode;
}) {
    return (
        <div className="flex h-10 items-center justify-between border-t border-border/40 bg-background/70 px-4 lg:px-6">
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${solvePhase === "idle" ? "bg-muted" : solvePhase === "analysis-ready" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                    <span>Phase: {solvePhase}</span>
                </div>
                {isResultStale ? <span className="text-amber-500">Stale Input</span> : null}
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Compute: starter
                </span>
                <span className="hidden items-center gap-1 md:flex">
                    <Boxes className="h-3 w-3" />
                    {mode}
                </span>
            </div>
        </div>
    );
}
