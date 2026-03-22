"use client";

import Link from "next/link";
import {
    ArrowRight,
    BookMarked,
    BookOpenText,
    FlaskConical,
    Newspaper,
    Orbit,
    ScrollText,
    Sparkles,
} from "lucide-react";

import { SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const flagshipFeatures = [
    {
        title: "Interaktiv Lab",
        description:
            "Hisoblash, grafika, 2D/3D vizualizatsiya va eksperimental modullar bitta tadqiqot maydonida jamlangan.",
        eyebrow: "Laboratoriya",
        href: "/laboratory",
        icon: FlaskConical,
        accent: "from-teal-500/18 via-cyan-500/10 to-transparent",
        bullets: ["Vizual simulyatsiya", "Notebook-style tajriba", "Natijani writer'ga uzatish"],
    },
    {
        title: "Ilmiy Maqola Pipeline",
        description:
            "Qoralama, formal strukturа, citation va preview oqimini yozishdan topshirishgacha bir joyda olib boradi.",
        eyebrow: "Scientific Writer",
        href: "/write",
        icon: ScrollText,
        accent: "from-blue-500/18 via-indigo-500/10 to-transparent",
        bullets: ["Template bilan boshlash", "Markdown + formula", "Preview va eksport"],
    },
    {
        title: "Akademik Kutubxona",
        description:
            "Kitoblar, darsliklar va referens materiallar strukturalangan katalog ko'rinishida tez topiladi.",
        eyebrow: "Kitoblar",
        href: "/library",
        icon: BookMarked,
        accent: "from-amber-500/18 via-orange-500/10 to-transparent",
        bullets: ["Tematik katalog", "Nazariya uchun tayanch", "Bir xil editorial UI"],
    },
    {
        title: "Maqolalar va Sharhlar",
        description:
            "Ilmiy-ommabop maqolalar, tushuntirishlar va tahrirlangan materiallar bir xil professional ritmda beriladi.",
        eyebrow: "Editorial",
        href: "/academy",
        icon: Newspaper,
        accent: "from-rose-500/18 via-fuchsia-500/10 to-transparent",
        bullets: ["Tushuntiruvchi materiallar", "Mavzu bo'yicha oqim", "O'qilishi tez layout"],
    },
];

const commandDeck = [
    { value: "4", label: "asosiy akademik yo'nalish" },
    { value: "1", label: "birlashtirilgan brend tizimi" },
    { value: "24/7", label: "raqamli foydalanish rejimi" },
];

const workflow = [
    "Labda model yoki hisoblashni tekshirish",
    "Writer ichida ilmiy maqolani shakllantirish",
    "Kutubxona va maqolalardan tayanch olish",
    "Tartibli preview bilan final ko'rinishni tekshirish",
];

export function SiteFlagshipShowcase() {
    return (
        <>
            <SiteSection className="pt-6">
                <SiteContainer>
                    <div className="site-panel-strong overflow-hidden p-0">
                        <div className="grid xl:grid-cols-[0.82fr_1.18fr]">
                            <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.92))] p-7 md:p-8 xl:border-b-0 xl:border-r dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.94))]">
                                <div className="site-eyebrow">Flagship Experience</div>
                                <h2 className="site-display mt-4 text-3xl md:text-4xl xl:text-[3.5rem]">
                                    Lab, maqola, kitob va editorial oqim bir bosh sahifada kuchli ko&apos;rinishi kerak.
                                </h2>
                                <p className="site-lead mt-5 max-w-xl">
                                    Bu blok platformaning eng kuchli modullarini birdan ko&apos;rsatadi: foydalanuvchi
                                    saytga kirganda aynan nimasi bilan farq qilishini darhol his qilishi kerak.
                                </p>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    {commandDeck.map((item) => (
                                        <div key={item.label} className="site-metric-card p-4">
                                            <div className="site-display text-3xl">{item.value}</div>
                                            <div className="mt-2 text-sm font-semibold text-muted-foreground">
                                                {item.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 rounded-[2rem] border border-border/60 bg-background/70 p-5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                        <Orbit className="h-4 w-4 text-[var(--accent)]" />
                                        Tadqiqot oqimi
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {workflow.map((step, index) => (
                                            <div
                                                key={step}
                                                className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-black text-background">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
                                {flagshipFeatures.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="group relative overflow-hidden rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        <div
                                            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-90`}
                                        />
                                        <div className="relative">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm">
                                                    <feature.icon className="h-6 w-6 text-[var(--accent)]" />
                                                </div>
                                                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                    {feature.eyebrow}
                                                </div>
                                            </div>

                                            <h3 className="mt-6 font-serif text-3xl font-black tracking-tight">
                                                {feature.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                                {feature.description}
                                            </p>

                                            <div className="mt-5 space-y-2">
                                                {feature.bullets.map((bullet) => (
                                                    <div
                                                        key={bullet}
                                                        className="rounded-2xl border border-border/50 bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                                                    >
                                                        {bullet}
                                                    </div>
                                                ))}
                                            </div>

                                            <Link
                                                href={feature.href}
                                                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground"
                                            >
                                                O&apos;tish
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-6">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <SectionHeading
                            eyebrow="Knowledge Coverage"
                            title="Platforma faqat bo'limlar to'plami emas, to'liq akademik kontur."
                            description="Foydalanuvchi bir joyda hisoblaydi, boshqa joyda yozadi, keyin esa kitob va maqolalar bilan mustahkamlaydi."
                        />

                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: "Kitoblar fondi",
                                    text: "Nazariy tayanch, darslik va monografiyalarni izchil katalog bilan ko'rsatish.",
                                    icon: BookOpenText,
                                },
                                {
                                    title: "Jurnal sifati",
                                    text: "Formal ilmiy maqola ko'rinishi, preview va topshirish ruhidagi UX.",
                                    icon: ScrollText,
                                },
                                {
                                    title: "Eksperimental layer",
                                    text: "Grafika, hisoblash va vizual laboratoriya natijasini yozuvga ulash.",
                                    icon: Sparkles,
                                },
                            ].map((item) => (
                                <div key={item.title} className="site-panel p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div className="mt-5 font-serif text-2xl font-black">{item.title}</div>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </>
    );
}
