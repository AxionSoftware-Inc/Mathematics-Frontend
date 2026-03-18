import Link from "next/link";
import { ArrowRight, Cpu, Layers3, Sigma, Sparkles } from "lucide-react";

import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchLaboratoryModules } from "@/lib/laboratory";

function modeLabel(mode: "client" | "hybrid" | "server") {
    if (mode === "hybrid") {
        return "Hybrid";
    }
    if (mode === "server") {
        return "Server";
    }
    return "Client";
}

export default async function LaboratoryPage() {
    const modules = await fetchLaboratoryModules();

    return (
        <div className="site-shell">
            <SiteSection className="py-5 md:py-6">
                <SiteContainer className="max-w-[1880px] px-3 md:px-5 xl:px-6">
                    <div className="space-y-4">
                        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="site-panel-strong p-4 lg:p-5">
                                <div className="site-eyebrow">Mathematical Laboratory</div>
                                <h1 className="mt-1 max-w-5xl font-serif text-4xl font-black lg:text-6xl">
                                    Full-screen workbench, modulli solverlar va writer bilan bog&apos;lanadigan real laboratoriya.
                                </h1>
                                <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
                                    Interaktiv hisoblar client-side ishlaydi, registry va modul boshqaruvi backendda turadi.
                                    Shu sabab laboratoriya tez, kengayadigan va serverga ortiqcha yuk bermaydigan muhit bo&apos;lib qoldi.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link href={`/laboratory/${modules[0]?.slug || "series-limits-studio"}`} className="site-button-primary">
                                        Ishchi modulni ochish
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link href="/write/new" className="site-button-secondary">
                                        Writer ochish
                                    </Link>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                                <div className="site-panel p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Layers3 className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em]">Modules</span>
                                    </div>
                                    <div className="mt-3 font-serif text-4xl font-black">{modules.length}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">active workspaces</div>
                                </div>
                                <div className="site-panel p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Cpu className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em]">Compute</span>
                                    </div>
                                    <div className="mt-3 font-serif text-4xl font-black">Client</div>
                                    <div className="mt-1 text-sm text-muted-foreground">instant feedback mode</div>
                                </div>
                                <div className="site-panel p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Sigma className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em]">Math</span>
                                    </div>
                                    <div className="mt-3 font-serif text-4xl font-black">Live</div>
                                    <div className="mt-1 text-sm text-muted-foreground">series, limits, geometry</div>
                                </div>
                                <div className="site-panel p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Sparkles className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em]">Export</span>
                                    </div>
                                    <div className="mt-3 font-serif text-4xl font-black">Writer</div>
                                    <div className="mt-1 text-sm text-muted-foreground">ready handoff</div>
                                </div>
                            </div>
                        </div>

                        <div className="site-panel p-3 lg:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                                <div>
                                    <div className="site-eyebrow">Workspace Registry</div>
                                    <h2 className="mt-1 font-serif text-2xl font-black">Laboratory Modules</h2>
                                </div>
                                <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    Hot-swappable architecture
                                </div>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                                {modules.map((module) => (
                                    <Link key={module.slug} href={`/laboratory/${module.slug}`} className="rounded-[1.4rem] border border-border bg-background/70 p-4 transition hover:border-foreground/40 hover:bg-background">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                                <LaboratoryModuleIcon name={module.icon_name} className="h-4 w-4" />
                                            </div>
                                            <div className="rounded-full border border-border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                                {modeLabel(module.computation_mode)}
                                            </div>
                                        </div>
                                        <h3 className="mt-4 font-serif text-2xl font-black">{module.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.summary}</p>
                                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                            <span>{module.category}</span>
                                            <span className="inline-flex items-center gap-2 text-foreground">
                                                Workspace
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
