import React from "react";

import { AxDisclosure } from "@/components/axion";

type Props = {
    composer: React.ReactNode;
    visual: React.ReactNode;
    result?: React.ReactNode;
    interpretation?: React.ReactNode;
    advanced?: React.ReactNode;
    visualTitle?: string;
    visualHint?: string;
    advancedTitle?: string;
    advancedHint?: string;
    advancedOpen?: boolean;
};

export function LaboratoryReferenceSolveShell({
    composer,
    visual,
    result,
    interpretation,
    advanced,
    visualTitle = "Visualization",
    visualHint = "Inspect the primary mathematical result",
    advancedTitle = "Analysis details",
    advancedHint = "Methods, checks and supporting diagnostics",
    advancedOpen = false,
}: Props) {
    return (
        <div className="space-y-5">
            <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="min-w-0 xl:sticky xl:top-[78px]">{composer}</aside>

                <main className="min-w-0 space-y-4">
                    <section>
                        <div className="mb-2 flex items-center justify-between gap-4 px-1">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">{visualTitle}</div>
                            <div className="text-[10px] text-[var(--ax-text-faint)]">{visualHint}</div>
                        </div>
                        <div className="relative min-h-[360px] overflow-hidden rounded-[var(--ax-radius-panel)] border border-[var(--ax-line)] bg-[var(--ax-surface)] p-2 [&_.site-panel-strong]:!static [&_.site-panel-strong]:!top-auto [&_.site-panel-strong]:!rounded-[var(--ax-radius-control)] [&_.site-panel-strong]:!border-0 [&_.site-panel-strong]:!bg-[var(--ax-surface)] [&_.site-panel-strong]:!p-0 [&_.site-panel-strong]:!shadow-none">
                            {visual}
                        </div>
                    </section>

                    {result}
                    {interpretation}
                </main>
            </div>

            {advanced ? (
                <section className="border-t border-[var(--ax-line)] pt-4">
                    <AxDisclosure title={advancedTitle} hint={advancedHint} open={advancedOpen}>
                        {advanced}
                    </AxDisclosure>
                </section>
            ) : null}
        </div>
    );
}
