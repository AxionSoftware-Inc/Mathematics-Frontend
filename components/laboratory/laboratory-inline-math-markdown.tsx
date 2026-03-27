import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function looksLikeMathExpression(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
        return false;
    }

    if (trimmed.includes("$$") || trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) {
        return true;
    }

    return /\\[a-zA-Z]+|[{}_^]|(?:^|[^a-zA-Z])(?:sin|cos|tan|log|ln|sum|int|lim|sqrt|frac)(?:[^a-zA-Z]|$)|[=<>]/.test(trimmed);
}

export function normalizeLaboratoryMathContent(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
        return "";
    }

    if (trimmed.includes("$$") || trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) {
        return trimmed;
    }

    const hasMarkdownStructure = /(^|\n)\s*([-*]|\d+\.)\s|(^|\n)#{1,6}\s|`/.test(trimmed);
    if (hasMarkdownStructure) {
        return trimmed;
    }

    if (looksLikeMathExpression(trimmed)) {
        return trimmed.includes("\n") ? `$$\n${trimmed}\n$$` : `$$${trimmed}$$`;
    }

    return trimmed;
}

export function LaboratoryInlineMathMarkdown({ content }: { content: string }) {
    const normalizedContent = normalizeLaboratoryMathContent(content);

    return (
        <div className="prose prose-sm max-w-none prose-p:leading-7 prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-strong:font-black prose-li:text-foreground [&_.katex-display]:overflow-x-auto [&_.katex]:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}
