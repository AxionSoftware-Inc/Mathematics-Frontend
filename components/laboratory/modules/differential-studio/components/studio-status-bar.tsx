import React from "react";
import { Server, Zap } from "lucide-react";

export function StudioStatusBar({ solvePhase, isResultStale }: { solvePhase: any; isResultStale: any }) {
    return (
        <div className="flex h-10 items-center justify-between border-t border-border/40 bg-background/70 px-4 lg:px-6">
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${solvePhase === "idle" ? "bg-muted" : solvePhase === "analytic-loading" ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span>Phase: {solvePhase}</span>
                </div>
                {isResultStale && (
                    <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                        <span>• Stale Input</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Compute: Hybrid
                </span>
                <span className="hidden items-center gap-1 md:flex">
                    <Server className="h-3 w-3" />
                    Differential
                </span>
            </div>
        </div>
    );
}
