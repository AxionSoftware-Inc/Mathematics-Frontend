"use client";

import { IntegralStudioModule } from "@/components/laboratory/modules/integral-studio";
import { DifferentialStudioModule } from "@/components/laboratory/modules/differential-studio";
import { MatrixStudioModule } from "@/components/laboratory/modules/matrix-studio";
import { ProbabilityStudioModule } from "@/components/laboratory/modules/probability-studio";
import { SeriesLimitStudioModule } from "@/components/laboratory/modules/series-limit-studio";
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
    "matrix-studio": defineLaboratoryModule({
        component: MatrixStudioModule,
        capabilities: [
            "Matrix algebra workspace",
            "Determinant / inverse lane",
            "Eigen & decomposition roadmap",
            "Transformation visual lane",
            "Research report scaffold",
        ],
        analysisTabs: ["solve", "visualize", "compare", "report"],
    }),
    "probability-studio": defineLaboratoryModule({
        component: ProbabilityStudioModule,
        capabilities: [
            "Descriptive statistics lane",
            "Distribution audit flow",
            "Inference and AB testing",
            "Regression starter workspace",
            "Monte Carlo sandbox",
        ],
        analysisTabs: ["solve", "visualize", "compare", "report"],
    }),
    "series-limit-studio": defineLaboratoryModule({
        component: SeriesLimitStudioModule,
        capabilities: [
            "Limit and sequence workspace",
            "Infinite series starter lane",
            "Convergence test roadmap",
            "Power series audit shell",
            "Research report scaffold",
        ],
        analysisTabs: ["solve", "visualize", "compare", "report"],
    }),
};
