"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Pencil, Trash2, Calendar, Clock, BookOpen, Layers, Search, X } from "lucide-react";

interface Paper {
    id: number;
    title: string;
    abstract: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function WriteIndexPage() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchPapers = async () => {
        setIsLoading(true);
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
            const query = new URLSearchParams();
            if (filterStatus !== "all") query.append("status", filterStatus);
            if (searchQuery.trim()) query.append("q", searchQuery.trim());
            
            const res = await fetch(`${apiUrl}/api/builder/papers/?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPapers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPapers();
        }, 400); // debounce search
        return () => clearTimeout(timer);
    }, [filterStatus, searchQuery]);

    const handleDelete = async (id: number) => {
        if (!confirm("Haqiqatan ham ushbu maqolani o'chirib tashlamoqchimisiz?")) return;
        
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
            const res = await fetch(`${apiUrl}/api/builder/papers/${id}/`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchPapers();
            }
        } catch (e) {
            console.error("Xatolik", e);
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Professional Top Bar */}
            <div className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                <div className="w-full max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold font-playfair shadow-md">
                            M
                        </div>
                        <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
                            MathSphere <span className="text-muted-foreground font-normal">| Writer Workspace</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/write/new" 
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-all px-5 py-2 text-sm shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Yangi Maqola
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
                
                {/* Left Sidebar Menu */}
                <div className="w-64 hidden lg:flex flex-col gap-2 shrink-0">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">Boshqaruv</div>
                    <button 
                        onClick={() => setFilterStatus("all")}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${filterStatus === 'all' ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                        <Layers className="w-4 h-4" /> Barcha maqolalar
                    </button>
                    <button 
                        onClick={() => setFilterStatus("published")}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${filterStatus === 'published' ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                        <BookOpen className="w-4 h-4" /> Nashr etilgan
                    </button>
                    <button 
                        onClick={() => setFilterStatus("draft")}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${filterStatus === 'draft' ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                        <FileText className="w-4 h-4" /> Qoralamalar
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            {filterStatus === 'all' && "Hujjatlar Arxivi"}
                            {filterStatus === 'published' && "Nashr etilgan maqolalar"}
                            {filterStatus === 'draft' && "Qoralamalar"}
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Maqola izlash..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-8 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm w-full md:w-64 transition-all"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap hidden sm:block">
                                {papers.length} ta hujjat
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                             {[1, 2, 3].map(i => (
                                 <div key={i} className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm p-6 h-48 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="h-6 bg-muted/60 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-muted/50 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <div className="h-4 bg-muted/40 rounded w-1/4 animate-pulse"></div>
                                        <div className="h-4 bg-muted/40 rounded w-1/4 animate-pulse"></div>
                                    </div>
                                 </div>
                             ))}
                        </div>
                    ) : papers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl p-16 text-center h-[50vh] bg-muted/10">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 border border-border/50 shadow-inner">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold tracking-tight">Hali ilmiy maqolalar yoʻq</h3>
                            <p className="text-muted-foreground mt-2 max-w-md mb-8 leading-relaxed">
                                Yangi loyihani boshlang. Ma'lumotlar avtomatik tekshiriladi va xavfsiz muhitda tahrirlanadi. Latex formatlarini ham kiritish mumkin.
                            </p>
                            <Link 
                                href="/write/new" 
                                className="inline-flex items-center justify-center rounded-xl font-medium transition-all bg-foreground text-background hover:scale-105 active:scale-95 h-12 px-6 shadow-xl"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Yangi qoralama yaratish
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {papers.map(paper => (
                                <div key={paper.id} className="rounded-xl border border-border/50 bg-background hover:bg-muted/10 transition-all shadow-sm hover:shadow-md group flex flex-col overflow-hidden relative">
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${paper.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                                {paper.status === 'draft' ? "Qoralama" : "Nashr qilingan"}
                                            </span>
                                            
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleDelete(paper.id)}
                                                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                    title="O'chirish"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <Link 
                                                    href={`/write/${paper.id}`}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Tahrirlash"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold leading-snug tracking-tight mb-3 line-clamp-2 pr-4 text-foreground cursor-pointer" title={paper.title || "Titul yo'q"} onClick={() => window.location.href = `/write/${paper.id}`}>
                                            {paper.title || "Nomsiz maqola"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">
                                            {paper.abstract || "Annotatsiya kiritilmagan yoxud hali yozilmoqda..."}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(paper.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(paper.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Link Overlay for entire card except buttons */}
                                    <Link href={`/write/${paper.id}`} className="absolute inset-0 z-0"></Link>
                                    <div className="absolute top-6 right-6 z-10 sm:hidden">
                                       <Link href={`/write/${paper.id}`}><Pencil className="w-4 h-4 text-muted-foreground" /></Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
