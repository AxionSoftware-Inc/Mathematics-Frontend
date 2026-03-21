"use client";

import React from "react";
import { BrainCircuit, Network, Sparkles, Workflow, Layers3, Box, Activity } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { LABORATORY_PRESETS, trainSimpleNetwork } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { ArrowRight, Plus } from "lucide-react";

const exportGuides = {
    copy: {
        badge: "Neural export",
        title: "Model natijasini nusxalash",
        description: "O'qitish tarixi va og'irliklar hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Loss history grafigi ma'lumotlari yoziladi.",
            "Model arxitekturasi va dataset haqida qisqacha ma'lumot qo'shiladi.",
            "Prediction natijalari markdown jadval holida bo'ladi.",
        ],
        note: "Maqolaga neyron tarmoq o'qitish natijalarini qo'shish uchun qulay.",
    },
    send: {
        badge: "Writer import",
        title: "AI natijasini writer'ga yuborish",
        description: "O'qitish hisobotini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Neural export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Loss trend va model parametrlari draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type NeuralBlockId = "setup" | "history" | "weights" | "bridge";

const neuralNotebookBlocks = [
    { id: "setup" as const, label: "Architecture", description: "Layerlar va dataset" },
    { id: "history" as const, label: "Loss Trend", description: "O'qitish davomida xatolik grafigi" },
    { id: "weights" as const, label: "Weights", description: "Og'irliklar va prediction jadvali" },
    { id: "bridge" as const, label: "Bridge", description: "Writer bilan ulanish" },
];

const NEURAL_WORKFLOW_TEMPLATES = [
    {
        id: "xor-audit",
        title: "XOR Logic Audit",
        description: "Mantiqiy XOR muammosini MLP orqali yechish va yaqinlashishni tekshirish.",
        presetLabel: "XOR Logical Gate",
        blocks: ["setup", "history", "weights"] as const,
    },
    {
        id: "classifier-boundary",
        title: "Non-Linear Classifier",
        description: "Noma'lum qonuniyatlar bo'yicha ma'lumotlarni tasniflash tahlili.",
        presetLabel: "Basic Logic",
        blocks: ["setup", "history", "weights"] as const,
    },
] as const;

type NeuralAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type NeuralSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    layersStr: string;
    dataStr: string;
    lr: string;
    epochs: string;
};

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

function buildNeuralMarkdown(params: {
    layers: string;
    data: string;
    lr: string;
    epochs: string;
    result: ReturnType<typeof trainSimpleNetwork> | null;
}) {
    const { layers, data, lr, epochs, result } = params;
    if (!result) return "Neural network training result not found.";

    return `## Laboratory Export: Neural Intelligence Studio
        
### Configuration
- Architecture: \`${layers}\`
- Learning Rate: ${lr}
- Epochs: ${epochs}

### Training Result
- Final Loss: ${result.history[result.history.length - 1]?.loss.toFixed(8) || "--"}
- Epoch count: ${result.history.length}
- Weight layers: ${result.weights.length}`;
}

function buildNeuralLivePayload(params: {
    targetId: string;
    layers: string;
    lr: string;
    result: ReturnType<typeof trainSimpleNetwork> | null;
}): WriterBridgeBlockData {
    const { targetId, layers, lr, result } = params;

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "neural-lab",
        kind: "neural-network",
        title: `Neural Network Study: ${layers}`,
        summary: "Neural network training and weight convergence report.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Layers", value: layers },
            { label: "Learning Rate", value: lr },
            { label: "Final Loss", value: result?.history[result.history.length - 1]?.loss.toFixed(6) || "--" },
        ],
        notes: [`Epochs: ${result?.history.length || 0}`, `Weights layers: ${result?.weights.length || 0}`],
        plotSeries: [{ label: "Loss history", color: "var(--accent)", points: result?.history.map(p => ({ x: p.epoch, y: p.loss })) || [] }],
    };
}

