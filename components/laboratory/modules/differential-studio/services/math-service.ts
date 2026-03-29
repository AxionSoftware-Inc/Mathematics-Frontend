/**
 * DifferentialMathService
 *
 * Frontend-only numerical engine for Differential Studio.
 * Mirrors the structure of LaboratoryMathService (integral-studio) but covers
 * the differential calculus family:
 *
 *   - ordinary derivative (scalar, f: R → R)
 *   - higher-order derivative (nth order)
 *   - partial derivative / gradient (scalar field f: Rⁿ → R)
 *   - directional derivative (scalar field, given unit vector)
 *   - Jacobian matrix (vector field F: Rⁿ → Rᵐ)
 *   - Hessian matrix (scalar field f: Rⁿ → R, all second partials)
 *   - sensitivity sweep (h-step stability: h from 1e-2 → 1e-7)
 *   - trace samples (function plot around evaluation point)
 *   - tangent line / tangent plane data
 *
 * Rules (from MODULE_AUTHORING_GUIDE):
 *   - No fetch calls
 *   - No JSX
 *   - No report copy
 *   - Deterministic, pure math only
 */

import { compile } from "mathjs";
import type {
    DerivativeSummary,
    GradientSummary,
    JacobianSummary,
    HessianSummary,
    DirectionalDerivativeSummary,
    HigherOrderDerivativeSummary,
    PartialDerivativeSummary,
    PlotPoint,
    ODESummary,
    PDESummary,
    SDESummary,
    DifferentialCoordinateSystem,
    StepSweepEntry,
} from "../types";

// ─── Internal utilities ────────────────────────────────────────────────────────

type CompiledExpression = {
    evaluate: (scope?: Record<string, number>) => unknown;
};

