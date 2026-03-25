import { fetchPublic } from "@/lib/api";
import type { ProbabilityAnalyticSolveResponse, ProbabilityMode } from "../types";

const PROBABILITY_SOLVE_TIMEOUT_MS = 15000;

export class ProbabilitySolveService {
    static async requestSolve(request: {
        mode: ProbabilityMode;
        dataset: string;
        parameters: string;
        dimension: string;
    }): Promise<ProbabilityAnalyticSolveResponse> {
        if (!request.dataset.trim()) {
            throw new Error("Probability dataset kiritilishi kutilmoqda.");
        }

        const response = await fetchPublic("/api/laboratory/solve/probability/", {
            method: "POST",
            body: JSON.stringify(request),
            timeoutMs: PROBABILITY_SOLVE_TIMEOUT_MS,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Probability solve xatosi yuz berdi.");
        }

        return response.json();
    }
}
