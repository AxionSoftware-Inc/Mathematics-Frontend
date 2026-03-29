import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, Download, LibraryBig, Sparkles, Star, User2 } from "lucide-react";

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

function getPublicationYear(value?: string | null) {
    return value ? new Date(value).getFullYear() : "2024";
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

    const publicationYear = getPublicationYear(book.published_date);
    const accessLabel = book.pdf_file && book.sample_pdf_file ? "Preview + full access" : book.pdf_file ? "Full access" : "Archive only";

    return (
        <div className="site-shell">
            {book.cover_image ? (
                <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
                    <img
                        src={getMediaUrl(book.cover_image)}
                        alt={book.title}
                        className="h-full w-full scale-[1.18] object-cover opacity-[0.12] blur-[26px]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,242,236,0.97),rgba(244,242,236,0.86)_20%,rgba(244,242,236,0.72)_58%,rgba(244,242,236,0.98))] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.97),rgba(0,0,0,0.84)_20%,rgba(0,0,0,0.7)_58%,rgba(0,0,0,0.98))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.14),transparent_26%),radial-gradient(circle_at_85%_18%,rgba(15,118,110,0.14),transparent_22%),radial-gradient(circle_at_center,transparent_42%,rgba(244,242,236,0.35)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(20,184,166,0.16),transparent_22%),radial-gradient(circle_at_center,transparent_46%,rgba(0,0,0,0.28)_100%)]" />
                </div>
            ) : null}

            <SiteSection className="pb-8 pt-12 md:pt-16">
                <SiteContainer>
                    <Link href="/library" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Katalogga qaytish
                    </Link>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <div className="xl:sticky xl:top-24 xl:self-start">
                            <div className="site-panel-strong p-5 md:p-6">
                                <div className="site-media-frame p-4">
                                    <div className="site-cover-stage p-3">
                                        <div className="site-cover-inner relative aspect-[3/4]">
                                            {book.cover_image ? (
                                                <img
                                                    src={getMediaUrl(book.cover_image)}
                                                    alt={book.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_40%)]">
                                                    <LibraryBig className="h-16 w-16 text-[var(--accent)]/40" />
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                                    <div className="site-outline-card p-4">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Format</div>
                                        <div className="mt-2 text-sm font-semibold">{book.pdf_file ? "Digital PDF" : "Archive item"}</div>
                                    </div>
                                    <div className="site-outline-card p-4">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Published</div>
                                        <div className="mt-2 text-sm font-semibold">{publicationYear}</div>
                                    </div>
                                    <div className="site-outline-card p-4">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Downloads</div>
                                        <div className="mt-2 text-sm font-semibold">{book.download_count || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                {book.category_name || "Mathematical Volume"}
                            </HeroBadge>

                            <div className="space-y-4">
                                <h1 className="site-display text-4xl md:text-6xl xl:text-[4.4rem]">{book.title}</h1>
                                <p className="site-lead max-w-3xl">
                                    {book.description || "Bu kitob uchun tavsif keyinroq to'ldiriladi."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="site-chip site-chip-active">{book.author || "Unknown author"}</span>
                                <span className="site-chip">{book.language || "UZ"}</span>
                                <span className="site-chip">{book.pages || "-"} pages</span>
                                <span className="site-chip">{accessLabel}</span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="site-metric-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        Author
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.author || "Unknown"}</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">Language</div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.language || "UZ"}</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">Pages</div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.pages || "-"}</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Star className="h-4 w-4 text-[var(--accent)]" />
                                        Downloads
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{book.download_count || 0}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {book.pdf_file ? (
                                    <Link href={getMediaUrl(book.pdf_file)} target="_blank" className="site-button-primary">
                                        <BookOpen className="h-4 w-4" />
                                        Kitobni ochish
                                    </Link>
                                ) : null}
                                {book.sample_pdf_file ? (
                                    <Link href={getMediaUrl(book.sample_pdf_file)} target="_blank" className="site-button-secondary">
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
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="site-panel p-8 md:p-10">
                            <SectionHeading
                                eyebrow="Book Abstract"
                                title="Mazmun va o'qish konteksti"
                                description="Detail sahifa oddiy metadata ro‘yxati emas. U nashrning ilmiy yoki o‘quv qiymatini sokin, aniq ritmda ko‘rsatadi."
                            />

                            <div className="mt-8 grid gap-5">
                                <div className="site-outline-card p-6">
                                    <div className="site-eyebrow">Overview</div>
                                    <p className="mt-4 text-base leading-8 text-muted-foreground">
                                        {book.description || "Annotatsiya keyinroq to'ldiriladi."}
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="site-outline-card p-6">
                                        <div className="site-eyebrow">Reading Value</div>
                                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                            Ushbu nashr nazariya va amaliy masalalar orasida ko‘prik vazifasini bajaradigan,
                                            kutubxona ichida qayta murojaat qilinadigan manba sifatida ko‘rsatilmoqda.
                                        </p>
                                    </div>
                                    <div className="site-outline-card p-6">
                                        <div className="site-eyebrow">Use Case</div>
                                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                            Kurs tayyorgarligi, mustaqil o‘qish yoki maqola yozish jarayonida manba
                                            sifatida ishlatish uchun access yo‘llari va metadata yuqorida aniq berildi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                            <div className="site-panel-strong p-8">
                                <div className="site-eyebrow">Catalog Metadata</div>
                                <div className="mt-6 space-y-4 text-sm font-semibold">
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Published year</span>
                                        <span>{publicationYear}</span>
                                    </div>
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Format</span>
                                        <span>{book.pdf_file ? "Digital PDF" : "Archive item"}</span>
                                    </div>
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Reading mode</span>
                                        <span>{book.sample_pdf_file ? "Preview available" : "Full view only"}</span>
                                    </div>
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Section</span>
                                        <span>{book.category_name || "Mathematics"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                                    Reader Note
                                </div>
                                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                    Cover, metadata va action tugmalari bitta ekranda qolishi uchun asosiy summary
                                    yuqoriga chiqarildi. Pastdagi blok esa kitobning nima uchun muhimligini sokin ritmda tushuntiradi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
