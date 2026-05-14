"use client";

import React from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, Loader2, RotateCcw, Sparkles } from "lucide-react";
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

type AIModelStatus = {
    available?: boolean;
    configured_model?: string;
    model_loaded?: boolean | null;
    latency_ms?: number;
    message?: string;
};

function normalizeMathMarkdown(value: string) {
    return value
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$${math.trim()}$$\n\n`)
        .replace(/^\s*\[\s*(\\[^\]\n]+?)\s*\]\s*$/gm, (_, math) => `\n\n$$${math.trim()}$$\n\n`);
}

function sanitizeStepOutput(value: string) {
    const lines = value
        .replace(/^Explanation:\s*/gim, "")
        .split("\n")
        .filter((line) => !/^\s*(let'?s proceed|parser translation:|method detection:)\s*$/i.test(line.trim()));
    const numbered = lines.filter((line) => /^\s*\d+\.\s+/.test(line));
    if (numbered.length >= 3) {
        return numbered.slice(0, 6).join("\n\n");
    }
    return lines.slice(0, 28).join("\n");
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
    const [status, setStatus] = React.useState<AIModelStatus | null>(null);
    const [latencyMs, setLatencyMs] = React.useState<number | null>(null);
    const [chunkCount, setChunkCount] = React.useState(0);

    const refreshStatus = React.useCallback(async () => {
        const response = await fetchPublic("/api/laboratory/ai/status/", { timeoutMs: 4000 });
        if (!response.ok) {
            setStatus({ available: false, message: "AI status endpoint failed." });
            return;
        }
        const data = (await response.json()) as AIModelStatus;
        setStatus(data);
        if (data.configured_model) {
            setModel(data.configured_model);
        }
    }, []);

    React.useEffect(() => {
        refreshStatus().catch((errorValue) => {
            setStatus({ available: false, message: errorValue instanceof Error ? errorValue.message : "AI status unavailable." });
        });
    }, [refreshStatus]);

    const runExplanation = async () => {
        setIsLoading(true);
        setError("");
        setContent("");
        setLatencyMs(null);
        setChunkCount(0);
        const startedAt = performance.now();
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
                setChunkCount((current) => current + 1);
                setContent((current) => `${current}${chunk}`);
            }
            setLatencyMs(Math.round(performance.now() - startedAt));
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => refreshStatus()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Refresh AI status"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={runExplanation}
                        disabled={disabled || isLoading || status?.available === false}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Explain
                    </button>
                </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    AI explanation only. Source of truth: SymPy/SciPy solver, verification certificate, and reproducible code.
                </div>
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-xs font-bold leading-5 text-muted-foreground">
                    Prompt schema v1 · max 6 steps · streamed text · retry safe
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-muted-foreground">
                    {status?.available ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                    {status?.available ? "LM Studio ready" : "LM Studio offline"}
                </div>
                {model ? (
                    <div className="rounded-full border border-border/70 bg-background px-3 py-2 text-muted-foreground">
                        Model: {model}
                    </div>
                ) : null}
                {status?.latency_ms !== undefined ? (
                    <div className="rounded-full border border-border/70 bg-background px-3 py-2 text-muted-foreground">
                        Status latency: {status.latency_ms} ms
                    </div>
                ) : null}
                {latencyMs !== null ? (
                    <div className="rounded-full border border-border/70 bg-background px-3 py-2 text-muted-foreground">
                        Stream: {latencyMs} ms · {chunkCount} chunks
                    </div>
                ) : null}
            </div>

            {status?.available === false && status.message ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
                    {status.message}
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
                        {normalizeMathMarkdown(sanitizeStepOutput(content))}
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
