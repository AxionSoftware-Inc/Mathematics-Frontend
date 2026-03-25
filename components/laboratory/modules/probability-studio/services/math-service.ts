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
    let shifted = z - 1;
    for (let index = 0; index < coefficients.length; index += 1) {
        x += coefficients[index] / (shifted + index + 1);
    }
    const t = shifted + coefficients.length - 0.5;
    return 0.9189385332046727 + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPdf(x: number, alpha: number, beta: number) {
    if (x <= 0 || x >= 1) {
        return 0;
    }
    const logBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
    return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta);
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

function lcg(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function buildCorrelationMatrix(rows: number[][], labels: string[]): ProbabilityMatrix {
    const rowCount = rows.length;
    const columnCount = rows[0]?.length ?? 0;
    const columns = Array.from({ length: columnCount }, (_, column) => rows.map((row) => row[column]));
    const means = columns.map((column) => mean(column));
    const stds = columns.map((column, index) => Math.sqrt(Math.max(sampleVariance(column, means[index]), 0)));
    const values = Array.from({ length: columnCount }, (_, rowIndex) =>
        Array.from({ length: columnCount }, (_, columnIndex) => {
            if (rowIndex === columnIndex) {
                return 1;
            }
            let covariance = 0;
            for (let index = 0; index < rowCount; index += 1) {
                covariance += (rows[index][rowIndex] - means[rowIndex]) * (rows[index][columnIndex] - means[columnIndex]);
            }
            covariance /= Math.max(rowCount - 1, 1);
            const denom = stds[rowIndex] * stds[columnIndex];
            return denom ? covariance / denom : 0;
        }),
    );
    return {
        rowLabels: labels,
        columnLabels: labels,
        values,
    };
}

function buildCovarianceMatrix(rows: number[][], labels: string[]): ProbabilityMatrix {
    const rowCount = rows.length;
    const columnCount = rows[0]?.length ?? 0;
    const columns = Array.from({ length: columnCount }, (_, column) => rows.map((row) => row[column]));
    const means = columns.map((column) => mean(column));
    const values = Array.from({ length: columnCount }, (_, rowIndex) =>
        Array.from({ length: columnCount }, (_, columnIndex) => {
            let covariance = 0;
            for (let index = 0; index < rowCount; index += 1) {
                covariance += (rows[index][rowIndex] - means[rowIndex]) * (rows[index][columnIndex] - means[columnIndex]);
            }
            return covariance / Math.max(rowCount - 1, 1);
        }),
    );
    return {
        rowLabels: labels,
        columnLabels: labels,
        values,
    };
}

function solveQuadraticFit(points: ProbabilitySeriesPoint[]) {
    let sx = 0;
    let sx2 = 0;
    let sx3 = 0;
    let sx4 = 0;
    let sy = 0;
    let sxy = 0;
    let sx2y = 0;
    points.forEach((point) => {
        const x = point.x;
        const y = point.y;
        sx += x;
        sx2 += x * x;
        sx3 += x * x * x;
        sx4 += x * x * x * x;
        sy += y;
        sxy += x * y;
        sx2y += x * x * y;
    });
    const n = points.length;
    const matrix = [
        [n, sx, sx2, sy],
        [sx, sx2, sx3, sxy],
        [sx2, sx3, sx4, sx2y],
    ];
    for (let pivot = 0; pivot < 3; pivot += 1) {
        const pivotValue = matrix[pivot][pivot] || 1e-9;
        for (let column = pivot; column < 4; column += 1) {
            matrix[pivot][column] /= pivotValue;
        }
        for (let row = 0; row < 3; row += 1) {
            if (row === pivot) {
                continue;
            }
            const factor = matrix[row][pivot];
            for (let column = pivot; column < 4; column += 1) {
                matrix[row][column] -= factor * matrix[pivot][column];
            }
        }
    }
    return { a: matrix[0][3], b: matrix[1][3], c: matrix[2][3] };
}

function analyzeDescriptive(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const values = parseNumberList(datasetExpression);
    const avg = values.length ? mean(values) : 0;
    const variance = values.length ? sampleVariance(values, avg) : 0;
    const stdDev = Math.sqrt(Math.max(variance, 0));
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
        riskSignal: values.length ? "empirical spread ready" : "dataset pending",
        shape: values.length ? "1d sample" : null,
    };
    const steps: ProbabilityStep[] = [
        { title: "Sample Parse", summary: "Dataset numeric sample sifatida o'qildi.", formula: values.join(", ") || null },
        { title: "Moment Audit", summary: "Mean, variance va standard deviation hisoblandi.", formula: values.length ? `mean=${avg.toFixed(3)}, s^2=${variance.toFixed(3)}, s=${stdDev.toFixed(3)}` : null },
        { title: "Quartile Snapshot", summary: "Spread q1, median va q3 bilan qisqacha audit qilindi.", formula: q1 !== null && median !== null && q3 !== null ? `q1=${q1.toFixed(3)}, median=${median.toFixed(3)}, q3=${q3.toFixed(3)}` : null },
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

function analyzeInference(datasetExpression: string): ProbabilityAnalysisResult {
    const abMatch = datasetExpression.match(/control:\s*(\d+)\/(\d+)\s*;\s*variant:\s*(\d+)\/(\d+)/i);
    if (abMatch) {
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
                riskSignal: pValue < 0.05 ? "statistically significant" : "inconclusive",
                shape: "two-group inference",
            },
            steps: [
                { title: "Conversion Rates", summary: "Control va variant conversion rate baholandi.", formula: `p1=${p1.toFixed(4)}, p2=${p2.toFixed(4)}` },
                { title: "Z Test", summary: "Ikki proporsiya uchun z-test va p-value hisoblandi.", formula: `z=${z.toFixed(3)}, p=${pValue.toFixed(4)}` },
            ],
            finalFormula: `\\Delta = ${(diff * 100).toFixed(2)}\\%`,
            auxiliaryFormula: `CI = [${(low * 100).toFixed(2)}\\%, ${(high * 100).toFixed(2)}\\%]`,
            scatterSeries: [
                { x: 1, y: p1 },
                { x: 2, y: p2 },
            ],
        };
    }

    const values = parseNumberList(datasetExpression);
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
                riskSignal: pApprox < 0.05 ? "mean differs from baseline" : "mean near baseline",
                shape: "one-sample inference",
            },
            steps: [
                { title: "Sample Parse", summary: "One-sample inference uchun numeric sample o'qildi.", formula: `${values.length} observations` },
                { title: "Mean Test", summary: "Mean, standard error va normal approximation p-value baholandi.", formula: `t≈${tStat.toFixed(3)}, p≈${pApprox.toFixed(4)}` },
            ],
            finalFormula: `\\bar{x} = ${avg.toFixed(3)}`,
            auxiliaryFormula: `CI = [${low.toFixed(3)}, ${high.toFixed(3)}]`,
            histogram: buildHistogram(values, 6),
            scatterSeries: values.map((value, index) => ({ x: index + 1, y: value })),
        };
    }

    return {
        summary: { shape: "inference lane", riskSignal: "sample parse pending" },
        steps: [{ title: "Parse", summary: "AB test yoki numeric sample formati kutilmoqda.", formula: null }],
    };
}

