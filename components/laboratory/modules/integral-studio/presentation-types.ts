import { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";

export type StudioTone = "neutral" | "info" | "success" | "warn";

export type StudioMetricCard = {
    eyebrow: string;
    value: string;
    detail: string;
    tone: StudioTone;
};

export type StudioExactStep = {
    title: string;
    summary: string;
    latex: string | null;
    tone: StudioTone;
};

export type StudioSignal = LaboratorySignal;

