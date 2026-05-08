/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, FileText, Newspaper, Search, User2 } from "lucide-react";

import { SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";
import { WriteTypeSelector } from "@/components/write-type-selector";

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

const HERO_ARTICLE_LIMIT = 8;

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

function getArticleSummary(article: Article, limit = 220) {
    return plainText(article.summary || article.content).slice(0, limit) || "Maqolaning qisqa annotatsiyasi shu yerda ko‘rsatiladi.";
}

export default function JournalPage() {
    const [articles, setArticles] = React.useState<Article[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [query, setQuery] = React.useState("");
    const [activeCategory, setActiveCategory] = React.useState("All");
    const [isWriteSelectorOpen, setIsWriteSelectorOpen] = React.useState(false);

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

    const featuredArticles = filteredArticles.slice(0, HERO_ARTICLE_LIMIT);
    const leadArticle = featuredArticles[0];
    const supportArticles = featuredArticles.slice(1, 3);
    const showcaseArticles = featuredArticles.slice(3);
    const archiveArticles = filteredArticles.slice(featuredArticles.length);

    return (
        <div className="site-shell">
            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="site-filter-shell flex flex-col gap-5 p-5 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-xl">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Maqola, muallif yoki mavzu bo‘yicha qidiring"
                                className="site-search-input pl-11 pr-4 text-sm"
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

            {loading ? (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <div className="site-panel-strong h-[420px] animate-pulse" />
                    </SiteContainer>
                </SiteSection>
            ) : leadArticle ? (
                <SiteSection className="py-6">
                    <SiteContainer>
                        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                            <Link
                                href={`/journal/${leadArticle.slug || leadArticle.id}`}
                                className="site-panel-strong group relative overflow-hidden"
                            >
                                {leadArticle.cover_image ? (
                                    <>
                                        <img
                                            src={getMediaUrl(leadArticle.cover_image)}
                                            alt={leadArticle.title}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(17,24,39,0.78),rgba(17,24,39,0.3)_48%,rgba(15,118,110,0.44))]" />
                                    </>
                                ) : null}
                                <div className="relative grid min-h-[520px] items-end overflow-hidden xl:grid-rows-[1fr_auto]">
                                    {!leadArticle.cover_image ? (
                                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_40%)]">
                                            <Newspaper className="h-16 w-16 text-[var(--accent)]/40" />
                                        </div>
                                    ) : null}
                                    <div className="p-8 md:p-10 xl:p-12">
                                        <div className={`flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${leadArticle.cover_image ? "site-muted-inverse" : "text-muted-foreground"}`}>
                                            <span className="site-status-pill">
                                                Lead Paper
                                            </span>
                                            <span>{leadArticle.category_name || "Scientific Article"}</span>
                                        </div>
                                        <h2 className={`mt-5 font-serif text-4xl font-black leading-tight transition-colors group-hover:text-[var(--accent)] md:text-5xl ${leadArticle.cover_image ? "text-foreground dark:text-white" : ""}`}>
                                            {leadArticle.title}
                                        </h2>
                                        <p className={`mt-5 max-w-2xl text-base leading-8 ${leadArticle.cover_image ? "site-inverse-text" : "text-muted-foreground"}`}>
                                            {getArticleSummary(leadArticle, 320)}
                                        </p>
                                        <div className={`mt-8 flex flex-wrap items-center gap-6 border-t pt-6 text-sm font-semibold ${leadArticle.cover_image ? "border-white/20" : "border-border"}`}>
                                            <span className={`inline-flex items-center gap-2 ${leadArticle.cover_image ? "site-inverse-text" : "text-muted-foreground"}`}>
                                                <User2 className="h-4 w-4 text-[var(--accent)]" />
                                                {leadArticle.author || "MathSphere Researcher"}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 ${leadArticle.cover_image ? "site-inverse-text" : "text-muted-foreground"}`}>
                                                <CalendarDays className="h-4 w-4 text-[var(--accent-alt)]" />
                                                {leadArticle.created_at
                                                    ? new Date(leadArticle.created_at).toLocaleDateString()
                                                    : "Recent issue"}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 ${leadArticle.cover_image ? "site-inverse-text" : "text-muted-foreground"}`}>
                                                <Clock3 className="h-4 w-4" />
                                                {leadArticle.read_time_minutes || 5} min read
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
                                {supportArticles.map((article, index) => (
                                    <Link
                                        key={article.id}
                                        href={`/journal/${article.slug || article.id}`}
                                        className="site-panel group relative overflow-hidden p-7"
                                    >
                                        {article.cover_image ? (
                                            <>
                                                <img
                                                    src={getMediaUrl(article.cover_image)}
                                                    alt={article.title}
                                                    className="absolute inset-0 h-full w-full object-cover opacity-[0.18] transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.88),rgba(255,255,255,0.76)_50%,rgba(29,78,216,0.08))] dark:bg-[linear-gradient(155deg,rgba(0,0,0,0.82),rgba(0,0,0,0.7)_48%,rgba(15,118,110,0.14))]" />
                                            </>
                                        ) : null}
                                        <div className="relative">
                                            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                <span>{article.category_name || "Research note"}</span>
                                                <span>Feature {index + 2}</span>
                                            </div>
                                            <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                                {article.title}
                                            </h3>
                                            <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                                {getArticleSummary(article, 170)}
                                            </p>
                                            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <User2 className="h-4 w-4 text-[var(--accent)]" />
                                                    {article.author || "MathSphere Researcher"}
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                                                    O'qish
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {showcaseArticles.length ? (
                            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {showcaseArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        href={`/journal/${article.slug || article.id}`}
                                        className="site-panel group overflow-hidden"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_42%)]">
                                            {article.cover_image ? (
                                                <img
                                                    src={getMediaUrl(article.cover_image)}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Newspaper className="h-12 w-12 text-[var(--accent)]/40" />
                                                </div>
                                            )}
                                            <div className="site-status-pill absolute left-5 top-5">
                                                {article.read_time_minutes || 5} min
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                <span>{article.category_name || "Paper"}</span>
                                                <span>{article.created_at ? new Date(article.created_at).toLocaleDateString() : "Current issue"}</span>
                                            </div>
                                            <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                                {article.title}
                                            </h3>
                                            <p className="mt-4 line-clamp-4 text-sm leading-7 text-muted-foreground">
                                                {getArticleSummary(article, 180)}
                                            </p>
                                            <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm font-semibold">
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <User2 className="h-4 w-4 text-[var(--accent)]" />
                                                    {article.author || "Research author"}
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
                        ) : null}
                    </SiteContainer>
                </SiteSection>
            ) : null}

            <SiteSection className="pt-6">
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Archive"
                        title="Nashrlar arxivi"
                        description="Yuqoridagi asosiy vitrindan keyin qolgan maqolalar ixchamroq oqimda davom etadi."
                    />

                    {!loading && !filteredArticles.length ? (
                        <div className="mt-12 site-panel-strong p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h3 className="mt-5 font-serif text-3xl font-black">Maqola topilmadi</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Qidiruv yoki category filter natija bermadi. Bo‘sh holat ham shu editorial tizimda,
                                ortiqcha bezaksiz va aniq signal bilan ko‘rsatiladi.
                            </p>
                        </div>
                    ) : archiveArticles.length ? (
                        <div className="mt-12 grid gap-5 xl:grid-cols-2">
                            {archiveArticles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/journal/${article.slug || article.id}`}
                                    className="site-panel group flex h-full gap-5 overflow-hidden p-5 sm:flex-row sm:items-center"
                                >
                                    <div className="site-media-frame shrink-0 p-3 sm:w-48">
                                        <div className="site-cover-inner relative h-32">
                                            {article.cover_image ? (
                                                <img
                                                    src={getMediaUrl(article.cover_image)}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_42%)]">
                                                    <Newspaper className="h-10 w-10 text-[var(--accent)]/40" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            <span>{article.category_name || "Article"}</span>
                                            <span>{article.read_time_minutes || 5} min</span>
                                        </div>
                                        <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                            {article.title}
                                        </h3>
                                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                            {getArticleSummary(article, 160)}
                                        </p>
                                        <div className="mt-auto border-t border-border pt-5">
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
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {featuredArticles.map((article) => (
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
                                        {getArticleSummary(article, 220)}
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
            <WriteTypeSelector
                isOpen={isWriteSelectorOpen}
                onClose={() => setIsWriteSelectorOpen(false)}
            />
        </div>
    );
}
