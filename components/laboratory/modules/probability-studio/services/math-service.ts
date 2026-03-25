import type {
    ProbabilityAnalysisResult,
    ProbabilityBin,
    ProbabilityMatrix,
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

function sampleStd(values: number[]) {
    return Math.sqrt(Math.max(sampleVariance(values, mean(values)), 0));
}

function skewness(values: number[], avg: number, stdDev: number) {
    if (!values.length || stdDev === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + ((value - avg) / stdDev) ** 3, 0) / values.length;
}

function kurtosis(values: number[], avg: number, stdDev: number) {
    if (!values.length || stdDev === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + ((value - avg) / stdDev) ** 4, 0) / values.length - 3;
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

function logGamma(z: number): number {
    const coefficients = [
        676.5203681218851,
        -1259.1392167224028,
        771.3234287776531,
        -176.6150291621406,
        12.507343278686905,
        -0.13857109526572012,
        9.984369578019572e-6,
        1.5056327351493116e-7,
    ];
    if (z < 0.5) {
        return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    let x = 0.9999999999998099;
    const shifted = z - 1;
    for (let index = 0; index < coefficients.length; index += 1) {
        x += coefficients[index] / (shifted + index + 1);
    }
    const t = shifted + coefficients.length - 0.5;
    return 0.9189385332046727 + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function gammaPdf(x: number, shape: number, scale: number) {
    if (x <= 0) {
        return 0;
    }
    const logValue = (shape - 1) * Math.log(x) - x / scale - shape * Math.log(scale) - logGamma(shape);
    return Math.exp(logValue);
}

function betaPdf(x: number, alpha: number, beta: number) {
    if (x <= 0 || x >= 1) {
        return 0;
    }
    const logBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
    return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta);
}

function combination(n: number, k: number) {
    if (k < 0 || k > n) {
        return 0;
    }
    let result = 1;
    for (let i = 1; i <= Math.min(k, n - k); i += 1) {
        result = (result * (n - i + 1)) / i;
    }
    return result;
}

function factorial(n: number) {
    let result = 1;
    for (let i = 2; i <= n; i += 1) {
        result *= i;
    }
    return result;
}

function binomialPmf(k: number, n: number, p: number) {
    return combination(n, k) * p ** k * (1 - p) ** (n - k);
}

function poissonPmf(k: number, lambda: number) {
    return Math.exp(-lambda) * lambda ** k / Math.max(1, factorial(k));
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

function parseMatrixRows(input: string) {
    return input
        .split(";")
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) =>
            row
                .replace(/[()]/g, "")
                .split(/[,\s]+/)
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value)),
        )
        .filter((row) => row.length > 0);
}

function parseGroupedSamples(input: string) {
    return input
        .split("|")
        .map((group) => parseNumberList(group))
        .filter((group) => group.length > 0);
}

function parseRegressionPoints(input: string): ProbabilitySeriesPoint[] {
    const matches = [...input.matchAll(/\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)/g)];
    return matches.map((match) => ({ x: Number(match[1]), y: Number(match[2]) })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function parseMultipleRegressionRows(input: string) {
    const matches = [...input.matchAll(/\(([^\)]*?)\|(-?\d*\.?\d+)\)/g)];
    return matches
        .map((match) => {
            const xs = match[1]
                .split(",")
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value));
            const y = Number(match[2]);
            return { xs, y };
        })
        .filter((row) => row.xs.length > 0 && Number.isFinite(row.y));
}

