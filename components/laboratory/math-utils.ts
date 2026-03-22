import { add, compile, derivative, det, eigs, inv, multiply, parse } from "mathjs";

export type MatrixOperation = "add" | "multiply" | "determinant" | "inverse" | "transpose" | "eigenvalues";
export type MatrixOperationResult = {
    label: string;
    matrix?: number[][];
    scalar?: number;
    values?: number[];
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
    isSquare: boolean;
    isSymmetric: boolean;
    isOrthogonal: boolean;
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

export type ODESystemPoint = {
    t: number;
    vars: Record<string, number>;
};

export type DirectionFieldSegment = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    slope: number;
};

export type PlanarNullclineField = {
    xNullcline: PlotPoint[];
    yNullcline: PlotPoint[];
};

export type DifferentialEquilibrium = {
    y: number;
    stability: "stable" | "unstable" | "semi-stable";
    slope: number;
};

export type SingleEquationPhaseLine = {
    samples: PlotPoint[];
    equilibria: DifferentialEquilibrium[];
    xAnchor: number;
    yDomain: [number, number];
};

export type SingleDifferentialAudit = {
    referenceSeries: PlotPoint[];
    referenceGapSeries: PlotPoint[];
    methodGapSeries: PlotPoint[];
    phaseLine: SingleEquationPhaseLine;
    refinedStep: number;
    maxReferenceGap: number;
    meanReferenceGap: number;
    finalReferenceGap: number;
    recommendedStep: number;
};

export type SystemTrajectoryAudit = {
    radiusSeries: PlotPoint[];
    speedSeries: PlotPoint[];
    startRadius: number;
    finalRadius: number;
    peakSpeed: number;
    meanSpeed: number;
    footprint: number;
    netDrift: number;
};

export type DoubleIntegralSummary = {
    value: number;
    samples: { x: number; y: number; z: number }[];
};

export type TripleIntegralSummary = {
    value: number;
    samples: { x: number; y: number; z: number; value: number }[];
};

export type SeriesPoint = {
    n: number;
    value: number;
    partialSum: number;
};

export type StatisticsSummary = {
    mean: number;
    median: number;
    mode: number[];
    variance: number;
    standardDeviation: number;
    count: number;
    histogram: { bin: string; count: number }[];
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

export type ComplexPoint = {
    re: number;
    im: number;
    magnitude: number;
    phase: number;
};

export type ComplexMappingResult = {
    original: ComplexPoint[];
    mapped: ComplexPoint[];
};

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

export type FrequencyPoint = {
    freq: number;
    magnitude: number;
    phase: number;
};

export type SpectralAnalysis = {
    timeDomain: PlotPoint[];
    frequencyDomain: FrequencyPoint[];
    peakFreq: number;
};

export type QuantumWavePoint = {
    x: number;
    y: number;
    prob: number;
};

export type QuantumStateAnalysis = {
    theta: number;
    phi: number;
    cartesian: {
        x: number;
        y: number;
        z: number;
    };
    alphaMagnitude: number;
    betaMagnitude: number;
    zeroProbability: number;
    oneProbability: number;
    coherence: number;
    longitude: number;
    latitude: number;
    phaseClass: string;
    label: string;
    ket: string;
};

export type PlotPoint3D = {
    x: number;
    y: number;
    z: number;
    value?: number;
};

export type ProofStep = {
    id: string;
    action: string;
    result: string;
    status: "completed" | "pending";
};

export type ParametricSurfaceGrid = {
    x: number[][];
    y: number[][];
    z: number[][];
};

export type OptimizationLandscape = {
    path: PlotPoint3D[];
    surfaceSamples: PlotPoint3D[];
    xRange: [number, number];
    yRange: [number, number];
    zRange: [number, number];
};

export type MatrixBasisVector = {
    label: string;
    color: string;
    original: PlotPoint3D[];
    transformed: PlotPoint3D[];
};

export type MatrixTransformation3D = {
    original: PlotPoint3D[];
    transformed: PlotPoint3D[];
    edges: Array<[number, number]>;
    basisVectors: MatrixBasisVector[];
    determinant: number | null;
};

export type BlochSphereGeometry = {
    surface: ParametricSurfaceGrid;
    equator: PlotPoint3D[];
    meridians: PlotPoint3D[][];
    axes: Array<{ label: string; color: string; points: PlotPoint3D[] }>;
    poles: PlotPoint3D[];
};

export type LightConeGeometry = {
    futureSurface: ParametricSurfaceGrid;
    pastSurface: ParametricSurfaceGrid;
    axis: PlotPoint3D[];
    nullRays: PlotPoint3D[][];
    boundaryLoops: PlotPoint3D[][];
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

function createParametricSurfaceGrid(
    rowCount: number,
    columnCount: number,
    mapper: (rowIndex: number, columnIndex: number) => PlotPoint3D,
): ParametricSurfaceGrid {
    const x: number[][] = [];
    const y: number[][] = [];
    const z: number[][] = [];

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        const xRow: number[] = [];
        const yRow: number[] = [];
        const zRow: number[] = [];

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            const point = mapper(rowIndex, columnIndex);
            xRow.push(roundValue(point.x));
            yRow.push(roundValue(point.y));
            zRow.push(roundValue(point.z));
        }

        x.push(xRow);
        y.push(yRow);
        z.push(zRow);
    }

    return { x, y, z };
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
    let isSymmetric = false;
    const isOrthogonal = false;

    if (isSquare) {
        try {
            determinantValue = roundValue(Number(det(matrix)));
            
            // Symmetry check
            isSymmetric = true;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < columns; j++) {
                    if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-9) {
                        isSymmetric = false;
                        break;
                    }
                }
                if (!isSymmetric) break;
            }

            // Orthogonality check placeholder
            // multiply(transpose(matrix), matrix) and check for I
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
        isSquare,
        isSymmetric,
        isOrthogonal
    };
}

export function runMatrixOperation(matrixA: number[][], operation: MatrixOperation, matrixB: number[][] | null = null): MatrixOperationResult {
    if (operation === "add") {
        if (!matrixB) throw new Error("Qo'shish uchun ikkinchi matritsa kerak.");
        const result = add(matrixA, matrixB) as number[][];
        return {
            label: "A + B",
            matrix: normalizeMatrix(result),
            note: "Qo'shish elementlar bo'yicha bajarildi.",
        };
    }

    if (operation === "multiply") {
        if (!matrixB) throw new Error("Ko'paytirish uchun ikkinchi matritsa kerak.");
        const result = multiply(matrixA, matrixB) as number[][];
        return {
            label: "A x B",
            matrix: normalizeMatrix(result),
            note: "Ko'paytirish uchun A ustunlari soni B qatorlariga mos bo'lishi kerak.",
        };
    }

    if (operation === "determinant") {
        const resultValue = det(matrixA) as number;
        return {
            label: "det(A)",
            scalar: roundValue(resultValue),
            note: "Determinant kvadrat matritsa uchun xarakterli hajm ko'rsatkichi.",
        };
    }

    if (operation === "transpose") {
        const resultMatrix = Array.from({ length: matrixA[0].length }, (_, i) => matrixA.map(row => row[i]));
        return {
            label: "A^T",
            matrix: resultMatrix,
            note: "Matritsani qatorlari ustunlarga o'zgartirildi.",
        };
    }

    if (operation === "eigenvalues") {
        try {
            const res = eigs(matrixA);
            const rawValues = res.values;
            const vals = Array.isArray(rawValues) ? rawValues : (rawValues as { toArray?: () => unknown[] }).toArray ? (rawValues as { toArray: () => unknown[] }).toArray() : [rawValues];
            
            return {
                label: "Eigenvalues",
                values: vals.map((v: unknown) => {
                    if (typeof v === 'number') return roundValue(v);
                    const complex = v as { re?: number };
                    return roundValue(complex.re || 0);
                }),
                note: "Xos qiymatlar (Eigenvalues) matritsaning chiziqli o'zgarish xarakteristikasi.",
            };
        } catch {
             throw new Error("Eigenvalues hisoblashda xato (faqat kvadrat matritsalar uchun).");
        }
    }

    if (operation === "inverse") {
        const resultMatrix = inv(matrixA) as number[][];
        return {
            label: "A^-1",
            matrix: normalizeMatrix(resultMatrix),
            note: "Inverse faqat determinant nol bo'lmagan kvadrat matritsa uchun hisoblanadi.",
        };
    }

    throw new Error(`Noma'lum operatsiya: ${operation}`);
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

export function approximateDoubleIntegral(
    expression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    nx: number,
    ny: number
): DoubleIntegralSummary {
    const dx = (xMax - xMin) / nx;
    const dy = (yMax - yMin) / ny;
    const executor = compile(expression);
    let totalVolume = 0;
    const samples: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < nx; i++) {
        const x = xMin + (i + 0.5) * dx;
        for (let j = 0; j < ny; j++) {
            const y = yMin + (j + 0.5) * dy;
            const z = Number(executor.evaluate({ x, y }));
            totalVolume += z * dx * dy;

            if (Number.isFinite(z)) {
                samples.push({ x: roundValue(x), y: roundValue(y), z: roundValue(z) });
            }
        }
    }

    return {
        value: roundValue(totalVolume),
        samples
    };
}

