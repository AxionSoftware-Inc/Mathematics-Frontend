"use client";

type LaboratorySignalTone = "neutral" | "info" | "warn" | "danger";

type LaboratorySignal = {
    tone: LaboratorySignalTone;
    label: string;
    text: string;
};

function signalToneClassName(tone: LaboratorySignalTone) {
    if (tone === "danger") return "border-[#f0d8dd] bg-[#fffafb] text-[#a23c50]";
    if (tone === "warn") return "border-[#eee0c5] bg-[#fffdfa] text-[#946313]";
    if (tone === "info") return "border-[#dbe6f6] bg-[#fbfdff] text-[#184eb8]";
    return "border-[#e2e6ec] bg-white text-[#69727e]";
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
    if (!items.length) return null;

    return (
        <section className="rounded-[10px] border border-[#e1e5eb] bg-white p-4">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#eceff3] pb-3">
                <div>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">{eyebrow}</div>
                    <div className="mt-1 font-serif text-[19px] tracking-[-0.02em] text-[#171a20]">{title}</div>
                </div>
                <div className="text-[10px] text-[#9aa1aa]">{items.length} signal{items.length === 1 ? "" : "s"}</div>
            </div>

            <div className="mt-3 grid gap-2">
                {items.map((item) => (
                    <div key={`${item.label}-${item.text}`} className={`grid gap-2 rounded-[8px] border px-3 py-2.5 sm:grid-cols-[120px_1fr] ${signalToneClassName(item.tone)}`}>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.11em]">{item.label}</div>
                        <div className="text-[11px] leading-5 text-[#5f6874]">{item.text}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export type { LaboratorySignal, LaboratorySignalTone };
