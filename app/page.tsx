import Link from "next/link";
import {
    Activity,
    ArrowRight,
    Blocks,
    BookOpenText,
    ChartSpline,
    FileText,
    FlaskConical,
    Orbit,
    ScrollText,
    Sigma,
    Sparkles,
} from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";

const trustMetrics = [
    { value: "01", label: "Unified research workflow", detail: "Laboratory, writer, publication direction in one system." },
    { value: "05", label: "Structured mathematics studios", detail: "Integral, differential, matrix, probability, series-limit." },
    { value: "∞", label: "Long-form writing capacity", detail: "Books, articles, notes, chapters and technical manuscripts." },
];

const platformPillars = [
    {
        eyebrow: "Scientific Writer",
        title: "Long-form academic writing without leaving the product.",
        text: "Books, papers and structured chapters are written inside a real workspace with section architecture, formula rendering, preview discipline and laboratory import flow.",
        href: "/write",
        cta: "Open Writer",
        icon: ScrollText,
        accent: "from-slate-950 via-slate-900 to-slate-800 text-white",
        stats: ["Books and manuscripts", "Research papers", "Preview-driven editing"],
    },
    {
        eyebrow: "Mathematics Laboratory",
        title: "Professional analytical studios, not toy calculators.",
        text: "Integral and differential workflows now read like serious computational modules: solve, visualize, compare and report are connected as one continuous research surface.",
        href: "/laboratory",
        cta: "Open Laboratory",
        icon: FlaskConical,
        accent: "from-[#0f2d42] via-[#113b5d] to-[#16507a] text-white",
        stats: ["Symbolic + numerical flow", "Visual diagnostics", "Save and import to Writer"],
    },
];

const systemHighlights = [
    {
        title: "Write books and papers",
        text: "The writer is now positioned as a serious editorial environment rather than a basic page editor.",
        icon: BookOpenText,
    },
    {
        title: "Run integral and differential analysis",
        text: "Laboratory modules present computation, diagnostics and visual interpretation in a single premium workflow.",
        icon: Sigma,
    },
    {
        title: "Move results into documents",
        text: "Research assets created in the lab can be saved, imported and reused inside writing workflows.",
        icon: FileText,
    },
    {
        title: "Present a cohesive product",
        text: "Navigation, cards, typography and page rhythm are being shaped as one product system, not disconnected pages.",
        icon: Orbit,
    },
];

const capabilityRows = [
    {
        label: "Writer stack",
        title: "Manuscript-grade structure with formula-friendly editing.",
        text: "Use disciplined templates, long-form composition, preview-led review and multi-section organization to write articles, notes and books with a publishing mindset.",
        chips: ["Article flow", "Book layout", "LaTeX rendering", "Structured sections"],
        visual: "writer",
    },
    {
        label: "Laboratory stack",
        title: "Mathematical analysis with visual evidence, not just answers.",
        text: "Integral and differential modules now expose analytical steps, numerical fallback, comparison layers and reporting panels that feel closer to a research product.",
        chips: ["Solve", "Visualize", "Compare", "Report"],
        visual: "lab",
    },
];

const productSignals = [
    "Professional typography and spacing discipline across the public site.",
    "Writer and Laboratory are now framed as flagship surfaces, not secondary utilities.",
    "Saved analytical results can feed structured writing rather than disappearing after one computation.",
];

