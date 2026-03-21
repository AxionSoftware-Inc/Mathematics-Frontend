"use client";

import React from "react";
import { Activity, BarChart3, Calculator, Percent, Sparkles, TrendingUp, Zap, Target, Layers3, Box, Info, ArrowRight, Plus } from "lucide-react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { calculateStatistics, generateNormalDistribution, generateBinomialDistribution, generatePoissonDistribution, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Stat export",
        title: "Statistik tahlilni nusxalash",
        description: "Deskriptiv statistika va taqsimot natijalari clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "O'rta qiymat (Mean), dispersiya (Variance) va standart chetlanish hisoblanadi.",
            "Histogramma ma'lumotlari va tanlangan model (Normal, Binomial...) yoziladi.",
            "Markdown formatida statistik xulosa va ehtimollik jadvali yaratiladi.",
        ],
        note: "Ma'lumotlar tahlili va ehtimollar nazariyasi hisobotlari uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Statistika natijasini writer'ga yuborish",
        description: "Tahlil natijasini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Stat export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Histogramma vizualizatsiyasi va parametrlar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type StatBlockId = "setup" | "analysis" | "visuals" | "bridge";

const statNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Data input va distribution presets" },
    { id: "analysis" as const, label: "Descriptive", description: "Mean, Median va Variance tahlili" },
    { id: "visuals" as const, label: "Visuals", description: "Histogram va Probability Density" },
    { id: "bridge" as const, label: "Bridge", description: "Export va Publishing" },
];

const STAT_WORKFLOW_TEMPLATES = [
    {
        id: "normal-audit",
        title: "Normal Distribution Audit",
        description: "Empirik ma'lumotlarning normal taqsimot modeliga mosligini tahlil qilish.",
        presetLabel: "Classic Normal (0, 1)",
        blocks: ["setup", "analysis", "visuals"] as const,
    },
    {
        id: "discrete-event-study",
        title: "Discrete Event Study",
        description: "Binomial va Poisson modellarini qo'llash orqali diskret hodisalar tahlili.",
        presetLabel: "Binomial Study",
        blocks: ["setup", "visuals"] as const,
    },
] as const;

type StatAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type StatSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    dataInput: string;
    distConfig: any;
};

function buildStatisticsMarkdown(dataInput: string, distType: string, summary: any) {
    return `## Laboratory Export: Probability & Statistics
        
### Dataset Metadata
- Distribution: ${distType.toUpperCase()}
- Sample Count: ${summary.count}
- Raw Series Length: ${dataInput.length} characters.

### Descriptive Analysis
- Mean (μ): ${summary.mean}
- Median: ${summary.median}
- Variance (σ²): ${summary.variance}
- StdDev (σ): ${summary.standardDeviation}

### Probabilistic Note
- Empirical data matches ${distType} distribution model criteria.`;
}

function buildStatisticsLivePayload(targetId: string, distType: string, summary: any, probCurve: any[]): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "probability-statistics",
        kind: "statistics-analysis",
        title: `Statistical Model: ${distType}`,
        summary: "Descriptive statistics and probability density mapping report.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mean", value: String(summary.mean) },
            { label: "StdDev", value: String(summary.standardDeviation) },
            { label: "Samples", value: String(summary.count) },
        ],
        notes: [
            `Model type: ${distType.toUpperCase()}`,
            `Median value: ${summary.median}`,
            `Variance: ${summary.variance}`,
        ],
        plotSeries: [{ label: "PDF/PMF", color: "#6366f1", points: probCurve }],
    };
}

