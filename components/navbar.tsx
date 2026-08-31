import Link from "next/link";

import { SiteContainer } from "@/components/public-shell";

function LaboratoryMark() {
    return (
        <svg viewBox="0 0 40 40" className="h-9 w-9 text-[var(--ax-accent)]" aria-hidden="true">
            <circle cx="20" cy="20" r="17.2" fill="none" stroke="currentColor" strokeWidth="1.05" />
            <ellipse cx="20" cy="20" rx="7.8" ry="17.2" fill="none" stroke="currentColor" strokeWidth="0.78" opacity="0.68" />
            <ellipse cx="20" cy="20" rx="17.2" ry="7.5" fill="none" stroke="currentColor" strokeWidth="0.78" opacity="0.68" />
            <path d="M3 20h34M20 3v34" stroke="currentColor" strokeWidth="0.7" opacity="0.46" />
            <circle cx="31.7" cy="11.9" r="1.55" fill="currentColor" />
        </svg>
    );
}

const navLink = "rounded-[var(--ax-radius-control)] px-2.5 py-2 text-[12px] font-semibold text-[var(--ax-text-soft)] outline-none transition-colors duration-[var(--ax-motion-fast)] hover:bg-[var(--ax-surface-soft)] hover:text-[var(--ax-text)] focus-visible:shadow-[var(--ax-focus-ring)]";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-[var(--ax-line)] bg-[color-mix(in_srgb,var(--ax-surface)_94%,transparent)] backdrop-blur-xl">
            <SiteContainer className="flex h-[72px] items-center justify-between gap-6">
                <Link
                    href="/"
                    className="flex min-w-0 items-center gap-3.5 rounded-[var(--ax-radius-control)] outline-none focus-visible:shadow-[var(--ax-focus-ring)]"
                    aria-label="MathSphere Laboratory home"
                >
                    <LaboratoryMark />
                    <span className="min-w-0 leading-none">
                        <span className="block truncate font-serif text-[23px] font-medium tracking-[-0.035em] text-[var(--ax-text)]">
                            MathSphere
                        </span>
                        <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.28em] text-[var(--ax-text-faint)]">
                            Laboratory
                        </span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 xl:flex" aria-label="Mathematics product">
                    <Link href="/#product" className={navLink}>Product</Link>
                    <Link href="/#studios" className={navLink}>Studios</Link>
                    <Link href="/#capabilities" className={navLink}>Capabilities</Link>
                    <Link href="/#ecosystem" className={navLink}>Ecosystem</Link>
                </nav>

                <div className="flex items-center gap-2">
                    <Link href="/laboratory" className="hidden rounded-[var(--ax-radius-control)] px-3 py-2 text-[11px] font-semibold text-[var(--ax-text-soft)] transition-colors hover:bg-[var(--ax-surface-soft)] hover:text-[var(--ax-text)] sm:inline-flex">
                        All studios
                    </Link>
                    <Link
                        href="/laboratory"
                        className="inline-flex h-10 items-center rounded-[var(--ax-radius-control)] border border-transparent bg-[var(--ax-accent-strong)] px-4 text-[11px] font-semibold text-white outline-none transition-colors duration-[var(--ax-motion-fast)] hover:bg-[var(--ax-accent)] focus-visible:shadow-[var(--ax-focus-ring)] sm:px-5"
                    >
                        Open Laboratory <span className="ml-2 text-sm">→</span>
                    </Link>
                </div>
            </SiteContainer>
        </header>
    );
}
