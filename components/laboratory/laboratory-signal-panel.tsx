"use client";

type LaboratorySignalTone = "neutral" | "info" | "warn" | "danger";

type LaboratorySignal = {
    tone: LaboratorySignalTone;
    label: string;
    text: string;
};

function signalToneClassName(tone: LaboratorySignalTone) {
    if (tone === "danger") {
        return "border-rose-500/25 bg-rose-500/10 text-rose-700";
    }
    if (tone === "warn") {
        return "border-amber-500/25 bg-amber-500/10 text-amber-700";
    }
    if (tone === "info") {
        return "border-sky-500/25 bg-sky-500/10 text-sky-700";
    }
    return "border-border/60 bg-background/55 text-foreground";
}

export function LaboratorySignalPanel({
    eyebrow,
    title,
    items,
}: {
    eyebrow: string;
    title: string;
    items: LaboratorySignal[];
}) {
    if (!items.length) {
        return null;
    }

    return (
        <div className="site-panel p-6 space-y-4">
            <div>
                <div className="site-eyebrow text-accent">{eyebrow}</div>
                <div className="mt-2 text-xl font-black text-foreground">{title}</div>
            </div>

            <div className="grid gap-3">
                {items.map((item) => (
                    <div key={`${item.label}-${item.text}`} className={`rounded-2xl border px-4 py-3 ${signalToneClassName(item.tone)}`}>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em]">{item.label}</div>
                        <div className="mt-2 text-sm leading-6">{item.text}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export type { LaboratorySignal, LaboratorySignalTone };
