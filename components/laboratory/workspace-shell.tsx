"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FlaskConical, Info, Settings2 } from "lucide-react";

import { LabEngineProvider } from "@/components/laboratory/lab-engine";
import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

function modeLabel(mode: LaboratoryModuleMeta["computation_mode"]) {
    if (mode === "hybrid") return "Hybrid Engine";
    if (mode === "server") return "Server Cluster";
    return "Local Runtime";
}

export function LaboratoryWorkspaceShell({
    module,
    modules,
}: {
    module: LaboratoryModuleMeta;
    modules: LaboratoryModuleMeta[];
}) {
    const router = useRouter();
    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;
    const capabilities = definition?.capabilities || ["Standard Lab Instance", "Unified Geometry Engine"];

    return (
        <LabEngineProvider>
            <div className="space-y-4">
                <div className="site-panel border-border/60 px-4 py-3">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <Link
                                    href="/laboratory"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20">
                                    <LaboratoryModuleIcon name={module.icon_name} className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Laboratory Workspace</div>
                                    <h1 className="truncate font-serif text-2xl font-black text-foreground">{module.title}</h1>
                                </div>
                            </div>

                            <div className="flex min-w-[220px] flex-1 items-center justify-end gap-2 max-sm:w-full">
                                <label className="sr-only" htmlFor="lab-module-navigation">
                                    Module navigation
                                </label>
                                <select
                                    id="lab-module-navigation"
                                    value={module.slug}
                                    onChange={(event) => router.push(`/laboratory/${event.target.value}`)}
                                    className="h-10 min-w-[220px] rounded-2xl border border-border/60 bg-background/70 px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent max-sm:w-full"
                                >
                                    {modules.map((entry) => (
                                        <option key={entry.slug} value={entry.slug}>
                                            {entry.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-[280px] flex-1 text-sm leading-6 text-muted-foreground">
                                {module.description || module.summary}
                            </p>
                            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                {module.category}
                            </div>
                            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                {modeLabel(module.computation_mode)}
                            </div>
                            <div
                                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                    definition ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700"
                                }`}
                            >
                                {definition ? "Engine Ready" : "UI Pending"}
                            </div>
                        </div>
                    </div>
                </div>

                <main className="min-w-0">
                    {ModuleComponent ? (
                        <ModuleComponent module={module} />
                    ) : (
                        <div className="site-panel-strong flex min-h-[500px] flex-col items-center justify-center p-12 text-center ring-1 ring-white/10 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.4)]">
                            <div className="relative mb-8">
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-[inset_0_4px_12px_rgba(245,158,11,0.1)]">
                                    <Info className="h-10 w-10" />
                                </div>
                            </div>
                            <h2 className="font-serif text-3xl font-black leading-tight text-foreground">Module Bridge Available</h2>
                            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground/80">
                                Registry confirmed this module, lekin <span className="font-bold text-accent">{module.title}</span> uchun maxsus UI hali tayyor emas.
                            </p>
                            <Link
                                href="/laboratory"
                                className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-foreground px-8 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-background transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-slate-900/20"
                            >
                                Laboratory Control
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </main>

                <div className="site-panel border-border/60 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                            <FlaskConical className="h-3.5 w-3.5 text-accent" />
                            {module.category}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                            <Settings2 className="h-3.5 w-3.5 text-accent" />
                            {modeLabel(module.computation_mode)}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                            <Info className="h-3.5 w-3.5 text-accent" />
                            {modules.length} modules
                        </div>
                        {capabilities.slice(0, 4).map((capability) => (
                            <div key={capability} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                {capability}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </LabEngineProvider>
    );
}
