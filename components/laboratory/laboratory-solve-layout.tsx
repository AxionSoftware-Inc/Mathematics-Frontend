import React from "react";

type LaboratorySolveLayoutSection = {
    id: string;
    node: React.ReactNode;
    weight?: number;
};

export function LaboratorySolveLayout({
    control,
    visual,
    derivation,
    sections = [],
}: {
    control: React.ReactNode;
    visual: React.ReactNode;
    derivation?: React.ReactNode;
    sections?: LaboratorySolveLayoutSection[];
}) {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div>{control}</div>
                <div className="space-y-4">
                    {visual}
                    {derivation}
                </div>
            </div>

            <div className="grid auto-rows-min gap-5 xl:grid-cols-2">
                {sections.map((section) => (
                    <div key={section.id}>
                        {section.node}
                    </div>
                ))}
            </div>
        </div>
    );
}