export function NeuralLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [layersStr, setLayersStr] = React.useState(() => String(module.config?.defaultLayers ?? "2,4,1"));
    const [dataStr, setDataStr] = React.useState("[0,0]->0; [0,1]->1; [1,0]->1; [1,1]->0");
    const [lr, setLr] = React.useState("0.1");
    const [epochs, setEpochs] = React.useState("50");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<NeuralAnnotation[]>(() =>
        readStoredArray<NeuralAnnotation>("mathsphere-lab-neural-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<NeuralSavedExperiment[]>(() =>
        readStoredArray<NeuralSavedExperiment>("mathsphere-lab-neural-experiments"),
    );

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
                return null;
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
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = NEURAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.neural.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-neural-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-neural-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!trainingResult,
        sourceLabel: "Neural Intelligence Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildNeuralMarkdown({ layers: layersStr, data: dataStr, lr, epochs, result: trainingResult }),
        buildBlock: (targetId) => buildNeuralLivePayload({ targetId, layers: layersStr, lr, result: trainingResult }),
        getDraftMeta: () => ({
            title: `Neural Network Analysis (${layersStr})`,
            abstract: "Loss history and weight convergence analysis.",
            keywords: "neural,network,ai,ml,backpropagation",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (!trainingResult) {
            signals.push({ tone: "danger", label: "Model Error", text: "Architecture parametrlari noto'g'ri." });
        } else {
            const finalLoss = trainingResult.history[trainingResult.history.length - 1]?.loss;
            if (finalLoss > 0.1) {
                signals.push({ tone: "warn", label: "Underfitting", text: "Loss qiymati yuqori. Epochs yoki Learning Rate'ni oshirib ko'ring." });
            } else {
                signals.push({ tone: "info", label: "Converged", text: `Model converge bo'ldi. Final loss: ${finalLoss.toFixed(6)}` });
            }
        }
        return signals;
    }, [trainingResult]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Neural Network Mechanics",
        "- **Forward Pass** orqali inputlar layerlar bo'ylab o'tib, prediction hosil qilinadi.",
        "- **Backpropagation** xatolikni (loss) hisoblab, uni gradientlar orqali og'irliklarga tarqatadi.",
        "- **Sigmoid** aktivatsiya funksiyasi natijani [0, 1] oralig'iga siqadi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## MLP Training Report",
        `Architecture: ${layersStr}`,
        `Samples: ${parsedSamples.length}`,
        "",
        "### Performance Metrics",
        trainingResult ? `- Final Loss = ${trainingResult.history[trainingResult.history.length - 1]?.loss.toFixed(6)}` : "- N/A",
        "- Convergence trend indicates stable learning profile.",
    ].join("\n"), [layersStr, parsedSamples, trainingResult]);

    function addAnnotation() {
        if (!trainingResult) return;
        const note: NeuralAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Model Observation",
            note: annotationNote || "Observation during training.",
            anchor: `Loss: ${trainingResult.history[trainingResult.history.length - 1]?.loss.toFixed(4)}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: NeuralSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Neural Experiment",
            savedAt: new Date().toISOString(),
            layersStr,
            dataStr,
            lr,
            epochs
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: NeuralSavedExperiment) {
        setLayersStr(exp.layersStr);
        setDataStr(exp.dataStr);
        setLr(exp.lr);
        setEpochs(exp.epochs);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Neural Intelligence Studio"
                description="Backpropagation, weight tuning va mantiqiy misollar uchun interaktiv studiya."
                activeBlocks={notebook.activeBlocks}
                definitions={neuralNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun neyron tarmoq bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-emerald-600">Architecture Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">MLP Engine Active</div>
                                </div>
                                <div className="flex items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-lg shadow-emerald-500/5 transition-all">
                                    <Network className="mr-2 h-3.5 w-3.5" /> Learning Mode
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="mb-1.5 ml-1 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Architecture (layers)</div>
                                    <input value={layersStr} onChange={(event) => setLayersStr(event.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <div className="mb-1.5 ml-1 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Training dataset</div>
                                    <textarea value={dataStr} onChange={(event) => setDataStr(event.target.value)} className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold outline-none focus:border-accent" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="site-outline-card p-4 space-y-1">
                                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Learning Rate (η)</div>
                                        <input value={lr} onChange={(event) => setLr(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                    <div className="site-outline-card p-4 space-y-1">
                                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Epoch Count</div>
                                        <input value={epochs} onChange={(event) => setEpochs(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <div className="site-eyebrow text-emerald-600">Model Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.neural.map((preset) => (
                                <button key={preset.label} onClick={() => applyPreset(preset)} className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-3 text-left transition-all hover:border-emerald-600/40 hover:bg-emerald-600/5">
                                    <div>
                                        <div className="text-[11px] font-black tracking-tight text-foreground group-hover:text-emerald-600 font-serif">{preset.label}</div>
                                        <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{preset.layers}</div>
                                    </div>
                                    <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-emerald-600" />
                                <div className="site-eyebrow text-emerald-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {NEURAL_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-emerald-600/40 bg-emerald-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-emerald-600/40 hover:bg-emerald-600/5"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-[11px] font-black tracking-tight text-foreground font-serif">{template.title}</div>
                                                <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{template.description}</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <LaboratorySignalPanel
                        eyebrow="Neural Signals"
                        title="Model health & training"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-fuchsia-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-emerald-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-emerald-600/80 transition-colors">Save Annotation</button>
                        </div>
                        <div className="space-y-2 mt-4">
                            {annotations.map(a => (
                                <div key={a.id} className="p-3 rounded-xl border border-border/60 bg-muted/5">
                                    <div className="text-xs font-bold">{a.title}</div>
                                    <div className="text-[10px] text-muted-foreground mt-1">{a.note}</div>
                                    <div className="text-[9px] mt-2 opacity-50">{a.anchor}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-emerald-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600/40" />
                             <button onClick={saveExperiment} className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-emerald-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.layersStr} - {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("history") && trainingResult && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Loss Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="site-eyebrow text-emerald-600">Convergence Trend</div>
                                        <div className="site-outline-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final: {trainingResult.history[trainingResult.history.length - 1]?.loss.toFixed(6)}</div>
                                    </div>
                                    <div className="h-[300px] w-full">
                                        <CartesianPlot
                                            series={[{ label: "Average Loss", color: "var(--accent)", points: trainingResult.history.map((point) => ({ x: point.epoch, y: point.loss })) }]}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Samples</div>
                                            <div className="mt-1 font-serif text-xl font-black">{parsedSamples.length}</div>
                                        </div>
                                        <div className="site-outline-card p-4 border-emerald-600/20 bg-emerald-600/5">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Layers</div>
                                            <div className="mt-1 font-mono text-sm font-bold">{layersStr}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Epochs</div>
                                            <div className="mt-1 font-serif text-xl font-black">{trainingResult.history.length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("weights") && trainingResult && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Workflow className="h-4 w-4 text-emerald-600" />
                                <div className="site-eyebrow text-emerald-600">Network Insight</div>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Weights distribution
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground">
                                        {trainingResult.weights.length} ta layer og'irliklari backpropagation orqali yangilandi.
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Performance insight
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground">
                                        Model {epochs} epoch davomida loss trendini {trainingResult.history[0].loss.toFixed(4)} dan {trainingResult.history[trainingResult.history.length-1].loss.toFixed(4)} gacha tushirdi.
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-border/60">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/10 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-black">Input set</th>
                                            <th className="px-4 py-3 font-black">Goal</th>
                                            <th className="px-4 py-3 font-black">Output</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {predictionRows.map((row) => (
                                            <tr key={row.input.join(",")} className="transition-colors hover:bg-emerald-600/5">
                                                <td className="px-4 py-4 font-mono text-xs">{row.input.join(", ")}</td>
                                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.expected}</td>
                                                <td className="px-4 py-4 font-mono text-xs font-bold text-emerald-600">{row.predicted.toFixed(5)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!trainingResult}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={exportGuides}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={copyMarkdownExport}
                            onSend={sendToWriter}
                            onPush={pushLiveResult}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
