import { parse as parseMathExpression } from "mathjs";

export class LaboratoryFormattingService {
    static normalizeMathExpression(expression: string) {
        return expression
            .replace(/\u2212/g, "-")
            .replace(/[\u00D7\u22C5\u00B7]/g, "*")
            .replace(/[\u00F7]/g, "/")
            .replace(/\u03C0/g, "pi")
            .replace(/\u03C1/g, "rho")
            .replace(/[\u03B8\u03D1]/g, "theta")
            .replace(/[\u03C6\u03D5]/g, "phi")
            .replace(/\bln\s*\(/gi, "log(")
            .trim();
    }

    /**
     * Format numbers into nice strings for display
     */
    static formatMetric(value: number | null | undefined, digits = 6) {
        if (value === null || value === undefined || Number.isNaN(value)) return "--";
        const valStr = value.toFixed(digits);
        // Remove trailing zeros and possible decimal point if not needed
        return valStr.replace(/\.?0+$/, "");
    }

    /**
     * Convert expression to LaTeX
     */
    static toTexExpression(expression: string) {
        const normalized = this.normalizeMathExpression(expression);
        try {
            return parseMathExpression(normalized).toTex({ parenthesis: "keep" });
        } catch {
            // Fallback for expressions mathjs might struggle with converting directly
            return `\\texttt{${normalized.replace(/\\/g, "\\\\").replace(/([{}_#$%&])/g, "\\$1")}}`;
        }
    }

    /**
     * Clamps an input string as an integer within range
     */
    static clampInteger(value: string | number, fallback: number, min: number, max: number) {
        const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
        if (!Number.isFinite(parsed)) {
            return fallback;
        }
        return Math.min(max, Math.max(min, parsed));
    }

    /**
     * Map tone to CSS classes
     */
    static getStepToneClasses(tone: "neutral" | "info" | "success" | "warn") {
        if (tone === "success") {
            return {
                badge: "text-emerald-600",
                card: "border-emerald-500/20 bg-emerald-500/5",
            };
        }
        if (tone === "warn") {
            return {
                badge: "text-amber-600",
                card: "border-amber-500/20 bg-amber-500/5",
            };
        }
        if (tone === "info") {
            return {
                badge: "text-sky-600",
                card: "border-sky-500/20 bg-sky-500/5",
            };
        }
        return {
            badge: "text-muted-foreground",
            card: "border-border/60 bg-background/70",
        };
    }

    /**
     * Tone for parser notes
     */
    static getParserNoteTone(notes: string[]) {
        return notes.length ? "text-amber-600" : "text-emerald-600";
    }
}
