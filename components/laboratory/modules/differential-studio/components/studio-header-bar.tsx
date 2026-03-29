import React from "react";

import { LaboratoryStudioHeader } from "@/components/laboratory/laboratory-studio-header";
import type { DifferentialExperienceLevel, DifferentialExtendedMode, DifferentialWorkspaceTab } from "../types";

type HeaderTab = {
    id: DifferentialWorkspaceTab;
    label: string;
};

type WorkflowTemplate = {
    id: string;
    label: string;
    description: string;
};

type Preset = {
    label: string;
    mode: DifferentialExtendedMode;
    expr: string;
    variable?: string;
    point?: string;
    order?: string;
    direction?: string;
};

export function StudioHeaderBar({
    activeTab,
    setActiveTab,
    availableTabs,
    tabs,
    templatesOpen,
    setTemplatesOpen,
    experienceLevel,
    setExperienceLevel,
    workflowTemplates,
    activeTemplateId,
    applyWorkflowTemplate,
    presets,
    activePresetLabel,
    applyPreset,
}: {
    activeTab: DifferentialWorkspaceTab;
    setActiveTab: (value: DifferentialWorkspaceTab) => void;
    availableTabs: readonly DifferentialWorkspaceTab[];
    tabs: readonly HeaderTab[];
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: DifferentialExperienceLevel;
    setExperienceLevel: (value: DifferentialExperienceLevel) => void;
    workflowTemplates: readonly WorkflowTemplate[];
    activeTemplateId: string | null;
    applyWorkflowTemplate: (id: string) => void;
    presets: readonly Preset[];
    activePresetLabel?: string;
    applyPreset: (preset: Preset) => void;
}) {
    return (
        <LaboratoryStudioHeader
            moduleLabel="Differential"
            tabs={tabs.filter((tab) => availableTabs.includes(tab.id))}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId as DifferentialWorkspaceTab)}
            experienceLevel={experienceLevel}
            setExperienceLevel={(value) => setExperienceLevel(value as DifferentialExperienceLevel)}
            templatesOpen={templatesOpen}
            onToggleTemplates={() => setTemplatesOpen((current) => !current)}
            onCloseTemplates={() => setTemplatesOpen(false)}
            templateSections={[
                {
                    id: "workflows",
                    title: "Workflow Templates",
                    items: workflowTemplates.map((template) => ({
                        id: template.id,
                        title: template.label,
                        description: template.description,
                        meta: "workflow",
                        recommended: template.id === workflowTemplates[0]?.id,
                        badge: activeTemplateId === template.id ? "Active" : undefined,
                        active: activeTemplateId === template.id,
                        onSelect: () => applyWorkflowTemplate(template.id),
                    })),
                },
                {
                    id: "presets",
                    title: "Problem Presets",
                    items: presets.map((preset) => ({
                        id: preset.label,
                        title: preset.label,
                        description: preset.mode,
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
