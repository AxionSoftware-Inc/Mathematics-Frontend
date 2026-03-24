export type GeometryLaneKind = "line" | "surface" | "contour";

export type LineLaneDraft = {
    kind: "line";
    dimension: "2d" | "3d";
    variant: "vector" | "scalar";
    p: string;
    q: string;
    r: string;
    scalarField: string;
    path: string[];
    parameter: string;
    intervalStart: string;
    intervalEnd: string;
};

export type SurfaceLaneDraft = {
    kind: "surface";
    variant: "vector" | "scalar";
    orientation: "positive" | "negative";
    scalarField: string;
    field: string[];
    patch: string[];
    uStart: string;
    uEnd: string;
    vStart: string;
    vEnd: string;
};

export type ContourLaneDraft = {
    kind: "contour";
    field: string;
    path: string;
    parameter: string;
    intervalStart: string;
    intervalEnd: string;
};

export type GeometryLaneDraft = LineLaneDraft | SurfaceLaneDraft | ContourLaneDraft;

const defaultLineDraft: LineLaneDraft = {
    kind: "line",
    dimension: "2d",
    variant: "vector",
    p: "-y",
    q: "x",
    r: "0",
    scalarField: "x + y",
    path: ["cos(t)", "sin(t)"],
    parameter: "t",
    intervalStart: "0",
    intervalEnd: "2*pi",
};

const defaultSurfaceDraft: SurfaceLaneDraft = {
    kind: "surface",
    variant: "vector",
    orientation: "positive",
    scalarField: "x + y + z",
    field: ["0", "0", "1"],
    patch: ["u", "v", "u + v"],
    uStart: "0",
    uEnd: "1",
    vStart: "0",
    vEnd: "1",
};

const defaultContourDraft: ContourLaneDraft = {
    kind: "contour",
    field: "1/z",
    path: "exp(I*t)",
    parameter: "t",
    intervalStart: "0",
    intervalEnd: "2*pi",
};

export class GeometryLaneService {
    static detect(expression: string): GeometryLaneKind | null {
        const normalized = expression.trim().toLowerCase();
        if (normalized.startsWith("line(")) return "line";
        if (normalized.startsWith("surface(")) return "surface";
        if (normalized.startsWith("contour(")) return "contour";
        return null;
    }

    static createDefault(kind: GeometryLaneKind): GeometryLaneDraft {
        if (kind === "line") return { ...defaultLineDraft, path: [...defaultLineDraft.path] };
        if (kind === "surface") return { ...defaultSurfaceDraft, field: [...defaultSurfaceDraft.field], patch: [...defaultSurfaceDraft.patch] };
        return { ...defaultContourDraft };
    }

    static parse(expression: string, fallbackKind: GeometryLaneKind): GeometryLaneDraft {
        const kind = this.detect(expression) || fallbackKind;
        const inner = this.extractInner(expression, kind);
        const fields = this.parseFields(inner);

        if (kind === "line") {
            const base = this.createDefault("line") as LineLaneDraft;
            const path = fields.path ? this.parseTuple(fields.path) : base.path;
            const interval = fields[fields.parameter || "t"] || fields.t;
            const [intervalStart, intervalEnd] = interval ? this.parseInterval(interval) : [base.intervalStart, base.intervalEnd];
            const isScalar = Boolean(fields.f);
            return {
                kind,
                dimension: path.length === 3 ? "3d" : "2d",
                variant: isScalar ? "scalar" : "vector",
                p: fields.p || base.p,
                q: fields.q || base.q,
                r: fields.r || base.r,
                scalarField: fields.f || base.scalarField,
                path: path.length === 3 ? path : [path[0] || base.path[0], path[1] || base.path[1], path[2] || ""].filter((item, index) => index < (path.length === 3 ? 3 : 2)),
                parameter: fields.parameter || "t",
                intervalStart,
                intervalEnd,
            };
        }

        if (kind === "surface") {
            const base = this.createDefault("surface") as SurfaceLaneDraft;
            const patch = fields.patch ? this.parseTuple(fields.patch, 3) : base.patch;
            const fieldTuple = fields.f?.startsWith("(") ? this.parseTuple(fields.f, 3) : base.field;
            const [uStart, uEnd] = fields.u ? this.parseInterval(fields.u) : [base.uStart, base.uEnd];
            const [vStart, vEnd] = fields.v ? this.parseInterval(fields.v) : [base.vStart, base.vEnd];
            return {
                kind,
                variant: fields.f && !fields.f.startsWith("(") ? "scalar" : "vector",
                orientation: fields.orientation === "negative" ? "negative" : "positive",
                scalarField: fields.f && !fields.f.startsWith("(") ? fields.f : base.scalarField,
                field: fieldTuple,
                patch,
                uStart,
                uEnd,
                vStart,
                vEnd,
            };
        }

        const base = this.createDefault("contour") as ContourLaneDraft;
        const interval = fields[fields.parameter || "t"] || fields.t;
        const [intervalStart, intervalEnd] = interval ? this.parseInterval(interval) : [base.intervalStart, base.intervalEnd];
        return {
            kind,
            field: fields.f || base.field,
            path: fields.path || base.path,
            parameter: fields.parameter || "t",
            intervalStart,
            intervalEnd,
        };
    }

