import React from "react";
import { LaboratoryFormattingService } from "./services/formatting-service";

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
    const tones = LaboratoryFormattingService.getStepToneClasses(tone);
    return (
        <div className={`rounded-3xl border px-5 py-4 shadow-sm transition-all hover:shadow-md ${tones.card}`}>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${tones.badge}`}>
                {eyebrow}
            </div>
            <div className="mt-1 font-serif text-2xl font-black text-foreground">
                {value}
            </div>
            <div className="mt-1 text-[10px] leading-5 text-muted-foreground/80 font-medium">
                {detail}
            </div>
        </div>
    );
}
