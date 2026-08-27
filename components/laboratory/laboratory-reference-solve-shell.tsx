import React from "react";

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
                            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">{visualTitle}</div>
                            <div className="text-[10px] text-[#949ba5]">{visualHint}</div>
                        </div>
                        <div className="relative min-h-[360px] overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white p-2 [&_.site-panel-strong]:!static [&_.site-panel-strong]:!top-auto [&_.site-panel-strong]:!rounded-[8px] [&_.site-panel-strong]:!border-0 [&_.site-panel-strong]:!bg-white [&_.site-panel-strong]:!p-0 [&_.site-panel-strong]:!shadow-none">
                            {visual}
                        </div>
                    </section>

                    {result}
                    {interpretation}
                </main>
            </div>

            {advanced ? (
                <section className="border-t border-[#e5e8ed] pt-4">
                    <details className="group rounded-[10px] border border-[#dfe4ea] bg-white" open={advancedOpen}>
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                            <div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">{advancedTitle}</div>
                                <div className="mt-1 text-[12px] text-[#59616c]">{advancedHint}</div>
                            </div>
                            <div className="text-[10px] font-semibold text-[#184eb8] group-open:hidden">Show</div>
                            <div className="hidden text-[10px] font-semibold text-[#184eb8] group-open:block">Hide</div>
                        </summary>
                        <div className="border-t border-[#e8ebef] p-4">{advanced}</div>
                    </details>
                </section>
            ) : null}
        </div>
    );
}
