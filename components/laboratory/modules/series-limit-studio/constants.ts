import type { SeriesLimitPreset } from "./types";
import { SERIES_LIMIT_PRESET_CATALOG } from "@/components/laboratory/laboratory-template-catalog";

export const SERIES_LIMIT_PRESETS: readonly SeriesLimitPreset[] = SERIES_LIMIT_PRESET_CATALOG;

export const SERIES_LIMIT_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
