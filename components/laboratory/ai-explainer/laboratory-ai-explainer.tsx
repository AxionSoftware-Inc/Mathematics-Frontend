"use client";

import React from "react";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { fetchPublic } from "@/lib/api";

type AIExplainPayload = {
    module: string;
    expression: string;
    expression_latex?: string;
    lower?: string;
    upper?: string;
    result_latex?: string | null;
    numeric_approximation?: string | null;
    method?: Record<string, unknown>;
    steps?: Array<Record<string, unknown>>;
    reproducibility?: Record<string, unknown>;
};

type LaboratoryAIExplainerProps = {
    payload: AIExplainPayload;
    disabled?: boolean;
};

function normalizeMathMarkdown(value: string) {
    return value
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$${math.trim()}$$\n\n`)
        .replace(/^\s*\[\s*(\\[^\]\n]+?)\s*\]\s*$/gm, (_, math) => `\n\n$$${math.trim()}$$\n\n`);
}

async function requestAIExplanation(payload: AIExplainPayload) {
    const response = await fetchPublic("/api/laboratory/ai/explain/stream/", {
        method: "POST",
        body: JSON.stringify(payload),
        timeoutMs: 70000,
    });
    if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "AI explanation failed.");
    }
    return response.body;
}

export function LaboratoryAIExplainer({ payload, disabled = false }: LaboratoryAIExplainerProps) {
    const [content, setContent] = React.useState("");
    const [model, setModel] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const runExplanation = async () => {
        setIsLoading(true);
        setError("");
        setContent("");
        setModel("");
        try {
            const body = await requestAIExplanation(payload);
            const reader = body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                setContent((current) => `${current}${chunk}`);
            }
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : "AI explanation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="site-panel p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="site-eyebrow">AI step writer</div>
                        <h3 className="text-lg font-black tracking-tight text-foreground">Step-by-step test module</h3>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={runExplanation}
                    disabled={disabled || isLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Explain
                </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Bu modul solver natijasini qayta yechmaydi. U faqat mavjud SymPy/SciPy step payloaddan qisqa
                step-by-step izoh yozadi.
            </p>

            {model ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Model: {model}
                </div>
            ) : null}

            {error ? (
                <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                    <div className="font-bold">AI server ulanmagan yoki javob bermadi.</div>
                    <div className="mt-2">{error}</div>
                    <div className="mt-3 text-xs leading-5 text-destructive/80">
                        LM Studio ichida modelni load qiling, local serverni yoqing va endpoint
                        <span className="font-mono"> http://127.0.0.1:1234/v1/chat/completions</span> ishlayotganini tekshiring.
                    </div>
                </div>
            ) : null}

            {content ? (
                <div className="prose prose-sm mt-5 max-w-none rounded-2xl border border-border/70 bg-background p-4 text-foreground shadow-sm dark:prose-invert prose-p:leading-7 prose-li:text-foreground prose-strong:text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {normalizeMathMarkdown(content)}
                    </ReactMarkdown>
                </div>
            ) : isLoading ? (
                <div className="mt-5 rounded-2xl border border-border/70 bg-background p-4 text-sm font-semibold text-foreground">
                    LM Studio yozishni boshlashi kutilmoqda...
                </div>
            ) : null}
        </div>
    );
}
