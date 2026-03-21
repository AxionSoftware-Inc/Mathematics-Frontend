"use client";

import React, { useTransition } from "react";
import { Activity, Atom, Orbit, Sparkles, Sigma, Waves, Zap, Info, Loader2, Layers3, Box } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
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
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLabEngine } from "@/components/laboratory/lab-engine";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { ArrowRight, Plus } from "lucide-react";

const exportGuides = {
    copy: {
        badge: "Quantum export",
        title: "Kvant holat natijasini nusxalash",
        description: "Qubit yoki to'lqin funksiyasi hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Bloch sferadagi cartesian va sferik koordinatalar yoziladi.",
            "Wave mode bo'lsa, energy level va peak density ko'rsatiladi.",
            "Barcha ket-notation va ehtimolliklar markdown jadval holida bo'ladi.",
        ],
        note: "Maqola ichida kvant mexanik hisob-kitoblarni tezkor joylash uchun qulay.",
    },
    send: {
        badge: "Writer import",
        title: "Kvant natijasini writer'ga yuborish",
        description: "Hisobotni yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Kvant export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Simulyatsiya parametrlari va natijalari draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type QuantumBlockId = "setup" | "bloch" | "wave" | "bridge";
type QuantumPreset = (typeof LABORATORY_PRESETS.quantum)[number];

const quantumNotebookBlocks = [
    { id: "setup" as const, label: "Subatomic State", description: "Qubit parametrlar va holat tanlovi" },
    { id: "bloch" as const, label: "Bloch Sphere", description: "3D qubit trayektoriyasi" },
    { id: "wave" as const, label: "Wave Density", description: "To'lqin funksiyasi va ehtimollik zichligi" },
    { id: "bridge" as const, label: "Cognitive Bridge", description: "Natijani writer oqimiga yuborish" },
];

const QUANTUM_WORKFLOW_TEMPLATES = [
    {
        id: "superposition-audit",
        title: "State Superposition Audit",
        description: "Hadamard holati va faza superpozitsiyasining Bloch sferadagi tahlili.",
        mode: "qubit" as const,
        presetLabel: "Superposition |+>",
        blocks: ["setup", "bloch"] as const,
    },
    {
        id: "wave-packet-decoherence",
        title: "Wave Packet Evolution",
        description: "To'lqin paketining kengayishi va impuls lokalizatsiyasi tahlili.",
        mode: "wave" as const,
        presetLabel: "Localized Packet",
        blocks: ["setup", "wave"] as const,
    },
] as const;

type QntAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type QntSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    theta: string;
    phi: string;
    mode: "qubit" | "wave";
    n: string;
};

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

function formatNumber(value: number, digits = 3) {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return value.toFixed(digits);
}

function clamp(value: number, min: number, max: number) {
    return !Number.isFinite(value) ? min : Math.min(max, Math.max(min, value));
}

function normalizePhi(value: number) {
    const fullTurn = Math.PI * 2;
    return ((value % fullTurn) + fullTurn) % fullTurn;
}

function isAnglePreset(preset: QuantumPreset): preset is QuantumPreset & { theta: number; phi: number } {
    return typeof (preset as any).theta === "number";
}

function isWavePacketPreset(preset: QuantumPreset): preset is QuantumPreset & { type: "wave-packet"; spread?: number; momentum?: number } {
    return (preset as any).type === "wave-packet";
}

function buildQuantumMarkdown(params: {
    mode: "qubit" | "wave";
    theta: number;
    phi: number;
    qubitAnalysis: ReturnType<typeof analyzeQuantumState>;
    waveMode: "state" | "packet";
    n: number;
    waveInsights: { normEstimate: number; peakDensity: number; peakAmplitude: number; nodes: number };
}) {
    const { mode, theta, phi, qubitAnalysis, waveMode, n, waveInsights } = params;

    if (mode === "qubit") {
        return `## Laboratory Export: Quantum Qubit Simulation
        
### State Vector (Bloch Sphere)
- Ket Notation: \`${qubitAnalysis.ket}\`
- Angles: Theta=${formatNumber(theta, 3)} rad, Phi=${formatNumber(phi, 3)} rad
- Cartesian: [${formatNumber(qubitAnalysis.cartesian.x, 3)}, ${formatNumber(qubitAnalysis.cartesian.y, 3)}, ${formatNumber(qubitAnalysis.cartesian.z, 3)}]

### Probabilities
- |0⟩ (Zero State): ${formatNumber(qubitAnalysis.zeroProbability * 100, 2)}%
- |1⟩ (One State): ${formatNumber(qubitAnalysis.oneProbability * 100, 2)}%
- Coherence: ${formatNumber(qubitAnalysis.coherence, 4)}`;
    }

    return `## Laboratory Export: Quantum Wave Logic
        
### Configuration
- Wave Mode: ${waveMode}
- ${waveMode === "state" ? `Excitation Level (n): ${n}` : "Packet-based simulation"}

### Diagnostics
- Peak Amplitude: ${formatNumber(waveInsights.peakAmplitude, 4)}
- Peak Density: ${formatNumber(waveInsights.peakDensity, 4)}
- Nodes counted: ${waveInsights.nodes}
- Norm Estimate: ${formatNumber(waveInsights.normEstimate, 6)}`;
}

