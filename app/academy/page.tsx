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
    const pathwayCourses = filteredCourses.slice(0, 3);

    return (
        <div className="site-shell">
            <SiteSection className="pb-8 pt-12 md:pt-16">
                <SiteContainer>
                    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6">
                            <HeroBadge>
                                <Sparkles className="h-4 w-4" />
                                Structured Mathematical Learning
                            </HeroBadge>
                            <div className="space-y-4">
                                <h1 className="site-display text-4xl md:text-6xl xl:text-[4.5rem]">
                                    Academy endi
                                    <span className="site-kicker"> tartibli o‘quv katalogi </span>
                                    va aniq product hierarchiyasi bilan ishlaydi.
                                </h1>
                                <p className="site-lead max-w-2xl">
                                    Kurs katalogi, instructor signallari va level bo‘yicha filtrlash endi bitta izchil
                                    tizimda o‘qiladi. Har karta bir xil ritm, media sahna va metadata qatlamiga ega.
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

                        <div className="site-panel-strong p-5 md:p-7 xl:p-8">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{courses.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Faol kurslar</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{instructors.size}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Instruktorlar</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{Math.round(totalHours || 0)}h</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Yig'ma davomiylik</div>
                                </div>
                                <div className="site-metric-card p-5">
                                    <div className="site-display text-3xl">{filteredCourses.length}</div>
                                    <div className="mt-2 text-sm font-semibold text-muted-foreground">Topilgan kurslar</div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                                <div className="site-media-frame p-5">
                                    <div className="site-eyebrow">Learning Ladder</div>
                                    <div className="mt-5 space-y-3">
                                        {pathwayCourses.length ? (
                                            pathwayCourses.map((course, index) => (
                                                <div key={course.id} className="site-outline-card flex items-center justify-between gap-4 p-4">
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                            Step {index + 1}
                                                        </div>
                                                        <div className="mt-2 line-clamp-1 text-sm font-semibold">{course.title}</div>
                                                    </div>
                                                    <div className="shrink-0 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                                                        {course.level_type || "Beginner"}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-10 text-center text-sm font-semibold text-muted-foreground">
                                                Kurslar yuklanmoqda
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Visual Rule</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Har bir kursda cover media alohida sahnada, qolgan ma’lumot esa sokin va
                                            aniq tipografik qatlamda beriladi.
                                        </p>
                                    </div>
                                    <div className="site-outline-card p-5">
                                        <div className="site-eyebrow">Decision Speed</div>
                                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                            Instructor, davomiylik, level va asosiy taglar bir qarashda ko‘rinadi.
                                            Foydalanuvchi qayerdan boshlash kerakligini tez anglaydi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SiteContainer>
            </SiteSection>

            <SiteSection className="py-8">
                <SiteContainer>
                    <div className="site-filter-shell flex flex-col gap-5 p-5 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-xl">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Kurs, instructor yoki tag bo‘yicha qidiring"
                                    className="site-search-input pl-11 pr-4 text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {levelOptions.map((level) => {
                                    const active = level === activeLevel;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setActiveLevel(level)}
                                            className={`site-chip ${active ? "site-chip-active" : ""}`}
                                        >
                                            {level}
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
                        eyebrow="Course Catalog"
                        title="Professional kurslar vitrini"
                        description="Kontent ko'rinishi endi ancha tartibli: thumbnail sahnasi, instructor va duration signallari, keyin esa kursning o'ziga xos mazmuni."
                    />

                    {loading ? (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="site-panel h-[460px] animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCourses.length ? (
                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/academy/${course.slug || course.id}`}
                                    className="site-panel group flex h-full flex-col p-4"
                                >
                                    <div className="site-media-frame p-4">
                                        <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                            <span className="site-status-pill">
                                                {course.level_type || "Beginner"}
                                            </span>
                                            <span>{course.duration_hours || "12"}h</span>
                                        </div>

                                        <div className="site-cover-stage mx-auto mt-4 max-w-[280px] p-3">
                                            <div className="site-cover-inner relative aspect-[16/10]">
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                            <span>{course.instructor || "MathSphere Faculty"}</span>
                                            <span>{course.tags_names?.length || 0} tags</span>
                                        </div>
                                        <h3 className="mt-4 font-serif text-3xl font-black leading-tight transition-colors group-hover:text-[var(--accent)]">
                                            {course.title}
                                        </h3>
                                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                                            {course.description || "Nazariya va amaliyotni bog‘laydigan tartibli o‘quv oqimi."}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {(course.tags_names || []).slice(0, 3).map((tag) => (
                                                <span key={tag} className="site-chip !px-3 !py-2 !text-[10px]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-auto border-t border-border pt-5 text-sm">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="site-outline-card flex items-center gap-3 px-4 py-3">
                                                    <Users className="h-4 w-4 text-[var(--accent)]" />
                                                    <span className="font-semibold">Instructor-led</span>
                                                </div>
                                                <div className="site-outline-card flex items-center gap-3 px-4 py-3">
                                                    <Clock3 className="h-4 w-4 text-[var(--accent-alt)]" />
                                                    <span className="font-semibold">Structured pace</span>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex items-center justify-between font-bold">
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
                                Qidiruv so‘zini yoki level filtrini yangilang. Bo‘sh holat ham shu product tilida,
                                ortiqcha bezaksiz va aniq signal bilan ko‘rsatiladi.
                            </p>
                        </div>
                    )}
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
