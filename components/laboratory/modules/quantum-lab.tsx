"use client";

import React from "react";
import { Activity, Atom, Orbit, Sparkles, Sigma, Waves } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import {
    LABORATORY_PRESETS,
    QUANTUM_GATES,
    analyzeQuantumState,
    getSchrodingerStates,
    type QuantumWavePoint,
} from "@/components/laboratory/math-utils";
import { ScientificPlot } from "@/components/laboratory/scientific-plot";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type QuantumBlockId = "setup" | "bloch" | "wave" | "bridge";

type QuantumPreset = (typeof LABORATORY_PRESETS.quantum)[number];

const quantumNotebookBlocks = [
    { id: "setup" as const, label: "Quantum State", description: "Qubit parametrlar va holat tanlovi" },
    { id: "bloch" as const, label: "Bloch Sphere", description: "3D qubit trayektoriyasi" },
    { id: "wave" as const, label: "Wavefunction", description: "To'lqin funksiyasi va ehtimollik zichligi" },
    { id: "bridge" as const, label: "Bridge", description: "Natijani writer oqimiga yuborish" },
];

const quantumPresetDescriptions: Record<string, string> = {
    "Basis |0>": "Shimoliy qutbdagi klassik bazis holat. O'lchovda |0> deyarli aniq olinadi.",
    "Superposition |+>": "Bazis holatlar teng superpozitsiyada. Bloch sferada ekvator bo'ylab joylashadi.",
    "Pure State |1>": "Janubiy qutbga tushadigan sof qubit holati.",
    "Phase Shift |i>": "Faza burilishi kiritilgan kvant holati. Bloch sferada y o'qiga yaqinlashadi.",
    "Phase Shift |-i>": "Manfiy fazali ekvatorial holat. Interferensiya belgisi o'zgarishini ko'rsatadi.",
    "Magic State |T>": "Fault-tolerant quantum computing uchun kerak bo'ladigan T-faza holati.",
    "Balanced Qubit": "Theta va phi birga o'zgargan, muvozanatli fazoviy holat.",
    "Schrodinger n = 1": "Eng past energiya holati: tugun yo'q, zichlik eng silliq.",
    "Schrodinger n = 2": "Bitta tugunli ikkinchi energiya holati.",
    "Schrodinger n = 3": "Cheklangan potensial chuqurdagi uchinchi energiya holati.",
    "Schrodinger n = 5": "Yuqoriroq energiya darajasidagi kuchliroq tebranishli holat.",
    "Localized Packet": "Tor wave packet ko'proq lokalizatsiya beradi, lekin impuls tarqalishi kuchayadi.",
    "Uncertainty Principle Map": "To'lqin paketi ko'rinishida koordinata va impuls lokalizatsiyasi orasidagi trade-offni ko'rsatadi.",
};

const quantumBridgeGuides = {
    copy: {
        badge: "Markdown Export",
        title: "Quantum natijani nusxa olish",
        description: "Joriy kvant holatining qisqa izohi va asosiy ko'rsatkichlarini clipboard ga tayyorlaydi.",
        confirmLabel: "Markdown nusxa olish",
        steps: ["Qiziq preset yoki parametrlarni tanlang.", "Natija tayyor bo'lsa nusxa olishni bosing.", "Writer yoki notebook ichiga joylang."],
        note: "Hozircha quantum modulda live payload builder ulanmagan, lekin export kartasi keyingi bridge integratsiyasi uchun saqlab turildi.",
    },
    send: {
        badge: "Writer Flow",
        title: "Writer oqimiga yuborish",
        description: "Keyingi iteratsiyada quantum summary ni draft boshiga yuborish uchun shu yo'l ishlatiladi.",
        confirmLabel: "Writer'ga yuborish",
        steps: ["Holatni sozlang.", "Writer oqimini tanlang.", "Yuborish tugmasini bosing."],
        note: "Agar live push keyinroq qo'shilsa, aynan shu karta qayta ishlatiladi va arxitektura o'zgarmaydi.",
    },
} as const;

function getConfigNumber(config: LaboratoryModuleMeta["config"], key: string, fallback: number) {
    const value = config?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.min(max, Math.max(min, value));
}

function normalizePhi(value: number) {
    const fullTurn = Math.PI * 2;
    return ((value % fullTurn) + fullTurn) % fullTurn;
}

function formatNumber(value: number, digits = 3) {
    return Number.isFinite(value) ? value.toFixed(digits) : "0.000";
}

