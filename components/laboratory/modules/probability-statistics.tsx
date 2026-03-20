"use client";

import React from "react";
import { Activity, BarChart3, Calculator, Percent, Sparkles, TrendingUp, Zap, Target } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Cell 
} from "recharts";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { calculateStatistics, generateNormalDistribution, generateBinomialDistribution, generatePoissonDistribution, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { queueWriterImport } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type StatBlockId = "setup" | "analysis" | "visuals" | "bridge";

const statNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Data input va distribution presets" },
    { id: "analysis" as const, label: "Descriptive", description: "Mean, Median va Variance tahlili" },
    { id: "visuals" as const, label: "Visuals", description: "Histogram va Probability Density" },
    { id: "bridge" as const, label: "Bridge", description: "Export va Publishing" },
];

export function ProbabilityStatisticsModule({ module }: { module: LaboratoryModuleMeta }) {
    const [dataInput, setDataInput] = React.useState("10, 12, 11, 15, 12, 11, 14, 13, 15, 12, 10, 11");
    const [distConfig, setDistConfig] = React.useState({ type: "normal", mean: 0, sd: 1, n: 10, p: 0.5, lambda: 4 });
    
    const notebook = useLaboratoryNotebook<StatBlockId>({
        storageKey: "mathsphere-lab-stat-notebook",
        definitions: statNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "visuals"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const data = React.useMemo(() => {
        return dataInput.split(/[,\s]+/).map(Number).filter(v => !isNaN(v));
    }, [dataInput]);

    let error = "";
    let summary: any = null;
    let probCurve: any[] = [];

    try {
        summary = calculateStatistics(data);
        if (distConfig.type === "normal") {
            probCurve = generateNormalDistribution(distConfig.mean, distConfig.sd);
        } else if (distConfig.type === "binomial") {
            probCurve = generateBinomialDistribution(distConfig.n, distConfig.p);
        } else if (distConfig.type === "poisson") {
            probCurve = generatePoissonDistribution(distConfig.lambda);
        }
    } catch (e: any) {
        error = e.message;
    }

    const applyPreset = (p: any) => {
        if (p.type === "normal") {
            setDistConfig(prev => ({ ...prev, type: "normal", mean: Number(p.mean), sd: Number(p.sd) }));
            const simulated = Array.from({ length: 60 }, () => 
                Number(p.mean) + (Math.random() * 6 - 3) * Number(p.sd)
            );
            setDataInput(simulated.map(v => v.toFixed(2)).join(", "));
        } else if (p.type === "binomial") {
            setDistConfig(prev => ({ ...prev, type: "binomial", n: Number(p.n), p: Number(p.p) }));
            // Simulate sampling
            const simulated = Array.from({ length: 40 }, () => {
                let hits = 0;
                for(let i=0; i<Number(p.n); i++) if(Math.random() < Number(p.p)) hits++;
                return hits;
            });
            setDataInput(simulated.join(", "));
        } else if (p.type === "poisson") {
            setDistConfig(prev => ({ ...prev, type: "poisson", lambda: Number(p.lambda) }));
            const simulated = Array.from({ length: 50 }, () => {
                let L = Math.exp(-Number(p.lambda)), k = 0, pVal = 1;
                do { k++; pVal *= Math.random(); } while (pVal > L);
                return k - 1;
            });
            setDataInput(simulated.join(", "));
        }
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Probability & Statistics"
                description="Descriptive Statistics va Ma'lumotlar vizualizatsiyasi tahlili."
                activeBlocks={notebook.activeBlocks}
                definitions={statNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Analytical Engine</div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Observation Data (Raw Samples)</div>
                                <textarea 
                                    value={dataInput} 
                                    onChange={e => setDataInput(e.target.value)} 
                                    className="min-h-[100px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" 
                                />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && summary && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <div className="site-eyebrow text-accent">Summary Statistics</div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <StatCard label="Mean (u)" value={String(summary.mean)} icon={TrendingUp} highlight />
                                <StatCard label="Median" value={String(summary.median)} icon={Calculator} />
                                <StatCard label="Variance (σ²)" value={String(summary.variance)} icon={Zap} />
                                <StatCard label="Std. Dev (σ)" value={String(summary.standardDeviation)} icon={Percent} highlight />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("visuals") && summary && (
                        <div className="space-y-6">
                            <div className="site-panel p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="site-eyebrow text-accent">Distribution Histogram</div>
                                    <BarChart3 className="h-4 w-4 text-accent/50" />
                                </div>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary.histogram}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                            <XAxis dataKey="bin" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={{fill: 'var(--accent)', opacity: 0.05}}
                                                contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--accent)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="site-eyebrow text-accent">Probability Logic ({distConfig.type.toUpperCase()})</div>
                                     <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${distConfig.type === 'normal' ? 'bg-teal-500/10 text-teal-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        Estimation Active
                                    </div>
                                </div>
                                <CartesianPlot 
                                    series={[{ label: "PDF/PMF", color: "var(--accent)", points: probCurve }]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Statistical Scenarios</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.statistics.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group text-left">
                                     <div>
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                         <div className="text-[8px] font-mono text-muted-foreground uppercase">{p.type} model</div>
                                     </div>
                                 </button>
                             ))}
                        </div>
                    </div>

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!error && !!summary}
                            exportState={"idle"}
                            guideMode={null}
                            setGuideMode={() => {}}
                            guides={{} as any}
                            liveTargets={liveTargets}
                            onSelectTarget={setSelectedLiveTargetId}
                            selectedLiveTargetId={selectedLiveTargetId}
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

function StatCard({ label, value, icon: Icon, highlight = false }: { label: string, value: string, icon: any, highlight?: boolean }) {
    return (
        <div className={`site-outline-card p-5 flex flex-col ${highlight ? 'bg-accent/5 border-accent/20' : 'bg-muted/5'}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest flex items-center mb-1 ${highlight ? 'text-accent' : 'text-muted-foreground'}`}>
                <Icon className="mr-2 h-3.5 w-3.5" />
                {label}
            </div>
            <div className="mt-2 font-serif text-2xl font-black">{value}</div>
        </div>
    );
}
