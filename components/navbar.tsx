"use client";

import Link from "next/link";
import { Moon, Orbit, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SiteContainer } from "@/components/public-shell";

export default function Navbar() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fbfbfd]/88 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-black/82">
            <SiteContainer className="flex h-16 items-center justify-between gap-6">
                <Link href="/" className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1d4ed8]/20 bg-white text-[#1d4ed8] shadow-sm dark:border-blue-400/20 dark:bg-[#111]">
                        <Orbit className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                    <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#17171b] dark:text-[#f5f5f7]">
                        MathSphere Laboratory
                    </div>
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="hidden items-center gap-1 md:flex">
                        <Link href="/#studios" className="rounded-full px-4 py-2 text-xs font-semibold text-[#606067] transition hover:bg-black/[0.035] hover:text-black dark:text-[#a5a5ab] dark:hover:bg-white/[0.05] dark:hover:text-white">
                            Studios
                        </Link>
                        <Link href="/laboratory" className="rounded-full px-4 py-2 text-xs font-semibold text-[#606067] transition hover:bg-black/[0.035] hover:text-black dark:text-[#a5a5ab] dark:hover:bg-white/[0.05] dark:hover:text-white">
                            Laboratory
                        </Link>
                    </div>

                    <Link href="/laboratory" className="ml-1 inline-flex h-9 items-center rounded-full bg-[#101014] px-4 text-xs font-semibold text-white transition hover:scale-[1.015] dark:bg-white dark:text-black">
                        Open Laboratory
                    </Link>

                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.07] bg-white text-[#55555b] transition hover:bg-black/[0.03] dark:border-white/[0.08] dark:bg-[#111] dark:text-[#c4c4c9] dark:hover:bg-white/[0.06]"
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-3.5 w-3.5 dark:hidden" />
                        <Moon className="hidden h-3.5 w-3.5 dark:block" />
                    </button>
                </div>
            </SiteContainer>
        </div>
    );
}