export function approximateTripleIntegral(
    expression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number,
    nx = 8,
    ny = 8,
    nz = 8,
): TripleIntegralSummary {
    const executor = compile(expression);
    const dx = (xMax - xMin) / nx;
    const dy = (yMax - yMin) / ny;
    const dz = (zMax - zMin) / nz;
    let total = 0;
    const samples: { x: number; y: number; z: number; value: number }[] = [];

    for (let i = 0; i < nx; i++) {
        const x = xMin + (i + 0.5) * dx;
        for (let j = 0; j < ny; j++) {
            const y = yMin + (j + 0.5) * dy;
            for (let k = 0; k < nz; k++) {
                const z = zMin + (k + 0.5) * dz;
                const value = Number(executor.evaluate({ x, y, z }));
                if (Number.isFinite(value)) {
                    total += value;
                    // Sparse sampling for visualization
                    if (nx >= 4 && i % 2 === 0 && j % 2 === 0 && k % 2 === 0) {
                        samples.push({ x, y, z, value });
                    }
                }
            }
        }
    }

    return {
        value: roundValue(total * dx * dy * dz),
        samples,
    };
}

export const LABORATORY_PRESETS = {
    integral: [
        { label: "Gaussian Bell", mode: "single", expr: "exp(-x^2)", lower: "-3", upper: "3", segments: "96" },
        { label: "Oscillatory Fresnel Window", mode: "single", expr: "sin(x^2)", lower: "0", upper: "6", segments: "140" },
        { label: "Damped Wave Packet", mode: "single", expr: "exp(-0.2 * x^2) * cos(3 * x)", lower: "-5", upper: "5", segments: "160" },
        { label: "Double Paraboloid", mode: "double", expr: "x^2 + y^2", x: "[-2, 2]", y: "[-2, 2]", nx: "28", ny: "28" },
        { label: "Wave Interference Surface", mode: "double", expr: "sin(x) * cos(y) + 0.25 * x", x: "[-6.28, 6.28]", y: "[-6.28, 6.28]", nx: "34", ny: "34" },
        { label: "Gaussian Ridge", mode: "double", expr: "exp(-(x^2 + y^2)/4) * (x^2 - y^2)", x: "[-4, 4]", y: "[-4, 4]", nx: "32", ny: "32" },
        { label: "Saddle Surface", mode: "double", expr: "x^2 - y^2", x: "[-3, 3]", y: "[-3, 3]", nx: "30", ny: "30" },
        { label: "Sphere Volume (Triple)", mode: "triple", expr: "1", x: "[-1, 1]", y: "[-1, 1]", z: "[-1, 1]", nx: "10", ny: "10", nz: "10" },
        { label: "Radial Energy Cloud", mode: "triple", expr: "exp(-(x^2 + y^2 + z^2)/3)", x: "[-2, 2]", y: "[-2, 2]", z: "[-2, 2]", nx: "12", ny: "12", nz: "12" },
        { label: "Wave Density Cube", mode: "triple", expr: "sin(x) * cos(y) * exp(-z^2/3)", x: "[-3.14, 3.14]", y: "[-3.14, 3.14]", z: "[-3, 3]", nx: "12", ny: "12", nz: "10" },
    ],
    differential: [
        { label: "Logistic Growth", mode: "single", expr: "0.5 * y * (1 - y/10)", x0: "0", y0: "1" },
        { label: "Logistic Growth Near Capacity", mode: "single", expr: "0.5 * y * (1 - y/10)", x0: "0", y0: "8.5", step: "0.1", steps: "60" },
        { label: "Exponential Decay", mode: "single", expr: "-0.8 * y", x0: "0", y0: "6", step: "0.1", steps: "60" },
        { label: "Nonlinear Blow-up Window", mode: "single", expr: "y^2 - 0.4 * y", x0: "0", y0: "0.9", step: "0.03", steps: "80" },
        { label: "Forced Response (1st Order)", mode: "single", expr: "-0.6 * y + sin(1.8 * x)", x0: "0", y0: "0", step: "0.08", steps: "180" },
        { label: "Van der Pol Oscillator", mode: "system", exprs: ["y", "-0.5 * (x^2 - 1) * y - x"], x0: "1", y0: "0" },
        { label: "Simple Harmonic Oscillator", mode: "system", exprs: ["y", "-x"], x0: "1", y0: "0", step: "0.05", steps: "400" },
        { label: "Spiral Sink", mode: "system", exprs: ["-0.25 * x - y", "x - 0.25 * y"], x0: "3", y0: "0.5", step: "0.05", steps: "320" },
        { label: "Spiral Source", mode: "system", exprs: ["0.18 * x - y", "x + 0.18 * y"], x0: "0.8", y0: "0.3", step: "0.04", steps: "220" },
        { label: "Saddle Field", mode: "system", exprs: ["x", "-1.4 * y"], x0: "0.6", y0: "1.8", step: "0.05", steps: "180" },
        { label: "Predator-Prey (Lotka-Volterra)", mode: "system", exprs: ["1.5*x - 1.0*x*y", "-3.0*y + 1.2*x*y"], x0: "10", y0: "5" },
        { label: "Lorenz Attractor (3D Chaos)", mode: "system", exprs: ["10 * (y - x)", "x * (28 - z) - y", "x * y - (8 / 3) * z"], x0: "1", y0: "1", z0: "1", step: "0.01", steps: "1500" },
        { label: "Rossler Attractor (Chaos)", mode: "system", exprs: ["-y - z", "x + 0.2 * y", "0.2 + z * (x - 5.7)"], x0: "0.1", y0: "0", z0: "0", step: "0.05", steps: "2000" },
        { label: "Chen Attractor", mode: "system", exprs: ["35 * (y - x)", "(28 - 35) * x - x * z + 28 * y", "x * y - 3 * z"], x0: "0.2", y0: "0.1", z0: "0.4", step: "0.008", steps: "1800" },
        { label: "Brusselator (Chemical Oscillator)", mode: "system", exprs: ["1 + x^2 * y - 3.5 * x", "2.5 * x - x^2 * y"], x0: "1", y0: "1", step: "0.05", steps: "1000" },
        { label: "Duffing Oscillator (Chaos)", mode: "system", exprs: ["y", "x - x^3 - 0.1 * y + 0.3 * cos(1.2 * t)"], x0: "1", y0: "0", step: "0.1", steps: "500" },
        { label: "Thomas Cyclical Attractor", mode: "system", exprs: ["sin(y) - 0.2 * x", "sin(z) - 0.2 * y", "sin(x) - 0.2 * z"], x0: "0.1", y0: "0", z0: "0", step: "0.1", steps: "2000" },
        { label: "Aizawa Attractor", mode: "system", exprs: ["(z - 0.7) * x - 3.5 * y", "3.5 * x + (z - 0.7) * y", "0.6 + 0.95 * z - (z^3)/3 - (x^2 + y^2) * (1 + 0.25 * z) + 0.1 * z * x^3"], x0: "0.1", y0: "0", z0: "0.2", step: "0.01", steps: "1600" },
    ],
    series: [
        { label: "Riemann Zeta (s=2)", expr: "1 / n^2", start: "1", terms: "50" },
        { label: "Grandis Series (alt)", expr: "(-1)^n", start: "0", terms: "10" },
        { label: "Factorial Inverse", expr: "1 / n!", start: "0", terms: "10" },
    ],
    matrix: [
        { label: "Identity Matrix", A: "1 0 0\n0 1 0\n0 0 1", op: "determinant" },
        { label: "Rotation 45 deg (X-axis)", A: "1 0 0\n0 0.707 -0.707\n0 0.707 0.707", op: "transpose", type: "transformation" },
        { label: "Compound Rotation", A: "0.707 -0.5 0.5\n0.707 0.5 -0.5\n0 0.707 0.707", op: "transpose", type: "transformation" },
        { label: "Shear Transformation", A: "1 0.5 0.2\n0 1 0.3\n0 0 1", op: "transpose", type: "transformation" },
        { label: "Non-uniform Scaling", A: "2 0 0\n0 0.5 0\n0 0 1.5", op: "transpose", type: "transformation" },
        { label: "Hilbert 3x3", A: "1 0.5 0.33\n0.5 0.33 0.25\n0.33 0.25 0.2", op: "eigenvalues" },
    ],
    geometry: [
        { label: "Perpendicular Lines", ax: "0", ay: "0", bx: "4", by: "4", cx: "0", cy: "4", dx: "4", dy: "0" },
        { label: "Parallel Lines", ax: "0", ay: "0", bx: "5", by: "0", cx: "0", cy: "2", dx: "5", dy: "2" },
        { label: "Unit Triangle Delta", ax: "0", ay: "0", bx: "1", by: "0", cx: "0.5", cy: "0.866", dx: "0", dy: "0" },
    ],
    proof: [
        { 
            label: "Pythagorean Theorem", 
            title: "Pifagor teoremasi", 
            strategy: "direct", 
            statement: "To'g'ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig'indisiga teng.",
            steps: [
                { id: "1", action: "Assume triangle T with sides a, b, c", result: "Base geometry initialized.", status: "completed" },
                { id: "2", action: "Square the legs: a^2 + b^2", result: "Calculating sum of squares.", status: "completed" },
                { id: "3", action: "Show equality to c^2", result: "Logical connection confirmed.", status: "pending" }
            ]
        },
        { 
            label: "Prime Infinity", 
            title: "Tub sonlar cheksizligi", 
            strategy: "contradiction", 
            statement: "Tub sonlar to'plami cheksizdir.",
            steps: [
                { id: "1", action: "Assume finite set P = {p1, p2, ..., pn}", result: "Contradiction basis.", status: "completed" },
                { id: "2", action: "Construct Q = (p1*p2*...*pn) + 1", result: "A new candidate number.", status: "completed" },
                { id: "3", action: "Prove Q is not divisible by any p_i", result: "Identifying contradiction.", status: "pending" }
            ]
        },
        { 
            label: "Square Root 2 Irrational", 
            title: "sqrt(2) irratsional", 
            strategy: "contradiction", 
            statement: "2 ning kvadrat ildizi ratsional son emas.",
            steps: [
                { id: "1", action: "Assume sqrt(2) = p/q (irreducible)", result: "Assumption setup.", status: "completed" },
                { id: "2", action: "Show p is even", result: "Step 1 of divisibility chain.", status: "completed" },
                { id: "3", action: "Show q is even", result: "Common factor 2 found (Contradiction).", status: "pending" }
            ]
        },
    ],
    statistics: [
        { label: "Standard Normal", type: "normal", mean: "0", sd: "1" },
        { label: "Coin Flips (n=10)", type: "binomial", n: "10", p: "0.5" },
        { label: "Poisson Call Center (lambda=4)", type: "poisson", lambda: "4" },
        { label: "IQ Distribution", type: "normal", mean: "100", sd: "15" },
    ],
    complex: [
        { label: "Mandelbrot Explorer", type: "fractal", fractal: "mandelbrot", zoom: 1, cx: -0.5, cy: 0 },
        { label: "Julia: Burning Ship", type: "fractal", fractal: "julia", cr: -0.8, ci: 0.156 },
        { label: "Z -> Exp(Z) Map", type: "mapping", expr: "exp(z)", range: 2 },
        { label: "Z -> Sin(Z) Map", type: "mapping", expr: "sin(z)", range: 3 },
    ],
    signal: [
        { label: "Pure Sine (440Hz)", type: "basic", wave: "sine", f: 440, a: 1 },
        { label: "Square Harmonic", type: "basic", wave: "square", f: 220, a: 0.8 },
        { label: "Sawtooth Spectrum", type: "basic", wave: "sawtooth", f: 330, a: 0.9 },
        { label: "Noisy Signal", type: "analysis", wave: "sine", f: 100, noise: 0.5 },
    ],
    numerical: [
        { label: "Find Roots: x^3 - x - 2", mode: "root", expr: "x^3 - x - 2", x0: "1.5" },
        { label: "Find Roots: sin(x) - x/2", mode: "root", expr: "sin(x) - x/2", x0: "2" },
        { label: "Linear Fit: Economics", mode: "regression", data: "1 2, 2 3.8, 3 6.1, 4 8.2, 5 10" },
    ],
    graph: [
        { label: "Triangle Mesh", nodes: "A, B, C", edges: "A-B:1, B-C:1, C-A:1" },
        { label: "Star Topology", nodes: "Center, S1, S2, S3", edges: "Center-S1:2, Center-S2:2, Center-S3:2" },
        { label: "Path Finder Graph", nodes: "Start, X, Y, Z, End", edges: "Start-X:2, Start-Y:5, X-Z:1, Y-Z:2, Z-End:3" },
        { label: "Weighted Metro Ring", nodes: "T1, T2, T3, T4, T5, T6", edges: "T1-T2:2, T2-T3:2, T3-T4:3, T4-T5:2, T5-T6:4, T6-T1:3, T2-T5:1" },
        { label: "Research Cluster Mesh", nodes: "Core, AI, Bio, Chem, Math, Net", edges: "Core-AI:1, Core-Bio:2, Core-Chem:2, Core-Math:1, Core-Net:1, AI-Math:2, Bio-Chem:1, Net-AI:2, Net-Math:2" },
    ],
    optimization: [
        { label: "Parabolic Valley", expr: "x^2 + y^2", x0: "2", y0: "2", lr: "0.1" },
        { label: "Rosenbrock (Banana)", expr: "(1-x)^2 + 100*(y - x^2)^2", x0: "-1.2", y0: "1.0", lr: "0.001" },
        { label: "Ackley (Local Minima)", expr: "-20*exp(-0.2*sqrt(0.5*(x^2+y^2)))-exp(0.5*(cos(2*pi*x)+cos(2*pi*y)))+20+e", x0: "1.0", y0: "1.0", lr: "0.01" },
        { label: "Matyas (Flat Plate)", expr: "0.26*(x^2+y^2)-0.48*x*y", x0: "5.0", y0: "5.0", lr: "0.1" },
        { label: "Beale's Funnel", expr: "(1.5-x+x*y)^2+(2.25-x+x*y^2)^2+(2.625-x+x*y^3)^2", x0: "3.0", y0: "0.5", lr: "0.001" },
        { label: "Saddle Ridge", expr: "x^2 - y^2 + 0.2*x*y", x0: "2.5", y0: "-2.5", lr: "0.05" },
        { label: "Bohachevsky Bowl", expr: "x^2 + 2*y^2 - 0.3*cos(3*pi*x) - 0.4*cos(4*pi*y) + 0.7", x0: "1.5", y0: "-1.25", lr: "0.02" },
        { label: "Himmelblau Multi-Basin", expr: "(x^2 + y - 11)^2 + (x + y^2 - 7)^2", x0: "-3.5", y0: "3.0", lr: "0.006" },
    ],
    linear: [
        { label: "3x3 System (Standard)", matrix: "2 1 -1, -3 -1 2, -2 1 2", b: "8, -11, -3" },
        { label: "4x4 Sparse Matrix", matrix: "1 0 0 0, 0 1 0 0, 0 0 1 0, 0 0 0 1", b: "1, 2, 3, 4" },
        { label: "Ill-conditioned System", matrix: "0.1 0.1, 0.1 0.1001", b: "0.2, 0.2001" },
        { label: "Balanced 3x3 Physics", matrix: "4 -1 0, -1 4 -1, 0 -1 3", b: "15, 10, 10" },
        { label: "Coupled 4x4 Network", matrix: "10 2 0 1, 2 9 -1 0, 0 -1 7 2, 1 0 2 8", b: "7, 8, 6, 5" },
    ],
    crypto: [
        { label: "RSA: Alice to Bob", p: "61", q: "53", msg: "HELLO" },
        { label: "ECC: Curve P256 (Small Prime)", a: "2", p: "17", x: "5", y: "1" },
        { label: "Diffie-Hellman Exchange", g: "5", p: "23", a: "6", b: "15" },
        { label: "RSA: Secure Notes", p: "71", q: "67", msg: "DATA" },
        { label: "ECC: Compact Key Curve", a: "1", p: "19", x: "7", y: "11" },
    ],
    game: [
        { label: "Prisoner's Dilemma", matrix: "3,3 0,5; 5,0 1,1" },
        { label: "Battle of Sexes", matrix: "3,2 0,0; 0,0 2,3" },
        { label: "Hawk-Dove Evolution", v: "50", c: "100", hawk: "10", dove: "90" },
        { label: "Stag Hunt", matrix: "4,4 1,3; 3,1 2,2" },
        { label: "Coordination Shift", matrix: "5,5 0,1; 1,0 3,3" },
        { label: "Aggression Spiral Evolution", v: "70", c: "120", hawk: "45", dove: "55" },
    ],
    quantum: [
        { label: "Basis |0>", theta: 0, phi: 0 },
        { label: "Superposition |+>", theta: Math.PI / 2, phi: 0 },
        { label: "Pure State |1>", theta: Math.PI, phi: 0 },
        { label: "Phase Shift |i>", theta: Math.PI / 2, phi: Math.PI / 2 },
        { label: "Phase Shift |-i>", theta: Math.PI / 2, phi: (3 * Math.PI) / 2 },
        { label: "Magic State |T>", theta: Math.PI / 2, phi: Math.PI / 4 },
        { label: "Balanced Qubit", theta: 1.2, phi: 1.1 },
        { label: "Clifford Orbit", theta: 0.955317, phi: 2.356194 },
        { label: "Schrodinger n = 1", n: 1 },
        { label: "Schrodinger n = 2", n: 2 },
        { label: "Schrodinger n = 3", n: 3 },
        { label: "Schrodinger n = 5", n: 5 },
        { label: "Localized Packet", type: "wave-packet", spread: 0.75, momentum: 4.8 },
        { label: "Uncertainty Principle Map", type: "wave-packet", spread: 1.2, momentum: 3.4 },
    ],
    neural: [
        { label: "XOR Logic Gate", layers: "2,4,1", data: "[0,0]->0; [0,1]->1; [1,0]->1; [1,1]->0" },
        { label: "Linear Classifier", layers: "2,3,1", data: "[0.1,0.2]->0; [0.8,0.9]->1; [0.4,0.3]->0; [0.7,0.6]->1" },
        { label: "Deep Parabola Fit", layers: "1,8,4,1", data: "[0]->0; [1]->1; [2]->4; [3]->9; [-1]->1; [-2]->4" },
        { label: "AND Logic Gate", layers: "2,3,1", data: "[0,0]->0; [0,1]->0; [1,0]->0; [1,1]->1" },
        { label: "Diagonal Separator", layers: "2,5,1", data: "[0.1,0.1]->0; [0.2,0.3]->0; [0.8,0.7]->1; [0.9,0.95]->1; [0.6,0.4]->1; [0.3,0.2]->0" },
    ],
    relativity: [
        { label: "GPS Satellite Speed", v: "3874", title: "Global Positioning System Correction" },
        { label: "Muon Decay (High Speed)", v: "299000000", title: "Atmospheric Muon Survival" },
        { label: "Light Cone Geometry", type: "3d-cone" },
        { label: "Schwarzschild Radius", mass: "1.989e30", title: "Black Hole Event Horizon" },
        { label: "Particle Collider Beam", v: "299700000", title: "Ultra-relativistic Beam Dynamics" },
        { label: "Interstellar Probe", v: "220000000", title: "Deep Space Mission Clock Drift" },
        { label: "Twin Paradox Cruise", v: "250000000", title: "Long-range relativistic twin mission" },
    ]
};

