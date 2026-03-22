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
} from "lucide-react";

import {
    writerTemplateAddOns,
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

    React.useEffect(() => {
        if (isOpen) {
            setActiveCategory("all");
            setSelectedTemplateId("research-paper");
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
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-2xl">
                <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_30%),radial-gradient(circle_at_top_right,rgba(15,118,110,0.08),transparent_24%)] px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="max-w-3xl">
                            <div className="site-eyebrow">Writer Start</div>
                            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight md:text-4xl">
                                Yangi hujjatni aniq andoza bilan boshlang
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                                Avval tez boshlash presetini tanlang yoki pastdagi template'lardan birini belgilang.
                                Tanlov o'ng tomonda darhol tushuntiriladi, so'ng bitta tugma bilan writer ochiladi.
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

                <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="min-h-0 overflow-y-auto border-b border-border/60 p-6 md:p-8 xl:border-b-0 xl:border-r">
                        <div className="site-eyebrow">Quick Start</div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {writerTemplatePresets.map((preset) => {
                                const presetTemplate = writerTemplates.find((template) => template.id === preset.templateId);
                                const PresetIcon = iconMap[presetTemplate?.icon || "sparkles"];

                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => openDraftWithPreset(preset.id)}
                                        className="group rounded-[1.7rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.58))] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.66))]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                                <PresetIcon className="h-5 w-5" />
                                            </div>
                                            <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                Preset
                                            </span>
                                        </div>
                                        <div className="mt-5">
                                            <div className="text-xl font-bold tracking-tight">{preset.title}</div>
                                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{preset.description}</p>
                                        </div>
                                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
                                            Tez boshlash
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4">
                            <div>
                                <div className="site-eyebrow">All Templates</div>
                                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                    Ko'proq nazorat kerak bo'lsa, quyidan template tanlang. O'ng tomonda uning maqsadi va tavsiya etilgan bloklari ko'rinadi.
                                </p>
                            </div>
                            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground md:flex">
                                <Layers3 className="h-5 w-5" />
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

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {visibleTemplates.map((template) => {
                                const Icon = iconMap[template.icon];
                                const selected = template.id === selectedTemplate.id;

                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={`rounded-[1.65rem] border p-5 text-left transition-all ${
                                            selected
                                                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] shadow-lg"
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

                                        <div className="mt-5">
                                            <div className="text-lg font-bold tracking-tight">{template.title}</div>
                                            <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                                {template.shortDescription}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-3">
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

                    <aside className="min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.38))] p-6 md:p-8 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(15,23,42,0.54))]">
                        <div className="site-panel-strong p-6 md:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] border ${selectedTemplate.accentClassName}`}>
                                    <SelectedIcon className="h-6 w-6" />
                                </div>
                                <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                    {templateCategoryLabel(selectedTemplate.category)}
                                </span>
                            </div>

                            <h3 className="mt-5 font-serif text-3xl font-black">{selectedTemplate.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">{selectedTemplate.description}</p>

                            <button
                                type="button"
                                onClick={() => openDraftWithTemplate(selectedTemplate.id)}
                                className="site-button-primary mt-6 w-full"
                            >
                                Shu andoza bilan davom etish
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6">
                            <div className="site-panel p-6">
                                <div className="site-eyebrow">Recommended For</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedTemplate.recommendedFor.map((item) => (
                                        <span key={item} className="site-chip !px-3 !py-2 !text-[10px]">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="site-eyebrow">Included Structure</div>
                                <div className="mt-4 space-y-3">
                                    {selectedAddOns.length ? (
                                        selectedAddOns.map((addOn) => (
                                            <div key={addOn.id} className="site-outline-card p-4">
                                                <div className="text-sm font-semibold">{addOn.title}</div>
                                                <p className="mt-2 text-sm leading-7 text-muted-foreground">{addOn.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="site-outline-card p-4 text-sm leading-7 text-muted-foreground">
                                            Bu template minimal start uchun mo'ljallangan. Qo'shimcha bloklar talab qilinmaydi.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="site-eyebrow">Selection Note</div>
                                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                    Agar tezroq kirish kerak bo'lsa, yuqoridagi presetlardan birini bosing. Agar strukturani
                                    o'zingiz nazorat qilmoqchi bo'lsangiz, aynan shu template bilan davom eting.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
