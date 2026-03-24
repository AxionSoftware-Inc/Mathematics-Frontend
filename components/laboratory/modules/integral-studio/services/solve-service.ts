import { fetchPublic } from "@/lib/api";
import { IntegralSolveSnapshot, IntegralAnalyticSolveResponse } from "../types";

const ANALYTIC_SOLVE_TIMEOUT_MS = 15000;

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

        let response: Response;
        try {
            response = await fetchPublic("/api/laboratory/solve/integral/", {
                method: "POST",
                body: JSON.stringify(body),
                timeoutMs: ANALYTIC_SOLVE_TIMEOUT_MS,
            });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("Analitik solve vaqt limiti oshdi. Ifoda juda og'ir bo'lishi mumkin, numerik yoki soddalashtirilgan oqim tavsiya etiladi.");
            }
            throw error;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Backend solve error occurred");
        }

        return response.json();
    }
}
