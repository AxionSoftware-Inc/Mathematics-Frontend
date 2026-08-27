"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function LaboratoryMathPanel({
    eyebrow,
    title,
    content,
    accentClassName = "text-[#184eb8]",
}: {
    eyebrow: string;
    title: string;
    content: string;
    accentClassName?: string;
}) {
    return (
        <div className="rounded-[9px] border border-[#e1e5eb] bg-white px-4 py-4">
            <div className={`text-[9px] font-semibold uppercase tracking-[0.13em] ${accentClassName}`}>{eyebrow}</div>
            <div className="mt-1.5 font-serif text-[20px] tracking-[-0.025em] text-[#171a20]">{title}</div>
            <div className="mt-3 prose prose-sm max-w-none text-[#4f5864] prose-headings:font-serif prose-headings:text-[#171a20] prose-p:my-2 prose-p:leading-6 prose-li:my-0.5 prose-li:leading-6 prose-strong:text-[#242931] prose-code:text-[#242931]">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
}
