"use client";

import React from "react";
import { BrainCircuit, Network, Sparkles, Workflow } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LABORATORY_PRESETS, trainSimpleNetwork } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type NeuralBlockId = "setup" | "history" | "weights" | "bridge";

const neuralNotebookBlocks = [
    { id: "setup" as const, label: "Architecture", description: "Layerlar va dataset" },
    { id: "history" as const, label: "Loss Trend", description: "O'qitish davomida xatolik grafigi" },
    { id: "weights" as const, label: "Weights", description: "Og'irliklar va prediction jadvali" },
    { id: "bridge" as const, label: "Bridge", description: "Writer bilan ulanish" },
];

function parseTrainingData(raw: string) {
    return raw
        .split(/;|\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const [inputPart, outputPart] = entry.split("->").map((part) => part.trim());
            return {
                x: JSON.parse(inputPart) as number[],
                y: Number(outputPart),
            };
        });
}

function predictWithSimpleNetwork(weights: number[][], sample: number[]) {
    if (weights.length < 2) {
        return 0;
    }

    const hiddenSize = weights[1].length;
    const hidden = Array.from({ length: hiddenSize }, (_, hiddenIndex) => {
        const sum = sample.reduce((acc, value, sampleIndex) => acc + value * weights[0][sampleIndex * hiddenSize + hiddenIndex], 0);
        return 1 / (1 + Math.exp(-sum));
    });

    const outputSum = hidden.reduce((acc, value, index) => acc + value * weights[1][index], 0);
    return 1 / (1 + Math.exp(-outputSum));
}

export function NeuralLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [layersStr, setLayersStr] = React.useState("2,4,1");
    const [dataStr, setDataStr] = React.useState("[0,0]->0; [0,1]->1; [1,0]->1; [1,1]->0");
    const [lr, setLr] = React.useState("0.1");
    const [epochs, setEpochs] = React.useState("50");

    const notebook = useLaboratoryNotebook<NeuralBlockId>({
        storageKey: "mathsphere-lab-neural-notebook",
        definitions: neuralNotebookBlocks,
        defaultBlocks: ["setup", "history", "weights"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const parsedSamples = React.useMemo(() => {
        try {
            return parseTrainingData(dataStr);
        } catch {
            return [];
        }
    }, [dataStr]);

    const trainingResult = React.useMemo(() => {
        try {
            const layers = layersStr.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value > 0);
            const data = parseTrainingData(dataStr);
            if (layers.length < 3) {
                throw new Error("Kamida uchta layer bo'lishi kerak: masalan 2,4,1.");
            }
            return trainSimpleNetwork(layers, data, Number(lr), Number(epochs));
        } catch {
            return null;
        }
    }, [dataStr, epochs, layersStr, lr]);

    const predictionRows = React.useMemo(() => {
        if (!trainingResult) {
            return [];
        }

        return parsedSamples.map((sample) => ({
            input: sample.x,
            expected: sample.y,
            predicted: predictWithSimpleNetwork(trainingResult.weights, sample.x),
        }));
    }, [parsedSamples, trainingResult]);

    const applyPreset = (preset: any) => {
        setLayersStr(preset.layers);
        setDataStr(preset.data);
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title={module.title || "Neural Intelligence Studio"}
                description="Backpropagation, weight tuning va mantiqiy misollar uchun interaktiv studiya."
                activeBlocks={notebook.activeBlocks}
                definitions={neuralNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Training controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground">MLP learning engine</div>
                                </div>
                                <div className="flex items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    <Network className="mr-2 h-3.5 w-3.5" /> Learning active
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="mb-1.5 ml-1 text-[10px] font-bold uppercase text-muted-foreground">Architecture</div>
                                    <input value={layersStr} onChange={(event) => setLayersStr(event.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <div className="mb-1.5 ml-1 text-[10px] font-bold uppercase text-muted-foreground">Training data</div>
                                    <textarea value={dataStr} onChange={(event) => setDataStr(event.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold outline-none focus:border-accent" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="site-outline-card p-3 space-y-1">
                                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Rate (eta)</div>
                                        <input value={lr} onChange={(event) => setLr(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                    <div className="site-outline-card p-3 space-y-1">
                                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Epochs</div>
                                        <input value={epochs} onChange={(event) => setEpochs(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm leading-7 text-muted-foreground">
                                    Dataset qatorlarini `;` yoki yangi qatordan ajrating. Masalan: `[0,1]-&gt;1; [1,1]-&gt;0`.
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("history") && trainingResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Loss history</div>
                            </div>
                            <div className="h-[320px]">
                                <CartesianPlot
                                    series={[{ label: "Average Loss", color: "var(--accent)", points: trainingResult.history.map((point) => ({ x: point.epoch, y: point.loss })) }]}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <MetricCard label="Final loss" value={trainingResult.history[trainingResult.history.length - 1]?.loss.toFixed(6) || "--"} tone="emerald" />
                                <MetricCard label="Samples" value={String(parsedSamples.length)} tone="amber" />
                                <MetricCard label="Layers" value={layersStr} tone="violet" />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("weights") && trainingResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Workflow className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Weights and predictions</div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {trainingResult.weights.map((layerWeights, layerIndex) => (
                                    <div key={layerIndex} className="site-outline-card p-4 space-y-3">
                                        <div className="text-[10px] font-black uppercase text-muted-foreground">Layer {layerIndex + 1}</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {layerWeights.map((weight, weightIndex) => (
                                                <div key={weightIndex} className={`flex h-9 items-center justify-center rounded-lg text-[10px] font-mono font-bold ${weight >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                                    {weight.toFixed(3)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border/60">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/10 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Input</th>
                                            <th className="px-4 py-3">Expected</th>
                                            <th className="px-4 py-3">Predicted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {predictionRows.map((row) => (
                                            <tr key={row.input.join(",")} className="border-t border-border/40">
                                                <td className="px-4 py-3 font-mono">{row.input.join(", ")}</td>
                                                <td className="px-4 py-3 font-mono">{row.expected}</td>
                                                <td className="px-4 py-3 font-mono">{row.predicted.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">AI presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.neural.map((preset) => (
                                <button key={preset.label} onClick={() => applyPreset(preset)} className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-3 text-left transition-all hover:border-accent/40 hover:bg-accent/5">
                                    <div>
                                        <div className="text-[11px] font-black tracking-tight text-foreground group-hover:text-accent font-serif">{preset.label}</div>
                                        <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{preset.layers}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!trainingResult}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={() => {}}
                            onSend={() => {}}
                            onPush={() => {}}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "violet" }) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/6 text-emerald-600",
        amber: "border-amber-500/20 bg-amber-500/6 text-amber-600",
        violet: "border-violet-500/20 bg-violet-500/6 text-violet-600",
    };

    return (
        <div className="site-outline-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{value}</div>
        </div>
    );
}
