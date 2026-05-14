import { BookOpenText, FileCheck2, FlaskConical, Network, ShieldCheck } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const principles = [
    {
        icon: FileCheck2,
        title: "Report birinchi o'rinda",
        text: "Platforma javob chiqarish bilan to'xtamaydi. Method, verification, graph interpretation, code appendix va conclusion tayyor hujjatga aylanadi.",
    },
    {
        icon: FlaskConical,
        title: "Hisoblash ochiq ko'rinadi",
        text: "Researcher natija ortidagi method, numerical fallback, tolerance, diagnostics va reproducibility signalini ko'ra olishi kerak.",
    },
    {
        icon: BookOpenText,
        title: "Yozuv va hisob birga yuradi",
        text: "Labda saqlangan result Writer va Notebook ichida research asset sifatida qayta ishlatiladi.",
    },
];

const architecture = [
    "Laboratory modullari mustaqil saqlanadi: integral, differential, matrix, probability va series-limit o'z domainiga ega.",
    "Bridge natijani canonical payload sifatida saqlaydi: input, output, method, diagnostics, runtime, warning va provenance ajratiladi.",
    "Writer, Notebook va Report generator laboratoriya natijasini import qiladi, lekin solver ichiga monolit bog'lanmaydi.",
    "AI explanation test moduli optional bo'lib qoladi: ishlatsa bo'ladi, o'chirish yoki almashtirish oson.",
];

export default function AboutPage() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-12 pt-10 md:pt-14">
                <SiteContainer>
                    <div className="grid items-center gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <ShieldCheck className="h-4 w-4" />
                                Product direction
                            </HeroBadge>
                            <h1 className="site-display text-5xl md:text-6xl">
                                MathSphere hisoblash platformasi emas, computational document platform.
                            </h1>
                            <p className="site-lead max-w-2xl text-foreground/70">
                                Maqsad: matematik masalani yechish, tekshirish, tushuntirish, saqlash va nashrga yaqin hujjatga aylantirish.
                                Platforma student, teacher va researcher workflowlarini bitta professional muhitda bog'laydi.
                            </p>
                        </div>
                        <div className="site-panel-strong p-6 md:p-7">
                            <div className="site-eyebrow">System map</div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {["Lab", "Report", "Bridge", "Writer", "Notebook", "Export"].map((item, index) => (
                                    <div key={item} className={`rounded-xl border px-4 py-3 text-sm font-black ${index === 1 ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background text-foreground"}`}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-12">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Principles"
                        title="Platforma qanday saviyada ishlashi kerak?"
                        description="Har bir yangi feature professional workflowga xizmat qilishi kerak: tushunarli, qayta ishlatiladigan, tekshiriladigan va export qilinadigan."
                        align="center"
                    />
                    <div className="mt-10 grid gap-5 lg:grid-cols-3">
                        {principles.map((item) => (
                            <div key={item.title} className="site-panel p-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <h2 className="mt-5 text-2xl font-black tracking-tight text-foreground">{item.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pb-20 pt-12">
                <SiteContainer>
                    <div className="site-panel-strong p-6 md:p-8">
                        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
                            <div>
                                <div className="site-eyebrow">Architecture discipline</div>
                                <h2 className="site-display mt-4 text-4xl md:text-5xl">
                                    Featurelar ko'paysa ham sistema monolit va chalkash bo'lib qolmasligi kerak.
                                </h2>
                            </div>
                            <div className="grid gap-3">
                                {architecture.map((item) => (
                                    <div key={item} className="site-outline-card flex items-start gap-3 p-4">
                                        <Network className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                                        <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
