"use client";

import { IntegralStudioModule } from "@/components/laboratory/modules/integral-studio";
import { defineLaboratoryModule, type LaboratoryModuleDefinition } from "@/components/laboratory/module-contract";

export const laboratoryModuleRegistry: Record<string, LaboratoryModuleDefinition> = {
    "integral-studio": defineLaboratoryModule({
        component: IntegralStudioModule,
        capabilities: [
            "Analytic-first solver",
            "Numerical confirmation flow",
            "2D / 3D visualizer deck",
            "Step-by-step symbolic cards",
            "Sweep and comparison panels",
        ],
        analysisTabs: ["solve", "visualize", "compare", "report"],
    }),
};