function CommandCenterVisual() {
    return (
        <div className="site-media-frame relative overflow-hidden p-5 md:p-6">
            <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70" />
            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4">
                    <div className="site-command-card">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="site-eyebrow text-slate-500">Writer Surface</div>
                                <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">Research Paper</div>
                            </div>
                            <div className="rounded-full bg-emerald-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                Active Draft
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Section Stack</div>
                                <div className="mt-3 space-y-2">
                                    {["Abstract", "Methodology", "Analytical Result", "Discussion"].map((item, index) => (
                                        <div key={item} className={`rounded-xl px-3 py-2 text-sm font-semibold ${index === 2 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Preview Signal</div>
                                <div className="mt-3 h-28 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(241,245,249,0.88))] p-4">
                                    <div className="h-2.5 w-32 rounded-full bg-slate-900" />
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200" />
                                    <div className="mt-2 h-2 w-[86%] rounded-full bg-slate-200" />
                                    <div className="mt-2 h-2 w-[78%] rounded-full bg-slate-200" />
                                    <div className="mt-5 flex gap-2">
                                        <div className="h-14 flex-1 rounded-xl bg-slate-100" />
                                        <div className="h-14 w-24 rounded-xl bg-blue-50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="site-command-card bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))] text-white">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow text-slate-400">Laboratory Signal</div>
                                <div className="mt-2 text-xl font-black tracking-tight">Differential Studio</div>
                            </div>
                            <Activity className="h-5 w-5 text-cyan-300" />
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                            {[42, 58, 76, 61, 84, 72, 66, 87, 79].map((height, index) => (
                                <div key={index} className="rounded-xl bg-white/6 px-2 py-2">
                                    <div className="flex h-16 items-end">
                                        <div
                                            className="w-full rounded-md bg-gradient-to-t from-cyan-400 via-sky-300 to-white/90"
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-2">
                            <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-300">
                                ODE phase portrait and SDE ensemble are treated as first-class analytical views.
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-300">
                                Saved results can move into Writer as reusable research assets.
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: ChartSpline, label: "Visual layer", value: "Active" },
                            { icon: Blocks, label: "Structured cards", value: "Unified" },
                            { icon: ScrollText, label: "Draft system", value: "Long-form" },
                            { icon: Sparkles, label: "Product tone", value: "Premium" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/45 bg-white/80 px-4 py-4 shadow-sm">
                                <item.icon className="h-5 w-5 text-slate-900" />
                                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                                <div className="mt-2 text-sm font-black text-slate-950">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CapabilityVisual({ kind }: { kind: "writer" | "lab" }) {
    if (kind === "writer") {
        return (
            <div className="site-capability-visual">
                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="site-eyebrow text-slate-400">Document Architecture</div>
                        <ScrollText className="h-5 w-5 text-slate-900" />
                    </div>
                    <div className="mt-4 space-y-2.5">
                        {["Front Matter", "Chapter I", "Analytical Core", "Appendix Notes"].map((item, index) => (
                            <div key={item} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${index === 2 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Publication Preview</div>
                        <div className="mt-4 h-2.5 w-40 rounded-full bg-slate-900" />
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200" />
                        <div className="mt-2 h-2 w-[90%] rounded-full bg-slate-200" />
                        <div className="mt-2 h-2 w-[74%] rounded-full bg-slate-200" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="site-capability-visual bg-[radial-gradient(circle_at_top_left,rgba(17,89,145,0.22),transparent_38%),linear-gradient(180deg,#0b1623,#13273d)] text-white">
            <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="site-eyebrow text-slate-400">Analytical Evidence</div>
                    <FlaskConical className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="mt-5 grid grid-cols-[1.1fr_0.9fr] gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Solve / Compare</div>
                        <div className="mt-3 flex h-28 items-end gap-2">
                            {[28, 44, 52, 63, 78, 69, 84, 72].map((height, index) => (
                                <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 via-sky-400 to-white/90" style={{ height: `${height}%` }} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Cards</div>
                            <div className="mt-3 space-y-2">
                                <div className="rounded-xl bg-white/8 px-3 py-2 text-xs text-slate-200">Analytic derivation</div>
                                <div className="rounded-xl bg-white/8 px-3 py-2 text-xs text-slate-200">Visual diagnostics</div>
                                <div className="rounded-xl bg-white/8 px-3 py-2 text-xs text-slate-200">Report-ready output</div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Signal</div>
                            <div className="mt-2 text-sm font-black text-white">Research-grade flow</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <div className="site-shell">
            <SiteSection className="pb-12 pt-12 md:pb-16 md:pt-16">
                <SiteContainer>
                    <div className="site-hero-shell">
                        <div className="site-hero-orb site-hero-orb-left" />
                        <div className="site-hero-orb site-hero-orb-right" />
                        <div className="grid items-start gap-10 xl:grid-cols-[0.92fr_1.08fr]">
                            <div className="relative z-10 space-y-7">
                                <HeroBadge>
                                    <Sparkles className="h-4 w-4" />
                                    Research Platform For Modern Mathematics
                                </HeroBadge>
                                <div className="space-y-5">
                                    <h1 className="site-display text-5xl md:text-6xl xl:text-[5.35rem]">
                                        Mathematics,
                                        <span className="site-kicker"> writing </span>
                                        and analytical workflow in one premium system.
                                    </h1>
                                    <p className="site-lead max-w-2xl text-slate-600">
                                        MathSphere is being shaped as a serious product for mathematical work: compute in the laboratory,
                                        capture the result, move it into writer, and build papers, notes or books inside a cohesive editorial environment.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/write" className="site-button-primary">
                                        Enter Writer
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link href="/laboratory" className="site-button-secondary">
                                        Explore Laboratory
                                    </Link>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {trustMetrics.map((metric) => (
                                        <div key={metric.label} className="site-signal-card">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                                            <div className="mt-3 site-display text-4xl text-slate-950">{metric.value}</div>
                                            <p className="mt-3 text-sm leading-6 text-slate-500">{metric.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <CommandCenterVisual />
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Core Surfaces"
                        title="Two flagship surfaces define the platform."
                        description="The product should read like a coordinated research company built it: one side for computation, one side for high-value academic writing."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 xl:grid-cols-2">
                        {platformPillars.map((pillar) => (
                            <div key={pillar.title} className={`site-panel-strong overflow-hidden p-0 ${pillar.accent}`}>
                                <div className="grid gap-6 p-7 md:p-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{pillar.eyebrow}</div>
                                            <h2 className="mt-4 max-w-xl font-serif text-4xl font-black tracking-tight">{pillar.title}</h2>
                                        </div>
                                        <div className="rounded-2xl border border-white/12 bg-white/8 p-3">
                                            <pillar.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <p className="max-w-2xl text-sm leading-7 text-white/72">{pillar.text}</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {pillar.stats.map((item) => (
                                            <div key={item} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white/90">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <Link href={pillar.href} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 transition hover:translate-y-[-1px]">
                                            {pillar.cta}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-4">
                <SiteContainer>
                    <div className="grid gap-10 xl:grid-cols-[0.85fr_1.15fr]">
                        <SectionHeading
                            eyebrow="Platform Signals"
                            title="The public site should communicate product maturity before a single click."
                            description="Every section below is intended to signal that the platform is deliberate, expensive, cohesive and built around serious mathematical work."
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            {systemHighlights.map((item) => (
                                <div key={item.title} className="site-panel p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-5 font-serif text-2xl font-black tracking-tight">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-4">
                <SiteContainer>
                    <div className="space-y-12">
                        {capabilityRows.map((row, index) => (
                            <div key={row.label} className={`grid items-center gap-8 xl:grid-cols-[0.92fr_1.08fr] ${index % 2 === 1 ? "xl:[&>*:first-child]:order-2 xl:[&>*:last-child]:order-1" : ""}`}>
                                <div className="space-y-5">
                                    <div className="site-eyebrow">{row.label}</div>
                                    <h2 className="site-display text-4xl md:text-5xl">{row.title}</h2>
                                    <p className="site-lead max-w-2xl">{row.text}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {row.chips.map((chip) => (
                                            <div key={chip} className="site-chip site-chip-active">
                                                {chip}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <CapabilityVisual kind={row.visual as "writer" | "lab"} />
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-8">
                <SiteContainer>
                    <div className="site-panel-strong overflow-hidden p-8 md:p-10">
                        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                            <div>
                                <div className="site-eyebrow">Product Direction</div>
                                <h2 className="site-display mt-4 text-4xl md:text-5xl">
                                    The homepage should feel like the front door of a serious research company.
                                </h2>
                            </div>
                            <div className="grid gap-4">
                                {productSignals.map((item) => (
                                    <div key={item} className="site-outline-card flex items-start gap-4 p-5">
                                        <div className="mt-1 rounded-full bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
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
