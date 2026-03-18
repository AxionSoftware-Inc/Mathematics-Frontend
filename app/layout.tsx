import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-inter",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});

export const metadata: Metadata = {
    title: "MathSphere | O'zbekiston matematika platformasi",
    description: "O'zbekistonning eng yirik markazlashgan matematika va ilm-fan platformasi.",
};

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uz" suppressHydrationWarning>
            <body className={`${manrope.variable} ${playfair.variable} min-h-screen flex flex-col`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Navbar />
                    <main className="flex-1 flex flex-col relative w-full">{children}</main>
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
