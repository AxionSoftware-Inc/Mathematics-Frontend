import { add, compile, derivative, det, inv, multiply, parse } from "mathjs";

export type MatrixOperation = "add" | "multiply" | "determinant" | "inverse";
export type MatrixResult = {
    label: string;
    matrix?: number[][];
    scalar?: number;
    note: string;
};

export type MatrixSummary = {
    rows: number;
    columns: number;
    trace: number | null;
    determinant: number | null;
    frobeniusNorm: number;
    rowSums: number[];
    columnSums: number[];
    min: number;
    max: number;
};

export type PlotPoint = {
    x: number;
    y: number;
};

export type IntegralSummary = {
    midpoint: number;
    trapezoid: number;
    simpson: number;
    segmentsUsed: number;
    samples: PlotPoint[];
};

export type DifferentialPoint = {
    x: number;
    euler: number;
    heun: number;
};

export type SeriesPoint = {
    n: number;
    term: number;
    partial: number;
};

export type SeriesDiagnostic = "likely-convergent" | "slow-convergence" | "likely-divergent" | "inconclusive";

export type SeriesAnalysis = {
    points: SeriesPoint[];
    lastPartial: number;
    lastTerm: number;
    partialDelta: number;
    tailRange: number;
    ratioEstimate: number | null;
    absoluteTermTrend: "down" | "up" | "flat";
    diagnostic: SeriesDiagnostic;
    diagnosticLabel: string;
    commentary: string;
};

export type LimitDiagnostic = "likely-exists" | "one-sided-mismatch" | "likely-unbounded" | "unstable";

export type LimitEstimate = {
    point: number;
    left: number;
    right: number;
    average: number;
    gap: number;
    centerValue: number | null;
    samples: PlotPoint[];
    leftApproach: PlotPoint[];
    rightApproach: PlotPoint[];
    diagnostic: LimitDiagnostic;
    diagnosticLabel: string;
    commentary: string;
};

export type TaylorCoefficient = {
    order: number;
    derivativeValue: number;
    coefficient: number;
};

export type TaylorApproximation = {
    center: number;
    order: number;
    coefficients: TaylorCoefficient[];
    polynomialExpression: string;
    originalSamples: PlotPoint[];
    approximationSamples: PlotPoint[];
    maxError: number;
    meanError: number;
    centerValue: number;
};

export type GeometryPoint = {
    x: number;
    y: number;
};

export type AnalyticLine = {
    a: number;
    b: number;
    c: number;
    equation: string;
    samples: PlotPoint[];
};

export type GeometryIntersection = GeometryPoint | null;

export type GeometryAnalysis = {
    distanceAB: number;
    midpointAB: GeometryPoint;
    lineAB: AnalyticLine;
    lineCD: AnalyticLine;
    intersection: GeometryIntersection;
    isParallel: boolean;
};

function ensureFiniteNumber(value: number, label: string) {
    if (!Number.isFinite(value)) {
        throw new Error(`${label} finite son bo'lishi kerak.`);
    }
}

function roundValue(value: number, digits = 6) {
    return Number(value.toFixed(digits));
}

function factorial(value: number) {
    if (value <= 1) {
        return 1;
    }

    let result = 1;
    for (let index = 2; index <= value; index += 1) {
        result *= index;
    }

    return result;
}

export function parseNumericMatrix(input: string) {
    const rows = input
        .trim()
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/[\s,;]+/).map((chunk) => Number(chunk)));

    if (!rows.length) {
        throw new Error("Matritsa bo'sh bo'lmasligi kerak.");
    }

    const columnCount = rows[0].length;
    if (!columnCount) {
        throw new Error("Har qatorda kamida bitta son bo'lishi kerak.");
    }

    for (const row of rows) {
        if (row.length !== columnCount) {
            throw new Error("Barcha qatorlar bir xil ustun soniga ega bo'lishi kerak.");
        }
        row.forEach((value) => ensureFiniteNumber(value, "Matritsa qiymati"));
    }

    return rows;
}

