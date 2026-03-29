import React from "react";

import { MATRIX_WORKFLOW_TABS } from "../constants";
import { LaboratoryStudioHeader } from "@/components/laboratory/laboratory-studio-header";
import type { MatrixExperienceLevel, MatrixPreset, MatrixWorkspaceTab } from "../types";

type Props = {
    activeTab: MatrixWorkspaceTab;
    setActiveTab: (tab: MatrixWorkspaceTab) => void;
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: MatrixExperienceLevel;
    setExperienceLevel: (value: MatrixExperienceLevel) => void;
    presets: readonly MatrixPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: MatrixPreset) => void;
};

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
}: Props) {
    return (
        <LaboratoryStudioHeader
            moduleLabel="Matrix"
            tabs={MATRIX_WORKFLOW_TABS}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId as MatrixWorkspaceTab)}
            experienceLevel={experienceLevel}
            setExperienceLevel={(value) => setExperienceLevel(value as MatrixExperienceLevel)}
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