function buildQuantumLivePayload(params: {
    targetId: string;
    mode: "qubit" | "wave";
    theta: number;
    phi: number;
    qubitAnalysis: ReturnType<typeof analyzeQuantumState>;
    waveMode: "state" | "packet";
    n: number;
    waveInsights: { normEstimate: number; peakDensity: number; peakAmplitude: number; nodes: number };
}): WriterBridgeBlockData {
    const { targetId, mode, theta, phi, qubitAnalysis, waveMode, n, waveInsights } = params;

    if (mode === "qubit") {
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "quantum-lab",
            kind: "quantum-state",
            title: `Quantum State: ${qubitAnalysis.ket}`,
            summary: "Single qubit state representation on Bloch sphere.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "Theta", value: formatNumber(theta, 3) },
                { label: "Phi", value: formatNumber(phi, 3) },
                { label: "Prob |0>", value: formatNumber(qubitAnalysis.zeroProbability, 4) },
                { label: "Prob |1>", value: formatNumber(qubitAnalysis.oneProbability, 4) },
            ],
            notes: [`State: ${qubitAnalysis.ket}`, `Coherence: ${formatNumber(qubitAnalysis.coherence, 4)}`],
        };
    }

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "quantum-lab",
        kind: "quantum-wave",
        title: `Quantum Wave Function (n=${n})`,
        summary: "Relativistic probability density and wave mechanics.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "n-level", value: String(n) },
            { label: "Peak Psi", value: formatNumber(waveInsights.peakAmplitude, 4) },
            { label: "Peak Density", value: formatNumber(waveInsights.peakDensity, 4) },
            { label: "Norm", value: formatNumber(waveInsights.normEstimate, 4) },
        ],
        notes: [`Wave mode: ${waveMode}`, `Spatial nodes: ${waveInsights.nodes}`],
    };
}

