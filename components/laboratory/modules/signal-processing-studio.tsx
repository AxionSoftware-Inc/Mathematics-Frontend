"use client";

import React from "react";
import { Activity, Radio, Sparkles, Target, Zap, Waves, Activity as Oscilloscope, AudioLines, ArrowRight, Plus } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { createDefaultBridgeGuides } from "@/components/live-writer-bridge/bridge-guides";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { calculateFFT, generateWaveform, findPeakFrequency, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type SignalBlockId = "controls" | "time" | "freq" | "bridge";

const signalNotebookBlocks = [
    { id: "controls" as const, label: "Controls", description: "Waveform, Freq va Gain setup" },
    { id: "time" as const, label: "Oscilloscope", description: "Time-domain waveform preview" },
    { id: "freq" as const, label: "FFT Spectrum", description: "Frequency-domain spectral analysis" },
    { id: "bridge" as const, label: "Bridge", description: "Export results" },
];

const signalBridgeGuides = createDefaultBridgeGuides("Signal", "Signal processing");

const SIGNAL_WORKFLOW_TEMPLATES = [
    {
        id: "harmonic-audit",
        title: "Harmonic Audit",
        description: "Murakkab to'lqinlarni spektral tahlil qilish va garmonikalarni tekshirish.",
        presetLabel: "Square Harmonic",
        blocks: ["controls", "time", "freq", "bridge"] as const,
    },
    {
        id: "noise-floor-study",
        title: "Noise Floor Study",
        description: "Signal va shovqin nisbatini (SNR) tahlil qilish uchun oqim.",
        presetLabel: "Noisy Signal",
        blocks: ["controls", "freq"] as const,
    },
    {
        id: "resonance-capture",
        title: "Resonance Capture",
        description: "Peak frequency tahlili orqali rezonans nuqtalarini aniqlash.",
        presetLabel: "Pure Sine (440Hz)",
        blocks: ["controls", "freq", "time"] as const,
    },
] as const;

type SignalAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type SignalSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    waveType: string;
    freq: string;
    amp: string;
    noise: string;
};

type SignalAnalysisResult = {
    timeDomain: Array<{ x: number; y: number }>;
    frequencyDomain: Array<{ x: number; y: number }>;
    peakFrequency: number;
};

function buildSignalMarkdown(waveType: string, freq: string, amp: string, noise: string, analysis: SignalAnalysisResult) {
    return `## Laboratory Export: Signal Processing Studio

### Signal Setup
- Wave: ${waveType}
- Frequency: ${freq} Hz
- Amplitude: ${amp}
- Noise floor: ${noise}

### Spectrum
- Dominant peak: ${analysis.peakFrequency} Hz
- Validation delta: ${Math.abs(analysis.peakFrequency - Number(freq))}`;
}

function buildSignalLivePayload(targetId: string, waveType: string, freq: string, amp: string, noise: string, analysis: SignalAnalysisResult): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "signal-processing-studio",
        kind: "signal-analysis",
        title: `Signal studio: ${waveType} @ ${freq} Hz`,
        summary: "Time-domain waveform va FFT spectrum writer ichiga yuborildi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Wave", value: waveType },
            { label: "Target Hz", value: freq },
            { label: "Peak Hz", value: String(analysis.peakFrequency) },
            { label: "Amplitude", value: amp },
        ],
        notes: [`Noise floor: ${noise}`, `Peak delta: ${Math.abs(analysis.peakFrequency - Number(freq))}`],
        plotSeries: [
            { label: "Waveform", color: "#0f766e", points: analysis.timeDomain },
            { label: "Spectrum", color: "#f59e0b", points: analysis.frequencyDomain },
        ],
    };
}

