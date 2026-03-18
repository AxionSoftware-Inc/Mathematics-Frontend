"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { JupyterTerminalElement } from "@/components/jupyter-cell";
import { LabResultCard } from "@/components/live-writer-bridge/lab-result-card";
import { PlotRenderer } from "@/components/plot-renderer";
import { parseWriterBridgeBlock } from "@/lib/live-writer-bridge";

function looksLikeHtml(content: string) {
    return /<\/?[a-z][\s\S]*>/i.test(content);
}

export function ArticleRichContent({
    content,
    className = "",
}: {
    content: string;
    className?: string;
}) {
    if (!content) {
        return null;
    }

    if (looksLikeHtml(content)) {
        return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
    }

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code(props) {
                        const { children, className: codeClassName, ...rest } = props;
                        const plotMatch = /language-(plot2d|plot3d)/.exec(codeClassName || "");

                        if (plotMatch) {
                            return (
                                <PlotRenderer
                                    code={String(children).replace(/\n$/, "")}
                                    type={plotMatch[1] as "plot2d" | "plot3d"}
                                />
                            );
                        }

                        if (/language-python/.test(codeClassName || "")) {
                            return <JupyterTerminalElement code={String(children).replace(/\n$/, "")} />;
                        }

                        if (/language-lab-result/.test(codeClassName || "")) {
                            const parsed = parseWriterBridgeBlock(String(children).replace(/\n$/, ""));

                            if (parsed) {
                                return <LabResultCard block={parsed} />;
                            }
                        }

                        return (
                            <code className={codeClassName} {...rest}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
