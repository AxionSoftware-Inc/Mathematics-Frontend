/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BookOpen,
    BriefcaseBusiness,
    CheckCircle2,
    FlaskConical,
    GraduationCap,
    Layers3,
    Newspaper,
    ScrollText,
    Sigma,
    Sparkles,
    X,
    Wand2,
} from "lucide-react";

import {
    writerTemplateAddOns,
    DEFAULT_WRITER_PRESET_ID,
    writerTemplatePresets,
    writerTemplates,
    DEFAULT_WRITER_TEMPLATE_ID,
    type WriterTemplateCategory,
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

const categoryOrder: Array<"all" | WriterTemplateCategory> = [
    "all",
    "research",
    "teaching",
    "proof",
    "expository",
    "report",
    "thesis",
    "book",
    "laboratory",
    "draft",
];

function templateCategoryLabel(category: WriterTemplateCategory) {
    if (category === "research") return "Research";
    if (category === "teaching") return "Teaching";
    if (category === "proof") return "Proof";
    if (category === "expository") return "Expository";
    if (category === "report") return "Report";
    if (category === "thesis") return "Thesis";
    if (category === "book") return "Book";
    if (category === "laboratory") return "Lab";
    return "Draft";
}

function categoryChipLabel(category: "all" | WriterTemplateCategory) {
    if (category === "all") return "All";
    return templateCategoryLabel(category);
}

export function WriteTypeSelector({ isOpen, onClose }: WriteTypeSelectorProps) {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = React.useState<"all" | WriterTemplateCategory>("all");
    const [selectedTemplateId, setSelectedTemplateId] = React.useState(DEFAULT_WRITER_TEMPLATE_ID);
    const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(DEFAULT_WRITER_PRESET_ID);

    React.useEffect(() => {
        if (isOpen) {
            setActiveCategory("all");
            setSelectedTemplateId(DEFAULT_WRITER_TEMPLATE_ID);
            setSelectedPresetId(DEFAULT_WRITER_PRESET_ID);
        }
    }, [isOpen]);

    const visibleTemplates = React.useMemo(() => {
        return activeCategory === "all"
            ? writerTemplates
            : writerTemplates.filter((template) => template.category === activeCategory);
    }, [activeCategory]);

    const selectedTemplate =
        writerTemplates.find((template) => template.id === selectedTemplateId) ??
        writerTemplates.find((template) => template.id === DEFAULT_WRITER_TEMPLATE_ID) ??
        writerTemplates[0];

    const selectedAddOns = writerTemplateAddOns.filter((addOn) =>
        selectedTemplate.recommendedAddOnIds.includes(addOn.id),
    );
    const SelectedIcon = iconMap[selectedTemplate.icon];
    const categoryCount = activeCategory === "all" ? writerTemplates.length : visibleTemplates.length;
    const selectedPreset = selectedPresetId
        ? writerTemplatePresets.find((preset) => preset.id === selectedPresetId) ?? null
        : null;

    if (!isOpen) {
        return null;
    }

    const openDraftWithTemplate = (templateId: string) => {
        const query = new URLSearchParams();
        query.set("template", templateId);
        router.push(`/write/new?${query.toString()}`);
        onClose();
    };

    const openDraftWithPreset = (presetId: string) => {
        const query = new URLSearchParams();
        query.set("preset", presetId);
        router.push(`/write/new?${query.toString()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-xl">
                <div className="border-b border-border/60 bg-background/95 px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="max-w-3xl">
                            <div className="site-eyebrow">Writer Launchpad</div>
                            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight md:text-4xl">
                                Yangi hujjatni to'g'ri template bilan boshlang
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                                Quick start preset yoki to'liq template tanlang. O'ng tomonda tanlangan andozaning
                                tuzilmasi, mos keladigan workflow'i va writerga yuborish tugmasi ko'rinadi.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-full border border-border/60 bg-background/80 p-2.5 text-muted-foreground transition-colors hover:text-foreground"
                            type="button"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="min-h-0 overflow-y-auto border-b border-border/60 bg-background p-6 md:p-8 xl:border-b-0 xl:border-r">
                        <div className="site-eyebrow">Quick Start</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {writerTemplatePresets.map((preset) => {
                                const presetTemplate = writerTemplates.find((template) => template.id === preset.templateId);
                                const PresetIcon = iconMap[presetTemplate?.icon || "sparkles"];
                                const selected = selectedPresetId === preset.id;

                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPresetId(preset.id);
                                            if (presetTemplate) {
                                                setSelectedTemplateId(presetTemplate.id);
                                            }
                                        }}
                                        className={`rounded-[1.2rem] border p-3.5 text-left ${
                                            selected
                                                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
                                                : "border-border/60 bg-background/80 hover:border-[var(--accent)]/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                                    <PresetIcon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-bold tracking-tight text-foreground">{preset.title}</div>
                                                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                                        {presetTemplate ? templateCategoryLabel(presetTemplate.category) : "Preset"}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-border/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                                Preset
                                            </span>
                                        </div>
                                        {selected ? (
                                            <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Tanlangan
                                            </div>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4">
                            <div>
                                <div className="site-eyebrow">Template Library</div>
                                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                    Ko'proq nazorat kerak bo'lsa, quyidan template tanlang. Tanlangan andoza bir marta
                                    belgilanadi va o'ng tomonda darhol tekshiriladi.
                                </p>
                            </div>
                            <div className="hidden items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground md:flex">
                                <Layers3 className="h-4 w-4" />
                                {categoryCount} templates
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {categoryOrder.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setActiveCategory(category)}
                                    className={`site-chip ${activeCategory === category ? "site-chip-active" : ""}`}
                                >
                                    {categoryChipLabel(category)}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                            {visibleTemplates.map((template) => {
                                const Icon = iconMap[template.icon];
                                const selected = template.id === selectedTemplate.id;

                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTemplateId(template.id);
                                            setSelectedPresetId(null);
                                        }}
                                        className={`rounded-[1.35rem] border p-4 text-left ${
                                            selected
                                                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
                                                : "border-border/60 bg-background/70 hover:border-[var(--accent)]/20 hover:bg-background"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${template.accentClassName}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                {templateCategoryLabel(template.category)}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-base font-bold tracking-tight">{template.title}</div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {template.recommendedFor.slice(0, 1).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            {selected ? (
                                                <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Tanlangan
                                                </span>
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="min-h-0 overflow-y-auto bg-muted/20 p-6 md:p-8">
                        <div className="site-panel-strong p-5 md:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] border ${selectedTemplate.accentClassName}`}>
                                    <SelectedIcon className="h-6 w-6" />
                                </div>
                                <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                    {templateCategoryLabel(selectedTemplate.category)}
                                </span>
                            </div>

                            <h3 className="mt-4 font-serif text-2xl font-black">{selectedTemplate.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedTemplate.shortDescription}</p>

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Category</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{templateCategoryLabel(selectedTemplate.category)}</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Audience</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{selectedTemplate.recommendedFor.length}</div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Add-ons</div>
                                    <div className="mt-2 text-sm font-bold text-foreground">{selectedAddOns.length}</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => (selectedPreset ? openDraftWithPreset(selectedPreset.id) : openDraftWithTemplate(selectedTemplate.id))}
                                className="site-button-primary mt-6 w-full"
                            >
                                {selectedPreset ? "Shu preset bilan davom etish" : "Shu andoza bilan davom etish"}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                            <div className="site-panel p-4">
                                <div className="site-eyebrow">Recommended For</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedTemplate.recommendedFor.slice(0, 4).map((item) => (
                                        <span key={item} className="site-chip !px-3 !py-2 !text-[10px]">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="site-panel p-4">
                                <div className="site-eyebrow">Included Structure</div>
                                <div className="mt-3 space-y-2">
                                    {selectedAddOns.length ? (
                                        selectedAddOns.slice(0, 3).map((addOn) => (
                                            <div key={addOn.id} className="site-outline-card px-3 py-3">
                                                <div className="text-sm font-semibold">{addOn.title}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="site-outline-card px-3 py-3 text-sm leading-6 text-muted-foreground">
                                            Bu template minimal start uchun mo'ljallangan. Qo'shimcha bloklar talab qilinmaydi.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="site-panel p-4">
                                <div className="site-eyebrow">Workflow Note</div>
                                <div className="mt-3 rounded-[1.2rem] border border-border/60 bg-background/70 px-3 py-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                            <Wand2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">Template first, editing second</div>
                                            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                                Preset tanlansa u faqat yo'nalishni belgilaydi. Writer faqat o'ngdagi asosiy
                                                tugma bosilganda ochiladi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
