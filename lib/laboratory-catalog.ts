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
];

export const supportedLaboratorySlugs = laboratoryModuleCatalog.map((entry) => entry.slug);
