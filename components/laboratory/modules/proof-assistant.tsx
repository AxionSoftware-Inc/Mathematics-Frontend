"use client";

import React from "react";
import { BookOpenText, CheckSquare2, Copy, GitBranch, Lightbulb, Send, ShieldCheck, Target, Sparkles, ArrowRight } from "lucide-react";

import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard, type LaboratoryBridgeGuide, type LaboratoryBridgeGuideMode } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, queueWriterImport, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { LABORATORY_PRESETS } from "@/components/laboratory/math-utils";

type ProofStrategyId = "direct" | "contradiction" | "contrapositive" | "induction" | "cases" | "equivalence";

type ProofStrategy = {
    id: ProofStrategyId;
    label: string;
    summary: string;
    checkpoints: string[];
    skeleton: string[];
};

const proofStrategies: ProofStrategy[] = [
    { id: "direct", label: "Direct", summary: "Shartlardan to'g'ridan-to'g'ri xulosa tomonga harakat qiling.", checkpoints: ["Definitionsni oching", "Oraliq transformatsiyani toping", "Goal bilan bog'lang"], skeleton: ["Assumptionsdan boshlang va ishlatiladigan ta'riflarni aniq yozing.", "Asosiy algebraik yoki mantiqiy transformatsiyani bajaring.", "Hosil bo'lgan natijani maqsad bilan bevosita ulang."] },
    { id: "contradiction", label: "Contradiction", summary: "Goalning inkorini faraz qilib, imkonsizlikka olib boring.", checkpoints: ["Negationni to'g'ri yozing", "Qaysi invariant buzilishini toping", "Qarama-qarshilikni ajrating"], skeleton: ["Goalning inkorini qo'shimcha faraz sifatida qabul qiling.", "Bu farazni assumptions bilan birga tahlil qiling.", "Imkonsiz holatga kelib, inkorni rad eting."] },
    { id: "contrapositive", label: "Contrapositive", summary: "A => B o'rniga not B => not A ni isbotlang.", checkpoints: ["Asl implikatsiyani yozing", "Kontrpozitsiyani ajrating", "Teskari yo'ldan xulosa chiqaring"], skeleton: ["Not B holatini qabul qiling.", "Shundan not A kelib chiqishini ko'rsating.", "Demak, asl implikatsiya ham rostligini xulosa qiling."] },
    { id: "induction", label: "Induction", summary: "Boshlang'ich holat va induktiv qadam orqali ketma-ket bayonotni yoping.", checkpoints: ["Base case", "Inductive hypothesis", "n -> n+1 o'tishi"], skeleton: ["Base caseni tekshiring.", "n uchun bayonot rost deb faraz qiling.", "Farazdan foydalanib n+1 holatni isbotlang."] },
    { id: "cases", label: "Cases", summary: "Masalani bir-birini qoplaydigan holatlarga bo'lib yoping.", checkpoints: ["Holatlarni to'liq ajrating", "Har bir case uchun lokal argument yozing", "Holatlar yopilganini ayting"], skeleton: ["Muammoni alohida holatlarga ajrating.", "Har bir holatda goalni isbotlang.", "Barcha holatlar qoplangani uchun umumiy natijani xulosa qiling."] },
    { id: "equivalence", label: "Equivalence", summary: "Ikki tomonni alohida yo'nalishlarda isbotlab ekvivalentlikni ko'rsating.", checkpoints: ["Forward direction", "Backward direction", "Common bridge idea"], skeleton: ["A => B yo'nalishni isbotlang.", "B => A yo'nalishni isbotlang.", "Ikki yo'nalish yopilgani uchun ekvivalentlikni xulosa qiling."] },
];

function getStrategy(strategyId: ProofStrategyId) {
    return proofStrategies.find((strategy) => strategy.id === strategyId) ?? proofStrategies[0];
}

function SectionHeader({ icon: Icon, eyebrow, title, description }: { icon: React.ElementType; eyebrow: string; title: string; description: string }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <div className="site-eyebrow text-accent">{eyebrow}</div>
                <h2 className="mt-1 font-serif text-2xl font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

export function ProofAssistantModule({ module }: { module: LaboratoryModuleMeta }) {
    const [theoremType, setTheoremType] = React.useState("Theorem");
    const [title, setTitle] = React.useState("Theorem Title");
    const [statement, setStatement] = React.useState("Statement goes here");
    const [strategyId, setStrategyId] = React.useState<ProofStrategyId>("direct");
    const [keyIdea, setKeyIdea] = React.useState("");

    const notebook = useLaboratoryNotebook<"setup" | "strategy" | "bridge">({
        storageKey: "mathsphere-lab-proof-notebook",
        definitions: [
            { id: "setup", label: "Setup", description: "Theorem info" },
            { id: "strategy", label: "Strategy", description: "Proof route" },
            { id: "bridge", label: "Bridge", description: "Export results" },
        ],
        defaultBlocks: ["setup", "strategy"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const strategy = getStrategy(strategyId);

    const applyPreset = (p: any) => {
        setTitle(p.title);
        setStatement(p.statement);
        setStrategyId(p.strategy as ProofStrategyId);
    };

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Proof Assistant"
                description="Matematik isbotlarni rejalashtirish va strategiyalarni tanlash."
                activeBlocks={notebook.activeBlocks}
                definitions={[]}
                onAddBlock={() => {}}
                onRemoveBlock={() => {}}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <SectionHeader icon={BookOpenText} eyebrow="Theorem Setup" title="Theorem Foundation" description="Teorema nomini va statementini kiriting." />
                            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                                <select value={theoremType} onChange={e => setTheoremType(e.target.value)} className="h-11 rounded-2xl border border-border bg-background px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <option>Theorem</option><option>Lemma</option><option>Proposition</option>
                                </select>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold focus:border-accent outline-none" placeholder="Theorem Name" />
                            </div>
                            <textarea value={statement} onChange={e => setStatement(e.target.value)} className="min-h-[100px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent outline-none" />
                        </div>
                    )}

                    {notebook.hasBlock("strategy") && (
                        <div className="site-panel-strong p-6 space-y-6">
                            <SectionHeader icon={GitBranch} eyebrow="Strategy Engine" title="Proof Route" description="Isbot usulini tanlang." />
                            <div className="flex flex-wrap gap-2">
                                {proofStrategies.map(s => (
                                    <button key={s.id} onClick={() => setStrategyId(s.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${strategyId === s.id ? 'bg-accent text-white' : 'bg-muted/10 text-muted-foreground'}`}>{s.label}</button>
                                ))}
                            </div>
                            <div className="site-outline-card p-6 bg-accent/5 border-accent/20">
                                <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">{strategy.label} Rationale</div>
                                <div className="text-sm font-serif leading-relaxed text-foreground">{strategy.summary}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <div className="site-eyebrow text-accent">Classical Theorems</div>
                        </div>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.proof.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/5 hover:bg-accent/5 hover:border-accent/40 transition-all group">
                                    <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all font-black" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
