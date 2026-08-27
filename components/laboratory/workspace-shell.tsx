"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { LabEngineProvider } from "@/components/laboratory/lab-engine";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

export function LaboratoryWorkspaceShell({ module }: { module: LaboratoryModuleMeta }) {
    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;

    return (
        <LabEngineProvider>
            <main className="min-w-0">
                {ModuleComponent ? (
                    <div className="lab-workspace-stage overflow-hidden rounded-[12px] border border-[#e0e5eb] bg-white shadow-[0_5px_22px_rgba(20,32,50,0.035)]">
                        <ModuleComponent module={module} />
                    </div>
                ) : (
                    <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[12px] border border-[#e0e5eb] bg-white p-10 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#fff7e6] text-[#a46200]">
                            <Info className="h-6 w-6" />
                        </div>
                        <h2 className="mt-6 font-serif text-3xl tracking-[-0.035em] text-[#171a20]">Workspace is not connected yet.</h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[#69727e]">
                            Registry recognizes <span className="font-semibold text-[#20242b]">{module.title}</span>, but its dedicated interface is not available yet.
                        </p>
                        <Link href="/laboratory" className="mt-7 inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#0b1f46] px-5 text-xs font-semibold text-white">
                            Back to Laboratory
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </main>
        </LabEngineProvider>
    );
}
