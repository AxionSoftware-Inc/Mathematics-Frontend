"use client";

import React from "react";
import { Activity, ArrowRight, Beaker, GitCompareArrows, SlidersHorizontal, Sparkles, Trash2, Zap } from "lucide-react";
import { parse as parseMathExpression } from "mathjs";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryAnnotationsPanel, type LaboratoryAnnotationItem } from "@/components/laboratory/laboratory-annotations-panel";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryResultLevelsPanel } from "@/components/laboratory/laboratory-result-levels-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratoryWorkflowTemplatePanel } from "@/components/laboratory/laboratory-workflow-template-panel";
import { buildScatter3DTrajectoryData, ScientificPlot } from "@/components/laboratory/scientific-plot";
import { usePersistedLabCollection } from "@/components/laboratory/use-persisted-lab-collection";
import { LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { solveDifferentialEquation, solveODESystem, type DifferentialPoint, type ODESystemPoint, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
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
    "Logistic Growth Near Capacity": "Compare deck uchun ayni muddao: Logistic Growth bilan birga overlay qilsangiz to'yinganlikka turli startlardan yaqinlashishni ko'rasiz.",
    "Exponential Decay": "Sodda so'nish modeli. Heun va Euler orasidagi farq kichik bo'lgani uchun step size ta'sirini test qilish oson.",
    "Nonlinear Blow-up Window": "Kuchli nolinier misol. Qadamni kattalashtirsangiz trajectory tez buziladi, kichraytirsangiz keskin o'sish zonasini yaxshiroq ko'rasiz.",
    "Forced Response (1st Order)": "Vaqtga bog'liq tashqi forcingli birinchi tartibli model. Tebranish va damping birga ko'rinadi.",
    "Van der Pol Oscillator": "2D tebranish tizimi. Fazoviy portret yopiq trayektoriya beradi.",
    "Simple Harmonic Oscillator": "Elliptik fazoviy portret beradi. Differential laboratoriyadagi 2D overlay va compare deck uchun eng toza bazaviy misol.",
    "Spiral Sink": "Barqaror fokus. Turli boshlang'ich nuqtalarni compare deck bilan ustma-ust qo'yib, bitta markazga spiral yaqinlashishni ko'ring.",
    "Spiral Source": "Beqaror fokus. Spiral Sink bilan juftlab ko'rsangiz dynamics kontrasti juda aniq chiqadi.",
    "Saddle Field": "Saddle tipidagi sistemani tez ko'rsatadi. Trajectorylarning ajralish yo'nalishlari phase portraitni kuchli ochib beradi.",
    "Predator-Prey (Lotka-Volterra)": "Yirtqich-o'lja populyatsiya modeli. X va Y davriy aylanish hosil qiladi.",
    "Lorenz Attractor (3D Chaos)": "3D xaotik tizim. Grafik faqat fazoviy trayektoriyani ko'rsatadi.",
    "Rossler Attractor (Chaos)": "Silliqroq xaotik attraktor. Uzoq iteratsiyada spiral qatlamlar hosil bo'ladi.",
    "Chen Attractor": "Lorenz oilasiga yaqin, lekin boshqa qatlamli 3D chaos beradi. Yangi 3D compare deck bilan taqqoslash uchun juda yaxshi.",
    "Brusselator (Chemical Oscillator)": "Kimyoviy osillyator modeli. Parametrlar avto-tebranish ko'rsatadi.",
    "Duffing Oscillator (Chaos)": "Majburiy nolinier tebranish. Tenglamada vaqt `t` ham ishlatiladi.",
    "Thomas Cyclical Attractor": "3D sinusli tizim. Boshlang'ich nuqtaga sezgir xaotik trayektoriya.",
    "Aizawa Attractor": "3D sahnada boy qatlamli shakl beradi. Projection trail va camera presetlarni ko'rsatish uchun chiroyli test-case.",
};

const DIFFERENTIAL_COMPARE_COLORS = ["#ef4444", "#2563eb", "#14b8a6", "#f97316", "#8b5cf6"];

const DIFFERENTIAL_WORKFLOW_TEMPLATES = [
    {
        id: "stability-analysis",
        title: "Stability Analysis",
        description: "Bitta tenglamada qadam sezgirligi va Euler/Heun farqini tizimli tekshiradi.",
        presetLabel: "Logistic Growth Near Capacity",
        blocks: ["setup", "plot", "table", "bridge"] as const,
        sweep: { start: "0.03", end: "0.22", count: "5" },
    },
    {
        id: "phase-portrait-study",
        title: "Phase Portrait Study",
        description: "2D sistema trayektoriyasi, phase portrait va compare deck orqali fokus/saddle xatti-harakatini ochadi.",
        presetLabel: "Spiral Sink",
        blocks: ["setup", "plot", "table"] as const,
        sweep: { start: "0.04", end: "0.16", count: "4" },
    },
    {
        id: "attractor-comparison",
        title: "Attractor Comparison",
        description: "3D chaos yoki attractor shaklini ko'rish, keyin compare deck bilan sensitivity tekshirish uchun tayyor oqim.",
        presetLabel: "Aizawa Attractor",
        blocks: ["setup", "plot", "bridge"] as const,
        sweep: { start: "0.01", end: "0.05", count: "4" },
    },
    {
        id: "nonlinear-sensitivity",
        title: "Nonlinear Sensitivity",
        description: "Keskin o'sish yoki blow-up yaqinidagi xatti-harakatni kichik va katta h bilan taqqoslaydi.",
        presetLabel: "Nonlinear Blow-up Window",
        blocks: ["setup", "plot", "table", "bridge"] as const,
        sweep: { start: "0.01", end: "0.12", count: "5" },
    },
] as const;

type DifferentialComparisonSnapshot = {
    id: string;
    label: string;
    solverMode: "single" | "system";
    color: string;
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
};

type DifferentialAnnotation = LaboratoryAnnotationItem;

type DifferentialSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
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
};

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
    }

    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function toTexExpression(expression: string) {
    try {
        return parseMathExpression(expression).toTex({ parenthesis: "keep" });
    } catch {
        return `\\texttt{${expression.replace(/\\/g, "\\\\").replace(/([{}_#$%&])/g, "\\$1")}}`;
    }
}

function clampSweepValue(valueText: string, fallback: number, min: number, max: number) {
    const numeric = Number(valueText);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, numeric));
}

function generateSweepValues(startText: string, endText: string, countText: string, min: number, max: number) {
    const start = clampSweepValue(startText, min, min, max);
    const end = clampSweepValue(endText, Math.min(max, start + 0.3), min, max);
    const count = Math.round(clampSweepValue(countText, 4, 2, 6));
    const actualStart = Math.min(start, end);
    const actualEnd = Math.max(start, end);
    const step = count === 1 ? 0 : (actualEnd - actualStart) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, index) => Number((actualStart + step * index).toFixed(4)));
}

function createDifferentialScenarioLabel(params: {
    solverMode: "single" | "system";
    derivative: string;
    sysExpr1: string;
    sysExpr2: string;
    sysExpr3: string;
}) {
    if (params.solverMode === "single") {
        return `y' = ${params.derivative}`;
    }

    return params.sysExpr3.trim()
        ? `3D system: x'=${params.sysExpr1}, y'=${params.sysExpr2}, z'=${params.sysExpr3}`
        : `2D system: x'=${params.sysExpr1}, y'=${params.sysExpr2}`;
}