function normalizeMatrix(value: number[][] | number) {
    if (typeof value === "number") {
        return [[value]];
    }

    return value;
}

export function summarizeMatrix(matrix: number[][]): MatrixSummary {
    const rows = matrix.length;
    const columns = matrix[0]?.length ?? 0;
    const isSquare = rows === columns && rows > 0;
    const rowSums = matrix.map((row) => roundValue(row.reduce((sum, value) => sum + value, 0)));
    const columnSums = Array.from({ length: columns }, (_, columnIndex) =>
        roundValue(matrix.reduce((sum, row) => sum + row[columnIndex], 0)),
    );
    const values = matrix.flat();
    const trace = isSquare ? roundValue(matrix.reduce((sum, row, index) => sum + row[index], 0)) : null;
    let determinantValue: number | null = null;

    if (isSquare) {
        try {
            determinantValue = roundValue(Number(det(matrix)));
        } catch {
            determinantValue = null;
        }
    }

    return {
        rows,
        columns,
        trace,
        determinant: determinantValue,
        frobeniusNorm: roundValue(Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0))),
        rowSums,
        columnSums,
        min: roundValue(Math.min(...values)),
        max: roundValue(Math.max(...values)),
    };
}

export function runMatrixOperation(matrixAInput: string, matrixBInput: string, operation: MatrixOperation): MatrixResult {
    const matrixA = parseNumericMatrix(matrixAInput);
    const matrixB = operation === "add" || operation === "multiply" ? parseNumericMatrix(matrixBInput) : null;

    if (operation === "add") {
        const result = add(matrixA, matrixB as number[][]) as number[][];
        return {
            label: "A + B",
            matrix: normalizeMatrix(result),
            note: "Qo'shish elementlar bo'yicha bajarildi.",
        };
    }

    if (operation === "multiply") {
        const result = multiply(matrixA, matrixB as number[][]) as number[][];
        return {
            label: "A x B",
            matrix: normalizeMatrix(result),
            note: "Ko'paytirish uchun A ustunlari soni B qatorlariga mos bo'lishi kerak.",
        };
    }

    if (operation === "determinant") {
        const result = det(matrixA) as number;
        return {
            label: "det(A)",
            scalar: Number(result.toFixed(6)),
            note: "Determinant faqat kvadrat matritsa uchun aniqlanadi.",
        };
    }

    const result = inv(matrixA) as number[][];
    return {
        label: "A^-1",
        matrix: normalizeMatrix(result),
        note: "Inverse faqat determinant nol bo'lmagan kvadrat matritsa uchun hisoblanadi.",
    };
}

function evaluateExpression(expression: string, scope: Record<string, number>) {
    const executor = compile(expression);
    const raw = executor.evaluate(scope);
    const numericValue = Number(raw);
    ensureFiniteNumber(numericValue, "Ifoda natijasi");
    return numericValue;
}

export function buildFunctionSamples(expression: string, lower: number, upper: number, sampleCount = 60) {
    const width = upper - lower;
    const safeCount = Math.max(sampleCount, 2);

    return Array.from({ length: safeCount }, (_, index) => {
        const ratio = index / (safeCount - 1);
        const x = lower + width * ratio;
        return {
            x,
            y: evaluateExpression(expression, { x }),
        };
    });
}

