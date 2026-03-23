import { fetchPublic } from "@/lib/api";
import { IntegralSolveSnapshot, IntegralAnalyticSolveResponse } from "../types";

export class LaboratorySolveService {
    /**
     * Request analytic solve from backend
     */
    static async requestAnalyticSolve(snapshot: IntegralSolveSnapshot): Promise<IntegralAnalyticSolveResponse> {
        const body = {
            mode: snapshot.mode,
            expression: snapshot.expression,
            lower: snapshot.lower,
            upper: snapshot.upper,
            x_min: snapshot.xMin,
            x_max: snapshot.xMax,
            y_min: snapshot.yMin,
            y_max: snapshot.yMax,
            z_min: snapshot.zMin,
            z_max: snapshot.zMax,
        };

        const response = await fetchPublic("/api/laboratory/solve/integral/", {
            method: "POST",
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Backend solve error occurred");
        }

        return response.json();
    }
}
