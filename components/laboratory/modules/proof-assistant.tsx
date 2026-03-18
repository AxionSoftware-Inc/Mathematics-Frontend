"use client";

import React from "react";
import { BookOpenText, CheckSquare2, Copy, GitBranch, Lightbulb, Send, ShieldCheck, Target } from "lucide-react";

import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import {
    LaboratoryBridgeCard,
    type LaboratoryBridgeGuide,
    type LaboratoryBridgeGuideMode,
} from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { createBroadcastChannel, queueWriterImport, type LabPublishBroadcast, type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type ProofStrategyId = "direct" | "contradiction" | "contrapositive" | "induction" | "cases" | "equivalence";

type ProofStrategy = {
    id: ProofStrategyId;
    label: string;
    summary: string;
    checkpoints: string[];
    skeleton: string[];
};

const proofStrategies: ProofStrategy[] = [
    {
        id: "direct",
        label: "Direct",
        summary: "Shartlardan to'g'ridan-to'g'ri xulosa tomonga harakat qiling.",
        checkpoints: ["Definitionsni oching", "Oraliq transformatsiyani toping", "Goal bilan bog'lang"],
        skeleton: [
            "Assumptionsdan boshlang va ishlatiladigan ta'riflarni aniq yozing.",
            "Asosiy algebraik yoki mantiqiy transformatsiyani bajaring.",
            "Hosil bo'lgan natijani maqsad bilan bevosita ulang.",
        ],
    },
    {
        id: "contradiction",
        label: "Contradiction",
        summary: "Goalning inkorini faraz qilib, imkonsizlikka olib boring.",
        checkpoints: ["Negationni to'g'ri yozing", "Qaysi invariant buzilishini toping", "Qarama-qarshilikni ajrating"],
        skeleton: [
            "Goalning inkorini qo'shimcha faraz sifatida qabul qiling.",
            "Bu farazni assumptions bilan birga tahlil qiling.",
            "Imkonsiz holatga kelib, inkorni rad eting.",
        ],
    },
    {
        id: "contrapositive",
        label: "Contrapositive",
        summary: "A => B o'rniga not B => not A ni isbotlang.",
        checkpoints: ["Asl implikatsiyani yozing", "Kontrpozitsiyani ajrating", "Teskari yo'ldan xulosa chiqaring"],
        skeleton: [
            "Not B holatini qabul qiling.",
            "Shundan not A kelib chiqishini ko'rsating.",
            "Demak, asl implikatsiya ham rostligini xulosa qiling.",
        ],
    },
    {
        id: "induction",
        label: "Induction",
        summary: "Boshlang'ich holat va induktiv qadam orqali ketma-ket bayonotni yoping.",
        checkpoints: ["Base case", "Inductive hypothesis", "n -> n+1 o'tishi"],
        skeleton: [
            "Base caseni tekshiring.",
            "n uchun bayonot rost deb faraz qiling.",
            "Farazdan foydalanib n+1 holatni isbotlang.",
        ],
    },
    {
        id: "cases",
        label: "Cases",
        summary: "Masalani bir-birini qoplaydigan holatlarga bo'lib yoping.",
        checkpoints: ["Holatlarni to'liq ajrating", "Har bir case uchun lokal argument yozing", "Holatlar yopilganini ayting"],
        skeleton: [
            "Muammoni alohida holatlarga ajrating.",
            "Har bir holatda goalni isbotlang.",
            "Barcha holatlar qoplangani uchun umumiy natijani xulosa qiling.",
        ],
    },
    {
        id: "equivalence",
        label: "Equivalence",
        summary: "Ikki tomonni alohida yo'nalishlarda isbotlab ekvivalentlikni ko'rsating.",
        checkpoints: ["Forward direction", "Backward direction", "Common bridge idea"],
        skeleton: [
            "A => B yo'nalishni isbotlang.",
            "B => A yo'nalishni isbotlang.",
            "Ikki yo'nalish yopilgani uchun ekvivalentlikni xulosa qiling.",
        ],
    },
];

const exportGuides: Record<LaboratoryBridgeGuideMode, LaboratoryBridgeGuide> = {
    copy: {
        badge: "Markdown export",
        title: "Proof plan nusxa olish",
        description: "Hosil bo'lgan theorem setup va proof skeleton clipboard'ga ko'chadi.",
        confirmLabel: "Markdown olish",
        steps: [
            "Theorem, assumptions, goal va proof outline bitta markdown bo'limga yig'iladi.",
            "Clipboard'dagi matnni mavjud maqolang ichiga kerakli joyda paste qilasan.",
            "Writer ichida notation yoki uslubni lokal tahrir qilishing mumkin.",
        ],
        note: "Bu variant proof skeletonni bir nechta maqola orasida qayta ishlatish uchun qulay.",
    },
    send: {
        badge: "Writer import",
        title: "Proof plan'ni writer'ga yuborish",
        description: "Hozirgi proof draft vaqtincha saqlanib, yangi writer draft ichiga import qilinadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Proof skeleton local storage orqali vaqtincha saqlanadi.",
            "Yangi writer draft ochilib, proof bo'limi avtomatik import qilinadi.",
            "Shundan keyin maqola ichida theorem section sifatida davom ettirasan.",
        ],
        note: "Mavjud ochiq maqolaning aniq blokiga yuborish kerak bo'lsa, pastdagi Live Writer Bridge panelidan foydalan.",
    },
};

