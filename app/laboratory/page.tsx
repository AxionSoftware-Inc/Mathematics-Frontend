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
    const modules = await fetchLaboratoryModules();

    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-12 md:pt-16">
                <SiteContainer>
                    <div className="flex flex-col gap-12">
                        <section className="site-panel-strong p-7 md:p-9">
                            <HeroBadge>
                                <FlaskConical className="h-4 w-4" />
                                Mathematics Laboratory
                            </HeroBadge>

                            <h1 className="mt-5 font-serif text-4xl font-black tracking-tight text-foreground md:text-5xl">
                                Professional Computational Workspaces.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
                                Laboratoriya modullari yagona vizualizatsiya va tahlil arxitekturasi ustida qurilgan. 
                                Har bir studio o&apos;z yo&apos;nalishi bo&apos;yicha research-grade hisoblash muhitini taqdim etadi.
                            </p>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {modules.map((module) => (
                                <Link 
                                    key={module.id} 
                                    href={`/laboratory/${module.slug}`}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-background/50 p-8 transition-all hover:-translate-y-1 hover:border-accent/40 hover:bg-background hover:shadow-2xl hover:shadow-accent/5 backdrop-blur-xl"
                                >
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 blur-2xl transition-all group-hover:bg-accent/10" />
                                    
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-background">
                                                {module.slug === "integral-studio" ? <Sigma className="h-6 w-6" /> : <AreaChart className="h-6 w-6" />}
                                            </div>
                                            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                {module.category}
                                            </div>
                                        </div>
                                        
                                        <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                                            {module.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80">
                                            {module.summary}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                                        Open Workspace
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            ))}
                        </section>

                        <section className="grid gap-4 md:grid-cols-3">
                            {focusCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div key={card.title} className="site-outline-card bg-background/50 px-6 py-6 backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-black text-foreground">{card.title}</div>
                                        </div>
                                        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{card.text}</p>
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
