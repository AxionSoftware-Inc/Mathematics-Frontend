import Link from "next/link";
import { ArrowRight, AreaChart, Blocks, FlaskConical, Sigma } from "lucide-react";

import { HeroBadge, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchLaboratoryModules } from "@/lib/laboratory";

const focusCards = [
    {
        icon: AreaChart,
        title: "Analitik + numerik",
        text: "Single integral uchun avval exact yechim tekshiriladi, kerak bo'lsa keyin numerik tasdiq so'raladi.",
    },
    {
        icon: Sigma,
        title: "Qadam va vizual",
        text: "2D/3D grafik, symbolic step kartalar, compare va report oqimi bitta studioda yig'ilgan.",
    },
    {
        icon: Blocks,
        title: "Notebook boshqaruvi",
        text: "Kerakli kartalarni yuqoridagi workspace orqali yoqib-o'chirish mumkin.",
    },
];

export default async function LaboratoryPage() {
    const [module] = await fetchLaboratoryModules();
    const targetSlug = module?.slug || "integral-studio";

    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-12 md:pt-16">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
                        <section className="site-panel-strong p-7 md:p-9">
                            <HeroBadge>
                                <FlaskConical className="h-4 w-4" />
                                Mathematics Laboratory
                            </HeroBadge>

                            <h1 className="mt-5 font-serif text-4xl font-black tracking-tight text-foreground md:text-5xl">
                                Research-grade mathematics workspaces.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
                                Laboratoriya modullari bir xil audit, visualization, comparison va report arxitekturasi ustida
                                ishlaydi. Hozir birinchi professional workspace sifatida integral studio tayyor.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={`/laboratory/${targetSlug}`} className="site-button-primary">
                                    Workspace ni ochish
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            {focusCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div key={card.title} className="site-outline-card bg-background px-5 py-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-black text-foreground">{card.title}</div>
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.text}</p>
                                    </div>
                                );
                            })}
                        </section>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
