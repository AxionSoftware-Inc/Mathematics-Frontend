/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, ChartSpline, GraduationCap, Newspaper, Sigma, Sparkles } from "lucide-react";

import { SiteFlagshipShowcase } from "@/components/home/site-flagship-showcase";
import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const capabilities = [
    {
        title: "Academic Library",
        description: "Darsliklar, monografiyalar va ilmiy resurslar tizimli katalog bilan bir joyda.",
        icon: BookOpen,
    },
    {
        title: "Scientific Journal",
        description: "Maqolalarni o'qish, tayyorlash va nashrga olib chiqish uchun bir xil professional muhit.",
        icon: Newspaper,
    },
    {
        title: "Structured Academy",
        description: "Nazariya va amaliyotni bog'laydigan kurslar, instructor profillari va kurs detallari.",
        icon: GraduationCap,
    },
    {
        title: "Visual Laboratory",
        description: "Grafiklar, algebraik simulyatsiya va statistik tahlil uchun eksperimental playground.",
        icon: ChartSpline,
    },
];

const metrics = [
    { value: "500+", label: "Ilmiy maqola oqimi" },
    { value: "1.2k+", label: "Kutubxona materiali" },
    { value: "10k+", label: "Faol o'quvchi va tadqiqotchi" },
    { value: "24/7", label: "Raqamli mavjudlik" },
];

export default function Home() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-14 pt-16 md:pt-24">
                <SiteContainer>
                    <div className="grid items-end gap-10 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Unified Mathematical Ecosystem
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.6rem]">
                                    Matematik bilim,
                                    <span className="site-kicker"> ilmiy tartib </span>
                                    va professional raqamli muhit.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    MathSphere kutubxona, jurnal, akademiya va laboratoriyani bitta akademik tizimga
                                    birlashtiradi. Har sahifa foydalanuvchiga ishonch, aniqlik va professional ritm
                                    berishi kerak degan prinsip bilan qurilmoqda.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/journal" className="site-button-primary">
                                    Jurnalni ko'rish
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/write" className="site-button-secondary">
                                    Writer Workspace
                                </Link>
                            </div>
                        </div>

                        <div className="site-panel-strong p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {metrics.map((metric) => (
                                    <div key={metric.label} className="site-outline-card p-5">
                                        <div className="site-display text-3xl">{metric.value}</div>
                                        <div className="mt-2 text-sm font-semibold text-muted-foreground">{metric.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="site-eyebrow">Core Principle</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Har modul mustaqil kuchli bo'lishi bilan birga, umumiy mahsulot ichida bir xil
                                    professional brend ohangida ishlashi kerak.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-8">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Platforma Tuzilishi"
                        title="Bir yoqlik professional arxitektura"
                        description="Bu yerda foydalanuvchi bir sahifadan boshqasiga o'tganda mahsulot boshqa jamoa tomonidan yasalgan deb his qilmasligi kerak."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {capabilities.map((item) => (
                            <div key={item.title} className="site-panel p-7">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 font-serif text-2xl font-black">{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteFlagshipShowcase />

            <SiteSection>
                <SiteContainer>
                    <div className="site-panel-strong grid gap-10 p-8 md:p-10 xl:grid-cols-[1fr_0.8fr]">
                        <div>
                            <div className="site-eyebrow">Strategic Direction</div>
                            <h2 className="site-display mt-4 text-4xl md:text-5xl">
                                Platforma endi faqat chiroyli emas, ishonchli va qatlamli ko'rinishi kerak.
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {[
                                { icon: Sigma, text: "Matematika uchun toza, jiddiy va editorial vizual til." },
                                { icon: BrainCircuit, text: "Section, card, CTA va header patternlari bir xil tizimda." },
                                { icon: Sparkles, text: "Foydalanuvchi oqimi oson, o'qilishi tez va professional kayfiyatda." },
                            ].map((row) => (
                                <div key={row.text} className="site-outline-card flex items-start gap-4 p-5">
                                    <row.icon className="mt-1 h-5 w-5 text-[var(--accent)]" />
                                    <p className="text-sm leading-7 text-muted-foreground">{row.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
