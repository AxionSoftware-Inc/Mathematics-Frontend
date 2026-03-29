"use client";

import { LaboratoryStudioHeader } from "@/components/laboratory/laboratory-studio-header";
import { SERIES_LIMIT_WORKFLOW_TABS } from "../constants";
import type { SeriesLimitExperienceLevel, SeriesLimitPreset, SeriesLimitWorkspaceTab } from "../types";

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
    activeTab: SeriesLimitWorkspaceTab;
    setActiveTab: (value: SeriesLimitWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: SeriesLimitExperienceLevel;
    setExperienceLevel: (value: SeriesLimitExperienceLevel) => void;
    presets: readonly SeriesLimitPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: SeriesLimitPreset) => void;
}) {
    return (
        <LaboratoryStudioHeader
            moduleLabel="Series / Limit"
            tabs={SERIES_LIMIT_WORKFLOW_TABS}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId as SeriesLimitWorkspaceTab)}
            experienceLevel={experienceLevel}
            setExperienceLevel={(value) => setExperienceLevel(value as SeriesLimitExperienceLevel)}
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
