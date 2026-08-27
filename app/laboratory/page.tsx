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
        <div className="bg-[#fbfcfe] text-[#101114]">
            <section className="mx-auto max-w-[1180px] px-6 pb-8 pt-12 sm:px-8 lg:pb-10 lg:pt-16">
                <div className="max-w-[760px]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a828e]">MathSphere Laboratory</div>
                    <h1 className="mt-4 font-serif text-[clamp(3rem,5vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.05em]">
                        Focused mathematical workspaces.
                    </h1>
                    <div className="mt-6 h-[3px] w-14 bg-[#184eb8]" />
                    <p className="mt-5 max-w-[650px] text-[16px] leading-7 text-[#626b77]">
                        Choose a studio, enter the problem and work directly with exact results, numerical checks and large visualizations. No extra product layers around the computation.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-[1180px] px-6 pb-12 sm:px-8">
                <div className="grid gap-4 md:grid-cols-2">
                    {modules.map((module, index) => {
                        const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? AreaChart;
                        return (
                            <Link
                                key={module.id}
                                href={`/laboratory/${module.slug}`}
                                className="group grid min-h-[190px] grid-cols-[1fr_auto] rounded-[12px] border border-[#e0e5eb] bg-white p-6 shadow-[0_4px_18px_rgba(22,34,52,0.025)]"
                                style={{ contentVisibility: "auto", containIntrinsicSize: "190px" }}
                            >
                                <div className="flex min-w-0 flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#eef4ff] text-[#184eb8]">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a929d]">
                                            {String(index + 1).padStart(2, "0")} · {module.category}
                                        </div>
                                    </div>
                                    <h2 className="mt-5 font-serif text-[28px] tracking-[-0.035em] text-[#16191e]">{module.title}</h2>
                                    <p className="mt-2 max-w-[500px] text-[13px] leading-6 text-[#68717d]">
                                        {moduleDescriptions[module.slug] || module.summary}
                                    </p>
                                    <div className="mt-auto pt-5 text-[12px] font-semibold text-[#184eb8]">Open workspace</div>
                                </div>
                                <div className="flex items-end pl-5 text-[#184eb8]">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="border-y border-[#e7eaf0] bg-white">
                <div className="mx-auto grid max-w-[1180px] gap-6 px-6 py-7 sm:px-8 md:grid-cols-3">
                    {[
                        ["Exact first", "Prefer exact symbolic results, then use numerical methods to verify or extend them."],
                        ["Visual by default", "Plots are treated as primary mathematical output, not as a small afterthought."],
                        ["Reproducible output", "Inputs, assumptions, methods and results remain structured for later use."],
                    ].map(([title, text]) => (
                        <div key={title}>
                            <div className="text-[12px] font-semibold text-[#20242b]">{title}</div>
                            <p className="mt-1.5 text-[11px] leading-5 text-[#6d7581]">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
