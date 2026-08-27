import React from "react";
import { LaboratoryInlineMathMarkdown } from "./laboratory-inline-math-markdown";

const toneClasses = {
    neutral: "border-[#e2e6ec] bg-white text-[#7a838f]",
    info: "border-[#dbe6f6] bg-[#fbfdff] text-[#184eb8]",
    success: "border-[#dbe9e0] bg-[#fcfefd] text-[#357557]",
    warn: "border-[#eee0c5] bg-[#fffdfa] text-[#946313]",
} as const;

export function LaboratorySolveDetailCard({
    id,
    action,
    result,
    formula,
    tone = "neutral",
}: {
    id: string;
    action: string;
    result: string;
    formula?: string;
    tone?: "neutral" | "info" | "success" | "warn";
}) {
    return (
        <div className={`grid gap-3 rounded-[9px] border px-4 py-3.5 sm:grid-cols-[42px_1fr] ${toneClasses[tone]}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-current/15 bg-white text-[10px] font-semibold">
                {id}
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#303741]">{action}</div>
                <div className="mt-1 text-[12px] leading-5 text-[#68717d]">{result}</div>
                {formula ? (
                    <div className="mt-2 overflow-x-auto rounded-[7px] border border-[#e4e8ed] bg-white px-3 py-2 text-[#242931]">
                        <LaboratoryInlineMathMarkdown content={formula} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