export function QuantumLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"qubit" | "wave">("qubit");
    const [waveMode, setWaveMode] = React.useState<"state" | "packet">("state");
    const [theta, setTheta] = React.useState(() => clamp(Number(module.config?.defaultTheta ?? Math.PI / 2), 0, Math.PI));
    const [phi, setPhi] = React.useState(() => normalizePhi(Number(module.config?.defaultPhi ?? 0)));
    const [n, setN] = React.useState(3);
    const [packetSpread, setPacketSpread] = React.useState(1.2);
    const [packetMomentum, setPacketMomentum] = React.useState(3.4);
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<QntAnnotation[]>(() =>
        readStoredArray<QntAnnotation>("mathsphere-lab-qnt-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<QntSavedExperiment[]>(() =>
        readStoredArray<QntSavedExperiment>("mathsphere-lab-qnt-experiments"),
    );
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
        const nodes = waveMode === "state" ? Math.max(0, n - 1) : 0;

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
            } else {
                setMode("wave");
                if (isWavePacketPreset(preset)) {
                    setWaveMode("packet");
                    setPacketSpread(clamp(preset.spread ?? 1.2, 0.35, 2.4));
                    setPacketMomentum(clamp(preset.momentum ?? 3.4, 1, 7.5));
                } else {
                    setWaveMode("state");
                    setN(Math.max(1, preset.n || 3));
                }
            }
            setActiveTemplateId(null);
        });
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = QUANTUM_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.quantum.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setMode(template.mode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-qnt-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-qnt-experiments", savedExperiments);
    }, [savedExperiments]);

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

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: true,
        sourceLabel: "Quantum Lab",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildQuantumMarkdown({ mode, theta, phi, qubitAnalysis, waveMode, n, waveInsights }),
        buildBlock: (targetId) => buildQuantumLivePayload({ targetId, mode, theta, phi, qubitAnalysis, waveMode, n, waveInsights }),
        getDraftMeta: () => ({
            title: `Quantum Analysis: ${qubitAnalysis.ket}`,
            abstract: "Exported from Quantum Singular Engine.",
            keywords: "quantum,qubit,bloch,schrodinger",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (mode === "qubit") {
            if (qubitAnalysis.coherence > 0.9) {
                signals.push({ tone: "info", label: "Pure State", text: "Qubit holati maksimal koherensiyada." });
            } else {
                signals.push({ tone: "warn", label: "Decoherence Risk", text: "Superpozitsiya holati beqaror bo'lishi mumkin." });
            }
        } else {
            if (waveInsights.normEstimate < 0.95 || waveInsights.normEstimate > 1.05) {
                signals.push({ tone: "danger", label: "Norm Alert", text: "To'lqin funksiyasi normalizatsiyasi buzilgan." });
            } else {
                signals.push({ tone: "info", label: "Unitary Wave", text: "Ehtimollik zichligi integrali barqaror." });
            }
        }
        return signals;
    }, [mode, qubitAnalysis, waveInsights]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Quantum Logic",
        "- **Superposition** orqali qubit bir vaqtning o'zida |0> va |1> holatlarida bo'la oladi.",
        "- **Bloch Sphere** unitar o'zgarishlarni vizuallashtirish uchun ishlatiladi.",
        "- **Schrodinger Tenglamasi** to'lqin funksiyasining vaqt ichida evolyutsiyasini tahlil qiladi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Quantum Computation Report",
        `Mode: ${mode}`,
        `Current State: ${mode === "qubit" ? qubitAnalysis.ket : "Wave Packets"}`,
        "",
        "### Physics Diagnostics",
        mode === "qubit" ? `- Zero Prob: ${qubitAnalysis.zeroProbability.toFixed(4)}` : `- Peak Amplitude: ${waveInsights.peakAmplitude.toFixed(4)}`,
        `- Coherence Factor: ${mode === "qubit" ? qubitAnalysis.coherence.toFixed(4) : "N/A"}`,
        "- Hilbert space dimensionality verified for single-qubit subsystem.",
    ].join("\n"), [mode, qubitAnalysis, waveInsights]);

    function addAnnotation() {
        const note: QntAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Quantum Note",
            note: annotationNote || "Subatomic observation.",
            anchor: mode === "qubit" ? `State: ${qubitAnalysis.ket}` : `Level: ${n}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: QntSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Quantum Experiment",
            savedAt: new Date().toISOString(),
            theta: String(theta),
            phi: String(phi),
            mode,
            n: String(n)
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: QntSavedExperiment) {
        setTheta(Number(exp.theta));
        setPhi(Number(exp.phi));
        setMode(exp.mode);
        setN(Number(exp.n));
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Quantum Singular Engine"
                description="Exploring Hilbert space dimensionality, Bloch sphere trajectories and Schrodinger probability distributions."
                activeBlocks={notebook.activeBlocks}
                definitions={quantumNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun kvant modullarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-cyan-600">Hilbert Space Controller</div>
                                    <div className="flex gap-2">
                                        {(["qubit", "wave"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m === "qubit" ? "Qubit (Bloch)" : "Wave Logic"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center shadow-lg shadow-teal-500/5">
                                    <Atom className={`mr-2 h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                                    Coherence Sync
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activePresetDescription && (
                                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground italic font-serif">
                                        &quot;{activePresetDescription}&quot;
                                    </div>
                                )}

                                {mode === "qubit" ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Polar (theta)</div>
                                            <input type="range" min="0" max={Math.PI} step="0.01" value={theta} onChange={e => setTheta(Number(e.target.value))} className="w-full accent-cyan-600" />
                                            <div className="text-xs font-mono font-bold text-center">{formatNumber(theta, 3)} rad</div>
                                        </div>
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phase (phi)</div>
                                            <input type="range" min="0" max={Math.PI * 2} step="0.01" value={phi} onChange={e => setPhi(Number(e.target.value))} className="w-full accent-cyan-600" />
                                            <div className="text-xs font-mono font-bold text-center">{formatNumber(phi, 3)} rad</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex gap-2 p-1 bg-muted/10 rounded-xl border border-border/50">
                                            {(["state", "packet"] as const).map(v => (
                                                <button key={v} onClick={() => setWaveMode(v)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${waveMode === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                        {waveMode === "state" ? (
                                            <div className="site-outline-card p-4 space-y-2">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Excitation Level (n)</div>
                                                <input type="range" min="1" max="6" step="1" value={n} onChange={e => setN(Number(e.target.value))} className="w-full accent-cyan-600" />
                                                <div className="text-xs font-mono font-bold text-center">n = {n}</div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="site-outline-card p-4 space-y-2">
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spread (σ)</div>
                                                    <input type="range" min="0.35" max="2.4" step="0.05" value={packetSpread} onChange={e => setPacketSpread(Number(e.target.value))} className="w-full accent-cyan-600" />
                                                    <div className="text-xs font-mono font-bold text-center">{formatNumber(packetSpread, 2)}</div>
                                                </div>
                                                <div className="site-outline-card p-4 space-y-2">
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Momentum (k)</div>
                                                    <input type="range" min="1" max="7.5" step="0.1" value={packetMomentum} onChange={e => setPacketMomentum(Number(e.target.value))} className="w-full accent-cyan-600" />
                                                    <div className="text-xs font-mono font-bold text-center">{formatNumber(packetMomentum, 2)}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-cyan-600" />
                                <div className="site-eyebrow text-cyan-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {QUANTUM_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-cyan-600/40 bg-cyan-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-cyan-600/40 hover:bg-cyan-600/5"
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
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-600" />
                            <div className="site-eyebrow text-cyan-600">Quantum Presets</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.quantum.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-3 text-left transition-all group hover:translate-x-1 hover:border-cyan-600/40 hover:bg-cyan-600/5"
                                >
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-cyan-600">{preset.label}</div>
                                        <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{quantumPresetDescriptions[preset.label] || "Quantum scenario"}</div>
                                    </div>
                                    <Zap className="ml-3 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-cyan-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <LaboratorySignalPanel
                        eyebrow="Quantum Signals"
                        title="Hilbert monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-cyan-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-cyan-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-cyan-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-cyan-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-cyan-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-600/40" />
                             <button onClick={saveExperiment} className="bg-cyan-600 text-white px-4 rounded-xl hover:bg-cyan-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-cyan-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.mode} | n={e.n} | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {mode === "qubit" && notebook.hasBlock("bloch") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Geometric Workspace</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="site-eyebrow text-cyan-600">Bloch Sphere Mapping</div>
                                        <div className="site-outline-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ψ = {qubitAnalysis.ket}</div>
                                    </div>
                                    <div className="w-full">
                                        <ScientificPlot
                                            type="scatter3d"
                                            data={buildBlochTraces(qubitAnalysis.cartesian)}
                                            height={450}
                                            title="State Vector Visualization"
                                            insights={["bloch sphere", "state vector", "phase geometry"]}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        <div className="site-outline-card border-cyan-600/20 bg-cyan-600/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-cyan-600">Prob |0{" >"}</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(qubitAnalysis.zeroProbability, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Prob |1{" >"}</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(qubitAnalysis.oneProbability, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Coherence</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(qubitAnalysis.coherence, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Latitude</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(qubitAnalysis.latitude, 1)}°</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "wave" && notebook.hasBlock("wave") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Spectral Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="site-eyebrow text-cyan-600">Probability Density</div>
                                        <div className="site-outline-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">n = {n} level</div>
                                    </div>
                                    <div className="w-full">
                                        <CartesianPlot
                                            height={350}
                                            series={[
                                                { label: "Amplitude Ψ(x)", color: "var(--accent)", points: currentWaveData.map(p => ({ x: p.x, y: p.y })) },
                                                { label: "Density |Ψ|²", color: "#10b981", points: currentWaveData.map(p => ({ x: p.x, y: p.prob })) },
                                            ]}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        <div className="site-outline-card border-cyan-600/20 bg-cyan-600/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-cyan-600">Peak |Psi|</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(waveInsights.peakAmplitude, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Peak Density</div><div className="mt-1 font-serif text-xl font-black">{formatNumber(waveInsights.peakDensity, 4)}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nodes</div><div className="mt-1 font-serif text-xl font-black">{waveInsights.nodes}</div></div>
                                        <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Norm Est.</div><div className="mt-1 font-serif text-lg font-black">{formatNumber(waveInsights.normEstimate, 4)}</div></div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Layers3 className="h-3.5 w-3.5" />
                                                Wave insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                To'lqin funksiyasi amplitudasi (psi) va ehtimollik zichligi (psi kvadrat) real vaqtda hisoblanmoqda.
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Box className="h-3.5 w-3.5" />
                                                Energy insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {waveMode === "state" ? `Energetik daraja n=${n} ga mos keladigan tugunlar soni ${waveInsights.nodes} tani tashkil etadi.` : "Gausian to'lqin paketi koordinata-impuls noaniqligini ko'rsatib turibdi."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={true}
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
