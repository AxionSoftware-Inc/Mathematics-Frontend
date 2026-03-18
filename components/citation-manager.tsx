"use client";

import { useState } from "react";
import { BookMarked, Search, Loader2, PlusCircle, ExternalLink, Quote, ChevronDown, Copy, CheckCircle2 } from "lucide-react";

export type CitationResult = {
    DOI: string;
    title?: string[];
    author?: { given?: string; family?: string }[];
    "container-title"?: string[];
    issued?: { "date-parts"?: number[][] };
    "is-referenced-by-count"?: number;
    publisher?: string;
};

export function CitationManager({ onInsert }: { onInsert: (citation: string, inlineRef: string) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CitationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [format, setFormat] = useState<"APA" | "IEEE" | "Harvard" | "Chicago">("APA");
    const [copiedDOI, setCopiedDOI] = useState<string | null>(null);

    const searchCitations = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError("");
        
        try {
            const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&select=author,title,container-title,issued,DOI,is-referenced-by-count,publisher&rows=15`);
            if (!res.ok) throw new Error("Qidiruv xizmatida xatolik yuz berdi");
            const data = await res.json();
            setResults(data.message.items || []);
        } catch (err: any) {
            setError(err.message || "Xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCitation = (item: CitationResult) => {
        const title = item.title?.[0] || "Nomsiz maqola";
        
        // Advanced author formatting based on selected style
        let authorsStr = "Noma'lum muallif";
        if (item.author && item.author.length > 0) {
            const mapped = item.author.map(a => `${a.family || ''} ${a.given ? a.given[0] + '.' : ''}`.trim());
            if (format === "IEEE") {
                if (mapped.length > 3) {
                    authorsStr = `${item.author[0].given ? item.author[0].given[0] + '. ' : ''}${item.author[0].family}, et al.`;
                } else {
                    authorsStr = item.author.map(a => `${a.given ? a.given[0] + '. ' : ''}${a.family}`).join(", ");
                }
            } else if (format === "APA") {
                if (mapped.length > 20) {
                    authorsStr = mapped.slice(0, 19).join(", ") + ", ... " + mapped[mapped.length - 1];
                } else if (mapped.length > 1) {
                    authorsStr = mapped.slice(0, -1).join(", ") + " & " + mapped[mapped.length - 1];
                } else {
                    authorsStr = mapped[0];
                }
            } else {
                // Harvard/Chicago generalized
                if (mapped.length > 3) {
                    authorsStr = `${mapped[0]} et al.`;
                } else {
                    authorsStr = mapped.join(", ");
                }
            }
        }

        const journal = item["container-title"]?.[0] || item.publisher || "";
        const year = item.issued?.["date-parts"]?.[0]?.[0] || "n.d.";
        
        if (format === "IEEE") {
            return `${authorsStr}, "${title}," ${journal ? `*${journal}*` : ""}, ${year}. [Online]. Available: https://doi.org/${item.DOI}`;
        }
        if (format === "Harvard") {
            return `${authorsStr} (${year}) '${title}', ${journal ? `*${journal}*` : ""}. doi: ${item.DOI}.`;
        }
        if (format === "Chicago") {
            return `${authorsStr}. "${title}." ${journal ? `*${journal}*` : ""} (${year}). https://doi.org/${item.DOI}.`;
        }
        
        // Default APA
        return `${authorsStr} (${year}). ${title}. ${journal ? `*${journal}*` : ""}. https://doi.org/${item.DOI}`;
    };

    const getBibTeX = (item: CitationResult) => {
        const refName = (item.author?.[0]?.family ? item.author[0].family.replace(/\s+/g, '') : "Ref") + (item.issued?.["date-parts"]?.[0]?.[0] || "");
        const finalRef = refName.length > 0 ? refName : (item.DOI.split('/')[1] || "ref");
        const authors = item.author?.map(a => `${a.family || ''}, ${a.given || ''}`.trim()).join(" and ") || "Unknown";
        const title = item.title?.[0] || "";
        const journal = item["container-title"]?.[0] || item.publisher || "";
        const year = item.issued?.["date-parts"]?.[0]?.[0] || "";
        
        return `@article{${finalRef},
  title={${title}},
  author={${authors}},
  journal={${journal}},
  year={${year}},
  doi={${item.DOI}}
}`;
    };

    const copyBibtex = (item: CitationResult) => {
        const bibtex = getBibTeX(item);
        navigator.clipboard.writeText(bibtex);
        setCopiedDOI(item.DOI);
        setTimeout(() => setCopiedDOI(null), 2000);
    };

    const handleInsert = (item: CitationResult) => {
        const formatted = formatCitation(item);
        const refName = (item.author?.[0]?.family ? item.author[0].family.replace(/\s+/g, '') : "Ref") + (item.issued?.["date-parts"]?.[0]?.[0] || "");
        const finalRef = refName.length > 0 ? refName : (item.DOI.split('/')[1] || "ref");
        onInsert(formatted, finalRef);
    };

    return (
        <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                        Crossref Global DB
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xl font-black text-indigo-500">
                        <Quote className="h-5 w-5" />
                        Iqtiboslar
                    </div>
                </div>
                <div className="relative">
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as any)}
                        className="appearance-none rounded-xl border border-border/60 bg-muted/20 pl-3 pr-8 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground outline-none transition-colors focus:border-indigo-500/40"
                    >
                        <option value="APA">APA Style</option>
                        <option value="IEEE">IEEE Style</option>
                        <option value="Harvard">Harvard</option>
                        <option value="Chicago">Chicago</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            <form onSubmit={searchCitations} className="relative mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Muallif, sarlavha, DOI yozing..."
                    className="w-full rounded-2xl border border-border/60 bg-muted/10 py-3 pl-4 pr-12 text-sm outline-none transition-colors focus:border-indigo-500/40"
                />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
            </form>

            {error && <div className="mb-4 text-xs font-semibold text-destructive">{error}</div>}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {results.map((item) => (
                    <div key={item.DOI} className="rounded-2xl border border-border/60 bg-muted/10 p-3 transition-colors hover:border-indigo-500/30">
                        <div className="text-xs font-bold leading-snug line-clamp-2" title={item.title?.[0]}>
                            {item.title?.[0] || "Nomsiz maqola"}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                            {item.author?.map(a => `${a.family || ''}`).join(", ")} • {item.issued?.["date-parts"]?.[0]?.[0]}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {item["is-referenced-by-count"] !== undefined && item["is-referenced-by-count"] > 0 && (
                                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                                    Cited by {item["is-referenced-by-count"]}
                                </span>
                            )}
                            {item.publisher && (
                                <span className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground max-w-[120px] truncate" title={item.publisher}>
                                    {item.publisher}
                                </span>
                            )}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                            <div className="flex items-center gap-2">
                                <a href={`https://doi.org/${item.DOI}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-indigo-500 transition-colors">
                                    <ExternalLink className="h-3.5 w-3.5" /> DOI
                                </a>
                                <button
                                    type="button"
                                    onClick={() => copyBibtex(item)}
                                    className="ml-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-indigo-500 transition-colors"
                                    title="BibTeX formatida nusxalash"
                                >
                                    {copiedDOI === item.DOI ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    BibTeX
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleInsert(item)}
                                className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-500/20 active:scale-95"
                            >
                                <PlusCircle className="h-3.5 w-3.5" /> Qo'shish
                            </button>
                        </div>
                    </div>
                ))}

                {results.length === 0 && !isLoading && !error && (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-4 text-center text-sm text-muted-foreground">
                        Jahon miqyosidagi ilmiy jurnallardan o'zingizga kerakli maqolalarni qidiring (Crossref tarmog'i so'rovlar bepul!)
                    </div>
                )}
            </div>
        </div>
    );
}
