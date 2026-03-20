"use client";

import React from "react";
import { Activity, ArrowRight, Beaker, Sparkles, Zap } from "lucide-react";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { ScientificPlot } from "@/components/laboratory/scientific-plot";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { solveDifferentialEquation, solveODESystem, type DifferentialPoint, type ODESystemPoint, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import {
    createLaboratoryWriterDraftHref,
    findLiveWriterTargetBySelection,
    publishToLiveWriterTarget,
    queueWriterImport,
    type WriterBridgeBlockData,
} from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type DifferentialBlockId = "setup" | "table" | "plot" | "bridge";

const differentialNotebookBlocks = [
    { id: "setup" as const, label: "Sozlama", description: "Boshlang'ich qiymatlar va tayyor misollar" },
    { id: "plot" as const, label: "Grafik", description: "Euler, Heun va fazoviy trayektoriya" },
    { id: "table" as const, label: "Jadval", description: "Hisoblangan nuqtalar ko'rinishi" },
    { id: "bridge" as const, label: "Eksport", description: "Writer bilan ulanish" },
];

const exportGuides = {
    copy: {
        badge: "Differensial eksport",
        title: "Natijani nusxa olish",
        description: "Hisoblangan differential natijani markdown ko'rinishida clipboard'ga ko'chiradi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Model, boshlang'ich qiymatlar va parametrlar bitta hisobotga yig'iladi.",
            "Asosiy grafik xulosasi va bir necha nuqta preview sifatida qo'shiladi.",
            "Hosil bo'lgan matnni writer yoki maqola ichiga qo'lda joylashtirasiz.",
        ],
        note: "Agar resultni aynan kerakli bo'limga o'zingiz joylamoqchi bo'lsangiz, shu usul qulay.",
    },
    send: {
        badge: "Writer import",
        title: "Natijani writer'ga yuborish",
        description: "Differensial natijani yangi writer draft sifatida ochadi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Laboratoriya natijasi local storage orqali vaqtincha saqlanadi.",
            "Yangi writer draft ochiladi.",
            "Natija markdown va live block bilan draft boshiga import qilinadi.",
        ],
        note: "Mavjud ochiq writer blokiga jonli yuborish uchun pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

const differentialPresetDescriptions: Record<string, string> = {
    "Logistic Growth": "Bir o'zgaruvchili o'sish modeli. Euler va Heun farqini ko'rish uchun qulay.",
    "Van der Pol Oscillator": "2D tebranish tizimi. Fazoviy portret yopiq trayektoriya beradi.",
    "Predator-Prey (Lotka-Volterra)": "Yirtqich-o'lja populyatsiya modeli. X va Y davriy aylanish hosil qiladi.",
    "Lorenz Attractor (3D Chaos)": "3D xaotik tizim. Grafik faqat fazoviy trayektoriyani ko'rsatadi.",
    "Rossler Attractor (Chaos)": "Silliqroq xaotik attraktor. Uzoq iteratsiyada spiral qatlamlar hosil bo'ladi.",
    "Brusselator (Chemical Oscillator)": "Kimyoviy osillyator modeli. Parametrlar avto-tebranish ko'rsatadi.",
    "Duffing Oscillator (Chaos)": "Majburiy nolinier tebranish. Tenglamada vaqt `t` ham ishlatiladi.",
    "Thomas Cyclical Attractor": "3D sinusli tizim. Boshlang'ich nuqtaga sezgir xaotik trayektoriya.",
};

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }

    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildDifferentialMarkdown(params: {
    solverMode: "single" | "system";
    derivative: string;
    sysExpr1: string;
    sysExpr2: string;
    sysExpr3: string;
    x0: string;
    y0: string;
    z0: string;
    step: string;
    steps: string;
    differentialPoints: DifferentialPoint[];
    systemPoints: ODESystemPoint[];
}) {
    const { solverMode, derivative, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0, step, steps, differentialPoints, systemPoints } = params;

    if (solverMode === "single") {
        const preview = differentialPoints
            .slice(0, 6)
            .map((point) => `- x=${formatMetric(point.x, 4)}, Euler=${formatMetric(point.euler, 6)}, Heun=${formatMetric(point.heun, 6)}`)
            .join("\n");

        return `## Laboratory Export: Differential Lab

### Model
- y' = ${derivative}
- x0 = ${x0}
- y(x0) = ${y0}
- h = ${step}
- iter = ${steps}

### Trajectory Preview
${preview}`;
    }

    const equations = [`x' = ${sysExpr1}`, `y' = ${sysExpr2}`];
    if (sysExpr3.trim()) {
        equations.push(`z' = ${sysExpr3}`);
    }

    const preview = systemPoints
        .slice(0, 6)
        .map((point) => `- t=${formatMetric(point.t, 4)}, x=${formatMetric(point.vars.x, 6)}, y=${formatMetric(point.vars.y, 6)}${sysExpr3.trim() ? `, z=${formatMetric(point.vars.z, 6)}` : ""}`)
        .join("\n");

    return `## Laboratory Export: Differential Lab

### System
${equations.map((item) => `- ${item}`).join("\n")}
- x(0) = ${x0}
- y(0) = ${y0}
${sysExpr3.trim() ? `- z(0) = ${z0}\n` : ""}- h = ${step}
- iter = ${steps}

### Trajectory Preview
${preview}`;
}

