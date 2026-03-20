"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BookOpen,
    BriefcaseBusiness,
    Check,
    FlaskConical,
    GraduationCap,
    Layers3,
    Newspaper,
    ScrollText,
    Sigma,
    Sparkles,
    WandSparkles,
    X,
} from "lucide-react";

import {
    getDefaultWriterTemplatePreset,
    writerTemplateAddOns,
    writerTemplatePresets,
    writerTemplates,
    type WriterTemplate,
    type WriterTemplateAddOnIcon,
    type WriterTemplateIcon,
} from "@/lib/writer-templates";

interface WriteTypeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const iconMap: Record<WriterTemplateIcon, typeof BookOpen> = {
    "book-open": BookOpen,
    briefcase: BriefcaseBusiness,
    flask: FlaskConical,
    "graduation-cap": GraduationCap,
    newspaper: Newspaper,
    "scroll-text": ScrollText,
    sparkles: Sparkles,
    sigma: Sigma,
};

const addOnIconMap: Record<WriterTemplateAddOnIcon, typeof Sigma> = {
    briefcase: BriefcaseBusiness,
    "graduation-cap": GraduationCap,
    newspaper: Newspaper,
    "scroll-text": ScrollText,
    sparkles: Sparkles,
    sigma: Sigma,
};

function templateCategoryLabel(template: WriterTemplate) {
    if (template.category === "research") return "Research";
    if (template.category === "teaching") return "Teaching";
    if (template.category === "proof") return "Proof";
    if (template.category === "expository") return "Expository";
    if (template.category === "report") return "Report";
    if (template.category === "thesis") return "Thesis";
    if (template.category === "laboratory") return "Lab";
    return "Draft";
}

