import Link from "next/link";
import {
    ArrowRight,
    BookOpenText,
    CirclePlay,
    Compass,
    FlaskConical,
    Orbit,
    Sigma,
    Sparkles,
    SquareChartGantt,
} from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const metrics = [
    { value: "01", label: "Yagona platforma", detail: "Hisoblash, yozish va nashrga tayyorlash bitta muhitda." },
    { value: "05", label: "Asosiy studio", detail: "Integral, differensial, matritsa, ehtimollar va qatorlar." },
    { value: "24/7", label: "Ish ritmi", detail: "Tadqiqot oqimini to'xtatmasdan davom ettirish uchun." },
];

const flagshipSurfaces = [
    {
        eyebrow: "Writer Workspace",
        title: "Kitob, maqola va ilmiy matnlar uchun tartibli yozuv muhiti.",
        description:
            "Bo'lim arxitekturasi, formulalar bilan ishlash, preview intizomi va laboratoriyadan import qilingan natijalar bitta professional yozuv yuzasiga yig'iladi.",
        href: "/write",
        cta: "Writer'ga o'tish",
        icon: BookOpenText,
        points: ["Uzun formatli matnlar", "Formulali kontent", "Nashrga yaqin ko'rinish"],
    },
    {
        eyebrow: "Laboratoriya",
        title: "Matematik tahlil kalkulyator emas, vizual dalilga ega studio bo'lishi kerak.",
        description:
            "Yechim, vizualizatsiya, solishtirish va hisobot oqimi uzilmagan holatda ishlaydi. Natija yozuv muhitiga ko'chadi va izsiz yo'qolmaydi.",
        href: "/laboratory",
        cta: "Laboratoriyani ko'rish",
        icon: FlaskConical,
        points: ["Analitik va sonli yechim", "Diagnostik ko'rinishlar", "Writer bilan bog'langan oqim"],
    },
];

const highlights = [
    {
        title: "Ilmiy ish uchun qurilgan",
        text: "Landing oddiy kurs loyihasidek emas, ishonch uyg'otadigan produkt darajasida ko'rinishi kerak.",
        icon: Compass,
    },
    {
        title: "Minimal, ammo boy detal",
        text: "Oq-qora palitra, toza tipografiya va qat'iy ritm premium taassurot beradi.",
        icon: Sparkles,
    },
    {
        title: "Bir-biriga ulangan modullar",
        text: "Laboratoriyada olingan natija writer ichida qayta ishlanadigan aktivga aylanadi.",
        icon: Orbit,
    },
    {
        title: "Brend ohangi aniq",
        text: "Har bir blok kompaniya qimmat mahsulot yaratganini his qildirishi kerak.",
        icon: SquareChartGantt,
    },
];

const workflows = [
    {
        label: "Matn tizimi",
        title: "Maqola va kitob yozish jarayoni uchun qatlamli arxitektura.",
        text: "Bo'limlar, preview, izohlar va formulalar bir xil vizual tartibda ishlaydi. Kontent o'sgani sari interfeys buzilmaydi.",
        chips: ["Bo'limlar", "Preview", "Formulalar", "Nashr ruhi"],
        kind: "writer" as const,
    },
    {
        label: "Hisoblash tizimi",
        title: "Matematik natijani faqat chiqarish emas, isbotlash va ko'rsatish muhiti.",
        text: "Grafiklar, solishtirish bloklari va hisobot kartalari natijani auditoriyaga ko'rsatishga tayyor holatga olib keladi.",
        chips: ["Yechim", "Grafik", "Taqqoslash", "Hisobot"],
        kind: "lab" as const,
    },
];

const productPrinciples = [
    "Bosh sahifa foydalanuvchiga mahsulotning narxi va sifati borligini birinchi ekranidayoq his qildiradi.",
    "Vizual til qora, oq va yumshoq kulrang orqali premium minimalizmni ushlab turadi.",
    "CTA, bo'limlar va tipografiya bir-biridan uzilgan emas, bitta dizayn sistemasi sifatida ishlaydi.",
];

