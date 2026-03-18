import { fetchPublic } from "@/lib/api";

export type LaboratoryModuleMeta = {
    id: number | string;
    project?: number | null;
    project_slug?: string | null;
    project_name?: string | null;
    title: string;
    slug: string;
    summary: string;
    description?: string | null;
    category: string;
    icon_name?: string | null;
    accent_color?: string | null;
    computation_mode: "client" | "hybrid" | "server";
    estimated_minutes?: number | null;
    sort_order?: number | null;
    is_enabled?: boolean;
    config?: Record<string, unknown>;
};

export const fallbackLaboratoryModules: LaboratoryModuleMeta[] = [
    {
        id: "matrix-workbench",
        title: "Matrix Workbench",
        slug: "matrix-workbench",
        summary: "Matrix algebra, determinant, inverse and multiplication workspace.",
        description: "Interactively experiment with matrix operations and compare linear algebra results.",
        category: "matrix",
        icon_name: "Grid3X3",
        accent_color: "blue",
        computation_mode: "client",
        estimated_minutes: 12,
        sort_order: 1,
        is_enabled: true,
        config: {
            defaultA: "2 1\n1 3",
            defaultB: "1 0\n4 2",
            operations: ["add", "multiply", "determinant", "inverse"],
        },
    },
    {
        id: "integral-studio",
        title: "Integral Studio",
        slug: "integral-studio",
        summary: "Numerical integration with midpoint, trapezoid and Simpson methods.",
        description: "Approximate definite integrals and inspect sampled curves without stressing the server.",
        category: "integral",
        icon_name: "AreaChart",
        accent_color: "emerald",
        computation_mode: "client",
        estimated_minutes: 10,
        sort_order: 2,
        is_enabled: true,
        config: {
            defaultExpression: "sin(x) + x^2 / 5",
            defaultLower: 0,
            defaultUpper: 3.14,
            defaultSegments: 24,
        },
    },
    {
        id: "differential-lab",
        title: "Differential Lab",
        slug: "differential-lab",
        summary: "Initial value problem sandbox with Euler and Heun trajectories.",
        description: "Study first-order differential equations with adjustable steps and side-by-side approximations.",
        category: "differential",
        icon_name: "ChartLine",
        accent_color: "amber",
        computation_mode: "client",
        estimated_minutes: 14,
        sort_order: 3,
        is_enabled: true,
        config: {
            defaultDerivative: "x - y",
            defaultX0: 0,
            defaultY0: 1,
            defaultStep: 0.2,
            defaultSteps: 20,
        },
    },
    {
        id: "series-limits-studio",
        title: "Series & Limits Studio",
        slug: "series-limits-studio",
        summary: "Series convergence, partial sums and limit probing in one analysis module.",
        description: "Explore sequences, partial sums and one-point limit behavior inside a single modular analysis workspace.",
        category: "analysis",
        icon_name: "Sigma",
        accent_color: "violet",
        computation_mode: "client",
        estimated_minutes: 11,
        sort_order: 4,
        is_enabled: true,
        config: {
            defaultSeriesExpression: "1 / n^2",
            defaultSeriesStart: 1,
            defaultSeriesCount: 12,
            defaultLimitExpression: "sin(x) / x",
            defaultLimitPoint: 0,
            defaultLimitRadius: 1,
        },
    },
    {
        id: "geometry-studio",
        title: "Geometry Studio",
        slug: "geometry-studio",
        summary: "Analytic geometry workspace with lines, distances, midpoints and intersections.",
        description: "Model points and lines on a shared plane, inspect equations and prepare for deeper geometry modules.",
        category: "geometry",
        icon_name: "Rotate3D",
        accent_color: "teal",
        computation_mode: "client",
        estimated_minutes: 13,
        sort_order: 5,
        is_enabled: true,
        config: {
            defaultAx: 0,
            defaultAy: 0,
            defaultBx: 4,
            defaultBy: 3,
            defaultCx: 0,
            defaultCy: 4,
            defaultDx: 5,
            defaultDy: 0,
        },
    },
    {
        id: "proof-assistant",
        title: "Proof Assistant",
        slug: "proof-assistant",
        summary: "Structured theorem, lemma and proof planning workspace for mathematical writing.",
        description: "Design proof skeletons, choose a strategy and turn mathematical ideas into clean writer-ready argument maps.",
        category: "custom",
        icon_name: "BookText",
        accent_color: "rose",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 6,
        is_enabled: true,
        config: {
            defaultTitle: "Teorema sarlavhasi",
            defaultStatement: "Agar shartlar bajarilsa, natija kelib chiqadi.",
            defaultAssumptions: "1. Berilgan shart\n2. Yordamchi faraz",
            defaultGoal: "Natijani isbotlash",
            defaultStrategy: "direct",
        },
    },
    {
        id: "notebook-studio",
        title: "Notebook Studio",
        slug: "notebook-studio",
        summary: "Jupyter-like mathematical notebook with modular cells, rich outputs and writer export flow.",
        description: "Compose markdown, series, limit and Taylor cells inside a reusable notebook workspace designed for mathematical research and drafting.",
        category: "custom",
        icon_name: "BookOpenText",
        accent_color: "cyan",
        computation_mode: "client",
        estimated_minutes: 18,
        sort_order: 7,
        is_enabled: true,
        config: {
            defaultTitle: "Untitled Math Notebook",
            defaultCells: ["markdown", "series"],
        },
    },
];