    static build(draft: GeometryLaneDraft): string {
        if (draft.kind === "line") {
            const path = `(${draft.path.filter(Boolean).join(", ")})`;
            const interval = `${draft.parameter}:[${draft.intervalStart}, ${draft.intervalEnd}]`;
            if (draft.variant === "scalar") {
                return `line(f=${draft.scalarField}, path=${path}, parameter=${draft.parameter}, ${interval})`;
            }
            const components = draft.path.length === 3
                ? `P=${draft.p}, Q=${draft.q}, R=${draft.r}`
                : `P=${draft.p}, Q=${draft.q}`;
            return `line(${components}, path=${path}, parameter=${draft.parameter}, ${interval})`;
        }

        if (draft.kind === "surface") {
            const patch = `(${draft.patch.join(", ")})`;
            const field = draft.variant === "scalar" ? draft.scalarField : `(${draft.field.join(", ")})`;
            return `surface(f=${field}, patch=${patch}, orientation=${draft.orientation}, u:[${draft.uStart}, ${draft.uEnd}], v:[${draft.vStart}, ${draft.vEnd}])`;
        }

        return `contour(f=${draft.field}, path=${draft.path}, parameter=${draft.parameter}, ${draft.parameter}:[${draft.intervalStart}, ${draft.intervalEnd}])`;
    }

    private static extractInner(expression: string, kind: GeometryLaneKind): string {
        const normalized = expression.trim();
        const prefix = `${kind}(`;
        if (!normalized.toLowerCase().startsWith(prefix) || !normalized.endsWith(")")) {
            return "";
        }
        return normalized.slice(prefix.length, -1);
    }

    private static parseFields(text: string): Record<string, string> {
        const parts = this.splitTopLevel(text);
        const result: Record<string, string> = {};
        for (const part of parts) {
            const [key, ...value] = part.split("=");
            if (!value.length) continue;
            result[key.trim().toLowerCase()] = value.join("=").trim();
        }
        return result;
    }

    private static parseTuple(value: string, expectedLength?: number): string[] {
        const trimmed = value.trim();
        if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return [];
        const items = this.splitTopLevel(trimmed.slice(1, -1));
        if (expectedLength && items.length < expectedLength) {
            return [...items, ...new Array(expectedLength - items.length).fill("")];
        }
        return items;
    }

    private static parseInterval(value: string): [string, string] {
        const trimmed = value.trim();
        if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return ["0", "1"];
        const [start = "0", end = "1"] = this.splitTopLevel(trimmed.slice(1, -1));
        return [start, end];
    }

    private static splitTopLevel(text: string): string[] {
        const parts: string[] = [];
        let current = "";
        let depth = 0;
        for (const char of text) {
            if (char === "(" || char === "[") depth += 1;
            if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
            if (char === "," && depth === 0) {
                if (current.trim()) parts.push(current.trim());
                current = "";
                continue;
            }
            current += char;
        }
        if (current.trim()) parts.push(current.trim());
        return parts;
    }
}
