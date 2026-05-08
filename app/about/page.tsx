/* eslint-disable react/no-unescaped-entities */
"use client";

import { Globe, Network, Users } from "lucide-react";

import { SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";


const partners = ["MIT", "Oxford", "Cambridge", "Stanford", "Caltech", "CERN"];

export default function AboutPage() {
    return (
        <div className="site-shell">
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
