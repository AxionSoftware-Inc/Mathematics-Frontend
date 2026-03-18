/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, FileText, Newspaper, Search, Sparkles, User2 } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";

type Article = {
    id: number | string;
    slug?: string | null;
    title: string;
    content?: string | null;
    summary?: string | null;
    author?: string | null;
    category_name?: string | null;
    cover_image?: string | null;
    created_at?: string | null;
    read_time_minutes?: number | null;
};

function plainText(value?: string | null) {
    if (!value) {
        return "";
    }

    return value
        .replace(/<[^>]+>/g, " ")
        .replace(/[#*_`>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export default function JournalPage() {
    const [articles, setArticles] = React.useState<Article[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [query, setQuery] = React.useState("");
    const [activeCategory, setActiveCategory] = React.useState("All");

    React.useEffect(() => {
        const getArticles = async () => {
            try {
                const res = await fetchPublic("/api/articles/", { next: { revalidate: 60 } });
                if (res.ok) {
                    const data = await res.json();
                    setArticles(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch articles", error);
            } finally {
                setLoading(false);
            }
        };

        getArticles();
    }, []);

    const categories = [
        "All",
        ...Array.from(
            new Set(articles.map((article) => article.category_name).filter((category): category is string => Boolean(category))),
        ),
    ];
    const normalizedQuery = query.trim().toLowerCase();
    const filteredArticles = articles.filter((article) => {
        const matchesCategory = activeCategory === "All" || article.category_name === activeCategory;
        const haystack = [article.title, article.summary, article.content, article.author, article.category_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });

    const featuredArticle = filteredArticles[0];
    const archiveArticles = filteredArticles.slice(1);
    const authors = new Set(articles.map((article) => article.author).filter(Boolean));

    return (
        <div className="site-shell">
            <SiteSection className="pb-12 pt-16 md:pt-24">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Scientific Publishing Layer
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.25rem]">
                                    Jurnal endi
                                    <span className="site-kicker"> nashr vitrini, </span>
                                    maqola topish va o'qish uchun bitta professional oqimga keldi.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    Featured article, archive grid va category filterlar endi umumiy editorial
                                    tizimda ishlaydi. Maqola listi chiroyli ko'rinadi, lekin asosiy urg'u mazmun va
                                    ishonchga berilgan.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/write" className="site-button-primary">
                                    Maqola yozishni boshlash
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/library" className="site-button-secondary">
                                    Kutubxona bilan bog'lash
                                </Link>
                            </div>
                        </div>

                        <div className="site-panel-strong p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{articles.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Nashrlar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{authors.size}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Mualliflar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">
                                        {Math.round(
                                            articles.reduce((sum, article) => sum + Number(article.read_time_minutes || 0), 0),
                                        )}
                                        m
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Umumiy o'qish vaqti</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{filteredArticles.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Filter natijalari</div>
                                </div>
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="site-eyebrow">Publishing Experience</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Professional jurnal hissi faqat serif sarlavha bilan chiqmaydi. Maqolani topish,
                                    preview qilish va detailga o'tish tez bo'lishi kerak. Shu qatlam shu yerda tuzildi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="site-panel flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                        <div className="relative w-full md:max-w-md">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Maqola, muallif yoki mavzu bo'yicha qidiring"
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

            {loading ? (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <div className="site-panel-strong h-[420px] animate-pulse" />
                    </SiteContainer>
                </SiteSection>
            ) : featuredArticle ? (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <Link
                            href={`/journal/${featuredArticle.slug || featuredArticle.id}`}
                            className="site-panel-strong group grid overflow-hidden xl:grid-cols-[0.9fr_1.1fr]"
                        >
                            <div className="relative min-h-[320px] border-b border-border xl:border-b-0 xl:border-r">
                                {featuredArticle.cover_image ? (
                                    <img
                                        src={getMediaUrl(featuredArticle.cover_image)}
                                        alt={featuredArticle.title}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_40%)]">
                                        <Newspaper className="h-16 w-16 text-[var(--accent)]/40" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center p-8 md:p-10 xl:p-12">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
                                        Featured Paper
                                    </span>
                                    <span>{featuredArticle.category_name || "Scientific Article"}</span>
                                </div>
                                <h2 className="mt-5 font-serif text-4xl font-black leading-tight transition-colors group-hover:text-[var(--accent)] md:text-5xl">
                                    {featuredArticle.title}
                                </h2>
                                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                                    {plainText(featuredArticle.summary || featuredArticle.content).slice(0, 280) ||
                                        "Ilmiy maqola preview qismi shu yerda ko'rsatiladi."}
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-border pt-6 text-sm font-semibold">
                                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        {featuredArticle.author || "MathSphere Researcher"}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4 w-4 text-[var(--accent-alt)]" />
                                        {featuredArticle.created_at
                                            ? new Date(featuredArticle.created_at).toLocaleDateString()
                                            : "Recent issue"}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                                        <Clock3 className="h-4 w-4" />
                                        {featuredArticle.read_time_minutes || 5} min read
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </SiteContainer>
                </SiteSection>
            ) : null}

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Archive"
                        title="Nashrlar arxivi"
                        description="Jurnal listi endi ancha professional ko'rinadi: featured maqola, keyin toza archive grid va aniq metadata."
                    />

                    {!loading && !filteredArticles.length ? (
                        <div className="mt-12 site-panel-strong p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h3 className="mt-5 font-serif text-3xl font-black">Maqola topilmadi</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Qidiruv yoki category filter natija bermadi. Bo'sh holat ham mahsulotning bir qismi,
                                shuning uchun bu yerda ham aniq va professional signal saqlandi.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {(archiveArticles.length ? archiveArticles : featuredArticle ? [featuredArticle] : []).map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/journal/${article.slug || article.id}`}
                                    className="site-panel group flex h-full flex-col p-7"
                                >
                                    <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                        <span>{article.category_name || "Article"}</span>
                                        <span>{article.read_time_minutes || 5} min</span>
                                    </div>
                                    <h3 className="mt-5 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                        {article.title}
                                    </h3>
                                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-muted-foreground">
                                        {plainText(article.summary || article.content).slice(0, 220) ||
                                            "Ilmiy maqola preview qismi ko'rsatiladi."}
                                    </p>
                                    <div className="mt-auto border-t border-border pt-6">
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                <User2 className="h-4 w-4 text-[var(--accent)]" />
                                                {article.author || "Research author"}
                                            </span>
                                            <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                                                O'qish
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        </div>
                                        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                            {article.created_at ? new Date(article.created_at).toLocaleDateString() : "Current issue"}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