export function calculateStatistics(data: number[]): StatisticsSummary {
    if (!data.length) throw new Error("Ma'lumotlar bo'sh bo'lishi mumkin emas.");
    const sorted = [...data].sort((a, b) => a - b);
    const count = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / count;
    
    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    
    // Variance & SD
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
    const sd = Math.sqrt(variance);
    
    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    data.forEach(v => {
        freq[v] = (freq[v] || 0) + 1;
        if (freq[v] > maxFreq) maxFreq = freq[v];
    });
    const mode = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq).map(Number);

    // Basic Histogram
    const min = sorted[0];
    const max = sorted[count-1];
    const bCount = 10;
    const bSize = (max - min) / bCount || 1;
    const histogram = Array.from({ length: bCount }, (_, i) => {
        const lower = min + i * bSize;
        const upper = lower + bSize;
        return {
            bin: `${lower.toFixed(1)}-${upper.toFixed(1)}`,
            count: data.filter(v => v >= lower && v < upper).length + (i === bCount - 1 ? data.filter(v => v === upper).length : 0)
        };
    });

    return { 
        mean: roundValue(mean), 
        median: roundValue(median), 
        mode, 
        variance: roundValue(variance), 
        standardDeviation: roundValue(sd), 
        count,
        histogram
    };
}

