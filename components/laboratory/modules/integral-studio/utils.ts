import { 
    IntegralMode, 
    IntegralAnalyticSolveResponse, 
    IntegralSolveSnapshot, 
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary
} from "./types";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

export const { formatMetric, toTexExpression, clampInteger } = LaboratoryFormattingService;

export const parserNoteTone = LaboratoryFormattingService.getParserNoteTone;
export const stepToneClasses = LaboratoryFormattingService.getStepToneClasses;

export function parseLooseNumericValue(value: string | null | undefined) {
    if (!value) {
        return null;
    }
    const normalized = value.replace(/[^0-9eE+\-.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function areSolveSnapshotsEqual(left: IntegralSolveSnapshot, right: IntegralSolveSnapshot) {
    return (
        left.mode === right.mode &&
        left.coordinates === right.coordinates &&
        left.expression === right.expression &&
        left.lower === right.lower &&
        left.upper === right.upper &&
        left.xMin === right.xMin &&
        left.xMax === right.xMax &&
        left.yMin === right.yMin &&
        left.yMax === right.yMax &&
        left.zMin === right.zMin &&
        left.zMax === right.zMax &&
        left.segments === right.segments &&
        left.xResolution === right.xResolution &&
        left.yResolution === right.yResolution &&
        left.zResolution === right.zResolution
    );
}

export function isFiniteInput(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (["inf", "+inf", "infinity", "+infinity", "-inf", "-infinity"].includes(trimmed)) return true;
    return trimmed.length > 0 && Number.isFinite(Number(value));
}

export function parseBoundValue(value: string | number) {
    if (typeof value === "number") return value;
    const trimmed = value.trim().toLowerCase();
    if (["inf", "+inf", "infinity", "+infinity"].includes(trimmed)) return Infinity;
    if (["-inf", "-infinity"].includes(trimmed)) return -Infinity;
    return Number(value);
}

export function buildAveragedProfile(
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

export function buildExactSolutionMarkdown(solution: IntegralAnalyticSolveResponse | null) {
    if (!solution || solution.status !== "exact") {
        return "- Analitik yechim hali tayyor emas.";
    }
    return [
        "- Backend `SymPy` orqali definite integralni analitik yechishga urinib ko'rdi.",
        solution.exact.method_label
            ? `- Asosiy symbolic yo'nalish: **${solution.exact.method_label}**.`
            : "- Symbolic yechim strategiyasi ajratilmadi.",
        solution.exact.antiderivative_latex
            ? `$$F(x) = ${solution.exact.antiderivative_latex}$$`
            : "- Antiderivative closed-form ko'rinishda ajratilmadi, lekin definite integral baholandi.",
        solution.exact.definite_integral_latex && solution.exact.evaluated_latex
            ? `$$${solution.exact.definite_integral_latex} = ${solution.exact.evaluated_latex}$$`
            : "- Yakuniy analitik ifoda qaytarilmadi.",
        solution.exact.numeric_approximation
            ? `- Sonli ko'rinish: **${solution.exact.numeric_approximation}**`
            : "- Sonli approksimatsiya qaytarilmadi.",
        solution.exact.contains_special_functions
            ? "- Yechim maxsus funksiyalar orqali yozilgan bo'lishi mumkin; bu ham analitik natija hisoblanadi."
            : "- Natija elementary yoki to'g'ridan-to'g'ri symbolic ko'rinishda qaytdi.",
    ].join("\n");
}

export function buildExactMethodMarkdown(solution: IntegralAnalyticSolveResponse | null) {
    if (!solution || solution.status !== "exact") {
        return "- Avval analitik solve ishga tushiriladi, keyin symbolic natija shu yerga yoziladi.";
    }
    return [
        "**Analitik oqim**",
        "",
        "1. Integrand `SymPy` parser orqali xavfsiz symbolic ifodaga aylantiriladi.",
        solution.parser.notes.length
            ? `2. Parser kiritmani normallashtirdi: ${solution.parser.notes.join(" ")}`
            : "2. Parser kiritmani o'zgartirmasdan symbolic ko'rinishga tayyorladi.",
        solution.exact.method_summary
            ? `3. Strategy: **${solution.exact.method_label || "Symbolic Reduction"}**. ${solution.exact.method_summary}`
            : "3. SymPy primitive topish uchun umumiy symbolic reduction ishlatdi.",
        "4. Avval antiderivative topiladi.",
        "5. So'ng definite integral chegaralarda baholanadi.",
        "6. Agar closed-form mavjud bo'lsa, latex ko'rinishda qaytariladi.",
        solution.exact.antiderivative_latex
            ? `- Topilgan antiderivative: $$${solution.exact.antiderivative_latex}$$`
            : "- Antiderivative topilmasa, numerik fallback tavsiya qilinadi.",
    ].join("\n");
}

export function buildNumericalPromptMarkdown(
    mode: IntegralMode,
    solution: IntegralAnalyticSolveResponse | null,
) {
    if (mode === "single") {
        return [
            solution?.message || "Analitik closed-form yechim topilmadi.",
            "- Shu ifoda uchun numerik estimate ishlatish mumkin.",
            "- Hisoblash avtomatik boshlanmaydi; tugma orqali tasdiqlaysiz.",
            "- Tasdiqdan keyin Simpson, midpoint va trapezoid taqqoslanadi.",
        ].join("\n");
    }
    return [
        mode === "double"
            ? "- 2D integral symbolic emas, numerik grid bilan hisoblanadi."
            : "- 3D integral volumetric grid bilan hisoblanadi.",
        "- Yirik hisoblar avtomatik ishga tushmaydi.",
        "- Agar davom etsangiz, hozirgi grid bo'yicha estimate va vizual tahlil quriladi.",
    ].join("\n");
}

export function generateSweepValues(startText: string, endText: string, countText: string, min: number, max: number) {
    const start = clampInteger(startText, min, min, max);
    const end = clampInteger(endText, Math.min(max, start + 20), min, max);
    const count = clampInteger(countText, 4, 2, 6);
    const actualStart = Math.min(start, end);
    const actualEnd = Math.max(start, end);
    const step = count === 1 ? 0 : (actualEnd - actualStart) / Math.max(1, count - 1);
    const values = Array.from({ length: count }, (_, index) => Math.round(actualStart + step * index));
    return Array.from(new Set(values.map((value) => Math.min(max, Math.max(min, value))))).sort((left, right) => left - right);
}

export function buildIntegralMarkdown(params: {
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
        return `## Laboratory Export: Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- Interval: [${formatMetric(lower, 4)}, ${formatMetric(upper, 4)}]\n- Segments: ${segmentsUsed}\n\n### Numerical Estimates\n- Simpson: ${formatMetric(singleSummary.simpson, 6)}\n- Midpoint: ${formatMetric(singleSummary.midpoint, 6)}\n- Trapezoid: ${formatMetric(singleSummary.trapezoid, 6)}\n- Method spread: ${formatMetric(spread, 6)}`;
    }
    if (mode === "double") {
        const doubleSummary = summary as DoubleIntegralSummary;
        return `## Laboratory Export: Double Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]\n- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]\n- Grid: ${xResolution} x ${yResolution}\n\n### Numerical Estimate\n- Integral value: ${formatMetric(doubleSummary.value, 8)}\n- Sample count: ${doubleSummary.samples.length}`;
    }
    const tripleSummary = summary as TripleIntegralSummary;
    return `## Laboratory Export: Triple Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]\n- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]\n- Z domain: [${formatMetric(zMin, 4)}, ${formatMetric(zMax, 4)}]\n- Grid: ${xResolution} x ${yResolution} x ${zResolution}\n\n### Numerical Estimate\n- Integral value: ${formatMetric(tripleSummary.value, 8)}\n- Sparse sample count: ${tripleSummary.samples.length}`;
}

export function buildIntegralLivePayload(params: {
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
