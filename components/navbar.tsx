"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SiteContainer } from "@/components/public-shell";

const navLinks = [
    { name: "Asosiy", href: "/" },
    { name: "Kutubxona", href: "/library" },
    { name: "Jurnal", href: "/journal" },
    { name: "Akademiya", href: "/academy" },
    { name: "Laboratoriya", href: "/laboratory" },
    { name: "Notebook", href: "/notebook" },
    { name: "Health", href: "/observability" },
    { name: "Hamkorlik", href: "/about" },
];

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    if (pathname === "/write/new" || /^\/write\/[^/]+$/.test(pathname)) {
        return null;
    }

    return (
        <div className="sticky top-0 z-50 border-b border-border/70 bg-background/82 backdrop-blur-xl">
            <SiteContainer className="flex h-20 items-center justify-between gap-6">
                <Link href="/" className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-border/70 bg-foreground text-background shadow-lg shadow-black/10">
                        <span className="font-serif text-xl font-black">M</span>
                    </div>
                    <div>
                        <div className="font-serif text-2xl font-black tracking-tight">MathSphere</div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                            Research computing and writing
                        </div>
                    </div>
                </Link>

                <div className="hidden items-center gap-2 lg:flex">
                    <div className="site-panel flex items-center gap-1 p-1.5">
                        {navLinks.map((link) => {
                            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                                        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <Link href="/write" className="site-button-primary">
                        Writer Workspace
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="site-outline-card flex h-11 w-11 items-center justify-center"
                    >
                        <Sun className="h-4 w-4 dark:hidden" />
                        <Moon className="hidden h-4 w-4 dark:block" />
                    </button>

                    <button
                        onClick={() => setIsOpen((value) => !value)}
                        className="site-outline-card flex h-11 w-11 items-center justify-center lg:hidden"
                    >
                        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </SiteContainer>

            {isOpen ? (
                <div className="border-t border-border/80 bg-background/95 lg:hidden">
                    <SiteContainer className="flex flex-col gap-2 py-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="site-outline-card px-4 py-3 text-sm font-bold"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/write" onClick={() => setIsOpen(false)} className="site-button-primary mt-2">
                            Writer Workspace
                        </Link>
                    </SiteContainer>
                </div>
            ) : null}
        </div>
    );
}
