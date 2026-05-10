import type { MatrixPreset } from "./types";
import { MATRIX_PRESET_CATALOG } from "@/components/laboratory/laboratory-template-catalog";

export const MATRIX_PRESETS: readonly MatrixPreset[] = MATRIX_PRESET_CATALOG;

export const MATRIX_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "code", label: "Code" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
