import { fetchPublic } from "@/lib/api";
import type { MatrixAnalyticSolveResponse, MatrixMode } from "../types";

const MATRIX_SOLVE_TIMEOUT_MS = 15000;

export class MatrixSolveService {
    static async requestSolve(request: {
        mode: MatrixMode;
        expression: string;
        rhs: string;
        dimension: string;
    }): Promise<MatrixAnalyticSolveResponse> {
        if (!request.expression.trim()) {
            throw new Error("Matrix input kiritilishi kutilmoqda.");
        }

        const response = await fetchPublic("/api/laboratory/solve/matrix/", {
            method: "POST",
            body: JSON.stringify(request),
            timeoutMs: MATRIX_SOLVE_TIMEOUT_MS,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Matrix solve xatosi yuz berdi.");
        }

        return response.json();
    }
}
