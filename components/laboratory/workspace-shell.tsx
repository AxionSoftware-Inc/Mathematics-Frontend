"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, FlaskConical, Settings2, Info } from "lucide-react";

import { LaboratoryModuleIcon } from "@/components/laboratory/module-icon";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { LabEngineProvider } from "@/components/laboratory/lab-engine";

function modeLabel(mode: LaboratoryModuleMeta["computation_mode"]) {
    if (mode === "hybrid") return "Hybrid Engine";
    if (mode === "server") return "Server Cluster";
    return "Local Runtime";
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
        <LabEngineProvider>
            <div className="space-y-6">
                {/* HIGH-END HEADER PANEL */}
                <div className="site-panel-strong relative overflow-hidden p-6 ring-1 ring-white/10 shadow-[0_40px_100px_-40px_rgba(15,23,42,0.4)]">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-emerald-500/5 transition-opacity duration-1000 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
                    
                    <div className="relative flex flex-wrap items-start justify-between gap-6">
                        <div className="flex min-w-0 items-start gap-6">
                            <Link
                                href="/laboratory"
                                className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95"
                            >
                                <ArrowLeft className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                            </Link>
                            
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/20">
                                <LaboratoryModuleIcon name={module.icon_name} className="h-6 w-6 text-white" />
                            </div>
                            
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-accent/80">Module Workspace</span>
                                    <div className="h-px w-8 bg-accent/20" />
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${definition ? "text-emerald-500" : "text-amber-500"}`}>
                                        {definition ? "Engine Ready" : "UI Pending"}
                                    </span>
                                </div>
                                <h1 className="mt-2 truncate font-serif text-3xl font-black tracking-tight text-foreground">{module.title}</h1>
                                <p className="mt-3 max-w-4xl text-sm italic leading-relaxed text-muted-foreground/80">
                                    {module.description || module.summary}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-10 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 backdrop-blur-md">
                                <FlaskConical className="h-3.5 w-3.5 text-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{module.category}</span>
                            </div>
                            <div className="flex h-10 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 backdrop-blur-md">
                                <Settings2 className="h-3.5 w-3.5 text-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{modeLabel(module.computation_mode)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-6">
                        {(definition?.capabilities || ["Standard Lab Instance", "Unified Geometry Engine"]).map((capability) => (
                            <div key={capability} className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3.5 py-1.5 transition-colors hover:bg-white/10">
                                <div className="h-1 w-1 rounded-full bg-accent" />
                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{capabilityLabel(capability)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                    {/* ENHANCED SIDEBAR */}
                    <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                        <div className="site-panel-strong overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Navigation</span>
                                </div>
                            </div>
                            
                            <div className="max-h-[70vh] overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                <div className="space-y-1.5">
                                    {modules.map((entry) => {
                                        const active = entry.slug === module.slug;
                                        return (
                                            <Link
                                                key={entry.slug}
                                                href={`/laboratory/${entry.slug}`}
                                                className={`group relative block overflow-hidden rounded-xl border transition-all duration-300 ${
                                                    active 
                                                        ? "border-accent/30 bg-accent/10 shadow-lg shadow-accent/5 ring-1 ring-accent/20" 
                                                        : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                                }`}
                                            >
                                                {active && <div className="absolute left-0 top-0 h-full w-1 bg-accent" />}
                                                <div className="flex items-center gap-4 p-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ease-spring ${
                                                        active 
                                                            ? "bg-accent text-white rotate-3 scale-110" 
                                                            : "bg-white/5 text-muted-foreground group-hover:text-accent group-hover:rotate-6 group-hover:scale-105"
                                                    }`}>
                                                        <LaboratoryModuleIcon name={entry.icon_name} className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`truncate text-sm font-black italic tracking-tight ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                            {entry.title}
                                                        </div>
                                                        <div className="mt-0.5 line-clamp-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                                            {entry.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN WORKSPACE VIEW */}
                    <main className="min-w-0 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                        {ModuleComponent ? (
                            <ModuleComponent module={module} />
                        ) : (
                            <div className="site-panel-strong flex min-h-[500px] flex-col items-center justify-center p-12 text-center ring-1 ring-white/10 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.4)]">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20 duration-[2000ms]" />
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-[inset_0_4px_12px_rgba(245,158,11,0.1)]">
                                        <Info className="h-10 w-10" />
                                    </div>
                                </div>
                                <h2 className="font-serif text-3xl font-black italic leading-tight text-foreground">
                                    Module Bridge Available
                                </h2>
                                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground/80">
                                    System registry confirms this module is active. However, the advanced visual analytics panel for 
                                    <span className="text-accent font-bold"> {module.title}</span> is still in development phase.
                                </p>
                                <Link href="/laboratory" className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-foreground px-8 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-background transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-slate-900/20">
                                    Laboratory Control
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </LabEngineProvider>
    );
}
