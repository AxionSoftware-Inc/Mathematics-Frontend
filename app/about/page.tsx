/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { ArrowRight, Globe, Network, ShieldCheck, Sparkles, Users } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const stats = [
    { value: "10k+", label: "Faol a'zolar" },
    { value: "500+", label: "Ilmiy maqolalar" },
    { value: "25+", label: "Hamkor tashkilotlar" },
    { value: "1.2k+", label: "O'quv materiallari" },
];

const partners = ["MIT", "Oxford", "Cambridge", "Stanford", "Caltech", "CERN"];

export default function AboutPage() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-12 md:pt-16">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Global Mission
                            </HeroBadge>
                            <div className="space-y-4">
                                <h1 className="site-display text-4xl md:text-6xl xl:text-[4.5rem]">
                                    Ilm-fan uchun
                                    <span className="site-kicker"> markazlashgan, </span>
                                    ishonchli va professional ekotizim.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    MathSphere yosh tadqiqotchilar, o'qituvchilar va olimlar uchun ilmiy axborot,
                                    ta'lim, nashr va tajriba muhiti yaratadi. Maqsad chiroyli sahifalar emas, balki
                                    kuchli akademik mahsulot qurish.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/write" className="site-button-primary">
                                    Hamkorlikni boshlash
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="site-panel-strong p-5 md:p-7 xl:p-8">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="site-metric-card p-5">
                                        <div className="site-display text-3xl">{stat.value}</div>
                                        <div className="mt-2 text-sm font-semibold text-muted-foreground">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                                <div className="site-media-frame min-h-[240px] p-5">
                                    <div className="site-eyebrow">Institutional Signal</div>
                                    <div className="mt-5 grid gap-3">
                                        {["Research", "Teaching", "Publishing", "Experimentation"].map((item, index) => (
                                            <div key={item} className="site-outline-card flex items-center justify-between p-4">
                                                <span className="text-sm font-semibold">{item}</span>
                                                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                                                    0{index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="site-outline-card p-5">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                                            <div className="site-eyebrow">Trust Layer</div>
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Platformadagi har bir modul ilmiy axborotni tartibli, topiladigan va professional
                                            kontekstda ko'rsatishi kerak.
                                        </p>
                                    </div>
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Mission Note</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Brend hissi bilan mahsulot sifati bir joyga kelishi kerak. Shu sabab public
                                            sahifalar ham institutsional darajada ko'rinishi maqsad qilingan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Platforma Vektori"
                        title="Bizning ish printsiplarimiz"
                        description="MathSphere foydalanuvchiga nafaqat kontent, balki akademik ishonch hissini ham berishi kerak."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {[
                            {
                                icon: Globe,
                                title: "Global moslashuv",
                                text: "Mahalliy foydalanuvchi uchun qulay, xalqaro standartlarga yaqin interfeys va axborot modeli.",
                            },
                            {
                                icon: Users,
                                title: "Hamjamiyat markazi",
                                text: "Talaba, ustoz va tadqiqotchini bir xil professional platforma ostida bog'lash.",
                            },
                            {
                                icon: Network,
                                title: "Tizimli bog'lanish",
                                text: "Kutubxona, jurnal, akademiya va writer bo'limlari parchalanib ketmasligi uchun bir xil UX tili.",
                            },
                        ].map((item) => (
                            <div key={item.title} className="site-panel p-7">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 font-serif text-2xl font-black">{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection>
                <SiteContainer>
                    <div className="site-panel-strong p-8 md:p-10">
                        <SectionHeading
                            eyebrow="Hamkor Tarmog'i"
                            title="Akademik signalni kuchaytiradigan tashkilotlar"
                            description="Hamkorlar bloki dekor emas, platformaning professional positioning qismini ko'rsatadi."
                        />
                        <div className="mt-10 flex flex-wrap gap-3">
                            {partners.map((partner) => (
                                <div key={partner} className="site-chip !px-5 !py-3 !text-[11px]">
                                    {partner}
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 site-divider" />
                        <div className="mt-10 grid gap-6 md:grid-cols-2">
                            <div className="site-outline-card p-6">
                                <div className="site-eyebrow">Hamkorlik</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Platforma rivoji uchun kontent, ta'lim yoki ilmiy nashr yo'nalishida qo'shilish mumkin.
                                </p>
                            </div>
                            <div className="site-outline-card p-6">
                                <div className="site-eyebrow">Ta'lim va nashr</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Akademik kurslar, resurslar va nashr oqimlari bir xil standartda olib boriladi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
