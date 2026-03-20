import { describe, expect, it } from "vitest";

import {
    approximateDoubleIntegral,
    buildBlochSphereGeometry,
    buildOptimizationLandscape,
    calculateMatrixTransformation,
    getLightConeGeometry,
    solveGradientDescent,
} from "./math-utils";

describe("3D laboratory helpers", () => {
    it("keeps a full sampling grid for double integrals", () => {
        const summary = approximateDoubleIntegral("x + y", -1, 1, -2, 2, 4, 3);

        expect(summary.samples).toHaveLength(12);
        expect(summary.samples.every((sample) => Number.isFinite(sample.z))).toBe(true);
    });

    it("builds matrix transformation geometry with edges and basis vectors", () => {
        const geometry = calculateMatrixTransformation([
            [1, 0, 0],
            [0, 2, 0],
            [0, 0, 0.5],
        ]);

        expect(geometry.original).toHaveLength(8);
        expect(geometry.transformed).toHaveLength(8);
        expect(geometry.edges).toHaveLength(12);
        expect(geometry.basisVectors).toHaveLength(3);
        expect(geometry.basisVectors[1]?.transformed[1]).toEqual({ x: 0, y: 2, z: 0 });
    });

    it("samples an optimization landscape around the gradient path", () => {
        const path = solveGradientDescent("x^2 + y^2", 2, 2, 0.1, 12);
        const landscape = buildOptimizationLandscape("x^2 + y^2", path, 12);

        expect(landscape.path.length).toBeGreaterThan(5);
        expect(landscape.surfaceSamples.length).toBe(144);
        expect(landscape.xRange[0]).toBeLessThan(0);
        expect(landscape.xRange[1]).toBeGreaterThan(0);
    });

    it("builds a Bloch sphere shell with poles and guide curves", () => {
        const geometry = buildBlochSphereGeometry(10, 20);

        expect(geometry.surface.x).toHaveLength(11);
        expect(geometry.surface.x[0]).toHaveLength(21);
        expect(geometry.meridians).toHaveLength(3);
        expect(geometry.poles).toEqual([
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 },
        ]);
    });

    it("builds future and past light-cone surfaces", () => {
        const geometry = getLightConeGeometry(6, 8, 16);

        expect(geometry.futureSurface.x).toHaveLength(9);
        expect(geometry.pastSurface.z[0]).toHaveLength(17);
        expect(geometry.nullRays.length).toBe(8);
        expect(geometry.axis[0]?.z).toBeLessThan(0);
        expect(geometry.axis[1]?.z).toBeGreaterThan(0);
    });
});
