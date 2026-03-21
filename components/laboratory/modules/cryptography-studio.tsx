"use client";

import React from "react";
import { ShieldCheck, Lock, Unlock, Key, RefreshCw, Send, ArrowRight, Sparkles, Activity, Layers3, Box, Info, Plus, Compass } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook, LaboratoryNotebookEmptyState } from "@/components/laboratory/laboratory-notebook";
import { isPrime, gcd, modInverse, calculateECCPointAddition, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";

const exportGuides = {
    copy: {
        badge: "Crypto export",
        title: "Kripto natijani nusxalash",
        description: "RSA kalitlari yoki ECC nuqtalari hisoboti clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "RSA holatida (n, e, d) kalitlar va shifrlangan xabar yoziladi.",
            "ECC holatida nuqtalar zanjiri va egri chiziq parametrlari ko'rsatiladi.",
            "Markdown formatida xavfsizlik tahlili va algoritmlar yaratiladi.",
        ],
        note: "Kriptografik protokollar va tizimlar tahlili uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Kripto natijani writer'ga yuborish",
        description: "Shifrlash natijalarini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Crypto export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Kalitlar va shifrlash jarayoni draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type CryptoBlockId = "setup" | "rsa" | "ecc" | "bridge";

const cryptoNotebookBlocks = [
    { id: "setup" as const, label: "Core Parameters", description: "Primes p, q va Curves" },
    { id: "rsa" as const, label: "RSA Engine", description: "Keygen va Msg flow" },
    { id: "ecc" as const, label: "Elliptic Curves", description: "Point Addition visualizer" },
    { id: "bridge" as const, label: "Bridge", description: "Export Crypto keys" },
];

const CRYPTO_WORKFLOW_TEMPLATES = [
    {
        id: "rsa-audit",
        title: "RSA Key Entropy Audit",
        description: "RSA kalitlarini generatsiya qilish va ularning xavfsizlik darajasini tekshirish.",
        mode: "rsa" as const,
        presetLabel: "RSA Standard",
        blocks: ["setup", "rsa"] as const,
    },
    {
        id: "ecc-audit",
        title: "ECC Point Multiplication Audit",
        description: "Elliptik egri chiziqlarda nuqtalarni ko'paytirish va zanjir tahlili.",
        mode: "ecc" as const,
        presetLabel: "ECC Curve",
        blocks: ["setup", "ecc"] as const,
    },
] as const;

type CryptoAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type CryptoSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: "rsa" | "ecc";
    p: string;
    q: string;
    msg: string;
    eccP: string;
    eccA: string;
    eccX: string;
    eccY: string;
};

function buildCryptoMarkdown(params: {
    mode: "rsa" | "ecc";
    rsaResults: any;
    eccResults: any;
    msg: string;
}) {
    const { mode, rsaResults, eccResults, msg } = params;
    if (mode === "rsa" && rsaResults) {
        return `## Laboratory Export: RSA Cryptosystem Analysis
        
### Keys
- Public Key (n, e): (${rsaResults.n}, ${rsaResults.e})
- Private Key (d): ${rsaResults.d}
- Phi(n): ${rsaResults.phi}

### Transmission
- Plaintext: ${msg}
- Ciphertext (encoded): ${rsaResults.encrypted?.join(", ")}`;
    }
    if (mode === "ecc" && eccResults) {
        return `## Laboratory Export: ECC Analysis
        
### Distribution
- Elliptic Curve Point Addition Path: ${eccResults.points.length} points calculated.
- Base Point: (${eccResults.points[0]?.x}, ${eccResults.points[0]?.y})`;
    }
    return "Cryptography study result not available.";
}

function buildCryptoLivePayload(params: {
    targetId: string;
    mode: "rsa" | "ecc";
    rsaResults: any;
    eccResults: any;
    msg: string;
}): WriterBridgeBlockData {
    const { targetId, mode, rsaResults, eccResults, msg } = params;
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "cryptography-studio",
        kind: "cryptography",
        title: mode === "rsa" ? `RSA Encryption: ${msg}` : "ECC Point Map",
        summary: "Relativistic security analysis and cryptographic primitives.",
        generatedAt: new Date().toISOString(),
        metrics: mode === "rsa" ? [
            { label: "n", value: String(rsaResults?.n || "--") },
            { label: "e", value: String(rsaResults?.e || "--") },
            { label: "d", value: String(rsaResults?.d || "--") },
        ] : [
            { label: "Points", value: String(eccResults?.points.length || 0) },
            { label: "Modulus", value: "Finite Field" },
        ],
        notes: [
            `Mode: ${mode}`,
            mode === "rsa" ? `Message: ${msg}` : "Elliptic Curve Point Multiplication Path",
        ],
        plotSeries: mode === "ecc" && eccResults ? [{ label: "ECC Path", color: "var(--accent)", points: eccResults.points }] : undefined,
    };
}