type ProofBlockId = "setup" | "strategy" | "bridge" | "draft";

const proofNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Theorem, assumptions va goal" },
    { id: "strategy" as const, label: "Strategy", description: "Strategy engine va argument map" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
    { id: "draft" as const, label: "Draft", description: "Generated markdown" },
];

function parseLines(raw: string) {
    return raw
        .split("\n")
        .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
        .filter(Boolean);
}

function getStrategy(strategyId: ProofStrategyId) {
    return proofStrategies.find((strategy) => strategy.id === strategyId) ?? proofStrategies[0];
}

function clampPercent(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function buildProofMarkdown(params: {
    theoremType: string;
    title: string;
    statement: string;
    assumptions: string[];
    goal: string;
    strategy: ProofStrategy;
    keyIdea: string;
    criticalSteps: string[];
    edgeCases: string[];
}) {
    const { theoremType, title, statement, assumptions, goal, strategy, keyIdea, criticalSteps, edgeCases } = params;

    const assumptionsBlock = assumptions.length ? assumptions.map((item) => `- ${item}`).join("\n") : "- None";
    const stepsBlock = criticalSteps.length
        ? criticalSteps.map((item, index) => `${index + 1}. ${item}`).join("\n")
        : strategy.skeleton.map((item, index) => `${index + 1}. ${item}`).join("\n");
    const edgeCasesBlock = edgeCases.length ? edgeCases.map((item) => `- ${item}`).join("\n") : "- No explicit edge cases";

    return `## ${theoremType}: ${title}

### Statement
${statement}

### Assumptions
${assumptionsBlock}

### Goal
${goal}

### Proof Strategy
- Strategy: ${strategy.label}
- Rationale: ${strategy.summary}
- Key idea: ${keyIdea || "To'ldirilmagan"}

### Proof Outline
${stepsBlock}

### Edge Cases
${edgeCasesBlock}
`;
}

function buildLiveProofPayload(params: {
    targetId: string;
    theoremType: string;
    title: string;
    statement: string;
    assumptions: string[];
    goal: string;
    strategy: ProofStrategy;
    keyIdea: string;
    criticalSteps: string[];
    edgeCases: string[];
    completion: number;
}) {
    const { targetId, theoremType, title, statement, assumptions, goal, strategy, keyIdea, criticalSteps, edgeCases, completion } = params;

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "proof-assistant",
        kind: "proof-outline",
        title: `${theoremType}: ${title}`,
        summary: statement,
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Strategy", value: strategy.label },
            { label: "Assumptions", value: String(assumptions.length) },
            { label: "Steps", value: String(criticalSteps.length || strategy.skeleton.length) },
            { label: "Readiness", value: `${completion}%` },
        ],
        notes: [
            `Goal: ${goal}`,
            `Key idea: ${keyIdea || "To'ldirilmagan"}`,
            ...assumptions.map((item, index) => `Assumption ${index + 1}: ${item}`),
            ...(criticalSteps.length ? criticalSteps : strategy.skeleton).map((item, index) => `Step ${index + 1}: ${item}`),
            ...edgeCases.map((item, index) => `Edge case ${index + 1}: ${item}`),
        ],
    } satisfies WriterBridgeBlockData;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 font-serif text-2xl font-black">{value}</div>
        </div>
    );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }: { icon: React.ElementType; eyebrow: string; title: string; description: string }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <div className="site-eyebrow">{eyebrow}</div>
                <h2 className="mt-1 font-serif text-2xl font-black">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="rounded-full border border-border/70 bg-background/75 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <Icon className="mr-2 inline h-3.5 w-3.5" />
                Proof Flow
            </div>
        </div>
    );
}

