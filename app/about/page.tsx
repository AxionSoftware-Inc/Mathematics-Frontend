/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { ArrowRight, Globe, Network, ShieldCheck, Sparkles, Users } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const stats = [
    { value: "10k+", label: "Active members" },
    { value: "500+", label: "Published papers" },
    { value: "25+", label: "Institutional partners" },
    { value: "1.2k+", label: "Learning assets" },
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
                                    A disciplined product surface
                                    <span className="site-kicker"> for mathematical work, </span>
                                    publication and learning.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    MathSphere is being shaped as a coherent environment for research, teaching,
                                    publication and technical authorship. The objective is not decorative software,
                                    but a credible academic product.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/write" className="site-button-primary">
                                    Open Writer
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
                                            Every surface is expected to present mathematical information in a way that is searchable,
                                            legible and institutionally credible.
                                        </p>
                                    </div>
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Mission Note</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Product quality and brand discipline should not diverge. Public pages therefore carry
                                            the same standards as the core workspaces.
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
                        eyebrow="Platform Direction"
                        title="Platforma qanday tamoyillar asosida shakllanmoqda"
                        description="MathSphere faqat kontent saqlaydigan sayt emas. U ilmiy ish, o‘qitish va nashr jarayonini bitta ishonchli tizim sifatida taqdim etishi kerak."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {[
                            {
                                icon: Globe,
                                title: "Xalqaro o‘qiladigan til",
                                text: "Interfeys mahalliy foydalanuvchiga qulay bo‘lishi kerak, lekin uning product tili va axborot ritmi xalqaro ilmiy muhitga mos o‘qilishi lozim.",
                            },
                            {
                                icon: Users,
                                title: "Yagona ish muhiti",
                                text: "Talaba, o‘qituvchi va tadqiqotchi bir-biridan uzilgan servislar bilan emas, umumiy matematik ish oqimi bilan ishlashi kerak.",
                            },
                            {
                                icon: Network,
                                title: "Tizimli bog‘lanish",
                                text: "Library, Journal, Academy va Writer bir-biriga ulanadigan modullar bo‘lishi kerak, alohida-alohida mahsulotlar emas.",
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
                            eyebrow="Institutional Signal"
                            title="Platformaning institutsional yo‘nalishini ko‘rsatadigan qatlam"
                            description="Hamkorlar bo‘limi dekor uchun emas. U mahsulotning qaysi saviyada o‘qilishini va qanday auditoriyaga mo‘ljallanganini ko‘rsatadi."
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
                                    Collaborations can extend across content, teaching programs, research publishing and institutional partnerships.
                                </p>
                            </div>
                            <div className="site-outline-card p-6">
                                <div className="site-eyebrow">Ta'lim va nashr</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Courses, archives and publication flows are expected to operate under one visual and editorial standard.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