export function CryptographyStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"rsa" | "ecc">("rsa");
    const [p, setP] = React.useState("61");
    const [q, setQ] = React.useState("53");
    const [msg, setMsg] = React.useState("HELLO");
    const [eccP, setEccP] = React.useState("17");
    const [eccA, setEccA] = React.useState("2");
    const [eccX, setEccX] = React.useState("5");
    const [eccY, setEccY] = React.useState("1");
    
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const notebook = useLaboratoryNotebook<CryptoBlockId>({
        storageKey: "mathsphere-lab-crypto-notebook",
        definitions: cryptoNotebookBlocks,
        defaultBlocks: ["setup", "rsa"],
    });

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = React.useState<CryptoAnnotation[]>(() =>
        readStoredArray<CryptoAnnotation>("mathsphere-lab-crypto-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<CryptoSavedExperiment[]>(() =>
        readStoredArray<CryptoSavedExperiment>("mathsphere-lab-crypto-experiments"),
    );

    const rsaResults = React.useMemo(() => {
        if (mode !== "rsa") return null;
        try {
            const P = Number(p);
            const Q = Number(q);
            if (!isPrime(P) || !isPrime(Q)) return { error: "p va q tub son bo'lishi shart." };
            const n = P * Q;
            const phi = (P - 1) * (Q - 1);
            let e = 65537;
            while (gcd(e, phi) !== 1 && e < phi) e += 2;
            const d = modInverse(e, phi);
            const encoded = msg.split("").map(c => c.charCodeAt(0));
            const encrypted = encoded.map(m => Math.pow(m, e) % n);
            return { n, phi, e, d, encrypted };
        } catch { return null; }
    }, [p, q, msg, mode]);

    const eccResults = React.useMemo(() => {
       if (mode !== "ecc") return null;
       try {
           const P = Number(eccP);
           const A = Number(eccA);
           const pt = { x: Number(eccX), y: Number(eccY) };
           const points = [pt];
           let current = pt;
           for (let i = 0; i < 10; i++) {
               const next = calculateECCPointAddition(current, pt, A, P);
               if (!next) break;
               points.push(next);
               current = next;
           }
           return { points };
       } catch { return null; }
    }, [eccP, eccA, eccX, eccY, mode]);

    const applyPreset = (pr: any) => {
        if (pr.label.startsWith("RSA")) {
            setMode("rsa");
            setP(pr.p); setQ(pr.q); setMsg(pr.msg);
        } else {
            setMode("ecc");
            setEccA(pr.a); setEccP(pr.p); setEccX(pr.x); setEccY(pr.y);
        }
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = CRYPTO_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.crypto.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        setMode(template.mode);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-crypto-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-crypto-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: true,
        sourceLabel: "Cryptography Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildCryptoMarkdown({ mode, rsaResults, eccResults, msg }),
        buildBlock: (targetId) => buildCryptoLivePayload({ targetId, mode, rsaResults, eccResults, msg }),
        getDraftMeta: () => ({
            title: `Cryptography Study: ${mode.toUpperCase()}`,
            abstract: "Secure communication and elliptic curve analysis.",
            keywords: "crypto,rsa,ecc,encryption,security",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (mode === "rsa") {
            if (rsaResults?.error) {
                signals.push({ tone: "danger", label: "Invalid Primes", text: rsaResults.error });
            } else if (typeof rsaResults?.n === "number" && rsaResults.n < 1000) {
                signals.push({ tone: "warn", label: "Weak Key", text: "Modulus n juda kichik. Primes p va q ni oshiring." });
            } else {
                signals.push({ tone: "info", label: "Secure RSA", text: "Kalitlar generatsiya qilindi va barqaror." });
            }
        } else {
            if (eccResults && eccResults.points.length < 5) {
                signals.push({ tone: "warn", label: "ECC Warning", text: "Nuqtalar zanjiri juda qisqa yoki chekli." });
            } else {
                signals.push({ tone: "info", label: "ECC Active", text: "Elliptik egri chiziq nuqtalari muvaffaqiyatli hisoblandi." });
            }
        }
        return signals;
    }, [mode, rsaResults, eccResults]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Modern Cryptography Mechanics",
        "- **RSA** juda katta tub sonlarni ko'paytirish oson, lekin ularni ko'paytuvchilarga ajratish qiyinligiga asoslangan.",
        "- **ECC (Elliptic Curves)** kichikroq kalitlar orqali RSA bilan bir xil darajadagi xavfsizlikni ta'minlaydi.",
        "- **Modular Inverse** yordamida shifrlash va deşifrlash kalitlari o'rtasidagi mantiqiy bog'liqlik o'rnatiladi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Security Audit Report",
        `Mode: ${mode.toUpperCase()}`,
        mode === "rsa" ? `Primes: p=${p}, q=${q}` : `Curve: A=${eccA}, P=${eccP}`,
        "",
        "### Security Metrics",
        mode === "rsa" ? `- Modulus n: ${rsaResults?.n || "N/A"}` : `- Point Cycle: ${eccResults?.points.length || 0}`,
        "- Cryptographic primitives successfully validated for current state.",
    ].join("\n"), [mode, p, q, eccA, eccP, rsaResults, eccResults]);

    function addAnnotation() {
        if (rsaResults?.error) return;
        const note: CryptoAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Crypto Note",
            note: annotationNote || "Security observation.",
            anchor: mode === "rsa" ? `n: ${rsaResults?.n}` : `Mod: ${eccP}`,
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: CryptoSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Crypto Experiment",
            savedAt: new Date().toISOString(),
            mode, p, q, msg, eccP, eccA, eccX, eccY
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: CryptoSavedExperiment) {
        setMode(exp.mode);
        setP(exp.p); setQ(exp.q); setMsg(exp.msg);
        setEccP(exp.eccP); setEccA(exp.eccA); setEccX(exp.eccX); setEccY(exp.eccY);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Cryptography Studio"
                description="RSA Encryption, Elliptic Curves va Modular Arifmetika."
                activeBlocks={notebook.activeBlocks}
                definitions={cryptoNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun kriptografik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-indigo-600">Security Controller</div>
                                    <div className="flex gap-2">
                                        {(["rsa", "ecc"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center shadow-lg shadow-indigo-500/5 transition-all">
                                    <Activity className="mr-2 h-3.5 w-3.5" /> Core Status: Active
                                </div>
                            </div>

                            <div className="space-y-4">
                                {mode === "rsa" ? (
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prime p</div><input value={p} onChange={e => setP(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                        <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prime q</div><input value={q} onChange={e => setQ(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                        <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Message</div><input value={msg} onChange={e => setMsg(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modulus P & Curve A</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={eccP} onChange={e => setEccP(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="P" />
                                                <input value={eccA} onChange={e => setEccA(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="A" />
                                            </div>
                                        </div>
                                        <div className="site-outline-card p-4 space-y-2">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Point (X, Y)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={eccX} onChange={e => setEccX(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="X" />
                                                <input value={eccY} onChange={e => setEccY(e.target.value)} className="bg-muted/10 rounded-lg p-2 font-mono text-xs outline-none" placeholder="Y" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            <div className="site-eyebrow text-indigo-600">Security Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.crypto.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-indigo-600/5 hover:border-indigo-600/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-indigo-600 font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">Standard Scenario</div>
                                    </div>
                                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-indigo-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-indigo-600" />
                                <div className="site-eyebrow text-indigo-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {CRYPTO_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-indigo-600/40 bg-indigo-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-indigo-600/40 hover:bg-indigo-600/5"
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
                        eyebrow="Crypto Signals"
                        title="Integrity monitoring"
                        items={warningSignals}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Konseptual tahlil"
                            content={explainModeMarkdown}
                            accentClassName="text-indigo-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Report Skeleton"
                            title="Natijalar qoralama holatida"
                            content={reportSkeletonMarkdown}
                            accentClassName="text-amber-600"
                        />
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="site-eyebrow text-indigo-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-indigo-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-indigo-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-indigo-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-600/40" />
                             <button onClick={saveExperiment} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-indigo-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{e.mode} | {new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {mode === "rsa" && rsaResults && notebook.hasBlock("rsa") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">RSA Logic Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-indigo-600">Key Generation (n, e, d)</div>
                                        <div className="site-outline-card px-3 py-1 text-[9px] font-black uppercase text-muted-foreground">p={p}, q={q}</div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="site-outline-card p-4 border-indigo-600/20 bg-indigo-600/5">
                                            <div className="text-[9px] font-bold uppercase text-indigo-600 mb-1">Modulus (n)</div>
                                            <div className="font-serif text-xl font-black">{rsaResults.n}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Public (e)</div>
                                            <div className="font-serif text-xl font-black">{rsaResults.e}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Private (d)</div>
                                            <div className="font-serif text-xl font-black">{rsaResults.d}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="rounded-2xl border border-border/60 bg-background/55 p-6 space-y-4">
                                        <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message Stream</div>
                                        <div className="flex items-center gap-6 justify-center">
                                            <div className="flex-1 text-center">
                                                <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Plaintext</div>
                                                <div className="text-2xl font-black text-foreground">{msg}</div>
                                            </div>
                                            <ArrowRight className="h-6 w-6 text-indigo-600 animate-pulse" />
                                            <div className="flex-1 text-center overflow-hidden">
                                                <div className="text-[9px] font-bold uppercase text-indigo-600 mb-1">Ciphertext</div>
                                                <div className="text-xs font-mono font-bold truncate">{(rsaResults as any).encrypted?.join(" ")}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "ecc" && eccResults && notebook.hasBlock("ecc") && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">ECC Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="site-eyebrow text-indigo-600">Elliptic Curve Point Map</div>
                                    <div className="h-[300px] w-full">
                                        <CartesianPlot 
                                            series={[{ label: "Point Addition Path", color: "var(--indigo-600)", points: eccResults.points }]}
                                        />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Points Count</div>
                                            <div className="font-serif text-xl font-black text-indigo-600">{eccResults.points.length}</div>
                                        </div>
                                        <div className="site-outline-card p-4">
                                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Prime Modulus</div>
                                            <div className="font-serif text-xl font-black">{eccP}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!rsaResults || !!eccResults}
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
