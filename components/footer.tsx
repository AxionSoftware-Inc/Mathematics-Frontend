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
        <footer className="border-t border-[#e5e8ed] bg-[#fbfcfe] py-7">
            <SiteContainer className="flex flex-col items-start justify-between gap-3 text-[11px] text-[#777f8a] sm:flex-row sm:items-center">
                <div>&copy; {new Date().getFullYear()} MathSphere Laboratory</div>
                <Link href="/laboratory" className="font-medium text-[#184eb8]">Open Laboratory</Link>
            </SiteContainer>
        </footer>
    );
}
