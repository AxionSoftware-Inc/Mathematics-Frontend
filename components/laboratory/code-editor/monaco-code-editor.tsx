"use client";

import React from "react";
import dynamic from "next/dynamic";

const USE_MONACO = process.env.NEXT_PUBLIC_USE_MONACO_EDITOR === "true";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[420px] items-center justify-center bg-slate-950 text-sm font-semibold text-slate-300">
            Loading editor...
        </div>
    ),
});

type MonacoCodeEditorProps = {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    height?: string;
    readOnly?: boolean;
};

export function MonacoCodeEditor({
    value,
    onChange,
    language = "python",
    height = "620px",
    readOnly = false,
}: MonacoCodeEditorProps) {
    if (!USE_MONACO) {
        return (
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                spellCheck={false}
                style={{ height }}
                className="w-full resize-y border-0 bg-slate-950 p-5 font-mono text-[12px] leading-6 text-slate-100 outline-none"
            />
        );
    }

    return (
        <MonacoEditor
            height={height}
            language={language}
            theme="vs-dark"
            value={value}
            onChange={(nextValue) => onChange(nextValue ?? "")}
            options={{
                readOnly,
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 22,
                fontLigatures: true,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 16, bottom: 16 },
            }}
        />
    );
}
