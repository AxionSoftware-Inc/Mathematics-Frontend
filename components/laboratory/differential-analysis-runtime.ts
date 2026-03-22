import {
    buildDirectionField,
    buildPlanarNullclineField,
    buildPlanarVectorField,
    buildSingleDifferentialAudit,
    buildSystemTrajectoryAudit,
} from "@/components/laboratory/math-utils";
import type {
    DifferentialAnalysisPayload,
    DifferentialAnalysisResult,
} from "@/components/laboratory/differential-analysis-worker-types";

export function runDifferentialAnalysis(payload: DifferentialAnalysisPayload): DifferentialAnalysisResult {
    const {
        solverMode,
        derivative,
        sysExpr1,
        sysExpr2,
        sysExpr3,
        x0,
        y0,
        step,
        steps,
        differentialPoints,
        systemPoints,
        comparisonSystemTrajectories,
    } = payload;

    if (solverMode === "single" && differentialPoints.length) {
        const singleAudit = buildSingleDifferentialAudit(
            derivative,
            differentialPoints,
            x0,
            y0,
            step,
            steps,
        );
        const xValues = differentialPoints.map((point) => point.x);
        const yValues = differentialPoints.flatMap((point) => [point.euler, point.heun]);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const yPadding = Math.max((yMax - yMin) * 0.18, 0.8);
        const xDomain: [number, number] = [Math.min(...xValues), Math.max(...xValues)];
        const yDomain: [number, number] = [yMin - yPadding, yMax + yPadding];

        return {
            singleAudit,
            systemAudit: null,
            singleDirectionField: {
                xDomain,
                yDomain,
                segments: buildDirectionField(
                    derivative,
                    xDomain[0],
                    xDomain[1],
                    yDomain[0],
                    yDomain[1],
                    18,
                    12,
                ),
            },
            planarSystemField: null,
        };
    }

    if (solverMode === "system" && systemPoints.length) {
        const systemAudit = buildSystemTrajectoryAudit(systemPoints, Boolean(sysExpr3.trim()));

        if (!sysExpr3.trim()) {
            const allPoints = [
                ...systemPoints,
                ...comparisonSystemTrajectories.flat(),
            ];
            const xs = allPoints.map((point) => point.vars.x || 0);
            const ys = allPoints.map((point) => point.vars.y || 0);
            const xPadding = Math.max((Math.max(...xs) - Math.min(...xs)) * 0.18, 0.9);
            const yPadding = Math.max((Math.max(...ys) - Math.min(...ys)) * 0.18, 0.9);
            const xDomain: [number, number] = [Math.min(...xs) - xPadding, Math.max(...xs) + xPadding];
            const yDomain: [number, number] = [Math.min(...ys) - yPadding, Math.max(...ys) + yPadding];

            return {
                singleAudit: null,
                systemAudit,
                singleDirectionField: null,
                planarSystemField: {
                    xDomain,
                    yDomain,
                    segments: buildPlanarVectorField(
                        sysExpr1,
                        sysExpr2,
                        xDomain[0],
                        xDomain[1],
                        yDomain[0],
                        yDomain[1],
                        18,
                        12,
                    ),
                    nullclines: buildPlanarNullclineField(
                        sysExpr1,
                        sysExpr2,
                        xDomain[0],
                        xDomain[1],
                        yDomain[0],
                        yDomain[1],
                        42,
                        42,
                    ),
                },
            };
        }

        return {
            singleAudit: null,
            systemAudit,
            singleDirectionField: null,
            planarSystemField: null,
        };
    }

    return {
        singleAudit: null,
        systemAudit: null,
        singleDirectionField: null,
        planarSystemField: null,
    };
}