export function WriteTypeSelector({ isOpen, onClose }: WriteTypeSelectorProps) {
    const router = useRouter();
    const defaultPreset = getDefaultWriterTemplatePreset();
    const [selectedPresetId, setSelectedPresetId] = React.useState(defaultPreset?.id ?? "");
    const [selectedTemplateId, setSelectedTemplateId] = React.useState(
        defaultPreset?.templateId ?? writerTemplates[0]?.id ?? "",
    );
    const [selectedAddOnIds, setSelectedAddOnIds] = React.useState<string[]>(
        defaultPreset?.addOnIds ?? writerTemplates[0]?.recommendedAddOnIds ?? [],
    );

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const preset = getDefaultWriterTemplatePreset();
        setSelectedPresetId(preset?.id ?? "");
        setSelectedTemplateId(preset?.templateId ?? writerTemplates[0]?.id ?? "");
        setSelectedAddOnIds(preset?.addOnIds ?? writerTemplates[0]?.recommendedAddOnIds ?? []);
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const selectedTemplate =
        writerTemplates.find((template) => template.id === selectedTemplateId) ?? writerTemplates[0];
    const selectedAddOns = writerTemplateAddOns.filter((addOn) => selectedAddOnIds.includes(addOn.id));

    const openDraft = ({
        presetId,
        templateId,
        addOnIds,
    }: {
        presetId?: string;
        templateId: string;
        addOnIds: string[];
    }) => {
        const query = new URLSearchParams();
        query.set("template", templateId);
        if (presetId) {
            query.set("preset", presetId);
        }
        if (addOnIds.length) {
            query.set("addons", addOnIds.join(","));
        }

        router.push(`/write/new?${query.toString()}`);
        onClose();
    };

    const handleQuickLaunch = (presetId: string) => {
        const preset = writerTemplatePresets.find((entry) => entry.id === presetId);
        if (!preset) {
            return;
        }

        openDraft({
            presetId: preset.id,
            templateId: preset.templateId,
            addOnIds: preset.addOnIds,
        });
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = writerTemplates.find((entry) => entry.id === templateId);
        setSelectedPresetId("");
        setSelectedTemplateId(templateId);
        setSelectedAddOnIds(template?.recommendedAddOnIds ?? []);
    };

    const toggleAddOn = (addOnId: string) => {
        setSelectedPresetId("");
        setSelectedAddOnIds((current) =>
            current.includes(addOnId) ? current.filter((item) => item !== addOnId) : [...current, addOnId],
        );
    };

    return (
        <div className="fixed inset-0 z-[100] p-3 md:p-6">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

            <div className="site-panel-strong relative mx-auto flex h-full max-h-[94vh] w-full max-w-7xl overflow-hidden">
                <div className="grid min-h-0 w-full xl:grid-cols-[0.82fr_1.18fr]">
                    <aside className="relative min-h-0 overflow-y-auto border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.94))] p-6 md:p-8 xl:border-b-0 xl:border-r dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.96))]">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                <WandSparkles className="h-4 w-4 text-[var(--accent)]" />
                                New Article Flow
                            </div>
                            <h2 className="site-display mt-5 text-4xl md:text-5xl">
                                Yangi maqolani endi ko&apos;proq bosqichsiz ochish mumkin.
                            </h2>
                            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
                                Eng ko&apos;p ishlatiladigan rejimlar uchun bir bosishda draft oching. Kerak
                                bo&apos;lsa pastda template va qo&apos;shimcha bloklarni aniq sozlab oling.
                            </p>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                        Quick launch
                                    </div>
                                    <div className="mt-1 text-2xl font-black">Tayyor start rejimlari</div>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                    1 click
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {writerTemplatePresets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleQuickLaunch(preset.id)}
                                        className="group rounded-[1.6rem] border border-border/60 bg-background/72 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-teal-500/35 hover:shadow-lg"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-lg font-black">{preset.title}</div>
                                                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    {preset.description}
                                                </div>
                                            </div>
                                            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 rounded-[2rem] border border-border/60 bg-background/78 p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                        Tanlangan draft
                                    </div>
                                    <div className="mt-1 text-2xl font-black">{selectedTemplate.title}</div>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                    {templateCategoryLabel(selectedTemplate)}
                                </div>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {selectedTemplate.shortDescription}
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        Preset
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-foreground">
                                        {selectedPresetId
                                            ? writerTemplatePresets.find((preset) => preset.id === selectedPresetId)
                                                  ?.title ?? selectedPresetId
                                            : "Custom setup"}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        Add-ons
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-foreground">
                                        {selectedAddOns.length ? `${selectedAddOns.length} ta blok` : "Minimal draft"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-border/60 bg-muted/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                    Nimalar qo&apos;shiladi
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedTemplate.recommendedFor.map((entry) => (
                                        <span
                                            key={entry}
                                            className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                                        >
                                            {entry}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 text-sm leading-6 text-muted-foreground">
                                    {selectedAddOns.length
                                        ? selectedAddOns.map((addOn) => addOn.title).join(", ")
                                        : "Qo'shimcha blok tanlanmagan. Tez, toza qoralama ochiladi."}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    openDraft({
                                        presetId: selectedPresetId || undefined,
                                        templateId: selectedTemplate.id,
                                        addOnIds: selectedAddOnIds,
                                    })
                                }
                                className="site-button-primary mt-5 w-full"
                            >
                                Tanlangan draftni ochish
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </aside>

                    <div className="flex min-h-0 flex-col bg-background/60">
                        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4 md:px-7">
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    Advanced setup
                                </div>
                                <div className="mt-1 text-lg font-black md:text-2xl">
                                    Template va bloklarni qulay tanlang
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full border border-border/60 bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6">
                            <div className="rounded-[1.8rem] border border-border/60 bg-muted/10 p-5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Qadam 1
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        Preset tanlansa, template va add-onlar avtomatik moslanadi.
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {writerTemplatePresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPresetId(preset.id);
                                                setSelectedTemplateId(preset.templateId);
                                                setSelectedAddOnIds(preset.addOnIds);
                                            }}
                                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                                                selectedPresetId === preset.id
                                                    ? "border-teal-500/35 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                                                    : "border-border/60 bg-background/70 text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {preset.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            Qadam 2
                                        </div>
                                        <div className="mt-1 text-2xl font-black">Template tanlash</div>
                                    </div>
                                    <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        {writerTemplates.length} variant
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    {writerTemplates.map((template) => {
                                        const Icon = iconMap[template.icon];
                                        const isActive = selectedTemplate.id === template.id;

                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => handleTemplateSelect(template.id)}
                                                className={`group flex h-full flex-col rounded-[1.8rem] border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                                                    isActive
                                                        ? "border-foreground/20 bg-muted/25 shadow-lg"
                                                        : "border-border/60 bg-background/75 hover:border-teal-500/20 hover:bg-muted/15"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div
                                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${template.accentClassName}`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                                        {templateCategoryLabel(template)}
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex-1">
                                                    <h3 className="text-xl font-black">{template.title}</h3>
                                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                        {template.shortDescription}
                                                    </p>
                                                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                                                        {template.description}
                                                    </p>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {template.recommendedFor.slice(0, 2).map((entry) => (
                                                        <span
                                                            key={entry}
                                                            className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                                                        >
                                                            {entry}
                                                        </span>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            Qadam 3
                                        </div>
                                        <div className="mt-1 text-2xl font-black">Qo&apos;shimcha bloklar</div>
                                    </div>
                                    <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        {selectedAddOnIds.length} tanlandi
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3">
                                    {writerTemplateAddOns.map((addOn) => {
                                        const AddOnIcon = addOnIconMap[addOn.icon];
                                        const checked = selectedAddOnIds.includes(addOn.id);

                                        return (
                                            <button
                                                key={addOn.id}
                                                type="button"
                                                onClick={() => toggleAddOn(addOn.id)}
                                                className={`flex items-start gap-4 rounded-[1.6rem] border px-4 py-4 text-left transition-colors ${
                                                    checked
                                                        ? "border-teal-500/35 bg-teal-500/10"
                                                        : "border-border/60 bg-background/75 hover:bg-muted/15"
                                                }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                                        checked ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {checked ? <Check className="h-4 w-4" /> : <AddOnIcon className="h-4 w-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black">{addOn.title}</div>
                                                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {addOn.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border/60 px-5 py-4 md:px-7">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="text-sm leading-6 text-muted-foreground">
                                    Hozirgi konfiguratsiya bilan draft ichiga title, abstract va kerakli bloklar
                                    tayyor holda qo&apos;shiladi.
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-background/70 px-5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openDraft({
                                                presetId: selectedPresetId || undefined,
                                                templateId: selectedTemplate.id,
                                                addOnIds: selectedAddOnIds,
                                            })
                                        }
                                        className="site-button-primary"
                                    >
                                        Draftni ochish
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
