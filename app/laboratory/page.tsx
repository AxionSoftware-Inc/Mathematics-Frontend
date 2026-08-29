import Link from "next/link";
import { Activity, ArrowRight, AreaChart, Blocks, Sigma, TrendingUp } from "lucide-react";

import { fetchLaboratoryModules } from "@/lib/laboratory";

const moduleIcons = {
    "integral-studio": Sigma,
    "differential-studio": Activity,
    "matrix-studio": Blocks,
    "probability-studio": AreaChart,
    "series-limit-studio": TrendingUp,
} as const;

const moduleDescriptions: Record<string, string> = {
    "integral-studio": "Symbolic, numerical and geometric integration in one focused workspace.",
    "differential-studio": "Derivatives, Jacobians, Hessians and differential systems with visual analysis.",
    "matrix-studio": "Matrix algebra, spectral analysis and transformations with clear geometric output.",
    "probability-studio": "Distributions, inference, regression and simulation built for visual inspection.",
    "series-limit-studio": "Limits, sequences, series and convergence workflows with precise comparison.",
};

export default async function LaboratoryPage() {
    const modules = await fetchLaboratoryModules();

    return (
        <div className="min-h-full bg-[var(--ax-canvas)] text-[var(--ax-text)]">
            <section className="mx-auto max-w-[1180px] px-6 pb-8 pt-12 sm:px-8 lg:pb-10 lg:pt-16">
                <div className="grid gap-8 border-b border-[var(--ax-line)] pb-9 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
                    <div className="max-w-[760px]">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">MathSphere Laboratory</div>
                        <h1 className="mt-4 font-serif text-[clamp(3rem,5vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.05em]">Focused mathematical workspaces.</h1>
                        <div className="mt-6 h-[3px] w-14 bg-[var(--ax-accent)]" />
                        <p className="mt-5 max-w-[650px] text-[16px] leading-7 text-[var(--ax-text-soft)]">Choose a studio, enter the problem and work directly with exact results, numerical checks and large visualizations.</p>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-[var(--ax-line)] border-y border-[var(--ax-line)] py-3 text-center">
                        <div><div className="font-serif text-2xl">{modules.length}</div><div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[var(--ax-text-faint)]">Studios</div></div>
                        <div><div className="font-serif text-2xl">2D/3D</div><div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[var(--ax-text-faint)]">Visual</div></div>
                        <div><div className="font-serif text-2xl">Local</div><div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[var(--ax-text-faint)]">Compute</div></div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1180px] px-6 pb-12 sm:px-8">
                <div className="divide-y divide-[var(--ax-line)] border-y border-[var(--ax-line)] bg-[var(--ax-surface)]">
                    {modules.map((module, index) => {
                        const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? AreaChart;
                        return (
                            <Link key={module.id} href={`/laboratory/${module.slug}`} className="group grid min-h-[142px] gap-5 px-4 py-5 transition-colors hover:bg-[var(--ax-surface-soft)] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center sm:px-6" style={{ contentVisibility: "auto", containIntrinsicSize: "142px" }}>
                                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-accent-soft)] text-[var(--ax-accent)]"><Icon className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-text-faint)]">{String(index + 1).padStart(2, "0")} · {module.category}</div>
                                    <h2 className="mt-1.5 font-serif text-[27px] tracking-[-0.035em]">{module.title}</h2>
                                    <p className="mt-1 max-w-[700px] text-[12px] leading-5 text-[var(--ax-text-soft)]">{moduleDescriptions[module.slug] || module.summary}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--ax-accent)]">Open workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="border-y border-[var(--ax-line)] bg-[var(--ax-surface)]">
                <div className="mx-auto grid max-w-[1180px] gap-0 px-6 sm:px-8 md:grid-cols-3">
                    {[
                        ["Exact first", "Prefer exact symbolic results, then use numerical methods to verify or extend them."],
                        ["Visual by default", "Plots are treated as primary mathematical output, not as a small afterthought."],
                        ["Reproducible output", "Inputs, assumptions, methods and results remain structured for later use."],
                    ].map(([title, text], index) => (
                        <div key={title} className={`py-6 md:px-7 ${index ? "md:border-l md:border-[var(--ax-line)]" : ""}`}>
                            <div className="text-[12px] font-semibold">{title}</div>
                            <p className="mt-1.5 text-[11px] leading-5 text-[var(--ax-text-soft)]">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
