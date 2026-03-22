/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Library, Search, Sparkles, Star } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";

type Book = {
    id: number | string;
    slug?: string | null;
    title: string;
    author?: string | null;
    description?: string | null;
    cover_image?: string | null;
    category_name?: string | null;
    download_count?: number | null;
    pdf_file?: string | null;
    published_date?: string | null;
};

function getPublicationYear(value?: string | null) {
    return value ? new Date(value).getFullYear() : "2024";
}

export default function LibraryPage() {
    const [books, setBooks] = React.useState<Book[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [query, setQuery] = React.useState("");
    const [activeCategory, setActiveCategory] = React.useState("All");

    React.useEffect(() => {
        const getBooks = async () => {
            try {
                const res = await fetchPublic("/api/books/", { next: { revalidate: 60 } });
                if (res.ok) {
                    const data = await res.json();
                    setBooks(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch books", error);
            } finally {
                setLoading(false);
            }
        };

        getBooks();
    }, []);

    const categories = [
        "All",
        ...Array.from(new Set(books.map((book) => book.category_name).filter((category): category is string => Boolean(category)))),
    ];
    const normalizedQuery = query.trim().toLowerCase();
    const filteredBooks = books.filter((book) => {
        const matchesCategory = activeCategory === "All" || book.category_name === activeCategory;
        const haystack = [book.title, book.author, book.description, book.category_name].filter(Boolean).join(" ").toLowerCase();

        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });

    const digitalBooks = books.filter((book) => book.pdf_file).length;
    const authors = new Set(books.map((book) => book.author).filter(Boolean));
    const featuredBooks = [...books]
        .sort((left, right) => Number(right.download_count || 0) - Number(left.download_count || 0))
        .slice(0, 3);
    const spotlightBook = featuredBooks[0];
    const supportFeaturedBooks = featuredBooks.slice(1);
    const shelfPreview = featuredBooks.length ? featuredBooks : books.slice(0, 3);

    return (
        <div className="site-shell">
            <SiteSection className="pb-8 pt-12 md:pt-16">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Professional Knowledge Archive
                            </HeroBadge>
                            <div className="space-y-4">
                                <h1 className="site-display text-4xl md:text-6xl xl:text-[4.55rem]">
                                    Kutubxona endi
                                    <span className="site-kicker"> katalog emas, </span>
                                    ko'rishga yoqimli va tez topiladigan ilmiy shelf sifatida ishlaydi.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    Book cover, metadata va discovery oqimi qayta yig'ildi. Rasm bloki alohida sahna
                                    ichida ko'rsatiladi, card hierarchy esa mobil va desktopda bir xil tartibda o'qiladi.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/journal" className="site-button-primary">
                                    Ilmiy jurnalga o'tish
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/academy" className="site-button-secondary">
                                    O'quv oqimini ko'rish
                                </Link>
                            </div>
                        </div>

                        <div className="site-panel-strong p-5 md:p-7 xl:p-8">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{books.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Kitoblar soni</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{digitalBooks}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Digital formatlar</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{authors.size}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Mualliflar</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{filteredBooks.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Natijalar</div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                                <div className="site-media-frame min-h-[260px] p-5">
                                    <div className="site-eyebrow">Shelf Preview</div>
                                    <div className="mt-5 flex h-[190px] items-end justify-center gap-3 overflow-hidden sm:gap-4">
                                        {shelfPreview.length ? (
                                            shelfPreview.map((book, index) => (
                                                <div
                                                    key={book.id}
                                                    className={`relative w-[92px] shrink-0 rounded-[1.5rem] border border-white/50 bg-white/60 p-2 shadow-2xl shadow-slate-900/10 sm:w-[104px] ${
                                                        index === 1 ? "translate-y-6 rotate-[-4deg]" : index === 2 ? "translate-y-2 rotate-[5deg]" : "rotate-[3deg]"
                                                    }`}
                                                >
                                                    <div className="relative aspect-[3/4] overflow-hidden rounded-[1.15rem] border border-border bg-white/70">
                                                        {book.cover_image ? (
                                                            <img
                                                                src={getMediaUrl(book.cover_image)}
                                                                alt={book.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_40%)]">
                                                                <Library className="h-9 w-9 text-[var(--accent)]/45" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-[1.4rem] border border-dashed border-border text-sm font-semibold text-muted-foreground">
                                                Kolleksiya shakllanmoqda
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Visual Rule</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Cover endi to'g'ridan to'g'ri cardni bosmaydi. U maxsus frame ichida,
                                            soyali va aniq proporsiyada ko'rsatiladi.
                                        </p>
                                    </div>
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Discovery Flow</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Search, category va featured shelf bitta oqimga keltirildi. Foydalanuvchi
                                            ko'radi, taqqoslaydi va detail sahifaga tez o'tadi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            {spotlightBook ? (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <SectionHeading
                            eyebrow="Featured Selection"
                            title="Kutubxonaning tayanch kolleksiyasi"
                            description="Eng ko'p qiziqish olgan kitoblar bitta spotlight blokda ko'rsatiladi, qolgan tayanch nashrlar esa yon oqimda turadi."
                        />

                        <div className="mt-10 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                            <Link
                                href={`/library/${spotlightBook.slug || spotlightBook.id}`}
                                className="site-panel-strong group relative overflow-hidden p-6 md:p-8"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.1),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.12),transparent_32%)]" />
                                <div className="relative grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
                                                Spotlight
                                            </span>
                                            <span>{spotlightBook.category_name || "Core Collection"}</span>
                                        </div>
                                        <h3 className="font-serif text-4xl font-black leading-tight transition-colors group-hover:text-[var(--accent)] md:text-5xl">
                                            {spotlightBook.title}
                                        </h3>
                                        <p className="max-w-2xl text-sm leading-8 text-muted-foreground md:text-base">
                                            {spotlightBook.description || "Matematik bilimlar arxividagi muhim manbalardan biri."}
                                        </p>
                                        <div className="flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2">
                                                {spotlightBook.author || "Unknown author"}
                                            </span>
                                            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2">
                                                {getPublicationYear(spotlightBook.published_date)}
                                            </span>
                                            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[var(--accent)]">
                                                <Download className="h-4 w-4" />
                                                {spotlightBook.download_count || 0} downloads
                                            </span>
                                        </div>
                                    </div>

                                    <div className="site-media-frame p-5">
                                        <div className="mx-auto max-w-[230px] rounded-[1.8rem] border border-white/50 bg-white/55 p-3 shadow-2xl shadow-slate-900/10">
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] border border-border bg-white/70">
                                                {spotlightBook.cover_image ? (
                                                    <img
                                                        src={getMediaUrl(spotlightBook.cover_image)}
                                                        alt={spotlightBook.title}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_40%)]">
                                                        <Library className="h-14 w-14 text-[var(--accent)]/45" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="grid gap-6">
                                {supportFeaturedBooks.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/library/${book.slug || book.id}`}
                                        className="site-panel group flex h-full flex-col gap-5 p-5 sm:flex-row sm:items-center"
                                    >
                                        <div className="site-media-frame shrink-0 p-3 sm:w-[168px]">
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.1rem] border border-border bg-white/70">
                                                {book.cover_image ? (
                                                    <img
                                                        src={getMediaUrl(book.cover_image)}
                                                        alt={book.title}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.14),transparent_40%)]">
                                                        <Library className="h-10 w-10 text-[var(--accent)]/45" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col">
                                            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                <span>{book.category_name || "Archive"}</span>
                                                <span>{getPublicationYear(book.published_date)}</span>
                                            </div>
                                            <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                                {book.title}
                                            </h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                                {book.description || "Matematik kolleksiya ichidagi yo'naluvchi manba."}
                                            </p>
                                            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
                                                <span className="text-muted-foreground">{book.author || "Unknown author"}</span>
                                                <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                                                    Ochish
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </SiteContainer>
                </SiteSection>
            ) : null}

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="site-filter-shell flex flex-col gap-5 p-5 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-xl">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Kitob, muallif yoki bo'lim bo'yicha qidiring"
                                    className="h-[52px] w-full rounded-full border border-border bg-white/55 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)] dark:bg-white/5"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => {
                                    const active = category === activeCategory;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`site-chip ${active ? "site-chip-active" : ""}`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Catalog Grid"
                        title="Toza, o'qilishi oson, professional kitob kartalari"
                        description="Book card ichidagi hierarchy endi yaxshiroq: cover alohida sahnada, title va metadata esa ixcham lekin kuchli tipografiya bilan ko'rinadi."
                    />

                    {loading ? (
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="site-panel h-[460px] animate-pulse" />
                            ))}
                        </div>
                    ) : filteredBooks.length ? (
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {filteredBooks.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/library/${book.slug || book.id}`}
                                    className="site-panel group flex h-full flex-col p-4"
                                >
                                    <div className="site-media-frame p-4">
                                        <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                            <span className="rounded-full bg-black/70 px-3 py-1 text-white">
                                                {book.pdf_file ? "PDF" : "Archive"}
                                            </span>
                                            <span>{getPublicationYear(book.published_date)}</span>
                                        </div>

                                        <div className="mx-auto mt-4 max-w-[230px] rounded-[1.8rem] border border-white/50 bg-white/60 p-3 shadow-2xl shadow-slate-900/10">
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] border border-border bg-white/75">
                                                {book.cover_image ? (
                                                    <img
                                                        src={getMediaUrl(book.cover_image)}
                                                        alt={book.title}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_40%)]">
                                                        <Library className="h-14 w-14 text-[var(--accent)]/40" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                                        <div className="flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            <span>{book.category_name || "Mathematics"}</span>
                                            <span>{book.download_count || 0} saved</span>
                                        </div>
                                        <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                            {book.title}
                                        </h3>
                                        <p className="mt-3 text-sm font-semibold text-muted-foreground">
                                            {book.author || "Muallif ko'rsatilmagan"}
                                        </p>
                                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                            {book.description || "Matematik kutubxona kolleksiyasidagi tizimli resurs."}
                                        </p>
                                        <div className="mt-auto border-t border-border pt-5 text-sm font-semibold">
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <Star className="h-4 w-4 text-[var(--accent)]" />
                                                    {book.download_count || 0} downloads
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                                                    Ochish
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-12 site-panel-strong p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <h3 className="mt-5 font-serif text-3xl font-black">Kutubxonada mos natija topilmadi</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Qidiruv va filter bo'yicha natija chiqmadi. Bo'sh holat ham aniq, toza va mahsulotga
                                mos ko'rinishda qoldirildi.
                            </p>
                        </div>
                    )}
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
