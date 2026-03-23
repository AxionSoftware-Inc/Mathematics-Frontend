"use client";

import type { ComponentType } from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";

export type LaboratoryModuleComponent = ComponentType<{ module: LaboratoryModuleMeta }>;

export type LaboratoryModuleDefinition = {
    component: LaboratoryModuleComponent;
    capabilities: string[];
    analysisTabs?: string[];
};

export function defineLaboratoryModule(definition: LaboratoryModuleDefinition) {
    return definition;
}
