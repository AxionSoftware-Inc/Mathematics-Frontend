import Link from "next/link";
import { Activity, ArrowRight, Cpu, Layers3, Sparkles, Target, Wand2 } from "lucide-react";

import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchLaboratoryModules, type LaboratoryModuleMeta } from "@/lib/laboratory";

function modeLabel(mode: "client" | "hybrid" | "server") {
    if (mode === "hybrid") return "Gibrid";
    if (mode === "server") return "Server";
    return "Lokal";
}

export default async function LaboratoryPage() {
    const modules = await fetchLaboratoryModules();

    const assistantsSlugs = ["proof-assistant", "notebook-studio"];
    const solvers = modules.filter((module) => !assistantsSlugs.includes(module.slug));
    const assistants = modules.filter((module) => assistantsSlugs.includes(module.slug));
    const localCount = modules.filter((module) => module.computation_mode === "client").length;
    const hybridCount = modules.filter((module) => module.computation_mode === "hybrid").length;

    return (
        <div className="site-shell">
            <SiteSection className="py-6 md:py-8">
                <SiteContainer className="max-w-[1760px] px-3 md:px-5 xl:px-8">
                    <div className="space-y-6">
                        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="site-panel-strong relative overflow-hidden p-8 lg:p-12">
                                <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.14),transparent_72%)]" />
                                <div className="relative space-y-6">
                                    <div className="site-eyebrow text-accent">Laboratoriya</div>
                                    <div className="space-y-4">
                                        <h1 className="max-w-4xl font-serif text-4xl font-black leading-tight lg:text-6xl">
                                            Hisoblash, tahlil va yozuv uchun bitta ish maydoni.
                                        </h1>
                                        <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                                            MathSphere laboratoriyasi modullar orqali ishlaydi: integral, differensial, matritsa,
                                            statistika va boshqa yo&apos;nalishlar bir xil interfeys ichida jamlangan. Har bir modul
                                            tez tajriba, grafik ko&apos;rish va yozuvga eksport qilish oqimiga moslangan.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href={`/laboratory/${solvers[0]?.slug || modules[0]?.slug || "integral-studio"}`}
                                            className="site-button-primary"
                                        >
                                            Birinchi modulni ochish
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                        <Link href="/write/new" className="site-button-secondary border border-border/60">
                                            Writer ochish
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <MetricCard
                                    icon={Layers3}
                                    label="Modullar"
                                    value={String(modules.length)}
                                    description="Barcha ish joylari bitta registrda boshqariladi."
                                    tone="teal"
                                />
                                <MetricCard
                                    icon={Cpu}
                                    label="Hisoblash"
                                    value={`${localCount}/${hybridCount}`}
                                    description="Lokal va gibrid modullar balansi."
                                    tone="amber"
                                />
                                <MetricCard
                                    icon={Activity}
                                    label="Interaktivlik"
                                    value="Jonli"
                                    description="Grafiklar va jadval natijalari bir zumda yangilanadi."
                                    tone="indigo"
                                />
                                <MetricCard
                                    icon={Sparkles}
                                    label="Eksport"
                                    value="Writer"
                                    description="Tajriba natijalari yozuv oqimiga ulanadi."
                                    tone="rose"
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
                            <section className="site-panel p-6 lg:p-8">
                                <div className="flex flex-col gap-5 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-accent">
                                            <Target className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.28em]">Asosiy modullar</span>
                                        </div>
                                        <h2 className="font-serif text-3xl font-black md:text-4xl">Hisoblash va tahlil ish joylari</h2>
                                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                                            Kundalik hisob-kitob, model tekshirish va grafik ko&apos;rish uchun asosiy laboratoriya modullari.
                                            Har bir karta qisqa tavsif, hisoblash rejimi va bo&apos;lim turini ko&apos;rsatadi.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-xs leading-6 text-muted-foreground">
                                        Lokal modullar: <span className="font-bold text-foreground">{localCount}</span>
                                        <br />
                                        Gibrid modullar: <span className="font-bold text-foreground">{hybridCount}</span>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                    {solvers.map((module) => (
                                        <ModuleCard key={module.slug} module={module} />
                                    ))}
                                </div>
                            </section>

                            <div className="space-y-5">
                                <section className="site-panel p-6 lg:p-8">
                                    <div className="flex items-center gap-2 text-accent">
                                        <Wand2 className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.28em]">Yordamchi studiyalar</span>
                                    </div>
                                    <h2 className="mt-3 font-serif text-3xl font-black">Yozuv va isbot oqimi</h2>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                        Nazariya yozish, isbot skeleti tuzish va notebook uslubida ishlash uchun yordamchi modullar.
                                    </p>

                                    <div className="mt-6 grid gap-4">
                                        {assistants.map((module) => (
                                            <ModuleCard key={module.slug} module={module} compact />
                                        ))}
                                    </div>
                                </section>

                                <section className="site-panel p-6 lg:p-8">
                                    <div className="site-eyebrow text-accent">Ish tamoyili</div>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            "Har modul mustaqil hisoblaydi, lekin umumiy laboratoriya shell ichida ishlaydi.",
                                            "Grafik, jadval va eksport bloklari bir xil logikada yig'ilgan.",
                                            "Terminlar va visual hierarchy endi sokinroq, o'qilishi tezroq bo'lishi kerak.",
                                        ].map((item) => (
                                            <div key={item} className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm leading-7 text-muted-foreground">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    description,
    tone,
}: {
    icon: typeof Layers3;
    label: string;
    value: string;
    description: string;
    tone: "teal" | "amber" | "indigo" | "rose";
}) {
    const tones = {
        teal: "border-teal-500/20 bg-teal-500/6 text-teal-600",
        amber: "border-amber-500/20 bg-amber-500/6 text-amber-600",
        indigo: "border-indigo-500/20 bg-indigo-500/6 text-indigo-600",
        rose: "border-rose-500/20 bg-rose-500/6 text-rose-600",
    };

    return (
        <div className="site-outline-card flex flex-col justify-between gap-5 p-6">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
                <div className="font-serif text-3xl font-black">{value}</div>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function ModuleCard({ module, compact = false }: { module: LaboratoryModuleMeta; compact?: boolean }) {
    return (
        <Link
            href={`/laboratory/${module.slug}`}
            className={`site-outline-card group flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 ${
                compact ? "p-5" : "p-6"
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                        <LaboratoryModuleIcon name={module.icon_name} className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{module.category}</div>
                        <h3 className="font-serif text-xl font-black leading-tight text-foreground">{module.title}</h3>
                    </div>
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {modeLabel(module.computation_mode)}
                </div>
            </div>

            <p className={`mt-4 text-sm leading-7 text-muted-foreground ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
                {module.summary}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <span>{module.estimated_minutes || 10} min</span>
                <span className="flex items-center gap-2 text-accent transition-transform group-hover:translate-x-1">
                    Modulni ochish
                    <ArrowRight className="h-4 w-4" />
                </span>
            </div>
        </Link>
    );
}
