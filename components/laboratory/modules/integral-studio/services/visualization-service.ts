import { DoubleIntegralSummary, TripleIntegralSummary } from "../types";

export class LaboratoryVisualizationService {
    /**
     * Map samples to 3D surface plot data
     */
    static buildSurfaceData(samples: DoubleIntegralSummary['samples']) {
        const xValues = Array.from(new Set(samples.map((s) => s.x))).sort((a, b) => a - b);
        const yValues = Array.from(new Set(samples.map((s) => s.y))).sort((a, b) => a - b);
        const zGrid: number[][] = [];

        yValues.forEach((y) => {
            const row: number[] = [];
            xValues.forEach((x) => {
                const sample = samples.find((s) => s.x === x && s.y === y);
                row.push(sample ? sample.z : 0);
            });
            zGrid.push(row);
        });

        return { x: xValues, y: yValues, z: zGrid };
    }

    /**
     * Map samples to 3D volume data for Isosurface or Volume rendering
     */
    static buildVolumeData(samples: TripleIntegralSummary['samples']) {
        return {
            x: samples.map((s) => s.x),
            y: samples.map((s) => s.y),
            z: samples.map((s) => s.z),
            value: samples.map((s) => s.value),
        };
    }
}
