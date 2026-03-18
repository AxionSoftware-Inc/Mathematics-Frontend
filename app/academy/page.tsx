/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, GraduationCap, Search, Sparkles, Users } from "lucide-react";

import { HeroBadge, SectionHeading, SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchPublic, getMediaUrl } from "@/lib/api";

type Course = {
    id: number | string;
    slug?: string | null;
    title: string;
    description?: string | null;
    instructor?: string | null;
    thumbnail?: string | null;
    level_type?: string | null;
    duration_hours?: string | number | null;
    tags_names?: string[];
};

const levelOptions = ["All", "Beginner", "Intermediate", "Advanced"];

export default function AcademyPage() {
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [query, setQuery] = React.useState("");
    const [activeLevel, setActiveLevel] = React.useState("All");

    React.useEffect(() => {
        const loadCourses = async () => {
            try {
                const res = await fetchPublic("/api/courses/", { next: { revalidate: 60 } });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };

        loadCourses();
    }, []);

    const normalizedQuery = query.trim().toLowerCase();
    const filteredCourses = courses.filter((course) => {
        const matchesLevel = activeLevel === "All" || (course.level_type || "Beginner") === activeLevel;
        const haystack = [course.title, course.description, course.instructor, ...(course.tags_names || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return matchesLevel && (!normalizedQuery || haystack.includes(normalizedQuery));
    });

    const totalHours = courses.reduce((sum, course) => sum + Number(course.duration_hours || 0), 0);
    const instructors = new Set(courses.map((course) => course.instructor).filter(Boolean));

    return (
        <div className="site-shell">
            <SiteSection className="pb-10 pt-16 md:pt-24">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-7">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Structured Mathematical Learning
                            </HeroBadge>
                            <div className="space-y-5">
                                <h1 className="site-display text-5xl md:text-7xl xl:text-[5.25rem]">
                                    Akademiya endi
                                    <span className="site-kicker"> tartibli o'quv oqimi </span>
                                    va professor darajasidagi ko'rinish bilan ishlaydi.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    Kurslar ro'yxati, instructor profillari va level bo'yicha navigatsiya bir xil
                                    professional ritmda ko'rsatiladi. Foydalanuvchi qayerdan boshlashni darrov
                                    tushunishi kerak.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/write" className="site-button-primary">
                                    Writer Workspace
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
                                    <div className="site-display text-3xl">{courses.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Faol kurslar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{instructors.size}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Instruktorlar</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{Math.round(totalHours || 0)}h</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Yig'ma davomiylik</div>
                                </div>
                                <div className="site-outline-card p-5">
                                    <div className="site-display text-3xl">{filteredCourses.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Topilgan kurslar</div>
                                </div>
                            </div>
                            <div className="mt-6 site-outline-card p-6">
                                <div className="site-eyebrow">Learning System</div>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    Har kurs cardida level, instructor, vaqt va asosiy yo'nalishlar bir qarashda
                                    ko'rinadi. Bu akademiya bo'limini dekor emas, haqiqiy o'quv mahsulotiga
                                    yaqinlashtiradi.
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
                                placeholder="Kurs, instructor yoki tag bo'yicha qidiring"
                                className="h-12 w-full rounded-full border border-border bg-transparent pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {levelOptions.map((level) => {
                                const active = level === activeLevel;
                                return (
                                    <button
                                        key={level}
                                        onClick={() => setActiveLevel(level)}
                                        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                            active
                                                ? "bg-foreground text-background"
                                                : "border border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {level}
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
                        eyebrow="Course Catalog"
                        title="Professional kurslar vitrini"
                        description="Kontent ko'rinishi endi bir xil editorial estetikada, lekin ichida real mahsulot signali bor: level, instructor, vaqt, taglar va aniq CTA."
                    />

                    {loading ? (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="site-panel h-[420px] animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCourses.length ? (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/academy/${course.slug || course.id}`}
                                    className="site-panel group flex h-full flex-col overflow-hidden"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
                                        {course.thumbnail ? (
                                            <img
                                                src={getMediaUrl(course.thumbnail)}
                                                alt={course.title}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_40%)]">
                                                <GraduationCap className="h-12 w-12 text-[var(--accent)]/45" />
                                            </div>
                                        )}
                                        <div className="absolute left-5 top-5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                            {course.level_type || "Beginner"}
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            <span>{course.instructor || "MathSphere Faculty"}</span>
                                            <span>{course.duration_hours || "12"}h</span>
                                        </div>
                                        <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                            {course.title}
                                        </h3>
                                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                            {course.description || "Nazariya va amaliyotni bog'laydigan strukturali kurs oqimi."}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {(course.tags_names || []).slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 text-sm">
                                            <div className="site-outline-card flex items-center gap-3 px-4 py-3">
                                                <Users className="h-4 w-4 text-[var(--accent)]" />
                                                <span className="font-semibold">Instructor-led</span>
                                            </div>
                                            <div className="site-outline-card flex items-center gap-3 px-4 py-3">
                                                <Clock3 className="h-4 w-4 text-[var(--accent-alt)]" />
                                                <span className="font-semibold">Structured pace</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between pt-2 text-sm font-bold">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <BookOpen className="h-4 w-4" />
                                                Kurs tafsilotlari
                                            </div>
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
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <h3 className="mt-5 font-serif text-3xl font-black">Mos kurs topilmadi</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                                Qidiruv so'zini yoki level filtrini o'zgartiring. Kurslar vitrini endi real
                                ma'lumot bilan ishlaydi va bo'sh holat ham toza ko'rsatiladi.
                            </p>
                        </div>
                    )}
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
