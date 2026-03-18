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

    return (
        <div className="site-shell">
            <SiteSection className="pb-12 pt-16 md:pt-24">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Professional Knowledge Archive
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.3rem]">
                                    Kutubxona endi
                                    <span className="site-kicker"> raqamli katalog, </span>
                                    jiddiy editorial ko'rinish va tez navigatsiya bilan ishlaydi.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    Book cover, metadata, author va format bir xil professional qobiqda ko'rsatiladi.
                                    Sahifa chiroyli ko'rinishi bilan birga, haqiqiy qidiruv va topish vazifasini
                                    bajarishi kerak.
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

                        <div className="site-panel-strong p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{books.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Kitoblar soni</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{digitalBooks}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Digital formatlar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{authors.size}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Mualliflar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{filteredBooks.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Natijalar</div>
                                </div>
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="site-eyebrow">Library Positioning</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Endi kutubxona bo'limi oddiy grid emas. U foydalanuvchiga ishonch beradigan, book
                                    discovery va ko'rish qarorini tezlashtiradigan professional katalog sifatida ishlaydi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            {!!featuredBooks.length && (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <SectionHeading
                            eyebrow="Featured Selection"
                            title="Kutubxonaning tayanch kolleksiyasi"
                            description="Eng faol yoki eng ko'p ko'rilgan kitoblar yuqorida ajratib ko'rsatiladi, shunda foydalanuvchi noldan qidirib yurmaydi."
                        />
                        <div className="mt-10 grid gap-5 lg:grid-cols-3">
                            {featuredBooks.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/library/${book.slug || book.id}`}
                                    className="site-panel-strong group overflow-hidden p-6"
                                >
                                    <div className="flex items-start justify-between gap-5">
                                        <div>
                                            <div className="site-eyebrow">{book.category_name || "Core Collection"}</div>
                                            <h3 className="mt-3 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                                {book.title}
                                            </h3>
                                        </div>
                                        <div className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                                            Top
                                        </div>
                                    </div>
                                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                        {book.description || "Matematik bilimlar arxividagi muhim manbalardan biri."}
                                    </p>
                                    <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm font-semibold">
                                        <span className="text-muted-foreground">{book.author || "Unknown author"}</span>
                                        <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                                            {book.download_count || 0}
                                            <Download className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </SiteContainer>
                </SiteSection>
            )}

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="site-panel flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                        <div className="relative w-full md:max-w-md">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Kitob, muallif yoki bo'lim bo'yicha qidiring"
                                className="h-12 w-full rounded-full border border-border bg-transparent pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => {
                                const active = category === activeCategory;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                            active
                                                ? "bg-foreground text-background"
                                                : "border border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Catalog Grid"
                        title="Toza, o'qilishi oson, professional kitob kartalari"
                        description="Book card ichidagi hierarchy endi yaxshiroq: cover, title, author, format va asosiy harakat bitta oqimda ko'rinadi."
                    />

                    {loading ? (
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="site-panel h-[420px] animate-pulse" />
                            ))}
                        </div>
                    ) : filteredBooks.length ? (
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredBooks.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/library/${book.slug || book.id}`}
                                    className="site-panel group flex h-full flex-col overflow-hidden"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.12),transparent_40%)]">
                                        {book.cover_image ? (
                                            <img
                                                src={getMediaUrl(book.cover_image)}
                                                alt={book.title}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Library className="h-14 w-14 text-[var(--accent)]/40" />
                                            </div>
                                        )}
                                        <div className="absolute left-5 top-5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                            {book.pdf_file ? "PDF" : "Archive"}
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                            <span>{book.category_name || "Mathematics"}</span>
                                            <span>{book.published_date ? new Date(book.published_date).getFullYear() : "2024"}</span>
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
                                        <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm font-semibold">
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
                                Foydalanuvchi bo'sh ekran emas, tushunarli holat ko'rishi kerak. Shu sabab bo'sh state
                                ham professional, toza va aniq qilingan.
                            </p>
                        </div>
                    )}
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