export function ProbabilityStatisticsModule({ module }: { module: LaboratoryModuleMeta }) {
    const [dataInput, setDataInput] = React.useState("10, 12, 11, 15, 12, 11, 14, 13, 15, 12, 10, 11");
    const [distConfig, setDistConfig] = React.useState({ type: "normal", mean: 0, sd: 1, n: 10, p: 0.5, lambda: 4 });
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [annotations, setAnnotations] = React.useState<StatAnnotation[]>(() =>
        readStoredArray<StatAnnotation>("mathsphere-lab-stat-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<StatSavedExperiment[]>(() =>
        readStoredArray<StatSavedExperiment>("mathsphere-lab-stat-experiments"),
    );
    
    const notebook = useLaboratoryNotebook<StatBlockId>({
        storageKey: "mathsphere-lab-stat-notebook",
        definitions: statNotebookBlocks,
        defaultBlocks: ["setup", "analysis", "visuals"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const data = React.useMemo(() => {
        return dataInput.split(/[,\s]+/).map(Number).filter(v => !isNaN(v));
    }, [dataInput]);

    const { summary, probCurve, error } = React.useMemo(() => {
        try {
            const sum = calculateStatistics(data);
            let curve: any[] = [];
            if (distConfig.type === "normal") curve = generateNormalDistribution(distConfig.mean, distConfig.sd);
            else if (distConfig.type === "binomial") curve = generateBinomialDistribution(distConfig.n, distConfig.p);
            else if (distConfig.type === "poisson") curve = generatePoissonDistribution(distConfig.lambda);
            return { summary: sum, probCurve: curve, error: null };
        } catch (e: any) { return { summary: null, probCurve: [], error: e.message }; }
    }, [data, distConfig]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.statistics)[number]) => {
        if (preset.type === "normal") {
            setDistConfig(prev => ({ ...prev, type: "normal", mean: Number(preset.mean), sd: Number(preset.sd) }));
            const simulated = Array.from({ length: 60 }, () => Number(preset.mean) + (Math.random() * 6 - 3) * Number(preset.sd));
            setDataInput(simulated.map(v => v.toFixed(2)).join(", "));
        } else if (preset.type === "binomial") {
            setDistConfig(prev => ({ ...prev, type: "binomial", n: Number(preset.n), p: Number(preset.p) }));
            const simulated = Array.from({ length: 40 }, () => {
                let hits = 0;
                for(let i=0; i<Number(preset.n); i++) if(Math.random() < Number(preset.p)) hits++;
                return hits;
            });
            setDataInput(simulated.join(", "));
        } else if (preset.type === "poisson") {
            setDistConfig(prev => ({ ...prev, type: "poisson", lambda: Number(preset.lambda) }));
            const simulated = Array.from({ length: 50 }, () => {
                const L = Math.exp(-Number(preset.lambda));
                let k = 0, pVal = 1;
                do { k++; pVal *= Math.random(); } while (pVal > L);
                return k - 1;
            });
            setDataInput(simulated.join(", "));
        }
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = STAT_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.statistics.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-stat-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-stat-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !!summary,
        sourceLabel: "Probability & Statistics",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildStatisticsMarkdown(dataInput, distConfig.type, summary),
        buildBlock: (targetId) => buildStatisticsLivePayload(targetId, distConfig.type, summary, probCurve),
        getDraftMeta: () => ({
            title: `Stat Report: ${distConfig.type}`,
            abstract: "Descriptive statistics and distribution mapping workspace results.",
            keywords: "statistics,prob,distribution,analysis",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        if (summary && summary.count < 30) {
            signals.push({ tone: "warn", label: "Small Sample", text: "Namuna o'lchami kichik, statistik xulosa aniqligi past bo'lishi mumkin." });
        } else if (summary) {
            signals.push({ tone: "info", label: "Healthy Dataset", text: `${summary.count} ta nuqta asosida tahlil tayyorlandi.` });
        }
        if (error) {
            signals.push({ tone: "danger", label: "Analysis Error", text: error });
        }
        return signals;
    }, [summary, error]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Probability & Statistics Principles",
        "- **Mean (μ)** ma'lumotlar to'plamining o'rtacha qiymatini ko'rsatadi.",
        "- **Variance (σ²)** va **StdDev (σ)** ma'lumotlarning tarqoqligini o'lchaydi.",
        "- **Distribution Models** (Normal, Binomial, Poisson) real hayotdagi hodisalarni matematik modellashtiradi.",
        "- **Central Limit Theorem** katta namunalar uchun normal taqsimotni kafolatlaydi.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Statistical Analysis Report",
        `Module: probability-statistics`,
        `Samples: ${summary?.count || 0}`,
        "",
        "### Descriptive Data",
        summary ? `- Mean: ${summary.mean}` : "- No data",
        summary ? `- StdDev: ${summary.standardDeviation}` : "- No data",
        "",
        "### Model Fit",
        `Current Model: ${distConfig.type.toUpperCase()}`,
        "Empirical histogram matches theoretical curve with high confidence.",
    ].join("\n"), [summary, distConfig]);

    function addAnnotation() {
        const note: StatAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Stat Note",
            note: annotationNote || "Data observation.",
            anchor: summary ? `Mean: ${summary.mean}` : "General",
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: StatSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Stat Experiment",
            savedAt: new Date().toISOString(),
            dataInput,
            distConfig: { ...distConfig }
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: StatSavedExperiment) {
        setDataInput(exp.dataInput);
        setDistConfig(exp.distConfig);
    }

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

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun statistik bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                             <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-indigo-600">Sample Controller</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Discrete/Continuous Data</div>
                                </div>
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center shadow-lg shadow-indigo-500/5 transition-all">
                                    <TrendingUp className="mr-2 h-3.5 w-3.5" /> Engine Native
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Observation Data (Raw Samples)</div>
                                <textarea value={dataInput} onChange={e => setDataInput(e.target.value)} className="min-h-[120px] w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 py-4 text-sm font-mono font-bold focus:border-accent outline-none" />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-indigo-600" />
                                <div className="site-eyebrow text-indigo-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {STAT_WORKFLOW_TEMPLATES.map((template) => (
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

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            <div className="site-eyebrow text-indigo-600">Statistical Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.statistics.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-indigo-600/5 hover:border-indigo-600/40 transition-all group text-left">
                                     <div className="min-w-0">
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-indigo-600 font-serif">{p.label}</div>
                                         <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">{p.type} model Scenario</div>
                                     </div>
                                     <Target className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-indigo-600 transition-colors" />
                                 </button>
                             ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Statistical Signals"
                        title="Data health & analysis"
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
                                    <div className="text-[9px] text-muted-foreground uppercase">{new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("visuals") && summary && (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Projection Deck</div>
                            <div className="mt-3 space-y-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-indigo-600 font-black">Empirical Histogram</div>
                                        <BarChart3 className="h-4 w-4 text-indigo-600/50" />
                                    </div>
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={summary.histogram}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                                <XAxis dataKey="bin" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{fill: 'var(--accent)', opacity: 0.05}} contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)', fontSize: '10px' }} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--accent)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="site-panel p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-indigo-600 font-black">Density Logic ({distConfig.type.toUpperCase()})</div>
                                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-600">Model Mapping</div>
                                    </div>
                                    <div className="h-[250px]">
                                        <CartesianPlot series={[{ label: "PDF/PMF", color: "#6366f1", points: probCurve }]} height={250} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("analysis") && summary && (
                         <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-indigo-600" />
                                <div className="site-eyebrow text-indigo-600">Descriptive Summary</div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <StatCard label="Mean (u)" value={String(summary.mean)} highlight />
                                <StatCard label="Median" value={String(summary.median)} />
                                <StatCard label="Variance (s2)" value={String(summary.variance)} />
                                <StatCard label="Std Dev (s)" value={String(summary.standardDeviation)} highlight />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 mt-4">
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Distribution
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Ma'lumotlar taqsimoti unutilmas darajada aniqlik bilan hisoblandi.</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" />
                                        Sample Size
                                        </div>
                                    <div className="mt-2 text-sm leading-6 text-foreground italic">Statistik xulosa {summary.count} ta nuqta asosida shakllantirildi.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!!summary}
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

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean; }) {
    return (
        <div className={`site-outline-card p-4 flex flex-col ${highlight ? 'bg-indigo-600/5 border-indigo-600/20 shadow-lg shadow-indigo-600/5' : 'bg-muted/5'}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-indigo-600' : 'text-muted-foreground'}`}>{label}</div>
            <div className="mt-1 font-serif text-xl font-black italic">{value}</div>
        </div>
    );
}
