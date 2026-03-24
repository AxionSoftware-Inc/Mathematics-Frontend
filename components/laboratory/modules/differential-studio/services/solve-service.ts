import { fetchPublic } from "@/lib/api";
import { DifferentialSolveSnapshot, DifferentialAnalyticSolveResponse } from "../types";

const ANALYTIC_SOLVE_TIMEOUT_MS = 15000;

export class DifferentialSolveService {
    /**
     * Request analytic solve from backend
     */
    static async requestAnalyticSolve(request: DifferentialSolveSnapshot): Promise<DifferentialAnalyticSolveResponse> {
        const { expression, mode, variable, point, order, direction, coordinates } = request;
        
        if (!expression.trim()) {
            throw new Error("Formula kiritilishi kutilmoqda.");
        }

        const body = {
            mode,
            expression,
            variable,
            point,
            order,
            direction,
            coordinates,
        };

        let response: Response;
        try {
            response = await fetchPublic("/api/laboratory/solve/differential/", {
                method: "POST",
                body: JSON.stringify(body),
                timeoutMs: ANALYTIC_SOLVE_TIMEOUT_MS,
            });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("Analitik solve vaqt limiti oshdi. Ifoda juda murakkab bo'lishi mumkin, numerik tekshiruv tavsiya etiladi.");
            }
            throw error;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Backend solve xatosi yuz berdi");
        }

        return response.json();
    }
}
