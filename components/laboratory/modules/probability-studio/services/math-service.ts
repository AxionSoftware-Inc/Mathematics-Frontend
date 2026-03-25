import type {
    ProbabilityAnalysisResult,
    ProbabilityBin,
    ProbabilityMode,
    ProbabilitySeriesPoint,
    ProbabilityStep,
    ProbabilitySummary,
} from "../types";

function mean(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleVariance(values: number[], avg: number) {
    if (values.length < 2) {
        return 0;
    }
    return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
}

function erfApprox(x: number) {
    const sign = x < 0 ? -1 : 1;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const absX = Math.abs(x);
    const t = 1 / (1 + p * absX);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
    return sign * y;
}

function normalPdf(x: number, mu: number, sigma: number) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function normalCdf(x: number, mu: number, sigma: number) {
    return 0.5 * (1 + erfApprox((x - mu) / (sigma * Math.sqrt(2))));
}

function parseNumberList(input: string) {
    return input
        .split(/[,;]+/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));
}

function parseParams(input: string) {
    const result: Record<string, string> = {};
    input
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
            const [key, value] = part.split("=");
            if (key && value) {
                result[key.trim()] = value.trim();
            }
        });
    return result;
}

function buildHistogram(values: number[], bins = 6): ProbabilityBin[] {
    if (!values.length) {
        return [];
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const width = max === min ? 1 : (max - min) / bins;
    const counts = Array.from({ length: bins }, () => 0);
    values.forEach((value) => {
        const idx = Math.min(bins - 1, Math.floor((value - min) / width));
        counts[idx] += 1;
    });
    return counts.map((count, index) => {
        const start = min + width * index;
        const end = start + width;
        return { label: `${start.toFixed(1)}-${end.toFixed(1)}`, count };
    });
}

function parseRegressionPoints(input: string): ProbabilitySeriesPoint[] {
    const matches = [...input.matchAll(/\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)/g)];
    return matches.map((match) => ({ x: Number(match[1]), y: Number(match[2]) })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function lcg(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function analyzeDescriptive(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const values = parseNumberList(datasetExpression);
    const avg = values.length ? mean(values) : 0;
    const variance = values.length ? sampleVariance(values, avg) : 0;
    const stdDev = Math.sqrt(Math.max(variance, 0));
    const params = parseParams(parameterExpression);
    const bins = Number(params.bins ?? 6) || 6;
    const summary: ProbabilitySummary = {
        sampleSize: values.length ? String(values.length) : "pending",
        mean: values.length ? avg.toFixed(3) : null,
        variance: values.length ? variance.toFixed(3) : null,
        stdDev: values.length ? stdDev.toFixed(3) : null,
        riskSignal: values.length ? "descriptive snapshot ready" : "dataset pending",
        shape: values.length ? "1d sample" : null,
    };
    const steps: ProbabilityStep[] = [
        { title: "Sample Parse", summary: "Dataset numeric sample sifatida o'qildi.", formula: values.join(", ") || null },
        { title: "Central Tendency", summary: "Mean va sample variance hisoblandi.", formula: values.length ? `mean=${avg.toFixed(3)}, s^2=${variance.toFixed(3)}` : null },
    ];
    return {
        summary,
        steps,
        finalFormula: values.length ? `\\bar{x} = ${avg.toFixed(3)}` : null,
        auxiliaryFormula: values.length ? `s = ${stdDev.toFixed(3)}` : null,
        histogram: buildHistogram(values, bins),
        scatterSeries: values.map((value, index) => ({ x: index + 1, y: value })),
    };
}

function analyzeDistribution(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const mu = Number(params.mu ?? 0) || 0;
    const sigma = Number(params.sigma ?? 1) || 1;
    const xMatch = datasetExpression.match(/x\s*=\s*(-?\d*\.?\d+)/i);
    const xValue = xMatch ? Number(xMatch[1]) : 0;
    const pdf = normalPdf(xValue, mu, sigma);
    const cdf = normalCdf(xValue, mu, sigma);
    const lineSeries = Array.from({ length: 60 }, (_, index) => {
        const x = mu - 4 * sigma + (8 * sigma * index) / 59;
        return { x, y: normalPdf(x, mu, sigma) };
    });
    return {
        summary: {
            sampleSize: "analytic",
            mean: mu.toFixed(3),
            variance: (sigma * sigma).toFixed(3),
            stdDev: sigma.toFixed(3),
            distributionFamily: params.family ?? "normal",
            confidenceInterval: `P(X ≤ ${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
            riskSignal: "model-based probability lane",
            shape: "1d distribution",
        },
        steps: [
            { title: "Distribution Parse", summary: "Normal taqsimot parametrlari o'qildi.", formula: `μ=${mu}, σ=${sigma}` },
            { title: "Tail Audit", summary: "CDF va density nuqtasi baholandi.", formula: `f(x)=${pdf.toFixed(4)}, F(x)=${cdf.toFixed(4)}` },
        ],
        finalFormula: `f(${xValue.toFixed(2)}) = ${pdf.toFixed(4)}`,
        auxiliaryFormula: `F(${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
        lineSeries,
        scatterSeries: [{ x: xValue, y: pdf }],
    };
}

function analyzeInference(datasetExpression: string): ProbabilityAnalysisResult {
    const match = datasetExpression.match(/control:\s*(\d+)\/(\d+)\s*;\s*variant:\s*(\d+)\/(\d+)/i);
    if (!match) {
        return {
            summary: { shape: "two-group inference", riskSignal: "group parse pending" },
            steps: [{ title: "Parse", summary: "Control/variant formati kutilmoqda.", formula: null }],
        };
    }
    const cSucc = Number(match[1]);
    const cTotal = Number(match[2]);
    const vSucc = Number(match[3]);
    const vTotal = Number(match[4]);
    const p1 = cSucc / cTotal;
    const p2 = vSucc / vTotal;
    const pooled = (cSucc + vSucc) / (cTotal + vTotal);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / cTotal + 1 / vTotal));
    const z = (p2 - p1) / se;
    const pValue = 2 * (1 - normalCdf(Math.abs(z), 0, 1));
    const diff = p2 - p1;
    const ciSe = Math.sqrt((p1 * (1 - p1)) / cTotal + (p2 * (1 - p2)) / vTotal);
    const low = diff - 1.96 * ciSe;
    const high = diff + 1.96 * ciSe;
    return {
        summary: {
            sampleSize: String(cTotal + vTotal),
            pValue: pValue.toFixed(4),
            confidenceInterval: `[${(low * 100).toFixed(2)}%, ${(high * 100).toFixed(2)}%]`,
            riskSignal: pValue < 0.05 ? "statistically significant" : "inconclusive",
            shape: "two-group inference",
        },
        steps: [
            { title: "Conversion Rates", summary: "Control va variant conversion rate baholandi.", formula: `p1=${p1.toFixed(4)}, p2=${p2.toFixed(4)}` },
            { title: "Z Test", summary: "Ikki proporsiya uchun z-test va p-value hisoblandi.", formula: `z=${z.toFixed(3)}, p=${pValue.toFixed(4)}` },
        ],
        finalFormula: `Δ = ${(diff * 100).toFixed(2)}%`,
        auxiliaryFormula: `CI = [${(low * 100).toFixed(2)}%, ${(high * 100).toFixed(2)}%]`,
        scatterSeries: [
            { x: 1, y: p1 },
            { x: 2, y: p2 },
        ],
    };
}

function analyzeRegression(datasetExpression: string): ProbabilityAnalysisResult {
    const points = parseRegressionPoints(datasetExpression);
    if (points.length < 2) {
        return {
            summary: { shape: "2d trend fit", riskSignal: "point parse pending" },
            steps: [{ title: "Parse", summary: "Regression uchun (x,y) nuqtalar kutilmoqda.", formula: null }],
        };
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const xBar = mean(xs);
    const yBar = mean(ys);
    const num = points.reduce((sum, point) => sum + (point.x - xBar) * (point.y - yBar), 0);
    const den = points.reduce((sum, point) => sum + (point.x - xBar) ** 2, 0);
    const slope = den ? num / den : 0;
    const intercept = yBar - slope * xBar;
    const fitSeries = points.map((point) => ({ x: point.x, y: slope * point.x + intercept }));
    const ssTot = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
    const ssRes = points.reduce((sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2, 0);
    const r2 = ssTot ? 1 - ssRes / ssTot : 1;
    return {
        summary: {
            sampleSize: String(points.length),
            regressionFit: `y ≈ ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
            riskSignal: `R² ≈ ${r2.toFixed(3)}`,
            shape: "2d trend fit",
        },
        steps: [
            { title: "Point Parse", summary: "Scatter nuqtalar regression lane'ga yuklandi.", formula: `${points.length} points` },
            { title: "Least Squares Fit", summary: "Linear least-squares fit hisoblandi.", formula: `y=${slope.toFixed(3)}x+${intercept.toFixed(3)}` },
        ],
        finalFormula: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
        auxiliaryFormula: `R^2 = ${r2.toFixed(3)}`,
        scatterSeries: points,
        fitSeries,
    };
}

function analyzeMonteCarlo(parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const samples = Number(params.samples ?? 5000) || 5000;
    const seed = Number(params.seed ?? 42) || 42;
    const rand = lcg(seed);
    const monteCarloCloud: ProbabilitySeriesPoint[] = [];
    const monteCarloTrail: ProbabilitySeriesPoint[] = [];
    let inside = 0;
    for (let index = 1; index <= samples; index += 1) {
        const x = rand();
        const y = rand();
        if (index <= 500) {
            monteCarloCloud.push({ x, y });
        }
        if (x * x + y * y <= 1) {
            inside += 1;
        }
        if (index % Math.max(1, Math.floor(samples / 40)) === 0 || index === samples) {
            monteCarloTrail.push({ x: index, y: 4 * inside / index });
        }
    }
    const estimate = 4 * inside / samples;
    return {
        summary: {
            sampleSize: String(samples),
            monteCarloEstimate: `π ≈ ${estimate.toFixed(4)}`,
            variance: Math.abs(Math.PI - estimate).toFixed(4),
            riskSignal: "stochastic estimate",
            shape: "simulation lane",
        },
        steps: [
            { title: "Simulation Setup", summary: "Pseudo-random seed va sample size o'qildi.", formula: `N=${samples}, seed=${seed}` },
            { title: "Estimator", summary: "Unit quarter circle area orqali π estimator baholandi.", formula: `π≈${estimate.toFixed(4)}` },
        ],
        finalFormula: `\\hat{\\pi} = ${estimate.toFixed(4)}`,
        auxiliaryFormula: `|\\pi-\\hat{\\pi}| = ${Math.abs(Math.PI - estimate).toFixed(4)}`,
        monteCarloTrail,
        monteCarloCloud,
    };
}

export class ProbabilityMathService {
    static analyze(mode: ProbabilityMode, datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
        switch (mode) {
            case "descriptive":
                return analyzeDescriptive(datasetExpression, parameterExpression);
            case "distributions":
                return analyzeDistribution(datasetExpression, parameterExpression);
            case "inference":
                return analyzeInference(datasetExpression);
            case "regression":
                return analyzeRegression(datasetExpression);
            case "monte-carlo":
                return analyzeMonteCarlo(parameterExpression);
            default:
                return { summary: {}, steps: [] };
        }
    }
}
