import React from "react";

import { LaboratoryStudioHeader } from "@/components/laboratory/laboratory-studio-header";
import { IntegralExperienceLevel, IntegralWorkspaceTab } from "../types";

type HeaderTab = {
    id: IntegralWorkspaceTab;
    label: string;
};

type WorkflowTemplate = {
    id: string;
    title: string;
    description: string;
};

type ProblemPreset = {
    label: string;
    mode: string;
    expr: string;
};

type StudioHeaderBarProps = {
    activeTab: IntegralWorkspaceTab;
    setActiveTab: (tab: IntegralWorkspaceTab) => void;
    availableTabs: readonly IntegralWorkspaceTab[];
    tabs: readonly HeaderTab[];
    templatesOpen: boolean;
    setTemplatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    experienceLevel: IntegralExperienceLevel;
    setExperienceLevel: (value: IntegralExperienceLevel) => void;
    workflowTemplates: readonly WorkflowTemplate[];
    activeTemplateId: string | null;
    applyWorkflowTemplate: (id: string) => void;
    presets: readonly ProblemPreset[];
    activePresetLabel?: string;
    applyPreset: (preset: ProblemPreset) => void;
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
}: StudioHeaderBarProps) {
    return (
        <LaboratoryStudioHeader
            moduleLabel="Integral"
            tabs={tabs.filter((tab) => availableTabs.includes(tab.id))}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId as IntegralWorkspaceTab)}
            experienceLevel={experienceLevel}
            setExperienceLevel={(value) => setExperienceLevel(value as IntegralExperienceLevel)}
            templatesOpen={templatesOpen}
            onToggleTemplates={() => setTemplatesOpen((current) => !current)}
            onCloseTemplates={() => setTemplatesOpen(false)}
            templateSections={[
                {
                    id: "workflows",
                    title: "Workflow Templates",
                    items: workflowTemplates.map((template) => ({
                        id: template.id,
                        title: template.title,
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