function buildDifferentialComparisonSnapshot(params: {
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
    color: string;
}): DifferentialComparisonSnapshot {
    return {
        id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `diff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: createDifferentialScenarioLabel(params),
        solverMode: params.solverMode,
        color: params.color,
        derivative: params.derivative,
        sysExpr1: params.sysExpr1,
        sysExpr2: params.sysExpr2,
        sysExpr3: params.sysExpr3,
        x0: params.x0,
        y0: params.y0,
        z0: params.z0,
        step: params.step,
        steps: params.steps,
        differentialPoints: params.differentialPoints,
        systemPoints: params.systemPoints,
    };
}

function interpolateSeriesY(points: Array<{ x: number; y: number }>, x: number) {
    if (points.length < 2 || x < points[0].x || x > points[points.length - 1].x) {
        return null;
    }

    for (let index = 0; index < points.length - 1; index += 1) {
        const left = points[index];
        const right = points[index + 1];
        if (x < left.x || x > right.x) {
            continue;
        }

        const span = right.x - left.x;
        if (span === 0) {
            return left.y;
        }

        const t = (x - left.x) / span;
        return left.y + (right.y - left.y) * t;
    }

    return null;
}

function findSingleTrajectoryIntersections(reference: DifferentialPoint[], compare: DifferentialPoint[]) {
    const referenceSeries = reference.map((point) => ({ x: point.x, y: point.heun }));
    const intersections: Array<{ x: number; y: number }> = [];

    for (let index = 0; index < referenceSeries.length - 1; index += 1) {
        const start = referenceSeries[index];
        const end = referenceSeries[index + 1];
        const compareStart = interpolateSeriesY(compare.map((point) => ({ x: point.x, y: point.heun })), start.x);
        const compareEnd = interpolateSeriesY(compare.map((point) => ({ x: point.x, y: point.heun })), end.x);

        if (compareStart === null || compareEnd === null) {
            continue;
        }

        const deltaStart = start.y - compareStart;
        const deltaEnd = end.y - compareEnd;
        if (deltaStart === 0) {
            intersections.push({ x: start.x, y: start.y });
            continue;
        }
        if (deltaStart * deltaEnd > 0) {
            continue;
        }

        const weight = deltaStart / (deltaStart - deltaEnd);
        intersections.push({
            x: start.x + (end.x - start.x) * weight,
            y: start.y + (end.y - start.y) * weight,
        });
    }

    return intersections.slice(0, 6);
}

function computeClosestApproach(reference: ODESystemPoint[], compare: ODESystemPoint[], hasZ: boolean) {
    const total = Math.min(reference.length, compare.length);
    if (!total) {
        return null;
    }

    let best: { distance: number; t: number } | null = null;
    for (let index = 0; index < total; index += 1) {
        const left = reference[index];
        const right = compare[index];
        const dx = (left.vars.x || 0) - (right.vars.x || 0);
        const dy = (left.vars.y || 0) - (right.vars.y || 0);
        const dz = hasZ ? (left.vars.z || 0) - (right.vars.z || 0) : 0;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (!best || distance < best.distance) {
            best = { distance, t: left.t };
        }
    }

    return best;
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
    const [comparisonScenarios, setComparisonScenarios] = React.useState<DifferentialComparisonSnapshot[]>([]);
    const [sweepStart, setSweepStart] = React.useState("0.05");
    const [sweepEnd, setSweepEnd] = React.useState("0.35");
    const [sweepCount, setSweepCount] = React.useState("4");
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = usePersistedLabCollection<DifferentialAnnotation>("mathsphere-lab-differential-annotations");
    const [savedExperiments, setSavedExperiments] = usePersistedLabCollection<DifferentialSavedExperiment>("mathsphere-lab-differential-experiments");
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
    const activeWorkflowTemplate = DIFFERENTIAL_WORKFLOW_TEMPLATES.find((template) => template.id === activeTemplateId) || null;
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
        } catch (error: unknown) {
            return {
                solverError: error instanceof Error ? error.message : "Differential solver failed.",
                differentialPoints: [] as DifferentialPoint[],
                systemPoints: [] as ODESystemPoint[],
            };
        }
    }, [solverMode, derivative, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0, step, steps]);
    const solverError = solverState.solverError;
    const differentialPoints = solverState.differentialPoints;
    const systemPoints = solverState.systemPoints;
    const hasPoints = solverMode === "single" ? differentialPoints.length > 0 : systemPoints.length > 0;
    const currentScenarioLabel = createDifferentialScenarioLabel({
        solverMode,
        derivative,
        sysExpr1,
        sysExpr2,
        sysExpr3,
    });
    const lastPoint = solverMode === "single"
        ? differentialPoints[differentialPoints.length - 1] ?? null
        : systemPoints[systemPoints.length - 1] ?? null;
    const renderedProblemMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            return [
                "$$",
                `\\frac{dy}{dx} = ${toTexExpression(derivative)}`,
                "$$",
                "$$",
                `y(${formatMetric(Number(x0), 3)}) = ${formatMetric(Number(y0), 3)}, \\quad h = ${formatMetric(Number(step), 3)}, \\quad N = ${steps}`,
                "$$",
                "- Goal: Euler va Heun trajectory'larini bir xil boshlang'ich shartda solishtirish.",
                "- Kuzatiladigan narsa: step size, stability va lokal xatti-harakat.",
            ].join("\n");
        }

        const systemLines = [
            `\\dot{x} = ${toTexExpression(sysExpr1)}`,
            `\\dot{y} = ${toTexExpression(sysExpr2)}`,
        ];
        if (sysExpr3.trim()) {
            systemLines.push(`\\dot{z} = ${toTexExpression(sysExpr3)}`);
        }

        return [
            "$$",
            "\\begin{cases}",
            `${systemLines.join(" \\\\ ")}`,
            "\\end{cases}",
            "$$",
            "$$",
            sysExpr3.trim()
                ? `x(0)=${formatMetric(Number(x0), 3)}, \\ y(0)=${formatMetric(Number(y0), 3)}, \\ z(0)=${formatMetric(Number(z0), 3)}, \\ h=${formatMetric(Number(step), 3)}, \\ N=${steps}`
                : `x(0)=${formatMetric(Number(x0), 3)}, \\ y(0)=${formatMetric(Number(y0), 3)}, \\ h=${formatMetric(Number(step), 3)}, \\ N=${steps}`,
            "$$",
            sysExpr3.trim()
                ? "- Goal: 3D trajectory, attractor shakli va comparison deck ichidagi yaqinlashishlarni tahlil qilish."
                : "- Goal: phase portrait va trajectory overlay orqali sistema dinamikasini ko'rish.",
        ].join("\n");
    }, [derivative, solverMode, step, steps, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0]);

    const compatibleComparisons = React.useMemo(
        () =>
            comparisonScenarios.filter(
                (scenario) =>
                    scenario.solverMode === solverMode &&
                    Boolean(scenario.sysExpr3.trim()) === Boolean(sysExpr3.trim()),
            ),
        [comparisonScenarios, solverMode, sysExpr3],
    );
    const analysisBriefMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            return [
                `- Current scenario: **${currentScenarioLabel}**.`,
                `- Final Heun estimate: **${formatMetric((lastPoint as DifferentialPoint | null)?.heun, 6)}** at x = **${formatMetric((lastPoint as DifferentialPoint | null)?.x, 4)}**.`,
                "- Grafikdan tashqari qaraladigan narsa: Euler-Heun farqi, trajectory kesishishi va step sezgirligi.",
                `- Compare deck snapshot count: **${compatibleComparisons.length}**.`,
            ].join("\n");
        }

        const systemLastPoint = lastPoint as ODESystemPoint | null;
        return [
            `- Current scenario: **${currentScenarioLabel}**.`,
            `- Final state: **x=${formatMetric(systemLastPoint?.vars.x, 4)}**, **y=${formatMetric(systemLastPoint?.vars.y, 4)}**${sysExpr3.trim() ? `, **z=${formatMetric(systemLastPoint?.vars.z, 4)}**` : ""}.`,
            sysExpr3.trim()
                ? "- Grafik faqat chizma emas: attractor formasi, projection trails va comparison trajectories birga tahlil qilinadi."
                : "- Grafik faqat phase portrait emas: current trajectory va comparison deck orasidagi eng yaqinlashish ham tahlil qilinadi.",
            `- Compare deck snapshot count: **${compatibleComparisons.length}**.`,
        ].join("\n");
    }, [compatibleComparisons.length, currentScenarioLabel, lastPoint, solverMode, sysExpr3]);
    const derivationMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            const preview = differentialPoints.slice(0, 4);
            const transitions = preview.slice(1).map((point, index) => {
                const previous = preview[index];
                return `${index + 1}. x: ${formatMetric(previous.x, 4)} -> ${formatMetric(point.x, 4)}, Euler: ${formatMetric(previous.euler, 6)} -> ${formatMetric(point.euler, 6)}, Heun: ${formatMetric(previous.heun, 6)} -> ${formatMetric(point.heun, 6)}`;
            });

            return [
                "**Method flow**",
                "",
                "$$",
                "y_{n+1}^{Euler} = y_n + h f(x_n, y_n)",
                "$$",
                "$$",
                "\\tilde{y}_{n+1} = y_n + h f(x_n, y_n), \\quad y_{n+1}^{Heun} = y_n + \\frac{h}{2}\\left[f(x_n,y_n) + f(x_{n+1}, \\tilde{y}_{n+1})\\right]",
                "$$",
                `- Initial state: **x0 = ${formatMetric(Number(x0), 4)}**, **y0 = ${formatMetric(Number(y0), 6)}**`,
                `- Step size: **${formatMetric(Number(step), 4)}**, iterations: **${steps}**`,
                transitions.length ? `- First updates:\n${transitions.join("\n")}` : "- Yetarli step preview yo'q.",
            ].join("\n");
        }

        const preview = systemPoints.slice(0, 4);
        const transitions = preview.slice(1).map((point, index) => {
            const previous = preview[index];
            const previousCoords = `(${formatMetric(previous.vars.x, 4)}, ${formatMetric(previous.vars.y, 4)}${sysExpr3.trim() ? `, ${formatMetric(previous.vars.z, 4)}` : ""})`;
            const nextCoords = `(${formatMetric(point.vars.x, 4)}, ${formatMetric(point.vars.y, 4)}${sysExpr3.trim() ? `, ${formatMetric(point.vars.z, 4)}` : ""})`;
            return `${index + 1}. t: ${formatMetric(previous.t, 4)} -> ${formatMetric(point.t, 4)}, state: ${previousCoords} -> ${nextCoords}`;
        });

        return [
            "**Method flow**",
            "",
            "$$",
            "\\mathbf{k}_1 = F(t_n, \\mathbf{u}_n), \\quad \\mathbf{k}_2 = F(t_n+h, \\mathbf{u}_n + h\\mathbf{k}_1)",
            "$$",
            "$$",
            "\\mathbf{u}_{n+1} = \\mathbf{u}_n + \\frac{h}{2}(\\mathbf{k}_1 + \\mathbf{k}_2)",
            "$$",
            `- Initial state: **x(0) = ${formatMetric(Number(x0), 4)}**, **y(0) = ${formatMetric(Number(y0), 4)}**${sysExpr3.trim() ? `, **z(0) = ${formatMetric(Number(z0), 4)}**` : ""}`,
            `- Step size: **${formatMetric(Number(step), 4)}**, iterations: **${steps}**`,
            transitions.length ? `- First state transitions:\n${transitions.join("\n")}` : "- Yetarli system preview yo'q.",
        ].join("\n");
    }, [differentialPoints, solverMode, step, steps, sysExpr3, systemPoints, x0, y0, z0]);
    const comparisonInsights = React.useMemo(() => {
        if (!compatibleComparisons.length) {
            return [] as string[];
        }

        if (solverMode === "single") {
            return compatibleComparisons
                .map((scenario) => {
                    const intersections = findSingleTrajectoryIntersections(differentialPoints, scenario.differentialPoints);
                    if (!intersections.length) {
                        return `${scenario.label}: kesishish topilmadi`;
                    }

                    const first = intersections[0];
                    return `${scenario.label}: ${intersections.length} kesishish, birinchisi x=${formatMetric(first.x, 3)}`;
                })
                .slice(0, 3);
        }

        return compatibleComparisons
            .map((scenario) => {
                const closest = computeClosestApproach(systemPoints, scenario.systemPoints, Boolean(sysExpr3.trim()));
                return closest
                    ? `${scenario.label}: eng yaqin masofa ${formatMetric(closest.distance, 4)} @ t=${formatMetric(closest.t, 3)}`
                    : `${scenario.label}: taqqoslash nuqtasi yo'q`;
            })
            .slice(0, 3);
    }, [compatibleComparisons, differentialPoints, solverMode, sysExpr3, systemPoints]);
    const explainModeMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            const currentLastPoint = lastPoint as DifferentialPoint | null;
            const methodGap = currentLastPoint ? Math.abs(currentLastPoint.heun - currentLastPoint.euler) : null;

            return [
                "- Bu grafik **y(x)** yechimining numerik aproximatsiyasini ko'rsatadi. Euler tez va qo'pol, Heun esa odatda silliqroq reference beradi.",
                `- Hozirgi holatda yakuniy method gap **${formatMetric(methodGap, 6)}**. Gap kichik bo'lsa, tanlangan **h** odatda yetarli; katta bo'lsa, qadamni kamaytirish kerak.`,
                "- Compare deck'dagi kesishishlar turli scenario'lar bir xil qiymatdan o'tishini ko'rsatadi, lekin keyingi trend baribir boshqa bo'lishi mumkin.",
                "- Step sweep chizig'i qaysi h oralig'ida solver tinchlanayotganini ko'rsatadi; amaliy tanlov uchun aynan shu zona foydali.",
            ].join("\n");
        }

        const isThreeDimensional = Boolean(sysExpr3.trim());
        const systemLastPoint = lastPoint as ODESystemPoint | null;

        return [
            isThreeDimensional
                ? "- Bu grafik **state-space trajectory**ni ko'rsatadi: chiziq vaqt bo'yicha 3D fazoda qanday qatlam hosil qilayotganini ko'rasiz."
                : "- Bu grafik **phase portrait**ni ko'rsatadi: har nuqta sistema holatini `(x, y)` fazoda ifodalaydi.",
            isThreeDimensional
                ? "- Agar trajectory bir hudud atrofida aylanib qatlam hosil qilsa, bu attractor yoki bounded chaos belgisi bo'lishi mumkin; cheksiz yoyilsa, sistema beqarorlashadi."
                : "- Spiral ichkariga tortilsa stable focus, tashqariga yoyilsa unstable focus, keskin ajralishlar esa saddle xatti-harakatini eslatadi.",
            `- Hozirgi final state: **x=${formatMetric(systemLastPoint?.vars.x, 4)}**, **y=${formatMetric(systemLastPoint?.vars.y, 4)}**${isThreeDimensional ? `, **z=${formatMetric(systemLastPoint?.vars.z, 4)}**` : ""}.`,
            "- Compare deck esa turli boshlang'ich shartlar yoki parametrlar bir xil fazoda qanday ajralishini ko'rsatadi; yaqinlashishlar barqaror zona, katta ajralishlar esa sensitivity signalidir.",
        ].join("\n");
    }, [lastPoint, solverMode, sysExpr3]);

    const applyPreset = (preset: (typeof LABORATORY_PRESETS.differential)[number]) => {
        setExportState("idle");
        setGuideMode(null);
        setActiveTemplateId(null);
        setSolverMode(preset.mode as "single" | "system");
        if (preset.mode === "single") {
            setDerivative(preset.expr || "0.5 * y * (1 - y/10)");
            setSysExpr3("");
        } else {
            setSysExpr1(preset.exprs?.[0] || "y");
            setSysExpr2(preset.exprs?.[1] || "-0.5 * (x^2 - 1) * y - x");
            setSysExpr3(preset.exprs?.[2] || "");
        }
        setX0(preset.x0);
        setY0(preset.y0);
        setZ0(preset.z0 || "1");
        setStep(preset.step || "0.1");
        setSteps(preset.steps || "40");
    };
    const applyWorkflowTemplate = (templateId: string) => {
        const template = DIFFERENTIAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) {
            return;
        }

        const preset = LABORATORY_PRESETS.differential.find((item) => item.label === template.presetLabel);
        if (preset) {
            applyPreset(preset);
        }
        setSweepStart(template.sweep.start);
        setSweepEnd(template.sweep.end);
        setSweepCount(template.sweep.count);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    function addCurrentScenarioToComparison() {
        if (solverError || !hasPoints) {
            return;
        }

        setComparisonScenarios((current) => {
            const color = DIFFERENTIAL_COMPARE_COLORS[current.length % DIFFERENTIAL_COMPARE_COLORS.length];
            const nextSnapshot = buildDifferentialComparisonSnapshot({
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
                color,
            });

            return [...current.slice(-3), nextSnapshot];
        });
    }

    const annotationAnchor = React.useMemo(() => {
        if (solverMode === "single") {
            const currentLastPoint = lastPoint as DifferentialPoint | null;
            const methodGap = currentLastPoint ? Math.abs(currentLastPoint.heun - currentLastPoint.euler) : null;
            return `Heun final ${formatMetric(currentLastPoint?.heun, 6)} @ x=${formatMetric(currentLastPoint?.x, 4)}, gap=${formatMetric(methodGap, 6)}${comparisonInsights.length ? `, compare: ${comparisonInsights[0]}` : ""}`;
        }

        const systemLastPoint = lastPoint as ODESystemPoint | null;
        return `Final state x=${formatMetric(systemLastPoint?.vars.x, 5)}, y=${formatMetric(systemLastPoint?.vars.y, 5)}${sysExpr3.trim() ? `, z=${formatMetric(systemLastPoint?.vars.z, 5)}` : ""}${comparisonInsights.length ? `, compare: ${comparisonInsights[0]}` : ""}`;
    }, [comparisonInsights, lastPoint, solverMode, sysExpr3]);

    function addAnnotationFromCurrentResult() {
        if (!hasPoints || solverError) {
            return;
        }

        const nextAnnotation: DifferentialAnnotation = {
            id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `diff-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: annotationTitle.trim() || currentScenarioLabel,
            note: annotationNote.trim() || "Current trajectory bo'yicha qisqa observation saqlandi.",
            anchor: annotationAnchor,
            createdAt: new Date().toISOString(),
        };

        setAnnotations((current) => [nextAnnotation, ...current].slice(0, 8));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveCurrentExperiment() {
        const nextExperiment: DifferentialSavedExperiment = {
            id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `diff-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label: experimentLabel.trim() || currentScenarioLabel,
            savedAt: new Date().toISOString(),
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
        };

        setSavedExperiments((current) => [nextExperiment, ...current].slice(0, 8));
        setExperimentLabel("");
    }

    function loadSavedExperiment(experiment: DifferentialSavedExperiment) {
        setExportState("idle");
        setGuideMode(null);
        setSolverMode(experiment.solverMode);
        setDerivative(experiment.derivative);
        setSysExpr1(experiment.sysExpr1);
        setSysExpr2(experiment.sysExpr2);
        setSysExpr3(experiment.sysExpr3);
        setX0(experiment.x0);
        setY0(experiment.y0);
        setZ0(experiment.z0);
        setStep(experiment.step);
        setSteps(experiment.steps);
    }
    const comparisonPlotSeries = React.useMemo(() => {
        if (solverMode === "single") {
            return [
                { label: "Current Heun", color: "var(--accent)", points: differentialPoints.map((point) => ({ x: point.x, y: point.heun })) },
                { label: "Current Euler", color: "#f59e0b", points: differentialPoints.map((point) => ({ x: point.x, y: point.euler })) },
                ...compatibleComparisons.map((scenario) => ({
                    label: scenario.label,
                    color: scenario.color,
                    points: scenario.differentialPoints.map((point) => ({ x: point.x, y: point.heun })),
                })),
            ];
        }

        return [
            { label: "Current trajectory", color: "var(--accent)", points: systemPoints.map((point) => ({ x: point.vars.x || 0, y: point.vars.y || 0 })) },
            ...compatibleComparisons.map((scenario) => ({
                label: scenario.label,
                color: scenario.color,
                points: scenario.systemPoints.map((point) => ({ x: point.vars.x || 0, y: point.vars.y || 0 })),
            })),
        ];
    }, [compatibleComparisons, differentialPoints, solverMode, systemPoints]);

    const isThreeDSystem = solverMode === "system" && Boolean(sysExpr3.trim());
    const total3DPointLoad = React.useMemo(
        () =>
            systemPoints.length +
            compatibleComparisons.reduce((sum, scenario) => sum + scenario.systemPoints.length, 0),
        [compatibleComparisons, systemPoints.length],
    );
    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        const stepValue = Number(step);
        const stepsValue = Number(steps);
        const expressionLooksSensitive = solverMode === "single"
            ? /(\/|sqrt|log|tan)/i.test(derivative)
            : /(\/|sqrt|log|tan)/i.test(`${sysExpr1} ${sysExpr2} ${sysExpr3}`);

        if (stepValue > 0.35) {
            signals.push({
                tone: "warn",
                label: "Coarse Step",
                text: "Qadam uzunligi katta. Euler/Heun yoki system update trajectory'ni keskin soddalashtirib yuborishi mumkin.",
            });
        }
        if (stepsValue < 12) {
            signals.push({
                tone: "info",
                label: "Short Horizon",
                text: "Iteratsiya soni kam. Lokal xatti-harakat ko'rinadi, lekin uzoq muddatli trend to'liq ochilmaydi.",
            });
        }

        if (solverMode === "single") {
            const lastDifferentialPoint = lastPoint as DifferentialPoint | null;
            const methodGap = lastDifferentialPoint ? Math.abs(lastDifferentialPoint.heun - lastDifferentialPoint.euler) : 0;
            if (methodGap > Math.max(0.5, Math.abs(lastDifferentialPoint?.heun || 0) * 0.15)) {
                signals.push({
                    tone: "danger",
                    label: "Low Stability",
                    text: `Euler va Heun orasidagi yakuniy farq ${formatMetric(methodGap, 5)} ga chiqdi. Step size'ni kamaytirib qayta tekshirish kerak.`,
                });
            }
        } else {
            const systemLastPoint = lastPoint as ODESystemPoint | null;
            const dominantCoordinate = Math.max(
                Math.abs(systemLastPoint?.vars.x || 0),
                Math.abs(systemLastPoint?.vars.y || 0),
                Math.abs(systemLastPoint?.vars.z || 0),
            );
            if (dominantCoordinate > 60) {
                signals.push({
                    tone: "warn",
                    label: "Rapid Growth",
                    text: "State coordinate'lar juda katta qiymatlarga chiqdi. Bu stiff yoki blow-up xatti-harakat belgisi bo'lishi mumkin.",
                });
            }
            if (total3DPointLoad > 3200) {
                signals.push({
                    tone: "info",
                    label: "Heavy Scene",
                    text: "3D trajectory yuklamasi katta. Render decimation ishlayapti, lekin compare deck'ni kamaytirish foydali bo'lishi mumkin.",
                });
            }
        }

        if (expressionLooksSensitive) {
            signals.push({
                tone: "info",
                label: "Domain Sensitivity",
                text: "Ifodada bo'linish yoki log/sqrt/tan bor. Ba'zi boshlang'ich shartlarda singularity yoki keskin og'ish yuz berishi mumkin.",
            });
        }

        if (!signals.length) {
            signals.push({
                tone: "neutral",
                label: "Healthy Setup",
                text: "Hozirgi parametrlar stabil ko'rinmoqda. Endi compare deck yoki step sweep bilan sezgirlikni chuqurroq tekshirish mumkin.",
            });
        }

        return signals;
    }, [derivative, lastPoint, solverMode, step, steps, sysExpr1, sysExpr2, sysExpr3, total3DPointLoad]);
    const sweepValues = React.useMemo(() => generateSweepValues(sweepStart, sweepEnd, sweepCount, 0.02, 0.8), [sweepCount, sweepEnd, sweepStart]);
    const sweepSeries = React.useMemo(() => {
        try {
            const horizon = Math.max(0.2, Number(step) * Math.max(1, Number(steps)));

            if (solverMode === "single") {
                const entries = sweepValues.map((stepValue) => {
                    const iterationCount = Math.max(2, Math.round(horizon / stepValue));
                    const result = solveDifferentialEquation(derivative, Number(x0), Number(y0), stepValue, iterationCount);
                    const finalPoint = result[result.length - 1];
                    return {
                        x: stepValue,
                        heun: finalPoint?.heun ?? 0,
                        euler: finalPoint?.euler ?? 0,
                        gap: Math.abs((finalPoint?.heun ?? 0) - (finalPoint?.euler ?? 0)),
                    };
                });

                return {
                    title: "Step-size sweep",
                    description: "Bir xil horizon saqlangan holda qadam uzunligi Euler va Heun yakuniy estimate'iga qanday ta'sir qilishini ko'rsatadi.",
                    metricLabel: "h",
                    summary: entries,
                    plotSeries: [
                        { label: "Final Heun", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.heun })) },
                        { label: "Final Euler", color: "#f59e0b", points: entries.map((entry) => ({ x: entry.x, y: entry.euler })) },
                        { label: "Method gap", color: "#ef4444", points: entries.map((entry) => ({ x: entry.x, y: entry.gap })) },
                    ],
                };
            }

            const entries = sweepValues.map((stepValue) => {
                const expressions: Record<string, string> = { x: sysExpr1, y: sysExpr2 };
                if (sysExpr3.trim()) {
                    expressions.z = sysExpr3;
                }
                const initialValues: Record<string, number> = { x: Number(x0), y: Number(y0) };
                if (sysExpr3.trim()) {
                    initialValues.z = Number(z0);
                }
                const result = solveODESystem(expressions, initialValues, 0, horizon, stepValue);
                const finalPoint = result[result.length - 1];
                const radius = Math.sqrt(
                    (finalPoint?.vars.x || 0) ** 2 +
                    (finalPoint?.vars.y || 0) ** 2 +
                    (sysExpr3.trim() ? (finalPoint?.vars.z || 0) ** 2 : 0),
                );
                return {
                    x: stepValue,
                    xFinal: finalPoint?.vars.x || 0,
                    yFinal: finalPoint?.vars.y || 0,
                    radius,
                };
            });

            return {
                title: "Step-size sweep",
                description: "Bir xil horizon saqlangan holda qadam uzunligi system trajectory'ning yakuniy holatiga qanchalik ta'sir qilishini ko'rsatadi.",
                metricLabel: "h",
                summary: entries,
                plotSeries: [
                    { label: "Final x", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.xFinal })) },
                    { label: "Final y", color: "#14b8a6", points: entries.map((entry) => ({ x: entry.x, y: entry.yFinal })) },
                    { label: "State radius", color: "#8b5cf6", points: entries.map((entry) => ({ x: entry.x, y: entry.radius })) },
                ],
            };
        } catch {
            return null;
        }
    }, [derivative, solverMode, step, steps, sweepValues, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0]);
    const compareReportMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            const currentLastPoint = lastPoint as DifferentialPoint | null;
            const finalGap = currentLastPoint ? Math.abs(currentLastPoint.heun - currentLastPoint.euler) : null;
            const trendDelta = differentialPoints.length >= 2
                ? differentialPoints[differentialPoints.length - 1].heun - differentialPoints[0].heun
                : 0;
            const trendText = trendDelta > 0.02
                ? "trajectory yakunda yuqoriga ko'tarildi"
                : trendDelta < -0.02
                  ? "trajectory yakunda pasaydi"
                  : "trajectory deyarli bir xil darajada qoldi";
            const bestSweepEntry =
                sweepSeries &&
                sweepSeries.summary.length &&
                "gap" in sweepSeries.summary[0]
                    ? (sweepSeries.summary as Array<{ x: number; gap: number }>).reduce((best, entry) =>
                        entry.gap < best.gap ? entry : best,
                    )
                    : null;

            return [
                `- Current Heun/Euler yakuniy gap: **${formatMetric(finalGap, 6)}**; bu **${trendText}** deganini bildiradi.`,
                comparisonInsights.length
                    ? `- Compare deck xulosasi:\n${comparisonInsights.map((insight) => `  - ${insight}`).join("\n")}`
                    : "- Compare deck hozircha bo'sh. Birinchi scenario'ni snapshot qilib, keyin parametr yoki boshlang'ich shartni o'zgartirib overlay qiling.",
                bestSweepEntry
                    ? `- Step sweep ichida eng sokin nuqta: **h = ${formatMetric(bestSweepEntry.x, 4)}**, method gap **${formatMetric(bestSweepEntry.gap, 6)}**.`
                    : "- Step sweep hali tayyor emas, shuning uchun h bo'yicha eng barqaror zona topilmadi.",
            ].join("\n");
        }

        const firstPoint = systemPoints[0];
        const systemLastPoint = lastPoint as ODESystemPoint | null;
        const startRadius = firstPoint
            ? Math.sqrt((firstPoint.vars.x || 0) ** 2 + (firstPoint.vars.y || 0) ** 2 + (sysExpr3.trim() ? (firstPoint.vars.z || 0) ** 2 : 0))
            : 0;
        const endRadius = systemLastPoint
            ? Math.sqrt((systemLastPoint.vars.x || 0) ** 2 + (systemLastPoint.vars.y || 0) ** 2 + (sysExpr3.trim() ? (systemLastPoint.vars.z || 0) ** 2 : 0))
            : 0;
        const radiusTrend = endRadius < startRadius * 0.9
            ? "trajektoriya markazga yaqinlashmoqda"
            : endRadius > startRadius * 1.1
              ? "trajektoriya tashqariga yoyilmoqda"
              : "trajektoriya o'xshash radius diapazonida qolyapti";
        const bestSweepEntry =
            sweepSeries &&
            sweepSeries.summary.length &&
            "radius" in sweepSeries.summary[0]
                ? (sweepSeries.summary as Array<{ x: number; radius: number }>).reduce((best, entry) =>
                    entry.radius < best.radius ? entry : best,
                )
                : null;

        return [
            `- Start radius **${formatMetric(startRadius, 5)}**, final radius **${formatMetric(endRadius, 5)}**; bu **${radiusTrend}** degan signal beradi.`,
            comparisonInsights.length
                ? `- Compare deck xulosasi:\n${comparisonInsights.map((insight) => `  - ${insight}`).join("\n")}`
                : "- Compare deck hozircha bo'sh. Bir xil sistema uchun boshqa initial state yoki parametr bilan snapshot qo'shing.",
            bestSweepEntry
                ? `- Step sweep bo'yicha eng ixcham yakuniy holat **h = ${formatMetric(bestSweepEntry.x, 4)}** da, radius **${formatMetric(bestSweepEntry.radius, 5)}**.`
                : "- Step sweep hali tayyor emas, shuning uchun qaysi h eng ixcham trajectory bergani chiqarilmadi.",
        ].join("\n");
    }, [comparisonInsights, differentialPoints, lastPoint, solverMode, sweepSeries, sysExpr3, systemPoints]);
    const resultLevelCards = React.useMemo(() => {
        if (solverMode === "single") {
            const currentLastPoint = lastPoint as DifferentialPoint | null;
            const finalGap = currentLastPoint ? Math.abs(currentLastPoint.heun - currentLastPoint.euler) : null;
            const bestSweepEntry =
                sweepSeries &&
                sweepSeries.summary.length &&
                "gap" in sweepSeries.summary[0]
                    ? (sweepSeries.summary as Array<{ x: number; gap: number }>).reduce((best, entry) =>
                        entry.gap < best.gap ? entry : best,
                    )
                    : null;

            return [
                {
                    label: "Quick",
                    tone: "text-emerald-600",
                    summary: `Trajectory yakuni Heun=${formatMetric(currentLastPoint?.heun, 5)} va Euler farqi ${formatMetric(finalGap, 5)}.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Qadam h=${formatMetric(Number(step), 4)}, iter=${steps}, compare snapshot=${compatibleComparisons.length}.`,
                },
                {
                    label: "Research",
                    tone: "text-violet-600",
                    summary: bestSweepEntry
                        ? `Eng sokin h=${formatMetric(bestSweepEntry.x, 4)}; method gap=${formatMetric(bestSweepEntry.gap, 6)}.`
                        : "Hali eng sokin h aniqlanmadi; sweep orqali convergence zonani kuzatish kerak.",
                },
            ];
        }

        const systemLastPoint = lastPoint as ODESystemPoint | null;
        const finalRadius = systemLastPoint
            ? Math.sqrt((systemLastPoint.vars.x || 0) ** 2 + (systemLastPoint.vars.y || 0) ** 2 + (sysExpr3.trim() ? (systemLastPoint.vars.z || 0) ** 2 : 0))
            : null;
        const bestSweepEntry =
            sweepSeries &&
            sweepSeries.summary.length &&
            "radius" in sweepSeries.summary[0]
                ? (sweepSeries.summary as Array<{ x: number; radius: number }>).reduce((best, entry) =>
                    entry.radius < best.radius ? entry : best,
                )
                : null;

        return [
            {
                label: "Quick",
                tone: "text-emerald-600",
                summary: `Final state x=${formatMetric(systemLastPoint?.vars.x, 4)}, y=${formatMetric(systemLastPoint?.vars.y, 4)}${sysExpr3.trim() ? `, z=${formatMetric(systemLastPoint?.vars.z, 4)}` : ""}.`,
            },
            {
                label: "Technical",
                tone: "text-sky-600",
                summary: `Final radius ${formatMetric(finalRadius, 5)}, qadam h=${formatMetric(Number(step), 4)}, compare snapshot=${compatibleComparisons.length}.`,
            },
            {
                label: "Research",
                tone: "text-violet-600",
                summary: bestSweepEntry
                    ? `Eng ixcham yakuniy holat h=${formatMetric(bestSweepEntry.x, 4)} da, radius=${formatMetric(bestSweepEntry.radius, 6)}.`
                    : "Trajectory sensitivity uchun step sweep hali yetarli signal bermadi.",
            },
        ];
    }, [compatibleComparisons.length, lastPoint, solverMode, step, steps, sweepSeries, sysExpr3]);
    const reportSkeletonMarkdown = React.useMemo(() => {
        if (solverMode === "single") {
            const currentLastPoint = lastPoint as DifferentialPoint | null;
            const finalGap = currentLastPoint ? Math.abs(currentLastPoint.heun - currentLastPoint.euler) : null;

            return [
                "## Problem",
                `- Model: $\\frac{dy}{dx} = ${toTexExpression(derivative)}$`,
                `- Initial condition: $y(${formatMetric(Number(x0), 3)}) = ${formatMetric(Number(y0), 3)}$`,
                "",
                "## Method",
                `- Numerical scheme: Euler va Heun`,
                `- Step size: **${formatMetric(Number(step), 4)}**, iterations: **${steps}**`,
                "",
                "## Observation",
                `- Final Heun estimate: **${formatMetric(currentLastPoint?.heun, 6)}**`,
                `- Final method gap: **${formatMetric(finalGap, 6)}**`,
                comparisonInsights.length ? `- Compare deck: ${comparisonInsights[0]}` : "- Compare deck hali qo'llanmagan.",
                "",
                "## Interpretation",
                finalGap !== null && finalGap < 0.05
                    ? "- Hozirgi qadam tanlovi yechimni qo'pol buzmayapti va Heun reference sifatida ishonchli ko'rinadi."
                    : "- Method gap sezilarli; h ni kamaytirib yoki qo'shimcha sweep bilan yechimni qayta tekshirish kerak.",
                "",
                "## Export Notes",
                "- Writer ichiga trajectory preview, compare xulosasi va step sweep observation bilan yuborish tavsiya etiladi.",
            ].join("\n");
        }

        const systemLastPoint = lastPoint as ODESystemPoint | null;

        return [
            "## Problem",
            `- System: $\\dot{x}=${toTexExpression(sysExpr1)}$, $\\dot{y}=${toTexExpression(sysExpr2)}$${sysExpr3.trim() ? `, $\\dot{z}=${toTexExpression(sysExpr3)}$` : ""}`,
            `- Initial state: **x(0)=${formatMetric(Number(x0), 3)}**, **y(0)=${formatMetric(Number(y0), 3)}**${sysExpr3.trim() ? `, **z(0)=${formatMetric(Number(z0), 3)}**` : ""}`,
            "",
            "## Method",
            `- Numerical scheme: Heun-style predictor-corrector`,
            `- Step size: **${formatMetric(Number(step), 4)}**, iterations: **${steps}**`,
            "",
            "## Observation",
            `- Final state: **x=${formatMetric(systemLastPoint?.vars.x, 5)}**, **y=${formatMetric(systemLastPoint?.vars.y, 5)}**${sysExpr3.trim() ? `, **z=${formatMetric(systemLastPoint?.vars.z, 5)}**` : ""}`,
            comparisonInsights.length ? `- Compare deck: ${comparisonInsights[0]}` : "- Compare deck hali qo'llanmagan.",
            "",
            "## Interpretation",
            sysExpr3.trim()
                ? "- 3D trajectory attractor yoki divergent qatlam shaklini ko'rsatadi; compare deck sensitivity va yaqinlashishlarni ochadi."
                : "- Phase portrait orqali stable/unstable fokus yoki saddle xatti-harakatlarini ko'rish mumkin.",
            "",
            "## Export Notes",
            "- Writer uchun grafik bilan birga final state, compare report va explain mode qismini yuborish tavsiya etiladi.",
        ].join("\n");
    }, [comparisonInsights, derivative, lastPoint, solverMode, step, steps, sysExpr1, sysExpr2, sysExpr3, x0, y0, z0]);

    const comparison3DData = React.useMemo(() => {
        if (!isThreeDSystem) {
            return [] as Array<Record<string, unknown>>;
        }

        return [
            ...buildScatter3DTrajectoryData(systemPoints.map((point) => ({ x: point.vars.x || 0, y: point.vars.y || 0, z: point.vars.z || 0 })), {
                label: "Current trajectory",
                lineColor: "#2563eb",
                startColor: "#14b8a6",
                endColor: "#f59e0b",
                revealRatio: 1,
                maxSamples: 900,
                colorscale: [
                    [0, "#67e8f9"],
                    [0.45, "#3b82f6"],
                    [1, "#f59e0b"],
                ],
            }),
            ...compatibleComparisons.flatMap((scenario) =>
                buildScatter3DTrajectoryData(
                    scenario.systemPoints.map((point) => ({ x: point.vars.x || 0, y: point.vars.y || 0, z: point.vars.z || 0 })),
                    {
                        label: scenario.label,
                        lineColor: scenario.color,
                        startColor: scenario.color,
                        endColor: scenario.color,
                        maxSamples: 520,
                        colorscale: [
                            [0, "#e2e8f0"],
                            [1, scenario.color],
                        ],
                    },
                ),
            ),
        ];
    }, [compatibleComparisons, isThreeDSystem, systemPoints]);

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: !solverError && hasPoints,
        sourceLabel: "Differential Lab",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () =>
            buildDifferentialMarkdown({
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
        buildBlock: (targetId) =>
            buildDifferentialLivePayload({
                targetId,
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
        getDraftMeta: () => ({
            abstract: "Differensial laboratoriyadan eksport qilingan trajectory va parametrlar.",
            keywords: solverMode === "single" ? "differential,euler,heun" : "differential,ode-system,trajectory",
        }),
    });

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

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                {/* LEFT COLUMN: Input & Presets */}
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
                                {activeWorkflowTemplate ? (
                                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm leading-7 text-sky-800 dark:text-sky-200">
                                        <span className="font-black">{activeWorkflowTemplate.title}</span>: {activeWorkflowTemplate.description}
                                    </div>
                                ) : null}

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

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <LaboratoryMathPanel
                                        eyebrow="Rendered Problem"
                                        title="Masala va boshlang'ich shart"
                                        content={renderedProblemMarkdown}
                                    />
                                    <LaboratoryMathPanel
                                        eyebrow="Analysis Brief"
                                        title="Grafikdan tashqari qanday xulosa olinadi"
                                        content={analysisBriefMarkdown}
                                        accentClassName="text-sky-600"
                                    />
                                </div>
                                <LaboratoryMathPanel
                                    eyebrow="Step-by-step"
                                    title="Solver qadamlarining qisqa ochilishi"
                                    content={derivationMarkdown}
                                    accentClassName="text-violet-600"
                                />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") && (
                        <LaboratoryWorkflowTemplatePanel
                            templates={DIFFERENTIAL_WORKFLOW_TEMPLATES}
                            activeTemplateId={activeTemplateId}
                            onApply={applyWorkflowTemplate}
                        />
                    )}

                    {notebook.hasBlock("setup") && (
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
                    )}

                    <LaboratorySignalPanel
                        eyebrow="Solver Signals"
                        title="Domain va stability warnings"
                        items={warningSignals}
                    />

                    <div className="site-panel p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow text-accent">Parameter Sweep</div>
                                <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                    Qadam uzunligini yuritib, bir xil vaqt horizonida solver qanchalik sezgir ishlayotganini tekshiring.
                                </div>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-accent" />
                                step size h
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="site-outline-card p-4 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start</div>
                                <input value={sweepStart} onChange={(event) => setSweepStart(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                            </div>
                            <div className="site-outline-card p-4 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End</div>
                                <input value={sweepEnd} onChange={(event) => setSweepEnd(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                            </div>
                            <div className="site-outline-card p-4 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Samples</div>
                                <input value={sweepCount} onChange={(event) => setSweepCount(event.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                            </div>
                        </div>

                        {sweepSeries ? (
                            <>
                                <CartesianPlot title={sweepSeries.title} series={sweepSeries.plotSeries} />
                                <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-7 text-muted-foreground">
                                    {sweepSeries.description}
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {sweepSeries.summary.slice(0, 4).map((entry) => (
                                        <div key={`${sweepSeries.metricLabel}-${entry.x}`} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                {sweepSeries.metricLabel} = {formatMetric(entry.x, 4)}
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {"heun" in entry
                                                    ? `Heun ${formatMetric(entry.heun, 6)}, Euler ${formatMetric(entry.euler, 6)}, gap ${formatMetric(entry.gap, 6)}`
                                                    : `Final x ${formatMetric(entry.xFinal, 5)}, final y ${formatMetric(entry.yFinal, 5)}, radius ${formatMetric(entry.radius, 5)}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                                Sweep hisobini qurib bo&apos;lmadi. Step range yoki ifodalarni tekshirib ko&apos;ring.
                            </div>
                        )}
                    </div>

                    <div className="site-panel p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow text-accent">Comparison Deck</div>
                                <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                    Hozirgi scenario&apos;ni deck&apos;ka qo&apos;shib, bir grafikda bir nechta trajectory&apos;ni overlay qiling.
                                </div>
                            </div>
                            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {comparisonScenarios.length} snapshot
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={addCurrentScenarioToComparison}
                                disabled={!hasPoints || Boolean(solverError)}
                                className="inline-flex items-center rounded-2xl bg-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <GitCompareArrows className="mr-2 h-3.5 w-3.5" />
                                Snapshot qo&apos;shish
                            </button>
                            <button
                                type="button"
                                onClick={() => setComparisonScenarios([])}
                                disabled={!comparisonScenarios.length}
                                className="inline-flex items-center rounded-2xl border border-border/60 bg-background/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Deckni tozalash
                            </button>
                        </div>

                        {comparisonScenarios.length ? (
                            <div className="grid gap-3">
                                {comparisonScenarios.map((scenario) => {
                                    const isCompatible =
                                        scenario.solverMode === solverMode &&
                                        Boolean(scenario.sysExpr3.trim()) === Boolean(sysExpr3.trim());

                                    return (
                                        <div key={scenario.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scenario.color }} />
                                                        {isCompatible ? "active compare" : "mode mismatch"}
                                                    </div>
                                                    <div className="mt-2 truncate font-serif text-lg font-black text-foreground">{scenario.label}</div>
                                                    <div className="mt-1 text-xs leading-6 text-muted-foreground">
                                                        x0={scenario.x0}, y0={scenario.y0}{scenario.sysExpr3.trim() ? `, z0=${scenario.z0}` : ""}, h={scenario.step}, iter={scenario.steps}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setComparisonScenarios((current) => current.filter((item) => item.id !== scenario.id))}
                                                    className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                                                    title="Snapshotni o'chirish"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                                Hozircha compare snapshot yo&apos;q. Masalan birinchi logistic trajectory&apos;ni deck&apos;ka qo&apos;shib, keyin boshqa parametr bilan ikkinchi scenario&apos;ni overlay qiling.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Compare Report"
                            title="Taqqoslashdan olingan xulosa"
                            content={compareReportMarkdown}
                            accentClassName="text-emerald-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Bu grafik nimani anglatadi"
                            content={explainModeMarkdown}
                            accentClassName="text-fuchsia-600"
                        />
                    </div>

                    <LaboratoryResultLevelsPanel cards={resultLevelCards} />

                    <LaboratoryMathPanel
                        eyebrow="Report Skeleton"
                        title="Writer uchun yarim tayyor ilmiy bo'lim"
                        content={reportSkeletonMarkdown}
                        accentClassName="text-amber-600"
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryAnnotationsPanel
                            annotations={annotations}
                            annotationTitle={annotationTitle}
                            annotationNote={annotationNote}
                            setAnnotationTitle={setAnnotationTitle}
                            setAnnotationNote={setAnnotationNote}
                            onSave={addAnnotationFromCurrentResult}
                            onDelete={(id) => setAnnotations((current) => current.filter((entry) => entry.id !== id))}
                            saveDisabled={!hasPoints || Boolean(solverError)}
                            anchor={annotationAnchor}
                            description="Joriy trajectory bo'yicha note qoldiring va muhim observation'larni keyin writer'ga olib o'ting."
                            emptyMessage="Hozircha annotation yo'q. Grafikni kuzatib, joriy natijadan note saqlang."
                        />

                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Save Experiments</div>
                                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                        Qiziq scenario&apos;larni saqlab qo&apos;ying va keyin bir bosishda qayta yuklang.
                                    </div>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    {savedExperiments.length} saved
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <input
                                    value={experimentLabel}
                                    onChange={(event) => setExperimentLabel(event.target.value)}
                                    placeholder="Experiment label"
                                    className="h-11 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                                />
                                <button
                                    type="button"
                                    onClick={saveCurrentExperiment}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/60 bg-background/75 px-4 text-sm font-bold transition hover:border-accent/40 hover:text-accent"
                                >
                                    Joriy experimentni saqlash
                                </button>
                            </div>
                            <div className="grid gap-3">
                                {savedExperiments.length ? savedExperiments.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-black text-foreground">{item.label}</div>
                                                <div className="mt-1 text-xs leading-6 text-muted-foreground">
                                                    {item.solverMode === "single" ? `y'=${item.derivative}` : `${item.sysExpr3.trim() ? "3D" : "2D"} system`} · {new Date(item.savedAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSavedExperiments((current) => current.filter((entry) => entry.id !== item.id))}
                                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                                                title="Experimentni o'chirish"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => loadSavedExperiment(item)}
                                                className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90"
                                            >
                                                Qayta yuklash
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                                        Hozircha saved experiment yo&apos;q. Qiziq tenglama yoki sistema topilganda shu yerga saqlab boring.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Results & Viz */}
                <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
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
                                        <div className="space-y-2">
                                            <div className="site-eyebrow text-accent">Natija grafigi</div>
                                            <div className="inline-flex max-w-full items-center rounded-full border border-border/60 bg-background/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <span className="truncate">{currentScenarioLabel}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {solverMode === "system" && sysExpr3.trim() && (
                                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                                                    <Beaker className="mr-2 h-3 w-3" /> 3D trayektoriya
                                                </div>
                                            )}
                                            {isThreeDSystem ? (
                                                <div className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-700">
                                                    Gradient trail full
                                                </div>
                                            ) : null}
                                            {isThreeDSystem ? (
                                                <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                                                    Orbit drag active
                                                </div>
                                            ) : null}
                                            {isThreeDSystem && total3DPointLoad > 3600 ? (
                                                <div className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                    Decimated render
                                                </div>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={addCurrentScenarioToComparison}
                                                className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition hover:border-accent/40 hover:text-accent"
                                            >
                                                <GitCompareArrows className="mr-2 h-3.5 w-3.5" />
                                                Compare ga qo&apos;shish
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full">
                                        {solverMode === "single" ? (
                                            <CartesianPlot series={comparisonPlotSeries} title="Heun/Euler compare deck" />
                                        ) : (
                                            sysExpr3.trim() ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/45 px-4 py-3">
                                                        <div className="text-xs leading-6 text-muted-foreground text-[10px] font-medium italic">
                                                            3D attractor statik holda to&apos;liq chiziladi. Orbit drag bilan aylantirib ko&apos;rish ochiq.
                                                        </div>
                                                    </div>

                                                    <ScientificPlot
                                                        type="scatter3d"
                                                        title={`Trayektoriya deck: x(0)=${x0}, y(0)=${y0}, z(0)=${z0}`}
                                                        data={comparison3DData}
                                                        insights={["gradient trail", "camera presets", "projection trails", "interactive orbit"]}
                                                        layoutOverrides={{
                                                            scene: {
                                                                aspectmode: "cube",
                                                                camera: {
                                                                    eye: { x: 1.8, y: 1.45, z: 1.3 },
                                                                    center: { x: 0, y: 0, z: 0 },
                                                                    up: { x: 0, y: 0, z: 1 },
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <CartesianPlot
                                                    title="Fazoviy portret compare deck"
                                                    series={comparisonPlotSeries}
                                                />
                                            )
                                        )}
                                    </div>

                                    {comparisonInsights.length ? (
                                        <div className="grid gap-2 pt-2">
                                            {comparisonInsights.map((insight) => (
                                                <div key={insight} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-xs leading-6 text-muted-foreground italic font-serif">
                                                    {insight}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}

                    {lastPoint && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="site-eyebrow text-accent">Hisob xulosasi</div>
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
                                        h={step}, iter={steps}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("table") && hasPoints && (
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Hisob jadvali</div>
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
                                        {(solverMode === "single" ? differentialPoints : systemPoints).slice(0, 10).map((point, index) => (
                                            <tr key={`${solverMode}-${index}`} className="border-t border-border/40">
                                                <td className="px-4 py-3 font-mono text-[10px]">{index}</td>
                                                <td className="px-4 py-3 font-mono text-[10px]">{solverMode === "single" ? (point as DifferentialPoint).x : (point as ODESystemPoint).t}</td>
                                                {solverMode === "single" ? (
                                                    <>
                                                        <td className="px-4 py-3 font-mono text-[10px]">{(point as DifferentialPoint).euler}</td>
                                                        <td className="px-4 py-3 font-mono text-[10px]">{(point as DifferentialPoint).heun}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-mono text-[10px]">{(point as ODESystemPoint).vars.x}</td>
                                                        <td className="px-4 py-3 font-mono text-[10px]">{(point as ODESystemPoint).vars.y}</td>
                                                        {sysExpr3.trim() && <td className="px-4 py-3 font-mono text-[10px]">{(point as ODESystemPoint).vars.z}</td>}
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
