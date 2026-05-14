import Link from "next/link";
import {
    ArrowRight,
    BookOpenText,
    CheckCircle2,
    FileText,
    FlaskConical,
    Layers3,
    NotebookTabs,
    Sigma,
} from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const primarySurfaces = [
    {
        title: "Laboratory",
        description: "SymPy/SciPy asosidagi solve, method chooser, verification, 2D/3D visualization va report generator.",
        href: "/laboratory",
        icon: FlaskConical,
        points: ["Analytic + numeric", "Method audit", "Result verification"],
    },
    {
        title: "Writer",
        description: "Ilmiy matn, formula, section structure va saqlangan laboratory result importi uchun professional editor.",
        href: "/write",
        icon: BookOpenText,
        points: ["Research document", "Saved result import", "Citation workflow"],
    },
    {
        title: "Notebook",
        description: "Matn, formula, solve, graph, table, code va export bloklari bilan computational worksheet.",
        href: "/notebook",
        icon: NotebookTabs,
        points: ["Live blocks", "DB save", "Lab result blocks"],
    },
];

const reportFormats = [
    "Student solution",
    "Teacher explanation",
    "Scientific report",
    "Lab report",
    "Code appendix",
    "LaTeX paper section",
];

function ProductWorkspaceVisual() {
    return (
        <div className="site-panel-strong overflow-hidden p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="site-eyebrow">Research packet</div>
                    <div className="mt-3 text-3xl font-black tracking-tight text-foreground">Ready for Writer</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                    <Sigma className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background p-4">
                <div className="font-mono text-sm text-muted-foreground">integral_0^pi sin(x) dx</div>
                <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="font-serif text-4xl font-black text-foreground">2</div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                        verified
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-2">
                {["Method", "Verification", "Code appendix", "Conclusion"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">{item}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {["Lab", "Report", "Bridge", "Writer"].map((item) => (
                    <div key={item} className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FlowStep({ index, title, detail }: { index: string; title: string; detail: string }) {
    return (
        <div className="site-outline-card p-5">
            <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-black text-background">
                    {index}
                </div>
                <div>
                    <div className="text-base font-black text-foreground">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-8 pt-8 md:pb-10 md:pt-10">
                <SiteContainer>
                    <div className="grid items-center gap-8 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <Layers3 className="h-4 w-4" />
                                Computational research platform
                            </HeroBadge>

                            <div className="space-y-5">
                                <h1 className="site-display text-4xl md:text-5xl xl:text-[4.6rem]">
                                    Matematik natijani tayyor ilmiy ishga aylantiring.
                                </h1>
                                <p className="site-lead max-w-2xl text-foreground/70">
                                    MathSphere hisoblash, tekshirish, vizualizatsiya, report va yozuv jarayonini bitta tartibli platformaga yig&apos;adi.
                                    Qiymat faqat javobda emas, tayyor topshiriladigan hujjatda.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href="/laboratory" className="site-button-primary">
                                    Laboratory ochish
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/write" className="site-button-secondary">
                                    Writer
                                </Link>
                                <Link href="/notebook" className="site-button-ghost">
                                    <NotebookTabs className="h-4 w-4" />
                                    Notebook
                                </Link>
                            </div>
                        </div>

                        <ProductWorkspaceVisual />
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-12">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Platform surfaces"
                        title="Alohida utilitalar emas, bitta ilmiy workflow."
                        description="Har bir bo'lim mustaqil modul, lekin natija bir oqimda yuradi: labda olinadi, notebookda ishlab boriladi, writerda tayyor ishga aylanadi."
                        align="center"
                    />
                    <div className="mt-10 grid gap-5 lg:grid-cols-3">
                        {primarySurfaces.map((surface) => (
                            <Link key={surface.title} href={surface.href} className="site-panel group block p-6 transition-colors hover:border-foreground">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                                        <surface.icon className="h-5 w-5" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                                </div>
                                <h2 className="mt-6 text-2xl font-black tracking-tight text-foreground">{surface.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{surface.description}</p>
                                <div className="mt-5 space-y-2">
                                    {surface.points.map((point) => (
                                        <div key={point} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            {point}
                                        </div>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-12">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                        <div>
                            <div className="site-eyebrow">Report-first value</div>
                            <h2 className="site-display mt-4 text-4xl md:text-5xl">
                                Odamlar integral yechishga emas, topshirishga tayyor natijaga pul to&apos;laydi.
                            </h2>
                            <p className="site-lead mt-5 max-w-2xl text-foreground/68">
                                Shuning uchun report generator platformaning markazida turadi: method, solution, verification, graph interpretation,
                                code appendix va conclusion har bir formatda majburiy.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {reportFormats.map((format) => (
                                <div key={format} className="site-outline-card p-5">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-accent" />
                                        <div className="font-black text-foreground">{format}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pb-20 pt-12">
                <SiteContainer>
                    <div className="site-panel-strong p-6 md:p-8">
                        <div className="grid gap-6 lg:grid-cols-4">
                            <FlowStep index="1" title="Solve" detail="Masala symbolic lane orqali tekshiriladi, kerak bo'lsa numerical fallback so'raladi." />
                            <FlowStep index="2" title="Verify" detail="Derivative, substitution, residual, convergence va domain risk signalari alohida chiqadi." />
                            <FlowStep index="3" title="Report" detail="Student, teacher, scientific, lab yoki LaTeX section formatida tayyorlanadi." />
                            <FlowStep index="4" title="Publish" detail="Natija Writer yoki Notebook ichiga saqlangan research asset sifatida ulanadi." />
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
