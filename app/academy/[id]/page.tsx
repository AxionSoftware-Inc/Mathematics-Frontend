/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, GraduationCap, Sparkles, User2, Zap } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { YouTubePlayer } from "@/components/youtube-player";
import { fetchPublic } from "@/lib/api";

type Course = {
    id: number | string;
    title: string;
    description?: string | null;
    instructor?: string | null;
    level_type?: string | null;
    duration_hours?: string | number | null;
    tags_names?: string[];
    thumbnail?: string | null;
};

async function getCourse(id: string): Promise<Course | null> {
    try {
        const res = await fetchPublic(`/api/courses/${id}/`, { next: { revalidate: 60 } });
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.error("Failed to fetch course", error);
    }

    return null;
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const params = await props.params;
    const course = await getCourse(params.id);

    return {
        title: course ? `${course.title} - MathSphere Academy` : "Kurs tafsilotlari - MathSphere",
    };
}

export default async function AcademyDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const course = await getCourse(params.id);

    if (!course) {
        return (
            <div className="site-shell">
                <SiteSection className="pt-24">
                    <SiteContainer>
                        <div className="site-panel-strong p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <h1 className="mt-5 font-serif text-4xl font-black">Kurs topilmadi</h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Siz ochmoqchi bo'lgan kurs mavjud emas yoki hali public holatga chiqmagan.
                            </p>
                            <Link href="/academy" className="site-button-primary mt-8">
                                Akademiyaga qaytish
                            </Link>
                        </div>
                    </SiteContainer>
                </SiteSection>
            </div>
        );
    }

    const learningPoints = [
        "Nazariy modelni amaliy ssenariy bilan bog'lash",
        "Asosiy tushunchalarni strukturali tartibda o'rganish",
        "Masalalar ustida ishlash uchun tayyor metodik ritm",
        "Keyingi kurslar yoki ilmiy yozuv uchun mustahkam poydevor",
    ];

    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-16 md:pt-24">
                <SiteContainer>
                    <Link href="/academy" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Barcha kurslar
                    </Link>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                {course.level_type || "Structured Course"}
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.1rem]">{course.title}</h1>
                                <p className="site-lead max-w-2xl">
                                    {course.description || "Kurs tavsifi yaqin orada to'ldiriladi."}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(course.tags_names || []).map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="site-panel-strong p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <User2 className="h-4 w-4 text-[var(--accent)]" />
                                        Instructor
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{course.instructor || "MathSphere Faculty"}</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <Clock3 className="h-4 w-4 text-[var(--accent-alt)]" />
                                        Duration
                                    </div>
                                    <div className="mt-3 font-serif text-2xl font-black">{course.duration_hours || "12"}h</div>
                                </div>
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="site-eyebrow">Course Intent</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Detail sahifasi endi faqat sarlavha va video emas. Kursning professional positioning'i,
                                    instructor signali va foydalanuvchi nimani olishini aniq ko'rsatadi.
                                </p>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="site-panel-strong p-6 md:p-8">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <div className="site-eyebrow">Course Preview</div>
                                    <h2 className="mt-2 font-serif text-4xl font-black">Introductory lesson</h2>
                                </div>
                                <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                                    Preview
                                </div>
                            </div>
                            <YouTubePlayer videoId="dQw4w9WgXcQ" title={course.title} thumbnailUrl={course.thumbnail || undefined} />
                        </div>

                        <div className="site-panel p-8">
                            <div className="site-eyebrow">Course Structure</div>
                            <h2 className="mt-3 font-serif text-4xl font-black">Nimalarni o'rganasiz</h2>
                            <div className="mt-6 space-y-4">
                                {learningPoints.map((point) => (
                                    <div key={point} className="site-outline-card flex items-start gap-3 p-4">
                                        <CheckCircle2 className="mt-1 h-4 w-4 text-[var(--accent)]" />
                                        <p className="text-sm leading-7 text-muted-foreground">{point}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/write" className="site-button-primary mt-8">
                                Shu mavzuda yozishni boshlash
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection>
                <SiteContainer>
                    <SectionHeading
                        eyebrow="Module Flow"
                        title="Tartibli o'quv yo'li"
                        description="Mundarija bloki ham endi professional ko'rinadi: foydalanuvchi bu kurs qaerdan boshlanib, qayerga olib borishini darrov anglaydi."
                    />
                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {[
                            {
                                title: "1-modul: Foundation",
                                text: "Asosiy tushunchalar, terminlar va umumiy metodologiya.",
                            },
                            {
                                title: "2-modul: Method",
                                text: "Masala yechish usullari va asosiy formulalar oqimi.",
                            },
                            {
                                title: "3-modul: Practice",
                                text: "Qo'llash, misollar va mustaqil ishlash uchun tayyor struktura.",
                            },
                        ].map((module) => (
                            <div key={module.title} className="site-panel p-7">
                                <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-muted-foreground">
                                    <Zap className="h-4 w-4 text-[var(--accent)]" />
                                    Learning block
                                </div>
                                <h3 className="mt-4 font-serif text-3xl font-black">{module.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{module.text}</p>
                            </div>
                        ))}
                    </div>
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