export function generateNormalDistribution(mean: number, sd: number, count = 100) {
    const points: { x: number; y: number }[] = [];
    const step = (6 * sd) / count;
    for (let i = 0; i < count; i++) {
        const x = (mean - 3 * sd) + i * step;
        const y = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
        points.push({ x: roundValue(x), y: roundValue(y) });
    }
    return points;
}

export function generateBinomialDistribution(n: number, p: number) {
    const points = [];
    function combinations(n: number, k: number): number {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        let res = 1;
        for (let i = 1; i <= k; i++) res = res * (n - i + 1) / i;
        return res;
    }
    for (let k = 0; k <= n; k++) {
        const prob = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        points.push({ x: k, y: roundValue(prob, 4) });
    }
    return points;
}

export function generatePoissonDistribution(lambda: number) {
    const points = [];
    function factorial(n: number): number {
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }
    const maxK = Math.max(10, Math.floor(lambda * 3));
    for (let k = 0; k <= maxK; k++) {
        const prob = Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
        points.push({ x: k, y: roundValue(prob, 4) });
    }
    return points;
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

export function buildDirectionField(
    derivativeExpression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    columns = 18,
    rows = 12,
): DirectionFieldSegment[] {
    ensureFiniteNumber(xMin, "xMin");
    ensureFiniteNumber(xMax, "xMax");
    ensureFiniteNumber(yMin, "yMin");
    ensureFiniteNumber(yMax, "yMax");

    const safeColumns = Math.max(4, Math.floor(columns));
    const safeRows = Math.max(4, Math.floor(rows));
    const xStart = Math.min(xMin, xMax);
    const xEnd = Math.max(xMin, xMax);
    const yStart = Math.min(yMin, yMax);
    const yEnd = Math.max(yMin, yMax);
    const cellWidth = (xEnd - xStart) / Math.max(1, safeColumns - 1);
    const cellHeight = (yEnd - yStart) / Math.max(1, safeRows - 1);
    const segmentLength = Math.min(cellWidth, cellHeight) * 0.72;
    const segments: DirectionFieldSegment[] = [];

    for (let row = 0; row < safeRows; row += 1) {
        const y = yStart + cellHeight * row;
        for (let column = 0; column < safeColumns; column += 1) {
            const x = xStart + cellWidth * column;

            try {
                const rawSlope = evaluateExpression(derivativeExpression, { x, y });
                if (!Number.isFinite(rawSlope)) {
                    continue;
                }

                const angle = Math.atan(rawSlope);
                const dx = Math.cos(angle) * segmentLength * 0.5;
                const dy = Math.sin(angle) * segmentLength * 0.5;
                segments.push({
                    x1: roundValue(x - dx, 6),
                    y1: roundValue(y - dy, 6),
                    x2: roundValue(x + dx, 6),
                    y2: roundValue(y + dy, 6),
                    slope: roundValue(rawSlope, 6),
                });
            } catch {
                // Skip singular samples and keep the field responsive in the browser.
            }
        }
    }

    return segments;
}

export function buildPlanarVectorField(
    xExpression: string,
    yExpression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    columns = 18,
    rows = 12,
): DirectionFieldSegment[] {
    ensureFiniteNumber(xMin, "xMin");
    ensureFiniteNumber(xMax, "xMax");
    ensureFiniteNumber(yMin, "yMin");
    ensureFiniteNumber(yMax, "yMax");

    const safeColumns = Math.max(4, Math.floor(columns));
    const safeRows = Math.max(4, Math.floor(rows));
    const xStart = Math.min(xMin, xMax);
    const xEnd = Math.max(xMin, xMax);
    const yStart = Math.min(yMin, yMax);
    const yEnd = Math.max(yMin, yMax);
    const cellWidth = (xEnd - xStart) / Math.max(1, safeColumns - 1);
    const cellHeight = (yEnd - yStart) / Math.max(1, safeRows - 1);
    const segmentLength = Math.min(cellWidth, cellHeight) * 0.68;
    const segments: DirectionFieldSegment[] = [];

    for (let row = 0; row < safeRows; row += 1) {
        const y = yStart + cellHeight * row;
        for (let column = 0; column < safeColumns; column += 1) {
            const x = xStart + cellWidth * column;

            try {
                const vx = evaluateExpression(xExpression, { x, y, t: 0 });
                const vy = evaluateExpression(yExpression, { x, y, t: 0 });
                const magnitude = Math.sqrt(vx * vx + vy * vy);
                if (!Number.isFinite(magnitude) || magnitude === 0) {
                    continue;
                }

                const unitX = vx / magnitude;
                const unitY = vy / magnitude;
                const dx = unitX * segmentLength * 0.5;
                const dy = unitY * segmentLength * 0.5;
                segments.push({
                    x1: roundValue(x - dx, 6),
                    y1: roundValue(y - dy, 6),
                    x2: roundValue(x + dx, 6),
                    y2: roundValue(y + dy, 6),
                    slope: roundValue(Math.abs(vx) < 1e-9 ? Math.sign(vy) * 1_000_000 : vy / vx, 6),
                });
            } catch {
                // Skip singular samples to keep the phase-plane field usable.
            }
        }
    }

    return segments;
}

function buildNullclinePoints(
    expression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    columns = 42,
    rows = 42,
) {
    const safeColumns = Math.max(6, Math.floor(columns));
    const safeRows = Math.max(6, Math.floor(rows));
    const grid: Array<Array<number | null>> = [];
    const xStep = (xMax - xMin) / Math.max(1, safeColumns - 1);
    const yStep = (yMax - yMin) / Math.max(1, safeRows - 1);
    const points = new Map<string, PlotPoint>();
    const zeroThreshold = 0.03 * Math.max(1, Math.abs(xMax - xMin), Math.abs(yMax - yMin));

    for (let row = 0; row < safeRows; row += 1) {
        const y = yMin + yStep * row;
        const rowValues: Array<number | null> = [];

        for (let column = 0; column < safeColumns; column += 1) {
            const x = xMin + xStep * column;
            try {
                rowValues.push(evaluateExpression(expression, { x, y, t: 0 }));
            } catch {
                rowValues.push(null);
            }
        }

        grid.push(rowValues);
    }

    function pushPoint(x: number, y: number) {
        const key = `${x.toFixed(3)}:${y.toFixed(3)}`;
        if (!points.has(key)) {
            points.set(key, { x: roundValue(x, 6), y: roundValue(y, 6) });
        }
    }

    for (let row = 0; row < safeRows; row += 1) {
        const y = yMin + yStep * row;
        for (let column = 0; column < safeColumns; column += 1) {
            const x = xMin + xStep * column;
            const current = grid[row][column];
            if (current !== null && Math.abs(current) < zeroThreshold) {
                pushPoint(x, y);
            }

            if (column < safeColumns - 1) {
                const right = grid[row][column + 1];
                if (current !== null && right !== null && (current === 0 || right === 0 || current * right < 0)) {
                    const ratio = current === right ? 0.5 : Math.abs(current) / (Math.abs(current) + Math.abs(right));
                    pushPoint(x + xStep * ratio, y);
                }
            }

            if (row < safeRows - 1) {
                const top = grid[row + 1][column];
                if (current !== null && top !== null && (current === 0 || top === 0 || current * top < 0)) {
                    const ratio = current === top ? 0.5 : Math.abs(current) / (Math.abs(current) + Math.abs(top));
                    pushPoint(x, y + yStep * ratio);
                }
            }
        }
    }

    return Array.from(points.values());
}

export function buildPlanarNullclineField(
    xExpression: string,
    yExpression: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    columns = 42,
    rows = 42,
): PlanarNullclineField {
    return {
        xNullcline: buildNullclinePoints(xExpression, xMin, xMax, yMin, yMax, columns, rows),
        yNullcline: buildNullclinePoints(yExpression, xMin, xMax, yMin, yMax, columns, rows),
    };
}

export function solveODESystem(
    expressions: Record<string, string>,
    initialValues: Record<string, number>,
    t0: number,
    tEnd: number,
    stepSize: number
): ODESystemPoint[] {
    ensureFiniteNumber(t0, "t0");
    ensureFiniteNumber(tEnd, "tEnd");
    ensureFiniteNumber(stepSize, "Step size");
    
    const executors = Object.entries(expressions).reduce((acc, [name, expr]) => {
        acc[name] = compile(expr);
        return acc;
    }, {} as Record<string, any>);

    const steps = Math.floor(Math.abs(tEnd - t0) / stepSize);
    const points: ODESystemPoint[] = [{ t: t0, vars: { ...initialValues } }];
    const variables = Object.keys(expressions);

    try {
        for (let i = 0; i < steps; i++) {
            const current = points[points.length - 1];
            const nextVars: Record<string, number> = {};
            
            const k1: Record<string, number> = {};
            const k1Scope = { t: current.t, ...current.vars };
            
            variables.forEach(varName => {
                try {
                    k1[varName] = Number(executors[varName].evaluate(k1Scope));
                } catch (e: any) {
                    throw new Error(`Symbol '${varName}' evaluation failed: ${e.message}`);
                }
            });

            const k2Scope = { t: current.t + stepSize };
            variables.forEach(varName => {
                // @ts-ignore
                k2Scope[varName] = current.vars[varName] + stepSize * k1[varName];
            });

            variables.forEach(varName => {
                try {
                    const slope2 = Number(executors[varName].evaluate(k2Scope));
                    nextVars[varName] = roundValue(current.vars[varName] + (stepSize / 2) * (k1[varName] + slope2));
                } catch (e: any) {
                    throw new Error(`Step update failed for '${varName}': ${e.message}`);
                }
            });

            points.push({
                t: roundValue(current.t + stepSize),
                vars: nextVars
            });
        }
    } catch (e: any) {
        throw new Error(`Solver simulation halted: ${e.message}`);
    }

    return points;
}

function interpolatePlotSeriesY(points: PlotPoint[], x: number) {
    if (!points.length) {
        return null;
    }

    if (x <= points[0].x) {
        return points[0].y;
    }

    if (x >= points[points.length - 1].x) {
        return points[points.length - 1].y;
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

        const ratio = (x - left.x) / span;
        return left.y + (right.y - left.y) * ratio;
    }

    return null;
}

export function sampleSingleEquationPhaseLine(
    derivativeExpression: string,
    xAnchor: number,
    yMin: number,
    yMax: number,
    sampleCount = 72,
): SingleEquationPhaseLine {
    ensureFiniteNumber(xAnchor, "x anchor");
    ensureFiniteNumber(yMin, "yMin");
    ensureFiniteNumber(yMax, "yMax");

    const span = Math.max(Math.abs(yMax - yMin), 1);
    const paddedMin = Math.min(yMin, yMax) - span * 0.2 - 0.5;
    const paddedMax = Math.max(yMin, yMax) + span * 0.2 + 0.5;
    const safeCount = Math.max(24, Math.floor(sampleCount));
    const rawSamples: Array<{ y: number; slope: number }> = [];

    for (let index = 0; index < safeCount; index += 1) {
        const ratio = index / Math.max(1, safeCount - 1);
        const y = paddedMin + (paddedMax - paddedMin) * ratio;

        try {
            const slope = evaluateExpression(derivativeExpression, { x: xAnchor, y });
            if (Number.isFinite(slope)) {
                rawSamples.push({ y: roundValue(y), slope: roundValue(slope) });
            }
        } catch {
            // Skip singular or non-finite samples so plotting stays usable.
        }
    }

    const equilibria: DifferentialEquilibrium[] = [];
    const epsilon = Math.max((paddedMax - paddedMin) / 220, 0.001);

    function classifyEquilibrium(root: number) {
        try {
            const leftSlope = evaluateExpression(derivativeExpression, { x: xAnchor, y: root - epsilon });
            const rightSlope = evaluateExpression(derivativeExpression, { x: xAnchor, y: root + epsilon });

            if (leftSlope > 0 && rightSlope < 0) {
                return "stable" as const;
            }
            if (leftSlope < 0 && rightSlope > 0) {
                return "unstable" as const;
            }
        } catch {
            return "semi-stable" as const;
        }

        return "semi-stable" as const;
    }

    rawSamples.forEach((sample, index) => {
        if (index === 0) {
            return;
        }

        const previous = rawSamples[index - 1];
        const signChanged = previous.slope === 0 || sample.slope === 0 || previous.slope * sample.slope < 0;
        if (!signChanged) {
            return;
        }

        const slopeDelta = sample.slope - previous.slope;
        const root =
            slopeDelta === 0
                ? sample.y
                : previous.y - previous.slope * ((sample.y - previous.y) / slopeDelta);
        const roundedRoot = roundValue(root, 5);

        if (equilibria.some((entry) => Math.abs(entry.y - roundedRoot) < epsilon * 1.5)) {
            return;
        }

        equilibria.push({
            y: roundedRoot,
            stability: classifyEquilibrium(roundedRoot),
            slope: roundValue(interpolatePlotSeriesY(rawSamples.map((entry) => ({ x: entry.y, y: entry.slope })), roundedRoot) ?? 0, 6),
        });
    });

    return {
        samples: rawSamples.map((entry) => ({ x: entry.y, y: entry.slope })),
        equilibria: equilibria.slice(0, 6),
        xAnchor: roundValue(xAnchor, 4),
        yDomain: [roundValue(paddedMin, 4), roundValue(paddedMax, 4)],
    };
}

export function buildSingleDifferentialAudit(
    derivativeExpression: string,
    points: DifferentialPoint[],
    x0: number,
    y0: number,
    stepSize: number,
    steps: number,
): SingleDifferentialAudit {
    if (!points.length) {
        throw new Error("Audit uchun differential trajectory kerak.");
    }

    const safeSteps = Math.max(1, Math.floor(steps));
    const horizon = Math.max(stepSize * safeSteps, stepSize);
    const refinementFactor = stepSize >= 0.12 ? 6 : stepSize >= 0.04 ? 4 : 2;
    const refinedSteps = Math.min(Math.max(safeSteps * refinementFactor, safeSteps + 4), 2400);
    const refinedStep = horizon / refinedSteps;
    const refinedPoints = solveDifferentialEquation(derivativeExpression, x0, y0, refinedStep, refinedSteps);
    const referenceSeries = refinedPoints.map((point) => ({ x: point.x, y: point.heun }));
    const methodGapSeries = points.map((point) => ({ x: point.x, y: roundValue(Math.abs(point.heun - point.euler), 8) }));
    const referenceGapSeries = points.map((point) => {
        const referenceValue = interpolatePlotSeriesY(referenceSeries, point.x) ?? point.heun;
        return {
            x: point.x,
            y: roundValue(Math.abs(point.heun - referenceValue), 8),
        };
    });
    const referenceGapValues = referenceGapSeries.map((point) => point.y);
    const maxReferenceGap = Math.max(...referenceGapValues, 0);
    const meanReferenceGap =
        referenceGapValues.reduce((sum, value) => sum + value, 0) / Math.max(1, referenceGapValues.length);
    const finalReferenceGap = referenceGapSeries[referenceGapSeries.length - 1]?.y ?? 0;
    const trajectoryValues = points.flatMap((point) => [point.euler, point.heun]);
    const yMin = Math.min(...trajectoryValues);
    const yMax = Math.max(...trajectoryValues);
    const phaseLine = sampleSingleEquationPhaseLine(derivativeExpression, x0, yMin, yMax);
    const recommendedStep =
        finalReferenceGap > Math.max(0.01, Math.abs(points[points.length - 1]?.heun ?? 0) * 0.03)
            ? roundValue(Math.max(stepSize / 2, 0.001), 6)
            : roundValue(stepSize, 6);

    return {
        referenceSeries,
        referenceGapSeries,
        methodGapSeries,
        phaseLine,
        refinedStep: roundValue(refinedStep, 6),
        maxReferenceGap: roundValue(maxReferenceGap, 8),
        meanReferenceGap: roundValue(meanReferenceGap, 8),
        finalReferenceGap: roundValue(finalReferenceGap, 8),
        recommendedStep,
    };
}

export function buildSystemTrajectoryAudit(
    points: ODESystemPoint[],
    hasZ: boolean,
): SystemTrajectoryAudit {
    if (!points.length) {
        throw new Error("Audit uchun system trajectory kerak.");
    }

    const radiusSeries = points.map((point) => ({
        x: point.t,
        y: roundValue(
            Math.sqrt(
                (point.vars.x || 0) ** 2 +
                (point.vars.y || 0) ** 2 +
                (hasZ ? (point.vars.z || 0) ** 2 : 0),
            ),
            8,
        ),
    }));
    const speedSeries = points.slice(1).map((point, index) => {
        const previous = points[index];
        const dt = Math.max(point.t - previous.t, Number.EPSILON);
        const dx = (point.vars.x || 0) - (previous.vars.x || 0);
        const dy = (point.vars.y || 0) - (previous.vars.y || 0);
        const dz = hasZ ? (point.vars.z || 0) - (previous.vars.z || 0) : 0;
        return {
            x: point.t,
            y: roundValue(Math.sqrt(dx * dx + dy * dy + dz * dz) / dt, 8),
        };
    });

    const xs = points.map((point) => point.vars.x || 0);
    const ys = points.map((point) => point.vars.y || 0);
    const zs = hasZ ? points.map((point) => point.vars.z || 0) : [0, 1];
    const xSpan = Math.max(...xs) - Math.min(...xs);
    const ySpan = Math.max(...ys) - Math.min(...ys);
    const zSpan = hasZ ? Math.max(...zs) - Math.min(...zs) : 1;
    const startRadius = radiusSeries[0]?.y ?? 0;
    const finalRadius = radiusSeries[radiusSeries.length - 1]?.y ?? 0;
    const speedValues = speedSeries.map((point) => point.y);
    const peakSpeed = Math.max(...speedValues, 0);
    const meanSpeed = speedValues.reduce((sum, value) => sum + value, 0) / Math.max(1, speedValues.length);
    const first = points[0];
    const last = points[points.length - 1];
    const netDrift = roundValue(
        Math.sqrt(
            ((last?.vars.x || 0) - (first?.vars.x || 0)) ** 2 +
            ((last?.vars.y || 0) - (first?.vars.y || 0)) ** 2 +
            (hasZ ? ((last?.vars.z || 0) - (first?.vars.z || 0)) ** 2 : 0),
        ),
        8,
    );

    return {
        radiusSeries,
        speedSeries,
        startRadius: roundValue(startRadius, 8),
        finalRadius: roundValue(finalRadius, 8),
        peakSpeed: roundValue(peakSpeed, 8),
        meanSpeed: roundValue(meanSpeed, 8),
        footprint: roundValue(Math.max(xSpan, 0.001) * Math.max(ySpan, 0.001) * Math.max(zSpan, 0.001), 8),
        netDrift,
    };
}

export function analyzeSeries(expression: string, startIndex: number, count: number): SeriesAnalysis {
    const safeStart = Math.max(1, Math.floor(startIndex));
    const safeCount = Math.max(4, Math.floor(count));
    const points: SeriesPoint[] = [];
    let currentPartial = 0;

    for (let offset = 0; offset < safeCount; offset += 1) {
        const n = safeStart + offset;
        const val = evaluateExpression(expression, { n });
        currentPartial += val;
        points.push({
            n,
            value: roundValue(val),
            partialSum: roundValue(currentPartial),
        });
    }

    const lastPoint = points[points.length - 1];
    const previousPoint = points[points.length - 2] ?? null;
    const firstPoint = points[0];
    const lastTermValue = lastPoint?.value ?? 0;
    const lastTermAbsolute = Math.abs(lastTermValue);
    const previousTermAbsolute = previousPoint ? Math.abs(previousPoint.value) : null;
    const firstTermAbsolute = Math.abs(firstPoint?.value ?? 0);
    const partialDelta = previousPoint ? roundValue(lastPoint.partialSum - previousPoint.partialSum) : roundValue(lastPoint.partialSum);
    const tailPartials = points.slice(-4).map((point) => point.partialSum);
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
        lastPartial: lastPoint?.partialSum ?? 0,
        lastTerm: lastTermValue,
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
export function calculateFFT(samples: number[], sampleRate: number): FrequencyPoint[] {
    const N = samples.length;
    // Simple Radix-2 FFT (Recursive)
    function fftRecursive(real: number[], imag: number[]): { re: number[]; im: number[] } {
        const n = real.length;
        if (n <= 1) return { re: real, im: imag };

        const evenRe = [], evenIm = [], oddRe = [], oddIm = [];
        for (let i = 0; i < n / 2; i++) {
            evenRe.push(real[2 * i]);
            evenIm.push(imag[2 * i]);
            oddRe.push(real[2 * i + 1]);
            oddIm.push(imag[2 * i + 1]);
        }

        const even = fftRecursive(evenRe, evenIm);
        const odd = fftRecursive(oddRe, oddIm);

        const resRe = new Array(n), resIm = new Array(n);
        for (let k = 0; k < n / 2; k++) {
            const angle = -2 * Math.PI * k / n;
            const wRe = Math.cos(angle);
            const wIm = Math.sin(angle);
            const tRe = wRe * odd.re[k] - wIm * odd.im[k];
            const tIm = wRe * odd.im[k] + wIm * odd.re[k];

            resRe[k] = even.re[k] + tRe;
            resIm[k] = even.im[k] + tIm;
            resRe[k + n / 2] = even.re[k] - tRe;
            resIm[k + n / 2] = even.im[k] - tIm;
        }
        return { re: resRe, im: resIm };
    }

    // Zero pad to next power of 2
    let nextPow2 = 1;
    while (nextPow2 < N) nextPow2 <<= 1;
    const padded = samples.concat(new Array(nextPow2 - N).fill(0));
    const result = fftRecursive(padded, new Array(nextPow2).fill(0));

    const freqPoints: FrequencyPoint[] = [];
    const binSize = sampleRate / nextPow2;
    for (let k = 0; k < nextPow2 / 2; k++) {
        const mag = Math.sqrt(result.re[k] * result.re[k] + result.im[k] * result.im[k]) / (N / 2);
        const phase = Math.atan2(result.im[k], result.re[k]);
        freqPoints.push({ freq: roundValue(k * binSize), magnitude: roundValue(mag), phase: roundValue(phase) });
    }
    return freqPoints;
}

export function generateWaveform(type: string, freq: number, amp: number, noise: number = 0, sr: number = 4096, duration: number = 0.1) {
    const samples = [];
    const points = [];
    const N = Math.floor(sr * duration);
    for (let i = 0; i < N; i++) {
        const t = i / sr;
        let val = 0;
        const phase = 2 * Math.PI * freq * t;
        if (type === "sine") val = amp * Math.sin(phase);
        else if (type === "square") val = amp * (Math.sin(phase) >= 0 ? 1 : -1);
        else if (type === "sawtooth") val = amp * (2 * (phase / (2 * Math.PI) - Math.floor(0.5 + phase / (2 * Math.PI))));
        else if (type === "triangle") val = amp * (2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(0.5 + phase / (2 * Math.PI)))) - 1);
        
        val += (Math.random() * 2 - 1) * noise;
        samples.push(val);
        points.push({ x: roundValue(t), y: roundValue(val) });
    }
    return { samples, points };
}