export function approximateIntegral(expression: string, lower: number, upper: number, segments: number): IntegralSummary {
    ensureFiniteNumber(lower, "Quyi chegara");
    ensureFiniteNumber(upper, "Yuqori chegara");
    if (upper <= lower) {
        throw new Error("Yuqori chegara quyi chegaradan katta bo'lishi kerak.");
    }

    const safeSegments = Math.max(2, Math.floor(segments));
    const simpsonSegments = safeSegments % 2 === 0 ? safeSegments : safeSegments + 1;
    const step = (upper - lower) / safeSegments;
    const simpsonStep = (upper - lower) / simpsonSegments;

    let midpoint = 0;
    let trapezoid = 0;
    let simpson = evaluateExpression(expression, { x: lower }) + evaluateExpression(expression, { x: upper });

    for (let index = 0; index < safeSegments; index += 1) {
        const xLeft = lower + index * step;
        const xRight = xLeft + step;
        const xMid = (xLeft + xRight) / 2;
        midpoint += evaluateExpression(expression, { x: xMid });
        trapezoid += evaluateExpression(expression, { x: xLeft }) + evaluateExpression(expression, { x: xRight });
    }

    for (let index = 1; index < simpsonSegments; index += 1) {
        const x = lower + index * simpsonStep;
        const factor = index % 2 === 0 ? 2 : 4;
        simpson += factor * evaluateExpression(expression, { x });
    }

    return {
        midpoint: Number((midpoint * step).toFixed(6)),
        trapezoid: Number(((trapezoid * step) / 2).toFixed(6)),
        simpson: Number(((simpson * simpsonStep) / 3).toFixed(6)),
        segmentsUsed: simpsonSegments,
        samples: buildFunctionSamples(expression, lower, upper),
    };
}

export function solveDifferentialEquation(
    derivativeExpression: string,
    x0: number,
    y0: number,
    stepSize: number,
    steps: number,
) {
    ensureFiniteNumber(x0, "x0");
    ensureFiniteNumber(y0, "y0");
    ensureFiniteNumber(stepSize, "Qadam uzunligi");

    if (stepSize <= 0) {
        throw new Error("Qadam uzunligi musbat bo'lishi kerak.");
    }

    const safeSteps = Math.max(1, Math.floor(steps));
    const points: DifferentialPoint[] = [{ x: x0, euler: y0, heun: y0 }];

    for (let index = 0; index < safeSteps; index += 1) {
        const current = points[points.length - 1];
        const slopeEuler = evaluateExpression(derivativeExpression, { x: current.x, y: current.euler });
        const nextEuler = current.euler + stepSize * slopeEuler;

        const slopeHeunStart = evaluateExpression(derivativeExpression, { x: current.x, y: current.heun });
        const predictor = current.heun + stepSize * slopeHeunStart;
        const slopeHeunEnd = evaluateExpression(derivativeExpression, {
            x: current.x + stepSize,
            y: predictor,
        });
        const nextHeun = current.heun + (stepSize / 2) * (slopeHeunStart + slopeHeunEnd);

        points.push({
            x: Number((current.x + stepSize).toFixed(6)),
            euler: Number(nextEuler.toFixed(6)),
            heun: Number(nextHeun.toFixed(6)),
        });
    }

    return points;
}

