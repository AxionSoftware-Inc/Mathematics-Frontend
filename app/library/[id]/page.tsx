import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, LibraryBig, Sparkles, Star, User2 } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";

type Book = {
    id: number | string;
    title: string;
    author?: string | null;
    description?: string | null;
    cover_image?: string | null;
    category_name?: string | null;
    language?: string | null;
    pages?: number | string | null;
    pdf_file?: string | null;
    sample_pdf_file?: string | null;
    download_count?: number | null;
    published_date?: string | null;
};

async function getBook(id: string): Promise<Book | null> {
    try {
        const res = await fetchPublic(`/api/books/${id}/`, { next: { revalidate: 60 } });
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.error("Failed to fetch book", error);
    }

    return null;
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const params = await props.params;
    const book = await getBook(params.id);

    return {
        title: book ? `${book.title} - MathSphere Library` : "Kitob tafsilotlari - MathSphere",
    };
}

export default async function BookDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const book = await getBook(params.id);

    if (!book) {
        return (
            <div className="site-shell">
                <SiteSection className="pt-24">
                    <SiteContainer>
                        <div className="site-panel-strong p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <h1 className="mt-5 font-serif text-4xl font-black">Kitob topilmadi</h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Siz qidirayotgan kitob mavjud emas yoki bu kolleksiyada hozircha public emas.
                            </p>
                            <Link href="/library" className="site-button-primary mt-8">
                                Kutubxonaga qaytish
                            </Link>
                        </div>
                    </SiteContainer>
                </SiteSection>
            </div>
        );
    }

    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-16 md:pt-24">
                <SiteContainer>
                    <Link href="/library" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Katalogga qaytish
                    </Link>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[420px_1fr]">
                        <div className="site-panel-strong overflow-hidden p-4">
                            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.12),transparent_40%)]">
                                {book.cover_image ? (
                                    <img
                                        src={getMediaUrl(book.cover_image)}
                                        alt={book.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <LibraryBig className="h-16 w-16 text-[var(--accent)]/40" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                {book.category_name || "Mathematical Volume"}
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.1rem]">{book.title}</h1>
                                <p className="site-lead max-w-3xl">
                                    {book.description || "Bu kitob uchun tavsif keyinroq to'ldiriladi."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        Author
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.author || "Unknown"}</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">Language</div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.language || "UZ"}</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">Pages</div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.pages || "-"}</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Star className="h-4 w-4 text-[var(--accent)]" />
                                        Downloads
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.download_count || 0}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {book.pdf_file ? (
                                    <Link href={book.pdf_file} target="_blank" className="site-button-primary">
                                        <BookOpen className="h-4 w-4" />
                                        Kitobni ochish
                                    </Link>
                                ) : null}
                                {book.sample_pdf_file ? (
                                    <Link href={book.sample_pdf_file} target="_blank" className="site-button-secondary">
                                        <Download className="h-4 w-4" />
                                        Namuna fayli
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="site-panel p-8 md:p-10">
                            <SectionHeading
                                eyebrow="Book Abstract"
                                title="Mazmun va qiymat"
                                description="Detail sahifa endi oddiy metadata ro'yxati emas. U kitobning ilmiy yoki o'quv qiymatini professional ko'rinishda olib chiqadi."
                            />
                            <div className="mt-8 text-base leading-8 text-muted-foreground">
                                {book.description || "Annotatsiya keyinroq to'ldiriladi."}
                            </div>
                        </div>

                        <div className="site-panel-strong p-8">
                            <div className="site-eyebrow">Catalog Metadata</div>
                            <div className="mt-6 space-y-4 text-sm font-semibold">
                                <div className="site-outline-card flex items-center justify-between p-4">
                                    <span className="text-muted-foreground">Published year</span>
                                    <span>{book.published_date ? new Date(book.published_date).getFullYear() : "2024"}</span>
                                </div>
                                <div className="site-outline-card flex items-center justify-between p-4">
                                    <span className="text-muted-foreground">Format</span>
                                    <span>{book.pdf_file ? "Digital PDF" : "Archive item"}</span>
                                </div>
                                <div className="site-outline-card flex items-center justify-between p-4">
                                    <span className="text-muted-foreground">Reading mode</span>
                                    <span>{book.sample_pdf_file ? "Preview available" : "Full view only"}</span>
                                </div>
                                <div className="site-outline-card flex items-center justify-between p-4">
                                    <span className="text-muted-foreground">Section</span>
                                    <span>{book.category_name || "Mathematics"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