export function SignalProcessingStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [waveType, setWaveType] = React.useState<string>("sine");
    const [freq, setFreq] = React.useState<string>("440");
    const [amp, setAmp] = React.useState<string>("1");
    const [noise, setNoise] = React.useState<string>("0");
    
    const notebook = useLaboratoryNotebook<SignalBlockId>({
        storageKey: "mathsphere-lab-signal-notebook",
        definitions: signalNotebookBlocks,
        defaultBlocks: ["controls", "time", "freq"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<SignalAnnotation[]>(() =>
        readStoredArray<SignalAnnotation>("mathsphere-lab-signal-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<SignalSavedExperiment[]>(() =>
        readStoredArray<SignalSavedExperiment>("mathsphere-lab-signal-experiments"),
    );

    const analysis = React.useMemo<SignalAnalysisResult | null>(() => {
        try {
            const f = Number(freq);
            const a = Number(amp);
            const n = Number(noise);
            const sampleRate = 4096;
            const duration = 0.05; // 50ms for visualization
            
            const { samples, points } = generateWaveform(waveType, f, a, n, sampleRate, duration);
            const spectrum = calculateFFT(samples, sampleRate);
            const peak = findPeakFrequency(spectrum);

            return {
                timeDomain: points,
                frequencyDomain: spectrum.map(s => ({ x: s.freq, y: s.magnitude })),
                peakFrequency: peak
            };
        } catch { return null; }
    }, [waveType, freq, amp, noise]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.signal)[number]) => {
        setWaveType(preset.wave);
        setFreq(String(preset.f));
        setAmp(String(preset.a || 1));
        setNoise(String(preset.noise || 0));
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = SIGNAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.signal.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-signal-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-signal-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(analysis),
        sourceLabel: "Signal Processing Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildSignalMarkdown(waveType, freq, amp, noise, analysis as SignalAnalysisResult),
        buildBlock: (targetId) => buildSignalLivePayload(targetId, waveType, freq, amp, noise, analysis as SignalAnalysisResult),
        getDraftMeta: () => ({
            title: "Signal Processing Report",
            abstract: "Exported signal processing results.",
            keywords: "signal, fft, waveform",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (!analysis) {
            signals.push({ tone: "danger", label: "Synthesis Error", text: "Signal parametrlari noto'g'ri." });
        } else {
            const delta = Math.abs(analysis.peakFrequency - Number(freq));
            if (delta > 10) {
                signals.push({ tone: "warn", label: "Spectral Inconsistency", text: "Peak frequency kiritilgan chastotadan farq qiladi. Shovqin yuqori bo'lishi mumkin." });
            } else {
                signals.push({ tone: "info", label: "Signal Locked", text: `Dominant chastota: ${analysis.peakFrequency} Hz.` });
            }
            if (Number(noise) > 0.5) {
                signals.push({ tone: "warn", label: "High Noise", text: "Signal floor shovqin bilan to'yingan." });
            }
        }
        return signals;
    }, [analysis, freq, noise]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Signal Processing Principles",
        "- **Time Domain** (Oscilloscope) signalni vaqt o'tishi bilan qanday o'zgarishini ko'rsatadi.",
        "- **Frequency Domain** (FFT) signal ichidagi garmonikalarni va ularning quvvatini aniqlaydi.",
        "- **Nyquist-Shannon** teoremasiga ko'ra, signalni tiklash uchun sample rate 2 barobar yuqori bo'lishi kerak.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Signal Spectral Audit",
        `Input Wave: ${waveType}`,
        `Target Frequency: ${freq} Hz`,
        "",
        "### Observations",
        analysis ? `- Peak Frequency detected at ${analysis.peakFrequency} Hz.` : "- No spectral data.",
        "- Spectral analysis shows consistent harmonic alignment.",
    ].join("\n"), [waveType, freq, analysis]);

    function addAnnotation() {
        if (!analysis) return;
        const note: SignalAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Signal Insight",
            note: annotationNote || "Current spectral observation.",
            anchor: `Peak: ${analysis.peakFrequency} Hz`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: SignalSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Signal Experiment",
            savedAt: new Date().toISOString(),
            waveType,
            freq,
            amp,
            noise
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: SignalSavedExperiment) {
        setWaveType(exp.waveType);
        setFreq(exp.freq);
        setAmp(exp.amp);
        setNoise(exp.noise);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Signal Processing Studio"
                description="Fourier Tahlili, Spectral Density va Waveform Synthesis."
                activeBlocks={notebook.activeBlocks}
                definitions={signalNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("controls") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Synthesis Engine</div>
                                    <div className="flex gap-2">
                                        {(["sine", "square", "sawtooth", "triangle"] as const).map(w => (
                                            <button key={w} onClick={() => setWaveType(w)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${waveType === w ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{w}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center">
                                    <AudioLines className="mr-2 h-3.5 w-3.5" /> Signal Active
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Freq (Hz)</div>
                                    <input value={freq} onChange={e => setFreq(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                </div>
                                <div className="site-outline-card p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amplitude</div>
                                    <input value={amp} onChange={e => setAmp(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                </div>
                                <div className="site-outline-card p-4 space-y-1">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Noise Floor</div>
                                    <input value={noise} onChange={e => setNoise(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("controls") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {SIGNAL_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-accent/40 bg-accent/10"
                                                : "border-border/60 bg-muted/5 hover:border-accent/40 hover:bg-accent/5"
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

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Signal Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.signal.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                     <div>
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                         <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.wave} pattern</div>
                                     </div>
                                 </button>
                             ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Signal Diagnostics"
                        title="Spectral health & stability"
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
                        <div className="site-eyebrow text-accent">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-accent text-white rounded-xl py-2 text-sm font-bold hover:bg-accent/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-accent">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent/40" />
                             <button onClick={saveExperiment} className="bg-accent text-white px-4 rounded-xl hover:bg-accent/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.waveType} - {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {analysis && (
                        <>
                            {notebook.hasBlock("time") && (
                                <div className="site-panel p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-accent">Oscilloscope (Time Domain)</div>
                                        <Oscilloscope className="h-4 w-4 text-accent/50" />
                                    </div>
                                    <CartesianPlot series={[{ label: "Waveform", color: "var(--accent)", points: analysis.timeDomain }]} />
                                </div>
                            )}

                            {notebook.hasBlock("freq") && (
                                <div className="site-panel p-6 space-y-4">
                                     <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-accent">Spectrum Analyzer (FFT)</div>
                                        <Target className="h-4 w-4 text-accent/50" />
                                    </div>
                                    <CartesianPlot series={[{ label: "Magnitude", color: "#f59e0b", points: analysis.frequencyDomain }]} />
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/5 border border-border/60">
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase text-muted-foreground">Dominant Peak</div>
                                            <div className="font-serif text-2xl font-black">{analysis.peakFrequency} Hz</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${Math.abs(analysis.peakFrequency - Number(freq)) < 5 ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                                            {Math.abs(analysis.peakFrequency - Number(freq)) < 5 ? 'Validated' : 'Mixed Spectrum'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(analysis)}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={signalBridgeGuides}
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
