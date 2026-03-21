"use client";

export type LaboratoryResultLevelCard = {
    label: string;
    tone: string;
    summary: string;
};

export function LaboratoryResultLevelsPanel({
    cards,
    description = "Bir xil natijani tez, texnik va research darajada ko'rib chiqing.",
    eyebrow = "Result Levels",
}: {
    cards: readonly LaboratoryResultLevelCard[];
    description?: string;
    eyebrow?: string;
}) {
    if (!cards.length) {
        return null;
    }

    return (
        <div className="site-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="site-eyebrow text-accent">{eyebrow}</div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">{description}</div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Quick / Technical / Research
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-4">
                        <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${card.tone}`}>{card.label}</div>
                        <div className="mt-3 text-sm leading-7 text-foreground">{card.summary}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
