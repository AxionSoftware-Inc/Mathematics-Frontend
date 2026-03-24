"use client";

import { IntegralStudioModule } from "@/components/laboratory/modules/integral-studio";
import { DifferentialStudioModule } from "@/components/laboratory/modules/differential-studio";
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
    "differential-studio": defineLaboratoryModule({
        component: DifferentialStudioModule,
        capabilities: [
            "Symbolic differentiation",
            "Partial derivative analysis",
            "Slope-field & Tangent viz",
            "Jacobian & Hessian lanes",
            "Sensitivity analysis",
        ],
        analysisTabs: ["solve", "visualize", "compare", "report"],
    }),
};
