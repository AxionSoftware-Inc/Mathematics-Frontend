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
        <footer className="border-t border-[var(--ax-line)] bg-[var(--ax-surface)] py-10">
            <SiteContainer className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                    <div className="font-serif text-[24px] tracking-[-0.035em] text-[var(--ax-text)]">MathSphere Laboratory</div>
                    <p className="mt-2 max-w-md text-[11px] leading-5 text-[var(--ax-text-faint)]">Scientific computation and mathematical visualization inside the Axion Science ecosystem.</p>
                    <div className="mt-6 text-[10px] text-[var(--ax-text-faint)]">&copy; {new Date().getFullYear()} Axion Science</div>
                </div>
                <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[var(--ax-text-soft)]" aria-label="Footer">
                    <Link href="/#product" className="hover:text-[var(--ax-text)]">Product</Link>
                    <Link href="/#studios" className="hover:text-[var(--ax-text)]">Studios</Link>
                    <Link href="/#ecosystem" className="hover:text-[var(--ax-text)]">Ecosystem</Link>
                    <Link href="/laboratory" className="text-[var(--ax-accent)] hover:text-[var(--ax-accent-strong)]">Open Laboratory →</Link>
                </nav>
            </SiteContainer>
        </footer>
    );
}
