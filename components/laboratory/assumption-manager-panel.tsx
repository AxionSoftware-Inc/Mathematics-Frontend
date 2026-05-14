"use client";

import React from "react";
import { Plus, ShieldCheck, X } from "lucide-react";

import { type Assumption, assumptionsToStatements, buildAssumptionImpactSummary, inferAssumptions } from "@/lib/assumptions";

export function AssumptionManagerPanel({
    input,
    metadata,
    fallbackText,
    onChange,
}: {
    input?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    fallbackText?: string;
    onChange?: (assumptions: Assumption[]) => void;
}) {
    const inferred = React.useMemo(() => inferAssumptions({ input, metadata, fallbackText }), [fallbackText, input, metadata]);
    const [assumptions, setAssumptions] = React.useState<Assumption[]>(inferred);
    const [draft, setDraft] = React.useState("");
    const impact = React.useMemo(() => buildAssumptionImpactSummary(assumptions, inferred), [assumptions, inferred]);

    React.useEffect(() => {
        setAssumptions(inferred);
    }, [inferred]);

    React.useEffect(() => {
        onChange?.(assumptions);
    }, [assumptions, onChange]);

    const addDraft = () => {
        const statement = draft.trim();
        if (!statement) return;
        setAssumptions((current) => [
            ...current,
            {
                id: `user-${Date.now()}`,
                variable: statement.split(/\s+/)[0] || "global",
                statement,
                kind: statement.includes(">") || statement.includes("<") ? "sign" : "custom",
                source: "user",
            },
        ]);
        setDraft("");
    };

    return (
        <div className="site-panel p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">Assumption Manager</div>
                    <div className="mt-1 text-sm font-black text-foreground">Global mathematical contract</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {assumptions.length ? assumptions.map((assumption) => (
                    <span key={assumption.id} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-bold text-foreground">
                        {assumption.statement}
                        {assumption.source === "user" ? (
                            <button type="button" onClick={() => setAssumptions((current) => current.filter((item) => item.id !== assumption.id))} aria-label={`Remove ${assumption.statement}`}>
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        ) : null}
                    </span>
                )) : (
                    <span className="text-xs text-muted-foreground">No assumptions detected yet.</span>
                )}
            </div>
            <div className="mt-3 flex gap-2">
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") addDraft();
                    }}
                    placeholder="a > 0, n in Z, x real..."
                    className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-accent/40"
                />
                <button type="button" onClick={addDraft} className="site-btn px-3">
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
                {impact.changed
                    ? `Changing assumptions affects ${impact.affected.join(", ")}.`
                    : `Active assumptions: ${assumptionsToStatements(assumptions).join("; ") || "none"}.`}
            </div>
        </div>
    );
}
