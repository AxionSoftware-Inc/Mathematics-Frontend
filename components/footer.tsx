"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SiteContainer } from "@/components/public-shell";

export default function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith("/laboratory/")) {
        return null;
    }

    return (
        <footer className="border-t border-black/[0.06] bg-[#fbfbfd] py-7 dark:border-white/[0.07] dark:bg-black">
            <SiteContainer className="flex flex-col items-start justify-between gap-3 text-xs text-[#8b8b91] sm:flex-row sm:items-center">
                <div>&copy; {new Date().getFullYear()} MathSphere Laboratory</div>
                <div className="flex items-center gap-5">
                    <Link href="/#studios" className="transition hover:text-[#101014] dark:hover:text-white">
                        Studios
                    </Link>
                    <Link href="/laboratory" className="font-semibold text-[#4f5057] transition hover:text-[#101014] dark:text-[#b5b5bc] dark:hover:text-white">
                        Open Laboratory
                    </Link>
                </div>
            </SiteContainer>
        </footer>
    );
}