export function analyzeSeries(expression: string, startIndex: number, count: number): SeriesAnalysis {
    const safeStart = Math.max(1, Math.floor(startIndex));
    const safeCount = Math.max(4, Math.floor(count));
    const points: SeriesPoint[] = [];
    let partial = 0;

    for (let offset = 0; offset < safeCount; offset += 1) {
        const n = safeStart + offset;
        const term = evaluateExpression(expression, { n });
        partial += term;
        points.push({
            n,
            term: roundValue(term),
            partial: roundValue(partial),
        });
    }

    const lastPoint = points[points.length - 1];
    const previousPoint = points[points.length - 2] ?? null;
    const firstPoint = points[0];
    const lastTerm = lastPoint?.term ?? 0;
    const lastTermAbsolute = Math.abs(lastTerm);
    const previousTermAbsolute = previousPoint ? Math.abs(previousPoint.term) : null;
    const firstTermAbsolute = Math.abs(firstPoint?.term ?? 0);
    const partialDelta = previousPoint ? roundValue(lastPoint.partial - previousPoint.partial) : roundValue(lastPoint.partial);
    const tailPartials = points.slice(-4).map((point) => point.partial);
    const tailRange = tailPartials.length ? roundValue(Math.max(...tailPartials) - Math.min(...tailPartials)) : 0;
    const ratioEstimate =
        previousTermAbsolute && previousTermAbsolute > 1e-9 ? roundValue(lastTermAbsolute / previousTermAbsolute) : null;
    const absoluteTermTrend =
        previousTermAbsolute === null
            ? "flat"
            : lastTermAbsolute < previousTermAbsolute - 1e-6
              ? "down"
              : lastTermAbsolute > previousTermAbsolute + 1e-6
                ? "up"
                : "flat";

    let diagnostic: SeriesDiagnostic = "inconclusive";
    let diagnosticLabel = "Noaniq";
    let commentary = "Bu ifoda uchun ko'proq had olib yoki qo'shimcha test qo'llab tekshirish kerak.";

    if (ratioEstimate !== null && ratioEstimate > 1.02 && absoluteTermTrend === "up") {
        diagnostic = "likely-divergent";
        diagnosticLabel = "Divergentga yaqin";
        commentary = "Hadlar kamaymayapti; hozirgi namuna bo'yicha qator uzoqlashib ketmoqda.";
    } else if (lastTermAbsolute < 0.01 && tailRange < 0.05) {
        diagnostic = "likely-convergent";
        diagnosticLabel = "Konvergentga yaqin";
        commentary = "Oxirgi hadlar kichraygan va qisman yig'indi barqarorlashmoqda.";
    } else if (ratioEstimate !== null && ratioEstimate < 0.9 && tailRange < 0.12) {
        diagnostic = "likely-convergent";
        diagnosticLabel = "Konvergentga yaqin";
        commentary = "Hadlar yetarlicha tez kamaymoqda, qator yig'ilishga yaqin ko'rinadi.";
    } else if (ratioEstimate !== null && ratioEstimate <= 1.02 && lastTermAbsolute < firstTermAbsolute) {
        diagnostic = "slow-convergence";
        diagnosticLabel = "Sekin konvergentsiya";
        commentary = "Hadlar kamaymoqda, lekin qisman yig'indi hali sekin siljiyapti.";
    }

    return {
        points,
        lastPartial: lastPoint?.partial ?? 0,
        lastTerm,
        partialDelta,
        tailRange,
        ratioEstimate,
        absoluteTermTrend,
        diagnostic,
        diagnosticLabel,
        commentary,
    };
}

export function estimateLimit(expression: string, point: number, radius: number, sampleCount: number): LimitEstimate {
    ensureFiniteNumber(point, "Limit nuqtasi");
    ensureFiniteNumber(radius, "Radius");
    if (radius <= 0) {
        throw new Error("Radius musbat bo'lishi kerak.");
    }

    const safeCount = Math.max(4, Math.floor(sampleCount));
    const samples: PlotPoint[] = [];
    const leftApproach: PlotPoint[] = [];
    const rightApproach: PlotPoint[] = [];

    for (let index = 1; index <= safeCount; index += 1) {
        const delta = radius / index;
        const leftPoint = { x: point - delta, y: evaluateExpression(expression, { x: point - delta }) };
        const rightPoint = { x: point + delta, y: evaluateExpression(expression, { x: point + delta }) };
        leftApproach.push(leftPoint);
        rightApproach.push(rightPoint);
        samples.push(leftPoint, rightPoint);
    }

    const left = roundValue(leftApproach[leftApproach.length - 1]?.y ?? 0);
    const right = roundValue(rightApproach[rightApproach.length - 1]?.y ?? 0);
    const average = roundValue((left + right) / 2);
    const gap = roundValue(Math.abs(left - right));
    const nearbyValues = [...leftApproach.slice(-3), ...rightApproach.slice(-3)].map((entry) => entry.y);
    const localSpread = nearbyValues.length ? Math.max(...nearbyValues) - Math.min(...nearbyValues) : 0;
    let centerValue: number | null = null;

    try {
        centerValue = roundValue(evaluateExpression(expression, { x: point }));
    } catch {
        centerValue = null;
    }

    let diagnostic: LimitDiagnostic = "unstable";
    let diagnosticLabel = "Barqaror emas";
    let commentary = "Bir tomonlama yaqinlashuvni ko'proq yaqin nuqtalarda tekshirish kerak.";

    if (Math.abs(left) > 100 && Math.abs(right) > 100 && Math.sign(left || 1) === Math.sign(right || 1) && gap < Math.max(Math.abs(left), Math.abs(right)) * 0.2) {
        diagnostic = "likely-unbounded";
        diagnosticLabel = "Cheksizlikka ketmoqda";
        commentary = "Chap va o'ng tomondan qiymatlar bir xil ishorada juda tez kattalashmoqda.";
    } else if (gap < 0.01 && localSpread < 0.05) {
        diagnostic = "likely-exists";
        diagnosticLabel = "Limit mavjudga o'xshaydi";
        commentary = "Chap va o'ng tomondan yaqinlashuv mos kelyapti, qiymatlar barqarorlashmoqda.";
    } else if (gap > 0.2) {
        diagnostic = "one-sided-mismatch";
        diagnosticLabel = "Chap va o'ng mos emas";
        commentary = "Bir tomonlama limitlar sezilarli farq qilmoqda, umumiy limit yo'q bo'lishi mumkin.";
    }

    return {
        point,
        left,
        right,
        average,
        gap,
        centerValue,
        samples: samples.sort((first, second) => first.x - second.x),
        leftApproach,
        rightApproach,
        diagnostic,
        diagnosticLabel,
        commentary,
    };
}

