/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Download, FileText, Quote, Sparkles, User2 } from "lucide-react";

import { ArticleRichContent } from "@/components/article-rich-content";
import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic } from "@/lib/api";

type Article = {
    id: number | string;
    title: string;
    content?: string | null;
    summary?: string | null;
    author?: string | null;
    category_name?: string | null;
    created_at?: string | null;
    read_time_minutes?: number | null;
};

async function getArticle(id: string): Promise<Article | null> {
    try {
        const res = await fetchPublic(`/api/articles/${id}/`, { next: { revalidate: 60 } });
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.error("Failed to fetch article", error);
    }

    return null;
}

export default async function JournalDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const paper = await getArticle(params.id);

    if (!paper) {
        return (
            <div className="site-shell">
                <SiteSection className="pt-24">
                    <SiteContainer>
                        <div className="site-panel-strong p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h1 className="mt-5 font-serif text-4xl font-black">Maqola topilmadi</h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Siz qidirayotgan ilmiy maqola mavjud emas yoki public ko'rinishga chiqmagan.
                            </p>
                            <Link href="/journal" className="site-button-primary mt-8">
                                Jurnalga qaytish
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
                    <Link href="/journal" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Maqolalar arxivi
                    </Link>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                {paper.category_name || "Scientific Article"}
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.1rem]">{paper.title}</h1>
                                {paper.summary ? <p className="site-lead max-w-3xl">{paper.summary}</p> : null}
                            </div>
                        </div>

                        <div className="site-panel-strong p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        Author
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{paper.author || "Unknown author"}</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Clock3 className="h-4 w-4 text-[var(--accent-alt)]" />
                                        Read time
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{paper.read_time_minutes || 5} min</div>
                                </div>
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                                    Published
                                </div>
                                <div className="mt-3 font-serif text-2xl font-black">
                                    {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : "Current issue"}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Journal detail sahifasi endi maqolani professional o'qish muhitida ko'rsatadi:
                                    metadata yuqorida, asosiy matn esa toza va tinch ritmda.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="site-panel p-8 md:p-10">
                            {paper.summary ? (
                                <div className="site-outline-card mb-8 p-6">
                                    <div className="flex items-start gap-3">
                                        <Quote className="mt-1 h-5 w-5 text-[var(--accent)]" />
                                        <div>
                                            <div className="site-eyebrow">Abstract</div>
                                            <p className="mt-3 text-base leading-8 text-muted-foreground">{paper.summary}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <SectionHeading
                                eyebrow="Full Paper"
                                title="Maqola matni"
                                description="Markdown, LaTeX va boy bloklar professional o'qish ritmida render qilinadi."
                            />
                            <ArticleRichContent
                                content={paper.content || ""}
                                className="prose prose-neutral mt-8 max-w-none space-y-8 text-foreground/85 prose-headings:font-serif prose-headings:text-foreground prose-p:leading-8 dark:prose-invert"
                            />
                        </div>

                        <div className="site-panel-strong p-8">
                            <div className="site-eyebrow">Export & Citation</div>
                            <div className="mt-6 space-y-4">
                                <button className="site-button-primary w-full">
                                    <Download className="h-4 w-4" />
                                    To'liq maqolani yuklash
                                </button>
                                <div className="site-outline-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">DOI reference</div>
                                    <div className="mt-3 break-all font-mono text-sm font-bold text-[var(--accent)]">
                                        doi:10.5281/mathsphere.{paper.id}
                                    </div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="text-sm font-semibold text-muted-foreground">Citation</div>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                        {paper.author || "Unknown"} ({paper.created_at ? new Date(paper.created_at).getFullYear() : "2026"}). "{paper.title}". MathSphere Journal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
