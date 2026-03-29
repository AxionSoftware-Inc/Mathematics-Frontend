/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Download, FileText, Quote, Sparkles, User2 } from "lucide-react";

import { ArticleRichContent } from "@/components/article-rich-content";
import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";

type Article = {
    id: number | string;
    title: string;
    content?: string | null;
    summary?: string | null;
    author?: string | null;
    category_name?: string | null;
    created_at?: string | null;
    read_time_minutes?: number | null;
    cover_image?: string | null;
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

    const citationYear = paper.created_at ? new Date(paper.created_at).getFullYear() : "2026";

    return (
        <div className="site-shell">
            {paper.cover_image ? (
                <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
                    <img
                        src={getMediaUrl(paper.cover_image)}
                        alt={paper.title}
                        className="h-full w-full scale-[1.14] object-cover opacity-[0.12] blur-[26px]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,242,236,0.97),rgba(244,242,236,0.84)_22%,rgba(244,242,236,0.74)_58%,rgba(244,242,236,0.98))] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.96),rgba(0,0,0,0.82)_22%,rgba(0,0,0,0.7)_58%,rgba(0,0,0,0.98))]" />
                </div>
            ) : null}

            <SiteSection className="pb-8 pt-12 md:pt-16">
                <SiteContainer>
                    <Link href="/journal" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Maqolalar arxivi
                    </Link>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                {paper.category_name || "Scientific Article"}
                            </HeroBadge>

                            <div className="space-y-4">
                                <h1 className="site-display text-4xl md:text-6xl xl:text-[4.4rem]">{paper.title}</h1>
                                {paper.summary ? <p className="site-lead max-w-3xl">{paper.summary}</p> : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="site-chip site-chip-active">{paper.author || "Unknown author"}</span>
                                <span className="site-chip">
                                    {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : "Current issue"}
                                </span>
                                <span className="site-chip">{paper.read_time_minutes || 5} min read</span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="site-metric-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        Author
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{paper.author || "Unknown author"}</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Clock3 className="h-4 w-4 text-[var(--accent-alt)]" />
                                        Read time
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{paper.read_time_minutes || 5} min</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                                        Published
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">
                                        {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : "Current issue"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                            <div className="site-panel-strong p-8">
                                <div className="site-eyebrow">Export & Citation</div>
                                <div className="mt-6 space-y-4">
                                    <button className="site-button-primary w-full" type="button">
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
                                            {paper.author || "Unknown"} ({citationYear}). "{paper.title}". MathSphere Journal.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="site-eyebrow">Reading Note</div>
                                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                    Metadata va export signallari o‘ng railda jamlanadi. Asosiy o‘qish oqimi esa chap
                                    tomonda sokin, uzun formatli editorial ritmda davom etadi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                                description="Markdown, LaTeX va boy bloklar toza editorial ritmda, uzun o‘qish uchun mos ko‘rinishda render qilinadi."
                            />
                            <ArticleRichContent
                                content={paper.content || ""}
                                className="prose prose-neutral mt-8 max-w-none space-y-8 text-[1.02rem] text-foreground/85 prose-headings:font-serif prose-headings:text-foreground prose-p:leading-8 prose-li:leading-8 prose-blockquote:border-l-[3px] prose-blockquote:border-[var(--accent)] prose-blockquote:bg-[var(--accent-soft)] prose-blockquote:px-5 prose-blockquote:py-3 prose-img:rounded-[1.5rem] prose-img:border prose-img:border-border dark:prose-invert"
                            />
                        </div>

                        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                            <div className="site-panel-strong p-8">
                                <div className="site-eyebrow">Quick Facts</div>
                                <div className="mt-6 space-y-4 text-sm font-semibold">
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Category</span>
                                        <span>{paper.category_name || "Scientific Article"}</span>
                                    </div>
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Reading mode</span>
                                        <span>Long-form editorial</span>
                                    </div>
                                    <div className="site-outline-card flex items-center justify-between gap-4 p-4">
                                        <span className="text-muted-foreground">Estimated focus</span>
                                        <span>{paper.read_time_minutes || 5} minutes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="site-panel p-6">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <FileText className="h-4 w-4 text-[var(--accent)]" />
                                    Editorial Signal
                                </div>
                                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                    Summary yuqorida, to‘liq matn pastda va citation yon panelda joylashgani sabab
                                    sahifa journal mahsuloti sifatida ancha ishonchli o‘qiladi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
