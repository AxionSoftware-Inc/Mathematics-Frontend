"use client";

import dynamic from "next/dynamic";

import { defineLaboratoryModule, type LaboratoryModuleDefinition } from "@/components/laboratory/module-contract";

const moduleLoading = () => (
    <div className="flex min-h-[420px] items-center justify-center bg-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a838f]">Loading workspace…</div>
    </div>
);

const IntegralStudioModule = dynamic(
    () => import("@/components/laboratory/modules/integral-studio").then((module) => module.IntegralStudioModule),
    { loading: moduleLoading },
);
const DifferentialStudioModule = dynamic(
    () => import("@/components/laboratory/modules/differential-studio").then((module) => module.DifferentialStudioModule),
    { loading: moduleLoading },
);
const MatrixStudioModule = dynamic(
    () => import("@/components/laboratory/modules/matrix-studio").then((module) => module.MatrixStudioModule),
    { loading: moduleLoading },
);
const ProbabilityStudioModule = dynamic(
    () => import("@/components/laboratory/modules/probability-studio").then((module) => module.ProbabilityStudioModule),
    { loading: moduleLoading },
);
const SeriesLimitStudioModule = dynamic(
    () => import("@/components/laboratory/modules/series-limit-studio").then((module) => module.SeriesLimitStudioModule),
    { loading: moduleLoading },
);

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
