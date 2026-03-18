"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

function modeLabel(mode: LaboratoryModuleMeta["computation_mode"]) {
    if (mode === "hybrid") {
        return "Hybrid";
    }
    if (mode === "server") {
        return "Server";
    }
    return "Client";
}

export function LaboratoryWorkspaceShell({
    module,
    modules,
}: {
    module: LaboratoryModuleMeta;
    modules: LaboratoryModuleMeta[];
}) {
    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;

    return (
        <div className="space-y-3">
            <div className="site-panel p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <Link
                            href="/laboratory"
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/70 text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            <LaboratoryModuleIcon name={module.icon_name} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="site-eyebrow">Mathematical Laboratory</div>
                            <div className="truncate font-serif text-2xl font-black">{module.title}</div>
                            <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">
                                {module.description || module.summary}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            {module.category}
                        </div>
                        <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            {modeLabel(module.computation_mode)}
                        </div>
                        <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            {module.estimated_minutes || 10} min
                        </div>
                        <div className="rounded-full border border-border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            {definition ? "Adapter ready" : "Adapter missing"}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {(definition?.capabilities || ["Modular laboratory workspace", "Hot-swappable architecture"]).map((capability) => (
                        <div key={capability} className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            {capability}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[250px_minmax(0,1fr)]">
                <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
                    <div className="site-panel p-2.5">
                        <div className="px-2 pb-3">
                            <div className="site-eyebrow">Modules</div>
                            <div className="mt-1 text-base font-black">Workspaces</div>
                        </div>
                        <div className="space-y-2">
                            {modules.map((entry) => {
                                const active = entry.slug === module.slug;
                                return (
                                    <Link
                                        key={entry.slug}
                                        href={`/laboratory/${entry.slug}`}
                                        className={`block rounded-[1.15rem] border px-3 py-2.5 transition ${
                                            active ? "border-foreground bg-foreground text-background" : "border-border bg-background/70 hover:border-foreground/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-2xl p-2 ${active ? "bg-background/10" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
                                                <LaboratoryModuleIcon name={entry.icon_name} className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-black">{entry.title}</div>
                                                <div className={`mt-1 line-clamp-1 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                                                    {entry.summary}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <div className="space-y-3">
                    {ModuleComponent ? (
                        <ModuleComponent module={module} />
                    ) : (
                        <div className="site-panel p-5">
                            <div className="site-eyebrow">Frontend adapter missing</div>
                            <h2 className="mt-2 font-serif text-3xl font-black">Bu modul backendda bor, lekin frontend adapterni kutyapti.</h2>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                Registry saqlanib turadi, lekin workspace komponent ulanmagan. Shu arxitektura modulni qo&apos;shish va olib tashlashni oson qiladi.
                            </p>
                            <Link href="/laboratory" className="site-button-primary mt-5">
                                Boshqa modulga o&apos;tish
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
