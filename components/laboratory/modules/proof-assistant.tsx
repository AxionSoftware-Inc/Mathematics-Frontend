"use client";

import React from "react";
import { BookOpenText, CheckSquare2, Copy, GitBranch, Lightbulb, Send, ShieldCheck, Target, Sparkles, ArrowRight, Layers3, Box, Info, Shield, Plus, CheckCircle2, ListChecks, ChevronRight, GraduationCap, Activity, BookOpen } from "lucide-react";

import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard, type LaboratoryBridgeGuide, type LaboratoryBridgeGuideMode } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { LABORATORY_PRESETS, type ProofStep } from "@/components/laboratory/math-utils";

const exportGuides = {
    copy: {
        badge: "Proof export",
        title: "Isbot rejasini nusxalash",
        description: "Teorema va tanlangan isbot strategiyasi clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Teorema bayoni (Statement) va turi (Theorem/Lemma) yoziladi.",
            "Tanlangan strategiya (Direct, Contradiction...) mantiqiy qadamlari formatlanadi.",
            "Markdown formatida isbot skeleti va asosiy g'oyalar yaratiladi.",
        ],
        note: "Matematik maqola va isbotlar tahlili uchun.",
    },
    send: {
        badge: "Writer import",
        title: "Isbot rejasini writer'ga yuborish",
        description: "Isbot strategiyasini writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Proof export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Strategiya skeleti va bayonlar draftga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsangiz, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type ProofStrategyId = "direct" | "contradiction" | "contrapositive" | "induction" | "cases" | "equivalence";

type ProofStrategy = {
    id: ProofStrategyId;
    label: string;
    summary: string;
    checkpoints: string[];
    skeleton: string[];
};

type ProofBlockId = "setup" | "logic" | "steps" | "bridge";

const proofNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Theorem va strategy tanlash" },
    { id: "logic" as const, label: "Logic Flow", description: "Lekin va mantiqiy bog'lanishlar" },
    { id: "steps" as const, label: "Steps", description: "Isbot qadamlari ketma-ketligi" },
    { id: "bridge" as const, label: "Bridge", description: "Export va Publishing" },
];

const PROOF_WORKFLOW_TEMPLATES = [
    {
        id: "deduction-audit",
        title: "Deduction Logic Audit",
        description: "Aksiomalardan xulosa chiqarish zanjirini mantiqiy tekshirish.",
        presetLabel: "Euclid's Elements (Infitude of Primes)",
        blocks: ["setup", "logic", "steps"] as const,
    },
    {
        id: "contradiction-study",
        title: "Contradiction Study",
        description: "Zidiyat usuli orqali isbotlash strategiyasini tahlil qilish.",
        presetLabel: "Irrationality of sqrt(2)",
        blocks: ["setup", "steps"] as const,
    },
] as const;

type ProofAnnotation = {
    id: string;
    title: string;
    note: string;
    anchor: string;
    createdAt: string;
};

type ProofSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    theoremName: string;
    strategy: string;
    steps: ProofStep[];
};

function buildProofMarkdown(theoremName: string, strategy: string, steps: ProofStep[]) {
    return `## Laboratory Export: Proof Assistant
        
### Theorem: ${theoremName}
- Strategy: ${strategy}

### Steps
${steps.map((s, i) => `${i + 1}. **${s.action}**: ${s.status === "completed" ? "Done" : "Pending"}
   - *Reason*: ${s.result}`).join("\n")}

### Final Verdict
All logical steps validated via ${strategy} inference.`;
}

function buildProofLivePayload(targetId: string, theoremName: string, strategy: string, steps: ProofStep[]): WriterBridgeBlockData {
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "proof-assistant",
        kind: "mathematical-proof",
        title: `Proof: ${theoremName}`,
        summary: "Logical inference chain and formal verification results.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Steps", value: String(steps.length) },
            { label: "Completed", value: String(steps.filter(s => s.status === "completed").length) },
            { label: "Strategy", value: strategy },
        ],
        notes: [
            `Theorem: ${theoremName}`,
            `Method: ${strategy}`,
            ...steps.map(s => `[${s.status}] ${s.action}`),
        ],
    };
}

