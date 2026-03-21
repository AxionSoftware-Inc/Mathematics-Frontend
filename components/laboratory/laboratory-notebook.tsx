"use client";

import React from "react";
import { Plus, X } from "lucide-react";

export type LaboratoryNotebookBlockDefinition<TBlockId extends string> = {
    id: TBlockId;
    label: string;
    description?: string;
};

export function useLaboratoryNotebook<TBlockId extends string>(params: {
    storageKey: string;
    definitions: readonly LaboratoryNotebookBlockDefinition<TBlockId>[];
    defaultBlocks: readonly TBlockId[];
}) {
    const { storageKey, definitions, defaultBlocks } = params;
    const [activeBlocks, setActiveBlocks] = React.useState<TBlockId[]>(() => {
        if (typeof window === "undefined") {
            return [...defaultBlocks];
        }

        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return [...defaultBlocks];
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [...defaultBlocks];
            }

            const valid = parsed.filter((item): item is TBlockId => definitions.some((block) => block.id === item));
            return valid.length ? valid : [...defaultBlocks];
        } catch {
            return [...defaultBlocks];
        }
    });

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, JSON.stringify(activeBlocks));
        }
    }, [activeBlocks, storageKey]);

    function addBlock(blockId: TBlockId) {
        setActiveBlocks((current) => (current.includes(blockId) ? current : [...current, blockId]));
    }

    function removeBlock(blockId: TBlockId) {
        setActiveBlocks((current) => current.filter((item) => item !== blockId));
    }

    function hasBlock(blockId: TBlockId) {
        return activeBlocks.includes(blockId);
    }

    function setBlocks(blockIds: readonly TBlockId[]) {
        const valid = blockIds.filter((item): item is TBlockId => definitions.some((block) => block.id === item));
        setActiveBlocks(valid.length ? [...valid] : [...defaultBlocks]);
    }

    return {
        activeBlocks,
        addBlock,
        removeBlock,
        hasBlock,
        setBlocks,
    };
}

export function LaboratoryNotebookToolbar<TBlockId extends string>({
    title = "Addable Blocks",
    description = "Kerakli blokni qo'shib yoki yopib ishlating.",
    activeBlocks,
    definitions,
    onAddBlock,
    onRemoveBlock,
    controls,
}: {
    title?: string;
    description?: string;
    activeBlocks: readonly TBlockId[];
    definitions: readonly LaboratoryNotebookBlockDefinition<TBlockId>[];
    onAddBlock: (blockId: TBlockId) => void;
    onRemoveBlock: (blockId: TBlockId) => void;
    controls?: React.ReactNode;
}) {
    return (
        <div className="site-panel border-border/60 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Notebook Workspace</div>
                        <h2 className="font-serif text-lg font-black text-foreground">{title}</h2>
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                            {activeBlocks.length} active
                        </div>
                    </div>
                    {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
                </div>
                {controls ? <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-start">{controls}</div> : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
                {definitions.map((block) => {
                    const active = activeBlocks.includes(block.id);
                    return (
                        <button
                            key={block.id}
                            type="button"
                            onClick={() => (active ? onRemoveBlock(block.id) : onAddBlock(block.id))}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                                active
                                    ? "border-foreground bg-foreground text-background shadow-lg shadow-slate-900/10"
                                    : "border-border bg-background/75 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                            }`}
                            title={block.description}
                        >
                            {active ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {block.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function LaboratoryNotebookEmptyState({ message }: { message: string }) {
    return (
        <div className="site-panel p-5">
            <div className="site-eyebrow">Empty notebook</div>
            <h2 className="mt-1 font-serif text-2xl font-black">Hozircha block yoqilmagan.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
    );
}