function parseLogisticRows(input: string) {
    const matches = [...input.matchAll(/\((-?\d*\.?\d+)\s*,\s*(0|1)\)/g)];
    return matches.map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
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

function lcg(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function transpose(matrix: number[][]) {
    return Array.from({ length: matrix[0]?.length ?? 0 }, (_, column) => matrix.map((row) => row[column]));
}

function multiplyMatrixVector(matrix: number[][], vector: number[]) {
    return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function dot(a: number[], b: number[]) {
    return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function normalize(vector: number[]) {
    const norm = Math.sqrt(dot(vector, vector)) || 1;
    return vector.map((value) => value / norm);
}

function powerIteration(matrix: number[][], steps = 18) {
    let vector = normalize(Array.from({ length: matrix.length }, (_, index) => 1 + index));
    for (let step = 0; step < steps; step += 1) {
        vector = normalize(multiplyMatrixVector(matrix, vector));
    }
    const mv = multiplyMatrixVector(matrix, vector);
    const eigenvalue = dot(vector, mv) / Math.max(dot(vector, vector), 1e-9);
    return { eigenvalue, vector };
}

function solveNormalEquations(design: number[][], target: number[]) {
    const columns = design[0]?.length ?? 0;
    const gram = Array.from({ length: columns }, (_, row) =>
        Array.from({ length: columns }, (_, column) =>
            design.reduce((sum, current) => sum + current[row] * current[column], 0),
        ),
    );
    const rhs = Array.from({ length: columns }, (_, column) => design.reduce((sum, current, index) => sum + current[column] * target[index], 0));
    const augmented = gram.map((row, index) => [...row, rhs[index]]);
    for (let pivot = 0; pivot < columns; pivot += 1) {
        let maxRow = pivot;
        for (let row = pivot + 1; row < columns; row += 1) {
            if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) {
                maxRow = row;
            }
        }
        [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];
        const pivotValue = augmented[pivot][pivot] || 1e-9;
        for (let column = pivot; column <= columns; column += 1) {
            augmented[pivot][column] /= pivotValue;
        }
        for (let row = 0; row < columns; row += 1) {
            if (row === pivot) {
                continue;
            }
            const factor = augmented[row][pivot];
            for (let column = pivot; column <= columns; column += 1) {
                augmented[row][column] -= factor * augmented[pivot][column];
            }
        }
    }
    return augmented.map((row) => row[columns]);
}

function buildMatrix(labels: string[], values: number[][]): ProbabilityMatrix {
    return {
        rowLabels: labels,
        columnLabels: labels,
        values,
    };
}

function analyzeDescriptive(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const values = parseNumberList(datasetExpression);
    const avg = values.length ? mean(values) : 0;
    const variance = values.length ? sampleVariance(values, avg) : 0;
    const stdDev = Math.sqrt(Math.max(variance, 0));
    const skew = values.length ? skewness(values, avg, stdDev) : 0;
    const kurt = values.length ? kurtosis(values, avg, stdDev) : 0;
    const params = parseParams(parameterExpression);
    const bins = Number(params.bins ?? 6) || 6;
    const sorted = [...values].sort((left, right) => left - right);
    const q1 = sorted[Math.floor((sorted.length - 1) * 0.25)] ?? null;
    const median = sorted[Math.floor((sorted.length - 1) * 0.5)] ?? null;
    const q3 = sorted[Math.floor((sorted.length - 1) * 0.75)] ?? null;
    const summary: ProbabilitySummary = {
        sampleSize: values.length ? String(values.length) : "pending",
        mean: values.length ? avg.toFixed(3) : null,
        variance: values.length ? variance.toFixed(3) : null,
        stdDev: values.length ? stdDev.toFixed(3) : null,
        skewness: values.length ? skew.toFixed(3) : null,
        kurtosis: values.length ? kurt.toFixed(3) : null,
        riskSignal: values.length ? "empirical spread ready" : "dataset pending",
        shape: values.length ? "1d sample" : null,
    };
    const steps: ProbabilityStep[] = [
        { title: "Sample Parse", summary: "Dataset numeric sample sifatida o'qildi.", formula: values.join(", ") || null },
        { title: "Moment Audit", summary: "Mean, variance va standard deviation hisoblandi.", formula: values.length ? `mean=${avg.toFixed(3)}, s^2=${variance.toFixed(3)}, s=${stdDev.toFixed(3)}` : null },
        { title: "Shape Audit", summary: "Skewness va kurtosis orqali taqsimot shakli ko'rildi.", formula: values.length ? `skew=${skew.toFixed(3)}, kurt=${kurt.toFixed(3)}` : null },
    ];
    return {
        summary,
        steps,
        finalFormula: values.length ? `\\bar{x} = ${avg.toFixed(3)}` : null,
        auxiliaryFormula: values.length && q1 !== null && median !== null && q3 !== null ? `Q_1=${q1.toFixed(3)},\\ \\tilde{x}=${median.toFixed(3)},\\ Q_3=${q3.toFixed(3)}` : null,
        histogram: buildHistogram(values, bins),
        scatterSeries: values.map((value, index) => ({ x: index + 1, y: value })),
    };
}

function analyzeDistribution(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const family = (params.family ?? "normal").toLowerCase();
    const xMatch = datasetExpression.match(/x\s*=\s*(-?\d*\.?\d+)/i);
    const xValue = xMatch ? Number(xMatch[1]) : 0;

    if (family === "binomial") {
        const n = Number(params.n ?? 10) || 10;
        const p = Number(params.p ?? 0.5) || 0.5;
        const k = Math.round(xValue);
        const pmf = binomialPmf(k, n, p);
        const lineSeries = Array.from({ length: n + 1 }, (_, index) => ({ x: index, y: binomialPmf(index, n, p) }));
        return {
            summary: {
                sampleSize: "analytic",
                mean: (n * p).toFixed(3),
                variance: (n * p * (1 - p)).toFixed(3),
                stdDev: Math.sqrt(n * p * (1 - p)).toFixed(3),
                distributionFamily: "binomial",
                testStatistic: `P(X=${k}) = ${pmf.toFixed(4)}`,
                riskSignal: "discrete event model",
                shape: "discrete distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Binomial parametrlari o'qildi.", formula: `n=${n}, p=${p.toFixed(3)}` },
                { title: "Mass Audit", summary: "Discrete probability mass ko'rildi.", formula: `P(X=${k})=${pmf.toFixed(4)}` },
            ],
            finalFormula: `P(X=${k}) = ${pmf.toFixed(4)}`,
            auxiliaryFormula: `E[X] = ${(n * p).toFixed(3)}`,
            lineSeries,
            scatterSeries: [{ x: k, y: pmf }],
        };
    }

    if (family === "poisson") {
        const lambda = Number(params.lambda ?? 4) || 4;
        const k = Math.round(xValue);
        const pmf = poissonPmf(k, lambda);
        const lineSeries = Array.from({ length: Math.max(12, Math.ceil(lambda * 3)) }, (_, index) => ({ x: index, y: poissonPmf(index, lambda) }));
        return {
            summary: {
                sampleSize: "analytic",
                mean: lambda.toFixed(3),
                variance: lambda.toFixed(3),
                stdDev: Math.sqrt(lambda).toFixed(3),
                distributionFamily: "poisson",
                testStatistic: `P(X=${k}) = ${pmf.toFixed(4)}`,
                riskSignal: "count process model",
                shape: "discrete distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Poisson rate parse qilindi.", formula: `lambda=${lambda.toFixed(3)}` },
                { title: "Mass Audit", summary: "Discrete count probability baholandi.", formula: `P(X=${k})=${pmf.toFixed(4)}` },
            ],
            finalFormula: `P(X=${k}) = ${pmf.toFixed(4)}`,
            auxiliaryFormula: `E[X] = ${lambda.toFixed(3)}`,
            lineSeries,
            scatterSeries: [{ x: k, y: pmf }],
        };
    }

    if (family === "beta") {
        const alpha = Number(params.alpha ?? 2) || 2;
        const beta = Number(params.beta ?? 5) || 5;
        const clipped = Math.min(0.999, Math.max(0.001, xValue));
        const pdf = betaPdf(clipped, alpha, beta);
        const lineSeries = Array.from({ length: 120 }, (_, index) => {
            const x = index / 119;
            return { x, y: betaPdf(Math.min(0.999, Math.max(0.001, x)), alpha, beta) };
        });
        return {
            summary: {
                sampleSize: "analytic",
                mean: (alpha / (alpha + beta)).toFixed(3),
                variance: ((alpha * beta) / (((alpha + beta) ** 2) * (alpha + beta + 1))).toFixed(3),
                stdDev: Math.sqrt((alpha * beta) / (((alpha + beta) ** 2) * (alpha + beta + 1))).toFixed(3),
                distributionFamily: "beta",
                testStatistic: `f(x) = ${pdf.toFixed(4)}`,
                riskSignal: "probability prior family",
                shape: "continuous distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Beta shape parametrlari parse qilindi.", formula: `alpha=${alpha.toFixed(3)}, beta=${beta.toFixed(3)}` },
                { title: "Density Audit", summary: "Bounded-support density ko'rildi.", formula: `f(${clipped.toFixed(3)})=${pdf.toFixed(4)}` },
            ],
            finalFormula: `f(${clipped.toFixed(3)}) = ${pdf.toFixed(4)}`,
            auxiliaryFormula: `E[X] = ${(alpha / (alpha + beta)).toFixed(3)}`,
            lineSeries,
            scatterSeries: [{ x: clipped, y: pdf }],
        };
    }

    if (family === "gamma") {
        const shape = Number(params.shape ?? 2) || 2;
        const scale = Number(params.scale ?? 1.5) || 1.5;
        const pdf = gammaPdf(xValue, shape, scale);
        const lineSeries = Array.from({ length: 120 }, (_, index) => {
            const x = (shape * scale * 4 * index) / 119;
            return { x, y: gammaPdf(x, shape, scale) };
        });
        return {
            summary: {
                sampleSize: "analytic",
                mean: (shape * scale).toFixed(3),
                variance: (shape * scale * scale).toFixed(3),
                stdDev: Math.sqrt(shape * scale * scale).toFixed(3),
                distributionFamily: "gamma",
                testStatistic: `f(x) = ${pdf.toFixed(4)}`,
                riskSignal: "positive continuous family",
                shape: "continuous distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Gamma shape/scale parse qilindi.", formula: `k=${shape.toFixed(3)}, theta=${scale.toFixed(3)}` },
                { title: "Density Audit", summary: "Positive support density baholandi.", formula: `f(${xValue.toFixed(3)})=${pdf.toFixed(4)}` },
            ],
            finalFormula: `f(${xValue.toFixed(3)}) = ${pdf.toFixed(4)}`,
            auxiliaryFormula: `E[X] = ${(shape * scale).toFixed(3)}`,
            lineSeries,
            scatterSeries: [{ x: xValue, y: pdf }],
        };
    }

    if (family === "t") {
        const df = Number(params.df ?? 8) || 8;
        const gammaRatio = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2));
        const pdf = (gammaRatio / Math.sqrt(df * Math.PI)) * (1 + (xValue * xValue) / df) ** (-(df + 1) / 2);
        const lineSeries = Array.from({ length: 120 }, (_, index) => {
            const x = -4 + (8 * index) / 119;
            const density = (gammaRatio / Math.sqrt(df * Math.PI)) * (1 + (x * x) / df) ** (-(df + 1) / 2);
            return { x, y: density };
        });
        return {
            summary: {
                sampleSize: "analytic",
                mean: df > 1 ? "0.000" : "undefined",
                variance: df > 2 ? (df / (df - 2)).toFixed(3) : "infinite",
                stdDev: df > 2 ? Math.sqrt(df / (df - 2)).toFixed(3) : "infinite",
                distributionFamily: "student-t",
                testStatistic: `f(x) = ${pdf.toFixed(4)}`,
                riskSignal: "heavy-tail inference family",
                shape: "continuous distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Student-t degrees of freedom parse qilindi.", formula: `df=${df}` },
                { title: "Density Audit", summary: "Heavy-tail density ko'rildi.", formula: `f(${xValue.toFixed(3)})=${pdf.toFixed(4)}` },
            ],
            finalFormula: `f(${xValue.toFixed(3)}) = ${pdf.toFixed(4)}`,
            auxiliaryFormula: `df = ${df}`,
            lineSeries,
            scatterSeries: [{ x: xValue, y: pdf }],
        };
    }

    if (family === "chi-square") {
        const df = Number(params.df ?? 6) || 6;
        const pdf = gammaPdf(xValue, df / 2, 2);
        const lineSeries = Array.from({ length: 120 }, (_, index) => {
            const x = (df * 4 * index) / 119;
            return { x, y: gammaPdf(x, df / 2, 2) };
        });
        return {
            summary: {
                sampleSize: "analytic",
                mean: df.toFixed(3),
                variance: (2 * df).toFixed(3),
                stdDev: Math.sqrt(2 * df).toFixed(3),
                distributionFamily: "chi-square",
                testStatistic: `f(x) = ${pdf.toFixed(4)}`,
                riskSignal: "goodness-of-fit family",
                shape: "continuous distribution",
            },
            steps: [
                { title: "Family Parse", summary: "Chi-square degrees of freedom parse qilindi.", formula: `df=${df}` },
                { title: "Density Audit", summary: "Chi-square density baholandi.", formula: `f(${xValue.toFixed(3)})=${pdf.toFixed(4)}` },
            ],
            finalFormula: `f(${xValue.toFixed(3)}) = ${pdf.toFixed(4)}`,
            auxiliaryFormula: `E[X] = ${df.toFixed(3)}`,
            lineSeries,
            scatterSeries: [{ x: xValue, y: pdf }],
        };
    }

    if (family === "exponential") {
        const lambda = Number(params.lambda ?? 1) || 1;
        const pdf = xValue < 0 ? 0 : lambda * Math.exp(-lambda * xValue);
        const cdf = xValue < 0 ? 0 : 1 - Math.exp(-lambda * xValue);
        const lineSeries = Array.from({ length: 80 }, (_, index) => {
            const x = (8 * index) / 79;
            return { x, y: lambda * Math.exp(-lambda * x) };
        });
        return {
            summary: {
                sampleSize: "analytic",
                mean: (1 / lambda).toFixed(3),
                variance: (1 / (lambda * lambda)).toFixed(3),
                stdDev: (1 / lambda).toFixed(3),
                distributionFamily: "exponential",
                confidenceInterval: `P(X <= ${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
                riskSignal: "memoryless distribution lane",
                shape: "1d distribution",
            },
            steps: [
                { title: "Distribution Parse", summary: "Exponential family parametrlari o'qildi.", formula: `lambda=${lambda.toFixed(3)}` },
                { title: "Tail Audit", summary: "Density va cumulative probability baholandi.", formula: `f(x)=${pdf.toFixed(4)}, F(x)=${cdf.toFixed(4)}` },
            ],
            finalFormula: `f(${xValue.toFixed(2)}) = ${pdf.toFixed(4)}`,
            auxiliaryFormula: `F(${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
            lineSeries,
            scatterSeries: [{ x: xValue, y: pdf }],
        };
    }

    const mu = Number(params.mu ?? 0) || 0;
    const sigma = Number(params.sigma ?? 1) || 1;
    const pdf = normalPdf(xValue, mu, sigma);
    const cdf = normalCdf(xValue, mu, sigma);
    const lineSeries = Array.from({ length: 80 }, (_, index) => {
        const x = mu - 4 * sigma + (8 * sigma * index) / 79;
        return { x, y: normalPdf(x, mu, sigma) };
    });
    return {
        summary: {
            sampleSize: "analytic",
            mean: mu.toFixed(3),
            variance: (sigma * sigma).toFixed(3),
            stdDev: sigma.toFixed(3),
            distributionFamily: "normal",
            confidenceInterval: `P(X <= ${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
            riskSignal: "model-based probability lane",
            shape: "1d distribution",
        },
        steps: [
            { title: "Distribution Parse", summary: "Normal family parametrlari o'qildi.", formula: `mu=${mu.toFixed(3)}, sigma=${sigma.toFixed(3)}` },
            { title: "Tail Audit", summary: "Density va CDF nuqtasi baholandi.", formula: `f(x)=${pdf.toFixed(4)}, F(x)=${cdf.toFixed(4)}` },
        ],
        finalFormula: `f(${xValue.toFixed(2)}) = ${pdf.toFixed(4)}`,
        auxiliaryFormula: `F(${xValue.toFixed(2)}) = ${cdf.toFixed(4)}`,
        lineSeries,
        scatterSeries: [{ x: xValue, y: pdf }],
    };
}

function analyzeInference(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const test = (params.test ?? "").toLowerCase();
    const abMatch = datasetExpression.match(/control:\s*(\d+)\/(\d+)\s*;\s*variant:\s*(\d+)\/(\d+)/i);
    if (abMatch && (!test || test === "ztest")) {
        const cSucc = Number(abMatch[1]);
        const cTotal = Number(abMatch[2]);
        const vSucc = Number(abMatch[3]);
        const vTotal = Number(abMatch[4]);
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
                power: `effect ${(Math.abs(diff) / Math.max(ciSe, 1e-9)).toFixed(2)}`,
                testStatistic: `z = ${z.toFixed(3)}`,
                riskSignal: pValue < 0.05 ? "statistically significant" : "inconclusive",
                shape: "two-group inference",
            },
            steps: [
                { title: "Conversion Rates", summary: "Control va variant conversion rate baholandi.", formula: `p1=${p1.toFixed(4)}, p2=${p2.toFixed(4)}` },
                { title: "Z Test", summary: "Ikki proporsiya uchun z-test va p-value hisoblandi.", formula: `z=${z.toFixed(3)}, p=${pValue.toFixed(4)}` },
            ],
            finalFormula: `\\Delta = ${(diff * 100).toFixed(2)}\\%`,
            auxiliaryFormula: `CI = [${(low * 100).toFixed(2)}\\%, ${(high * 100).toFixed(2)}\\%]`,
            scatterSeries: [{ x: 1, y: p1 }, { x: 2, y: p2 }],
        };
    }

    const groups = parseGroupedSamples(datasetExpression);
    if ((test === "anova" || groups.length > 2) && groups.length >= 2) {
        const all = groups.flat();
        const grandMean = mean(all);
        const ssBetween = groups.reduce((sum, group) => sum + group.length * (mean(group) - grandMean) ** 2, 0);
        const ssWithin = groups.reduce((sum, group) => {
            const groupMean = mean(group);
            return sum + group.reduce((inner, value) => inner + (value - groupMean) ** 2, 0);
        }, 0);
        const dfBetween = groups.length - 1;
        const dfWithin = all.length - groups.length;
        const msBetween = ssBetween / Math.max(dfBetween, 1);
        const msWithin = ssWithin / Math.max(dfWithin, 1);
        const f = msBetween / Math.max(msWithin, 1e-9);
        return {
            summary: {
                sampleSize: String(all.length),
                testStatistic: `F = ${f.toFixed(3)}`,
                pValue: (1 - normalCdf(Math.sqrt(Math.abs(f)), 0, 1)).toFixed(4),
                riskSignal: f > 4 ? "group means differ" : "weak group separation",
                shape: "anova lane",
            },
            steps: [
                { title: "Group Parse", summary: "ANOVA uchun bir nechta guruh parse qilindi.", formula: `${groups.length} groups` },
                { title: "Variance Split", summary: "Between va within-group variance ajratildi.", formula: `F=${f.toFixed(3)}` },
            ],
            finalFormula: `F = ${f.toFixed(3)}`,
            auxiliaryFormula: `MS_b = ${msBetween.toFixed(3)},\\ MS_w = ${msWithin.toFixed(3)}`,
            scatterSeries: groups.map((group, index) => ({ x: index + 1, y: mean(group) })),
        };
    }

    if (test === "nonparametric" && groups.length >= 2) {
        const groupA = groups[0];
        const groupB = groups[1];
        const combined = [...groupA.map((value) => ({ value, group: 0 })), ...groupB.map((value) => ({ value, group: 1 }))].sort((a, b) => a.value - b.value);
        const ranks = combined.map((item, index) => ({ ...item, rank: index + 1 }));
        const rankSumA = ranks.filter((item) => item.group === 0).reduce((sum, item) => sum + item.rank, 0);
        const u1 = rankSumA - (groupA.length * (groupA.length + 1)) / 2;
        const mu = (groupA.length * groupB.length) / 2;
        const sigma = Math.sqrt((groupA.length * groupB.length * (groupA.length + groupB.length + 1)) / 12);
        const z = (u1 - mu) / Math.max(sigma, 1e-9);
        const pValue = 2 * (1 - normalCdf(Math.abs(z), 0, 1));
        return {
            summary: {
                sampleSize: String(groupA.length + groupB.length),
                pValue: pValue.toFixed(4),
                testStatistic: `U = ${u1.toFixed(3)}`,
                riskSignal: pValue < 0.05 ? "rank distributions differ" : "rank distributions close",
                shape: "nonparametric lane",
            },
            steps: [
                { title: "Rank Parse", summary: "Mann-Whitney uchun combined rank table qurildi.", formula: `n1=${groupA.length}, n2=${groupB.length}` },
                { title: "U Statistic", summary: "Rank sum orqali U statistic va z approximation olindi.", formula: `U=${u1.toFixed(3)}, z=${z.toFixed(3)}` },
            ],
            finalFormula: `U = ${u1.toFixed(3)}`,
            auxiliaryFormula: `p ≈ ${pValue.toFixed(4)}`,
            scatterSeries: [{ x: 1, y: mean(groupA) }, { x: 2, y: mean(groupB) }],
        };
    }

    if (test === "chisquare") {
        const observed = parseNumberList(datasetExpression);
        const expected = parseNumberList(params.expected ?? "") || observed.map(() => mean(observed));
        if (observed.length >= 2 && expected.length === observed.length) {
            const chi2 = observed.reduce((sum, value, index) => sum + (value - expected[index]) ** 2 / Math.max(expected[index], 1e-9), 0);
            return {
                summary: {
                    sampleSize: String(observed.reduce((sum, value) => sum + value, 0)),
                    testStatistic: `χ² = ${chi2.toFixed(3)}`,
                    pValue: (1 - normalCdf(Math.sqrt(chi2), 0, 1)).toFixed(4),
                    riskSignal: chi2 > observed.length ? "fit mismatch" : "fit plausible",
                    shape: "chi-square lane",
                },
                steps: [
                    { title: "Observed / Expected", summary: "Observed va expected counts parse qilindi.", formula: `k=${observed.length}` },
                    { title: "Chi-square", summary: "Goodness-of-fit statistic baholandi.", formula: `chi^2=${chi2.toFixed(3)}` },
                ],
                finalFormula: `\\chi^2 = ${chi2.toFixed(3)}`,
                auxiliaryFormula: `df = ${Math.max(observed.length - 1, 1)}`,
                histogram: observed.map((value, index) => ({ label: `c${index + 1}`, count: value })),
            };
        }
    }

    const values = parseNumberList(datasetExpression);
    if (test === "power" && values.length >= 2) {
        const effect = Number(params.effect ?? (mean(values) / Math.max(sampleStd(values), 1e-9)).toFixed(3));
        const alpha = Number(params.alpha ?? 0.05);
        const power = normalCdf(Math.sqrt(values.length) * effect - 1.96, 0, 1);
        return {
            summary: {
                sampleSize: String(values.length),
                power: power.toFixed(3),
                testStatistic: `effect = ${effect.toFixed(3)}`,
                riskSignal: power > 0.8 ? "well powered" : "under-powered",
                shape: "power analysis",
            },
            steps: [
                { title: "Design Parse", summary: "Sample size va effect signal parse qilindi.", formula: `n=${values.length}, alpha=${alpha}` },
                { title: "Power Audit", summary: "Approximate normal power hisoblandi.", formula: `power=${power.toFixed(3)}` },
            ],
            finalFormula: `power ≈ ${power.toFixed(3)}`,
            auxiliaryFormula: `effect = ${effect.toFixed(3)}`,
            lineSeries: values.map((value, index) => ({ x: index + 1, y: value })),
        };
    }

    if (values.length >= 3) {
        const avg = mean(values);
        const variance = sampleVariance(values, avg);
        const stdDev = Math.sqrt(Math.max(variance, 0));
        const se = stdDev / Math.sqrt(values.length);
        const tStat = se ? avg / se : 0;
        const pApprox = 2 * (1 - normalCdf(Math.abs(tStat), 0, 1));
        const low = avg - 1.96 * se;
        const high = avg + 1.96 * se;
        return {
            summary: {
                sampleSize: String(values.length),
                mean: avg.toFixed(3),
                stdDev: stdDev.toFixed(3),
                pValue: pApprox.toFixed(4),
                confidenceInterval: `[${low.toFixed(3)}, ${high.toFixed(3)}]`,
                power: normalCdf(Math.sqrt(values.length) * (avg / Math.max(stdDev, 1e-9)) - 1.96, 0, 1).toFixed(3),
                testStatistic: `t ≈ ${tStat.toFixed(3)}`,
                riskSignal: pApprox < 0.05 ? "mean differs from baseline" : "mean near baseline",
                shape: "one-sample inference",
            },
            steps: [
                { title: "Sample Parse", summary: "One-sample inference uchun numeric sample o'qildi.", formula: `${values.length} observations` },
                { title: "Mean Test", summary: "Mean, standard error va t approximation baholandi.", formula: `t≈${tStat.toFixed(3)}, p≈${pApprox.toFixed(4)}` },
            ],
            finalFormula: `\\bar{x} = ${avg.toFixed(3)}`,
            auxiliaryFormula: `CI = [${low.toFixed(3)}, ${high.toFixed(3)}]`,
            histogram: buildHistogram(values, 6),
            scatterSeries: values.map((value, index) => ({ x: index + 1, y: value })),
        };
    }

    return {
        summary: { shape: "inference lane", riskSignal: "sample parse pending" },
        steps: [{ title: "Parse", summary: "AB test, grouped sample yoki numeric sample formati kutilmoqda.", formula: null }],
    };
}

function analyzeRegression(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const model = (params.model ?? "linear").toLowerCase();

    if (model === "multiple") {
        const rows = parseMultipleRegressionRows(datasetExpression);
        if (!rows.length) {
            return { summary: { shape: "multiple regression", riskSignal: "row parse pending" }, steps: [{ title: "Parse", summary: "Format `(x1,x2|y)` kutilmoqda.", formula: null }] };
        }
        const design = rows.map((row) => [1, ...row.xs]);
        const target = rows.map((row) => row.y);
        const coefficients = solveNormalEquations(design, target);
        const fitted = rows.map((row) => coefficients[0] + row.xs.reduce((sum, value, index) => sum + coefficients[index + 1] * value, 0));
        const yBar = mean(target);
        const ssTot = target.reduce((sum, value) => sum + (value - yBar) ** 2, 0);
        const residuals = target.map((value, index) => value - fitted[index]);
        const ssRes = residuals.reduce((sum, value) => sum + value * value, 0);
        const r2 = ssTot ? 1 - ssRes / ssTot : 1;
        const maxResidual = Math.max(...residuals.map((value) => Math.abs(value)));
        return {
            summary: {
                sampleSize: String(rows.length),
                regressionFit: coefficients.map((value, index) => (index === 0 ? value.toFixed(3) : `${value.toFixed(3)}x${index}`)).join(" + "),
                residualSignal: `max residual ≈ ${maxResidual.toFixed(3)}`,
                outlierSignal: `largest residual row ${String(residuals.findIndex((value) => Math.abs(value) === maxResidual) + 1)}`,
                leverageSignal: `predictors=${rows[0].xs.length}`,
                riskSignal: `R^2 ≈ ${r2.toFixed(3)}`,
                shape: "multiple regression",
            },
            steps: [
                { title: "Design Matrix", summary: "Multiple regression uchun design matrix qurildi.", formula: `${rows.length}x${design[0].length}` },
                { title: "Normal Equations", summary: "Least squares coefficients yechildi.", formula: coefficients.map((value, index) => `b${index}=${value.toFixed(3)}`).join(", ") },
            ],
            finalFormula: `y = ${coefficients.map((value, index) => (index === 0 ? value.toFixed(3) : `${value.toFixed(3)}x_${index}`)).join(" + ")}`,
            auxiliaryFormula: `R^2 = ${r2.toFixed(3)}`,
            scatterSeries: rows.map((row) => ({ x: row.xs[0], y: row.y })),
            fitSeries: rows.map((row, index) => ({ x: row.xs[0], y: fitted[index] })),
        };
    }

    if (model === "logistic") {
        const rows = parseLogisticRows(datasetExpression);
        if (rows.length < 4) {
            return { summary: { shape: "logistic regression", riskSignal: "binary point parse pending" }, steps: [{ title: "Parse", summary: "Format `(x, y)` va binary y kutilmoqda.", formula: null }] };
        }
        let b0 = 0;
        let b1 = 0;
        const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
        for (let iter = 0; iter < 400; iter += 1) {
            let g0 = 0;
            let g1 = 0;
            rows.forEach((row) => {
                const p = sigmoid(b0 + b1 * row.x);
                g0 += row.y - p;
                g1 += (row.y - p) * row.x;
            });
            b0 += 0.02 * g0;
            b1 += 0.02 * g1;
        }
        const fitSeries = rows.map((row) => ({ x: row.x, y: sigmoid(b0 + b1 * row.x) }));
        const residuals = rows.map((row, index) => row.y - fitSeries[index].y);
        return {
            summary: {
                sampleSize: String(rows.length),
                regressionFit: `logit(p) = ${b0.toFixed(3)} + ${b1.toFixed(3)}x`,
                residualSignal: `mean residual ≈ ${mean(residuals).toFixed(3)}`,
                outlierSignal: `max residual ≈ ${Math.max(...residuals.map((value) => Math.abs(value))).toFixed(3)}`,
                leverageSignal: `decision boundary ≈ ${(-b0 / Math.max(Math.abs(b1), 1e-9)).toFixed(3)}`,
                riskSignal: "binary classification fit",
                shape: "logistic regression",
            },
            steps: [
                { title: "Binary Parse", summary: "Binary response nuqtalar parse qilindi.", formula: `${rows.length} points` },
                { title: "Gradient Fit", summary: "Simple logistic gradient updates bajarildi.", formula: `b0=${b0.toFixed(3)}, b1=${b1.toFixed(3)}` },
            ],
            finalFormula: `logit(p) = ${b0.toFixed(3)} + ${b1.toFixed(3)}x`,
            auxiliaryFormula: `boundary ≈ ${(-b0 / Math.max(Math.abs(b1), 1e-9)).toFixed(3)}`,
            scatterSeries: rows.map((row) => ({ x: row.x, y: row.y })),
            fitSeries,
        };
    }

    const points = parseRegressionPoints(datasetExpression);
    if (points.length < 2) {
        return {
            summary: { shape: "2d trend fit", riskSignal: "point parse pending" },
            steps: [{ title: "Parse", summary: "Regression uchun (x,y) nuqtalar kutilmoqda.", formula: null }],
        };
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const yBar = mean(ys);

    if (model === "quadratic") {
        const coefficients = solveNormalEquations(points.map((point) => [1, point.x, point.x * point.x]), ys);
        const [a, b, c] = coefficients;
        const fitSeries = points.map((point) => ({ x: point.x, y: a + b * point.x + c * point.x * point.x }));
        const ssTot = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
        const residuals = points.map((point) => point.y - (a + b * point.x + c * point.x * point.x));
        const ssRes = residuals.reduce((sum, value) => sum + value * value, 0);
        const r2 = ssTot ? 1 - ssRes / ssTot : 1;
        return {
            summary: {
                sampleSize: String(points.length),
                regressionFit: `y ≈ ${a.toFixed(3)} + ${b.toFixed(3)}x + ${c.toFixed(3)}x^2`,
                residualSignal: `RMSE ≈ ${Math.sqrt(ssRes / points.length).toFixed(3)}`,
                outlierSignal: `max residual ≈ ${Math.max(...residuals.map((value) => Math.abs(value))).toFixed(3)}`,
                riskSignal: `R^2 ≈ ${r2.toFixed(3)}`,
                forecast: `x_next=${(Math.max(...xs) + 1).toFixed(1)} -> ${(a + b * (Math.max(...xs) + 1) + c * (Math.max(...xs) + 1) ** 2).toFixed(3)}`,
                shape: "quadratic fit",
            },
            steps: [
                { title: "Point Parse", summary: "Scatter nuqtalar regression lane'ga yuklandi.", formula: `${points.length} points` },
                { title: "Quadratic Fit", summary: "Normal equation orqali quadratic fit baholandi.", formula: `y=${a.toFixed(3)}+${b.toFixed(3)}x+${c.toFixed(3)}x^2` },
            ],
            finalFormula: `y = ${a.toFixed(3)} + ${b.toFixed(3)}x + ${c.toFixed(3)}x^2`,
            auxiliaryFormula: `R^2 = ${r2.toFixed(3)}`,
            scatterSeries: points,
            fitSeries,
        };
    }

    const xBar = mean(xs);
    const num = points.reduce((sum, point) => sum + (point.x - xBar) * (point.y - yBar), 0);
    const den = points.reduce((sum, point) => sum + (point.x - xBar) ** 2, 0);
    const slope = den ? num / den : 0;
    const intercept = yBar - slope * xBar;
    const fitSeries = points.map((point) => ({ x: point.x, y: slope * point.x + intercept }));
    const residuals = points.map((point) => point.y - (slope * point.x + intercept));
    const ssTot = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
    const ssRes = residuals.reduce((sum, value) => sum + value * value, 0);
    const r2 = ssTot ? 1 - ssRes / ssTot : 1;
    return {
        summary: {
            sampleSize: String(points.length),
            regressionFit: `y ≈ ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
            residualSignal: `RMSE ≈ ${Math.sqrt(ssRes / points.length).toFixed(3)}`,
            outlierSignal: `max residual ≈ ${Math.max(...residuals.map((value) => Math.abs(value))).toFixed(3)}`,
            leverageSignal: `x spread ≈ ${(Math.max(...xs) - Math.min(...xs)).toFixed(3)}`,
            riskSignal: `R^2 ≈ ${r2.toFixed(3)}`,
            forecast: `x_next=${(Math.max(...xs) + 1).toFixed(1)} -> ${(slope * (Math.max(...xs) + 1) + intercept).toFixed(3)}`,
            shape: "linear fit",
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

function analyzeBayesian(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const successMatch = datasetExpression.match(/successes\s*=\s*(\d+)/i);
    const trialMatch = datasetExpression.match(/trials\s*=\s*(\d+)/i);
    const successes = successMatch ? Number(successMatch[1]) : 0;
    const trials = trialMatch ? Number(trialMatch[1]) : 0;
    const priorAlpha = Number(params.prior_alpha ?? 1) || 1;
    const priorBeta = Number(params.prior_beta ?? 1) || 1;
    const futureN = Number(params.future_n ?? 20) || 20;
    const posteriorAlpha = priorAlpha + successes;
    const posteriorBeta = priorBeta + Math.max(0, trials - successes);
    const posteriorMean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    const posteriorVariance = (posteriorAlpha * posteriorBeta) / (((posteriorAlpha + posteriorBeta) ** 2) * (posteriorAlpha + posteriorBeta + 1));
    const posteriorStd = Math.sqrt(Math.max(posteriorVariance, 0));
    const low = Math.max(0, posteriorMean - 1.96 * posteriorStd);
    const high = Math.min(1, posteriorMean + 1.96 * posteriorStd);
    const predictive = futureN * posteriorMean;
    const nullLikelihood = 0.5 ** Math.max(trials, 1);
    const evidence = Math.exp(logGamma(posteriorAlpha) + logGamma(posteriorBeta) - logGamma(posteriorAlpha + posteriorBeta) - (logGamma(priorAlpha) + logGamma(priorBeta) - logGamma(priorAlpha + priorBeta)));
    const bayesFactor = evidence / Math.max(nullLikelihood, 1e-12);
    const densitySeries = Array.from({ length: 100 }, (_, index) => {
        const x = index / 99;
        return { x, y: betaPdf(Math.min(0.999, Math.max(0.001, x)), posteriorAlpha, posteriorBeta) };
    });
    const sampler = (params.sampler ?? "mh").toLowerCase();
    const chain: ProbabilitySeriesPoint[] = [];
    if (sampler === "mh") {
        let current = posteriorMean;
        const rand = lcg(Number(params.seed ?? 7) || 7);
        const target = (value: number) => betaPdf(Math.min(0.999, Math.max(0.001, value)), posteriorAlpha, posteriorBeta);
        for (let index = 0; index < 180; index += 1) {
            const proposal = Math.min(0.999, Math.max(0.001, current + (rand() - 0.5) * 0.18));
            const ratio = target(proposal) / Math.max(target(current), 1e-9);
            if (rand() < Math.min(1, ratio)) {
                current = proposal;
            }
            chain.push({ x: index + 1, y: current });
        }
    }
    return {
        summary: {
            sampleSize: trials ? String(trials) : "pending",
            posteriorMean: posteriorMean.toFixed(4),
            credibleInterval: `[${low.toFixed(4)}, ${high.toFixed(4)}]`,
            posteriorPredictive: `E[Y_future] ≈ ${predictive.toFixed(3)}`,
            bayesFactor: `BF ≈ ${bayesFactor.toFixed(3)}`,
            mcmcSignal: chain.length ? `chain mean ≈ ${mean(chain.map((point) => point.y)).toFixed(4)}` : "closed form posterior",
            distributionFamily: "beta-binomial posterior",
            riskSignal: "posterior updated",
            shape: "bayesian lane",
        },
        steps: [
            { title: "Prior Setup", summary: "Beta prior parse qilindi.", formula: `alpha=${priorAlpha.toFixed(2)}, beta=${priorBeta.toFixed(2)}` },
            { title: "Posterior Update", summary: "Binomial observation bilan posterior yangilandi.", formula: `alpha'=${posteriorAlpha.toFixed(2)}, beta'=${posteriorBeta.toFixed(2)}` },
            { title: "Predictive / Bayes Factor", summary: "Posterior predictive va Bayes factor signal baholandi.", formula: `predictive=${predictive.toFixed(3)}, BF=${bayesFactor.toFixed(3)}` },
        ],
        finalFormula: `E[p | data] = ${posteriorMean.toFixed(4)}`,
        auxiliaryFormula: `CI_{95%} = [${low.toFixed(4)}, ${high.toFixed(4)}]`,
        lineSeries: densitySeries,
        densitySeries,
        secondaryLineSeries: chain.length ? chain : undefined,
    };
}

function analyzeMultivariate(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const rows = parseMatrixRows(datasetExpression);
    if (rows.length < 2 || !rows[0]?.length) {
        return {
            summary: { shape: "multivariate lane", riskSignal: "matrix parse pending" },
            steps: [{ title: "Parse", summary: "Har qator observation bo'lgan numeric matrix kutilmoqda.", formula: null }],
        };
    }
    const columnCount = rows[0].length;
    const params = parseParams(parameterExpression);
    const labels = (params.labels ?? Array.from({ length: columnCount }, (_, index) => `v${index + 1}`).join(","))
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean)
        .slice(0, columnCount);
    while (labels.length < columnCount) {
        labels.push(`v${labels.length + 1}`);
    }
    const means = Array.from({ length: columnCount }, (_, column) => mean(rows.map((row) => row[column])));
    const covarianceValues = Array.from({ length: columnCount }, (_, rowIndex) =>
        Array.from({ length: columnCount }, (_, columnIndex) =>
            rows.reduce((sum, row) => sum + (row[rowIndex] - means[rowIndex]) * (row[columnIndex] - means[columnIndex]), 0) / Math.max(rows.length - 1, 1),
        ),
    );
    const stds = covarianceValues.map((row, index) => Math.sqrt(Math.max(row[index], 0)));
    const correlationValues = covarianceValues.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
            const denom = stds[rowIndex] * stds[columnIndex];
            return denom ? value / denom : 0;
        }),
    );
    const centered = rows.map((row) => row.map((value, index) => value - means[index]));
    const correlation = buildMatrix(labels, correlationValues);
    const pca = powerIteration(covarianceValues);
    const mahalanobis = Math.sqrt(centered[0].reduce((sum, value, index) => sum + (value * value) / Math.max(covarianceValues[index][index], 1e-9), 0));
    let centroids = [rows[0].slice(0, 2), rows[Math.min(1, rows.length - 1)].slice(0, 2)];
    let assignments = Array.from({ length: rows.length }, () => 0);
    for (let iter = 0; iter < 6; iter += 1) {
        assignments = rows.map((row) => {
            const point = row.slice(0, 2);
            const distances = centroids.map((centroid) => Math.hypot(point[0] - centroid[0], point[1] - centroid[1]));
            return distances[0] <= distances[1] ? 0 : 1;
        });
        centroids = Array.from({ length: 2 }, (_, cluster) => {
            const group = rows.filter((_, index) => assignments[index] === cluster).map((row) => row.slice(0, 2));
            return group.length ? [mean(group.map((point) => point[0])), mean(group.map((point) => point[1]))] : centroids[cluster];
        });
    }
    return {
        summary: {
            sampleSize: String(rows.length),
            mean: means.map((value) => value.toFixed(3)).join(", "),
            covarianceSignal: `cov(${labels[0]}, ${labels[1]}) = ${(covarianceValues[0]?.[1] ?? 0).toFixed(3)}`,
            correlationSignal: `corr(${labels[0]}, ${labels[1]}) = ${(correlationValues[0]?.[1] ?? 0).toFixed(3)}`,
            pcaSignal: `PC1 λ ≈ ${pca.eigenvalue.toFixed(3)}`,
            mahalanobisSignal: `d_M(row1) ≈ ${mahalanobis.toFixed(3)}`,
            clusterSignal: `k-means split ≈ ${assignments.filter((value) => value === 0).length}/${assignments.filter((value) => value === 1).length}`,
            riskSignal: "multivariate structure ready",
            shape: `${columnCount}-variable sample`,
        },
        steps: [
            { title: "Matrix Parse", summary: "Observation x variable matrix parse qilindi.", formula: `${rows.length}x${columnCount}` },
            { title: "Covariance / PCA", summary: "Covariance, correlation va birinchi principal component qurildi.", formula: `PC1≈(${pca.vector.map((value) => value.toFixed(2)).join(", ")})` },
            { title: "Distance / Clustering", summary: "Mahalanobis signal va simple k-means audit ko'rildi.", formula: `d_M=${mahalanobis.toFixed(3)}` },
        ],
        finalFormula: `corr(${labels[0]}, ${labels[1]}) = ${(correlationValues[0]?.[1] ?? 0).toFixed(3)}`,
        auxiliaryFormula: `PC1 λ = ${pca.eigenvalue.toFixed(3)}`,
        matrix: correlation,
        scatterSeries: rows.map((row) => ({ x: row[0], y: row[1] })),
        fitSeries: centroids.map((centroid) => ({ x: centroid[0], y: centroid[1] })),
    };
}

function autocorrelation(values: number[], lag: number) {
    const avg = mean(values);
    const numerator = values.slice(lag).reduce((sum, value, index) => sum + (value - avg) * (values[index] - avg), 0);
    const denominator = values.reduce((sum, value) => sum + (value - avg) ** 2, 0);
    return denominator ? numerator / denominator : 0;
}

function analyzeTimeSeries(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const values = parseNumberList(datasetExpression);
    if (values.length < 5) {
        return {
            summary: { shape: "time-series lane", riskSignal: "temporal sample pending" },
            steps: [{ title: "Parse", summary: "Time-series uchun numeric sequence kutilmoqda.", formula: null }],
        };
    }
    const params = parseParams(parameterExpression);
    const window = Math.max(2, Number(params.window ?? 3) || 3);
    const horizon = Math.max(1, Number(params.horizon ?? 2) || 2);
    const period = Math.max(2, Number(params.period ?? 4) || 4);
    const lineSeries = values.map((value, index) => ({ x: index + 1, y: value }));
    const movingAverage = values.map((_, index) => {
        const start = Math.max(0, index - window + 1);
        const chunk = values.slice(start, index + 1);
        return { x: index + 1, y: mean(chunk) };
    });
    const xValues = values.map((_, index) => index + 1);
    const xBar = mean(xValues);
    const yBar = mean(values);
    const slope =
        xValues.reduce((sum, value, index) => sum + (value - xBar) * (values[index] - yBar), 0) /
        Math.max(xValues.reduce((sum, value) => sum + (value - xBar) ** 2, 0), 1e-9);
    const intercept = yBar - slope * xBar;
    const trendSeries = xValues.map((x) => ({ x, y: intercept + slope * x }));
    const forecastSeries = Array.from({ length: horizon }, (_, index) => {
        const x = values.length + index + 1;
        return { x, y: intercept + slope * x };
    });
    const seasonalBuckets = Array.from({ length: period }, () => [] as number[]);
    values.forEach((value, index) => {
        seasonalBuckets[index % period].push(value);
    });
    const seasonalMeans = seasonalBuckets.map((bucket) => (bucket.length ? mean(bucket) : yBar));
    const seasonalSeries = values.map((_, index) => ({ x: index + 1, y: seasonalMeans[index % period] }));
    const acfSeries = Array.from({ length: Math.min(8, values.length - 1) }, (_, index) => ({ x: index + 1, y: autocorrelation(values, index + 1) }));
    const pacfSeries = acfSeries.map((point, index) => ({ x: point.x, y: point.y - (acfSeries[index - 1]?.y ?? 0) * 0.4 }));
    const ar1Phi = autocorrelation(values, 1);
    const arimaForecast = values.at(-1)! * ar1Phi + (1 - ar1Phi) * yBar;
    return {
        summary: {
            sampleSize: String(values.length),
            mean: yBar.toFixed(3),
            drift: `slope ≈ ${slope.toFixed(3)}`,
            forecast: `t+${horizon} ≈ ${forecastSeries.at(-1)?.y.toFixed(3) ?? "pending"}`,
            stationarity: Math.abs(slope) < 0.1 ? "nearly stationary" : "trend present",
            seasonality: `period-${period} swing ≈ ${(Math.max(...seasonalMeans) - Math.min(...seasonalMeans)).toFixed(3)}`,
            acfSignal: `lag1 ≈ ${acfSeries[0]?.y.toFixed(3) ?? "pending"}`,
            pacfSignal: `pacf1 ≈ ${pacfSeries[0]?.y.toFixed(3) ?? "pending"}`,
            riskSignal: `AR(1) φ ≈ ${ar1Phi.toFixed(3)}`,
            shape: "time-series lane",
        },
        steps: [
            { title: "Series Parse", summary: "Temporal observations ketma-ketligi parse qilindi.", formula: `${values.length} points` },
            { title: "Trend / Decomposition", summary: "Trend, moving average va seasonality signals qurildi.", formula: `slope=${slope.toFixed(3)}, period=${period}` },
            { title: "ACF / PACF / AR", summary: "Lag structure va AR(1) class signal baholandi.", formula: `acf1=${acfSeries[0]?.y.toFixed(3) ?? "0.000"}, phi=${ar1Phi.toFixed(3)}` },
        ],
        finalFormula: `\\hat{y}_{t+1}^{AR(1)} = ${arimaForecast.toFixed(3)}`,
        auxiliaryFormula: `lag_1 = ${acfSeries[0]?.y.toFixed(3) ?? "0.000"}`,
        lineSeries,
        secondaryLineSeries: movingAverage,
        tertiaryLineSeries: trendSeries,
        quaternaryLineSeries: seasonalSeries,
        forecastSeries,
        densitySeries: acfSeries,
        monteCarloTrail: pacfSeries,
    };
}

function analyzeMonteCarlo(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const params = parseParams(parameterExpression);
    const method = (params.method ?? "pi").toLowerCase();
    const seed = Number(params.seed ?? 42) || 42;
    const rand = lcg(seed);

    if (method === "bootstrap") {
        const values = parseNumberList(datasetExpression);
        const rounds = Number(params.rounds ?? 300) || 300;
        const bootMeans: number[] = [];
        for (let round = 0; round < rounds; round += 1) {
            const sample = Array.from({ length: values.length }, () => values[Math.floor(rand() * values.length)]);
            bootMeans.push(mean(sample));
        }
        bootMeans.sort((left, right) => left - right);
        const low = bootMeans[Math.floor(0.025 * (bootMeans.length - 1))];
        const high = bootMeans[Math.floor(0.975 * (bootMeans.length - 1))];
        return {
            summary: {
                sampleSize: String(values.length),
                mean: mean(values).toFixed(3),
                bootstrapSignal: `bootstrap CI ≈ [${low.toFixed(3)}, ${high.toFixed(3)}]`,
                riskSignal: "resampling lane",
                shape: "bootstrap lane",
            },
            steps: [
                { title: "Sample Parse", summary: "Bootstrap uchun numeric sample parse qilindi.", formula: `n=${values.length}` },
                { title: "Resampling", summary: "Sample mean bootstrap distribution qurildi.", formula: `rounds=${rounds}` },
            ],
            finalFormula: `\\bar{x}_{boot} = ${mean(bootMeans).toFixed(3)}`,
            auxiliaryFormula: `CI = [${low.toFixed(3)}, ${high.toFixed(3)}]`,
            histogram: buildHistogram(bootMeans, 8),
            lineSeries: bootMeans.map((value, index) => ({ x: index + 1, y: value })),
        };
    }

    if (method === "variance_reduction") {
        const samples = Number(params.samples ?? 3000) || 3000;
        let crude = 0;
        let antithetic = 0;
        const trail: ProbabilitySeriesPoint[] = [];
        for (let index = 1; index <= samples; index += 1) {
            const u = rand();
            crude += Math.exp(-u);
            antithetic += (Math.exp(-u) + Math.exp(-(1 - u))) / 2;
            if (index % Math.max(1, Math.floor(samples / 40)) === 0 || index === samples) {
                trail.push({ x: index, y: crude / index });
            }
        }
        return {
            summary: {
                sampleSize: String(samples),
                monteCarloEstimate: `E[e^{-U}] ≈ ${(crude / samples).toFixed(4)}`,
                varianceReduction: `antithetic ≈ ${(antithetic / samples).toFixed(4)}`,
                samplerSignal: `closed form = ${(1 - Math.exp(-1)).toFixed(4)}`,
                riskSignal: "variance reduction lane",
                shape: "simulation lane",
            },
            steps: [
                { title: "Crude Monte Carlo", summary: "Naive estimator qurildi.", formula: `N=${samples}` },
                { title: "Antithetic Pairing", summary: "Variance reduction uchun antithetic pairing ishlatildi.", formula: `mu_vr=${(antithetic / samples).toFixed(4)}` },
            ],
            finalFormula: `\\hat{\\mu}_{crude} = ${(crude / samples).toFixed(4)}`,
            auxiliaryFormula: `\\hat{\\mu}_{anti} = ${(antithetic / samples).toFixed(4)}`,
            lineSeries: trail,
        };
    }

    if (method === "sampler_compare") {
        const samples = Number(params.samples ?? 3000) || 3000;
        let crudeInside = 0;
        let stratifiedInside = 0;
        const crudeTrail: ProbabilitySeriesPoint[] = [];
        const stratTrail: ProbabilitySeriesPoint[] = [];
        const side = Math.max(2, Math.round(Math.sqrt(samples)));
        for (let index = 1; index <= samples; index += 1) {
            const x = rand();
            const y = rand();
            if (x * x + y * y <= 1) {
                crudeInside += 1;
            }
            const row = (index - 1) % side;
            const col = Math.floor((index - 1) / side) % side;
            const sx = (row + rand()) / side;
            const sy = (col + rand()) / side;
            if (sx * sx + sy * sy <= 1) {
                stratifiedInside += 1;
            }
            if (index % Math.max(1, Math.floor(samples / 40)) === 0 || index === samples) {
                crudeTrail.push({ x: index, y: (4 * crudeInside) / index });
                stratTrail.push({ x: index, y: (4 * stratifiedInside) / index });
            }
        }
        return {
            summary: {
                sampleSize: String(samples),
                monteCarloEstimate: `crude π ≈ ${(4 * crudeInside / samples).toFixed(4)}`,
                samplerSignal: `stratified π ≈ ${(4 * stratifiedInside / samples).toFixed(4)}`,
                varianceReduction: `gap ≈ ${Math.abs((4 * crudeInside) / samples - (4 * stratifiedInside) / samples).toFixed(4)}`,
                riskSignal: "sampler comparison lane",
                shape: "simulation lane",
            },
            steps: [
                { title: "Crude Sampling", summary: "Baseline uniform sampler yuritildi.", formula: `pi_crude=${(4 * crudeInside / samples).toFixed(4)}` },
                { title: "Stratified Sampling", summary: "Grid-stratified sampler bilan taqqoslandi.", formula: `pi_strat=${(4 * stratifiedInside / samples).toFixed(4)}` },
            ],
            finalFormula: `\\hat{\\pi}_{crude} = ${(4 * crudeInside / samples).toFixed(4)}`,
            auxiliaryFormula: `\\hat{\\pi}_{strat} = ${(4 * stratifiedInside / samples).toFixed(4)}`,
            lineSeries: crudeTrail,
            secondaryLineSeries: stratTrail,
        };
    }

    const samples = Number(params.samples ?? 5000) || 5000;
    const monteCarloCloud: ProbabilitySeriesPoint[] = [];
    const monteCarloTrail: ProbabilitySeriesPoint[] = [];
    let inside = 0;
    for (let index = 1; index <= samples; index += 1) {
        const x = rand();
        const y = rand();
        if (index <= 600) {
            monteCarloCloud.push({ x, y });
        }
        if (x * x + y * y <= 1) {
            inside += 1;
        }
        if (index % Math.max(1, Math.floor(samples / 40)) === 0 || index === samples) {
            monteCarloTrail.push({ x: index, y: (4 * inside) / index });
        }
    }
    const estimate = (4 * inside) / samples;
    return {
        summary: {
            sampleSize: String(samples),
            monteCarloEstimate: `pi ≈ ${estimate.toFixed(4)}`,
            variance: Math.abs(Math.PI - estimate).toFixed(4),
            riskSignal: "stochastic estimate",
            shape: "simulation lane",
        },
        steps: [
            { title: "Simulation Setup", summary: "Pseudo-random seed va sample size o'qildi.", formula: `N=${samples}, seed=${seed}` },
            { title: "Estimator", summary: "Unit quarter circle area orqali pi estimator baholandi.", formula: `pi≈${estimate.toFixed(4)}` },
        ],
        finalFormula: `\\hat{\\pi} = ${estimate.toFixed(4)}`,
        auxiliaryFormula: `|\\pi-\\hat{\\pi}| = ${Math.abs(Math.PI - estimate).toFixed(4)}`,
        monteCarloTrail,
        monteCarloCloud,
        lineSeries: monteCarloTrail,
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
                return analyzeInference(datasetExpression, parameterExpression);
            case "regression":
                return analyzeRegression(datasetExpression, parameterExpression);
            case "bayesian":
                return analyzeBayesian(datasetExpression, parameterExpression);
            case "multivariate":
                return analyzeMultivariate(datasetExpression, parameterExpression);
            case "time-series":
                return analyzeTimeSeries(datasetExpression, parameterExpression);
            case "monte-carlo":
                return analyzeMonteCarlo(datasetExpression, parameterExpression);
            default:
                return { summary: {}, steps: [] };
        }
    }
}
