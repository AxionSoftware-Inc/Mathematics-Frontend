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
        <footer className="border-t border-border/80 bg-background/80 py-10">
            <SiteContainer className="flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground md:flex-row md:items-center">
                <div>&copy; {new Date().getFullYear()} MathSphere Laboratory.</div>
                <Link href="/laboratory" className="font-semibold text-foreground transition-opacity hover:opacity-70">
                    Open Laboratory
                </Link>
            </SiteContainer>
        </footer>
    );
}
