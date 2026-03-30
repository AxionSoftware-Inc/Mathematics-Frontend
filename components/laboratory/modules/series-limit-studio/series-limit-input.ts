import type { SeriesLimitMode } from "./types";

type SumParse = {
    term: string;
    index: string;
    start: string;
    end: string;
};

type ArrowParse = {
    variable: string;
    target: string;
};

function parseSumExpression(expression: string): SumParse | null {
    const raw = expression.trim();
    const simple = raw.match(/^(?:sum|summation)\((.+),\s*([A-Za-z]\w*)\s*=\s*(.+)\.\.(.+)\)$/i);
    if (simple) {
        return {
            term: simple[1].trim(),
            index: simple[2].trim(),
            start: simple[3].trim(),
            end: simple[4].trim(),
        };
    }

    const tuple = raw.match(/^(?:sum|summation)\((.+),\s*\(\s*([A-Za-z]\w*)\s*,\s*(.+)\s*,\s*(.+)\s*\)\)$/i);
    if (!tuple) return null;
    return {
        term: tuple[1].trim(),
        index: tuple[2].trim(),
        start: tuple[3].trim(),
        end: tuple[4].trim(),
    };
}

function parseArrow(auxiliary: string, fallbackVariable: string): ArrowParse {
    const match = auxiliary.trim().match(/^([A-Za-z]\w*)\s*->\s*(.+)$/);
    if (!match) {
        return {
            variable: fallbackVariable,
            target: fallbackVariable === "n" ? "\\infty" : "0",
        };
    }
    return {
        variable: match[1].trim(),
        target: latexifyInline(match[2].trim()),
    };
}

function parseCenter(auxiliary: string) {
    const match = auxiliary.match(/center\s*=\s*([^;,]+)/i);
    return match?.[1]?.trim() ?? null;
}

function stripSequenceAssignment(expression: string) {
    return expression.replace(/^\s*a_?n\s*=\s*/i, "").trim();
}

function latexifyInline(value: string) {
    return value
        .replace(/\binf\b|\boo\b/gi, "\\infty")
        .replace(/->/g, "\\to ")
        .replace(/\*\*/g, "^");
}

function detectExternalVariable(expression: string, indexSymbol: string) {
    const symbols = Array.from(new Set(expression.match(/[A-Za-z]\w*/g) ?? []));
    const reserved = new Set([
        indexSymbol,
        "sum",
        "summation",
        "sin",
        "cos",
        "tan",
        "exp",
        "log",
        "sqrt",
        "abs",
        "pi",
        "inf",
        "oo",
        "n",
        "e",
    ]);
    return symbols.find((symbol) => !reserved.has(symbol)) ?? null;
}

export function inferSeriesLimitMode(expression: string, auxiliary: string, currentMode: SeriesLimitMode): SeriesLimitMode {
    const rawExpression = expression.trim();
    const rawAuxiliary = auxiliary.trim().toLowerCase();
    const parsedSum = parseSumExpression(rawExpression);

    if (parsedSum) {
        const externalVariable = detectExternalVariable(parsedSum.term, parsedSum.index);
        if (parseCenter(auxiliary) || externalVariable) {
            return "power-series";
        }
        if (/(ratio|root|comparison|integral|condensation|raabe|dirichlet|abel|tauber|cesaro|convergen)/i.test(rawAuxiliary)) {
            return "convergence";
        }
        return currentMode === "convergence" ? "convergence" : "series";
    }

    if (/^\s*a_?n\s*=/.test(rawExpression) || /\bn\s*->\s*(inf|oo)\b/i.test(rawAuxiliary)) {
        return "sequences";
    }

    if (currentMode === "power-series" && /\bx\b/.test(rawExpression)) {
        return "power-series";
    }

    return "limits";
}

export function buildSeriesLimitPreview(mode: SeriesLimitMode, expression: string, auxiliary: string) {
    const trimmedExpression = expression.trim();
    const trimmedAuxiliary = auxiliary.trim();
    if (!trimmedExpression) return "";

    const parsedSum = parseSumExpression(trimmedExpression);

    if ((mode === "series" || mode === "convergence" || mode === "power-series") && parsedSum) {
        const sumLatex = `\\sum_{${parsedSum.index}=${latexifyInline(parsedSum.start)}}^{${latexifyInline(parsedSum.end)}} ${latexifyInline(parsedSum.term)}`;
        if (mode === "power-series") {
            const center = parseCenter(trimmedAuxiliary);
            return center
                ? `$$${sumLatex}$$\n$$\\text{center} = ${latexifyInline(center)}$$`
                : `$$${sumLatex}$$`;
        }
        if (mode === "convergence" && trimmedAuxiliary) {
            return `$$${sumLatex}$$\n$$\\text{test} = ${latexifyInline(trimmedAuxiliary)}$$`;
        }
        return `$$${sumLatex}$$`;
    }

    if (mode === "sequences") {
        const tail = parseArrow(trimmedAuxiliary || "n -> inf", "n");
        const sequenceTerm = latexifyInline(stripSequenceAssignment(trimmedExpression));
        return `$$a_{${tail.variable}} = ${sequenceTerm}$$\n$$\\lim_{${tail.variable} \\to ${tail.target}} a_{${tail.variable}}$$`;
    }

    const limitTarget = parseArrow(trimmedAuxiliary || "x -> 0", "x");
    return `$$\\lim_{${limitTarget.variable} \\to ${limitTarget.target}} ${latexifyInline(trimmedExpression)}$$`;
}

export function buildSeriesLimitAuxPreview(mode: SeriesLimitMode, auxiliary: string) {
    const trimmed = auxiliary.trim();
    if (!trimmed) return "";

    if (mode === "power-series") {
        const center = parseCenter(trimmed);
        if (center) {
            return `$$\\text{center} = ${latexifyInline(center)}$$`;
        }
    }

    if (mode === "sequences" || mode === "limits") {
        const fallbackVariable = mode === "sequences" ? "n" : "x";
        const parsed = parseArrow(trimmed, fallbackVariable);
        return `$$${parsed.variable} \\to ${parsed.target}$$`;
    }

    return `$$\\text{context} = ${latexifyInline(trimmed)}$$`;
}