function buildDifferentialLivePayload(params: {
    targetId: string;
    solverMode: "single" | "system";
    derivative: string;
    sysExpr1: string;
    sysExpr2: string;
    sysExpr3: string;
    x0: string;
    y0: string;
    z0: string;
    step: string;
    steps: string;
    differentialPoints: DifferentialPoint[];
    systemPoints: ODESystemPoint[];
}): WriterBridgeBlockData {
    const { targetId, solverMode, derivative, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0, step, steps, differentialPoints, systemPoints } = params;

    if (solverMode === "single") {
        const lastPoint = differentialPoints[differentialPoints.length - 1];
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "differential-lab",
            kind: "differential",
            title: `Differensial model: y' = ${derivative}`,
            summary: "Euler va Heun usullari bilan hisoblangan trajectory natijasi.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "x0", value: x0 },
                { label: "y(x0)", value: y0 },
                { label: "h", value: step },
                { label: "Heun final", value: formatMetric(lastPoint?.heun, 6) },
            ],
            notes: [
                `Model: y' = ${derivative}`,
                `Iteratsiya: ${steps}`,
                lastPoint ? `Oxirgi nuqta: x=${formatMetric(lastPoint.x, 4)}, Euler=${formatMetric(lastPoint.euler, 6)}, Heun=${formatMetric(lastPoint.heun, 6)}` : "",
            ].filter(Boolean),
            plotSeries: [
                { label: "Euler", color: "#0f766e", points: differentialPoints.map((point) => ({ x: point.x, y: point.euler })) },
                { label: "Heun", color: "#f59e0b", points: differentialPoints.map((point) => ({ x: point.x, y: point.heun })) },
            ],
        };
    }

    const lastPoint = systemPoints[systemPoints.length - 1];
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "differential-lab",
        kind: "ode-system",
        title: sysExpr3.trim() ? "Differensial sistema: 3D trajectory" : "Differensial sistema: fazoviy portret",
        summary: "Differensial sistemadan eksport qilingan trajectory va parametrlar.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "x(0)", value: x0 },
            { label: "y(0)", value: y0 },
            ...(sysExpr3.trim() ? [{ label: "z(0)", value: z0 }] : []),
            { label: "h", value: step },
        ],
        notes: [
            `x' = ${sysExpr1}`,
            `y' = ${sysExpr2}`,
            ...(sysExpr3.trim() ? [`z' = ${sysExpr3}`] : []),
            `Iteratsiya: ${steps}`,
            lastPoint
                ? `Oxirgi nuqta: t=${formatMetric(lastPoint.t, 4)}, x=${formatMetric(lastPoint.vars.x, 6)}, y=${formatMetric(lastPoint.vars.y, 6)}${sysExpr3.trim() ? `, z=${formatMetric(lastPoint.vars.z, 6)}` : ""}`
                : "",
        ].filter(Boolean),
        plotSeries: [
            {
                label: sysExpr3.trim() ? "x-y projection" : "trajectory",
                color: "#0f766e",
                points: systemPoints.map((point) => ({ x: point.vars.x || 0, y: point.vars.y || 0 })),
            },
        ],
    };
}

