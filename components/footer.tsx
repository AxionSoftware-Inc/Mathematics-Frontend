"use client";

import Link from "next/link";
import { ArrowUpRight, Globe, Infinity as InfinityIcon, Mail } from "lucide-react";
import { usePathname } from "next/navigation";

import { SiteContainer } from "@/components/public-shell";

const links = [
    { label: "Kutubxona", href: "/library" },
    { label: "Jurnal", href: "/journal" },
    { label: "Akademiya", href: "/academy" },
    { label: "Laboratoriya", href: "/laboratory" },
];

export default function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith("/write")) {
        return null;
    }

    return (
        <footer className="border-t border-border/80 bg-background/80 pb-10 pt-20">
            <SiteContainer className="space-y-10">
                <div className="grid gap-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
                    <div className="site-panel p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-border/70 bg-foreground text-background">
                                <span className="font-serif text-xl font-black">M</span>
                            </div>
                            <div>
                                <div className="font-serif text-2xl font-black">MathSphere</div>
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                                    Minimal premium ecosystem
                                </div>
                            </div>
                        </div>
                        <p className="mt-6 text-sm leading-7 text-muted-foreground">
                            O&apos;zbekistondagi matematika, ilmiy nashr, akademik kurs va eksperimental laboratoriya
                            oqimlarini bitta professional platformaga birlashtiruvchi tizim.
                        </p>
                        <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/60 p-4">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">Pozitsiya</div>
                            <p className="mt-3 text-sm leading-7 text-foreground/68">
                                Matematik mahsulot ham premium brend intizomi bilan taqdim etilishi mumkinligini ko&apos;rsatadigan interfeys.
                            </p>
                        </div>
                    </div>

                    <div className="site-panel p-8">
                        <div className="site-eyebrow">Navigatsiya</div>
                        <div className="mt-3 space-y-3">
                            {links.map((link) => (
                                <Link key={link.href} href={link.href} className="block text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="site-panel p-8">
                        <div className="site-eyebrow">Sahifalar</div>
                        <div className="mt-3 space-y-3">
                            <Link href="/about" className="block text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                Biz haqimizda
                            </Link>
                            <Link href="/write" className="block text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                Writer Workspace
                            </Link>
                            <Link href="/" className="block text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                Bosh sahifa
                            </Link>
                        </div>
                    </div>

                    <div className="site-panel p-8">
                        <div className="site-eyebrow">Aloqa</div>
                        <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <Globe className="mt-1 h-4 w-4 text-[var(--accent)]" />
                                <span>Toshkent, O&apos;zbekiston. Raqamli ta&apos;lim va tadqiqot markazi.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="mt-1 h-4 w-4 text-[var(--accent-alt)]" />
                                <span>info@mathsphere.uz</span>
                            </div>
                            <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-70">
                                Hamkorlik uchun yozish
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="site-divider" />

                <div className="flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <span>&copy; {new Date().getFullYear()} MathSphere.</span>
                        <InfinityIcon className="h-4 w-4 text-[var(--accent)]" />
                        <span>Aniqlik, struktura, davomiylik.</span>
                    </div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.26em]">Unified academic interface</div>
                </div>
            </SiteContainer>
        </footer>
    );
}