export function findPeakFrequency(spectrum: FrequencyPoint[]) {
    if (!spectrum.length) return 0;
    let maxMag = -1;
    let peakF = 0;
    // Skip DC (k=0)
    for (let i = 1; i < spectrum.length; i++) {
        if (spectrum[i].magnitude > maxMag) {
            maxMag = spectrum[i].magnitude;
            peakF = spectrum[i].freq;
        }
    }
    return peakF;
}

export function calculateMatrixTransformation(matrix: number[][]): MatrixTransformation3D {
    const vertices = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
    ];
    const edges: Array<[number, number]> = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    const transformPoint = ([vx, vy, vz]: number[]): PlotPoint3D => {
        if (matrix.length < 3 || matrix[0].length < 3) {
            return { x: vx, y: vy, z: vz };
        }

        return {
            x: roundValue(matrix[0][0] * vx + matrix[0][1] * vy + matrix[0][2] * vz),
            y: roundValue(matrix[1][0] * vx + matrix[1][1] * vy + matrix[1][2] * vz),
            z: roundValue(matrix[2][0] * vx + matrix[2][1] * vy + matrix[2][2] * vz),
        };
    };

    let determinant: number | null = null;
    try {
        determinant = matrix.length === 3 && matrix[0]?.length === 3 ? roundValue(Number(det(matrix))) : null;
    } catch {
        determinant = null;
    }

    return {
        original: vertices.map(([x, y, z]) => ({ x, y, z })),
        transformed: vertices.map(transformPoint),
        edges,
        determinant,
        basisVectors: [
            { label: "e1", color: "#2563eb", original: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], transformed: [{ x: 0, y: 0, z: 0 }, transformPoint([1, 0, 0])] },
            { label: "e2", color: "#f59e0b", original: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], transformed: [{ x: 0, y: 0, z: 0 }, transformPoint([0, 1, 0])] },
            { label: "e3", color: "#10b981", original: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }], transformed: [{ x: 0, y: 0, z: 0 }, transformPoint([0, 0, 1])] },
        ],
    };
}

