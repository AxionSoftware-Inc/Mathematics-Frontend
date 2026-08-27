import React from "react";

const toneClasses = {
    neutral: "border-[#e2e6ec] bg-white text-[#727b87]",
    info: "border-[#dbe6f6] bg-[#fbfdff] text-[#184eb8]",
    success: "border-[#dbe9e0] bg-[#fcfefd] text-[#357557]",
    warn: "border-[#eee0c5] bg-[#fffdfa] text-[#946313]",
} as const;

export function LaboratoryMetricCard({
    eyebrow,
    value,
    detail,
    tone = "neutral",
}: {
    eyebrow: string;
    value: string;
    detail: string;
    tone?: "neutral" | "info" | "success" | "warn";
}) {
    return (
        <div className={`min-w-0 rounded-[9px] border px-4 py-3.5 ${toneClasses[tone]}`}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.13em] opacity-90">{eyebrow}</div>
            <div className="mt-1.5 truncate font-serif text-[22px] leading-tight tracking-[-0.025em] text-[#171a20]" title={value}>
                {value}
            </div>
            <div className="mt-1.5 line-clamp-2 text-[10px] leading-[1.55] text-[#737c88]">{detail}</div>
        </div>
    );
}