function normalizeModule(payload: Record<string, unknown>): LaboratoryModuleMeta | null {
    if (typeof payload.slug !== "string" || typeof payload.title !== "string" || typeof payload.summary !== "string") {
        return null;
    }

    return {
        id: (payload.id as number | string | undefined) || payload.slug,
        project: typeof payload.project === "number" ? payload.project : null,
        project_slug: typeof payload.project_slug === "string" ? payload.project_slug : null,
        project_name: typeof payload.project_name === "string" ? payload.project_name : null,
        title: payload.title,
        slug: payload.slug,
        summary: payload.summary,
        description: typeof payload.description === "string" ? payload.description : null,
        category: typeof payload.category === "string" ? payload.category : "custom",
        icon_name: typeof payload.icon_name === "string" ? payload.icon_name : "FlaskConical",
        accent_color: typeof payload.accent_color === "string" ? payload.accent_color : "blue",
        computation_mode:
            payload.computation_mode === "server" || payload.computation_mode === "hybrid" ? payload.computation_mode : "client",
        estimated_minutes: typeof payload.estimated_minutes === "number" ? payload.estimated_minutes : 10,
        sort_order: typeof payload.sort_order === "number" ? payload.sort_order : 0,
        is_enabled: typeof payload.is_enabled === "boolean" ? payload.is_enabled : true,
        config: typeof payload.config === "object" && payload.config ? (payload.config as Record<string, unknown>) : {},
    };
}

export async function fetchLaboratoryModules() {
    try {
        const response = await fetchPublic("/api/laboratory/modules/", { next: { revalidate: 60 } });
        if (response.ok) {
            const payload = await response.json();
            if (Array.isArray(payload) && payload.length) {
                const modules = payload
                    .map((item) => normalizeModule(item as Record<string, unknown>))
                    .filter((item): item is LaboratoryModuleMeta => Boolean(item));
                if (modules.length) {
                    return modules;
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch laboratory modules", error);
    }

    return fallbackLaboratoryModules;
}

export async function fetchLaboratoryModule(slug: string) {
    try {
        const response = await fetchPublic(`/api/laboratory/modules/${slug}/`, { next: { revalidate: 60 } });
        if (response.ok) {
            const payload = await response.json();
            return normalizeModule(payload as Record<string, unknown>);
        }
    } catch (error) {
        console.error("Failed to fetch laboratory module", error);
    }

    return fallbackLaboratoryModules.find((module) => module.slug === slug) || null;
}