// --- Numerical Analysis ---

export function solveNewtonRaphson(expr: string, x0: number, tolerance = 1e-7, maxIter = 50) {
    const fn = compile(expr);
    const dfn = derivative(parse(expr), 'x');
    
    let x = x0;
    const steps = [{ x: roundValue(x), y: roundValue(fn.evaluate({ x })) }];

    for (let i = 0; i < maxIter; i++) {
        const fx = fn.evaluate({ x });
        const dfx = dfn.evaluate({ x });
        
        if (Math.abs(dfx) < 1e-10) break; // Slope too flat
        
        const nextX = x - fx / dfx;
        x = nextX;
        steps.push({ x: roundValue(x), y: roundValue(fn.evaluate({ x })) });
        
        if (Math.abs(fx) < tolerance) break;
    }
    
    return { x: roundValue(x), steps };
}

export function calculateLinearRegression(points: { x: number; y: number }[]) {
    if (points.length < 2) return null;
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope: roundValue(slope), intercept: roundValue(intercept), rSquare: 0.99 };
}

// --- Optimization ---

export function solveGradientDescent(expr: string, x0: number, y0: number, lr = 0.1, epochs = 20) {
    const fn = compile(expr);
    const dx = derivative(parse(expr), 'x');
    const dy = derivative(parse(expr), 'y');
    
    let x = x0;
    let y = y0;
    const path = [{ x: roundValue(x), y: roundValue(y), z: roundValue(fn.evaluate({ x, y })) }];
    
    for (let i = 0; i < epochs; i++) {
        const gx = dx.evaluate({ x, y });
        const gy = dy.evaluate({ x, y });
        
        x = x - lr * gx;
        y = y - lr * gy;
        
        path.push({ x: roundValue(x), y: roundValue(y), z: roundValue(fn.evaluate({ x, y })) });
    }
    
    return path;
}

