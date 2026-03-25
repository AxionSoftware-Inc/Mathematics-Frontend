import { fetchPublic } from "@/lib/api";
import type { SeriesLimitAnalyticSolveResponse, SeriesLimitMode } from "../types";

const SERIES_LIMIT_SOLVE_TIMEOUT_MS = 15000;

export class SeriesLimitSolveService {
    static async requestSolve(request: {
        mode: SeriesLimitMode;
        expression: string;
        auxiliary: string;
        dimension: string;
    }): Promise<SeriesLimitAnalyticSolveResponse> {
        if (!request.expression.trim()) {
            throw new Error("Series / limit ifodasi kiritilishi kutilmoqda.");
        }

        const response = await fetchPublic("/api/laboratory/solve/series-limit/", {
            method: "POST",
            body: JSON.stringify(request),
            timeoutMs: SERIES_LIMIT_SOLVE_TIMEOUT_MS,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Series / limit solve xatosi yuz berdi.");
        }

        return response.json();
    }
}
