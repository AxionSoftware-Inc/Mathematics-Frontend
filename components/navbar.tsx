import Link from "next/link";

import { SiteContainer } from "@/components/public-shell";

function LaboratoryMark() {
    return (
        <svg viewBox="0 0 36 36" className="h-8 w-8" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#173d7a" strokeWidth="1.1" />
            <ellipse cx="18" cy="18" rx="7" ry="15.5" fill="none" stroke="#173d7a" strokeWidth="0.8" opacity="0.72" />
            <ellipse cx="18" cy="18" rx="15.5" ry="6.8" fill="none" stroke="#173d7a" strokeWidth="0.8" opacity="0.72" />
            <path d="M3 18h30M18 2.5v31" stroke="#173d7a" strokeWidth="0.75" opacity="0.55" />
        </svg>
    );
}

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-[#e4e7ec] bg-[#fbfcfe]">
            <SiteContainer className="flex h-[64px] items-center justify-between gap-5">
                <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="MathSphere Laboratory home">
                    <LaboratoryMark />
                    <span className="truncate text-[19px] font-medium tracking-[-0.025em] text-[#12151a] sm:text-[20px]">
                        MathSphere Laboratory
                    </span>
                </Link>

                <nav className="flex items-center gap-1 sm:gap-4">
                    <div className="hidden items-center gap-7 lg:flex">
                        <Link href="/#studios" className="text-[13px] font-medium text-[#20252d]">Studios</Link>
                        <Link href="/#visualizations" className="text-[13px] font-medium text-[#20252d]">Visualizations</Link>
                        <Link href="/#precision" className="text-[13px] font-medium text-[#20252d]">Precision</Link>
                    </div>
                    <Link
                        href="/laboratory"
                        className="ml-2 inline-flex h-9 items-center rounded-[10px] bg-[#0b1f46] px-4 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(11,31,70,0.12)]"
                    >
                        Open Laboratory
                    </Link>
                </nav>
            </SiteContainer>
        </header>
    );
}