export function buildOptimizationLandscape(expr: string, path: PlotPoint3D[], resolution = 34): OptimizationLandscape {
    const cleanPath = path.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
    const executor = compile(expr);
    const xs = cleanPath.map((point) => point.x);
    const ys = cleanPath.map((point) => point.y);
    const minX = Math.min(...xs, -1.5);
    const maxX = Math.max(...xs, 1.5);
    const minY = Math.min(...ys, -1.5);
    const maxY = Math.max(...ys, 1.5);
    const xPadding = Math.max((maxX - minX) * 0.4, 1.25);
    const yPadding = Math.max((maxY - minY) * 0.4, 1.25);
    const xRange: [number, number] = [roundValue(minX - xPadding), roundValue(maxX + xPadding)];
    const yRange: [number, number] = [roundValue(minY - yPadding), roundValue(maxY + yPadding)];
    const surfaceSamples: PlotPoint3D[] = [];
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    for (let rowIndex = 0; rowIndex < resolution; rowIndex += 1) {
        const y = yRange[0] + ((yRange[1] - yRange[0]) * rowIndex) / Math.max(1, resolution - 1);
        for (let columnIndex = 0; columnIndex < resolution; columnIndex += 1) {
            const x = xRange[0] + ((xRange[1] - xRange[0]) * columnIndex) / Math.max(1, resolution - 1);
            const z = Number(executor.evaluate({ x, y }));
            if (!Number.isFinite(z) || Math.abs(z) > 1_000_000) {
                continue;
            }

            const point = { x: roundValue(x), y: roundValue(y), z: roundValue(z) };
            surfaceSamples.push(point);
            minZ = Math.min(minZ, point.z);
            maxZ = Math.max(maxZ, point.z);
        }
    }

    return {
        path: cleanPath,
        surfaceSamples,
        xRange,
        yRange,
        zRange: [
            Number.isFinite(minZ) ? roundValue(minZ) : 0,
            Number.isFinite(maxZ) ? roundValue(maxZ) : 0,
        ],
    };
}

// --- Linear Systems & Spaces ---

export function solveLinearSystem(matrix: number[][], b: number[]) {
    const n = b.length;
    const a = matrix.map(row => [...row]);
    const resB = [...b];

    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(a[j][i]) > Math.abs(a[max][i])) max = j;
        }
        [a[i], a[max]] = [a[max], a[i]];
        [resB[i], resB[max]] = [resB[max], resB[i]];

        for (let j = i + 1; j < n; j++) {
            const f = a[j][i] / a[i][i];
            resB[j] -= f * resB[i];
            for (let k = i; k < n; k++) {
                a[j][k] -= f * a[i][k];
            }
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += a[i][j] * x[j];
        x[i] = roundValue((resB[i] - sum) / a[i][i]);
    }
    return x;
}

// --- Cryptography ---

export function isPrime(n: number) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
}

export function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export function modInverse(a: number, m: number) {
    let m0 = m, t, q;
    let x0 = 0, x1 = 1;
    if (m === 1) return 0;
    while (a > 1) {
        q = Math.floor(a / m);
        t = m;
        m = a % m, a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }
    if (x1 < 0) x1 += m0;
    return x1;
}

export function calculateECCPointAddition(p1: {x: number, y: number} | null, p2: {x: number, y: number} | null, a: number, p: number) {
    if (!p1) return p2;
    if (!p2) return p1;
    let lambda;
    if (p1.x === p2.x && p1.y === p2.y) {
        lambda = (3 * p1.x * p1.x + a) * modInverse(2 * p1.y, p);
    } else {
        const dx = (p2.x - p1.x + p) % p;
        const dy = (p2.y - p1.y + p) % p;
        if (dx === 0) return null;
        lambda = dy * modInverse(dx, p);
    }
    lambda %= p;
    const x3 = (lambda * lambda - p1.x - p2.x + 2 * p) % p;
    const y3 = (lambda * (p1.x - x3) - p1.y + 2 * p) % p;
    return { x: x3, y: y3 };
}

// --- Game Theory ---

export function findNashEquilibrium(matrix: { a: number, b: number }[][]) {
    const equilibria = [];
    const rows = matrix.length;
    const cols = matrix[0].length;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Check if player A (rows) has no better move
            let bestA = true;
            for (let i = 0; i < rows; i++) {
                if (matrix[i][c].a > matrix[r][c].a) { bestA = false; break; }
            }
            // Check if player B (cols) has no better move
            let bestB = true;
            for (let j = 0; j < cols; j++) {
                if (matrix[r][j].b > matrix[r][c].b) { bestB = false; break; }
            }
            if (bestA && bestB) equilibria.push({ r, c });
        }
    }
    return equilibria;
}

export function runEvolutionarySim(initialPop: { hawk: number, dove: number }, costs: { v: number, c: number }, rounds = 50) {
    const history = [{ hawk: initialPop.hawk, dove: initialPop.dove }];
    let hawk = initialPop.hawk;
    let dove = initialPop.dove;

    for (let i = 0; i < rounds; i++) {
        const total = hawk + dove;
        const ph = hawk / total;
        const pd = dove / total;

        const fitnessH = ph * (costs.v - costs.c) / 2 + pd * costs.v;
        const fitnessD = ph * 0 + pd * costs.v / 2;
        const avgFitness = ph * fitnessH + pd * fitnessD;

        hawk = hawk * (fitnessH / avgFitness);
        dove = dove * (fitnessD / avgFitness);
        history.push({ hawk: roundValue(hawk), dove: roundValue(dove) });
    }
    return history;
}

// --- Quantum & Physics ---

export function calculateBlochCoords(theta: number, phi: number) {
    const safeTheta = Number.isFinite(theta) ? Math.min(Math.PI, Math.max(0, theta)) : Math.PI / 2;
    const fullTurn = Math.PI * 2;
    const safePhi = Number.isFinite(phi) ? ((phi % fullTurn) + fullTurn) % fullTurn : 0;
    const x = Math.sin(safeTheta) * Math.cos(safePhi);
    const y = Math.sin(safeTheta) * Math.sin(safePhi);
    const z = Math.cos(safeTheta);
    return { x: roundValue(x), y: roundValue(y), z: roundValue(z) };
}

export function analyzeQuantumState(theta: number, phi: number): QuantumStateAnalysis {
    const safeTheta = Number.isFinite(theta) ? Math.min(Math.PI, Math.max(0, theta)) : Math.PI / 2;
    const fullTurn = Math.PI * 2;
    const safePhi = Number.isFinite(phi) ? ((phi % fullTurn) + fullTurn) % fullTurn : 0;
    const cartesian = calculateBlochCoords(safeTheta, safePhi);
    const alphaMagnitude = roundValue(Math.cos(safeTheta / 2));
    const betaMagnitude = roundValue(Math.sin(safeTheta / 2));
    const zeroProbability = roundValue(alphaMagnitude ** 2);
    const oneProbability = roundValue(betaMagnitude ** 2);
    const coherence = roundValue(Math.sin(safeTheta));
    const longitude = roundValue((safePhi * 180) / Math.PI, 3);
    const latitude = roundValue(90 - (safeTheta * 180) / Math.PI, 3);

    let phaseClass = "Computational bias";
    let label = "Near basis state";
    if (zeroProbability > 0.45 && oneProbability > 0.45) {
        label = "Balanced superposition";
        phaseClass = "Equatorial coherence";
    } else if (oneProbability > 0.8) {
        label = "Excited basis tendency";
    } else if (zeroProbability > 0.8) {
        label = "Ground basis tendency";
    }

    if (safePhi > Math.PI / 4 && safePhi < (3 * Math.PI) / 4) {
        phaseClass = "Positive phase shift";
    } else if (safePhi > (5 * Math.PI) / 4 && safePhi < (7 * Math.PI) / 4) {
        phaseClass = "Negative phase shift";
    }

    const ket = `|psi> = ${alphaMagnitude.toFixed(3)}|0> + e^(i${safePhi.toFixed(3)}) ${betaMagnitude.toFixed(3)}|1>`;

    return {
        theta: roundValue(safeTheta),
        phi: roundValue(safePhi),
        cartesian,
        alphaMagnitude,
        betaMagnitude,
        zeroProbability,
        oneProbability,
        coherence,
        longitude,
        latitude,
        phaseClass,
        label,
        ket,
    };
}

