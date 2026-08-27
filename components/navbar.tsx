"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SiteContainer } from "@/components/public-shell";

export default function Navbar() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="sticky top-0 z-50 border-b border-border/70 bg-background/82 backdrop-blur-xl">
            <SiteContainer className="flex h-20 items-center justify-between gap-6">
                <Link href="/laboratory" className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-border/70 bg-foreground text-background shadow-lg shadow-black/10">
                        <span className="font-serif text-xl font-black">M</span>
                    </div>
                    <div>
                        <div className="font-serif text-2xl font-black tracking-tight">MathSphere Laboratory</div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                            Scientific computation workspace
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <Link href="/laboratory" className="site-button-primary">
                        Laboratory
                    </Link>
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="site-outline-card flex h-11 w-11 items-center justify-center"
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-4 w-4 dark:hidden" />
                        <Moon className="hidden h-4 w-4 dark:block" />
                    </button>
                </div>
            </SiteContainer>
        </div>
    );
}
