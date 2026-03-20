"use client";

import React from "react";
import { Activity, Radio, Sparkles, Target, Zap, Waves, Activity as Oscilloscope, AudioLines } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { calculateFFT, generateWaveform, findPeakFrequency, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type SignalBlockId = "controls" | "time" | "freq" | "bridge";

const signalNotebookBlocks = [
    { id: "controls" as const, label: "Controls", description: "Waveform, Freq va Gain setup" },
    { id: "time" as const, label: "Oscilloscope", description: "Time-domain waveform preview" },
    { id: "freq" as const, label: "FFT Spectrum", description: "Frequency-domain spectral analysis" },
    { id: "bridge" as const, label: "Bridge", description: "Export results" },
];

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

    const analysis = React.useMemo(() => {
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

    const applyPreset = (p: any) => {
        setWaveType(p.wave);
        setFreq(String(p.f));
        setAmp(String(p.a || 1));
        setNoise(String(p.noise || 0));
    };

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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                </div>

                <div className="space-y-6">
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

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={true}
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
