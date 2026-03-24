import { IntegralClassification, IntegralSolveSnapshot } from "../types";

function hasInfiniteBound(value: string) {
    return /\b(?:inf|infty|infinity)\b|[∞]/i.test(value.trim());
}

function looksBlank(value: string) {
    return value.trim().length === 0;
}

function expressionHasVectorPathSignals(expression: string) {
    return /\bdr\b|\bds\b|\bdt\b|r\(t\)|c\(t\)|curve|path/i.test(expression);
}

function expressionHasSurfaceSignals(expression: string) {
    return /\bdS\b|\bdA\b|normal|surface/i.test(expression);
}

function expressionHasContourSignals(expression: string) {
    return /\bdz\b|\bcomplex\b|contour|residue/i.test(expression);
}

function hasEndpointSingularity(expression: string, lower: string, upper: string) {
    const normalized = expression.replace(/\s+/g, "").toLowerCase();
    const lowerValue = lower.trim().toLowerCase();
    const upperValue = upper.trim().toLowerCase();

    if (normalized.includes("/x") && (lowerValue === "0" || upperValue === "0")) {
        return true;
    }
    if (normalized.includes("log(x)") && lowerValue === "0") {
        return true;
    }
    if (normalized.includes("sqrt(x)") && (lowerValue.startsWith("-") || lowerValue === "0")) {
        return true;
    }

    return false;
}

export class IntegralClassificationService {
    static classify(snapshot: IntegralSolveSnapshot): IntegralClassification {
        const expression = snapshot.expression.trim();

        if (!expression) {
            return {
                kind: "unknown",
                label: "Unclassified",
                support: "unsupported",
                summary: "Integral ifodasi bo'sh. Type aniqlash uchun formula kerak.",
                notes: ["Expression required"],
            };
        }

        if (expressionHasContourSignals(expression)) {
            return {
                kind: "contour_integral_candidate",
                label: "Contour candidate",
                support: "unsupported",
                summary: "Ifoda contour yoki complex integralga o'xshaydi. Hozirgi studio bu oilani hali solve qilmaydi.",
                notes: ["Contour/complex signals detected"],
            };
        }

        if (expressionHasSurfaceSignals(expression)) {
            return {
                kind: "surface_integral_candidate",
                label: "Surface candidate",
                support: "unsupported",
                summary: "Ifoda surface integral belgilari beradi. Bu family uchun alohida solver lane kerak.",
                notes: ["Surface/normal markers detected"],
            };
        }

        if (expressionHasVectorPathSignals(expression)) {
            return {
                kind: "line_integral_candidate",
                label: "Line candidate",
                support: "unsupported",
                summary: "Ifoda line integral yoki parametric path signal beradi. Hozirgi composer definite scalar integralga yo'naltirilgan.",
                notes: ["Parametric/path markers detected"],
            };
        }

        if (snapshot.mode === "single") {
            if (looksBlank(snapshot.lower) || looksBlank(snapshot.upper)) {
                return {
                    kind: "indefinite_single",
                    label: "Indefinite integral",
                    support: "supported",
                    summary: "Chegaralar bo'sh. Bu aniqmas integral bo'lib, alohida symbolic lane orqali yuradi.",
                    notes: ["Indefinite symbolic lane available"],
                };
            }

            if (hasInfiniteBound(snapshot.lower) || hasInfiniteBound(snapshot.upper)) {
                return {
                    kind: "improper_infinite_bounds",
                    label: "Improper integral",
                    support: "supported",
                    summary: "Chegaralarda cheksizlik signali bor. Improper integral alohida symbolic lane orqali tekshiriladi.",
                    notes: ["Infinite bound lane available"],
                };
            }

            if (hasEndpointSingularity(expression, snapshot.lower, snapshot.upper)) {
                return {
                    kind: "improper_endpoint_singularity",
                    label: "Endpoint singularity",
                    support: "supported",
                    summary: "Domain chegarasida singularity ehtimoli bor. System improper lane orqali convergence signalini tekshiradi.",
                    notes: ["Endpoint singularity lane available"],
                };
            }

            return {
                kind: "definite_single",
                label: "Definite single",
                support: "supported",
                summary: "Single definite integral current studio tomonidan to'liqroq qo'llanadi.",
                notes: ["Analytic + numerical lane available"],
            };
        }

        if (snapshot.mode === "double") {
            return {
                kind: "definite_double",
                label: "Definite double",
                support: "supported",
                summary: "Double definite integral numerik va vizual audit bilan qo'llanadi.",
                notes: ["Numerical + visualization lane available"],
            };
        }

        return {
            kind: "definite_triple",
            label: "Definite triple",
            support: "supported",
            summary: "Triple definite integral volumetric numerik audit bilan qo'llanadi.",
            notes: ["Volumetric numerical lane available"],
        };
    }
}