export function ProofAssistantModule({ module }: { module: LaboratoryModuleMeta }) {
    const [theoremType, setTheoremType] = React.useState("Theorem");
    const [title, setTitle] = React.useState(String(module.config?.defaultTitle || "Teorema sarlavhasi"));
    const [statement, setStatement] = React.useState(String(module.config?.defaultStatement || "Agar shartlar bajarilsa, natija kelib chiqadi."));
    const [assumptionsInput, setAssumptionsInput] = React.useState(String(module.config?.defaultAssumptions || ""));
    const [goal, setGoal] = React.useState(String(module.config?.defaultGoal || "Natijani isbotlash"));
    const [strategyId, setStrategyId] = React.useState<ProofStrategyId>(
        String(module.config?.defaultStrategy || "direct") as ProofStrategyId,
    );
    const [keyIdea, setKeyIdea] = React.useState("");
    const [criticalStepsInput, setCriticalStepsInput] = React.useState("");
    const [edgeCasesInput, setEdgeCasesInput] = React.useState("");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<LaboratoryBridgeGuideMode | null>(null);
    const notebook = useLaboratoryNotebook<ProofBlockId>({
        storageKey: "mathsphere-lab-proof-notebook",
        definitions: proofNotebookBlocks,
        defaultBlocks: ["setup", "strategy", "draft"],
    });
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const assumptions = React.useMemo(() => parseLines(assumptionsInput), [assumptionsInput]);
    const criticalSteps = React.useMemo(() => parseLines(criticalStepsInput), [criticalStepsInput]);
    const edgeCases = React.useMemo(() => parseLines(edgeCasesInput), [edgeCasesInput]);
    const strategy = getStrategy(strategyId);

    const readiness = clampPercent(
        ([title, statement, goal, keyIdea].filter((item) => item.trim().length > 0).length / 4) * 45 +
            Math.min(assumptions.length, 4) * 10 +
            Math.min(criticalSteps.length || strategy.skeleton.length, 4) * 5,
    );

    const ready = Boolean(title.trim() && statement.trim() && goal.trim() && assumptions.length);

    const markdownExport = React.useMemo(
        () =>
            buildProofMarkdown({
                theoremType,
                title,
                statement,
                assumptions,
                goal,
                strategy,
                keyIdea,
                criticalSteps,
                edgeCases,
            }),
        [assumptions, criticalSteps, edgeCases, goal, keyIdea, statement, strategy, theoremType, title],
    );

    function applyStrategyPreset(nextStrategyId: ProofStrategyId) {
        const nextStrategy = getStrategy(nextStrategyId);
        setStrategyId(nextStrategyId);
        setCriticalStepsInput(nextStrategy.skeleton.map((item, index) => `${index + 1}. ${item}`).join("\n"));
    }

    async function copyMarkdownExport() {
        await navigator.clipboard.writeText(markdownExport);
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        queueWriterImport({
            version: 1,
            markdown: markdownExport,
            block: buildLiveProofPayload({
                targetId: `import-proof-${Date.now()}`,
                theoremType,
                title,
                statement,
                assumptions,
                goal,
                strategy,
                keyIdea,
                criticalSteps,
                edgeCases,
                completion: readiness,
            }),
            title: `${theoremType}: ${title}`,
            abstract: "Proof Assistant'dan eksport qilingan theorem statement va isbot skeleti.",
            keywords: "proof, theorem, lemma, strategy",
        });
        setExportState("sent");
        setGuideMode(null);
        window.location.assign("/write/new?source=laboratory");
    }

    function pushLiveResult() {
        const selectedTarget = liveTargets.find((target) => target.id === selectedLiveTargetId);
        if (!selectedTarget || !ready) {
            return;
        }

        const channel = createBroadcastChannel();
        if (!channel) {
            return;
        }

        const message: LabPublishBroadcast = {
            type: "lab-publish",
            writerId: selectedTarget.writerId,
            targetId: selectedTarget.id,
            payload: buildLiveProofPayload({
                targetId: selectedTarget.id,
                theoremType,
                title,
                statement,
                assumptions,
                goal,
                strategy,
                keyIdea,
                criticalSteps,
                edgeCases,
                completion: readiness,
            }),
        };

        channel.postMessage(message);
        channel.close();
    }

    const strategySteps = criticalSteps.length ? criticalSteps : strategy.skeleton;

    return (
        <div className="space-y-3" data-module={module.slug}>
            <LaboratoryNotebookToolbar
                title="Proof Notebook"
                description="Setup, strategy, writer bridge va draft bloklarini kerak bo'lsa yoqib o'chiring."
                activeBlocks={notebook.activeBlocks}
                definitions={proofNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length ? (
                <LaboratoryNotebookEmptyState message="Proof Assistant endi ham block-based workbench bo'lib ishlaydi." />
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                {notebook.hasBlock("setup") ? (
                <div className="site-panel p-4 lg:p-5">
                    <SectionHeader
                        icon={BookOpenText}
                        eyebrow="Proof Design"
                        title="Theorem Setup"
                        description="Teorema yoki lemma uchun statement, assumptions va isbot maqsadini bitta modulli workspace ichida yig'ing."
                    />

                    <div className="mt-4 grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)]">
                        <select
                            value={theoremType}
                            onChange={(event) => setTheoremType(event.target.value)}
                            className="h-11 rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                        >
                            <option>Theorem</option>
                            <option>Lemma</option>
                            <option>Proposition</option>
                            <option>Corollary</option>
                        </select>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-border bg-transparent px-4 text-sm outline-none"
                            placeholder="Masalan: Cauchy-Schwarz inequality"
                        />
                    </div>

                    <div className="mt-3 grid gap-3">
                        <textarea
                            value={statement}
                            onChange={(event) => setStatement(event.target.value)}
                            className="min-h-[104px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                            placeholder="To'liq theorem statement"
                        />
                        <div className="grid gap-3 lg:grid-cols-2">
                            <textarea
                                value={assumptionsInput}
                                onChange={(event) => setAssumptionsInput(event.target.value)}
                                className="min-h-[148px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                                placeholder={"1. Shartlar\n2. Belgilashlar\n3. Yordamchi faraz"}
                            />
                            <div className="grid gap-3">
                                <textarea
                                    value={goal}
                                    onChange={(event) => setGoal(event.target.value)}
                                    className="min-h-[72px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                                    placeholder="Natijani qisqa va aniq yozing"
                                />
                                <textarea
                                    value={keyIdea}
                                    onChange={(event) => setKeyIdea(event.target.value)}
                                    className="min-h-[72px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                                    placeholder="Asosiy g'oya: invariant, estimate, substitution, contradiction, ..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
                ) : null}

                {notebook.hasBlock("bridge") ? (
                    <LaboratoryBridgeCard
                        ready={ready}
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
                ) : null}
            </div>

            {notebook.hasBlock("strategy") ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="site-panel-strong p-4 lg:p-5">
                    <SectionHeader
                        icon={GitBranch}
                        eyebrow="Strategy Engine"
                        title="Proof Route"
                        description="Isbot usulini tanlang va kerak bo'lsa skeleton qadamlarini avtomatik boshlang'ich sifatida oling."
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                        {proofStrategies.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => applyStrategyPreset(item.id)}
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                                    strategyId === item.id
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-border bg-background/65 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Current strategy</div>
                        <h3 className="mt-2 font-serif text-2xl font-black">{strategy.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{strategy.summary}</p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {strategy.checkpoints.map((checkpoint) => (
                                <div key={checkpoint} className="rounded-2xl border border-border/70 bg-background/65 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                    {checkpoint}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MiniMetric label="Readiness" value={`${readiness}%`} />
                        <MiniMetric label="Assumptions" value={String(assumptions.length)} />
                        <MiniMetric label="Proof steps" value={String(strategySteps.length)} />
                        <MiniMetric label="Edge cases" value={String(edgeCases.length)} />
                    </div>
                </div>

                <div className="site-panel p-4 lg:p-5">
                    <SectionHeader
                        icon={Target}
                        eyebrow="Proof Skeleton"
                        title="Argument Map"
                        description="Qadamlarni o'zingiz kiriting yoki strategiya skeletonidan boshlang. Bu qism writer'ga tayyor outline beradi."
                    />

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <textarea
                            value={criticalStepsInput}
                            onChange={(event) => setCriticalStepsInput(event.target.value)}
                            className="min-h-[196px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                            placeholder={"1. Birinchi asosiy qadam\n2. Ikkinchi qadam\n3. Xulosa"}
                        />
                        <textarea
                            value={edgeCasesInput}
                            onChange={(event) => setEdgeCasesInput(event.target.value)}
                            className="min-h-[196px] w-full rounded-[1.5rem] border border-border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                            placeholder={"1. Trivial holat\n2. Boundary holat\n3. Equality case"}
                        />
                    </div>

                    <div className="mt-4 grid gap-3">
                        <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
                            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                <CheckSquare2 className="h-3.5 w-3.5" />
                                Outline preview
                            </div>
                            <div className="mt-3 space-y-2">
                                {strategySteps.map((step, index) => (
                                    <div key={`${index + 1}-${step}`} className="flex gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-sm">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-black">
                                            {index + 1}
                                        </div>
                                        <div className="leading-6 text-muted-foreground">{step}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-3">
                            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
                                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Assumptions
                                </div>
                                <div className="mt-3 space-y-2">
                                    {assumptions.length ? (
                                        assumptions.map((item) => (
                                            <div key={item} className="rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm leading-6 text-muted-foreground">
                                                {item}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-3 py-3 text-sm text-muted-foreground">
                                            Hali assumptions kiritilmagan.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
                                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <Target className="h-3.5 w-3.5" />
                                    Goal
                                </div>
                                <div className="mt-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                    {goal.trim() || "Goal yozilmagan."}
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
                                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    Key idea
                                </div>
                                <div className="mt-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                    {keyIdea.trim() || "Asosiy g'oya hali yozilmagan."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ) : null}

            {notebook.hasBlock("draft") ? (
            <div className="site-panel p-4 lg:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="site-eyebrow">Writer-ready Draft</div>
                        <h2 className="mt-1 font-serif text-2xl font-black">Generated Markdown</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Shu blok nusxa olish, yangi draftga yuborish yoki live target&apos;ga jo&apos;natish uchun asos bo&apos;ladi.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={copyMarkdownExport}
                            disabled={!ready}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-bold transition hover:border-foreground disabled:opacity-50"
                        >
                            <Copy className="h-4 w-4" />
                            Copy
                        </button>
                        <button
                            type="button"
                            onClick={sendToWriter}
                            disabled={!ready}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </button>
                    </div>
                </div>

                <pre className="mt-4 overflow-x-auto rounded-[1.5rem] border border-border bg-background/60 p-4 text-sm leading-7 text-muted-foreground">
                    <code>{markdownExport}</code>
                </pre>
            </div>
            ) : null}
        </div>
    );
}