function isAnglePreset(preset: QuantumPreset): preset is QuantumPreset & { theta: number; phi: number } {
    return typeof (preset as { theta?: unknown }).theta === "number";
}

function isWavePacketPreset(
    preset: QuantumPreset,
): preset is QuantumPreset & { type: "wave-packet"; spread?: number; momentum?: number } {
    return (preset as { type?: unknown }).type === "wave-packet";
}

function buildWavePacketData(spread: number, momentum: number): QuantumWavePoint[] {
    const sigma = clamp(spread, 0.35, 2.4);
    const k = clamp(momentum, 1, 7.5);

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
}

function buildBlochTraces(point: { x: number; y: number; z: number }) {
    const circle = Array.from({ length: 73 }, (_, index) => (index / 72) * Math.PI * 2);
    const latitude = Array.from({ length: 37 }, (_, index) => -Math.PI / 2 + (index / 36) * Math.PI);
    const axisStyle = { color: "rgba(148,163,184,0.28)", width: 4 };

    return [
        {
            type: "scatter3d",
            mode: "lines",
            x: [-1.2, 1.2],
            y: [0, 0],
            z: [0, 0],
            line: axisStyle,
            hoverinfo: "skip",
            showlegend: false,
        },
        {
            type: "scatter3d",
            mode: "lines",
            x: [0, 0],
            y: [-1.2, 1.2],
            z: [0, 0],
            line: axisStyle,
            hoverinfo: "skip",
            showlegend: false,
        },
        {
            type: "scatter3d",
            mode: "lines",
            x: [0, 0],
            y: [0, 0],
            z: [-1.2, 1.2],
            line: axisStyle,
            hoverinfo: "skip",
            showlegend: false,
        },
        {
            type: "scatter3d",
            mode: "lines",
            x: circle.map((angle) => Math.cos(angle)),
            y: circle.map((angle) => Math.sin(angle)),
            z: circle.map(() => 0),
            line: { color: "rgba(29,78,216,0.42)", width: 5 },
            name: "Equator",
        },
        {
            type: "scatter3d",
            mode: "lines",
            x: latitude.map((angle) => Math.cos(angle)),
            y: latitude.map(() => 0),
            z: latitude.map((angle) => Math.sin(angle)),
            line: { color: "rgba(16,185,129,0.28)", width: 3 },
            name: "Prime meridian",
        },
        {
            type: "scatter3d",
            mode: "lines",
            x: [point.x, point.x],
            y: [point.y, point.y],
            z: [0, point.z],
            line: { color: "rgba(245,158,11,0.45)", width: 3, dash: "dot" },
            name: "Projection",
        },
        {
            type: "scatter3d",
            mode: "lines+markers",
            x: [0, point.x],
            y: [0, point.y],
            z: [0, point.z],
            line: { color: "#0f766e", width: 10 },
            marker: { size: [0, 7], color: ["#0f766e", "#f59e0b"] },
            name: "State vector",
        },
        {
            type: "scatter3d",
            mode: "markers+text",
            x: [point.x],
            y: [point.y],
            z: [point.z],
            text: ["|psi>"],
            textposition: "top center",
            marker: {
                size: 10,
                color: "#f8fafc",
                line: {
                    color: "#f59e0b",
                    width: 4,
                },
            },
            name: "Measurement point",
        },
    ];
}

