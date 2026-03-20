"use client";

import React, { useTransition } from "react";
import { Activity, Atom, Orbit, Sparkles, Sigma, Waves, Zap, Info, Loader2 } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import {
    LABORATORY_PRESETS,
    QUANTUM_GATES,
    analyzeQuantumState,
    buildBlochSphereGeometry,
    getSchrodingerStates,
    type QuantumWavePoint,
} from "@/components/laboratory/math-utils";
import { buildParametricSurfaceData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLabEngine } from "@/components/laboratory/lab-engine";

type QuantumBlockId = "setup" | "bloch" | "wave" | "bridge";
type QuantumPreset = (typeof LABORATORY_PRESETS.quantum)[number];

const quantumNotebookBlocks = [
    { id: "setup" as const, label: "Subatomic State", description: "Qubit parametrlar va holat tanlovi" },
    { id: "bloch" as const, label: "Bloch Sphere", description: "3D qubit trayektoriyasi" },
    { id: "wave" as const, label: "Wave Density", description: "To'lqin funksiyasi va ehtimollik zichligi" },
    { id: "bridge" as const, label: "Cognitive Bridge", description: "Natijani writer oqimiga yuborish" },
];

const quantumPresetDescriptions: Record<string, string> = {
    "Basis |0>": "Shimoliy qutbdagi klassik bazis holat. O'lchovda |0> deyarli aniq olinadi.",
    "Superposition |+>": "Bazis holatlar teng superpozitsiyada. Bloch sferada ekvator bo'ylab joylashadi.",
    "Pure State |1>": "Janubiy qutbga tushadigan sof qubit holati.",
    "Phase Shift |i>": "Faza burilishi kiritilgan kvant holati. Bloch sferada y o'qiga yaqinlashadi.",
    "Phase Shift |-i>": "Manfiy fazali ekvatorial holat. Interferensiya belgisi o'zgarishini ko'rsatadi.",
    "Magic State |T>": "Fault-tolerant quantum computing uchun kerak bo'ladigan T-faza holati.",
    "Balanced Qubit": "Theta va phi birga o'zgargan, muvozanatli fazoviy holat.",
    "Schrodinger n = 1": "Eng past energiya holati: tugun yo'q, zichlik eng silliq (Ground state).",
    "Schrodinger n = 2": "Bitta tugunli ikkinchi energiya holati. Birinchi hayajonlangan holat.",
    "Schrodinger n = 3": "Cheklangan potensial chuqurdagi uchinchi energiya holati.",
    "Schrodinger n = 5": "Yuqoriroq energiya darajasidagi kuchliroq tebranishli holat.",
    "Localized Packet": "Tor wave packet ko'proq lokalizatsiya beradi, lekin impuls tarqalishi kuchayadi.",
    "Uncertainty Principle Map": "To'lqin paketi ko'rinishida koordinata va impuls lokalizatsiyasi orasidagi trade-offni ko'rsatadi.",
};

function getConfigNumber(config: LaboratoryModuleMeta["config"], key: string, fallback: number) {
    const value = config?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
    return !Number.isFinite(value) ? min : Math.min(max, Math.max(min, value));
}

function normalizePhi(value: number) {
    const fullTurn = Math.PI * 2;
    return ((value % fullTurn) + fullTurn) % fullTurn;
}

function formatNumber(value: number, digits = 3) {
    return Number.isFinite(value) ? value.toFixed(digits) : "0.000";
}

function isAnglePreset(preset: QuantumPreset): preset is QuantumPreset & { theta: number; phi: number } {
    return typeof (preset as any).theta === "number";
}

function isWavePacketPreset(preset: QuantumPreset): preset is QuantumPreset & { type: "wave-packet"; spread?: number; momentum?: number } {
    return (preset as any).type === "wave-packet";
}