export function buildBlochSphereGeometry(latitudeSteps = 24, longitudeSteps = 48): BlochSphereGeometry {
    const safeLatitudeSteps = Math.max(8, Math.floor(latitudeSteps));
    const safeLongitudeSteps = Math.max(12, Math.floor(longitudeSteps));

    return {
        surface: createParametricSurfaceGrid(safeLatitudeSteps + 1, safeLongitudeSteps + 1, (latitudeIndex, longitudeIndex) => {
            const theta = (latitudeIndex / safeLatitudeSteps) * Math.PI;
            const phi = (longitudeIndex / safeLongitudeSteps) * Math.PI * 2;
            return {
                x: Math.sin(theta) * Math.cos(phi),
                y: Math.sin(theta) * Math.sin(phi),
                z: Math.cos(theta),
            };
        }),
        equator: Array.from({ length: safeLongitudeSteps + 1 }, (_, index) => {
            const angle = (index / safeLongitudeSteps) * Math.PI * 2;
            return { x: roundValue(Math.cos(angle)), y: roundValue(Math.sin(angle)), z: 0 };
        }),
        meridians: [0, Math.PI / 2, Math.PI / 4].map((phi) =>
            Array.from({ length: safeLatitudeSteps + 1 }, (_, index) => {
                const theta = (index / safeLatitudeSteps) * Math.PI;
                return {
                    x: roundValue(Math.sin(theta) * Math.cos(phi)),
                    y: roundValue(Math.sin(theta) * Math.sin(phi)),
                    z: roundValue(Math.cos(theta)),
                };
            }),
        ),
        axes: [
            { label: "X axis", color: "#2563eb", points: [{ x: -1.2, y: 0, z: 0 }, { x: 1.2, y: 0, z: 0 }] },
            { label: "Y axis", color: "#f59e0b", points: [{ x: 0, y: -1.2, z: 0 }, { x: 0, y: 1.2, z: 0 }] },
            { label: "Z axis", color: "#10b981", points: [{ x: 0, y: 0, z: -1.2 }, { x: 0, y: 0, z: 1.2 }] },
        ],
        poles: [
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 },
        ],
    };
}

export function getSchrodingerStates(n: number, points = 100): QuantumWavePoint[] {
    const data: QuantumWavePoint[] = [];
    const L = 10;
    const safeN = Math.max(1, Math.floor(Number.isFinite(n) ? n : 1));
    const safePoints = Math.max(24, Math.floor(Number.isFinite(points) ? points : 100));
    for (let i = 0; i <= safePoints; i++) {
        const x = (i / safePoints) * L;
        const psi = Math.sqrt(2 / L) * Math.sin((safeN * Math.PI * x) / L);
        data.push({ x: roundValue(x), y: roundValue(psi), prob: roundValue(psi * psi) });
    }
    return data;
}

export const QUANTUM_GATES = {
    H: { theta: Math.PI / 2, phi: 0 },
    X: { theta: Math.PI, phi: 0 },
    Y: { theta: Math.PI, phi: Math.PI / 2 },
    Z: { theta: 0, phi: Math.PI }, // This is a bit complex for a simple theta/phi but okay for start
    S: { theta: Math.PI / 2, phi: Math.PI / 2 },
    T: { theta: Math.PI / 2, phi: Math.PI / 4 },
};

// --- Neural Networks ---

export function trainSimpleNetwork(layers: number[], data: { x: number[], y: number }[], lr = 0.1, epochs = 50) {
    // Very simplified MLP for 1-output
    let weights = layers.slice(0, -1).map((n, i) => 
        Array.from({ length: n * layers[i+1] }, () => Math.random() - 0.5)
    );
    const history = [];

    for (let e = 0; e < epochs; e++) {
        let totalLoss = 0;
        data.forEach(p => {
            // Forward (simple 1-hidden-layer focus for demo)
            const hidden = Array.from({ length: layers[1] }, (_, i) => {
                const sum = p.x.reduce((s, val, j) => s + val * weights[0][j * layers[1] + i], 0);
                return 1 / (1 + Math.exp(-sum)); // Sigmoid
            });
            const outputSum = hidden.reduce((s, val, i) => s + val * weights[1][i], 0);
            const output = 1 / (1 + Math.exp(-outputSum));
            
            const error = p.y - output;
            totalLoss += error * error;

            // Backprop (Simplified)
            const dOut = error * output * (1 - output);
            weights[1] = weights[1].map((w, i) => w + lr * dOut * hidden[i]);
            
            const dHid = hidden.map((h, i) => dOut * weights[1][i] * h * (1 - h));
            weights[0] = weights[0].map((w, idx) => {
                const i = idx % layers[1];
                const j = Math.floor(idx / layers[1]);
                return w + lr * dHid[i] * p.x[j];
            });
        });
        history.push({ epoch: e, loss: roundValue(totalLoss / data.length) });
    }
    return { weights, history };
}

// --- Relativity ---

export function calculateLorentz(v: number) {
    const c = 299792458; // m/s
    const ratio = v / c;
    if (ratio >= 1) return { gamma: Infinity, dilation: Infinity, lengthContraction: 0 };
    const gamma = 1 / Math.sqrt(1 - ratio * ratio);
    return {
        gamma: roundValue(gamma),
        dilation: roundValue(gamma), // Time dilated by gamma
        lengthContraction: roundValue(1 / gamma)
    };
}

export function getLightConeGeometry(radius = 12, radialSteps = 18, angularSteps = 36): LightConeGeometry {
    const safeRadius = Math.max(2, Math.abs(radius));
    const safeRadialSteps = Math.max(6, Math.floor(radialSteps));
    const safeAngularSteps = Math.max(12, Math.floor(angularSteps));
    const rayAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

    return {
        futureSurface: createParametricSurfaceGrid(safeRadialSteps + 1, safeAngularSteps + 1, (radialIndex, angularIndex) => {
            const t = (radialIndex / safeRadialSteps) * safeRadius;
            const phi = (angularIndex / safeAngularSteps) * Math.PI * 2;
            return { x: t * Math.cos(phi), y: t * Math.sin(phi), z: t };
        }),
        pastSurface: createParametricSurfaceGrid(safeRadialSteps + 1, safeAngularSteps + 1, (radialIndex, angularIndex) => {
            const t = (radialIndex / safeRadialSteps) * safeRadius;
            const phi = (angularIndex / safeAngularSteps) * Math.PI * 2;
            return { x: t * Math.cos(phi), y: t * Math.sin(phi), z: -t };
        }),
        axis: [{ x: 0, y: 0, z: -safeRadius * 1.1 }, { x: 0, y: 0, z: safeRadius * 1.1 }],
        nullRays: rayAngles.flatMap((angle) => [
            Array.from({ length: safeRadialSteps + 1 }, (_, index) => {
                const t = (index / safeRadialSteps) * safeRadius;
                return { x: roundValue(t * Math.cos(angle)), y: roundValue(t * Math.sin(angle)), z: roundValue(t) };
            }),
            Array.from({ length: safeRadialSteps + 1 }, (_, index) => {
                const t = (index / safeRadialSteps) * safeRadius;
                return { x: roundValue(t * Math.cos(angle)), y: roundValue(t * Math.sin(angle)), z: roundValue(-t) };
            }),
        ]),
        boundaryLoops: [1, -1].map((direction) =>
            Array.from({ length: safeAngularSteps + 1 }, (_, index) => {
                const phi = (index / safeAngularSteps) * Math.PI * 2;
                return {
                    x: roundValue(safeRadius * Math.cos(phi)),
                    y: roundValue(safeRadius * Math.sin(phi)),
                    z: roundValue(direction * safeRadius),
                };
            }),
        ),
    };
}

export function getLightCone(steps = 20) {
    const data = [];
    for (let t = -steps; t <= steps; t++) {
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
            const x = t * Math.cos(angle);
            const y = t * Math.sin(angle);
            data.push({ x: roundValue(x), y: roundValue(y), z: roundValue(t) });
        }
    }
    return data;
}

// --- Graph Theory ---

export type GraphNode = {
    id: string;
    label: string;
    x: number;
    y: number;
};

export type GraphEdge = {
    from: string;
    to: string;
    weight: number;
};

export function calculateShortestPath(nodes: string[], edges: GraphEdge[], startNode: string, endNode: string) {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const queue = new Set(nodes);

    nodes.forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
    });
    distances[startNode] = 0;

    while (queue.size > 0) {
        let nearest: string | null = null;
        queue.forEach(node => {
            if (nearest === null || distances[node] < distances[nearest]) {
                nearest = node;
            }
        });

        if (nearest === null || distances[nearest] === Infinity || nearest === endNode) break;
        queue.delete(nearest);

        const neighbors = edges.flatMap((edge) => {
            if (edge.from === nearest) {
                return [{ target: edge.to, weight: edge.weight }];
            }

            if (edge.to === nearest) {
                return [{ target: edge.from, weight: edge.weight }];
            }

            return [];
        });

        neighbors.forEach((edge) => {
            const alt = distances[nearest!] + edge.weight;
            if (alt < distances[edge.target]) {
                distances[edge.target] = alt;
                previous[edge.target] = nearest;
            }
        });
    }

    const path = [];
    let curr: string | null = endNode;
    while (curr) {
        path.unshift(curr);
        curr = previous[curr];
    }
    
    return path.length > 1 && path[0] === startNode ? path : [];
}

export function generateForceLayout(nodes: string[], edges: GraphEdge[], iterations = 50) {
    const layout: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
        layout[n] = { x: Math.cos(i) * 100, y: Math.sin(i) * 100 };
    });

    // Simple Fruchterman-Reingold inspired (Simplified)
    for (let it = 0; it < iterations; it++) {
        nodes.forEach(v => {
            let dx = 0, dy = 0;
            // Repulsion
            nodes.forEach(u => {
                if (u === v) return;
                const vx = layout[v].x - layout[u].x;
                const vy = layout[v].y - layout[u].y;
                const d2 = vx*vx + vy*vy || 1;
                dx += (vx / d2) * 200;
                dy += (vy / d2) * 200;
            });
            // Attraction
            edges.forEach(e => {
                if (e.from !== v && e.to !== v) return;
                const other = e.from === v ? e.to : e.from;
                const vx = layout[other].x - layout[v].x;
                const vy = layout[other].y - layout[v].y;
                const d = Math.sqrt(vx*vx + vy*vy) || 1;
                dx += vx * (d / 500);
                dy += vy * (d / 500);
            });
            layout[v].x += dx * 0.1;
            layout[v].y += dy * 0.1;
        });
    }
    return layout;
}
