"use client";

import React from "react";
import { Activity, Box, Layers3, SlidersHorizontal, Sparkles, Trash2, Waves } from "lucide-react";
import { parse as parseMathExpression } from "mathjs";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { type LaboratoryAnnotationItem } from "@/components/laboratory/laboratory-annotations-panel";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryResultLevelsPanel } from "@/components/laboratory/laboratory-result-levels-panel";
import { LaboratorySignalPanel, type LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratoryWorkflowTemplatePanel } from "@/components/laboratory/laboratory-workflow-template-panel";
import { ScientificPlot, buildSurfaceData, buildVolumeData } from "@/components/laboratory/scientific-plot";
import { usePersistedLabCollection } from "@/components/laboratory/use-persisted-lab-collection";
import { LaboratoryNotebookEmptyState, LaboratoryNotebookToolbar, useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { LaboratoryBridgeCard } from "@/components/live-writer-bridge/laboratory-bridge-card";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { approximateIntegral, DoubleIntegralSummary, TripleIntegralSummary, approximateDoubleIntegral, approximateTripleIntegral, LABORATORY_PRESETS } from "@/components/laboratory/math-utils";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

const exportGuides = {
    copy: {
        badge: "Integral export",
        title: "Integral natijasini nusxa olish",
        description: "Integral hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Midpoint, trapezoid va Simpson natijalari bitta hisobotga yig'iladi.",
            "Function, interval va segment soni ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Integral natijasini writer'ga yuborish",
        description: "Integral hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Integral export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

type IntegralBlockId = "setup" | "bridge" | "analysis";
type IntegralMode = "single" | "double" | "triple";

const integralNotebookBlocks = [
    { id: "setup" as const, label: "Setup", description: "Integral input va metrics" },
    { id: "bridge" as const, label: "Writer Bridge", description: "Copy, send va live push" },
    { id: "analysis" as const, label: "Analysis", description: "Pro Visualization va method review" },
];

type SingleIntegralSummary = ReturnType<typeof approximateIntegral>;
type IntegralComputationSummary = SingleIntegralSummary | DoubleIntegralSummary | TripleIntegralSummary;

type IntegralAnnotation = LaboratoryAnnotationItem;

type IntegralSavedExperiment = {
    id: string;
    label: string;
    savedAt: string;
    mode: IntegralMode;
    expression: string;
    lower: string;
    upper: string;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
    segments: string;
    xResolution: string;
    yResolution: string;
    zResolution: string;
};

const integralPresetDescriptions: Record<string, string> = {
    "Gaussian Bell": "Silliq bir o'zgaruvchili integral. Simpson va boshqa metodlar farqini kuzatish uchun bazaviy misol.",
    "Oscillatory Fresnel Window": "Tebranish kuchli bo'lgan integral. Segment soni oshganda barqarorlikni tekshiradi.",
    "Damped Wave Packet": "Tebranish va pasayish birga ishlaydigan signalga o'xshash integral.",
    "Double Paraboloid": "Ikki o'zgaruvchili sirt integralining sodda bazaviy holati.",
    "Wave Interference Surface": "Murakkab reliefli sirt. X va Y bo'yicha profile kesimlarni tekshirish uchun qulay.",
    "Gaussian Ridge": "Sirtning musbat va manfiy zonalari integral qiymatiga qanday ta'sir qilishini ko'rsatadi.",
    "Saddle Surface": "Kompensatsiyalanadigan zonalari bor klassik saddle case.",
    "Sphere Volume (Triple)": "Triple integral oqimini tekshiradigan eng sodda volume test-case.",
    "Radial Energy Cloud": "Markazdan chetga pasayadigan 3D density.",
    "Wave Density Cube": "3D volumeda tebranadigan density maydoni.",
};

const INTEGRAL_WORKFLOW_TEMPLATES = [
    {
        id: "convergence-check",
        title: "Convergence Check",
        description: "Single integral uchun Simpson, midpoint va trapezoid convergence'ini tizimli tekshiradi.",
        presetLabel: "Oscillatory Fresnel Window",
        blocks: ["setup", "analysis", "bridge"] as const,
        sweep: { start: "10", end: "80", count: "5" },
    },
    {
        id: "surface-accumulation-study",
        title: "Surface Accumulation Study",
        description: "2D sirtning qaysi yo'nalishi integralga ko'proq ta'sir qilishini profil kesimlar bilan ochadi.",
        presetLabel: "Wave Interference Surface",
        blocks: ["setup", "analysis", "bridge"] as const,
        sweep: { start: "10", end: "40", count: "4" },
    },
    {
        id: "saddle-balance-review",
        title: "Saddle Balance Review",
        description: "Musbat va manfiy regionlar kompensatsiyasini saddle surface ustida tekshiradi.",
        presetLabel: "Saddle Surface",
        blocks: ["setup", "analysis"] as const,
        sweep: { start: "8", end: "32", count: "4" },
    },
    {
        id: "volume-density-audit",
        title: "Volume Density Audit",
        description: "3D density cloud, voxel hajmi va grid sensitivity orqali volumetric audit beradi.",
        presetLabel: "Radial Energy Cloud",
        blocks: ["setup", "analysis", "bridge"] as const,
        sweep: { start: "6", end: "20", count: "4" },
    },
] as const;

function formatMetric(value: number | null | undefined, digits = 6) {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function toTexExpression(expression: string) {
    try {
        return parseMathExpression(expression).toTex({ parenthesis: "keep" });
    } catch {
        return `\\texttt{${expression.replace(/\\/g, "\\\\").replace(/([{}_#$%&])/g, "\\$1")}}`;
    }
}

function generateSweepValues(startText: string, endText: string, countText: string, min: number, max: number) {
    const start = clampInteger(startText, min, min, max);
    const end = clampInteger(endText, Math.min(max, start + 20), min, max);
    const count = clampInteger(countText, 4, 2, 6);
    const actualStart = Math.min(start, end);
    const actualEnd = Math.max(start, end);
    const step = count === 1 ? 0 : (actualEnd - actualStart) / Math.max(1, count - 1);
    const values = Array.from({ length: count }, (_, index) => Math.round(actualStart + step * index));
    return Array.from(new Set(values.map((value) => Math.min(max, Math.max(min, value))))).sort((left, right) => left - right);
}

function clampInteger(value: string, fallback: number, min: number, max: number) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
}

function buildAveragedProfile(
    samples: Array<{ x: number; y: number; z?: number; value?: number }>,
    axis: "x" | "y" | "z",
    valueKey: "z" | "value",
) {
    const buckets = new Map<number, { sum: number; count: number }>();

    samples.forEach((sample) => {
        const axisValue = sample[axis];
        const targetValue = sample[valueKey];
        if (typeof axisValue !== "number" || typeof targetValue !== "number" || !Number.isFinite(axisValue) || !Number.isFinite(targetValue)) {
            return;
        }

        const key = Number(axisValue.toFixed(4));
        const current = buckets.get(key) || { sum: 0, count: 0 };
        current.sum += targetValue;
        current.count += 1;
        buckets.set(key, current);
    });

    return Array.from(buckets.entries())
        .sort((left, right) => left[0] - right[0])
        .map(([x, bucket]) => ({ x, y: bucket.sum / bucket.count }));
}

function buildIntegralMarkdown(params: {
    mode: IntegralMode;
    expression: string;
    lower: number;
    upper: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
    segmentsUsed: number;
    xResolution: number;
    yResolution: number;
    zResolution: number;
    summary: IntegralComputationSummary;
}) {
    const { mode, expression, lower, upper, xMin, xMax, yMin, yMax, zMin, zMax, segmentsUsed, xResolution, yResolution, zResolution, summary } = params;

    if (mode === "single") {
        const singleSummary = summary as SingleIntegralSummary;
        const spread = Math.max(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson) - Math.min(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson);

        return `## Laboratory Export: Integral Studio

### Problem
- Function: \`${expression}\`
- Interval: [${formatMetric(lower, 4)}, ${formatMetric(upper, 4)}]
- Segments: ${segmentsUsed}

### Numerical Estimates
- Simpson: ${formatMetric(singleSummary.simpson, 6)}
- Midpoint: ${formatMetric(singleSummary.midpoint, 6)}
- Trapezoid: ${formatMetric(singleSummary.trapezoid, 6)}
- Method spread: ${formatMetric(spread, 6)}`;
    }

    if (mode === "double") {
        const doubleSummary = summary as DoubleIntegralSummary;
        return `## Laboratory Export: Double Integral Studio

### Problem
- Function: \`${expression}\`
- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]
- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]
- Grid: ${xResolution} x ${yResolution}

### Numerical Estimate
- Integral value: ${formatMetric(doubleSummary.value, 8)}
- Sample count: ${doubleSummary.samples.length}`;
    }

    const tripleSummary = summary as TripleIntegralSummary;
    return `## Laboratory Export: Triple Integral Studio

### Problem
- Function: \`${expression}\`
- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]
- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]
- Z domain: [${formatMetric(zMin, 4)}, ${formatMetric(zMax, 4)}]
- Grid: ${xResolution} x ${yResolution} x ${zResolution}

### Numerical Estimate
- Integral value: ${formatMetric(tripleSummary.value, 8)}
- Sparse sample count: ${tripleSummary.samples.length}`;
}

function buildIntegralLivePayload(params: {
    targetId: string;
    mode: IntegralMode;
    expression: string;
    lower: number;
    upper: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
    segmentsUsed: number;
    xResolution: number;
    yResolution: number;
    zResolution: number;
    summary: IntegralComputationSummary;
}): WriterBridgeBlockData {
    const { targetId, mode, expression, lower, upper, xMin, xMax, yMin, yMax, zMin, zMax, segmentsUsed, xResolution, yResolution, zResolution, summary } = params;

    if (mode === "single") {
        const singleSummary = summary as SingleIntegralSummary;
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "integral-studio",
            kind: "integral",
            title: `Integral study: ${expression}`,
            summary: "Laboratoriyadan live yuborilgan single integral hisoboti.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "Lower", value: formatMetric(lower, 4) },
                { label: "Upper", value: formatMetric(upper, 4) },
                { label: "Segments", value: String(segmentsUsed) },
                { label: "Simpson", value: formatMetric(singleSummary.simpson, 6) },
            ],
            notes: [`Function: ${expression}`],
            plotSeries: [{ label: "f(x)", color: "#2563eb", points: singleSummary.samples }],
        };
    }

    if (mode === "double") {
        const doubleSummary = summary as DoubleIntegralSummary;
        const xProfile = buildAveragedProfile(doubleSummary.samples, "x", "z");
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "integral-studio",
            kind: "double-integral",
            title: `Double integral: ${expression}`,
            summary: "Surface integral laboratoriyadan eksport qilindi.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "Value", value: formatMetric(doubleSummary.value, 8) },
                { label: "Grid", value: `${xResolution}x${yResolution}` },
                { label: "X span", value: `${formatMetric(xMin, 3)}..${formatMetric(xMax, 3)}` },
                { label: "Y span", value: `${formatMetric(yMin, 3)}..${formatMetric(yMax, 3)}` },
            ],
            notes: [`Function: ${expression}`, `Samples: ${doubleSummary.samples.length}`],
            plotSeries: [{ label: "x-average height", color: "#2563eb", points: xProfile }],
        };
    }

    const tripleSummary = summary as TripleIntegralSummary;
    const xProfile = buildAveragedProfile(tripleSummary.samples, "x", "value");
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "integral-studio",
        kind: "triple-integral",
        title: `Triple integral: ${expression}`,
        summary: "Volumetric integral laboratoriyadan eksport qilindi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Value", value: formatMetric(tripleSummary.value, 8) },
            { label: "Grid", value: `${xResolution}x${yResolution}x${zResolution}` },
            { label: "X span", value: `${formatMetric(xMin, 3)}..${formatMetric(xMax, 3)}` },
            { label: "Z span", value: `${formatMetric(zMin, 3)}..${formatMetric(zMax, 3)}` },
        ],
        notes: [`Function: ${expression}`, `Sparse samples: ${tripleSummary.samples.length}`, `Y span: ${formatMetric(yMin, 3)}..${formatMetric(yMax, 3)}`],
        plotSeries: [{ label: "x-average density", color: "#7c3aed", points: xProfile }],
    };
}

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const [mode, setMode] = React.useState<IntegralMode>("single");
    const [expression, setExpression] = React.useState(String(module.config?.defaultExpression || "sin(x) + x^2 / 5"));
    const [lower, setLower] = React.useState("0");
    const [upper, setUpper] = React.useState("3.14");
    const [xMin, setXMin] = React.useState("0");
    const [xMax, setXMax] = React.useState("1");
    const [yMin, setYMin] = React.useState("0");
    const [yMax, setYMax] = React.useState("1");
    const [zMin, setZMin] = React.useState("0");
    const [zMax, setZMax] = React.useState("1");

    const [segments, setSegments] = React.useState(String(module.config?.defaultSegments || 24));
    const [xResolution, setXResolution] = React.useState("28");
    const [yResolution, setYResolution] = React.useState("28");
    const [zResolution, setZResolution] = React.useState("12");
    const [sweepStart, setSweepStart] = React.useState("8");
    const [sweepEnd, setSweepEnd] = React.useState("48");
    const [sweepCount, setSweepCount] = React.useState("4");
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [annotations, setAnnotations] = usePersistedLabCollection<IntegralAnnotation>("mathsphere-lab-integral-annotations");
    const [savedExperiments, setSavedExperiments] = usePersistedLabCollection<IntegralSavedExperiment>("mathsphere-lab-integral-experiments");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);

    const notebook = useLaboratoryNotebook<IntegralBlockId>({
        storageKey: "mathsphere-lab-integral-notebook",
        definitions: integralNotebookBlocks,
        defaultBlocks: ["setup", "analysis"],
    });

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const normalizedSegments = clampInteger(segments, 24, 4, 400);
    const normalizedXResolution = clampInteger(xResolution, 28, 6, 72);
    const normalizedYResolution = clampInteger(yResolution, 28, 6, 72);
    const normalizedZResolution = clampInteger(zResolution, 12, 4, 28);

    const solverState = React.useMemo(() => {
        try {
            if (mode === "single") {
                return {
                    error: "",
                    summary: approximateIntegral(expression, Number(lower), Number(upper), normalizedSegments) as IntegralComputationSummary,
                };
            }

            if (mode === "double") {
                return {
                    error: "",
                    summary: approximateDoubleIntegral(
                        expression,
                        Number(xMin),
                        Number(xMax),
                        Number(yMin),
                        Number(yMax),
                        normalizedXResolution,
                        normalizedYResolution,
                    ) as IntegralComputationSummary,
                };
            }

            return {
                error: "",
                summary: approximateTripleIntegral(
                    expression,
                    Number(xMin),
                    Number(xMax),
                    Number(yMin),
                    Number(yMax),
                    Number(zMin),
                    Number(zMax),
                    normalizedXResolution,
                    normalizedYResolution,
                    normalizedZResolution,
                ) as IntegralComputationSummary,
            };
        } catch (errorValue: unknown) {
            return {
                error: errorValue instanceof Error ? errorValue.message : "Integral solver failed.",
                summary: null,
            };
        }
    }, [expression, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const error = solverState.error;
    const summary = solverState.summary;
    const applyPreset = (preset: (typeof LABORATORY_PRESETS.integral)[number]) => {
        setActiveTemplateId(null);
        setMode(preset.mode as IntegralMode);
        setExpression(preset.expr || "sin(x) + x^2 / 5");
        if (preset.mode === "single") {
            setLower(preset.lower || "0");
            setUpper(preset.upper || "1");
            if ("segments" in preset && preset.segments) {
                setSegments(String(preset.segments));
            }
        } else {
            const bx = JSON.parse(preset.x || "[0,1]") as [number, number];
            const by = JSON.parse(preset.y || "[0,1]") as [number, number];
            setXMin(String(bx[0])); setXMax(String(bx[1]));
            setYMin(String(by[0])); setYMax(String(by[1]));
            if ("nx" in preset && preset.nx) {
                setXResolution(String(preset.nx));
            }
            if ("ny" in preset && preset.ny) {
                setYResolution(String(preset.ny));
            }
            if (preset.z) {
                const bz = JSON.parse(preset.z) as [number, number];
                setZMin(String(bz[0])); setZMax(String(bz[1]));
                if ("nz" in preset && preset.nz) {
                    setZResolution(String(preset.nz));
                }
            }
        }
    };
    const applyWorkflowTemplate = (templateId: string) => {
        const template = INTEGRAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) {
            return;
        }

        const preset = LABORATORY_PRESETS.integral.find((item) => item.label === template.presetLabel);
        if (preset) {
            applyPreset(preset);
        }
        setSweepStart(template.sweep.start);
        setSweepEnd(template.sweep.end);
        setSweepCount(template.sweep.count);
        notebook.setBlocks(template.blocks);
        setActiveTemplateId(template.id);
    };

    const activePreset = React.useMemo(
        () =>
            LABORATORY_PRESETS.integral.find((preset) => {
                if (preset.mode !== mode || preset.expr !== expression) {
                    return false;
                }

                if (mode === "single") {
                    return preset.lower === lower && preset.upper === upper;
                }

                return true;
            }),
        [expression, lower, mode, upper],
    );
    const activePresetDescription = activePreset ? integralPresetDescriptions[activePreset.label] : "";
    const activeWorkflowTemplate = INTEGRAL_WORKFLOW_TEMPLATES.find((template) => template.id === activeTemplateId) || null;

    const singleDiagnostics = React.useMemo(() => {
        if (mode !== "single" || !summary) {
            return null;
        }

        const singleSummary = summary as SingleIntegralSummary;
        const spread = Math.max(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson) - Math.min(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson);
        const baseline = Math.max(1e-6, Math.abs(singleSummary.simpson));
        const relativeSpread = spread / baseline;
        const stability = relativeSpread < 0.015 ? "Stable" : relativeSpread < 0.06 ? "Watch" : "Rough";

        return {
            spread,
            relativeSpread,
            stability,
        };
    }, [mode, summary]);

    const doubleProfiles = React.useMemo(() => {
        if (mode !== "double" || !summary) {
            return null;
        }

        const doubleSummary = summary as DoubleIntegralSummary;
        return {
            xProfile: buildAveragedProfile(doubleSummary.samples, "x", "z"),
            yProfile: buildAveragedProfile(doubleSummary.samples, "y", "z"),
        };
    }, [mode, summary]);

    const doubleDiagnostics = React.useMemo(() => {
        if (mode !== "double" || !summary) {
            return null;
        }

        const doubleSummary = summary as DoubleIntegralSummary;
        const zValues = doubleSummary.samples.map((sample) => sample.z);
        const peak = zValues.length ? Math.max(...zValues.map((value) => Math.abs(value))) : 0;
        const mean = zValues.length ? zValues.reduce((sum, value) => sum + value, 0) / zValues.length : 0;

        return {
            gridCells: normalizedXResolution * normalizedYResolution,
            sampleCount: doubleSummary.samples.length,
            peak,
            mean,
        };
    }, [mode, normalizedXResolution, normalizedYResolution, summary]);

    const tripleProfile = React.useMemo(() => {
        if (mode !== "triple" || !summary) {
            return null;
        }

        return buildAveragedProfile((summary as TripleIntegralSummary).samples, "x", "value");
    }, [mode, summary]);

    const tripleDiagnostics = React.useMemo(() => {
        if (mode !== "triple" || !summary) {
            return null;
        }

        const tripleSummary = summary as TripleIntegralSummary;
        const values = tripleSummary.samples.map((sample) => sample.value);
        const peak = values.length ? Math.max(...values.map((value) => Math.abs(value))) : 0;
        const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        const voxelVolume =
            ((Number(xMax) - Number(xMin)) / normalizedXResolution) *
            ((Number(yMax) - Number(yMin)) / normalizedYResolution) *
            ((Number(zMax) - Number(zMin)) / normalizedZResolution);

        return {
            gridCells: normalizedXResolution * normalizedYResolution * normalizedZResolution,
            sampleCount: tripleSummary.samples.length,
            peak,
            mean,
            voxelVolume,
        };
    }, [mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, summary, xMax, xMin, yMax, yMin, zMax, zMin]);

    const renderedProblemMarkdown = React.useMemo(() => {
        const texExpression = toTexExpression(expression);

        if (mode === "single") {
            return [
                "$$",
                `f(x) = ${texExpression}`,
                "$$",
                "$$",
                `\\int_{${formatMetric(Number(lower), 3)}}^{${formatMetric(Number(upper), 3)}} f(x)\\,dx`,
                "$$",
                `- Segment count: **${normalizedSegments}**`,
                "- Goal: integral qiymatini Simpson, midpoint va trapezoid bilan solishtirish.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
                "$$",
                `f(x,y) = ${texExpression}`,
                "$$",
                "$$",
                `\\iint_{[${formatMetric(Number(xMin), 2)}, ${formatMetric(Number(xMax), 2)}] \\times [${formatMetric(Number(yMin), 2)}, ${formatMetric(Number(yMax), 2)}]} f(x,y)\\,dA`,
                "$$",
                `- Grid: **${normalizedXResolution} x ${normalizedYResolution}**`,
                "- Goal: sirt ostidagi umumiy yig'ilishni va profil kesimlarni ko'rish.",
            ].join("\n");
        }

        return [
            "$$",
            `f(x,y,z) = ${texExpression}`,
            "$$",
            "$$",
            `\\iiint_{[${formatMetric(Number(xMin), 2)}, ${formatMetric(Number(xMax), 2)}] \\times [${formatMetric(Number(yMin), 2)}, ${formatMetric(Number(yMax), 2)}] \\times [${formatMetric(Number(zMin), 2)}, ${formatMetric(Number(zMax), 2)}]} f(x,y,z)\\,dV`,
            "$$",
            `- Grid: **${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}**`,
            "- Goal: volumetric density, peak zone va x-average profilni tahlil qilish.",
        ].join("\n");
    }, [expression, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const analysisBriefMarkdown = React.useMemo(() => {
        if (mode === "single") {
            return [
                "- Solver bu yerda **numerical estimate** beradi, closed-form antiderivative emas.",
                `- Hozirgi holatda asosiy reference: **Simpson = ${formatMetric((summary as SingleIntegralSummary | null)?.simpson, 6)}**.`,
                `- Method spread: **${formatMetric(singleDiagnostics?.spread, 6)}**, stability: **${singleDiagnostics?.stability || "--"}**.`,
                "- Grafikdan tashqari qaraladigan narsa: metodlar orasidagi farq, oscillation sensitivity va segment ta'siri.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
                `- Current estimate: **${formatMetric((summary as DoubleIntegralSummary | null)?.value, 8)}**.`,
                `- Grid cells: **${doubleDiagnostics?.gridCells || 0}**, peak height: **${formatMetric(doubleDiagnostics?.peak, 4)}**.`,
                "- Grafik faqat sirtni ko'rsatmaydi, x-average va y-average profillar orqali struktura ochiladi.",
                "- Tahlil nuqtasi: qaysi zonalar integralga musbat yoki manfiy ulush qo'shayapti.",
            ].join("\n");
        }

        return [
            `- Current estimate: **${formatMetric((summary as TripleIntegralSummary | null)?.value, 8)}**.`,
            `- Sparse cloud sample count: **${(summary as TripleIntegralSummary | null)?.samples.length || 0}**.`,
            `- Peak density: **${formatMetric(tripleDiagnostics?.peak, 4)}**, voxel volume: **${formatMetric(tripleDiagnostics?.voxelVolume, 4)}**.`,
            "- Tahlil nuqtasi: volumeda zichlik qayerda to'planmoqda va x bo'yicha qanday profil hosil bo'lyapti.",
        ].join("\n");
    }, [doubleDiagnostics?.gridCells, doubleDiagnostics?.peak, mode, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.peak, tripleDiagnostics?.voxelVolume]);

    const derivationMarkdown = React.useMemo(() => {
        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary | null;
            const samplePreview = (singleSummary?.samples || [])
                .slice(0, 4)
                .map((point, index) => `${index + 1}. x = ${formatMetric(point.x, 4)}, f(x) = ${formatMetric(point.y, 6)}`)
                .join("\n");

            return [
                "**Method flow**",
                "",
                "$$",
                "\\text{Midpoint: } \\sum f(x_i^*)\\,\\Delta x",
                "$$",
                "$$",
                "\\text{Trapezoid: } \\frac{\\Delta x}{2}\\left(f(x_0) + 2\\sum f(x_i) + f(x_n)\\right)",
                "$$",
                "$$",
                "\\text{Simpson: } \\frac{\\Delta x}{3}\\left(f(x_0)+4\\sum f(x_{odd})+2\\sum f(x_{even})+f(x_n)\\right)",
                "$$",
                `- Interval width: **${formatMetric(Number(upper) - Number(lower), 4)}**`,
                `- Step width estimate: **${formatMetric((Number(upper) - Number(lower)) / normalizedSegments, 6)}**`,
                samplePreview ? `- First sample preview:\n${samplePreview}` : "- Sample preview hozircha mavjud emas.",
            ].join("\n");
        }

        if (mode === "double") {
            const doubleSummary = summary as DoubleIntegralSummary | null;
            const samplePreview = (doubleSummary?.samples || [])
                .slice(0, 4)
                .map((point, index) => `${index + 1}. (x, y) = (${formatMetric(point.x, 3)}, ${formatMetric(point.y, 3)}), z = ${formatMetric(point.z, 5)}`)
                .join("\n");

            return [
                "**Method flow**",
                "",
                "$$",
                "\\iint_R f(x,y)\\,dA \\approx \\sum f(x_i,y_j)\\,\\Delta x\\,\\Delta y",
                "$$",
                `- \\(\\Delta x\\) = **${formatMetric((Number(xMax) - Number(xMin)) / normalizedXResolution, 5)}**`,
                `- \\(\\Delta y\\) = **${formatMetric((Number(yMax) - Number(yMin)) / normalizedYResolution, 5)}**`,
                `- Grid cells: **${normalizedXResolution * normalizedYResolution}**`,
                samplePreview ? `- First sampled surface points:\n${samplePreview}` : "- Surface sample preview hozircha mavjud emas.",
            ].join("\n");
        }

        const tripleSummary = summary as TripleIntegralSummary | null;
        const samplePreview = (tripleSummary?.samples || [])
            .slice(0, 4)
            .map((point, index) => `${index + 1}. (x, y, z) = (${formatMetric(point.x, 2)}, ${formatMetric(point.y, 2)}, ${formatMetric(point.z, 2)}), value = ${formatMetric(point.value, 5)}`)
            .join("\n");

        return [
            "**Method flow**",
            "",
            "$$",
            "\\iiint_V f(x,y,z)\\,dV \\approx \\sum f(x_i,y_j,z_k)\\,\\Delta x\\,\\Delta y\\,\\Delta z",
            "$$",
            `- \\(\\Delta x\\) = **${formatMetric((Number(xMax) - Number(xMin)) / normalizedXResolution, 5)}**`,
            `- \\(\\Delta y\\) = **${formatMetric((Number(yMax) - Number(yMin)) / normalizedYResolution, 5)}**`,
            `- \\(\\Delta z\\) = **${formatMetric((Number(zMax) - Number(zMin)) / normalizedZResolution, 5)}**`,
            samplePreview ? `- First sparse volume samples:\n${samplePreview}` : "- Volume sample preview hozircha mavjud emas.",
        ].join("\n");
    }, [mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, summary, upper, lower, xMax, xMin, yMax, yMin, zMax, zMin]);

    const warningSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        const expressionLooksSensitive = /(\/|sqrt|log|tan)/i.test(expression);

        if (mode === "single") {
            if (normalizedSegments < 12) {
                signals.push({
                    tone: "warn",
                    label: "Coarse Partition",
                    text: "Segment soni past. Oscillatory yoki keskin egri funksiyada midpoint/trapezoid/Simpson farqi kattalashishi mumkin.",
                });
            }
            if ((singleDiagnostics?.relativeSpread || 0) > 0.06) {
                signals.push({
                    tone: "danger",
                    label: "Method Divergence",
                    text: `Method spread ${formatMetric(singleDiagnostics ? singleDiagnostics.relativeSpread * 100 : null, 2)}% atrofida. Bu interval yoki segmentlar hozircha barqaror emasligini ko'rsatadi.`,
                });
            }
            if (normalizedSegments > 180) {
                signals.push({
                    tone: "info",
                    label: "Heavy Sampling",
                    text: "Segment soni juda katta. Natija silliqroq bo'ladi, lekin qayta hisoblash narxi oshadi.",
                });
            }
        } else if (mode === "double") {
            if (normalizedXResolution < 14 || normalizedYResolution < 14) {
                signals.push({
                    tone: "warn",
                    label: "Coarse Grid",
                    text: "2D grid siyrak. Surface relief va profil kesimlar qo'pol ko'rinishi mumkin.",
                });
            }
            if ((doubleDiagnostics?.gridCells || 0) > 2200) {
                signals.push({
                    tone: "info",
                    label: "Dense Surface",
                    text: "Grid cell soni katta. Sirt detali kuchliroq, lekin solver va render og'irlashadi.",
                });
            }
            if ((doubleDiagnostics?.peak || 0) > Math.max(1, Math.abs(doubleDiagnostics?.mean || 0) * 6)) {
                signals.push({
                    tone: "warn",
                    label: "Steep Surface",
                    text: "Peak height mean heightdan ancha katta. Integral qiymati lokal cho'qqilar ta'siriga sezgir bo'lishi mumkin.",
                });
            }
        } else {
            if (normalizedXResolution < 10 || normalizedYResolution < 10 || normalizedZResolution < 6) {
                signals.push({
                    tone: "warn",
                    label: "Sparse Volume",
                    text: "3D grid siyrak. Density cloud faqat umumiy trendni ko'rsatadi, lokal struktura yo'qolishi mumkin.",
                });
            }
            if ((tripleDiagnostics?.gridCells || 0) > 24000) {
                signals.push({
                    tone: "info",
                    label: "Heavy Volume",
                    text: "Volume grid ancha katta. Solver natijasi boyroq, lekin interaktivlik pasayishi mumkin.",
                });
            }
            if ((tripleDiagnostics?.peak || 0) > Math.max(1, Math.abs(tripleDiagnostics?.mean || 0) * 8)) {
                signals.push({
                    tone: "warn",
                    label: "Concentrated Density",
                    text: "Peak density mean'dan juda katta. Integral qiymati kichik lokal region ta'sirida dominant bo'lishi mumkin.",
                });
            }
        }

        if (expressionLooksSensitive) {
            signals.push({
                tone: "info",
                label: "Domain Sensitivity",
                text: "Ifoda ichida bo'linish yoki log/sqrt/tan bor. Kiritilgan intervalda singularity yoki keskin o'zgarish bo'lishi mumkin.",
            });
        }

        if (!signals.length) {
            signals.push({
                tone: "neutral",
                label: "Stable Setup",
                text: "Hozirgi parametrlar basic tahlil uchun sog'lom ko'rinmoqda. Endi sweep yoki compare bilan sezgirlikni tekshirish mumkin.",
            });
        }

        return signals;
    }, [doubleDiagnostics?.gridCells, doubleDiagnostics?.mean, doubleDiagnostics?.peak, expression, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, tripleDiagnostics?.gridCells, tripleDiagnostics?.mean, tripleDiagnostics?.peak]);

    const sweepValues = React.useMemo(() => generateSweepValues(sweepStart, sweepEnd, sweepCount, mode === "triple" ? 6 : 4, mode === "single" ? 180 : mode === "double" ? 52 : 24), [mode, sweepCount, sweepEnd, sweepStart]);
    const sweepSeries = React.useMemo(() => {
        try {
            if (mode === "single") {
                const entries = sweepValues.map((segmentsValue) => {
                    const result = approximateIntegral(expression, Number(lower), Number(upper), segmentsValue);
                    return {
                        x: segmentsValue,
                        simpson: result.simpson,
                        midpoint: result.midpoint,
                        trapezoid: result.trapezoid,
                    };
                });

                return {
                    title: "Segment sweep",
                    description: "Segment soni oshganda estimate qanday barqarorlashayotganini ko'ring.",
                    metricLabel: "segments",
                    summary: entries,
                    plotSeries: [
                        { label: "Simpson", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.simpson })) },
                        { label: "Midpoint", color: "#14b8a6", points: entries.map((entry) => ({ x: entry.x, y: entry.midpoint })) },
                        { label: "Trapezoid", color: "#f59e0b", points: entries.map((entry) => ({ x: entry.x, y: entry.trapezoid })) },
                    ],
                };
            }

            if (mode === "double") {
                const entries = sweepValues.map((gridValue) => {
                    const result = approximateDoubleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), gridValue, gridValue);
                    return {
                        x: gridValue,
                        estimate: result.value,
                        sampleCount: result.samples.length,
                    };
                });

                return {
                    title: "Grid sweep",
                    description: "2D surface estimate grid zichligiga qanchalik sezgirligini ko'rsatadi.",
                    metricLabel: "grid",
                    summary: entries,
                    plotSeries: [{ label: "Integral estimate", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.estimate })) }],
                };
            }

            const entries = sweepValues.map((gridValue) => {
                const zGrid = Math.max(4, Math.min(28, Math.round(gridValue / 2)));
                const result = approximateTripleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), Number(zMin), Number(zMax), gridValue, gridValue, zGrid);
                return {
                    x: gridValue,
                    estimate: result.value,
                    sampleCount: result.samples.length,
                    zGrid,
                };
            });

            return {
                title: "Volume sweep",
                description: "3D estimate x/y grid va z grid zichligiga qanchalik bog'liqligini ko'rsatadi.",
                metricLabel: "grid",
                summary: entries,
                plotSeries: [{ label: "Integral estimate", color: "#7c3aed", points: entries.map((entry) => ({ x: entry.x, y: entry.estimate })) }],
            };
        } catch {
            return null;
        }
    }, [expression, lower, mode, sweepValues, upper, xMax, xMin, yMax, yMin, zMax, zMin]);
    const compareReportMarkdown = React.useMemo(() => {
        if (!summary) {
            return "- Solver natijasi chiqmaguncha compare report qurilmaydi.";
        }

        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary;
            const rankedMethods = [
                { label: "Simpson", value: singleSummary.simpson, delta: 0 },
                { label: "Midpoint", value: singleSummary.midpoint, delta: Math.abs(singleSummary.midpoint - singleSummary.simpson) },
                { label: "Trapezoid", value: singleSummary.trapezoid, delta: Math.abs(singleSummary.trapezoid - singleSummary.simpson) },
            ].sort((left, right) => left.delta - right.delta);
            const sweepDrift =
                sweepSeries &&
                sweepSeries.summary.length > 1 &&
                "simpson" in sweepSeries.summary[0]
                    ? Math.abs(
                        (sweepSeries.summary[sweepSeries.summary.length - 1] as { simpson: number }).simpson -
                        (sweepSeries.summary[0] as { simpson: number }).simpson,
                    )
                    : null;

            return [
                `- Reference estimate: **Simpson = ${formatMetric(singleSummary.simpson, 6)}**.`,
                `- Simpson'ga eng yaqin metod: **${rankedMethods[0].label}**, farqi **${formatMetric(rankedMethods[0].delta, 6)}**.`,
                `- Method spread umumiy: **${formatMetric(singleDiagnostics?.spread, 6)}**; stability holati **${singleDiagnostics?.stability || "--"}**.`,
                sweepDrift !== null
                    ? `- Segment sweep bo'yicha coarse va dense estimate orasidagi drift **${formatMetric(sweepDrift, 6)}**.`
                    : "- Segment sweep hali to'liq qurilmadi, shuning uchun convergence drift chiqmayapti.",
            ].join("\n");
        }

        if (mode === "double") {
            const xProfilePeak = doubleProfiles?.xProfile.length
                ? Math.max(...doubleProfiles.xProfile.map((point) => Math.abs(point.y)))
                : 0;
            const yProfilePeak = doubleProfiles?.yProfile.length
                ? Math.max(...doubleProfiles.yProfile.map((point) => Math.abs(point.y)))
                : 0;
            const dominantAxis = xProfilePeak > yProfilePeak ? "x-direction" : yProfilePeak > xProfilePeak ? "y-direction" : "ikkala yo'nalish ham o'xshash";
            const sweepDrift =
                sweepSeries &&
                sweepSeries.summary.length > 1 &&
                "estimate" in sweepSeries.summary[0]
                    ? Math.abs(
                        (sweepSeries.summary[sweepSeries.summary.length - 1] as { estimate: number }).estimate -
                        (sweepSeries.summary[0] as { estimate: number }).estimate,
                    )
                    : null;

            return [
                `- Surface estimate: **${formatMetric((summary as DoubleIntegralSummary).value, 8)}**.`,
                `- Profil bo'yicha dominant yo'nalish: **${dominantAxis}**; peaklar x=${formatMetric(xProfilePeak, 5)}, y=${formatMetric(yProfilePeak, 5)}.`,
                `- Grid compare xulosasi: **${doubleDiagnostics?.gridCells || 0}** cell, peak/mean nisbati **${formatMetric((doubleDiagnostics?.peak || 0) / Math.max(1e-6, Math.abs(doubleDiagnostics?.mean || 0)), 3)}**.`,
                sweepDrift !== null
                    ? `- Grid sweep bo'yicha coarse va dense estimate farqi **${formatMetric(sweepDrift, 8)}**.`
                    : "- Grid sweep hali to'liq qurilmadi, shuning uchun convergence drift chiqmayapti.",
            ].join("\n");
        }

        const sweepDrift =
            sweepSeries &&
            sweepSeries.summary.length > 1 &&
            "estimate" in sweepSeries.summary[0]
                ? Math.abs(
                    (sweepSeries.summary[sweepSeries.summary.length - 1] as { estimate: number }).estimate -
                    (sweepSeries.summary[0] as { estimate: number }).estimate,
                )
                : null;
        const dominantDensity = (tripleDiagnostics?.peak || 0) > Math.max(1, Math.abs(tripleDiagnostics?.mean || 0) * 6)
            ? "lokal cho'qqilar dominant"
            : "zichlik ancha yoyilgan";

        return [
            `- Volume estimate: **${formatMetric((summary as TripleIntegralSummary).value, 8)}**.`,
            `- Density compare xulosasi: peak **${formatMetric(tripleDiagnostics?.peak, 5)}**, mean **${formatMetric(tripleDiagnostics?.mean, 5)}**; ya'ni **${dominantDensity}**.`,
            `- Effective grid: **${tripleDiagnostics?.gridCells || 0}** cell, voxel volume **${formatMetric(tripleDiagnostics?.voxelVolume, 5)}**.`,
            sweepDrift !== null
                ? `- Volume sweep bo'yicha coarse va dense estimate farqi **${formatMetric(sweepDrift, 8)}**.`
                : "- Volume sweep hali to'liq qurilmadi, shuning uchun convergence drift chiqmayapti.",
        ].join("\n");
    }, [doubleDiagnostics, doubleProfiles, mode, singleDiagnostics, summary, sweepSeries, tripleDiagnostics]);
    const explainModeMarkdown = React.useMemo(() => {
        if (mode === "single") {
            return [
                "- Bu grafik **f(x)** funksiyasining interval bo'yicha qanday o'zgarishini ko'rsatadi; integral qiymati esa shu egri ostidagi yig'ilgan signed area hisoblanadi.",
                "- Simpson, midpoint va trapezoid orasidagi farq qanchalik kichik bo'lsa, tanlangan partition odatda shunchalik ishonchli bo'ladi.",
                `- Hozirgi relative spread **${formatMetric(singleDiagnostics?.relativeSpread ? singleDiagnostics.relativeSpread * 100 : null, 2)}%**; bu metodlar bir-biriga qanchalik yaqinligini ko'rsatadi.`,
                "- Segment sweep esa qaysi nuqtadan keyin estimate deyarli o'zgarmay qolishini ko'rsatadi; amaliy hisob uchun aynan shu zona kerak.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
                "- Bu sahna **surface accumulation**ni ko'rsatadi: `(x, y)` domenidagi har nuqtaning balandligi integralga ulush qo'shadi.",
                "- `x-average` va `y-average` profillar sirtning qaysi yo'nalishda kuchliroq o'zgarayotganini ko'rsatadi; ular oddiy chizma emas, strukturaviy tahlildir.",
                `- Hozirgi peak height **${formatMetric(doubleDiagnostics?.peak, 4)}**, mean height **${formatMetric(doubleDiagnostics?.mean, 4)}**. Peak juda katta bo'lsa, lokal cho'qqilar integralni boshqaradi.`,
                "- Grid sweep esa aynan shu sirt qo'pol gridda va zich griddagi estimate'lar qanchalik farqlanishini ochib beradi.",
            ].join("\n");
        }

        return [
            "- Bu 3D ko'rinish **density cloud**: nuqtalar real volumening sample'lari, ya'ni har bir nuqta joylashuvdagi zichlikni bildiradi.",
            "- Integral qiymati shu volumeda yig'ilgan umumiy massaga o'xshaydi; peak density katta bo'lsa, kichik region umumiy natijani dominant qilishi mumkin.",
            `- Hozirgi voxel volume **${formatMetric(tripleDiagnostics?.voxelVolume, 5)}**; grid zichlashsa cloud yanada ishonchliroq tasvir beradi.`,
            "- `x-average density profile` esa zichlik qaysi x zonalarda to'planayotganini ko'rsatadi va export paytida writer'ga ham aynan shu talqin yuboriladi.",
        ].join("\n");
    }, [doubleDiagnostics, mode, singleDiagnostics, tripleDiagnostics]);
    const annotationAnchor = React.useMemo(() => {
        if (!summary) {
            return "Solver natijasi hali tayyor emas.";
        }

        if (mode === "single") {
            return `Simpson ${formatMetric((summary as SingleIntegralSummary).simpson, 6)}, spread ${formatMetric(singleDiagnostics?.spread, 6)}${sweepSeries ? `, sweep: ${sweepSeries.title}` : ""}`;
        }

        if (mode === "double") {
            return `Estimate ${formatMetric((summary as DoubleIntegralSummary).value, 8)}, peak ${formatMetric(doubleDiagnostics?.peak, 5)}, grid ${doubleDiagnostics?.gridCells || 0}`;
        }

        return `Estimate ${formatMetric((summary as TripleIntegralSummary).value, 8)}, peak density ${formatMetric(tripleDiagnostics?.peak, 5)}, voxel ${formatMetric(tripleDiagnostics?.voxelVolume, 5)}`;
    }, [doubleDiagnostics, mode, singleDiagnostics, summary, sweepSeries, tripleDiagnostics]);
    const resultLevelCards = React.useMemo(() => {
        if (!summary) {
            return [];
        }

        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                {
                    label: "Quick",
                    tone: "text-emerald-600",
                    summary: `Integralning asosiy reference'i Simpson=${formatMetric(singleSummary.simpson, 6)}.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Midpoint=${formatMetric(singleSummary.midpoint, 6)}, trapezoid=${formatMetric(singleSummary.trapezoid, 6)}, spread=${formatMetric(singleDiagnostics?.spread, 6)}.`,
                },
                {
                    label: "Research",
                    tone: "text-violet-600",
                    summary: `Relative spread ${formatMetric(singleDiagnostics?.relativeSpread ? singleDiagnostics.relativeSpread * 100 : null, 2)}%; convergence uchun segment sweep kuzatildi.`,
                },
            ];
        }

        if (mode === "double") {
            return [
                {
                    label: "Quick",
                    tone: "text-emerald-600",
                    summary: `Surface integral estimate=${formatMetric((summary as DoubleIntegralSummary).value, 8)}.`,
                },
                {
                    label: "Technical",
                    tone: "text-sky-600",
                    summary: `Grid=${doubleDiagnostics?.gridCells || 0}, peak=${formatMetric(doubleDiagnostics?.peak, 5)}, mean=${formatMetric(doubleDiagnostics?.mean, 5)}.`,
                },
                {
                    label: "Research",
                    tone: "text-violet-600",
                    summary: `Profile slices sirtning dominant yo'nalishini va lokal cho'qqilar ta'sirini ko'rsatadi.`,
                },
            ];
        }

        return [
            {
                label: "Quick",
                tone: "text-emerald-600",
                summary: `Volume integral estimate=${formatMetric((summary as TripleIntegralSummary).value, 8)}.`,
            },
            {
                label: "Technical",
                tone: "text-sky-600",
                summary: `Grid=${tripleDiagnostics?.gridCells || 0}, peak=${formatMetric(tripleDiagnostics?.peak, 5)}, voxel=${formatMetric(tripleDiagnostics?.voxelVolume, 5)}.`,
            },
            {
                label: "Research",
                tone: "text-violet-600",
                summary: `Density cloud va x-average profile lokal dominant regionlarni ko'rsatadi.`,
            },
        ];
    }, [doubleDiagnostics, mode, singleDiagnostics, summary, tripleDiagnostics]);
    const reportSkeletonMarkdown = React.useMemo(() => {
        if (!summary) {
            return "- Solver natijasi tayyor bo'lgach report skeleton quriladi.";
        }

        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                "## Problem",
                `- Function: $f(x) = ${toTexExpression(expression)}$`,
                `- Interval: $[${formatMetric(Number(lower), 3)}, ${formatMetric(Number(upper), 3)}]$`,
                "",
                "## Method",
                `- Numerical schemes: Simpson, midpoint, trapezoid`,
                `- Segments: **${normalizedSegments}**`,
                "",
                "## Observation",
                `- Simpson estimate: **${formatMetric(singleSummary.simpson, 6)}**`,
                `- Method spread: **${formatMetric(singleDiagnostics?.spread, 6)}**`,
                "",
                "## Interpretation",
                singleDiagnostics && singleDiagnostics.relativeSpread < 0.03
                    ? "- Metodlar orasidagi farq kichik, shuning uchun integral estimate barqaror ko'rinadi."
                    : "- Metodlar orasidagi farq sezilarli; segment sonini oshirib convergence yana tekshirilishi kerak.",
                "",
                "## Export Notes",
                "- Writer uchun function trace, method compare va segment sweep qismlarini birga yuborish tavsiya etiladi.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
                "## Problem",
                `- Function: $f(x,y) = ${toTexExpression(expression)}$`,
                `- Domain: **x in [${formatMetric(Number(xMin), 3)}, ${formatMetric(Number(xMax), 3)}]**, **y in [${formatMetric(Number(yMin), 3)}, ${formatMetric(Number(yMax), 3)}]**`,
                "",
                "## Method",
                `- Midpoint-style surface sampling`,
                `- Grid: **${normalizedXResolution} x ${normalizedYResolution}**`,
                "",
                "## Observation",
                `- Integral estimate: **${formatMetric((summary as DoubleIntegralSummary).value, 8)}**`,
                `- Peak/mean: **${formatMetric(doubleDiagnostics?.peak, 5)} / ${formatMetric(doubleDiagnostics?.mean, 5)}**`,
                "",
                "## Interpretation",
                "- Surface relief va average profiles orqali qaysi region integralga ko'proq ulush qo'shayotgani ko'rinadi.",
                "",
                "## Export Notes",
                "- Writer ichiga surface figure bilan birga x-average va y-average profil xulosalarini qo'shish tavsiya etiladi.",
            ].join("\n");
        }

        return [
            "## Problem",
            `- Function: $f(x,y,z) = ${toTexExpression(expression)}$`,
            `- Domain: x=[${formatMetric(Number(xMin), 3)}, ${formatMetric(Number(xMax), 3)}], y=[${formatMetric(Number(yMin), 3)}, ${formatMetric(Number(yMax), 3)}], z=[${formatMetric(Number(zMin), 3)}, ${formatMetric(Number(zMax), 3)}]`,
            "",
            "## Method",
            `- Sparse volumetric sampling`,
            `- Grid: **${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}**`,
            "",
            "## Observation",
            `- Integral estimate: **${formatMetric((summary as TripleIntegralSummary).value, 8)}**`,
            `- Peak density / voxel volume: **${formatMetric(tripleDiagnostics?.peak, 5)} / ${formatMetric(tripleDiagnostics?.voxelVolume, 5)}**`,
            "",
            "## Interpretation",
            "- Density cloud va x-average profile volumening qaysi qismi natijani dominant qilayotganini ko'rsatadi.",
            "",
            "## Export Notes",
            "- Writer uchun volume figure, density profile va grid sensitivity observation'larini birga yuborish tavsiya etiladi.",
        ].join("\n");
    }, [doubleDiagnostics, expression, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, tripleDiagnostics, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    function addAnnotationFromCurrentResult() {
        if (!summary || error) {
            return;
        }

        const nextAnnotation: IntegralAnnotation = {
            id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `int-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: annotationTitle.trim() || `${mode} integral observation`,
            note: annotationNote.trim() || "Current estimate bo'yicha qisqa observation saqlandi.",
            anchor: annotationAnchor,
            createdAt: new Date().toISOString(),
        };

        setAnnotations((current) => [nextAnnotation, ...current].slice(0, 8));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveCurrentExperiment() {
        const nextExperiment: IntegralSavedExperiment = {
            id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `int-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label: experimentLabel.trim() || `${mode} integral`,
            savedAt: new Date().toISOString(),
            mode,
            expression,
            lower,
            upper,
            xMin,
            xMax,
            yMin,
            yMax,
            zMin,
            zMax,
            segments,
            xResolution,
            yResolution,
            zResolution,
        };

        setSavedExperiments((current) => [nextExperiment, ...current].slice(0, 8));
        setExperimentLabel("");
    }

    function loadSavedExperiment(experiment: IntegralSavedExperiment) {
        setMode(experiment.mode);
        setExpression(experiment.expression);
        setLower(experiment.lower);
        setUpper(experiment.upper);
        setXMin(experiment.xMin);
        setXMax(experiment.xMax);
        setYMin(experiment.yMin);
        setYMax(experiment.yMax);
        setZMin(experiment.zMin);
        setZMax(experiment.zMax);
        setSegments(experiment.segments);
        setXResolution(experiment.xResolution);
        setYResolution(experiment.yResolution);
        setZResolution(experiment.zResolution);
        setExportState("idle");
        setGuideMode(null);
    }

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(summary && !error),
        sourceLabel: "Integral Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () =>
            buildIntegralMarkdown({
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        buildBlock: (targetId) =>
            buildIntegralLivePayload({
                targetId,
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        getDraftMeta: () => ({
            title: "Integral Analysis",
            abstract: "Exported from laboratory.",
            keywords: `${mode},integral`,
        }),
    });

    const examplesPanel = (
        <div className="space-y-4">
            <LaboratoryWorkflowTemplatePanel
                templates={INTEGRAL_WORKFLOW_TEMPLATES}
                activeTemplateId={activeTemplateId}
                onApply={applyWorkflowTemplate}
            />

            <div className="site-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <div className="site-eyebrow text-accent">Powerful Examples</div>
                </div>
                <div className="grid gap-2">
                    {LABORATORY_PRESETS.integral.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/5 p-3 text-left transition-all group hover:translate-x-1 hover:border-accent/40 hover:bg-accent/5"
                        >
                            <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent">{preset.label}</div>
                                <div className="truncate text-[9px] font-mono text-muted-foreground">{preset.expr}</div>
                                <div className="mt-1 text-[10px] leading-5 text-muted-foreground">{integralPresetDescriptions[preset.label] || "Integral preset"}</div>
                            </div>
                            <div className="ml-3 shrink-0 rounded bg-muted/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-muted-foreground">{preset.mode}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <LaboratoryNotebookToolbar
                title="Integral Studio"
                description="Numerical integration, surface va volume analysis."
                activeBlocks={notebook.activeBlocks}
                definitions={integralNotebookBlocks}
                onAddBlock={notebook.addBlock}
                onRemoveBlock={notebook.removeBlock}
            />

            {!notebook.activeBlocks.length && <LaboratoryNotebookEmptyState message="Foydalanish uchun bloklarni yoqing." />}

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-6">
                    {notebook.hasBlock("setup") && (
                        <div className="site-panel p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="site-eyebrow text-accent">Adaptive Solver Control</div>
                                    <div className="flex gap-2">
                                        {(["single", "double", "triple"] as const).map(m => (
                                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-muted/10 text-muted-foreground border border-border/50 hover:bg-muted/20'}`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center">
                                    <Activity className="mr-2 h-3.5 w-3.5" />
                                    Active Simulation
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activePresetDescription ? (
                                    <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                                        {activePresetDescription}
                                    </div>
                                ) : null}
                                {activeWorkflowTemplate ? (
                                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm leading-7 text-sky-800 dark:text-sky-200">
                                        <span className="font-black">{activeWorkflowTemplate.title}</span>: {activeWorkflowTemplate.description}
                                    </div>
                                ) : null}

                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Function, f({mode === "single" ? 'x' : mode === "double" ? 'x,y' : 'x,y,z'})</div>
                                    <input value={expression} onChange={e => setExpression(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-border/80 bg-background/50 px-5 text-sm font-mono font-bold focus:border-accent outline-none" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {mode === "single" ? (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lower a</div>
                                                <input value={lower} onChange={e => setLower(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upper b</div>
                                                <input value={upper} onChange={e => setUpper(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Segments</div>
                                                <input value={segments} onChange={e => setSegments(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
                                            </div>
                                        </>
                                    ) : mode === "double" ? (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Domain</div>
                                                <div className="flex gap-2">
                                                    <input value={xMin} onChange={e => setXMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                    <input value={xMax} onChange={e => setXMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                </div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Domain</div>
                                                <div className="flex gap-2">
                                                    <input value={yMin} onChange={e => setYMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                    <input value={yMax} onChange={e => setYMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-xs outline-none" />
                                                </div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Grid</div>
                                                <input value={xResolution} onChange={e => setXResolution(e.target.value)} className="w-full bg-transparent font-mono text-xs outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Grid</div>
                                                <input value={yResolution} onChange={e => setYResolution(e.target.value)} className="w-full bg-transparent font-mono text-xs outline-none" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Domain</div>
                                                <div className="flex gap-2"><input value={xMin} onChange={e => setXMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={xMax} onChange={e => setXMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Domain</div>
                                                <div className="flex gap-2"><input value={yMin} onChange={e => setYMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={yMax} onChange={e => setYMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Z Domain</div>
                                                <div className="flex gap-2"><input value={zMin} onChange={e => setZMin(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /><input value={zMax} onChange={e => setZMax(e.target.value)} className="w-1/2 bg-transparent font-mono text-[10px] outline-none" /></div>
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">X Grid</div>
                                                <input value={xResolution} onChange={e => setXResolution(e.target.value)} className="w-full bg-transparent font-mono text-[10px] outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Y Grid</div>
                                                <input value={yResolution} onChange={e => setYResolution(e.target.value)} className="w-full bg-transparent font-mono text-[10px] outline-none" />
                                            </div>
                                            <div className="site-outline-card p-4 space-y-1">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Z Grid</div>
                                                <input value={zResolution} onChange={e => setZResolution(e.target.value)} className="w-full bg-transparent font-mono text-[10px] outline-none" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Mode profile</div>
                                        <div className="mt-2 text-sm leading-6 text-foreground">
                                            {mode === "single" ? "1D area estimate with method comparison" : mode === "double" ? "2D surface accumulation with profile slices" : "3D density accumulation with sparse cloud"}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Effective grid</div>
                                        <div className="mt-2 font-mono text-sm text-foreground">
                                            {mode === "single" ? `${normalizedSegments} segments` : mode === "double" ? `${normalizedXResolution} x ${normalizedYResolution}` : `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                                        <div className="mt-2 text-sm text-foreground">{error ? "Solver warning" : "Numerical estimate ready"}</div>
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <LaboratoryMathPanel
                                        eyebrow="Rendered Problem"
                                        title="Masala ko'rinishi"
                                        content={renderedProblemMarkdown}
                                    />
                                    <LaboratoryMathPanel
                                        eyebrow="Analysis Brief"
                                        title="Grafikdan tashqari nima tahlil qilinadi"
                                        content={analysisBriefMarkdown}
                                        accentClassName="text-sky-600"
                                    />
                                </div>
                                <LaboratoryMathPanel
                                    eyebrow="Step-by-step"
                                    title="Hisoblash qanday qurilyapti"
                                    content={derivationMarkdown}
                                    accentClassName="text-violet-600"
                                />
                            </div>
                        </div>
                    )}

                    {notebook.hasBlock("setup") ? examplesPanel : null}

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
                                    {mode === "single"
                                        ? "Segment sonini yuritib, metodlar estimate'i qayerda tinchlanishini ko'ring."
                                        : mode === "double"
                                          ? "2D grid zichligini yuritib, surface integral estimate qanchalik o'zgarishini ko'ring."
                                          : "3D grid zichligini yuritib, volumetric estimate sezgirligini ko'ring."}
                                </div>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-accent" />
                                {mode === "single" ? "segments" : "grid"}
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
                                                {sweepSeries.metricLabel} {entry.x}
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {"simpson" in entry
                                                    ? `Simpson ${formatMetric(entry.simpson, 6)}, midpoint ${formatMetric(entry.midpoint, 6)}, trapezoid ${formatMetric(entry.trapezoid, 6)}`
                                                    : `Estimate ${formatMetric(entry.estimate, 8)}, samples ${entry.sampleCount}${"zGrid" in entry ? `, z-grid ${entry.zGrid}` : ""}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                                Sweep hisobini qurib bo&apos;lmadi. Interval yoki expression domain&apos;ini tekshirib ko&apos;ring.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <LaboratoryMathPanel
                            eyebrow="Compare Report"
                            title="Method va grid taqqoslash xulosasi"
                            content={compareReportMarkdown}
                            accentClassName="text-emerald-600"
                        />
                        <LaboratoryMathPanel
                            eyebrow="Explain Mode"
                            title="Bu estimate nimani anglatadi"
                            content={explainModeMarkdown}
                            accentClassName="text-fuchsia-600"
                        />
                    </div>

                    <LaboratoryResultLevelsPanel
                        cards={resultLevelCards}
                        description="Bir xil estimate'ni tez, texnik va research darajada ko'rib chiqing."
                    />

                    <LaboratoryMathPanel
                        eyebrow="Report Skeleton"
                        title="Writer uchun yarim tayyor ilmiy bo'lim"
                        content={reportSkeletonMarkdown}
                        accentClassName="text-amber-600"
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Interactive Annotations</div>
                                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                        Integral estimate bo&apos;yicha muhim observation&apos;larni note qilib saqlang.
                                    </div>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    {annotations.length} note
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-7 text-muted-foreground">
                                Anchor: {annotationAnchor}
                            </div>
                            <div className="grid gap-3">
                                <input
                                    value={annotationTitle}
                                    onChange={(event) => setAnnotationTitle(event.target.value)}
                                    placeholder="Annotation title"
                                    className="h-11 rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-accent/40"
                                />
                                <textarea
                                    value={annotationNote}
                                    onChange={(event) => setAnnotationNote(event.target.value)}
                                    placeholder="Bu estimate nimani anglatishini yozib qoldiring"
                                    className="min-h-28 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-accent/40"
                                />
                                <button
                                    type="button"
                                    onClick={addAnnotationFromCurrentResult}
                                    disabled={!summary || Boolean(error)}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Joriy natijadan note saqlash
                                </button>
                            </div>
                            <div className="grid gap-3">
                                {annotations.length ? annotations.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-black text-foreground">{item.title}</div>
                                                <div className="mt-1 text-xs leading-6 text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAnnotations((current) => current.filter((entry) => entry.id !== item.id))}
                                                className="rounded-xl border border-border/60 p-2 text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600"
                                                title="Note ni o'chirish"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 text-sm leading-7 text-foreground">{item.note}</div>
                                        <div className="mt-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs leading-6 text-muted-foreground">
                                            {item.anchor}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                                        Hozircha annotation yo&apos;q. Current estimate bo&apos;yicha note saqlab boring.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="site-panel p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Save Experiments</div>
                                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                        Qiziq integral scenario&apos;larini keyin qayta tekshirish uchun snapshot qilib qo&apos;ying.
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
                                                    {item.mode} · {new Date(item.savedAt).toLocaleString()}
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
                                        Hozircha saved experiment yo&apos;q. Yaxshi interval yoki grid topilganda shu yerga saqlang.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm leading-7 text-rose-700">
                            {error}
                        </div>
                    ) : null}

                </div>

                <div className="space-y-6">
                    {notebook.hasBlock("analysis") && summary ? (
                        <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
                            <div className="mt-3">
                                <div className="site-panel-strong p-6 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="site-eyebrow text-accent">Vibrant Visualization</div>
                                        <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {mode === "single" ? "Method compare" : mode === "double" ? "Surface analytics" : "Volume analytics"}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        {mode === "single" ? (
                                            <CartesianPlot title="Function trace" series={[{ label: "f(x)", color: "var(--accent)", points: (summary as SingleIntegralSummary).samples }]} />
                                        ) : mode === "double" ? (
                                            <ScientificPlot
                                                type="surface"
                                                data={buildSurfaceData((summary as DoubleIntegralSummary).samples)}
                                                title={`f(x,y) = ${expression}`}
                                                insights={[`${normalizedXResolution}x${normalizedYResolution} midpoint grid`, "surface relief", "x/y profile slices"]}
                                            />
                                        ) : (
                                            <ScientificPlot
                                                type="scatter3d"
                                                data={buildVolumeData((summary as TripleIntegralSummary).samples)}
                                                title={`f(x,y,z) = ${expression}`}
                                                insights={[`${normalizedXResolution}x${normalizedYResolution}x${normalizedZResolution} grid`, "sparse volume cloud", "density profile"]}
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="grid gap-4 sm:grid-cols-4">
                                        {mode === "single" ? (
                                            <>
                                                <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Simpson</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).simpson, 4)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Midpoint</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).midpoint, 4)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Trapezoid</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as SingleIntegralSummary).trapezoid, 4)}</div></div>
                                                <div className="site-outline-card bg-muted/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Spread</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(singleDiagnostics?.spread, 4)}</div><div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{singleDiagnostics?.stability}</div></div>
                                            </>
                                        ) : mode === "double" ? (
                                            <>
                                                <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Integral value</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as DoubleIntegralSummary).value, 6)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Grid cells</div><div className="mt-1 font-serif text-xl font-black">{doubleDiagnostics?.gridCells}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Peak height</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(doubleDiagnostics?.peak, 4)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mean height</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(doubleDiagnostics?.mean, 4)}</div></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="site-outline-card border-accent/20 bg-accent/5 p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-accent">Integral value</div><div className="mt-1 font-serif text-xl font-black">{formatMetric((summary as TripleIntegralSummary).value, 6)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Grid cells</div><div className="mt-1 font-serif text-xl font-black">{tripleDiagnostics?.gridCells}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Peak density</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(tripleDiagnostics?.peak, 4)}</div></div>
                                                <div className="site-outline-card p-4"><div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Voxel volume</div><div className="mt-1 font-serif text-xl font-black">{formatMetric(tripleDiagnostics?.voxelVolume, 4)}</div></div>
                                            </>
                                        )}
                                    </div>

                                    {mode === "double" && doubleProfiles ? (
                                        <div className="grid gap-4 lg:grid-cols-2">
                                            <CartesianPlot title="x-average height profile" series={[{ label: "x-average", color: "#2563eb", points: doubleProfiles.xProfile }]} />
                                            <CartesianPlot title="y-average height profile" series={[{ label: "y-average", color: "#14b8a6", points: doubleProfiles.yProfile }]} />
                                        </div>
                                    ) : null}

                                    {mode === "triple" && tripleProfile ? (
                                        <CartesianPlot title="x-average density profile" series={[{ label: "density", color: "#7c3aed", points: tripleProfile }]} />
                                    ) : null}

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Layers3 className="h-3.5 w-3.5" />
                                                Sampling insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {mode === "single" ? `${normalizedSegments} segment bilan Simpson asosiy reference sifatida ishlayapti.` : mode === "double" ? `${doubleDiagnostics?.sampleCount} surface point profile analysis uchun yig'ildi.` : `${tripleDiagnostics?.sampleCount} sparse point volumetric cloud ko'rinishida chiqdi.`}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Waves className="h-3.5 w-3.5" />
                                                Structure insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {mode === "single" ? `Relative spread ${formatMetric(singleDiagnostics?.relativeSpread ? singleDiagnostics.relativeSpread * 100 : null, 2)}% atrofida.` : mode === "double" ? `Peak height ${formatMetric(doubleDiagnostics?.peak, 4)}, mean height ${formatMetric(doubleDiagnostics?.mean, 4)}.` : `Peak density ${formatMetric(tripleDiagnostics?.peak, 4)}, mean density ${formatMetric(tripleDiagnostics?.mean, 4)}.`}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                <Box className="h-3.5 w-3.5" />
                                                Export insight
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-foreground">
                                                {mode === "single" ? "Writer export function trace va metod qiymatlarini olib chiqadi." : mode === "double" ? "Writer export sirtning x-average profilini ham yuboradi." : "Writer export volumetric density'ning x-average profilini ham yuboradi."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {notebook.hasBlock("bridge") && (
                        <LaboratoryBridgeCard
                            ready={Boolean(summary && !error)}
                            exportState={exportState}
                            guideMode={guideMode}
                            setGuideMode={setGuideMode}
                            guides={exportGuides}
                            liveTargets={liveTargets}
                            onSelectTarget={setSelectedLiveTargetId}
                            selectedLiveTargetId={selectedLiveTargetId}
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

