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
                    <div
                        className="lab-workspace-stage min-h-[calc(100dvh-88px)] overflow-hidden rounded-[11px] border border-[#dde2e9] bg-white shadow-[0_4px_18px_rgba(20,32,50,0.025)]
                        [&>*]:!rounded-none [&>*]:!border-0 [&>*]:!bg-transparent
                        [&_input]:!rounded-[8px] [&_textarea]:!rounded-[8px] [&_select]:!rounded-[8px]
                        [&_.rounded-3xl]:!rounded-[10px] [&_.rounded-2xl]:!rounded-[8px]
                        [&_.shadow-sm]:!shadow-none [&_.shadow-md]:!shadow-none [&_.shadow-lg]:!shadow-none [&_.shadow-xl]:!shadow-none [&_.shadow-2xl]:!shadow-none [&_.shadow-inner]:!shadow-none
                        [&_.site-lab-card]:!rounded-[9px] [&_.site-lab-card]:!border-[#e1e5eb] [&_.site-lab-card]:!bg-white [&_.site-lab-card]:!shadow-none
                        [&_.site-panel]:!rounded-[10px] [&_.site-panel]:!border-[#e1e5eb] [&_.site-panel]:!bg-white [&_.site-panel]:!shadow-none
                        [&_.site-panel-strong]:!rounded-[10px] [&_.site-panel-strong]:!border-[#dfe4ea] [&_.site-panel-strong]:!bg-white [&_.site-panel-strong]:!shadow-none
                        [&_.site-outline-card]:!rounded-[8px] [&_.site-outline-card]:!border-[#e2e6ec] [&_.site-outline-card]:!bg-white
                        [&_.site-soft-panel]:!rounded-[9px] [&_.site-soft-panel]:!border-[#e4e8ed] [&_.site-soft-panel]:!bg-[#fbfcfe]
                        [&_.site-lab-card_.site-lab-card]:!border-[#e8ebef] [&_.site-lab-card_.site-lab-card]:!bg-[#fcfdff]"
                    >
                        <ModuleComponent module={module} />
                    </div>
                ) : (
                    <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[11px] border border-[#e0e5eb] bg-white p-10 text-center">
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
