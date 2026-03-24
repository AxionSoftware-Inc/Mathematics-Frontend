import { IntegralClassification, IntegralSolveSnapshot } from "../types";

function hasInfiniteBound(value: string) {
    return /\b(?:inf|infty|infinity)\b|[∞]/i.test(value.trim());
}

function looksBlank(value: string) {
    return value.trim().length === 0;
}

function expressionHasVectorPathSignals(expression: string) {
    return /^\s*line\(/i.test(expression) || /\bdr\b|\bds\b|\bdt\b|r\(t\)|c\(t\)|curve|path/i.test(expression);
}

function expressionHasSurfaceSignals(expression: string) {
    return /^\s*surface\(/i.test(expression) || /\bdS\b|\bdA\b|normal|surface/i.test(expression);
}

function expressionHasContourSignals(expression: string) {
    return /^\s*contour\(/i.test(expression) || /\bdz\b|\bcomplex\b|contour|residue/i.test(expression);
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
                support: /^\s*contour\(/i.test(expression) ? "supported" : "partial",
                summary: /^\s*contour\(/i.test(expression)
                    ? "Contour lane syntax topildi. Parametric complex path backend contour solverga uzatiladi."
                    : "Ifoda contour yoki complex integralga o'xshaydi. To'liq solve uchun structured contour(...) syntax kerak.",
                notes: ["Contour/complex signals detected"],
            };
        }

        if (expressionHasSurfaceSignals(expression)) {
            return {
                kind: "surface_integral_candidate",
                label: "Surface candidate",
                support: /^\s*surface\(/i.test(expression) ? "supported" : "partial",
                summary: /^\s*surface\(/i.test(expression)
                    ? "Surface lane syntax topildi. Parametric patch backend surface solverga uzatiladi."
                    : "Ifoda surface integral belgilari beradi. To'liq solve uchun structured surface(...) syntax kerak.",
                notes: ["Surface/normal markers detected"],
            };
        }

        if (expressionHasVectorPathSignals(expression)) {
            return {
                kind: "line_integral_candidate",
                label: "Line candidate",
                support: /^\s*line\(/i.test(expression) ? "supported" : "partial",
                summary: /^\s*line\(/i.test(expression)
                    ? "Line lane syntax topildi. Parametric path backend line solverga uzatiladi."
                    : "Ifoda line integral yoki parametric path signal beradi. To'liq solve uchun structured line(...) syntax kerak.",
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
