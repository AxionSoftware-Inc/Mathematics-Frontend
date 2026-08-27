import React from "react";

type LaboratorySolveLayoutSection = {
    id: string;
    node: React.ReactNode;
    weight?: number;
};

function sectionSpan(weight = 1) {
    if (weight >= 3) return "xl:col-span-8";
    if (weight === 2) return "xl:col-span-4";
    return "xl:col-span-4";
}

export function LaboratorySolveLayout({
    control,
    visual,
    derivation,
    sections = [],
}: {
    control: React.ReactNode;
    visual: React.ReactNode;
    derivation?: React.ReactNode;
    sections?: Array<LaboratorySolveLayoutSection | null | false>;
}) {
    const visibleSections = sections.filter((section): section is LaboratorySolveLayoutSection => Boolean(section));

    return (
        <div className="space-y-5">
            <section className="grid items-start gap-5 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-4 xl:row-span-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">01 · Problem</div>
                        <div className="text-[10px] text-[#9aa1aa]">Input & method</div>
                    </div>
                    {control}
                </div>

                <div className="min-w-0 xl:col-span-8">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">02 · Primary view</div>
                        <div className="text-[10px] text-[#9aa1aa]">Result visualization</div>
                    </div>
                    {visual}
                </div>

                {derivation ? (
                    <div className="min-w-0 xl:col-span-8 xl:col-start-5">
                        <div className="mb-2 flex items-center justify-between px-1">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">03 · Interpretation</div>
                            <div className="text-[10px] text-[#9aa1aa]">Derivation & explanation</div>
                        </div>
                        {derivation}
                    </div>
                ) : null}
            </section>

            {visibleSections.length ? (
                <section className="border-t border-[#e6e9ee] pt-5">
                    <div className="mb-3 flex items-end justify-between gap-4 px-1">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">04 · Analysis</div>
                            <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">Details, checks and supporting results</div>
                        </div>
                    </div>
                    <div className="grid auto-rows-min grid-cols-1 gap-5 xl:grid-cols-12 xl:[grid-auto-flow:dense]">
                        {visibleSections.map((section) => (
                            <div key={section.id} className={`min-w-0 ${sectionSpan(section.weight)}`}>
                                {section.node}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
