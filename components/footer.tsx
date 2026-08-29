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
        <footer className="border-t border-[var(--ax-line)] bg-[var(--ax-surface)] py-7">
            <SiteContainer className="flex flex-col items-start justify-between gap-3 text-[11px] text-[var(--ax-text-faint)] sm:flex-row sm:items-center">
                <div>&copy; {new Date().getFullYear()} MathSphere Laboratory · Axion Science</div>
                <Link
                    href="/laboratory"
                    className="rounded-[var(--ax-radius-control)] px-1 py-1 font-semibold text-[var(--ax-accent)] outline-none transition-colors duration-[var(--ax-motion-fast)] hover:text-[var(--ax-accent-strong)] focus-visible:shadow-[var(--ax-focus-ring)]"
                >
                    Open Laboratory
                </Link>
            </SiteContainer>
        </footer>
    );
}