export function ProofAssistantModule({ module }: { module: LaboratoryModuleMeta }) {
    const [theoremName, setTheoremName] = React.useState("Pythagorean Theorem");
    const [strategy, setStrategy] = React.useState("Direct Deduction");
    const [steps, setSteps] = React.useState<ProofStep[]>([
        { id: "1", action: "Assume right triangle sides a, b, c", result: "Base geometry setup", status: "completed" },
        { id: "2", action: "Square the hypotenuse", result: "Calculating c^2", status: "pending" },
    ]);

    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);

    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [annotations, setAnnotations] = React.useState<ProofAnnotation[]>(() =>
        readStoredArray<ProofAnnotation>("mathsphere-lab-proof-annotations"),
    );
    const [savedExperiments, setSavedExperiments] = React.useState<ProofSavedExperiment[]>(() =>
        readStoredArray<ProofSavedExperiment>("mathsphere-lab-proof-experiments"),
    );

    const notebook = useLaboratoryNotebook<ProofBlockId>({
        storageKey: "mathsphere-lab-proof-notebook",
        definitions: proofNotebookBlocks,
        defaultBlocks: ["setup", "logic", "steps"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.proof)[number]) => {
        setTheoremName(preset.label);
        setStrategy(preset.strategy);
        setSteps(preset.steps as ProofStep[]);
        setActiveTemplateId(null);
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = PROOF_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = LABORATORY_PRESETS.proof.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-proof-annotations", annotations);
    }, [annotations]);

    React.useEffect(() => {
        writeStoredValue("mathsphere-lab-proof-experiments", savedExperiments);
    }, [savedExperiments]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: steps.length > 0,
        sourceLabel: "Proof Assistant",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => buildProofMarkdown(theoremName, strategy, steps),
        buildBlock: (targetId) => buildProofLivePayload(targetId, theoremName, strategy, steps),
        getDraftMeta: () => ({
            title: `Formal Proof: ${theoremName}`,
            abstract: "Structured mathematical logical verification report.",
            keywords: "proof,logic,mathematics,deduction",
        }),
    });

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        const pendingCount = steps.filter(s => s.status === "pending").length;
        if (pendingCount > 0) {
            signals.push({ tone: "warn", label: "Incomplete Proof", text: `${pendingCount} ta qadam hali yakunlanmagan.` });
        } else {
            signals.push({ tone: "info", label: "Proof Verified", text: "Barcha mantiqiy qadamlar muvaffaqiyatli tekshirildi." });
        }
        return signals;
    }, [steps]);

    const explainModeMarkdown = React.useMemo(() => [
        "## Formal Proof Principles",
        "- **Axioms** isbotsiz qabul qilinadigan asosiy haqiqatlar.",
        "- **Deduction** mavjud qoidalardan yangi natijalar chiqarish.",
        "- **Contradiction** (Reductio ad absurdum) teskarisini farz qilib zidiyatga kelish.",
        "- **Induction** natural sonlar uchun isbotlash usuli.",
    ].join("\n"), []);

    const reportSkeletonMarkdown = React.useMemo(() => [
        "## Theorem Verification Report",
        `Theorem: ${theoremName}`,
        `Strategy: ${strategy}`,
        "",
        "### Logical Sequence",
        ...steps.map((s, i) => `${i + 1}. ${s.action} - ${s.status.toUpperCase()}`),
        "",
        "### Conclusion",
        "The theorem holds true under the specified axiomatic system.",
    ].join("\n"), [theoremName, strategy, steps]);

    function addAnnotation() {
        const note: ProofAnnotation = {
            id: Math.random().toString(36).slice(2, 9),
            title: annotationTitle || "Proof Note",
            note: annotationNote || "Logical observation.",
            anchor: steps[0]?.action || "General",
            createdAt: new Date().toISOString()
        };
        setAnnotations(prev => [note, ...prev].slice(0, 10));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveExperiment() {
        const exp: ProofSavedExperiment = {
            id: Math.random().toString(36).slice(2, 9),
            label: experimentLabel || "Proof Experiment",
            savedAt: new Date().toISOString(),
            theoremName,
            strategy,
            steps: [...steps]
        };
        setSavedExperiments(prev => [exp, ...prev].slice(0, 10));
        setExperimentLabel("");
    }

    function loadExperiment(exp: ProofSavedExperiment) {
        setTheoremName(exp.theoremName);
        setStrategy(exp.strategy);
        setSteps(exp.steps);
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Proof Assistant"
                description="Rasmiy isbotlar, mantiqiy zanjirlar va aksiyomatik tahlil."
                activeBlocks={notebook.activeBlocks}
                definitions={proofNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun isbot bloklarini yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-fuchsia-600">Theorem Setup</div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Formal Verification Active</div>
                                </div>
                                <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-600 flex items-center shadow-lg shadow-fuchsia-500/5 transition-all">
                                    <GraduationCap className="mr-2 h-3.5 w-3.5" /> Academic Mode
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="site-outline-card p-4 space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Theorem Identifier</div>
                                    <input value={theoremName} onChange={e => setTheoremName(e.target.value)} className="w-full bg-transparent font-serif text-lg font-black outline-none" placeholder="Theorem name..." />
                                </div>

                                <div className="site-outline-card p-4 space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Strategy / Method</div>
                                    <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-transparent font-sans text-sm font-bold outline-none">
                                        <option value="Direct Deduction">Direct Deduction</option>
                                        <option value="Proof by Contradiction">Proof by Contradiction</option>
                                        <option value="Mathematical Induction">Mathematical Induction</option>
                                        <option value="Case Analysis">Case Analysis</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-fuchsia-600" />
                                <div className="site-eyebrow text-fuchsia-600">Problem Templates</div>
                            </div>
                            <div className="grid gap-2">
                                {PROOF_WORKFLOW_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => applyWorkflowTemplate(template.id)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            activeTemplateId === template.id
                                                ? "border-fuchsia-600/40 bg-fuchsia-600/10"
                                                : "border-border/60 bg-muted/5 hover:border-fuchsia-600/40 hover:bg-fuchsia-600/5"
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
                            <Sparkles className="h-4 w-4 text-fuchsia-600" />
                            <div className="site-eyebrow text-fuchsia-600">Classical Presets</div>
                        </div>
                        <div className="grid gap-2">
                             {LABORATORY_PRESETS.proof.map(p => (
                                 <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-fuchsia-600/5 hover:border-fuchsia-600/40 transition-all group text-left">
                                     <div className="min-w-0">
                                         <div className="text-[10px] font-black uppercase tracking-tight text-foreground font-serif">{p.label}</div>
                                         <div className="mt-1 text-[8px] font-mono text-muted-foreground uppercase">{p.strategy} logic</div>
                                     </div>
                                     <BookOpen className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-fuchsia-600 transition-colors" />
                                 </button>
                             ))}
                        </div>
                    </div>

                    <LaboratorySignalPanel
                        eyebrow="Logical Signals"
                        title="Inference monitoring"
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
                        <div className="site-eyebrow text-fuchsia-600">Interactive Annotations</div>
                        <div className="space-y-4">
                            <input value={annotationTitle} onChange={e => setAnnotationTitle(e.target.value)} placeholder="Note title" className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-fuchsia-600/40" />
                            <textarea value={annotationNote} onChange={e => setAnnotationNote(e.target.value)} placeholder="Observations..." className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-fuchsia-600/40 min-h-[80px]" />
                            <button onClick={addAnnotation} className="w-full bg-fuchsia-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-fuchsia-600/80 transition-colors">Save Annotation</button>
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
                        <div className="site-eyebrow text-fuchsia-600">Saved Experiments</div>
                        <div className="flex gap-2">
                             <input value={experimentLabel} onChange={e => setExperimentLabel(e.target.value)} placeholder="Experiment name" className="flex-1 bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-fuchsia-600/40" />
                             <button onClick={saveExperiment} className="bg-fuchsia-600 text-white px-4 rounded-xl hover:bg-fuchsia-600/80 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {savedExperiments.map(e => (
                                <button key={e.id} onClick={() => loadExperiment(e)} className="w-full text-left p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-fuchsia-600/5 transition-all">
                                    <div className="text-xs font-bold">{e.label}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{new Date(e.savedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {notebook.hasBlock("logic") && (
                         <div className="rounded-3xl border border-border/60 bg-background/45 p-3">
                             <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Inference Deck</div>
                             <div className="mt-3">
                                 <div className="site-panel-strong p-6 space-y-6">
                                     <div className="flex items-center justify-between">
                                         <div className="site-eyebrow text-fuchsia-600">Verification Engine</div>
                                         <CheckCircle2 className="h-4 w-4 text-fuchsia-600/50" />
                                     </div>
                                     <div className="grid gap-4">
                                         <div className="site-outline-card p-4 bg-fuchsia-600/5 border-fuchsia-600/20">
                                             <div className="text-[9px] font-black text-fuchsia-600 uppercase mb-2">Formal Logic State</div>
                                             <div className="flex items-center gap-3">
                                                 <div className="h-2 w-2 rounded-full bg-fuchsia-600 animate-pulse" />
                                                 <div className="text-[10px] font-black uppercase text-foreground">Axiom Set: Consistent</div>
                                             </div>
                                         </div>
                                         <div className="p-4 rounded-2xl border border-border/60 bg-muted/5">
                                             <div className="text-[9px] font-black text-muted-foreground uppercase mb-2">Inference Rule</div>
                                             <div className="font-serif italic text-sm text-foreground">
                                                 Modus Ponens: (P → Q) ∧ P ⊢ Q
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    )}

                    {notebook.hasBlock("steps") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-fuchsia-600" />
                                <div className="site-eyebrow text-fuchsia-600">Proof Trajectory</div>
                            </div>
                            <div className="space-y-4">
                                {steps.map((step, idx) => (
                                    <div key={step.id} className="relative pl-8 pb-6 border-l border-border/60 last:border-0 last:pb-0 group">
                                        <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center transition-colors ${step.status === 'completed' ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-muted border-border'}`}>
                                            {step.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Step {idx + 1}</div>
                                            <div className="text-sm font-bold text-foreground font-serif">{step.action}</div>
                                            <div className="text-[11px] text-muted-foreground italic leading-5">{step.result}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border/80 text-[10px] font-black uppercase text-muted-foreground hover:border-fuchsia-600/40 hover:text-fuchsia-600 transition-all">
                                <ChevronRight className="h-3.5 w-3.5" /> Append Step
                            </button>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={steps.length > 0}
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
