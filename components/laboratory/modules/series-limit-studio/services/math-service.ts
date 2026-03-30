import type { SeriesLimitAnalysisResult, SeriesLimitMode, SeriesLimitSeriesPoint, SeriesLimitStep } from "../types";

function normalizeExpression(expression: string) {
    return expression
        .replace(/\^/g, "**")
        .replace(/\bpi\b/g, "Math.PI")
        .replace(/\binf\b/g, "Infinity");
}

function buildEvaluator(expression: string, variable: string) {
    const normalized = normalizeExpression(expression)
        .replace(/\bsin\(/g, "Math.sin(")
        .replace(/\bcos\(/g, "Math.cos(")
        .replace(/\btan\(/g, "Math.tan(")
        .replace(/\bexp\(/g, "Math.exp(")
        .replace(/\blog\(/g, "Math.log(")
        .replace(/\bsqrt\(/g, "Math.sqrt(")
        .replace(/\babs\(/g, "Math.abs(");
    try {
        return new Function(variable, `return ${normalized};`) as (value: number) => number;
    } catch {
        return null;
    }
}

function parseAuxiliary(auxiliary: string, fallbackVariable: string) {
    const match = auxiliary.match(/([A-Za-z]\w*)\s*->\s*(.+)/);
    if (!match) {
        return { variable: fallbackVariable, target: 0, rawTarget: auxiliary.trim() || "0" };
    }
    const variable = match[1];
    const rawTarget = match[2].trim();
    const target =
        rawTarget === "inf" || rawTarget === "oo"
            ? Number.POSITIVE_INFINITY
            : rawTarget === "-inf" || rawTarget === "-oo"
              ? Number.NEGATIVE_INFINITY
              : Number(rawTarget);
    return { variable, target: Number.isFinite(target) ? target : 10, rawTarget };
}

function parseSumExpression(expression: string) {
    const match = expression.match(/^sum\((.+),\s*([A-Za-z]\w*)\s*=\s*(.+)\.\.(.+)\)$/i);
    if (match) {
        return {
            term: match[1].trim(),
            index: match[2].trim(),
            start: match[3].trim(),
            end: match[4].trim(),
        };
    }
    const tupleMatch = expression.match(/^sum\((.+),\s*\(\s*([A-Za-z]\w*)\s*,\s*(.+)\s*,\s*(.+)\s*\)\)$/i);
    if (!tupleMatch) {
        return null;
    }
    return {
        term: tupleMatch[1].trim(),
        index: tupleMatch[2].trim(),
        start: tupleMatch[3].trim(),
        end: tupleMatch[4].trim(),
    };
}

function safePoint(pushTo: SeriesLimitSeriesPoint[], x: number, y: number) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
        pushTo.push({ x, y });
    }
}

function buildLimitAnalysis(expression: string, auxiliary: string, dimension: string): SeriesLimitAnalysisResult {
    const { variable, target, rawTarget } = parseAuxiliary(auxiliary || "x -> 0", "x");
    const evaluator = buildEvaluator(expression, variable);
    const lineSeries: SeriesLimitSeriesPoint[] = [];
    const oneSidedSeries: SeriesLimitSeriesPoint[] = [];
    const envelopeSeries: SeriesLimitSeriesPoint[] = [];
    if (evaluator && Number.isFinite(target)) {
        const offsets =
            dimension === "one-sided"
                ? [-1, -0.5, -0.25, -0.12, -0.06, -0.03, -0.01, -0.005, 0.005, 0.01, 0.03, 0.06, 0.12, 0.25, 0.5, 1]
                : dimension === "asymptotic"
                  ? [-3, -2, -1.5, -1, -0.5, -0.25, 0.25, 0.5, 1, 1.5, 2, 3]
                  : [-1, -0.5, -0.25, -0.12, -0.06, -0.03, -0.01, -0.005, 0.005, 0.01, 0.03, 0.06, 0.12, 0.25, 0.5, 1];
        offsets.forEach((offset) => {
            const x = target + offset;
            try {
                const y = evaluator(x);
                safePoint(lineSeries, x, y);
                safePoint(oneSidedSeries, x, y);
                safePoint(envelopeSeries, x, Math.abs(y));
            } catch {
                return;
            }
        });
    }
    const left = lineSeries.filter((point) => point.x < target).at(-1)?.y;
    const right = lineSeries.find((point) => point.x > target)?.y;
    const family =
        /sin|cos/.test(expression) && /\/x|\/\(/.test(expression)
            ? "removable singularity"
            : /sin|cos/.test(expression) && /inf|oo/.test(rawTarget)
              ? "oscillatory infinite limit"
              : /\/\(x-|\bx-/.test(expression)
                ? "pole-type limit"
                : "local limit";
    const candidate =
        left !== undefined && right !== undefined && Math.abs(left - right) < 0.25
            ? ((left + right) / 2).toFixed(6)
            : "local limit pending";
    const steps: SeriesLimitStep[] = [
        {
            title: "Target parse",
            summary: `Expression ${variable} -> ${rawTarget} atrofida audit qilinadi.`,
            latex: `${variable} \\to ${rawTarget}`,
        },
        {
            title: "Two-sided sample",
            summary: lineSeries.length ? "Chap va o'ng tomondan yaqinlashuvchi sample path qurildi." : "Numeric sample qurilmadi.",
        },
    ];
    return {
        summary: {
            detectedFamily: family,
            candidateResult: candidate,
            convergenceSignal: "two-sided approach",
            dominantTerm: expression.includes("sin") ? "trigonometric cancellation" : "algebraic balance",
            riskSignal: lineSeries.length ? "sampling only; symbolic solve recommended" : "preview unavailable",
            shape: "single-variable limit",
            asymptoticSignal: `target ${rawTarget}`,
            proofSignal:
                family === "removable singularity"
                    ? "local cancellation / expansion lane"
                    : family === "oscillatory infinite limit"
                      ? "oscillatory asymptotic lane"
                      : family === "pole-type limit"
                        ? "one-sided sign analysis lane"
                        : "direct local limit lane",
            errorBoundSignal: "sampled local spread proxy",
            specialFamilySignal: family,
        },
        steps,
        finalFormula: candidate,
        auxiliaryFormula: `${variable} -> ${rawTarget}`,
        lineSeries,
        secondaryLineSeries:
            dimension === "one-sided"
                ? lineSeries.filter((point) => point.x < target)
                : oneSidedSeries,
        tertiaryLineSeries:
            dimension === "one-sided"
                ? lineSeries.filter((point) => point.x > target)
                : envelopeSeries,
        quaternaryLineSeries: dimension === "oscillatory" ? envelopeSeries : undefined,
    };
}

function buildSequenceAnalysis(expression: string, auxiliary: string, dimension: string): SeriesLimitAnalysisResult {
    const { variable } = parseAuxiliary(auxiliary || "n -> inf", "n");
    const evaluator = buildEvaluator(expression, variable);
    const lineSeries: SeriesLimitSeriesPoint[] = [];
    for (let n = 1; n <= 14; n += 1) {
        if (!evaluator) {
            break;
        }
        try {
            safePoint(lineSeries, n, evaluator(n));
        } catch {
            break;
        }
    }
    const deltas = lineSeries.slice(1).map((point, index) => point.y - (lineSeries[index]?.y ?? 0));
    const runningMaxSeries = lineSeries.map((point, index) => ({
        x: point.x,
        y: Math.max(...lineSeries.slice(0, index + 1).map((entry) => entry.y)),
    }));
    const runningMinSeries = lineSeries.map((point, index) => ({
        x: point.x,
        y: Math.min(...lineSeries.slice(0, index + 1).map((entry) => entry.y)),
    }));
    const monotone =
        deltas.length && deltas.every((delta) => delta >= -1e-6)
            ? "increasing"
            : deltas.length && deltas.every((delta) => delta <= 1e-6)
              ? "decreasing"
              : "mixed";
    const tail = lineSeries.slice(-3);
    const candidate = tail.length ? (tail.reduce((sum, point) => sum + point.y, 0) / tail.length).toFixed(6) : "pending";
    return {
        summary: {
            detectedFamily: "sequence",
            candidateResult: candidate,
            convergenceSignal: "tail stabilization preview",
            dominantTerm: "n-asymptotic growth",
            riskSignal: "numeric preview only",
            shape: "discrete sequence",
            monotonicity: monotone,
            boundedness: lineSeries.length ? `range ${Math.min(...lineSeries.map((point) => point.y)).toFixed(3)} to ${Math.max(...lineSeries.map((point) => point.y)).toFixed(3)}` : "pending",
            asymptoticSignal: "n -> inf",
        },
        steps: [
            { title: "Sequence samples", summary: "Birinchi 14 had numeric audit uchun olindi." },
            { title: "Tail trend", summary: `Monotonicity signal: ${monotone}.` },
        ],
        finalFormula: candidate,
        auxiliaryFormula: "n -> inf",
        lineSeries,
        secondaryLineSeries: dimension === "stability" ? deltas.map((delta, index) => ({ x: index + 2, y: delta })) : runningMaxSeries,
        tertiaryLineSeries: dimension === "stability" ? runningMaxSeries : runningMinSeries,
    };
}

function buildSeriesLikeAnalysis(mode: "series" | "convergence" | "power-series", expression: string, auxiliary: string, dimension: string): SeriesLimitAnalysisResult {
    const parsed = parseSumExpression(expression);
    const termExpression = parsed?.term ?? expression;
    const variable = parsed?.index ?? "n";
    const start = Number(parsed?.start ?? "1") || 1;
    const evaluator = buildEvaluator(termExpression, variable);
    const termSeries: SeriesLimitSeriesPoint[] = [];
    const partialSumSeries: SeriesLimitSeriesPoint[] = [];
    const ratioSeries: SeriesLimitSeriesPoint[] = [];
    let partial = 0;
    let previousValue: number | null = null;
    for (let index = 0; index < 14; index += 1) {
        const n = start + index;
        if (!evaluator) {
            break;
        }
        try {
            const value = evaluator(n);
            safePoint(termSeries, n, value);
            partial += value;
            safePoint(partialSumSeries, n, partial);
            if (previousValue !== null && previousValue !== 0) {
                safePoint(ratioSeries, n, Math.abs(value / previousValue));
            }
            previousValue = value;
        } catch {
            break;
        }
    }
    const alternating = /\(-1\)\^/.test(termExpression) || /-1\)\^\(/.test(termExpression);
    const family =
        /factorial/.test(termExpression)
            ? "factorial / exponential series"
            : /sin|cos/.test(termExpression) && /x\^n/.test(termExpression)
              ? "Abel-boundary power series"
              : /sin|cos/.test(termExpression) && /sqrt\(n\)|n\^/.test(termExpression)
                ? "Dirichlet oscillatory series"
                : /Cesaro|cesaro/.test(auxiliary) || /\(-1\)\^n/.test(termExpression)
                  ? "Cesaro summability screen"
            : /sin|cos/.test(termExpression)
              ? "oscillatory trigonometric series"
              : /log/.test(termExpression)
              ? /Tauberian|tauberian/.test(auxiliary)
                ? "Tauberian borderline series"
                : "log-corrected series"
                : alternating
                  ? "alternating series"
                  : /x/.test(termExpression)
                    ? "power series"
                    : "general infinite series";
    const absTail = termSeries.slice(-4).map((point) => Math.abs(point.y));
    const decreases = absTail.length > 1 && absTail.slice(1).every((value, index) => value <= absTail[index] + 1e-6);
    const partialTail = partialSumSeries.slice(-3);
    const candidate = partialTail.length ? partialTail.at(-1)?.y.toFixed(6) ?? "pending" : "pending";
    const testFamily =
        auxiliary.toLowerCase().includes("ratio")
            ? "ratio test"
            : auxiliary.toLowerCase().includes("root")
              ? "root test"
              : auxiliary.toLowerCase().includes("comparison")
                ? "comparison test"
                : alternating
                  ? "alternating test"
                  : "comparison / ratio screen";
    const secondaryTestFamily =
        testFamily === "ratio test"
            ? "root test"
            : testFamily === "root test"
              ? "ratio test"
              : alternating
                ? "absolute convergence screen"
                : "integral test";
    const radiusSignal =
        mode === "power-series"
            ? auxiliary.includes("center=")
                ? `${auxiliary}; radius preview pending`
                : "center pending"
            : null;
    return {
        summary: {
            detectedFamily: mode === "power-series" ? "power series" : family,
            candidateResult: candidate,
            convergenceSignal:
                /Cesaro|cesaro/.test(auxiliary)
                    ? "Cesaro mean stabilization screen"
                    : alternating
                      ? "alternating structure"
                      : decreases
                        ? "tail magnitude decays"
                        : "tail undecided",
            dominantTerm: "term-by-term audit",
            riskSignal: "formal convergence proof still needed",
            shape: mode === "power-series" ? "power-series lane" : "series lane",
            partialSumSignal: partialTail.length ? `S_${partialTail.at(-1)?.x} = ${candidate}` : "pending",
            testFamily,
            secondaryTestFamily,
            radiusSignal,
            endpointSignal: /log/.test(termExpression) ? "logarithmic singular-start screen active" : mode === "power-series" ? "endpoint check symbolic lane'da aniqlanadi" : "sampled term appears regular",
            asymptoticClass:
                /Cesaro|cesaro/.test(auxiliary)
                    ? "summability / mean-stabilization class"
                    : alternating
                      ? "alternating-decay family"
                      : /log/.test(termExpression)
                        ? "log-corrected borderline decay"
                        : "general decay class",
            proofSignal:
                /Dirichlet/i.test(auxiliary)
                    ? "Dirichlet screen active in backend"
                    : /Abel/i.test(auxiliary)
                      ? "Abel boundary screen active in backend"
                      : /Cesaro|cesaro/.test(auxiliary)
                        ? "Cesaro mean screen active in backend"
                        : /Tauberian/i.test(auxiliary)
                          ? "Tauberian screen active in backend"
                        : "preview only; backend symbolic proof stronger",
            comparisonSignal: alternating ? "conditional vs absolute screen" : `${family}; dominant-term comparison`,
            errorBoundSignal: alternating ? "next-term alternating remainder proxy" : "tail bound pending symbolic backend",
            specialFamilySignal:
                /Dirichlet/i.test(auxiliary)
                    ? "Dirichlet candidate"
                    : /Abel/i.test(auxiliary)
                      ? "Abel candidate"
                      : /Cesaro|cesaro/.test(auxiliary)
                        ? "Cesaro candidate"
                        : /Tauberian/i.test(auxiliary)
                          ? "Tauberian candidate"
                          : "classical convergence family",
        },
        steps: [
            { title: "Term extraction", summary: parsed ? "Series term sum(...) ichidan ajratildi." : "Expression bevosita had sifatida ko'rildi." },
            { title: "Partial sums", summary: partialSumSeries.length ? "Birinchi hadlar uchun partial sum trail qurildi." : "Partial sums qurilmadi." },
            { title: "Convergence cue", summary: `Candidate test family: ${testFamily}.` },
        ],
        finalFormula: candidate,
        auxiliaryFormula: parsed ? `${parsed.index} = ${parsed.start} .. ${parsed.end}` : auxiliary,
        lineSeries: termSeries,
        secondaryLineSeries:
            mode === "convergence" && (dimension === "test audit" || dimension === "comparison lane")
                ? ratioSeries
                : partialSumSeries,
        tertiaryLineSeries:
            mode === "power-series"
                ? partialSumSeries.map((point) => ({ x: point.x, y: Math.abs(point.y) }))
                : dimension === "oscillatory series" || dimension === "summability"
                  ? termSeries.map((point) => ({ x: point.x, y: Math.abs(point.y) }))
                  : undefined,
        quaternaryLineSeries:
            mode === "power-series" && (dimension === "endpoint audit" || dimension === "radius study")
                ? ratioSeries
                : undefined,
    };
}

export class SeriesLimitMathService {
    static analyze(mode: SeriesLimitMode, expression: string, auxiliaryExpression: string, dimension: string): SeriesLimitAnalysisResult {
        if (!expression.trim()) {
            return {
                summary: {
                    detectedFamily: mode,
                    candidateResult: "pending",
                    convergenceSignal: "input pending",
                    riskSignal: "expression missing",
                    shape: mode,
                },
                steps: [],
            };
        }

        if (mode === "limits") {
            return buildLimitAnalysis(expression, auxiliaryExpression, dimension);
        }
        if (mode === "sequences") {
            return buildSequenceAnalysis(expression, auxiliaryExpression, dimension);
        }
        if (mode === "power-series") {
            return buildSeriesLikeAnalysis(mode, expression, auxiliaryExpression, dimension);
        }
        return buildSeriesLikeAnalysis(mode === "convergence" ? "convergence" : "series", expression, auxiliaryExpression, dimension);
    }
}
