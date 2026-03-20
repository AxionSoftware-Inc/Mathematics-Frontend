"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
    Check,
    X, 
    BookOpen, 
    BriefcaseBusiness,
    FlaskConical,
    GraduationCap,
    Newspaper, 
    ScrollText,
    Sparkles, 
    ArrowRight,
    Sigma
} from "lucide-react";
import { getDefaultWriterTemplatePreset, writerTemplateAddOns, writerTemplatePresets, writerTemplates, type WriterTemplate, type WriterTemplateAddOnIcon, type WriterTemplateIcon } from "@/lib/writer-templates";

interface WriteTypeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const iconMap: Record<WriterTemplateIcon, typeof BookOpen> = {
    "book-open": BookOpen,
    "briefcase": BriefcaseBusiness,
    flask: FlaskConical,
    "graduation-cap": GraduationCap,
    newspaper: Newspaper,
    "scroll-text": ScrollText,
    sparkles: Sparkles,
    sigma: Sigma,
};

const addOnIconMap: Record<WriterTemplateAddOnIcon, typeof Sigma> = {
    "briefcase": BriefcaseBusiness,
    "graduation-cap": GraduationCap,
    "newspaper": Newspaper,
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
    const [selectedTemplateId, setSelectedTemplateId] = React.useState(defaultPreset?.templateId ?? writerTemplates[0]?.id ?? "");
    const [selectedAddOnIds, setSelectedAddOnIds] = React.useState<string[]>(defaultPreset?.addOnIds ?? writerTemplates[0]?.recommendedAddOnIds ?? []);

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const preset = getDefaultWriterTemplatePreset();
        setSelectedPresetId(preset?.id ?? "");
        setSelectedTemplateId(preset?.templateId ?? writerTemplates[0]?.id ?? "");
        setSelectedAddOnIds(preset?.addOnIds ?? writerTemplates[0]?.recommendedAddOnIds ?? []);
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedTemplate =
        writerTemplates.find((template) => template.id === selectedTemplateId) ?? writerTemplates[0];

    const applyPreset = (presetId: string) => {
        const preset = writerTemplatePresets.find((entry) => entry.id === presetId);
        if (!preset) {
            return;
        }

        setSelectedPresetId(preset.id);
        setSelectedTemplateId(preset.templateId);
        setSelectedAddOnIds(preset.addOnIds);
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

    const handleSelect = () => {
        const query = new URLSearchParams();
        query.set("template", selectedTemplate.id);
        if (selectedPresetId) {
            query.set("preset", selectedPresetId);
        }
        if (selectedAddOnIds.length) {
            query.set("addons", selectedAddOnIds.join(","));
        }

        router.push(`/write/new?${query.toString()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="site-panel-strong relative flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="absolute right-6 top-6">
                    <button 
                        onClick={onClose}
                        className="rounded-full border border-border bg-background/50 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col overflow-hidden p-6 md:p-8">
                    <div className="mb-6">
                        <div className="site-eyebrow mb-2 text-accent">Writer Workspace</div>
                        <h2 className="site-display text-4xl md:text-5xl">Qanday maqola <br /> <span className="site-kicker">yozmoqchisiz?</span></h2>
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                            Avval template tanlang, keyin maqola ichiga oldindan qo&apos;shiladigan kerakli bloklarni belgilang.
                        </p>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                            0. Quick preset
                        </div>
                        <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                            1. Template tanlash
                        </div>
                        <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                            2. Add-on qo&apos;shish
                        </div>
                        <div className="rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
                            3. Draft ochish
                        </div>
                    </div>

                    <div className="mb-5 rounded-[2rem] border border-border/60 bg-background/60 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                            Quick presets
                        </div>
                        <div className="mt-1 text-lg font-black">Bir bosishda tayyor konfiguratsiya</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {writerTemplatePresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyPreset(preset.id)}
                                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                                        selectedPresetId === preset.id
                                            ? "border-teal-500/30 bg-teal-500/10"
                                            : "border-border/60 bg-background/55 hover:bg-muted/20"
                                    }`}
                                >
                                    <div className="text-sm font-black">{preset.title}</div>
                                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        {preset.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="min-h-0 overflow-y-auto pr-1">
                            <div className="grid gap-4 md:grid-cols-2">
                                {writerTemplates.map((template) => {
                            const Icon = iconMap[template.icon];
                            return (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => handleTemplateSelect(template.id)}
                                className={`group flex h-full flex-col items-start gap-5 rounded-[2rem] border p-6 text-left transition-all duration-300 hover:bg-muted/30 hover:-translate-y-0.5 ${
                                    selectedTemplate.id === template.id
                                        ? "border-foreground/30 bg-muted/30 ring-1 ring-foreground/10"
                                        : template.accentClassName
                                }`}
                            >
                                <div className="flex w-full items-start justify-between gap-4">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${template.accentClassName} group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                        {templateCategoryLabel(template)}
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold font-playfair">{template.title}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                        {template.shortDescription}
                                    </p>
                                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {template.recommendedFor.slice(0, 2).map((entry) => (
                                        <span
                                            key={entry}
                                            className="rounded-full border border-border/60 bg-background/65 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                                        >
                                            {entry}
                                        </span>
                                    ))}
                                </div>

                                <div className="hidden w-full md:flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Tanlash</span>
                                    <ArrowRight className="h-5 w-5 text-accent" />
                                </div>
                            </button>
                        )})}
                            </div>
                        </div>

                        <div className="min-h-0 overflow-y-auto rounded-[2rem] border border-border/60 bg-background/65 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                        Tanlangan template
                                    </div>
                                    <div className="mt-1 text-2xl font-black">{selectedTemplate.title}</div>
                                </div>
                                <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    {templateCategoryLabel(selectedTemplate)}
                                </div>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {selectedTemplate.description}
                            </p>

                            <div className="mt-5">
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    Tavsiya etiladi
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedTemplate.recommendedFor.map((entry) => (
                                        <span
                                            key={entry}
                                            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                                        >
                                            {entry}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            Qo'shimcha bloklar
                                        </div>
                                        <div className="mt-1 text-lg font-black">Template bilan birga qo'shiladi</div>
                                    </div>
                                    <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        {selectedAddOnIds.length} tanlandi
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {writerTemplateAddOns.map((addOn) => {
                                        const AddOnIcon = addOnIconMap[addOn.icon];
                                        const checked = selectedAddOnIds.includes(addOn.id);
                                        return (
                                            <button
                                                key={addOn.id}
                                                type="button"
                                                onClick={() => toggleAddOn(addOn.id)}
                                                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors ${
                                                    checked
                                                        ? "border-teal-500/30 bg-teal-500/10"
                                                        : "border-border/60 bg-background/55 hover:bg-muted/20"
                                                }`}
                                            >
                                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                                    {checked ? <Check className="h-4 w-4" /> : <AddOnIcon className="h-4 w-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black">{addOn.title}</div>
                                                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {addOn.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    Draft preview
                                </div>
                                    <div className="mt-2 text-sm text-muted-foreground leading-6">
                                        <div>
                                            <span className="font-semibold text-foreground">Preset:</span>{" "}
                                            {selectedPresetId
                                                ? writerTemplatePresets.find((preset) => preset.id === selectedPresetId)?.title ?? selectedPresetId
                                                : "custom"}
                                        </div>
                                        <div><span className="font-semibold text-foreground">Title:</span> {selectedTemplate.titleTemplate}</div>
                                        <div className="mt-2"><span className="font-semibold text-foreground">Keywords:</span> {selectedTemplate.keywords}</div>
                                        <div className="mt-2">
                                            <span className="font-semibold text-foreground">Add-ons:</span>{" "}
                                            {selectedAddOnIds.length
                                                ? writerTemplateAddOns
                                                      .filter((addOn) => selectedAddOnIds.includes(addOn.id))
                                                      .map((addOn) => addOn.title)
                                                      .join(", ")
                                                : "yo'q"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-border/50 pt-5 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Avval template, keyin kerakli bloklarni tanlang. Keyingi sahifada draft tayyor holatda ochiladi.
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
                                onClick={handleSelect}
                                className="site-button-primary"
                            >
                                Draftni ochish
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border/50 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                            Powered by <span className="text-foreground">MathSphere</span> Intelligence
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
