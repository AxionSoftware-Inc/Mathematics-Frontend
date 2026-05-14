import type { LaboratoryMethodOption } from "@/components/laboratory/method-selector/method-selector";

export type MethodContractStatus = "implemented" | "code-ready" | "experimental" | "locked";

export type MethodIntelligenceRow = {
    method: string;
    result: string;
    time: string;
    accuracy: string;
    conditions: string;
    bestUse: string;
    status: MethodContractStatus;
    fallbackReason: string;
};

export function normalizeMethodStatus(status?: LaboratoryMethodOption["status"]): MethodContractStatus {
    if (status === "active") return "implemented";
    if (status === "adapter") return "code-ready";
    if (status === "planned") return "locked";
    return "experimental";
}

export function buildMethodIntelligenceRows(params: {
    options: LaboratoryMethodOption[];
    selectedMethod?: string;
    exactResult?: string;
    numericResult?: string;
    elapsedMs?: number | null;
}) {
    return params.options.slice(0, 8).map((option): MethodIntelligenceRow => {
        const status = normalizeMethodStatus(option.status);
        const isSelected = option.id === params.selectedMethod;
        const numericLike = option.family === "numeric";
        return {
            method: option.label,
            result: isSelected
                ? params.exactResult || params.numericResult || "current result"
                : status === "implemented"
                  ? "available"
                  : status === "code-ready"
                    ? "code/report ready"
                    : status === "locked"
                      ? "locked"
                      : "experimental",
            time: params.elapsedMs && isSelected ? `${params.elapsedMs} ms` : numericLike ? "fast estimate" : "depends",
            accuracy: status === "implemented" && !numericLike ? "exact when closed-form exists" : numericLike ? "tolerance dependent" : "requires review",
            conditions: option.limitations?.[0] || option.parameters?.join(", ") || "standard assumptions",
            bestUse: option.bestFor?.[0] || option.description,
            status,
            fallbackReason:
                status === "implemented"
                    ? "direct backend adapter"
                    : status === "code-ready"
                      ? "backend falls back while code/report contract remains explicit"
                      : status === "locked"
                        ? "visible as roadmap or premium-gated method"
                        : "experimental method contract",
        };
    });
}

export function methodRowsToTable(rows: MethodIntelligenceRow[]) {
    return rows.map((row) => [
        row.method,
        row.result,
        row.time,
        row.accuracy,
        row.conditions,
        row.bestUse,
        row.status,
    ]);
}
