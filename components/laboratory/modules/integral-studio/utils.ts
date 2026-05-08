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
import { evaluate } from "mathjs";

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
    return trimmed.length > 0 && Number.isFinite(parseBoundValue(value));
}

export function parseBoundValue(value: string | number) {
    if (typeof value === "number") return value;
    const trimmed = value.trim().toLowerCase();
    if (["inf", "+inf", "infinity", "+infinity"].includes(trimmed)) return Infinity;
    if (["-inf", "-infinity"].includes(trimmed)) return -Infinity;
    const directNumeric = Number(value);
    if (Number.isFinite(directNumeric)) {
        return directNumeric;
    }

    try {
        const normalized = value
            .replace(/\u2212/g, "-")
            .replace(/[\u00D7\u22C5\u00B7]/g, "*")
            .replace(/[\u00F7]/g, "/")
            .replace(/\u03C0/g, "pi")
            .replace(/\bln\s*\(/gi, "log(")
            .trim();
        const computed = Number(evaluate(normalized));
        return Number.isFinite(computed) ? computed : Number.NaN;
    } catch {
        return Number.NaN;
    }
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

function normalizeBenchmarkExpression(expression: string) {
    return expression
        .replace(/\s+/g, "")
        .replace(/ln\(/gi, "log(")
        .replace(/\u2212/g, "-")
        .toLowerCase();
}

function normalizeBenchmarkBound(value: string) {
    return value
        .trim()
        .replace(/\s+/g, "")
        .replace(/\u221e/g, "inf")
        .replace(/oo/gi, "inf")
        .replace(/infinity/gi, "inf")
        .toLowerCase();
}

export function evaluateIntegralBenchmark(params: {
    mode: IntegralMode;
    expression: string;
    lower: string;
    upper: string;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    summary: IntegralComputationSummary | null;
}) {
    if (params.mode !== "single") {
        return null;
    }

    const normalizedExpression = normalizeBenchmarkExpression(
        params.analyticSolution?.parser.expression_normalized || params.expression,
    );
    const normalizedLower = normalizeBenchmarkBound(params.analyticSolution?.parser.lower_normalized || params.lower);
    const normalizedUpper = normalizeBenchmarkBound(params.analyticSolution?.parser.upper_normalized || params.upper);

    const canonicalBenchmarks = [
        { id: "poly_unit_interval", label: "Polynomial benchmark", expression: "x^2", lower: "0", upper: "1", expectedValue: 1 / 3, note: "Elementary polynomial integral on unit interval." },
        { id: "improper_exponential_tail", label: "Improper exponential tail", expression: "exp(-x)", lower: "0", upper: "inf", expectedValue: 1, note: "Canonical convergent improper integral with symbolic limit." },
        { id: "endpoint_singularity_root", label: "Endpoint singularity benchmark", expression: "1/sqrt(x)", lower: "0", upper: "1", expectedValue: 2, note: "Integrable endpoint singularity check." },
        { id: "piecewise_abs_symmetric", label: "Piecewise symmetry benchmark", expression: "abs(x)", lower: "-1", upper: "1", expectedValue: 1, note: "Piecewise branch audit on symmetric interval." },
    ];

    const match = canonicalBenchmarks.find((item) =>
        item.expression === normalizedExpression
        && item.lower === normalizedLower
        && item.upper === normalizedUpper,
    );
    if (!match) {
        return null;
    }

    const actualNumeric = parseLooseNumericValue(params.analyticSolution?.exact.numeric_approximation)
        ?? (params.summary ? (params.summary as SingleIntegralSummary).simpson : null);
    const absoluteError = actualNumeric === null ? null : Math.abs(actualNumeric - match.expectedValue);
    const status: "verified" | "review" = absoluteError !== null && absoluteError <= 1e-5 ? "verified" : "review";

    return {
        id: match.id,
        label: match.label,
        expectedValue: LaboratoryFormattingService.formatMetric(match.expectedValue, 8),
        actualValue: actualNumeric === null ? "n/a" : LaboratoryFormattingService.formatMetric(actualNumeric, 8),
        absoluteError,
        status,
        detail:
            status === "verified"
                ? `${match.note} Solver canonical benchmark bilan mos tushdi.`
                : `${match.note} Natija benchmark bilan qo'lda tekshirilishi kerak.`,
    };
}

export function buildExactSolutionMarkdown(solution: IntegralAnalyticSolveResponse | null) {
    if (!solution || solution.status !== "exact") {
        return "- Analitik yechim hali tayyor emas.";
    }
    const isDefinite = Boolean(solution.exact.definite_integral_latex);
    return [
        isDefinite
            ? "- Backend `SymPy` orqali definite integralni analitik yechishga urinib ko'rdi."
            : "- Backend `SymPy` orqali aniqmas integral uchun symbolic primitive qidirdi.",
        solution.exact.method_label
            ? `- Asosiy symbolic yo'nalish: **${solution.exact.method_label}**.`
            : "- Symbolic yechim strategiyasi ajratilmadi.",
        solution.exact.antiderivative_latex
            ? `$$F(x) = ${solution.exact.antiderivative_latex}$$`
            : isDefinite
              ? "- Antiderivative closed-form ko'rinishda ajratilmadi, lekin definite integral baholandi."
              : "- Primitive closed-form ko'rinishda ajratilmadi.",
        solution.exact.definite_integral_latex && solution.exact.evaluated_latex
            ? `$$${solution.exact.definite_integral_latex} = ${solution.exact.evaluated_latex}$$`
            : solution.exact.evaluated_latex
              ? `$$${solution.exact.evaluated_latex}$$`
              : "- Yakuniy analitik ifoda qaytarilmadi.",
        solution.exact.numeric_approximation
            ? `- Sonli ko'rinish: **${solution.exact.numeric_approximation}**`
            : isDefinite
              ? "- Sonli approksimatsiya qaytarilmadi."
              : "- Aniqmas integral uchun sonli approksimatsiya talab qilinmadi.",
        solution.exact.contains_special_functions
            ? "- Yechim maxsus funksiyalar orqali yozilgan bo'lishi mumkin; bu ham analitik natija hisoblanadi."
            : "- Natija elementary yoki to'g'ridan-to'g'ri symbolic ko'rinishda qaytdi.",
        solution.diagnostics?.research
            ? `- Research readiness: **${solution.diagnostics.research.readiness_label}** | risk: **${solution.diagnostics.research.domain_risk_level}** | tier: **${solution.diagnostics.research.exactness_tier}**`
            : "- Research audit metadata hali yo'q.",
    ].join("\n");
}

export function buildExactMethodMarkdown(solution: IntegralAnalyticSolveResponse | null) {
    if (!solution || solution.status !== "exact") {
        return "- Avval analitik solve ishga tushiriladi, keyin symbolic natija shu yerga yoziladi.";
    }
    const isDefinite = Boolean(solution.exact.definite_integral_latex);
    return [
        isDefinite ? "**Definite analytic flow**" : "**Indefinite analytic flow**",
        "",
        "1. Integrand `SymPy` parser orqali xavfsiz symbolic ifodaga aylantiriladi.",
        solution.parser.notes.length
            ? `2. Parser kiritmani normallashtirdi: ${solution.parser.notes.join(" ")}`
            : "2. Parser kiritmani o'zgartirmasdan symbolic ko'rinishga tayyorladi.",
        solution.exact.method_summary
            ? `3. Strategy: **${solution.exact.method_label || "Symbolic Reduction"}**. ${solution.exact.method_summary}`
            : "3. SymPy primitive topish uchun umumiy symbolic reduction ishlatdi.",
        "4. Avval antiderivative topiladi.",
        isDefinite ? "5. So'ng definite integral chegaralarda baholanadi." : "5. Primitive `+ C` bilan yakuniy symbolic ko'rinishga keltiriladi.",
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
        if (solution && !solution.can_offer_numerical) {
            return [
                solution.message || "Bu solve lane numerik fallback bermaydi.",
                "- Hozirgi integral turi symbolic yoki convergence tahlili bilan tugaydi.",
                "- Numerik confirmation bu lane uchun ochiq emas.",
            ].join("\n");
        }
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