export function QuantumLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"qubit" | "wave">("qubit");
    const [waveMode, setWaveMode] = React.useState<"state" | "packet">("state");
    const [theta, setTheta] = React.useState(() => clamp(getConfigNumber(module.config, "defaultTheta", Math.PI / 2), 0, Math.PI));
    const [phi, setPhi] = React.useState(() => normalizePhi(getConfigNumber(module.config, "defaultPhi", 0)));
    const [n, setN] = React.useState(3);
    const [packetSpread, setPacketSpread] = React.useState(1.2);
    const [packetMomentum, setPacketMomentum] = React.useState(3.4);
    const [isPending, startTransition] = useTransition();

    const { setCalculating } = useLabEngine();

    const notebook = useLaboratoryNotebook<QuantumBlockId>({
        storageKey: "mathsphere-lab-quantum-notebook",
        definitions: quantumNotebookBlocks,
        defaultBlocks: ["setup", "bloch", "wave"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const qubitAnalysis = React.useMemo(() => analyzeQuantumState(theta, phi), [phi, theta]);
    const blochGeometry = React.useMemo(() => buildBlochSphereGeometry(), []);
    const schrodingerData = React.useMemo(() => getSchrodingerStates(Math.max(1, n)), [n]);
    
    const wavePacketData = React.useMemo(() => {
        const sigma = clamp(packetSpread, 0.35, 2.4);
        const k = clamp(packetMomentum, 1, 7.5);

        return Array.from({ length: 180 }, (_, index) => {
            const x = -5 + index * (10 / 179);
            const gaussian = Math.exp(-(x * x) / (2 * sigma * sigma));
            const psi = gaussian * Math.cos(k * x);
            return {
                x: Number(x.toFixed(4)),
                y: Number(psi.toFixed(6)),
                prob: Number((psi * psi).toFixed(6)),
            };
        });
    }, [packetMomentum, packetSpread]);

    const currentWaveData = waveMode === "packet" ? wavePacketData : schrodingerData;

    const waveInsights = React.useMemo(() => {
        const step = currentWaveData[1] ? currentWaveData[1].x - currentWaveData[0].x : 0;
        const normEstimate = currentWaveData.reduce((sum, point) => sum + point.prob * step, 0);
        const peakDensity = Math.max(...currentWaveData.map((point) => point.prob));
        const peakAmplitude = Math.max(...currentWaveData.map((point) => Math.abs(point.y)));
        const nodes = waveMode === "state" ? Math.max(0, n - 1) : 0; // Simplified nodes for packet

        return { normEstimate, peakDensity, peakAmplitude, nodes };
    }, [currentWaveData, n, waveMode]);

    const activePresetDescription = React.useMemo(() => {
        const currentPreset = mode === "qubit"
            ? LABORATORY_PRESETS.quantum.find(p => isAnglePreset(p) && Math.abs(p.theta - theta) < 0.05 && Math.abs((p.phi ?? 0) - phi) < 0.05)
            : waveMode === "packet"
                ? LABORATORY_PRESETS.quantum.find(p => isWavePacketPreset(p) && Math.abs((p.spread ?? 1.2) - packetSpread) < 0.05)
                : LABORATORY_PRESETS.quantum.find(p => !isAnglePreset(p) && !isWavePacketPreset(p) && p.n === n);

        return quantumPresetDescriptions[currentPreset?.label || ""] || "";
    }, [mode, n, packetSpread, phi, theta, waveMode]);

    const applyPreset = (preset: QuantumPreset) => {
        startTransition(() => {
            if (isAnglePreset(preset)) {
                setMode("qubit");
                setTheta(clamp(preset.theta, 0, Math.PI));
                setPhi(normalizePhi(preset.phi || 0));
                return;
            }
            setMode("wave");
            if (isWavePacketPreset(preset)) {
                setWaveMode("packet");
                setPacketSpread(clamp(preset.spread ?? 1.2, 0.35, 2.4));
                setPacketMomentum(clamp(preset.momentum ?? 3.4, 1, 7.5));
                return;
            }
            setWaveMode("state");
            setN(Math.max(1, preset.n || 3));
        });
    };

    const buildBlochTraces = (point: { x: number; y: number; z: number }) => {
        return [
            ...buildParametricSurfaceData(blochGeometry.surface, {
                label: "Bloch sphere",
                colorscale: "Blues",
                opacity: 0.2,
            }),
            {
                type: "scatter3d",
                mode: "lines",
                x: blochGeometry.equator.map((sample) => sample.x),
                y: blochGeometry.equator.map((sample) => sample.y),
                z: blochGeometry.equator.map((sample) => sample.z),
                line: { color: "rgba(37,99,235,0.42)", width: 5 },
                name: "Equator",
            },
            ...blochGeometry.meridians.map((meridian, index) => ({
                type: "scatter3d",
                mode: "lines",
                x: meridian.map((sample) => sample.x),
                y: meridian.map((sample) => sample.y),
                z: meridian.map((sample) => sample.z),
                line: { color: "rgba(14,116,144,0.25)", width: index === 2 ? 4 : 3 },
                name: `Meridian ${index + 1}`,
                showlegend: false,
            })),
            ...blochGeometry.axes.map((axis) => ({
                type: "scatter3d",
                mode: "lines",
                x: axis.points.map((sample) => sample.x),
                y: axis.points.map((sample) => sample.y),
                z: axis.points.map((sample) => sample.z),
                line: { color: axis.color, width: 6 },
                name: axis.label,
            })),
            {
                type: "scatter3d",
                mode: "markers",
                x: blochGeometry.poles.map((sample) => sample.x),
                y: blochGeometry.poles.map((sample) => sample.y),
                z: blochGeometry.poles.map((sample) => sample.z),
                marker: { size: 5, color: ["#10b981", "#ef4444"] },
                name: "Basis poles",
            },
            {
                type: "scatter3d",
                mode: "lines+markers",
                x: [0, point.x],
                y: [0, point.y],
                z: [0, point.z],
                line: { color: "#0f766e", width: 9 },
                marker: { size: [0, 7], color: ["#0f766e", "#f59e0b"] },
                name: "State Vector",
            },
        ];
    };

    return (
        <div className="space-y-6">
            <LaboratoryNotebookToolbar
                title="Quantum Singular Engine"
                description="Exploring Hilbert space dimensionality, Bloch sphere trajectories and Schrodinger probability distributions."
                activeBlocks={notebook.activeBlocks}
                definitions={quantumNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-8 min-w-0">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel relative overflow-hidden p-8 shadow-[0_45px_100px_-50px_rgba(15,23,42,0.4)]">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.14),transparent_50%),radial-gradient(circle_at_top_right,rgba(29,78,216,0.1),transparent_50%)]" />
                            
                            <div className="relative space-y-8">
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                            <div className="site-eyebrow text-cyan-600">Hilbert Space Controller</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(["qubit", "wave"] as const).map((value) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setMode(value)}
                                                    className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.24em] transition-all duration-500 ${
                                                        mode === value
                                                            ? "bg-foreground text-background shadow-xl scale-105"
                                                            : "bg-muted/5 text-muted-foreground border border-border/40 hover:bg-muted/10"
                                                    }`}
                                                >
                                                    {value === "qubit" ? "Qubit (Bloch)" : "Wave Logic"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-600">
                                        <Atom className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.28em]">{isPending ? "Calculating Probability" : "Coherence Sync"}</span>
                                    </div>
                                </div>

                                {activePresetDescription && (
                                    <div className="rounded-[2rem] border border-cyan-500/10 bg-cyan-500/5 px-6 py-5 text-sm italic leading-relaxed text-muted-foreground/80 font-serif">
                                        "{activePresetDescription}"
                                    </div>
                                )}

                                {mode === "qubit" ? (
                                    <div className="space-y-6">
                                        <div className="grid gap-6 lg:grid-cols-2">
                                            <MetricCard label="Polar (theta)" value={`${formatNumber(theta, 2)} rad`} tone="cyan" />
                                            <MetricCard label="Phase (phi)" value={`${formatNumber(phi, 2)} rad`} tone="amber" />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <SmallMetric label="|0> PROB" value={formatNumber(qubitAnalysis.zeroProbability)} />
                                            <SmallMetric label="|1> PROB" value={formatNumber(qubitAnalysis.oneProbability)} />
                                            <SmallMetric label="COHERENCE" value={formatNumber(qubitAnalysis.coherence)} />
                                            <SmallMetric label="LATITUDE" value={`${formatNumber(qubitAnalysis.latitude, 1)}°`} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex gap-4 p-2 bg-muted/5 rounded-2xl border border-border/40">
                                            {(["state", "packet"] as const).map((value) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setWaveMode(value)}
                                                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        waveMode === value ? "bg-white shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    {value}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <SmallMetric label="ENERGY LEVEL" value={waveMode === "state" ? `n=${n}` : "PACKET"} />
                                            <SmallMetric label="NODES" value={String(waveInsights.nodes)} />
                                            <SmallMetric label="PEAK |PSI|" value={formatNumber(waveInsights.peakAmplitude)} />
                                            <SmallMetric label="NORM EST." value={formatNumber(waveInsights.normEstimate)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {mode === "qubit" && notebook.hasBlock("bloch") && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                             <div className="flex items-center gap-4 px-2 text-accent">
                                <Orbit className="h-5 w-5" />
                                <div className="site-eyebrow tracking-[0.3em]">GEOMETRIC BLOCH REPRESENTATION</div>
                             </div>
                             <p className="px-2 text-sm leading-6 text-muted-foreground">
                                Sfera qobig&apos;i, ekvator, meridianlar va state vector birga chiziladi. Bu qubitning amplituda va faza holatini geometriya bilan tushuntiradi.
                             </p>
                             <ScientificPlot
                                type="scatter3d"
                                data={buildBlochTraces(qubitAnalysis.cartesian)}
                                height={550}
                                title={`Quantum State Vector Mapping | Ψ = ${qubitAnalysis.ket}`}
                                insights={["bloch sphere", "state vector", "phase geometry"]}
                                snapshotFileName="quantum-bloch-sphere"
                             />
                        </div>
                    )}

                    {mode === "wave" && notebook.hasBlock("wave") && (
                        <div className="site-panel p-8 space-y-8 shadow-[0_45px_100px_-50px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-4 text-cyan-600">
                                <Waves className="h-5 w-5" />
                                <div className="site-eyebrow tracking-[0.3em]">PROBABILITY DENSITY FUNCTION</div>
                            </div>
                            <CartesianPlot
                                height={400}
                                series={[
                                    { label: "Amplitude Ψ(x)", color: "var(--accent)", points: currentWaveData.map(p => ({ x: p.x, y: p.y })) },
                                    { label: "Density |Ψ|²", color: "#10b981", points: currentWaveData.map(p => ({ x: p.x, y: p.prob })) },
                                ]}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel-strong p-8 ring-1 ring-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="h-5 w-5 text-accent" />
                            <div className="site-eyebrow text-accent">Quantum Presets</div>
                        </div>
                        <div className="grid gap-3">
                            {LABORATORY_PRESETS.quantum.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyPreset(preset)}
                                    className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 transition-all duration-500 hover:border-cyan-500/40 hover:bg-cyan-500/10 overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="text-sm font-black italic tracking-tight text-foreground group-hover:text-cyan-600 font-serif transition-colors duration-500">{preset.label}</div>
                                        <div className="mt-1 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">
                                            {isAnglePreset(preset) ? "Qubit State" : "Wave Logic"}
                                        </div>
                                    </div>
                                    <Zap className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel-strong p-8 ring-1 ring-white/10">
                        <div className="flex items-center gap-3 mb-6 font-serif">
                            <Info className="h-5 w-5 text-accent" />
                            <div className="site-eyebrow text-accent">Theory & Logic</div>
                        </div>
                        <div className="space-y-6">
                            <TheoryItem title="Bloch Coherence" text="Qubit qutblari (0 va 1) o'lchov bazalaridir. Ekvator maksimal superpozitsiya, Phi esa interferentsiya fazasini belgilaydi." />
                            <TheoryItem title="Wave Duality" text="To'lqin funksiyasi amplitudasi (Ψ) va ehtimollik zichligi (|Ψ|²) kvant tizimining fazoviy taqsimotini to'liq tavsiflaydi." />
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

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div className="site-outline-card p-6 bg-background/40 backdrop-blur-md transition-all hover:bg-white/5">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60 mb-2">{label}</div>
            <div className={`text-2xl font-black italic tracking-tighter text-foreground`}>{value}</div>
        </div>
    );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">{label}</div>
            <div className="text-sm font-black italic text-foreground/80">{value}</div>
        </div>
    );
}

function TheoryItem({ title, text }: { title: string; text: string }) {
    return (
        <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">{title}</div>
            <p className="text-xs leading-relaxed text-muted-foreground italic font-serif opacity-80">{text}</p>
        </div>
    );
}
