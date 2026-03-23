import { compile } from "mathjs";
import {
    IntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary,
    PlotPoint,
    IntegralCoordinateSystem,
} from "../types";

type CompiledExpression = {
    evaluate: (scope?: Record<string, number>) => unknown;
};

function normalizeExpression(expression: string) {
    return expression
        .replace(/\u2212/g, "-")
        .replace(/[\u00D7\u22C5\u00B7]/g, "*")
        .replace(/[\u00F7]/g, "/")
        .replace(/\u03C0/g, "pi")
        .replace(/\u03C1/g, "rho")
        .replace(/[\u03B8\u03D1]/g, "theta")
        .replace(/[\u03C6\u03D5]/g, "phi")
        .replace(/\bln\s*\(/gi, "log(")
        .trim();
}

function createCompiledExpression(expression: string) {
    const normalized = normalizeExpression(expression);
    if (!normalized) {
        throw new Error("Integral ifodasi bo'sh.");
    }

    try {
        return {
            normalized,
            executor: compile(normalized) as CompiledExpression,
        };
    } catch {
        throw new Error("Ifoda parse qilinmadi. `sin(x)`, `exp(-x^2)` yoki `x^2 + y^2` ko'rinishida yozing.");
    }
}

function toFiniteNumber(value: unknown) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function clampPositiveInteger(value: number, fallback: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
}

function ensureIncreasingBounds(lower: number, upper: number, label: string) {
    if (Number.isNaN(lower) || Number.isNaN(upper)) {
        throw new Error(`${label} son bo'lishi kerak.`);
    }
    if (upper <= lower) {
        throw new Error(`${label} uchun yuqori chegara quyi chegaradan katta bo'lishi kerak.`);
    }
}

function evaluateCompiledExpression(executor: CompiledExpression, scope: Record<string, number>) {
    try {
        return toFiniteNumber(executor.evaluate(scope));
    } catch {
        return null;
    }
}

function buildSingleScope(value: number, coords: IntegralCoordinateSystem): Record<string, number> {
    if (coords === "polar") {
        const scope: Record<string, number> = {
            r: value,
            theta: value,
            x: value * Math.cos(value),
            y: value * Math.sin(value),
        };
        return scope;
    }

    return { x: value };
}

function buildDoubleScope(u: number, v: number, coords: IntegralCoordinateSystem) {
    if (coords === "polar") {
        const x = u * Math.cos(v);
        const y = u * Math.sin(v);
        const scope: Record<string, number> = { r: u, theta: v, x, y };
        return {
            x,
            y,
            scope,
            jacobian: u,
        };
    }

    const scope: Record<string, number> = { x: u, y: v };
    return {
        x: u,
        y: v,
        scope,
        jacobian: 1,
    };
}

function buildTripleScope(u: number, v: number, w: number, coords: IntegralCoordinateSystem) {
    if (coords === "cylindrical") {
        const x = u * Math.cos(v);
        const y = u * Math.sin(v);
        const scope: Record<string, number> = { r: u, theta: v, z: w, x, y };
        return {
            x,
            y,
            z: w,
            scope,
            jacobian: u,
        };
    }

    if (coords === "spherical") {
        const x = u * Math.sin(w) * Math.cos(v);
        const y = u * Math.sin(w) * Math.sin(v);
        const z = u * Math.cos(w);
        const scope: Record<string, number> = { rho: u, r: u, theta: v, phi: w, x, y, z };
        return {
            x,
            y,
            z,
            scope,
            jacobian: u * u * Math.sin(w),
        };
    }

    const scope: Record<string, number> = { x: u, y: v, z: w };
    return {
        x: u,
        y: v,
        z: w,
        scope,
        jacobian: 1,
    };
}

function buildImproperTransform(lower: number, upper: number) {
    let start = lower;
    let end = upper;
    let transform = (value: number) => value;
    let derivative = (_value: number) => 1;

    if (!Number.isFinite(lower) && !Number.isFinite(upper)) {
        start = -Math.PI / 2 + 1e-4;
        end = Math.PI / 2 - 1e-4;
        transform = (value) => Math.tan(value);
        derivative = (value) => 1 / Math.cos(value) ** 2;
    } else if (!Number.isFinite(lower)) {
        start = -Math.PI / 2 + 1e-4;
        end = 0;
        transform = (value) => upper + Math.tan(value);
        derivative = (value) => 1 / Math.cos(value) ** 2;
    } else if (!Number.isFinite(upper)) {
        start = 0;
        end = Math.PI / 2 - 1e-4;
        transform = (value) => lower + Math.tan(value);
        derivative = (value) => 1 / Math.cos(value) ** 2;
    }

    return { start, end, transform, derivative };
}

function buildTraceBounds(lower: number, upper: number) {
    let safeLower = lower;
    let safeUpper = upper;

    if (!Number.isFinite(lower) && Number.isFinite(upper)) {
        safeLower = upper - 30;
    }
    if (Number.isFinite(lower) && !Number.isFinite(upper)) {
        safeUpper = lower + 30;
    }
    if (!Number.isFinite(lower) && !Number.isFinite(upper)) {
        safeLower = -20;
        safeUpper = 20;
    }

    return { lower: safeLower, upper: safeUpper };
}

export class LaboratoryMathService {
    static buildTraceSamples(
        expression: string,
        lower: number,
        upper: number,
        sampleCount = 120,
        coords: IntegralCoordinateSystem = "cartesian",
    ): PlotPoint[] {
        ensureIncreasingBounds(lower, upper, "Grafik diapazoni");
        const { executor } = createCompiledExpression(expression);
        const width = upper - lower;
        const safeCount = Math.max(sampleCount, 2);
        const samples: PlotPoint[] = [];

        for (let index = 0; index < safeCount; index += 1) {
            const ratio = index / (safeCount - 1);
            const x = lower + width * ratio;
            const y = evaluateCompiledExpression(executor, buildSingleScope(x, coords));
            if (y === null) {
                continue;
            }
            samples.push({ x, y });
        }

        if (!samples.length) {
            throw new Error("Grafik uchun yaroqli nuqtalar topilmadi. Ifodani yoki domainni tekshiring.");
        }

        return samples;
    }

    static approximateSingleIntegral(
        expression: string,
        lower: number,
        upper: number,
        segments: number,
        coords: IntegralCoordinateSystem = "cartesian",
    ): IntegralSummary {
        ensureIncreasingBounds(lower, upper, "Single integral chegaralari");
        const { executor } = createCompiledExpression(expression);
        const safeSegments = clampPositiveInteger(segments, 24, 4, 400);
        const simpsonSegments = safeSegments % 2 === 0 ? safeSegments : safeSegments + 1;
        const transform = buildImproperTransform(lower, upper);
        const step = (transform.end - transform.start) / safeSegments;
        const simpsonStep = (transform.end - transform.start) / simpsonSegments;
        let invalidSamples = 0;

        const integrand = (value: number) => {
            const transformed = transform.transform(value);
            const evaluated = evaluateCompiledExpression(executor, buildSingleScope(transformed, coords));
            if (evaluated === null) {
                invalidSamples += 1;
                return 0;
            }
            return evaluated * transform.derivative(value);
        };

        let midpoint = 0;
        let trapezoid = 0;
        let simpson = integrand(transform.start) + integrand(transform.end);

        for (let index = 0; index < safeSegments; index += 1) {
            const left = transform.start + index * step;
            const right = left + step;
            const mid = (left + right) / 2;
            midpoint += integrand(mid);
            trapezoid += integrand(left) + integrand(right);
        }

        for (let index = 1; index < simpsonSegments; index += 1) {
            const x = transform.start + index * simpsonStep;
            simpson += integrand(x) * (index % 2 === 0 ? 2 : 4);
        }

        const totalChecks = safeSegments * 4;
        if (invalidSamples >= totalChecks * 0.4) {
            throw new Error("Ifoda juda ko'p nuqtada aniqlanmadi. Domain yoki formula ko'rinishini o'zgartiring.");
        }

        const traceBounds = buildTraceBounds(lower, upper);

        return {
            midpoint: midpoint * step,
            trapezoid: (trapezoid * step) / 2,
            simpson: (simpson * simpsonStep) / 3,
            segmentsUsed: simpsonSegments,
            samples: this.buildTraceSamples(expression, traceBounds.lower, traceBounds.upper, 160, coords),
        };
    }

    static approximateDoubleIntegral(
        expression: string,
        xMin: number,
        xMax: number,
        yMin: number,
        yMax: number,
        nx: number,
        ny: number,
        coords: IntegralCoordinateSystem = "cartesian",
    ): DoubleIntegralSummary {
        ensureIncreasingBounds(xMin, xMax, "X domain");
        ensureIncreasingBounds(yMin, yMax, "Y domain");
        const gridX = clampPositiveInteger(nx, 28, 6, 72);
        const gridY = clampPositiveInteger(ny, 28, 6, 72);
        const dx = (xMax - xMin) / gridX;
        const dy = (yMax - yMin) / gridY;
        const { executor } = createCompiledExpression(expression);
        const samples: DoubleIntegralSummary["samples"] = [];
        let total = 0;

        for (let ix = 0; ix < gridX; ix += 1) {
            const u = xMin + (ix + 0.5) * dx;
            for (let iy = 0; iy < gridY; iy += 1) {
                const v = yMin + (iy + 0.5) * dy;
                const point = buildDoubleScope(u, v, coords);
                const z = evaluateCompiledExpression(executor, point.scope);
                if (z === null) {
                    continue;
                }

                total += z * point.jacobian * dx * dy;
                samples.push({ x: point.x, y: point.y, z });
            }
        }

        if (!samples.length) {
            throw new Error("2D integral uchun yaroqli sample topilmadi. Formula yoki domainni tekshiring.");
        }

        return { value: total, samples };
    }

    static approximateTripleIntegral(
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
        coords: IntegralCoordinateSystem = "cartesian",
    ): TripleIntegralSummary {
        ensureIncreasingBounds(xMin, xMax, "X domain");
        ensureIncreasingBounds(yMin, yMax, "Y domain");
        ensureIncreasingBounds(zMin, zMax, "Z domain");
        const gridX = clampPositiveInteger(nx, 8, 4, 72);
        const gridY = clampPositiveInteger(ny, 8, 4, 72);
        const gridZ = clampPositiveInteger(nz, 8, 4, 28);
        const dx = (xMax - xMin) / gridX;
        const dy = (yMax - yMin) / gridY;
        const dz = (zMax - zMin) / gridZ;
        const sampleStrideX = Math.max(1, Math.floor(gridX / 8));
        const sampleStrideY = Math.max(1, Math.floor(gridY / 8));
        const sampleStrideZ = Math.max(1, Math.floor(gridZ / 6));
        const { executor } = createCompiledExpression(expression);
        const samples: TripleIntegralSummary["samples"] = [];
        let total = 0;

        for (let ix = 0; ix < gridX; ix += 1) {
            const u = xMin + (ix + 0.5) * dx;
            for (let iy = 0; iy < gridY; iy += 1) {
                const v = yMin + (iy + 0.5) * dy;
                for (let iz = 0; iz < gridZ; iz += 1) {
                    const w = zMin + (iz + 0.5) * dz;
                    const point = buildTripleScope(u, v, w, coords);
                    const value = evaluateCompiledExpression(executor, point.scope);
                    if (value === null) {
                        continue;
                    }

                    total += value * point.jacobian * dx * dy * dz;

                    if (ix % sampleStrideX === 0 && iy % sampleStrideY === 0 && iz % sampleStrideZ === 0) {
                        samples.push({ x: point.x, y: point.y, z: point.z, value });
                    }
                }
            }
        }

        if (!samples.length) {
            throw new Error("3D integral uchun yaroqli voxel sample topilmadi. Formula yoki domainni tekshiring.");
        }

        return { value: total, samples };
    }
}
