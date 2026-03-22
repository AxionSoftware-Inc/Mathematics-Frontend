import { runDifferentialAnalysis } from "@/components/laboratory/differential-analysis-runtime";
import type {
    DifferentialAnalysisWorkerRequest,
    DifferentialAnalysisWorkerResponse,
} from "@/components/laboratory/differential-analysis-worker-types";

const workerScope = self as {
    onmessage: ((event: MessageEvent<DifferentialAnalysisWorkerRequest>) => void) | null;
    postMessage: (message: DifferentialAnalysisWorkerResponse) => void;
};

workerScope.onmessage = (event: MessageEvent<DifferentialAnalysisWorkerRequest>) => {
    const { requestId, payload } = event.data;

    try {
        const result = runDifferentialAnalysis(payload);
        const response: DifferentialAnalysisWorkerResponse = {
            requestId,
            status: "success",
            result,
        };
        workerScope.postMessage(response);
    } catch (error) {
        const response: DifferentialAnalysisWorkerResponse = {
            requestId,
            status: "error",
            error: error instanceof Error ? error.message : "Differential analysis worker failed.",
        };
        workerScope.postMessage(response);
    }
};

export {};
