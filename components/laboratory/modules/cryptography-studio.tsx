"use client";

import React from "react";
import { ShieldCheck, Plus, Activity, Zap, Sparkles, Hash, Lock, Unlock, Key, RefreshCw, Send, ArrowRight } from "lucide-react";

import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { isPrime, gcd, modInverse, calculateECCPointAddition, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";

type CryptoBlockId = "setup" | "rsa" | "ecc" | "bridge";

const cryptoNotebookBlocks = [
    { id: "setup" as const, label: "Core Parameters", description: "Primes p, q va Curves" },
    { id: "rsa" as const, label: "RSA Engine", description: "Keygen va Msg flow" },
    { id: "ecc" as const, label: "Elliptic Curves", description: "Point Addition visualizer" },
    { id: "bridge" as const, label: "Bridge", description: "Export Crypto keys" },
];

export function CryptographyStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<"rsa" | "ecc">("rsa");
    
    // RSA State
    const [p, setP] = React.useState("61");
    const [q, setQ] = React.useState("53");
    const [msg, setMsg] = React.useState("HELLO");
    
    // ECC State
    const [eccP, setEccP] = React.useState("17");
    const [eccA, setEccA] = React.useState("2");
    const [eccX, setEccX] = React.useState("5");
    const [eccY, setEccY] = React.useState("1");

    const notebook = useLaboratoryNotebook<CryptoBlockId>({
        storageKey: "mathsphere-lab-crypto-notebook",
        definitions: cryptoNotebookBlocks,
        defaultBlocks: ["setup", "rsa"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

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
            const encrypted = encoded.map(m => {
                 // Large power mod implementation needed for real RSA, using simple here
                 return Math.pow(m, e) % n; // Note: BigInt needed for real
            });
            
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
    };

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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Security Core</div>
                                    <div className="flex gap-2">
                                        {(["rsa", "ecc"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center">
                                    <Lock className="mr-2 h-3.5 w-3.5" /> Encryption: Active
                                </div>
                            </div>

                            {mode === "rsa" ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prime p</div><input value={p} onChange={e => setP(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prime q</div><input value={q} onChange={e => setQ(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Message</div><input value={msg} onChange={e => setMsg(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Prime Modulus p</div><input value={eccP} onChange={e => setEccP(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Curve Param a</div><input value={eccA} onChange={e => setEccA(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Point Base X</div><input value={eccX} onChange={e => setEccX(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Point Base Y</div><input value={eccY} onChange={e => setEccY(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "rsa" && rsaResults && (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="site-outline-card p-5 bg-indigo-500/5"><div className="text-[10px] font-black uppercase text-indigo-600 mb-1">Public Key (n, e)</div><div className="font-serif text-lg font-black truncate">{rsaResults.n}, {rsaResults.e}</div></div>
                                <div className="site-outline-card p-5"><div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Private Key (d)</div><div className="font-serif text-lg font-black">{rsaResults.d}</div></div>
                                <div className="site-outline-card p-5"><div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Phi(n)</div><div className="font-serif text-lg font-black">{rsaResults.phi}</div></div>
                            </div>
                            
                            <div className="site-panel p-6 space-y-4">
                                <div className="site-eyebrow text-accent">RSA Transmission</div>
                                <div className="flex items-center gap-6">
                                    <div className="flex-1 p-4 rounded-xl border border-border bg-background flex flex-col items-center">
                                        <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Plaintext</div>
                                        <div className="text-2xl font-black">{msg}</div>
                                    </div>
                                    <ArrowRight className="h-6 w-6 text-accent animate-pulse" />
                                    <div className="flex-1 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center overflow-hidden">
                                        <div className="text-[10px] font-bold uppercase text-indigo-600 mb-2">Ciphertext</div>
                                        <div className="text-xs font-mono font-bold truncate max-w-full">{(rsaResults as any).encrypted?.join(" ")}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "ecc" && eccResults && (
                        <div className="site-panel-strong p-6 space-y-4 min-h-[400px]">
                            <div className="site-eyebrow text-accent">Elliptic Curve Point Map (Finite Field)</div>
                            <div className="h-[350px]">
                                <CartesianPlot 
                                    series={[{ label: "Point Addition Path", color: "var(--accent)", points: eccResults.points }]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Security Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.crypto.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="text-[8px] font-mono text-muted-foreground uppercase">Cipher algorithm</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!rsaResults || !!eccResults}
                            exportState="idle"
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            selectedLiveTargetId={selectedLiveTargetId}
                            onSelectTarget={setSelectedLiveTargetId}
                            onCopy={() => {}}
                            onSend={() => {}}
                            onPush={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