export function DifferentialLabModule({ module }: { module: LaboratoryModuleMeta }) {
    const [solverMode, setSolverMode] = React.useState<"single" | "system">("single");
    const [derivative, setDerivative] = React.useState("0.5 * y * (1 - y/10)");
    const [sysExpr1, setSysExpr1] = React.useState("y");
    const [sysExpr2, setSysExpr2] = React.useState("-0.5 * (x^2 - 1) * y - x");
    const [sysExpr3, setSysExpr3] = React.useState(""); 
    const [x0, setX0] = React.useState("0");
    const [y0, setY0] = React.useState("1");
    const [z0, setZ0] = React.useState("1");
    const [step, setStep] = React.useState("0.1");
    const [steps, setSteps] = React.useState("40");

    const notebook = useLaboratoryNotebook<DifferentialBlockId>({
        storageKey: "mathsphere-lab-differential-notebook",
        definitions: differentialNotebookBlocks,
        defaultBlocks: ["setup", "plot"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const activePreset = LABORATORY_PRESETS.differential.find((preset) => {
        if (preset.mode !== solverMode) {
            return false;
        }

        if (solverMode === "single") {
            return "expr" in preset && preset.expr === derivative;
        }

        return "exprs" in preset && !!preset.exprs && preset.exprs[0] === sysExpr1 && preset.exprs[1] === sysExpr2 && (preset.exprs[2] || "") === sysExpr3;
    });
    const activePresetDescription = differentialPresetDescriptions[activePreset?.label || ""];
    const solverState = React.useMemo(() => {
        try {
            if (solverMode === "single") {
                const result = solveDifferentialEquation(derivative, Number(x0), Number(y0), Number(step), Number(steps));
                if (!result.length) {
                    throw new Error("Tizimdan hech qanday nuqta qaytmadi.");
                }

                return {
                    solverError: null,
                    differentialPoints: result,
                    systemPoints: [] as ODESystemPoint[],
                };
            }

            if (!sysExpr1.trim() || !sysExpr2.trim()) {
                throw new Error("Sistem mode uchun kamida x' va y' tenglamalari kiritilishi kerak.");
            }

            const expressions: Record<string, string> = { x: sysExpr1, y: sysExpr2 };
            if (sysExpr3.trim()) {
                expressions.z = sysExpr3;
            }

            const initialValues: Record<string, number> = { x: Number(x0), y: Number(y0) };
            if (sysExpr3.trim()) {
                initialValues.z = Number(z0);
            }

            const result = solveODESystem(expressions, initialValues, 0, Number(steps) * Number(step), Number(step));
            if (!result.length) {
                throw new Error("Tizimdan hech qanday nuqta qaytmadi.");
            }

            return {
                solverError: null,
                differentialPoints: [] as DifferentialPoint[],
                systemPoints: result,
            };
        } catch (error: any) {
            return {
                solverError: error.message as string,
                differentialPoints: [] as DifferentialPoint[],
                systemPoints: [] as ODESystemPoint[],
            };
        }
    }, [solverMode, derivative, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0, step, steps]);
    const solverError = solverState.solverError;
    const differentialPoints = solverState.differentialPoints;
    const systemPoints = solverState.systemPoints;
    const hasPoints = solverMode === "single" ? differentialPoints.length > 0 : systemPoints.length > 0;
    const lastPoint = solverMode === "single"
        ? differentialPoints[differentialPoints.length - 1] ?? null
        : systemPoints[systemPoints.length - 1] ?? null;

    const applyPreset = (p: any) => {
        setExportState("idle");
        setGuideMode(null);
        setSolverMode(p.mode);
        if (p.mode === "single") {
            setDerivative(p.expr);
            setSysExpr3("");
        } else {
            setSysExpr1(p.exprs[0]);
            setSysExpr2(p.exprs[1]);
            setSysExpr3(p.exprs[2] || "");
        }
        setX0(p.x0);
        setY0(p.y0);
        setZ0(p.z0 || "1");
        setStep(p.step || "0.1");
        setSteps(p.steps || "40");
    };

    async function copyMarkdownExport() {
        if (solverError || !hasPoints) {
            return;
        }

        const text = buildDifferentialMarkdown({
            solverMode,
            derivative,
            sysExpr1,
            sysExpr2,
            sysExpr3,
            x0,
            y0,
            z0,
            step,
            steps,
            differentialPoints,
            systemPoints,
        });

        await navigator.clipboard.writeText(text);
        setExportState("copied");
        setGuideMode(null);
    }

    function sendToWriter() {
        if (solverError || !hasPoints) {
            return;
        }

        const block = buildDifferentialLivePayload({
            targetId: `differential-${Date.now()}`,
            solverMode,
            derivative,
            sysExpr1,
            sysExpr2,
            sysExpr3,
            x0,
            y0,
            z0,
            step,
            steps,
            differentialPoints,
            systemPoints,
        });

        const requestId = queueWriterImport({
            version: 1,
            markdown: buildDifferentialMarkdown({
                solverMode,
                derivative,
                sysExpr1,
                sysExpr2,
                sysExpr3,
                x0,
                y0,
                z0,
                step,
                steps,
                differentialPoints,
                systemPoints,
            }),
            block,
            title: block.title,
            abstract: "Differensial laboratoriyadan eksport qilingan trajectory va parametrlar.",
            keywords: solverMode === "single" ? "differential,euler,heun" : "differential,ode-system,trajectory",
        });
        setExportState("sent");
        setGuideMode(null);
        window.location.assign(createLaboratoryWriterDraftHref(requestId));
    }

    function pushLiveResult() {
        if (solverError || !hasPoints) {
            return;
        }

        const target = findLiveWriterTargetBySelection(liveTargets, selectedLiveTargetId);
        if (!target) {
            return;
        }

        publishToLiveWriterTarget({
            writerId: target.writerId,
            targetId: target.id,
            sourceLabel: "Differential Lab",
            documentTitle: target.documentTitle,
            payload: buildDifferentialLivePayload({
                targetId: target.id,
                solverMode,
                derivative,
                sysExpr1,
                sysExpr2,
                sysExpr3,
                x0,
                y0,
                z0,
                step,
                steps,
                differentialPoints,
                systemPoints,
            }),
        });
    }

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title={module.title || "Differensial laboratoriya"}
                description="Boshlang'ich qiymatli masalalar, fazoviy portretlar va 3D trayektoriyalar."
                activeBlocks={notebook.activeBlocks}
                definitions={differentialNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Differensial model</div>
                                    <div className="flex gap-2">
                                        {(["single", "system"] as const).map(m => (
                                            <button key={m} onClick={() => setSolverMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${solverMode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>
                                                {m === "single" ? "Bitta tenglama" : "Sistema"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center">
                                    <Activity className="mr-2 h-3.5 w-3.5" /> Hisoblash faol
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activePresetDescription && (
                                    <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                                        {activePresetDescription}
                                    </div>
                                )}

                                {solverMode === "single" ? (
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Tenglama: y&apos; = f(x, y)</div>
                                        <input value={derivative} onChange={e => setDerivative(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div><div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">x&apos; = f1(x, y, z, t)</div><input value={sysExpr1} onChange={e => setSysExpr1(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">y&apos; = f2(x, y, z, t)</div><input value={sysExpr2} onChange={e => setSysExpr2(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">z&apos; = f3(x, y, z, t)</div><input value={sysExpr3} onChange={e => setSysExpr3(e.target.value)} placeholder="2D tizim uchun bo'sh qoldiring" className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" /></div>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{solverMode === "single" ? "x0" : "x(0)"}</div><input value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{solverMode === "single" ? "y(x0)" : "y(0)"}</div><input value={y0} onChange={e => setY0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{solverMode === "single" ? "z ishlatilmaydi" : "z(0)"}</div><input value={z0} onChange={e => setZ0(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" disabled={solverMode==='single'} /></div>
                                    <div className="site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Qadam h</div><input value={step} onChange={e => setStep(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                    <div className="col-span-2 site-outline-card p-3 space-y-1"><div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Iteratsiya soni</div><input value={steps} onChange={e => setSteps(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("plot") && (
                        <div className="space-y-6">
                            {solverError && (
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                                    <Zap className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <div className="text-xs font-black uppercase tracking-widest">Hisoblash xatosi</div>
                                        <div className="text-sm font-mono leading-relaxed">{solverError}</div>
                                    </div>
                                </div>
                            )}

                            {hasPoints && (
                                <div className="site-panel-strong p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="site-eyebrow text-accent">Natija grafigi</div>
                                        {solverMode === "system" && sysExpr3.trim() && (
                                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                                                <Beaker className="mr-2 h-3 w-3" /> 3D trayektoriya
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-full">
                                        {solverMode === "single" ? (
                                            <CartesianPlot
                                                series={[
                                                    { label: "Euler", color: "var(--accent)", points: differentialPoints.map((p) => ({ x: p.x, y: p.euler })) },
                                                    { label: "Heun", color: "#f59e0b", points: differentialPoints.map((p) => ({ x: p.x, y: p.heun })) },
                                                ]}
                                            />
                                        ) : (
                                            sysExpr3.trim() ? (
                                                <ScientificPlot
                                                    type="scatter3d"
                                                    title={`Trayektoriya: x(0)=${x0}, y(0)=${y0}, z(0)=${z0}`}
                                                    data={systemPoints.map((p) => ({ x: p.vars.x || 0, y: p.vars.y || 0, z: p.vars.z || 0 }))}
                                                />
                                            ) : (
                                                <CartesianPlot
                                                    title="Fazoviy portret"
                                                    series={[{ label: "Trayektoriya", color: "var(--accent)", points: systemPoints.map((p) => ({ x: p.vars.x || 0, y: p.vars.y || 0 })) }]}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {notebook.hasBlock("table") && hasPoints && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Hisob jadvali</div>
                                    <h3 className="mt-2 font-serif text-2xl font-black">Hisoblangan nuqtalar</h3>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {solverMode === "single" ? differentialPoints.length : systemPoints.length} nuqta
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border/60">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/10 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Step</th>
                                            <th className="px-4 py-3">{solverMode === "single" ? "x" : "t"}</th>
                                            {solverMode === "single" ? (
                                                <>
                                                    <th className="px-4 py-3">Euler</th>
                                                    <th className="px-4 py-3">Heun</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-4 py-3">x</th>
                                                    <th className="px-4 py-3">y</th>
                                                    {sysExpr3.trim() && <th className="px-4 py-3">z</th>}
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(solverMode === "single" ? differentialPoints : systemPoints).slice(0, 12).map((point, index) => (
                                            <tr key={`${solverMode}-${index}`} className="border-t border-border/40">
                                                <td className="px-4 py-3 font-mono">{index}</td>
                                                <td className="px-4 py-3 font-mono">{solverMode === "single" ? (point as DifferentialPoint).x : (point as ODESystemPoint).t}</td>
                                                {solverMode === "single" ? (
                                                    <>
                                                        <td className="px-4 py-3 font-mono">{(point as DifferentialPoint).euler}</td>
                                                        <td className="px-4 py-3 font-mono">{(point as DifferentialPoint).heun}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-mono">{(point as ODESystemPoint).vars.x}</td>
                                                        <td className="px-4 py-3 font-mono">{(point as ODESystemPoint).vars.y}</td>
                                                        {sysExpr3.trim() && <td className="px-4 py-3 font-mono">{(point as ODESystemPoint).vars.z}</td>}
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-accent" />
                             <div className="site-eyebrow text-accent">Tayyor misollar</div>
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">
                            Misol tanlang, so&apos;ng tenglamani o&apos;zgartirib tizimning qanday tutishini kuzating.
                        </p>
                        <div className="grid gap-2">
                            {LABORATORY_PRESETS.differential.map(p => (
                                <button key={p.label} onClick={() => applyPreset(p)} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-3 text-left transition-all group hover:bg-accent/5 hover:border-accent/40">
                                    <div className="min-w-0">
                                        <div className="truncate text-[11px] font-black tracking-tight text-foreground group-hover:text-accent font-serif">{p.label}</div>
                                        <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{p.mode === "single" ? "bitta tenglama" : "sistema"}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {lastPoint && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="site-eyebrow text-accent">Qisqa xulosa</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="site-outline-card p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Oxirgi nuqta</div>
                                    <div className="mt-2 font-mono text-sm leading-7 text-foreground">
                                        {solverMode === "single"
                                            ? `x=${(lastPoint as DifferentialPoint).x}, Heun=${(lastPoint as DifferentialPoint).heun}`
                                            : `t=${(lastPoint as ODESystemPoint).t}, x=${(lastPoint as ODESystemPoint).vars.x}, y=${(lastPoint as ODESystemPoint).vars.y}${sysExpr3.trim() ? `, z=${(lastPoint as ODESystemPoint).vars.z}` : ""}`}
                                    </div>
                                </div>
                                <div className="site-outline-card p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parametrlar</div>
                                    <div className="mt-2 font-mono text-sm leading-7 text-foreground">
                                        h={step}
                                        <br />
                                        iter={steps}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={!solverError && hasPoints}
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
