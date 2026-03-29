"use client";

import { LaboratoryStudioHeader } from "@/components/laboratory/laboratory-studio-header";
import { PROBABILITY_WORKFLOW_TABS } from "../constants";
import type { ProbabilityExperienceLevel, ProbabilityPreset, ProbabilityWorkspaceTab } from "../types";

export function StudioHeaderBar({
    activeTab,
    setActiveTab,
    templatesOpen,
    setTemplatesOpen,
    experienceLevel,
    setExperienceLevel,
    presets,
    activePresetLabel,
    applyPreset,
}: {
    activeTab: ProbabilityWorkspaceTab;
    setActiveTab: (value: ProbabilityWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: ProbabilityExperienceLevel;
    setExperienceLevel: (value: ProbabilityExperienceLevel) => void;
    presets: readonly ProbabilityPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: ProbabilityPreset) => void;
}) {
    return (
        <LaboratoryStudioHeader
            moduleLabel="Probability"
            tabs={PROBABILITY_WORKFLOW_TABS}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId as ProbabilityWorkspaceTab)}
            experienceLevel={experienceLevel}
            setExperienceLevel={(value) => setExperienceLevel(value as ProbabilityExperienceLevel)}
            templatesOpen={templatesOpen}
            onToggleTemplates={() => setTemplatesOpen((current) => !current)}
            onCloseTemplates={() => setTemplatesOpen(false)}
            templateSections={[
                {
                    id: "presets",
                    title: "Problem Presets",
                    items: presets.map((preset) => ({
                        id: preset.label,
                        title: preset.label,
                        description: preset.description,
                        meta: preset.mode,
                        recommended: preset.label === presets[0]?.label,
                        badge: activePresetLabel === preset.label ? "Active" : preset.mode,
                        active: activePresetLabel === preset.label,
                        onSelect: () => applyPreset(preset),
                    })),
                },
            ]}
        />
    );
}
