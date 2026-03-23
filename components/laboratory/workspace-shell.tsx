"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { LabEngineProvider } from "@/components/laboratory/lab-engine";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

export function LaboratoryWorkspaceShell({
    module,
}: {
    module: LaboratoryModuleMeta;
    modules: LaboratoryModuleMeta[];
}) {
    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;

    return (
        <LabEngineProvider>
            <div className="space-y-3">
                <main className="min-w-0">
                    {ModuleComponent ? (
                        <div className="lab-workspace-stage">
                            <ModuleComponent module={module} />
                        </div>
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

            </div>
        </LabEngineProvider>
    );
}