function analyzeRegression(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const points = parseRegressionPoints(datasetExpression);
    if (points.length < 2) {
        return {
            summary: { shape: "2d trend fit", riskSignal: "point parse pending" },
            steps: [{ title: "Parse", summary: "Regression uchun (x,y) nuqtalar kutilmoqda.", formula: null }],
        };
    }
    const params = parseParams(parameterExpression);
    const model = (params.model ?? "linear").toLowerCase();
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const yBar = mean(ys);

    if (model === "quadratic") {
        const { a, b, c } = solveQuadraticFit(points);
        const fitSeries = points.map((point) => ({ x: point.x, y: a + b * point.x + c * point.x * point.x }));
        const ssTot = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
        const ssRes = points.reduce((sum, point) => sum + (point.y - (a + b * point.x + c * point.x * point.x)) ** 2, 0);
        const r2 = ssTot ? 1 - ssRes / ssTot : 1;
        return {
            summary: {
                sampleSize: String(points.length),
                regressionFit: `y ≈ ${a.toFixed(3)} + ${b.toFixed(3)}x + ${c.toFixed(3)}x^2`,
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
    const ssTot = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
    const ssRes = points.reduce((sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2, 0);
    const r2 = ssTot ? 1 - ssRes / ssTot : 1;
    return {
        summary: {
            sampleSize: String(points.length),
            regressionFit: `y ≈ ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
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
    const postAlpha = priorAlpha + successes;
    const postBeta = priorBeta + Math.max(0, trials - successes);
    const posteriorMean = postAlpha / (postAlpha + postBeta);
    const posteriorVariance = (postAlpha * postBeta) / (((postAlpha + postBeta) ** 2) * (postAlpha + postBeta + 1));
    const posteriorStd = Math.sqrt(Math.max(posteriorVariance, 0));
    const low = Math.max(0, posteriorMean - 1.96 * posteriorStd);
    const high = Math.min(1, posteriorMean + 1.96 * posteriorStd);
    const densitySeries = Array.from({ length: 100 }, (_, index) => {
        const x = index / 99;
        return { x, y: betaPdf(x, postAlpha, postBeta) };
    });
    return {
        summary: {
            sampleSize: trials ? String(trials) : "pending",
            posteriorMean: posteriorMean.toFixed(4),
            credibleInterval: `[${low.toFixed(4)}, ${high.toFixed(4)}]`,
            distributionFamily: "beta-binomial posterior",
            riskSignal: "posterior updated",
            shape: "bayesian lane",
        },
        steps: [
            { title: "Prior Setup", summary: "Beta prior parse qilindi.", formula: `alpha=${priorAlpha.toFixed(2)}, beta=${priorBeta.toFixed(2)}` },
            { title: "Posterior Update", summary: "Binomial observation bilan posterior yangilandi.", formula: `alpha'=${postAlpha.toFixed(2)}, beta'=${postBeta.toFixed(2)}` },
        ],
        finalFormula: `E[p | data] = ${posteriorMean.toFixed(4)}`,
        auxiliaryFormula: `CI_{95%} = [${low.toFixed(4)}, ${high.toFixed(4)}]`,
        lineSeries: densitySeries,
        densitySeries,
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
    const covariance = buildCovarianceMatrix(rows, labels);
    const correlation = buildCorrelationMatrix(rows, labels);
    const means = Array.from({ length: columnCount }, (_, column) => mean(rows.map((row) => row[column])));
    return {
        summary: {
            sampleSize: String(rows.length),
            mean: means.map((value) => value.toFixed(3)).join(", "),
            covarianceSignal: `cov(${labels[0]}, ${labels[1]}) = ${(covariance.values[0]?.[1] ?? 0).toFixed(3)}`,
            correlationSignal: `corr(${labels[0]}, ${labels[1]}) = ${(correlation.values[0]?.[1] ?? 0).toFixed(3)}`,
            riskSignal: "multivariate structure ready",
            shape: `${columnCount}-variable sample`,
        },
        steps: [
            { title: "Matrix Parse", summary: "Observation x variable matrix parse qilindi.", formula: `${rows.length}x${columnCount}` },
            { title: "Covariance Audit", summary: "Covariance va correlation matrix qurildi.", formula: `labels=${labels.join(", ")}` },
        ],
        finalFormula: `corr(${labels[0]}, ${labels[1]}) = ${(correlation.values[0]?.[1] ?? 0).toFixed(3)}`,
        auxiliaryFormula: `cov(${labels[0]}, ${labels[1]}) = ${(covariance.values[0]?.[1] ?? 0).toFixed(3)}`,
        matrix: correlation,
        scatterSeries: rows.map((row) => ({ x: row[0], y: row[1] })),
    };
}

function analyzeTimeSeries(datasetExpression: string, parameterExpression: string): ProbabilityAnalysisResult {
    const values = parseNumberList(datasetExpression);
    if (values.length < 3) {
        return {
            summary: { shape: "time-series lane", riskSignal: "temporal sample pending" },
            steps: [{ title: "Parse", summary: "Time-series uchun numeric sequence kutilmoqda.", formula: null }],
        };
    }
    const params = parseParams(parameterExpression);
    const window = Math.max(2, Number(params.window ?? 3) || 3);
    const horizon = Math.max(1, Number(params.horizon ?? 1) || 1);
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
        Math.max(
            xValues.reduce((sum, value) => sum + (value - xBar) ** 2, 0),
            1e-9,
        );
    const intercept = yBar - slope * xBar;
    const forecastSeries = Array.from({ length: horizon }, (_, index) => {
        const x = values.length + index + 1;
        return { x, y: intercept + slope * x };
    });
    const lagPairs = values.slice(1).map((value, index) => [values[index], value] as const);
    const lagX = lagPairs.map(([x]) => x);
    const lagY = lagPairs.map(([, y]) => y);
    const lagCorr =
        lagPairs.length > 1
            ? lagPairs.reduce((sum, [x, y]) => sum + (x - mean(lagX)) * (y - mean(lagY)), 0) /
              Math.sqrt(
                  Math.max(lagPairs.reduce((sum, [x]) => sum + (x - mean(lagX)) ** 2, 0), 1e-9) *
                      Math.max(lagPairs.reduce((sum, [, y]) => sum + (y - mean(lagY)) ** 2, 0), 1e-9),
              )
            : 0;
    return {
        summary: {
            sampleSize: String(values.length),
            mean: yBar.toFixed(3),
            drift: `slope ≈ ${slope.toFixed(3)}`,
            forecast: `t+${horizon} ≈ ${forecastSeries.at(-1)?.y.toFixed(3) ?? "pending"}`,
            stationarity: Math.abs(slope) < 0.1 ? "nearly stationary" : "trend present",
            riskSignal: `lag-1 corr ≈ ${lagCorr.toFixed(3)}`,
            shape: "time-series lane",
        },
        steps: [
            { title: "Series Parse", summary: "Temporal observations ketma-ketligi parse qilindi.", formula: `${values.length} points` },
            { title: "Trend / Forecast", summary: "Linear drift va moving average asosida qisqa forecast qurildi.", formula: `slope=${slope.toFixed(3)}, window=${window}` },
        ],
        finalFormula: `\\hat{y}_{t+1} = ${forecastSeries[0]?.y.toFixed(3) ?? "pending"}`,
        auxiliaryFormula: `lag_1 = ${lagCorr.toFixed(3)}`,
        lineSeries,
        secondaryLineSeries: movingAverage,
        forecastSeries,
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
                return analyzeInference(datasetExpression);
            case "regression":
                return analyzeRegression(datasetExpression, parameterExpression);
            case "bayesian":
                return analyzeBayesian(datasetExpression, parameterExpression);
            case "multivariate":
                return analyzeMultivariate(datasetExpression, parameterExpression);
            case "time-series":
                return analyzeTimeSeries(datasetExpression, parameterExpression);
            case "monte-carlo":
                return analyzeMonteCarlo(parameterExpression);
            default:
                return { summary: {}, steps: [] };
        }
    }
}
