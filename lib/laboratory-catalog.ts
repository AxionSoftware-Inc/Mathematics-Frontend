export type LaboratoryModuleCatalogEntry = {
    slug: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    icon_name: string;
    accent_color: string;
    computation_mode: "client" | "hybrid" | "server";
    estimated_minutes: number;
    sort_order: number;
    config?: Record<string, unknown>;
};

export const laboratoryModuleCatalog: readonly LaboratoryModuleCatalogEntry[] = [
    {
        slug: "integral-studio",
        title: "Integral Studio",
        summary: "Analitik va numerik integral hisoblash uchun professional laboratoriya.",
        description:
            "Single, double va triple integral masalalarini symbolic parser, numerik compare, grafik va report oqimi bilan tahlil qiling.",
        category: "integral",
        icon_name: "AreaChart",
        accent_color: "emerald",
        computation_mode: "hybrid",
        estimated_minutes: 12,
        sort_order: 1,
        config: {
            defaultExpression: "sin(x) + x^2 / 5",
            defaultLower: 0,
            defaultUpper: 3.14,
            defaultSegments: 24,
        },
    },
    {
        slug: "differential-studio",
        title: "Differential Studio",
        summary: "Differensial hisob va funksiyalarni tahlil qilish laboratoriyasi.",
        description:
            "Hosila, xususiy hosilalar, Jacobian va Hessian masalalarini symbolic parser, slope-field va visualizer bilan tahlil qiling.",
        category: "differential",
        icon_name: "Activity",
        accent_color: "indigo",
        computation_mode: "hybrid",
        estimated_minutes: 10,
        sort_order: 2,
        config: {
            defaultMode: "jacobian",
            defaultExpression: "[x^2 * y, sin(x) + cos(y)]",
            defaultVariable: "x, y",
            defaultPoint: "1, 1.5",
        },
    },
    {
        slug: "matrix-studio",
        title: "Matrix Studio",
        summary: "Matritsa algebra, spektral tahlil va transformatsiyalar uchun starter laboratoriya.",
        description:
            "Determinant, inverse, linear systems, eigen-analysis va transform workflows uchun professional workspace skeletoni.",
        category: "matrix",
        icon_name: "Blocks",
        accent_color: "amber",
        computation_mode: "client",
        estimated_minutes: 8,
        sort_order: 3,
        config: {
            defaultMode: "algebra",
            defaultExpression: "2 1; 1 3",
            defaultSecondary: "1; 0",
            defaultDimension: "2x2",
        },
    },
    {
        slug: "probability-studio",
        title: "Probability Studio",
        summary: "Ehtimollik, statistika va inferensiya uchun yangi laboratoriya.",
        description:
            "Descriptive statistics, distributions, inference, regression va Monte Carlo workflows uchun starter research workspace.",
        category: "probability",
        icon_name: "ChartColumn",
        accent_color: "cyan",
        computation_mode: "client",
        estimated_minutes: 9,
        sort_order: 4,
        config: {
            defaultMode: "descriptive",
            defaultExpression: "12, 15, 13, 17, 19, 18, 14, 16, 20, 22",
            defaultSecondary: "bins=6",
            defaultDimension: "1d",
        },
    },
];

export const supportedLaboratorySlugs = laboratoryModuleCatalog.map((entry) => entry.slug);
