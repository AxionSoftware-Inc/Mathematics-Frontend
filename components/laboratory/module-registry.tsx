"use client";

import type { ComponentType } from "react";

import { MatrixWorkbenchModule } from "@/components/laboratory/modules/matrix-workbench";
import { IntegralStudioModule } from "@/components/laboratory/modules/integral-studio";
import { DifferentialLabModule } from "@/components/laboratory/modules/differential-lab";
import { SeriesLimitsStudioModule } from "@/components/laboratory/modules/series-limits-studio";
import { GeometryStudioModule } from "@/components/laboratory/modules/geometry-studio";
import { NotebookStudioModule } from "@/components/laboratory/modules/notebook-studio";
import { ProofAssistantModule } from "@/components/laboratory/modules/proof-assistant";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type ModuleComponentProps = {
    module: LaboratoryModuleMeta;
};

type LaboratoryModuleDefinition = {
    capabilities: string[];
    component: ComponentType<ModuleComponentProps>;
};

export const laboratoryModuleRegistry: Record<string, LaboratoryModuleDefinition> = {
    "matrix-workbench": {
        capabilities: ["Matrix algebra", "Heatmap and basis transform", "Determinant and inverse", "Standard writer bridge"],
        component: MatrixWorkbenchModule,
    },
    "integral-studio": {
        capabilities: ["Numerical integration", "Function preview", "Method comparison", "Standard writer bridge"],
        component: IntegralStudioModule,
    },
    "differential-lab": {
        capabilities: ["Euler and Heun methods", "Initial value problems", "Standard writer bridge", "Notebook workspace"],
        component: DifferentialLabModule,
    },
    "series-limits-studio": {
        capabilities: ["Series convergence", "One-sided limits", "Taylor and power series", "Standard writer bridge"],
        component: SeriesLimitsStudioModule,
    },
    "geometry-studio": {
        capabilities: ["Analytic geometry", "Line intersection", "Standard writer bridge", "Notebook workspace"],
        component: GeometryStudioModule,
    },
    "proof-assistant": {
        capabilities: ["Theorem planning", "Proof skeletons", "Strategy presets", "Standard writer bridge"],
        component: ProofAssistantModule,
    },
    "notebook-studio": {
        capabilities: ["Jupyter-like notebook", "Modular cells", "Standard writer bridge", "Math drafting workspace"],
        component: NotebookStudioModule,
    },
};