/** Normalize unicode math characters to mathjs-compatible ASCII. */
function normalizeExpression(expression: string): string {
    return expression
        .replace(/\u2212/g, "-")               // minus sign
        .replace(/[\u00D7\u22C5\u00B7]/g, "*") // multiplication dots
        .replace(/[\u00F7]/g, "/")             // division sign
        .replace(/\u03C0/g, "pi")              // π
        .replace(/\u03C1/g, "rho")             // ρ
        .replace(/[\u03B8\u03D1]/g, "theta")   // θ
        .replace(/[\u03C6\u03D5]/g, "phi")     // φ
        .replace(/\u03B1/g, "alpha")           // α
        .replace(/\u03B2/g, "beta")            // β
        .replace(/\bI\b/g, "i")               // imaginary unit
        .replace(/\bln\s*\(/gi, "log(")        // ln → log
        .trim();
}

function createCompiledExpression(expression: string): {
    normalized: string;
    executor: CompiledExpression;
} {
    const normalized = normalizeExpression(expression);
    if (!normalized) {
        throw new Error("Formula bo'sh. Differensial hisoblash uchun ifoda kerak.");
    }
    try {
        return { normalized, executor: compile(normalized) as CompiledExpression };
    } catch {
        throw new Error(
            "Ifoda parse qilinmadi. `sin(x)`, `x^2 + y^2`, `[sin(x*y), x+y]` ko'rinishida yozing."
        );
    }
}

function safeEval(executor: CompiledExpression, scope: Record<string, number>): number | null {
    try {
        const result = executor.evaluate(scope);
        const n = Number(result);
        return Number.isFinite(n) ? n : null;
    } catch {
        return null;
    }
}

/** Parse comma-separated variable list: "x, y, z" → ["x", "y", "z"] */
function parseVariables(variableStr: string): string[] {
    return variableStr
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}

/** Parse comma-separated point string: "1.0, 2.0" or "[1, 2]" → [1, 2] */
function parsePoint(pointStr: string): number[] {
    const cleaned = pointStr.replace(/[\[\]]/g, "");
    return cleaned
        .split(",")
        .map((p) => Number(p.trim()))
        .filter((n) => !Number.isNaN(n));
}

/** Build a scope object from variable names and point values. */
function buildScope(vars: string[], pts: number[]): Record<string, number> {
    const scope: Record<string, number> = {};
    vars.forEach((v, i) => {
        scope[v] = pts[i] ?? 0;
    });
    return scope;
}

/** Central difference first-order partial derivative of executor w.r.t. vars[varIndex]. */
function centralDiff1(
    executor: CompiledExpression,
    scope: Record<string, number>,
    varName: string,
    h: number
): number {
    const fwd = safeEval(executor, { ...scope, [varName]: scope[varName] + h }) ?? 0;
    const bwd = safeEval(executor, { ...scope, [varName]: scope[varName] - h }) ?? 0;
    return (fwd - bwd) / (2 * h);
}

/** Central difference second-order derivative (diagonal Hessian entry). */
function centralDiff2Diag(
    executor: CompiledExpression,
    scope: Record<string, number>,
    varName: string,
    h: number,
    fMid: number
): number {
    const fwd = safeEval(executor, { ...scope, [varName]: scope[varName] + h }) ?? fMid;
    const bwd = safeEval(executor, { ...scope, [varName]: scope[varName] - h }) ?? fMid;
    return (fwd - 2 * fMid + bwd) / (h * h);
}

/** Mixed partial derivative by the 4-point stencil. */
function centralDiff2Mixed(
    executor: CompiledExpression,
    scope: Record<string, number>,
    var_i: string,
    var_j: string,
    h: number
): number {
    const pp = safeEval(executor, { ...scope, [var_i]: scope[var_i] + h, [var_j]: scope[var_j] + h }) ?? 0;
    const pm = safeEval(executor, { ...scope, [var_i]: scope[var_i] + h, [var_j]: scope[var_j] - h }) ?? 0;
    const mp = safeEval(executor, { ...scope, [var_i]: scope[var_i] - h, [var_j]: scope[var_j] + h }) ?? 0;
    const mm = safeEval(executor, { ...scope, [var_i]: scope[var_i] - h, [var_j]: scope[var_j] - h }) ?? 0;
    return (pp - pm - mp + mm) / (4 * h * h);
}

/** 2x2 determinant. */
function det2x2(m: number[][]): number {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

/** 3x3 determinant via cofactor expansion. */
function det3x3(m: number[][]): number {
    return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
}

/** Compute matrix determinant for up to 3x3; null for larger. */
function computeDeterminant(matrix: number[][]): number | null {
    const n = matrix.length;
    if (n === 1 && matrix[0].length === 1) return matrix[0][0];
    if (n === 2 && matrix[0].length === 2) return det2x2(matrix);
    if (n === 3 && matrix[0].length === 3) return det3x3(matrix);
    return null;
}

/** L2 norm of a vector. */
function norm(v: number[]): number {
    return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

/**
 * Build coordinate-aware scope.
 * For polar: treats variable[0] as r, variable[1] as theta.
 * For cylindrical: (r, theta, z). For spherical: (rho, theta, phi).
 */
function buildCoordScope(
    vars: string[],
    pts: number[],
    coords: DifferentialCoordinateSystem
): Record<string, number> {
    const base = buildScope(vars, pts);

    if (coords === "polar" && vars.length >= 2) {
        const r = pts[0] ?? 0;
        const theta = pts[1] ?? 0;
        base.x = r * Math.cos(theta);
        base.y = r * Math.sin(theta);
    } else if (coords === "cylindrical" && vars.length >= 3) {
        const r = pts[0] ?? 0;
        const theta = pts[1] ?? 0;
        const z = pts[2] ?? 0;
        base.x = r * Math.cos(theta);
        base.y = r * Math.sin(theta);
        base.z = z;
    } else if (coords === "spherical" && vars.length >= 3) {
        const rho = pts[0] ?? 0;
        const theta = pts[1] ?? 0;
        const phi = pts[2] ?? 0;
        base.x = rho * Math.sin(phi) * Math.cos(theta);
        base.y = rho * Math.sin(phi) * Math.sin(theta);
        base.z = rho * Math.cos(phi);
    }

    return base;
}

// ─── Public service class ──────────────────────────────────────────────────────

export class DifferentialMathService {

    // ──────────────────────────────────────────────────────────────────────────
    // 1. TRACE SAMPLES  (function plot around evaluation point)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Build 1D function trace samples for plotting.
     * Clamps to a safe window around the evaluation point.
     */
    static buildTraceSamples(
        expression: string,
        variable: string,
        center: number,
        range = 6,
        sampleCount = 160,
    ): PlotPoint[] {
        const { executor } = createCompiledExpression(expression);
        const lower = center - range;
        const upper = center + range;
        const step = (upper - lower) / (sampleCount - 1);
        const samples: PlotPoint[] = [];

        for (let i = 0; i < sampleCount; i++) {
            const x = lower + i * step;
            const y = safeEval(executor, { [variable]: x });
            if (y !== null) {
                samples.push({ x, y });
            }
        }

        return samples;
    }

    /**
     * Build tangent line samples: y = slope*(x - x0) + f(x0),
     * extending slightly beyond the function trace window.
     */
    static buildTangentLineSamples(
        slope: number,
        intercept: number,
        center: number,
        range = 6,
        sampleCount = 60,
    ): PlotPoint[] {
        const lower = center - range;
        const upper = center + range;
        const step = (upper - lower) / (sampleCount - 1);
        const samples: PlotPoint[] = [];

        for (let i = 0; i < sampleCount; i++) {
            const x = lower + i * step;
            const y = slope * x + intercept;
            if (Number.isFinite(y)) {
                samples.push({ x, y });
            }
        }

        return samples;
    }

    /**
     * Build a slope field (direction field) for dy/dx = f(x, y).
     * Returns a grid of arrow anchor points and slopes.
     */
    static buildSlopeField(
        expression: string,
        xMin: number,
        xMax: number,
        yMin: number,
        yMax: number,
        gridN = 14,
    ): Array<{ x: number; y: number; slope: number }> {
        const { executor } = createCompiledExpression(expression);
        const dx = (xMax - xMin) / gridN;
        const dy = (yMax - yMin) / gridN;
        const field: Array<{ x: number; y: number; slope: number }> = [];

        for (let ix = 0; ix < gridN; ix++) {
            for (let iy = 0; iy < gridN; iy++) {
                const x = xMin + (ix + 0.5) * dx;
                const y = yMin + (iy + 0.5) * dy;
                const slope = safeEval(executor, { x, y });
                if (slope !== null) {
                    field.push({ x, y, slope });
                }
            }
        }

        return field;
    }

    /**
     * Build a 2D surface preview for a scalar field f(x,y).
     * Returns grid samples for heatmap or 3D surface visualization.
     */
    static buildScalarFieldSamples(
        expression: string,
        vars: string[],
        pts: number[],
        nx = 24,
        ny = 24,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): Array<{ x: number; y: number; z: number }> {
        if (vars.length < 2) {
            throw new Error("Scalar field preview kamida 2 ta o'zgaruvchi talab qiladi.");
        }
        const { executor } = createCompiledExpression(expression);
        const xCenter = pts[0] ?? 0;
        const yCenter = pts[1] ?? 0;
        const xRange = 4;
        const yRange = 4;
        const xMin = xCenter - xRange;
        const xMax = xCenter + xRange;
        const yMin = yCenter - yRange;
        const yMax = yCenter + yRange;
        const dx = (xMax - xMin) / nx;
        const dy = (yMax - yMin) / ny;
        const samples: Array<{ x: number; y: number; z: number }> = [];

        for (let ix = 0; ix < nx; ix++) {
            const xv = xMin + (ix + 0.5) * dx;
            for (let iy = 0; iy < ny; iy++) {
                const yv = yMin + (iy + 0.5) * dy;
                const scope = buildCoordScope(vars, [xv, yv, ...(pts.slice(2))], coords);
                const z = safeEval(executor, scope);
                if (z !== null) {
                    samples.push({ x: xv, y: yv, z });
                }
            }
        }

        return samples;
    }

    /**
     * Build tangent plane samples for a 2D scalar field f(x, y).
     * z = f(x0, y0) + f_x(x0, y0)(x - x0) + f_y(x0, y0)(y - y0)
     */
    static buildTangentPlaneSamples(
        point: { x: number; y: number; z: number },
        gradient: number[],
        nx = 16,
        ny = 16,
        range = 3,
    ): Array<{ x: number; y: number; z: number }> {
        const gx = gradient[0] ?? 0;
        const gy = gradient[1] ?? 0;
        const xMin = point.x - range;
        const xMax = point.x + range;
        const yMin = point.y - range;
        const yMax = point.y + range;
        const dx = (xMax - xMin) / Math.max(1, nx - 1);
        const dy = (yMax - yMin) / Math.max(1, ny - 1);
        const samples: Array<{ x: number; y: number; z: number }> = [];

        for (let ix = 0; ix < nx; ix++) {
            const x = xMin + ix * dx;
            for (let iy = 0; iy < ny; iy++) {
                const y = yMin + iy * dy;
                const z = point.z + gx * (x - point.x) + gy * (y - point.y);
                if (Number.isFinite(z)) {
                    samples.push({ x, y, z });
                }
            }
        }

        return samples;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ORDINARY DERIVATIVE  (f: R → R)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Ordinary nth-order derivative of a single-variable function.
     * Uses central difference for 1st order, iterated stencil for higher.
     */
    static approximateDerivative(
        expression: string,
        variable: string,
        point: number,
        order = 1,
        h = 1e-5,
    ): DerivativeSummary {
        if (order < 1 || !Number.isInteger(order)) {
            throw new Error("Hosila tartib (order) musbat natural son bo'lishi kerak.");
        }

        const { executor } = createCompiledExpression(expression);

        // nth-order central difference via recursive helper
        const nthDiff = (n: number, x: number): number => {
            if (n === 0) {
                return safeEval(executor, { [variable]: x }) ?? 0;
            }
            if (n === 1) {
                return centralDiff1(executor, { [variable]: x }, variable, h);
            }
            // Higher order: (D^n f)(x) ≈ (D^(n-1) f(x+h) - D^(n-1) f(x-h)) / 2h
            return (nthDiff(n - 1, x + h) - nthDiff(n - 1, x - h)) / (2 * h);
        };

        const slopeValue = nthDiff(order, point);
        const valueAtPoint = safeEval(executor, { [variable]: point }) ?? 0;
        const intercept = order === 1 ? valueAtPoint - slopeValue * point : 0;

        const tangentLatex =
            order === 1
                ? `y = ${slopeValue.toFixed(6)}x + ${intercept.toFixed(6)}`
                : `f^{(${order})}(${point}) = ${slopeValue.toFixed(6)}`;

        const samples = this.buildTraceSamples(expression, variable, point);
        const tangentSamples =
            order === 1 ? this.buildTangentLineSamples(slopeValue, intercept, point) : [];

        return {
            type: "derivative",
            order,
            valueAtPoint,
            derivativeAtPoint: slopeValue,
            samples,
            tangentSamples,
            tangentLine: {
                slope: slopeValue,
                intercept,
                latex: tangentLatex,
            },
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. HIGHER-ORDER DERIVATIVE
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Returns evaluations of f, f', f'', ..., f^(maxOrder) at a point.
     * Useful for Taylor series preview and compare panel.
     */
    static approximateHigherOrderSeries(
        expression: string,
        variable: string,
        point: number,
        maxOrder = 4,
        h = 1e-5,
    ): HigherOrderDerivativeSummary {
        const { executor } = createCompiledExpression(expression);

        const nthDiff = (n: number, x: number): number => {
            if (n === 0) return safeEval(executor, { [variable]: x }) ?? 0;
            if (n === 1) return centralDiff1(executor, { [variable]: x }, variable, h);
            return (nthDiff(n - 1, x + h) - nthDiff(n - 1, x - h)) / (2 * h);
        };

        const derivatives: number[] = [];
        const factorials: number[] = [1];
        for (let k = 0; k <= maxOrder; k++) {
            derivatives.push(nthDiff(k, point));
            if (k > 0) factorials.push(factorials[k - 1] * k);
        }

        // Taylor polynomial samples: T_n(x) = Σ f^(k)(a)/k! * (x-a)^k
        const taylorRange = 3;
        const taylorCount = 120;
        const taylorSamples: PlotPoint[] = [];
        const lower = point - taylorRange;
        const upper = point + taylorRange;
        const step = (upper - lower) / (taylorCount - 1);

        for (let i = 0; i < taylorCount; i++) {
            const x = lower + i * step;
            let y = 0;
            const dx = x - point;
            for (let k = 0; k <= maxOrder; k++) {
                y += (derivatives[k] / factorials[k]) * Math.pow(dx, k);
            }
            if (Number.isFinite(y)) {
                taylorSamples.push({ x, y });
            }
        }

        const functionSamples = this.buildTraceSamples(expression, variable, point);

        return {
            type: "higher_order",
            valueAtPoint: derivatives[0],
            derivatives,
            maxOrder,
            taylorSamples,
            functionSamples,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. PARTIAL DERIVATIVE  (scalar field at a specific variable)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Single partial derivative ∂f/∂(variable) at a multi-variable point.
     */
    static approximatePartialDerivative(
        expression: string,
        vars: string[],
        pts: number[],
        wrtVariable: string,
        h = 1e-5,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): PartialDerivativeSummary {
        if (!vars.includes(wrtVariable)) {
            throw new Error(`O'zgaruvchi "${wrtVariable}" vars ro'yxatida yo'q.`);
        }
        const { executor } = createCompiledExpression(expression);
        const scope = buildCoordScope(vars, pts, coords);
        const valueAtPoint = safeEval(executor, scope) ?? 0;
        const partial = centralDiff1(executor, scope, wrtVariable, h);

        return {
            type: "partial",
            valueAtPoint,
            wrtVariable,
            partialAtPoint: partial,
            variable: wrtVariable,
            samples: this.buildTraceSamples(expression, wrtVariable, scope[wrtVariable] ?? 0),
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. GRADIENT  (scalar field f: Rⁿ → R)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Full gradient ∇f at a point: vector of all partial derivatives.
     */
    static approximateGradient(
        expression: string,
        vars: string[],
        pts: number[],
        h = 1e-5,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): GradientSummary {
        if (vars.length === 0) {
            throw new Error("Gradient uchun kamida bitta o'zgaruvchi kerak.");
        }
        if (pts.some(Number.isNaN)) {
            throw new Error("Nuqta qiymatlari son bo'lishi kerak.");
        }

        const { executor } = createCompiledExpression(expression);
        const scope = buildCoordScope(vars, pts, coords);
        const valueAtPoint = safeEval(executor, scope) ?? 0;

        const gradient: number[] = vars.map((v) =>
            centralDiff1(executor, scope, v, h)
        );

        const magnitude = norm(gradient);

        // For 1-variable case: build trace; otherwise build 2D heatmap slice.
        const samples: PlotPoint[] =
            vars.length === 1
                ? this.buildTraceSamples(expression, vars[0], pts[0] ?? 0)
                : this.buildTraceSamples(
                    expression.replace(vars[1], String(pts[1] ?? 0)),
                    vars[0],
                    pts[0] ?? 0,
                );

        // Gradient direction arrow samples in 2D (first two components)
        const arrowSamples: PlotPoint[] =
            vars.length >= 2 && magnitude > 0
                ? (() => {
                    const x0 = pts[0] ?? 0;
                    const y0 = pts[1] ?? 0;
                    const scale = 0.5;
                    return [
                        { x: x0, y: y0 },
                        {
                            x: x0 + (gradient[0] / magnitude) * scale,
                            y: y0 + (gradient[1] / magnitude) * scale,
                        },
                    ];
                })()
                : [];

        const latexParts = vars
            .map((v, i) => `\\frac{\\partial f}{\\partial ${v}} = ${gradient[i]?.toFixed(6)}`)
            .join(",\\; ");

        return {
            type: "gradient",
            valueAtPoint,
            gradient,
            magnitude,
            samples,
            arrowSamples,
            latex: `\\nabla f = \\begin{bmatrix} ${gradient.map((g) => g.toFixed(6)).join(" \\\\ ")} \\end{bmatrix}`,
            latexComponents: latexParts,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. DIRECTIONAL DERIVATIVE
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Directional derivative D_u f at a point in direction u.
     * D_u f = ∇f · û  (û is the unit vector of u).
     */
    static approximateDirectionalDerivative(
        expression: string,
        vars: string[],
        pts: number[],
        directionVector: number[],
        h = 1e-5,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): DirectionalDerivativeSummary {
        if (directionVector.length !== vars.length) {
            throw new Error(
                "Yo'nalish vektori uzunligi o'zgaruvchilar soni bilan mos bo'lishi kerak."
            );
        }

        const gradientResult = this.approximateGradient(expression, vars, pts, h, coords);
        const { gradient } = gradientResult;

        const dirNorm = norm(directionVector);
        if (dirNorm < 1e-12) {
            throw new Error("Yo'nalish vektori nol bo'lmasligi kerak.");
        }
        const unitDir = directionVector.map((d) => d / dirNorm);
        const directionalValue = gradient.reduce((sum, g, i) => sum + g * (unitDir[i] ?? 0), 0);

        return {
            type: "directional",
            valueAtPoint: gradientResult.valueAtPoint,
            gradient,
            unitDirection: unitDir,
            directionalDerivative: directionalValue,
            magnitude: gradientResult.magnitude,
            samples: gradientResult.samples,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. JACOBIAN MATRIX  (vector field F: Rⁿ → Rᵐ)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Full Jacobian matrix J[i][j] = ∂F_i / ∂x_j.
     * Accepts expression as "[f1, f2, ...]" or array of expressions.
     */
    static approximateJacobian(
        expression: string,
        vars: string[],
        pts: number[],
        h = 1e-5,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): JacobianSummary {
        if (vars.length === 0) throw new Error("Jacobian uchun o'zgaruvchilar kerak.");

        // Parse expression list
        const cleaned = expression.trim().replace(/^\[/, "").replace(/\]$/, "");
        const funcStrings = cleaned.split(",").map((s) => s.trim()).filter(Boolean);

        if (funcStrings.length === 0) {
            throw new Error("Jacobian uchun kamida bitta funksiya kiritilishi kerak.");
        }

        const executors = funcStrings.map((f) => createCompiledExpression(f).executor);
        const scope = buildCoordScope(vars, pts, coords);

        // Build matrix row by row
        const matrix: number[][] = executors.map((exec) => {
            return vars.map((v) => centralDiff1(exec, scope, v, h));
        });

        // F(point) evaluation
        const valueAtPoint: number[] = executors.map(
            (exec) => safeEval(exec, scope) ?? 0
        );

        const det = computeDeterminant(matrix);

        const rows = matrix.length;
        const cols = matrix[0]?.length ?? 0;
        const trace = matrix.length === cols
            ? matrix.reduce((s, row, i) => s + (row[i] ?? 0), 0)
            : null;

        const latexRows = matrix
            .map((row) => row.map((v) => v.toFixed(4)).join(" & "))
            .join(" \\\\ ");

        return {
            type: "jacobian",
            matrix,
            determinant: det,
            trace,
            size: { rows, cols },
            valueAtPoint,
            funcCount: funcStrings.length,
            latex: `J = \\begin{bmatrix} ${latexRows} \\end{bmatrix}`,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. HESSIAN MATRIX  (scalar field f: Rⁿ → R, second partials)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Full Hessian H[i][j] = ∂²f/∂x_i∂x_j.
     * Diagonal uses 3-point stencil; off-diagonal uses 4-point stencil.
     */
    static approximateHessian(
        expression: string,
        vars: string[],
        pts: number[],
        h = 1e-5,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): HessianSummary {
        if (vars.length === 0) throw new Error("Hessian uchun o'zgaruvchilar kerak.");

        const { executor } = createCompiledExpression(expression);
        const scope = buildCoordScope(vars, pts, coords);
        const fMid = safeEval(executor, scope) ?? 0;

        const matrix: number[][] = [];
        for (let i = 0; i < vars.length; i++) {
            const row: number[] = [];
            for (let j = 0; j < vars.length; j++) {
                if (i === j) {
                    row.push(centralDiff2Diag(executor, scope, vars[i], h, fMid));
                } else {
                    row.push(centralDiff2Mixed(executor, scope, vars[i], vars[j], h));
                }
            }
            matrix.push(row);
        }

        const det = computeDeterminant(matrix);
        const trace = matrix.reduce((s, row, i) => s + (row[i] ?? 0), 0);
        const eigenvalueSignature = classifyHessianSignature(matrix, det, trace);

        const latexRows = matrix
            .map((row) => row.map((v) => v.toFixed(4)).join(" & "))
            .join(" \\\\ ");

        return {
            type: "hessian",
            matrix,
            determinant: typeof det === "number" ? det : 0,
            trace,
            size: vars.length,
            valueAtPoint: fMid,
            eigenvalueSignature,
            criticalPointType: inferCriticalPointType(eigenvalueSignature, det),
            latex: `H = \\begin{bmatrix} ${latexRows} \\end{bmatrix}`,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. SENSITIVITY SWEEP  (h-step stability analysis)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Evaluates the derivative (or gradient norm) at different step sizes h.
     * Reveals numerical stability and optimal h selection.
     * Returns array of { h, value, relError } entries.
     */
    static approximateStepSweep(
        expression: string,
        variable: string,
        point: number,
        referenceH = 1e-5,
    ): StepSweepEntry[] {
        const hValues = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8];
        const { executor } = createCompiledExpression(expression);
        const scope = { [variable]: point };

        const referenceValue = centralDiff1(executor, scope, variable, referenceH);
        const entries: StepSweepEntry[] = [];

        for (const hVal of hValues) {
            const value = centralDiff1(executor, scope, variable, hVal);
            const relError =
                Math.abs(referenceValue) > 1e-12
                    ? Math.abs(value - referenceValue) / Math.abs(referenceValue)
                    : Math.abs(value - referenceValue);

            entries.push({
                h: hVal,
                hLabel: hVal.toExponential(0),
                value,
                relError,
                stability:
                    relError < 1e-4
                        ? "Stable"
                        : relError < 1e-2
                        ? "Watch"
                        : "Rough",
            });
        }

        return entries;
    }

    /**
     * Gradient magnitude sweep over h values (multi-variable stability).
     */
    static approximateGradientStepSweep(
        expression: string,
        vars: string[],
        pts: number[],
        referenceH = 1e-5,
    ): StepSweepEntry[] {
        const hValues = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7];
        const { executor } = createCompiledExpression(expression);
        const scope = buildScope(vars, pts);

        const refGrad = vars.map((v) => centralDiff1(executor, scope, v, referenceH));
        const refMag = norm(refGrad);
        const entries: StepSweepEntry[] = [];

        for (const hVal of hValues) {
            const grad = vars.map((v) => centralDiff1(executor, scope, v, hVal));
            const mag = norm(grad);
            const relError =
                refMag > 1e-12
                    ? Math.abs(mag - refMag) / refMag
                    : Math.abs(mag - refMag);

            entries.push({
                h: hVal,
                hLabel: hVal.toExponential(0),
                value: mag,
                relError,
                stability: relError < 1e-4 ? "Stable" : relError < 1e-2 ? "Watch" : "Rough",
            });
        }

        return entries;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. ADVANCED DISPATCH  (backwards-compat entry for use-differential-studio)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Unified dispatcher: routes to the correct numerical method by mode.
     * Keeps the hook simple — hook calls this and gets a typed summary back.
     */
    static approximateAdvanced(
        mode: string,
        expression: string,
        variableStr: string,
        pointStr: string,
        h = 1e-5,
        order = 1,
        coords: DifferentialCoordinateSystem = "cartesian",
    ): GradientSummary | JacobianSummary | HessianSummary | PartialDerivativeSummary | HigherOrderDerivativeSummary | ODESummary | PDESummary | SDESummary {
        const vars = parseVariables(variableStr);
        const pts = parsePoint(pointStr);

        if (vars.length === 0) {
            throw new Error("O'zgaruvchi(lar) kiritilmadi.");
        }
        if (pts.some(Number.isNaN)) {
            throw new Error("Nuqta qiymati son bo'lishi kerak.");
        }

        if (mode === "partial") {
            return this.approximateGradient(expression, vars, pts, h, coords);
        }
        if (mode === "jacobian") {
            return this.approximateJacobian(expression, vars, pts, h, coords);
        }
        if (mode === "hessian") {
            return this.approximateHessian(expression, vars, pts, h, coords);
        }
        if (mode === "higher_order") {
            const v = vars[0] ?? "x";
            const p = pts[0] ?? 0;
            return this.approximateHigherOrderSeries(expression, v, p, order, h);
        }
        if (mode === "ode") {
            return this.buildODESummary(expression, variableStr, pointStr);
        }
        if (mode === "pde") {
            return this.buildPDESummary(expression, variableStr, pointStr);
        }
        if (mode === "sde") {
            return this.buildSDESummary(expression, pointStr);
        }

        throw new Error(`Unsupported differential mode: ${mode}`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 11. DIAGNOSTIC HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Estimate the relative truncation error of the central-difference formula
     * by comparing h with h/2. Returns relative error and stability label.
     */
    static estimateTruncationError(
        expression: string,
        variable: string,
        point: number,
        h = 1e-5,
    ): { value: number; relError: number; stability: string } {
        const { executor } = createCompiledExpression(expression);
        const scope = { [variable]: point };
        const v1 = centralDiff1(executor, scope, variable, h);
        const v2 = centralDiff1(executor, scope, variable, h / 2);
        const relError =
            Math.abs(v1) > 1e-12
                ? Math.abs(v2 - v1) / Math.abs(v1)
                : Math.abs(v2 - v1);

        return {
            value: v1,
            relError,
            stability: relError < 1e-6 ? "Stable" : relError < 1e-3 ? "Watch" : "Rough",
        };
    }

    static buildODEFieldAndTrajectory(
        expression: string,
        variable: string,
        point: string,
    ): {
        field: Array<{ x: number; y: number; slope: number }>;
        trajectory: PlotPoint[];
        x0: number;
        y0: number;
    } {
        const parsed = parseODEProblem(expression, variable, point);
        const field = this.buildSlopeField(parsed.rhs, parsed.x0 - 4, parsed.x0 + 6, parsed.y0 - 4, parsed.y0 + 4, 16);
        const trajectory = integrateODE(parsed.rhs, parsed.variable, parsed.x0, parsed.y0, parsed.x0 + 6, 160);
        return { field, trajectory, x0: parsed.x0, y0: parsed.y0 };
    }

    static buildODESummary(expression: string, variable: string, point: string): ODESummary {
        const parsed = parseODEProblem(expression, variable, point);
        const field = this.buildSlopeField(parsed.rhs, parsed.x0 - 4, parsed.x0 + 6, parsed.y0 - 4, parsed.y0 + 4, 16);
        const trajectory = integrateODE(parsed.rhs, parsed.variable, parsed.x0, parsed.y0, parsed.x0 + 6, 160);
        const phaseSamples = buildODEPhaseSamples(parsed.rhs);
        const equilibriumPoints = detectODEEquilibria(parsed.rhs);
        const stabilityLabel = classifyODEStability(parsed.rhs, equilibriumPoints);
        return {
            type: "ode",
            family: isAutonomousODE(parsed.rhs, parsed.variable) ? "autonomous" : "nonautonomous",
            valueAtPoint: trajectory[trajectory.length - 1]?.y ?? parsed.y0,
            samples: trajectory,
            field,
            phaseSamples,
            equilibriumPoints,
            stabilityLabel,
            x0: parsed.x0,
            y0: parsed.y0,
        };
    }

    static buildPDEHeatmap(
        expression: string,
        variable: string,
        point: string,
    ): Array<{ x: number; y: number; z: number }> {
        const parsed = parsePDEProblem(expression, variable, point);
        if (parsed.family === "transport") {
            const samples: Array<{ x: number; y: number; z: number }> = [];
            const nx = 36;
            const nt = 24;
            const xMin = -Math.PI;
            const xMax = Math.PI;
            const tMin = 0;
            const tMax = 2.5;
            for (let ix = 0; ix < nx; ix++) {
                const x = xMin + ((xMax - xMin) * ix) / (nx - 1);
                for (let it = 0; it < nt; it++) {
                    const t = tMin + ((tMax - tMin) * it) / (nt - 1);
                    const z = parsed.initial.evaluate({ x: x + parsed.speed * t });
                    const value = Number(z);
                    if (Number.isFinite(value)) {
                        samples.push({ x, y: t, z: value });
                    }
                }
            }
            return samples;
        }

        const nx = 48;
        const nt = 40;
        const xMin = -Math.PI;
        const xMax = Math.PI;
        const tMax = 1.2;
        const dx = (xMax - xMin) / (nx - 1);
        const dt = Math.min(0.4 * dx * dx / Math.max(parsed.diffusivity, 1e-6), tMax / (nt - 1));
        let current = Array.from({ length: nx }, (_, i) => {
            const x = xMin + i * dx;
            return Number(parsed.initial.evaluate({ x }));
        });
        const samples: Array<{ x: number; y: number; z: number }> = [];

        for (let step = 0; step < nt; step++) {
            const t = Math.min(step * dt, tMax);
            for (let i = 0; i < nx; i++) {
                const x = xMin + i * dx;
                const value = current[i] ?? 0;
                if (Number.isFinite(value)) {
                    samples.push({ x, y: t, z: value });
                }
            }

            const next = [...current];
            for (let i = 1; i < nx - 1; i++) {
                next[i] = current[i] + (parsed.diffusivity * dt / (dx * dx)) * (current[i + 1] - 2 * current[i] + current[i - 1]);
            }
            next[0] = 0;
            next[nx - 1] = 0;
            current = next;
        }

        return samples;
    }

    static buildPDESummary(expression: string, variable: string, point: string): PDESummary {
        const parsed = parsePDEProblem(expression, variable, point);
        const heatmapSamples = this.buildPDEHeatmap(expression, variable, point);
        const finalTime = Math.max(...heatmapSamples.map((sample) => sample.y));
        const finalProfile = heatmapSamples
            .filter((sample) => Math.abs(sample.y - finalTime) < 1e-9)
            .sort((left, right) => left.x - right.x)
            .map((sample) => ({ x: sample.x, y: sample.z }));
        const midSample = heatmapSamples[Math.floor(heatmapSamples.length / 2)];
        const stabilityRatio =
            parsed.family === "heat"
                ? computePDEStabilityRatio(parsed.diffusivity)
                : Math.abs(parsed.speed);
        return {
            type: "pde",
            family: parsed.family,
            valueAtPoint: midSample?.z ?? 0,
            samples: finalProfile,
            heatmapSamples,
            finalProfile,
            stabilityRatio,
            grid: {
                nx: parsed.family === "heat" ? 48 : 36,
                nt: parsed.family === "heat" ? 40 : 24,
            },
        };
    }

    static buildSDEPath(expression: string, point: string): PlotPoint[] {
        const parsed = parseSDEProblem(expression, point);
        return buildSDEPathFromParsed(parsed, 42);
    }

    static buildSDESummary(expression: string, point: string, pathCount = 32): SDESummary {
        const parsed = parseSDEProblem(expression, point);
        const ensemblePaths = Array.from({ length: pathCount }, (_, index) => buildSDEPathFromParsed(parsed, 42 + index));
        const meanPath: PlotPoint[] = [];
        const lowerBand: PlotPoint[] = [];
        const upperBand: PlotPoint[] = [];

        for (let step = 0; step < ensemblePaths[0].length; step++) {
            const t = ensemblePaths[0][step]?.x ?? 0;
            const values = ensemblePaths
                .map((path) => path[step]?.y)
                .filter((value): value is number => Number.isFinite(value));
            const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
            const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1);
            const std = Math.sqrt(variance);
            meanPath.push({ x: t, y: mean });
            lowerBand.push({ x: t, y: mean - std });
            upperBand.push({ x: t, y: mean + std });
        }

        const terminalValues = ensemblePaths
            .map((path) => path[path.length - 1]?.y)
            .filter((value): value is number => Number.isFinite(value));
        const terminalMean = terminalValues.reduce((sum, value) => sum + value, 0) / Math.max(terminalValues.length, 1);
        const terminalVariance = terminalValues.reduce((sum, value) => sum + (value - terminalMean) ** 2, 0) / Math.max(terminalValues.length, 1);
        const terminalStd = Math.sqrt(terminalVariance);

        return {
            type: "sde",
            valueAtPoint: terminalMean,
            samples: meanPath,
            ensemblePaths,
            meanPath,
            lowerBand,
            upperBand,
            terminalHistogram: buildTerminalHistogram(terminalValues),
            terminalMean,
            terminalStd,
            pathCount,
        };
    }
}

// ─── Internal helpers for Hessian analysis ────────────────────────────────────

function classifyHessianSignature(
    matrix: number[][],
    det: number | null,
    trace: number,
): "positive_definite" | "negative_definite" | "indefinite" | "semidefinite" | "unknown" {
    const n = matrix.length;
    if (n === 0) return "unknown";

    if (n === 1) {
        const h11 = matrix[0][0] ?? 0;
        if (h11 > 0) return "positive_definite";
        if (h11 < 0) return "negative_definite";
        return "semidefinite";
    }

    if (n === 2 && det !== null) {
        const h11 = matrix[0][0] ?? 0;
        if (det > 0 && h11 > 0) return "positive_definite";
        if (det > 0 && h11 < 0) return "negative_definite";
        if (det < 0) return "indefinite";
        return "semidefinite";
    }

    // For n >= 3: use trace and principal submatrix heuristic
    const diagSigns = matrix.map((row, i) => Math.sign(row[i] ?? 0));
    const allPos = diagSigns.every((s) => s > 0);
    const allNeg = diagSigns.every((s) => s < 0);
    if (allPos && trace > 0) return "positive_definite";
    if (allNeg && trace < 0) return "negative_definite";
    if (diagSigns.some((s) => s > 0) && diagSigns.some((s) => s < 0)) return "indefinite";
    return "unknown";
}

function inferCriticalPointType(
    signature: string,
    det: number | null,
): string {
    if (signature === "positive_definite") return "Local minimum";
    if (signature === "negative_definite") return "Local maximum";
    if (signature === "indefinite") return "Saddle point";
    if (signature === "semidefinite") return "Degenerate (second-order test inconclusive)";
    if (det !== null && Math.abs(det) < 1e-10) return "Degenerate critical point";
    return "Classification pending";
}

function parseODEProblem(expression: string, variable: string, point: string) {
    const equation = expression.split(";")[0]?.trim() || expression.trim();
    const independent = variable.split(",")[0]?.trim() || "x";
    const rhs = equation.includes("=") ? equation.split("=", 2)[1].trim() : "0";
    const icSource = `${expression};${point}`;
    const x0Match = icSource.match(/y\( *([^)\s]+) *\)\s*=\s*([^;]+)/i);
    const x0 = x0Match ? Number(x0Match[1]) : 0;
    const y0 = x0Match ? Number(x0Match[2]) : 1;
    return { rhs, variable: independent, x0: Number.isFinite(x0) ? x0 : 0, y0: Number.isFinite(y0) ? y0 : 1 };
}

function integrateODE(rhsExpression: string, variable: string, x0: number, y0: number, xEnd: number, steps: number): PlotPoint[] {
    const { executor } = createCompiledExpression(rhsExpression);
    const h = (xEnd - x0) / Math.max(steps, 1);
    const points: PlotPoint[] = [{ x: x0, y: y0 }];
    let x = x0;
    let y = y0;

    for (let i = 0; i < steps; i++) {
        const k1 = safeEval(executor, { [variable]: x, y }) ?? 0;
        const k2 = safeEval(executor, { [variable]: x + h / 2, y: y + (h * k1) / 2 }) ?? k1;
        const k3 = safeEval(executor, { [variable]: x + h / 2, y: y + (h * k2) / 2 }) ?? k2;
        const k4 = safeEval(executor, { [variable]: x + h, y: y + h * k3 }) ?? k3;
        y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        x = x + h;
        if (Number.isFinite(x) && Number.isFinite(y)) {
            points.push({ x, y });
        }
    }

    return points;
}

function isAutonomousODE(rhsExpression: string, variable: string): boolean {
    return !new RegExp(`\\b${variable}\\b`).test(rhsExpression);
}

function buildODEPhaseSamples(rhsExpression: string): PlotPoint[] {
    const { executor } = createCompiledExpression(rhsExpression);
    const samples: PlotPoint[] = [];
    for (let y = -4; y <= 4.0001; y += 0.25) {
        const slope = safeEval(executor, { x: 0, y }) ?? safeEval(executor, { y }) ?? 0;
        if (Number.isFinite(slope)) {
            samples.push({ x: y, y: slope });
        }
    }
    return samples;
}

function detectODEEquilibria(rhsExpression: string): number[] {
    const { executor } = createCompiledExpression(rhsExpression);
    const points: number[] = [];
    let prevY = -6;
    let prevValue = safeEval(executor, { x: 0, y: prevY }) ?? safeEval(executor, { y: prevY }) ?? 0;
    for (let y = -5.75; y <= 6.0001; y += 0.25) {
        const currentValue = safeEval(executor, { x: 0, y }) ?? safeEval(executor, { y }) ?? 0;
        if (Math.abs(currentValue) < 1e-3 || prevValue === 0 || prevValue * currentValue < 0) {
            const candidate = Number(y.toFixed(2));
            if (!points.some((item) => Math.abs(item - candidate) < 0.2)) {
                points.push(candidate);
            }
        }
        prevY = y;
        prevValue = currentValue;
    }
    return points;
}

function classifyODEStability(rhsExpression: string, equilibria: number[]): "stable" | "unstable" | "mixed" | "undetermined" {
    if (!equilibria.length) return "undetermined";
    const { executor } = createCompiledExpression(rhsExpression);
    const labels = equilibria.map((yEq) => {
        const epsilon = 1e-3;
        const plus = safeEval(executor, { x: 0, y: yEq + epsilon }) ?? 0;
        const minus = safeEval(executor, { x: 0, y: yEq - epsilon }) ?? 0;
        if (minus > 0 && plus < 0) return "stable";
        if (minus < 0 && plus > 0) return "unstable";
        return "undetermined";
    });
    const stable = labels.includes("stable");
    const unstable = labels.includes("unstable");
    if (stable && unstable) return "mixed";
    if (stable) return "stable";
    if (unstable) return "unstable";
    return "undetermined";
}

function parsePDEProblem(expression: string, variable: string, point: string) {
    const text = `${expression};${point}`;
    const varNames = variable.split(",").map((item) => item.trim()).filter(Boolean);
    const compact = expression.replace(/\s+/g, "");
    const initialText = text.match(/u\(x,0\)\s*=\s*([^;]+)/i)?.[1]?.trim() ?? "sin(x)";
    const initial = createCompiledExpression(initialText).executor;

    if (/u_t=.*u_x(?!x)/i.test(compact) || /u_t=u_x/i.test(compact)) {
        const speedMatch = compact.match(/u_t=([\-0-9.+a-z*\/()]*)u_x(?!x)/i);
        const rawSpeed = speedMatch?.[1] && speedMatch[1] !== "" ? speedMatch[1].replace(/\*$/, "") : "1";
        const speed = Number(createCompiledExpression(rawSpeed).executor.evaluate({})) || 1;
        return { family: "transport" as const, variables: varNames, initial, speed };
    }

    const heatMatch = compact.match(/u_t=([\-0-9.+a-z*\/()]*)u_xx/i);
    const rawDiffusivity = heatMatch?.[1] && heatMatch[1] !== "" ? heatMatch[1].replace(/\*$/, "") : "1";
    const diffusivity = Number(createCompiledExpression(rawDiffusivity).executor.evaluate({})) || 1;
    return { family: "heat" as const, variables: varNames, initial, diffusivity };
}

function computePDEStabilityRatio(diffusivity: number) {
    const nx = 48;
    const xMin = -Math.PI;
    const xMax = Math.PI;
    const tMax = 1.2;
    const nt = 40;
    const dx = (xMax - xMin) / (nx - 1);
    const dt = Math.min(0.4 * dx * dx / Math.max(diffusivity, 1e-6), tMax / (nt - 1));
    return (diffusivity * dt) / (dx * dx);
}

function parseSDEProblem(expression: string, point: string) {
    const source = `${expression};${point}`;
    const bodyMatch = expression.match(/dX\s*=\s*(.+?)\*dt\s*\+\s*(.+?)\*dW/i);
    if (!bodyMatch) {
        throw new Error("SDE syntax expected: dX = mu*dt + sigma*dW");
    }
    const x0 = Number(source.match(/X\(0\)\s*=\s*([^;]+)/i)?.[1] ?? "1");
    const rangeText = source.match(/t:\s*\[([^\]]+)\]/i)?.[1] ?? "0,1";
    const [t0Text, t1Text] = rangeText.split(",").map((item) => item.trim());
    const t0 = Number(t0Text);
    const t1 = Number(t1Text);
    const n = Math.max(20, Math.min(2000, Number(source.match(/n\s*=\s*([0-9]+)/i)?.[1] ?? "200")));
    const dt = (t1 - t0) / n;
    return {
        mu: createCompiledExpression(bodyMatch[1].trim()).executor,
        sigma: createCompiledExpression(bodyMatch[2].trim()).executor,
        x0: Number.isFinite(x0) ? x0 : 1,
        t0: Number.isFinite(t0) ? t0 : 0,
        t1: Number.isFinite(t1) ? t1 : 1,
        n,
        dt: Number.isFinite(dt) && dt > 0 ? dt : 1 / n,
    };
}

function buildSDEPathFromParsed(
    parsed: ReturnType<typeof parseSDEProblem>,
    seed: number,
): PlotPoint[] {
    const samples: PlotPoint[] = [];
    let x = parsed.x0;
    let t = parsed.t0;
    const rng = seededRandom(seed);
    samples.push({ x: t, y: x });

    for (let i = 0; i < parsed.n; i++) {
        const mu = Number(parsed.mu.evaluate({ t, X: x }));
        const sigma = Number(parsed.sigma.evaluate({ t, X: x }));
        if (!Number.isFinite(mu) || !Number.isFinite(sigma)) break;
        const dw = Math.sqrt(parsed.dt) * normalSample(rng);
        x = x + mu * parsed.dt + sigma * dw;
        t = t + parsed.dt;
        if (Number.isFinite(x) && Number.isFinite(t)) {
            samples.push({ x: t, y: x });
        }
    }

    return samples;
}

function buildTerminalHistogram(values: number[], bins = 14): PlotPoint[] {
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const width = Math.max((max - min) / bins, 1e-6);
    const counts = Array.from({ length: bins }, () => 0);
    values.forEach((value) => {
        const rawIndex = Math.floor((value - min) / width);
        const index = Math.max(0, Math.min(bins - 1, rawIndex));
        counts[index] += 1;
    });
    return counts.map((count, index) => ({
        x: min + width * (index + 0.5),
        y: count,
    }));
}

function seededRandom(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function normalSample(rand: () => number) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
