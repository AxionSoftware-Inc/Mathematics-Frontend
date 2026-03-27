import React from "react";

type LaboratorySolveLayoutSection = {
    id: string;
    node: React.ReactNode;
    weight?: number;
};

function distributeSections(sections: LaboratorySolveLayoutSection[]) {
    const left: LaboratorySolveLayoutSection[] = [];
    const right: LaboratorySolveLayoutSection[] = [];
    let leftWeight = 0;
    let rightWeight = 0;

    for (const section of sections) {
        const weight = section.weight ?? 1;
        if (leftWeight <= rightWeight) {
            left.push(section);
            leftWeight += weight;
        } else {
            right.push(section);
            rightWeight += weight;
        }
    }

    return { left, right };
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
    sections?: LaboratorySolveLayoutSection[];
}) {
    const { left, right } = distributeSections(sections);
    const showTwoColumns = left.length > 0 && right.length > 0;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div>{control}</div>
                <div className="space-y-4">
                    {visual}
                    {derivation}
                </div>
            </div>

            <div className={showTwoColumns ? "grid gap-4 xl:grid-cols-[1.05fr_0.95fr]" : "grid gap-4"}>
                <div className="space-y-4">
                    {left.map((section) => (
                        <React.Fragment key={section.id}>{section.node}</React.Fragment>
                    ))}
                </div>
                {showTwoColumns ? (
                    <div className="space-y-4">
                        {right.map((section) => (
                            <React.Fragment key={section.id}>{section.node}</React.Fragment>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