function buildTaylorPolynomialExpression(center: number, coefficients: TaylorCoefficient[]) {
    const terms = coefficients
        .filter((entry) => Math.abs(entry.coefficient) > 1e-10)
        .map((entry, index) => {
            const sign = entry.coefficient >= 0 ? (index === 0 ? "" : "+ ") : "- ";
            const magnitude = roundValue(Math.abs(entry.coefficient), 6);

            if (entry.order === 0) {
                return `${sign}${magnitude}`;
            }

            if (entry.order === 1) {
                return center === 0 ? `${sign}${magnitude} * x` : `${sign}${magnitude} * (x - (${roundValue(center, 6)}))`;
            }

            return center === 0
                ? `${sign}${magnitude} * x^${entry.order}`
                : `${sign}${magnitude} * (x - (${roundValue(center, 6)}))^${entry.order}`;
        });

    return terms.join(" ").trim() || "0";
}

export function analyzeTaylorApproximation(
    expression: string,
    center: number,
    order: number,
    radius: number,
    sampleCount = 50,
): TaylorApproximation {
    ensureFiniteNumber(center, "Markaz nuqtasi");
    ensureFiniteNumber(radius, "Taylor radiusi");

    if (radius <= 0) {
        throw new Error("Taylor radiusi musbat bo'lishi kerak.");
    }

    const safeOrder = Math.max(0, Math.floor(order));
    const safeSampleCount = Math.max(12, Math.floor(sampleCount));
    const baseNode = parse(expression);
    const coefficients: TaylorCoefficient[] = [];
    let currentNode = baseNode;

    for (let currentOrder = 0; currentOrder <= safeOrder; currentOrder += 1) {
        const derivativeValue =
            currentOrder === 0 ? evaluateExpression(expression, { x: center }) : Number(currentNode.evaluate({ x: center }));
        ensureFiniteNumber(derivativeValue, `${currentOrder}-tartibli hosila`);
        coefficients.push({
            order: currentOrder,
            derivativeValue: roundValue(derivativeValue),
            coefficient: roundValue(derivativeValue / factorial(currentOrder)),
        });

        if (currentOrder < safeOrder) {
            currentNode = derivative(currentNode, "x");
        }
    }

    const lower = center - radius;
    const upper = center + radius;
    const width = upper - lower;
    const originalSamples: PlotPoint[] = [];
    const approximationSamples: PlotPoint[] = [];
    let totalError = 0;
    let maxError = 0;

    for (let index = 0; index < safeSampleCount; index += 1) {
        const ratio = safeSampleCount === 1 ? 0 : index / (safeSampleCount - 1);
        const x = lower + width * ratio;
        const approximation = coefficients.reduce((sum, entry) => sum + entry.coefficient * (x - center) ** entry.order, 0);
        approximationSamples.push({ x: roundValue(x), y: roundValue(approximation) });

        try {
            const original = evaluateExpression(expression, { x });
            const error = Math.abs(original - approximation);
            totalError += error;
            maxError = Math.max(maxError, error);
            originalSamples.push({ x: roundValue(x), y: roundValue(original) });
        } catch {
            continue;
        }
    }

    return {
        center,
        order: safeOrder,
        coefficients,
        polynomialExpression: buildTaylorPolynomialExpression(center, coefficients),
        originalSamples,
        approximationSamples,
        maxError: roundValue(maxError),
        meanError: roundValue(totalError / Math.max(originalSamples.length, 1)),
        centerValue: coefficients[0]?.derivativeValue ?? 0,
    };
}