function HeroConsole() {
    return (
        <div className="site-hero-visual">
            <div className="site-hero-visual-glow" />
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="site-command-card">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="site-eyebrow">Editorial Frame</div>
                            <div className="mt-3 text-3xl font-black tracking-tight text-foreground">Research Draft</div>
                        </div>
                        <div className="site-status-pill">live</div>
                    </div>
                    <div className="mt-6 space-y-3">
                        {["Abstract", "Methodology", "Analytical Result", "Conclusion"].map((item, index) => (
                            <div
                                key={item}
                                className={`rounded-[1.35rem] border px-4 py-3 text-sm font-semibold ${
                                    index === 2
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border/80 bg-background/60 text-foreground/80"
                                }`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 rounded-[1.6rem] border border-border/80 bg-background/70 p-4">
                        <div className="site-eyebrow">Preview discipline</div>
                        <div className="mt-4 h-2.5 w-36 rounded-full bg-foreground" />
                        <div className="mt-3 h-2 w-full rounded-full bg-foreground/12" />
                        <div className="mt-2 h-2 w-[88%] rounded-full bg-foreground/12" />
                        <div className="mt-2 h-2 w-[68%] rounded-full bg-foreground/12" />
                        <div className="mt-5 grid grid-cols-[1fr_110px] gap-3">
                            <div className="h-16 rounded-[1.2rem] bg-foreground/6" />
                            <div className="site-overlay-card h-16" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="site-command-card site-command-card-dark">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow site-inverse-subtle">Analytical studio</div>
                                <div className="mt-3 text-2xl font-black tracking-tight text-white">Differential Flow</div>
                            </div>
                            <Sigma className="h-5 w-5 text-white/80" />
                        </div>
                        <div className="mt-5 grid grid-cols-4 gap-2">
                            {[35, 52, 66, 81, 62, 84, 72, 55].map((height, index) => (
                                <div key={index} className="site-inverse-panel rounded-[1rem] p-2">
                                    <div className="flex h-16 items-end">
                                        <div className="w-full rounded-md bg-gradient-to-t from-white via-white/75 to-white/30" style={{ height: `${height}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="site-inverse-panel site-inverse-text rounded-[1rem] px-3 py-2 text-xs">
                                Solve, visualize va compare bir-biridan uzilmagan oqimda ishlaydi.
                            </div>
                            <div className="site-inverse-panel site-inverse-text rounded-[1rem] px-3 py-2 text-xs">
                                Natija Writer ichiga research asset sifatida ko&apos;chadi.
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            ["Interfeys", "Minimal"],
                            ["Signal", "Premium"],
                            ["Ritm", "Tartibli"],
                            ["Ohang", "Ishonchli"],
                        ].map(([label, value]) => (
                            <div key={label} className="site-mini-tile">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
                                <div className="mt-3 text-base font-black tracking-tight text-foreground">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function WorkflowVisual({ kind }: { kind: "writer" | "lab" }) {
    if (kind === "writer") {
        return (
            <div className="site-capability-visual">
                <div className="site-surface-card rounded-[1.8rem] p-5">
                    <div className="flex items-center justify-between">
                        <div className="site-eyebrow">Document map</div>
                        <BookOpenText className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="mt-5 space-y-3">
                        {["Front Matter", "Chapter I", "Core Proof", "Appendix"].map((item, index) => (
                            <div
                                key={item}
                                className={`rounded-[1.3rem] px-4 py-3 text-sm font-semibold ${
                                    index === 2 ? "bg-foreground text-background" : "bg-foreground/6 text-foreground/80"
                                }`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 rounded-[1.5rem] border border-border/80 bg-background/80 p-4">
                        <div className="site-eyebrow">Publication preview</div>
                        <div className="mt-4 h-2.5 w-44 rounded-full bg-foreground" />
                        <div className="mt-3 h-2 w-full rounded-full bg-foreground/12" />
                        <div className="mt-2 h-2 w-[91%] rounded-full bg-foreground/12" />
                        <div className="mt-2 h-2 w-[75%] rounded-full bg-foreground/12" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="site-capability-visual site-capability-visual-dark">
            <div className="site-inverse-panel rounded-[1.8rem] p-5">
                <div className="flex items-center justify-between">
                    <div className="site-eyebrow site-inverse-subtle">Analytical evidence</div>
                    <FlaskConical className="h-5 w-5 text-white/85" />
                </div>
                <div className="mt-5 grid grid-cols-[1.05fr_0.95fr] gap-3">
                    <div className="site-inverse-panel rounded-[1.4rem] p-3">
                        <div className="site-inverse-subtle text-[10px] font-black uppercase tracking-[0.18em]">Visual output</div>
                        <div className="mt-3 flex h-28 items-end gap-2">
                            {[30, 44, 63, 79, 68, 84, 72, 57].map((height, index) => (
                                <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-white to-white/25" style={{ height: `${height}%` }} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        {["Analitik yechim", "Solishtirish qatlami", "Hisobotga tayyor blok"].map((item) => (
                            <div key={item} className="site-inverse-panel site-inverse-text rounded-[1.2rem] px-3 py-3 text-sm">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-10 md:pb-16 md:pt-14">
                <SiteContainer>
                    <div className="site-hero-shell">
                        <div className="site-hero-orb site-hero-orb-left" />
                        <div className="site-hero-orb site-hero-orb-right" />
                        <div className="grid items-start gap-10 xl:grid-cols-[0.9fr_1.1fr]">
                            <div className="relative z-10 space-y-8">
                                <HeroBadge>
                                    <Sparkles className="h-4 w-4" />
                                    O&apos;zbekcha premium matematika platformasi
                                </HeroBadge>

                                <div className="space-y-5">
                                    <h1 className="site-display text-5xl md:text-6xl xl:text-[5.6rem]">
                                        Matematik ish
                                        <span className="site-kicker"> qimmat, </span>
                                        tartibli va premium ko&apos;rinishi kerak.
                                    </h1>
                                    <p className="site-lead max-w-2xl text-foreground/68">
                                        MathSphere laboratoriya, yozuv muhiti va ilmiy workflow&apos;ni bitta zamonaviy tizimga yig&apos;adi.
                                        Bu bosh sahifa esa shu mahsulotga mos ravishda minimal, qimmat va ishonchli ko&apos;rinishi kerak.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link href="/write" className="site-button-primary">
                                        Platformaga kirish
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link href="/laboratory" className="site-button-secondary">
                                        Laboratoriyani ko&apos;rish
                                    </Link>
                                    <Link href="/about" className="site-button-ghost">
                                        <CirclePlay className="h-4 w-4" />
                                        Loyihaning ruhi
                                    </Link>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    {metrics.map((item) => (
                                        <div key={item.label} className="site-signal-card">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                                            <div className="mt-4 site-display text-4xl text-foreground">{item.value}</div>
                                            <p className="mt-3 text-sm leading-6 text-foreground/58">{item.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <HeroConsole />
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-4">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Flagship yuzalar"
                        title="Platformaning qiymatini ikki asosiy surface ko'rsatadi."
                        description="Writer va Laboratoriya bir-biridan alohida utilita emas, yagona premium mahsulotning ikkita asosiy yo'nalishi sifatida ko'rinadi."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 xl:grid-cols-2">
                        {flagshipSurfaces.map((surface, index) => (
                            <div
                                key={surface.title}
                                className={`site-feature-panel ${index === 1 ? "site-feature-panel-dark" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-[0.24em] ${index === 1 ? "text-white/45" : "text-muted-foreground"}`}>
                                            {surface.eyebrow}
                                        </div>
                                        <h2 className={`mt-4 max-w-xl font-serif text-4xl font-black tracking-tight ${index === 1 ? "text-white" : "text-foreground"}`}>
                                            {surface.title}
                                        </h2>
                                    </div>
                                    <div className={`rounded-[1.2rem] border p-3 ${index === 1 ? "site-inverse-panel text-white" : "site-surface-card text-foreground"}`}>
                                        <surface.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <p className={`mt-6 max-w-2xl text-sm leading-7 ${index === 1 ? "text-white/70" : "text-foreground/68"}`}>
                                    {surface.description}
                                </p>
                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    {surface.points.map((point) => (
                                        <div
                                            key={point}
                                            className={`rounded-[1.2rem] border px-4 py-3 text-sm font-semibold ${
                                                index === 1
                                                    ? "site-inverse-panel site-inverse-text"
                                                    : "border-border/80 bg-background/65 text-foreground/78"
                                            }`}
                                        >
                                            {point}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8">
                                    <Link href={surface.href} className={index === 1 ? "site-button-invert" : "site-button-primary"}>
                                        {surface.cta}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-4">
                <SiteContainer>
                    <div className="grid gap-10 xl:grid-cols-[0.84fr_1.16fr]">
                        <SectionHeading
                            eyebrow="Premium signal"
                            title="Birinchi taassurotning o'zi mahsulot saviyasini aytib turishi kerak."
                            description="Qimmat sayt hissi effektlar ko'pligidan emas, ritm, tipografiya, bo'sh joy va qat'iy detal nazoratidan paydo bo'ladi."
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            {highlights.map((item) => (
                                <div key={item.title} className="site-panel p-6 md:p-7">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-foreground text-background">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-5 font-serif text-2xl font-black tracking-tight text-foreground">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-foreground/62">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-4">
                <SiteContainer>
                    <div className="space-y-12">
                        {workflows.map((workflow, index) => (
                            <div
                                key={workflow.label}
                                className={`grid items-center gap-8 xl:grid-cols-[0.92fr_1.08fr] ${
                                    index % 2 === 1 ? "xl:[&>*:first-child]:order-2 xl:[&>*:last-child]:order-1" : ""
                                }`}
                            >
                                <div className="space-y-5">
                                    <div className="site-eyebrow">{workflow.label}</div>
                                    <h2 className="site-display text-4xl md:text-5xl">{workflow.title}</h2>
                                    <p className="site-lead max-w-2xl text-foreground/68">{workflow.text}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {workflow.chips.map((chip) => (
                                            <div key={chip} className="site-chip site-chip-active">
                                                {chip}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <WorkflowVisual kind={workflow.kind} />
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-8">
                <SiteContainer>
                    <div className="site-panel-strong overflow-hidden p-8 md:p-10">
                        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
                            <div>
                                <div className="site-eyebrow">Mahsulot pozitsiyasi</div>
                                <h2 className="site-display mt-4 text-4xl md:text-5xl">
                                    Bu landing oddiy &quot;frontend qilingan sahifa&quot; emas, mahsulotning kirish eshigi bo&apos;lishi kerak.
                                </h2>
                            </div>
                            <div className="grid gap-4">
                                {productPrinciples.map((item) => (
                                    <div key={item} className="site-outline-card flex items-start gap-4 p-5">
                                        <div className="mt-1 rounded-full bg-foreground p-2 text-background">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm leading-7 text-foreground/66">{item}</p>
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