export function QuantumLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"qubit" | "wave">("qubit");
    const [waveMode, setWaveMode] = React.useState<"state" | "packet">("state");
    const [theta, setTheta] = React.useState(() => clamp(getConfigNumber(module.config, "defaultTheta", Math.PI / 2), 0, Math.PI));
    const [phi, setPhi] = React.useState(() => normalizePhi(getConfigNumber(module.config, "defaultPhi", 0)));
    const [n, setN] = React.useState(3);
    const [packetSpread, setPacketSpread] = React.useState(1.2);
    const [packetMomentum, setPacketMomentum] = React.useState(3.4);

    const notebook = useLaboratoryNotebook<QuantumBlockId>({
        storageKey: "mathsphere-lab-quantum-notebook",
        definitions: quantumNotebookBlocks,
        defaultBlocks: ["setup", "bloch", "wave"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const qubitAnalysis = React.useMemo(() => analyzeQuantumState(theta, phi), [phi, theta]);
    const schrodingerData = React.useMemo(() => getSchrodingerStates(Math.max(1, n)), [n]);
    const wavePacketData = React.useMemo(() => buildWavePacketData(packetSpread, packetMomentum), [packetMomentum, packetSpread]);
    const currentWaveData = waveMode === "packet" ? wavePacketData : schrodingerData;

    const waveInsights = React.useMemo(() => {
        const step = currentWaveData[1] ? currentWaveData[1].x - currentWaveData[0].x : 0;
        const normEstimate = currentWaveData.reduce((sum, point) => sum + point.prob * step, 0);
        const peakDensity = Math.max(...currentWaveData.map((point) => point.prob));
        const peakAmplitude = Math.max(...currentWaveData.map((point) => Math.abs(point.y)));
        const nodes =
            waveMode === "state"
                ? Math.max(0, n - 1)
                : currentWaveData.reduce((count, point, index, collection) => {
                      if (index === 0) return count;
                      const previous = collection[index - 1];
                      return previous.y === 0 || previous.y * point.y > 0 ? count : count + 1;
                  }, 0);

        return {
            normEstimate,
            peakDensity,
            peakAmplitude,
            nodes,
        };
    }, [currentWaveData, n, waveMode]);

    const activePresetDescription = React.useMemo(() => {
        const currentPreset =
            mode === "qubit"
                ? LABORATORY_PRESETS.quantum.find(
                      (preset) =>
                          isAnglePreset(preset) &&
                          Math.abs(preset.theta - theta) < 0.02 &&
                          Math.abs((preset.phi ?? 0) - phi) < 0.02,
                  )
                : waveMode === "packet"
                  ? LABORATORY_PRESETS.quantum.find(
                        (preset) =>
                            isWavePacketPreset(preset) &&
                            Math.abs((preset.spread ?? 1.2) - packetSpread) < 0.02 &&
                            Math.abs((preset.momentum ?? 3.4) - packetMomentum) < 0.02,
                    )
                  : LABORATORY_PRESETS.quantum.find((preset) => !isAnglePreset(preset) && !isWavePacketPreset(preset) && preset.n === n);

        return quantumPresetDescriptions[currentPreset?.label || ""] || "";
    }, [mode, n, packetMomentum, packetSpread, phi, theta, waveMode]);

    const applyGate = (gate: keyof typeof QUANTUM_GATES) => {
        const config = QUANTUM_GATES[gate];
        setMode("qubit");
        setTheta(clamp(config.theta, 0, Math.PI));
        setPhi(normalizePhi(config.phi));
    };

    const applyPreset = (preset: QuantumPreset) => {
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
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title={module.title || "Quantum Computing Lab"}
                description="Qubitlar, superpozitsiya, Bloch sferasi va Schrödinger to'lqin funksiyalarini chuqurroq o'rganish ish joyi."
                activeBlocks={notebook.activeBlocks}
                definitions={quantumNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel relative overflow-hidden p-6">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_48%),radial-gradient(circle_at_top_right,rgba(29,78,216,0.14),transparent_42%)]" />
                            <div className="relative space-y-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="site-eyebrow text-accent">Subatomic controller</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(["qubit", "wave"] as const).map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setMode(value)}
                                                    className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                                                        mode === value
                                                            ? "bg-foreground text-background shadow-lg shadow-slate-900/10"
                                                            : "border border-border/60 bg-background/70 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                                                    }`}
                                                >
                                                    {value === "qubit" ? "Qubit (Bloch)" : "Quantum Wave"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">
                                        <Atom className="mr-2 h-3.5 w-3.5" />
                                        Coherence: active
                                    </div>
                                </div>

                                {activePresetDescription ? (
                                    <div className="rounded-[1.5rem] border border-accent/15 bg-background/70 px-4 py-4 text-sm leading-7 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                                        {activePresetDescription}
                                    </div>
                                ) : null}

                                {mode === "qubit" ? (
                                    <div className="space-y-5">
                                        <div className="grid gap-4 lg:grid-cols-2">
                                            <RangeCard
                                                label="Polar angle (theta)"
                                                value={theta}
                                                min={0}
                                                max={Math.PI}
                                                step={0.01}
                                                onChange={(value) => setTheta(clamp(value, 0, Math.PI))}
                                            />
                                            <RangeCard
                                                label="Azimuthal phase (phi)"
                                                value={phi}
                                                min={0}
                                                max={Math.PI * 2}
                                                step={0.01}
                                                onChange={(value) => setPhi(normalizePhi(value))}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(QUANTUM_GATES).map((gate) => (
                                                <button
                                                    key={gate}
                                                    type="button"
                                                    onClick={() => applyGate(gate as keyof typeof QUANTUM_GATES)}
                                                    className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 text-xs font-black text-accent transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-white"
                                                >
                                                    {gate} Gate
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-4">
                                            <MetricCard label="|0> probability" value={formatNumber(qubitAnalysis.zeroProbability)} tone="cyan" />
                                            <MetricCard label="|1> probability" value={formatNumber(qubitAnalysis.oneProbability)} tone="amber" />
                                            <MetricCard label="Coherence" value={formatNumber(qubitAnalysis.coherence)} tone="emerald" />
                                            <MetricCard label="Latitude" value={`${formatNumber(qubitAnalysis.latitude, 1)} deg`} tone="violet" />
                                        </div>

                                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                                            <InsightCard
                                                title="Quantum state"
                                                icon={<Orbit className="h-4 w-4 text-accent" />}
                                                description={qubitAnalysis.ket}
                                                footer={`${qubitAnalysis.label} · ${qubitAnalysis.phaseClass}`}
                                            />
                                            <InsightCard
                                                title="Expectation vector"
                                                icon={<Activity className="h-4 w-4 text-accent" />}
                                                description={`<X> = ${formatNumber(qubitAnalysis.cartesian.x)}, <Y> = ${formatNumber(qubitAnalysis.cartesian.y)}, <Z> = ${formatNumber(qubitAnalysis.cartesian.z)}`}
                                                footer={`Longitude ${formatNumber(qubitAnalysis.longitude, 1)} deg`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap gap-2">
                                            {(["state", "packet"] as const).map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setWaveMode(value)}
                                                    className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                                                        waveMode === value
                                                            ? "bg-foreground text-background shadow-lg shadow-slate-900/10"
                                                            : "border border-border/60 bg-background/70 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                                                    }`}
                                                >
                                                    {value === "state" ? "Stationary state" : "Wave packet"}
                                                </button>
                                            ))}
                                        </div>

                                        {waveMode === "state" ? (
                                            <div className="space-y-3">
                                                <div className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Energy level n</div>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {[1, 2, 3, 4, 5, 6].map((level) => (
                                                        <button
                                                            key={level}
                                                            type="button"
                                                            onClick={() => setN(level)}
                                                            className={`h-12 rounded-xl border-2 font-black transition-all ${
                                                                n === level
                                                                    ? "border-accent bg-accent/10 text-accent shadow-lg shadow-accent/10"
                                                                    : "border-border/60 bg-background/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                                                            }`}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 lg:grid-cols-2">
                                                <RangeCard
                                                    label="Packet spread (sigma)"
                                                    value={packetSpread}
                                                    min={0.35}
                                                    max={2.4}
                                                    step={0.01}
                                                    onChange={(value) => setPacketSpread(clamp(value, 0.35, 2.4))}
                                                />
                                                <RangeCard
                                                    label="Carrier momentum (k)"
                                                    value={packetMomentum}
                                                    min={1}
                                                    max={7.5}
                                                    step={0.01}
                                                    onChange={(value) => setPacketMomentum(clamp(value, 1, 7.5))}
                                                />
                                            </div>
                                        )}

                                        <div className="grid gap-4 md:grid-cols-4">
                                            <MetricCard label="Mode" value={waveMode === "state" ? `n=${n}` : "packet"} tone="cyan" />
                                            <MetricCard label="Nodes" value={String(waveInsights.nodes)} tone="amber" />
                                            <MetricCard label="Peak |psi|" value={formatNumber(waveInsights.peakAmplitude)} tone="emerald" />
                                            <MetricCard label="Norm est." value={formatNumber(waveInsights.normEstimate)} tone="violet" />
                                        </div>

                                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                                            <InsightCard
                                                title="Wave interpretation"
                                                icon={<Waves className="h-4 w-4 text-accent" />}
                                                description={
                                                    waveMode === "state"
                                                        ? `Stationary holatda tugunlar soni taxminan n-1 ga teng. n ortgani sari tebranishlar zichlashadi.`
                                                        : `Packet toraygani sari makon bo'yicha lokalizatsiya oshadi, ammo impuls spektri kengayadi.`
                                                }
                                                footer={waveMode === "state" ? "Infinite well intuition" : "Uncertainty trade-off"}
                                            />
                                            <InsightCard
                                                title="Density monitor"
                                                icon={<Sigma className="h-4 w-4 text-accent" />}
                                                description={`Peak density = ${formatNumber(waveInsights.peakDensity)}, integral estimate = ${formatNumber(waveInsights.normEstimate)}`}
                                                footer="Probability mass should stay near 1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {mode === "qubit" && notebook.hasBlock("bloch") && (
                        <div className="site-panel-strong p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <Orbit className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">Bloch sphere representation</div>
                            </div>
                            <div className="h-[500px]">
                                <ScientificPlot
                                    type="scatter3d"
                                    title={`Qubit state | theta=${formatNumber(theta, 2)} rad, phi=${formatNumber(phi, 2)} rad`}
                                    data={buildBlochTraces(qubitAnalysis.cartesian)}
                                    layoutOverrides={{
                                        scene: {
                                            xaxis: { title: { text: "X coherence" } },
                                            yaxis: { title: { text: "Y phase" } },
                                            zaxis: { title: { text: "Z basis bias" } },
                                            camera: { eye: { x: 1.55, y: 1.38, z: 1.28 } },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {mode === "wave" && notebook.hasBlock("wave") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Waves className="h-4 w-4 text-accent" />
                                <div className="site-eyebrow text-accent">{waveMode === "state" ? `Schrodinger n = ${n}` : "Wave packet density"}</div>
                            </div>
                            <div className="h-[360px]">
                                <CartesianPlot
                                    title={waveMode === "state" ? "Stationary eigenstate and density" : "Localized packet and probability density"}
                                    series={[
                                        { label: "psi(x)", color: "var(--accent)", points: currentWaveData.map((point) => ({ x: point.x, y: point.y })) },
                                        { label: "|psi|^2", color: "#10b981", points: currentWaveData.map((point) => ({ x: point.x, y: point.prob })) },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Quantum presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.quantum.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    className="group flex items-center justify-between rounded-[1.1rem] border border-border/60 bg-background/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-serif text-sm font-black tracking-tight text-foreground group-hover:text-accent">{preset.label}</div>
                                        <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                                            {isAnglePreset(preset) ? "Quantum state configuration" : isWavePacketPreset(preset) ? "Wave packet configuration" : "Wavefunction configuration"}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sigma className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Interpretation</div>
                        </div>
                        <div className="grid gap-3">
                            <TheoryCard
                                title="Bloch logic"
                                body="Qutblar bazis holatlar, ekvator esa maksimal superpozitsiya hududi. Phi o'zgarsa ehtimollik emas, interferensiya fazasi siljiydi."
                            />
                            <TheoryCard
                                title="Wave intuition"
                                body="Yashil zichlik chizig'i o'lchov ehtimolini beradi. Stationary holatda tugunlar soni energiya bilan ortadi, packet rejimida esa lokalizatsiya va impuls aniqligi o'zaro raqobat qiladi."
                            />
                            <TheoryCard
                                title="Current readout"
                                body={mode === "qubit" ? `${qubitAnalysis.label}. ${qubitAnalysis.phaseClass}.` : `Peak density ${formatNumber(waveInsights.peakDensity)} va norm estimate ${formatNumber(waveInsights.normEstimate)}.`}
                            />
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={true}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={quantumBridgeGuides}
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

function RangeCard({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="site-outline-card space-y-3 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full accent-accent"
            />
            <div className="flex items-center justify-between gap-3">
                <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-black text-accent">{formatNumber(value, 2)} rad</div>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value.toFixed(2)}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="h-10 w-24 rounded-xl border border-border/70 bg-background/80 px-3 text-right text-sm font-mono font-bold outline-none transition focus:border-accent"
                />
            </div>
        </div>
    );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "cyan" | "amber" | "emerald" | "violet" }) {
    const tones = {
        cyan: "border-cyan-500/20 bg-cyan-500/6 text-cyan-700",
        amber: "border-amber-500/20 bg-amber-500/6 text-amber-700",
        emerald: "border-emerald-500/20 bg-emerald-500/6 text-emerald-700",
        violet: "border-violet-500/20 bg-violet-500/6 text-violet-700",
    };

    return (
        <div className="site-outline-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
            <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{value}</div>
        </div>
    );
}

function InsightCard({ title, description, footer, icon }: { title: string; description: string; footer: string; icon: React.ReactNode }) {
    return (
        <div className="site-outline-card space-y-3 p-4">
            <div className="flex items-center gap-2">
                {icon}
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
            </div>
            <p className="text-sm leading-7 text-foreground">{description}</p>
            <div className="text-xs font-medium text-muted-foreground">{footer}</div>
        </div>
    );
}

function TheoryCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-[1.2rem] border border-border/60 bg-muted/10 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">{title}</div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
        </div>
    );
}
