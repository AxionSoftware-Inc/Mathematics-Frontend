import type { ProbabilityPreset } from "./types";
import { PROBABILITY_PRESET_CATALOG } from "@/components/laboratory/laboratory-template-catalog";

export const PROBABILITY_PRESETS: readonly ProbabilityPreset[] = PROBABILITY_PRESET_CATALOG;

export const PROBABILITY_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "code", label: "Code" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