function formatSigned(value: number) {
    return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function buildAnalyticLine(first: GeometryPoint, second: GeometryPoint, xMin: number, xMax: number, yMin: number, yMax: number): AnalyticLine {
    if (first.x === second.x && first.y === second.y) {
        throw new Error("Chiziq qurish uchun ikkita turli nuqta kerak.");
    }

    const a = Number((first.y - second.y).toFixed(6));
    const b = Number((second.x - first.x).toFixed(6));
    const c = Number((first.x * second.y - second.x * first.y).toFixed(6));
    let samples: PlotPoint[];

    if (Math.abs(b) < 1e-9) {
        samples = [
            { x: first.x, y: yMin },
            { x: first.x, y: yMax },
        ];
    } else {
        samples = [
            { x: xMin, y: Number(((-a * xMin - c) / b).toFixed(6)) },
            { x: xMax, y: Number(((-a * xMax - c) / b).toFixed(6)) },
        ];
    }

    return {
        a,
        b,
        c,
        equation: `${a}x ${formatSigned(b)}y ${formatSigned(c)} = 0`,
        samples,
    };
}

export function analyzeAnalyticGeometry(pointA: GeometryPoint, pointB: GeometryPoint, pointC: GeometryPoint, pointD: GeometryPoint): GeometryAnalysis {
    [pointA.x, pointA.y, pointB.x, pointB.y, pointC.x, pointC.y, pointD.x, pointD.y].forEach((value, index) =>
        ensureFiniteNumber(value, `Geometriya qiymati ${index + 1}`),
    );

    const xValues = [pointA.x, pointB.x, pointC.x, pointD.x];
    const yValues = [pointA.y, pointB.y, pointC.y, pointD.y];
    const xMin = Math.min(...xValues) - 2;
    const xMax = Math.max(...xValues) + 2;
    const yMin = Math.min(...yValues) - 2;
    const yMax = Math.max(...yValues) + 2;

    const lineAB = buildAnalyticLine(pointA, pointB, xMin, xMax, yMin, yMax);
    const lineCD = buildAnalyticLine(pointC, pointD, xMin, xMax, yMin, yMax);
    const determinant = lineAB.a * lineCD.b - lineCD.a * lineAB.b;
    const isParallel = Math.abs(determinant) < 1e-9;

    const intersection = isParallel
        ? null
        : {
              x: Number(((lineAB.b * lineCD.c - lineCD.b * lineAB.c) / determinant).toFixed(6)),
              y: Number(((lineCD.a * lineAB.c - lineAB.a * lineCD.c) / determinant).toFixed(6)),
          };

    return {
        distanceAB: Number(Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y).toFixed(6)),
        midpointAB: {
            x: Number(((pointA.x + pointB.x) / 2).toFixed(6)),
            y: Number(((pointA.y + pointB.y) / 2).toFixed(6)),
        },
        lineAB,
        lineCD,
        intersection,
        isParallel,
    };
}
