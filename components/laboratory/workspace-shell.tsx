"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

function modeLabel(mode: LaboratoryModuleMeta["computation_mode"]) {
    if (mode === "hybrid") {
        return "Gibrid";
    }
    if (mode === "server") {
        return "Server";
    }
    return "Lokal";
}

function capabilityLabel(value: string) {
    const labels: Record<string, string> = {
        "Matrix algebra": "Matritsa algebrasi",
        "Heatmap and basis transform": "Heatmap va bazis almashtirish",
        "Determinant and inverse": "Determinant va teskari matritsa",
        "Standard writer bridge": "Standart writer eksporti",
        "Numerical integration": "Sonli integrallash",
        "Function preview": "Funksiya ko'rinishi",
        "Method comparison": "Usullar taqqoslanishi",
        "Euler and Heun methods": "Euler va Heun usullari",
        "Initial value problems": "Boshlang'ich qiymatli masalalar",
        "Notebook workspace": "Notebook ish maydoni",
        "Series convergence": "Qatorlar konvergentsiyasi",
        "One-sided limits": "Bir tomonlama limitlar",
        "Taylor and power series": "Taylor va darajali qatorlar",
        "Analytic geometry": "Analitik geometriya",
        "Line intersection": "To'g'ri chiziqlar kesishishi",
        "Theorem planning": "Teorema rejalash",
        "Proof skeletons": "Isbot skeletlari",
        "Strategy presets": "Strategiya presetlari",
        "Jupyter-like notebook": "Jupyter uslubidagi notebook",
        "Modular cells": "Modulli cell bloklar",
        "Math drafting workspace": "Matematik yozuv ish maydoni",
        "Descriptive statistics": "Tasviriy statistika",
        "Distribution analysis": "Taqsimot tahlili",
        "Histogram viz": "Gistogramma vizualizatsiyasi",
        "Fractal rendering": "Fraktal chizish",
        "Conformal mapping": "Konformal akslantirish",
        "Phase portrait": "Fazoviy portret",
        "Complex plane sync": "Kompleks tekislik sinxroni",
        "Fourier analysis": "Furye tahlili",
        "FFT spectral density": "FFT spektral zichligi",
        "Waveform synthesis": "To'lqin sintezi",
        "Noise simulation": "Shovqin simulyatsiyasi",
        "Root-finding algorithms": "Ildiz topish algoritmlari",
        "Regression analyzer": "Regressiya tahlili",
        "Newton-Raphson viz": "Newton-Raphson vizualizatsiyasi",
        "Least Squares fitting": "Eng kichik kvadratlar moslashuvi",
        "Topology visualization": "Topologiya vizualizatsiyasi",
        "Force-directed layout": "Kuchga asoslangan joylashuv",
        "Dijkstra pathfinding": "Dijkstra yo'l topishi",
        "Matrix analysis": "Matritsa tahlili",
        "Gradient Descent solver": "Gradient descent yechimi",
        "3D Cost landscapes": "3D xarajat sirtlari",
        "Learning rate analysis": "O'rganish qadamini tahlil qilish",
        "Convergence logging": "Konvergentsiya jurnali",
        "Modulli laboratoriya ish joyi": "Modulli laboratoriya ish joyi",
        "Moslashuvchan arxitektura": "Moslashuvchan arxitektura",
    };

    return labels[value] || value;
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
        <div className="space-y-4">
            <div className="site-panel-strong p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                        <Link
                            href="/laboratory"
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground transition hover:text-foreground hover:bg-muted/50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                            <LaboratoryModuleIcon name={module.icon_name} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Laboratoriya moduli</div>
                            <div className="mt-1 truncate font-serif text-2xl font-black leading-none">{module.title}</div>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground line-clamp-2">
                                {module.description || module.summary}
                            </p>
                        </div>
                    </div>


                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {module.category}
                        </div>
                        <div className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {modeLabel(module.computation_mode)}
                        </div>
                        <div className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {module.estimated_minutes || 10} daqiqa
                        </div>
                        <div className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${definition ? "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                            {definition ? "Interfeys tayyor" : "Interfeys ulanmagan"}
                        </div>
                    </div>
                </div>


                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
                    {(definition?.capabilities || ["Modulli laboratoriya ish joyi", "Moslashuvchan arxitektura"]).map((capability) => (
                        <div key={capability} className="rounded-full border border-border/60 bg-muted/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {capabilityLabel(capability)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                    <div className="site-outline-card overflow-hidden">
                        <div className="border-b border-border/50 bg-muted/10 px-4 py-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Navigatsiya</div>
                            <div className="font-serif text-lg font-bold">Modullar</div>
                        </div>
                        <div className="p-2 space-y-1 bg-background/30">
                            {modules.map((entry) => {
                                const active = entry.slug === module.slug;
                                return (
                                    <Link
                                        key={entry.slug}
                                        href={`/laboratory/${entry.slug}`}
                                        className={`group block rounded-xl border border-transparent px-3 py-2.5 transition-colors ${
                                            active ? "bg-accent/10 border-accent/20" : "hover:bg-muted/50 hover:border-border/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-lg p-2 transition-colors ${active ? "bg-accent text-background" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                                                <LaboratoryModuleIcon name={entry.icon_name} className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`truncate text-sm font-semibold ${active ? "text-accent" : "text-foreground"}`}>{entry.title}</div>
                                                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
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


                <div className="space-y-4 min-w-0">
                    {ModuleComponent ? (
                        <ModuleComponent module={module} />
                    ) : (
                        <div className="site-panel-strong p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Interfeys ulanmagan</div>
                            <h2 className="font-serif text-3xl font-black max-w-lg">Bu modul registrda bor, lekin frontend komponenti hali tayyor emas.</h2>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
                                Arxitektura modullarni kengaytirish uchun tayyor, lekin hozircha bu bo&apos;limga ko&apos;rinadigan ish joyi ulanmagan.
                            </p>
                            <Link href="/laboratory" className="site-button-primary mt-8">
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
