import type { SeriesLimitMode, SeriesLimitSolvePhase } from "../types";

export function StudioStatusBar({
    solvePhase,
    isResultStale,
    mode,
}: {
    solvePhase: SeriesLimitSolvePhase;
    isResultStale: boolean;
    mode: SeriesLimitMode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground lg:px-6">
            <div className="flex items-center gap-3">
                <span className="rounded-full border border-border/60 bg-muted/15 px-3 py-1.5 font-semibold text-foreground">Phase: {solvePhase}</span>
                <span className="rounded-full border border-border/60 bg-muted/15 px-3 py-1.5 font-semibold text-foreground">Mode: {mode}</span>
            </div>
            <span>{isResultStale ? "Natija yangilanishi kerak" : "Series / limit lane tayyor"}</span>
        </div>
    );
}
