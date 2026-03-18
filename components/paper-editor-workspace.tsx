"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookText,
    CheckCircle2,
    CircleDashed,
    Code2,
    Eye,
    FileStack,
    FunctionSquare,
    Heading,
    Layers2,
    Loader2,
    PencilLine,
    Printer,
    Save,
    ScanText,
    Sigma,
    Sparkles,
    SquarePen,
} from "lucide-react";

import { ArticleRichContent } from "@/components/article-rich-content";
import { MathKeyboard } from "@/components/math-keyboard";
import { CitationManager } from "@/components/citation-manager";
import { WriterLiveTargetsPanel } from "@/components/live-writer-bridge/writer-live-targets-panel";
import { blockToTarget, createBroadcastChannel, createWaitingWriterBridgeBlock, createWriterId, extractWriterBridgeBlocks, replaceWriterBridgeBlock, serializeWriterBridgeBlock, type LabPublishBroadcast } from "@/lib/live-writer-bridge";

export type PaperFormData = {
    title: string;
    abstract: string;
    content: string;
    authors: string;
    keywords: string;
    status: string;
};

type SaveState = "idle" | "submitting" | "success" | "error";

type BlockPreset = {
    label: string;
    icon: typeof Sigma;
    snippet: string;
};

type StarterTemplate = {
    label: string;
    description: string;
    title: string;
    abstract: string;
    content: string;
};

const blockPresets: BlockPreset[] = [
    {
        label: "Bo'lim",
        icon: Heading,
        snippet: "\n## Yangi bo'lim\n\nBu yerda bo'lim mazmuni yoziladi.\n",
    },
    {
        label: "Teorema",
        icon: Sigma,
        snippet: "\n> **Teorema.** Shartlar bu yerga yoziladi.\n>\n> **Isbot.** Isbot tafsilotlari shu yerda.\n",
    },
    {
        label: "Ta'rif",
        icon: BookText,
        snippet: "\n> **Ta'rif.** Asosiy tushuncha va uning izohi.\n",
    },
    {
        label: "Formula",
        icon: FunctionSquare,
        snippet: "\n$$\n\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}\n$$\n",
    },
    {
        label: "2D Grafik",
        icon: Layers2,
        snippet: "\n```plot2d\n{\n  \"f\": \"sin(x)\",\n  \"domain\": [-10, 10],\n  \"title\": \"Sinus funksiyasi\"\n}\n```\n",
    },
    {
        label: "3D Grafik",
        icon: Sparkles,
        snippet: "\n```plot3d\n{\n  \"f\": \"sin(x)*cos(y)\",\n  \"xDomain\": [-5, 5],\n  \"yDomain\": [-5, 5],\n  \"title\": \"3D yuzasi\"\n}\n```\n",
    },
    {
        label: "Python",
        icon: Code2,
        snippet: "\n```python\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.plot(x, y)\nplt.grid(True)\nplt.show()\n```\n",
    },
    {
        label: "Adabiyot",
        icon: FileStack,
        snippet: "\n## Foydalanilgan adabiyotlar\n\n1. Muallif, *Asar nomi*, yil.\n2. Muallif, *Maqola nomi*, jurnal, yil.\n",
    },
];

const starterTemplates: StarterTemplate[] = [
    {
        label: "Research",
        description: "To'liq ilmiy maqola strukturasini tayyorlaydi.",
        title: "Tadqiqot maqolasi sarlavhasi",
        abstract: "Maqolaning maqsadi, metodologiyasi va asosiy natijalari haqida qisqa annotatsiya yozing.",
        content:
            "# Kirish\n\nMavzuning dolzarbligi va tadqiqot savolini bayon qiling.\n\n## Metodologiya\n\nQo'llangan usullar va dalillash yo'lini yozing.\n\n## Natijalar\n\nAsosiy topilmalarni ketma-ket keltiring.\n\n## Muhokama\n\nNatijalarni tahlil qiling va taqqoslang.\n\n## Xulosa\n\nYakuniy xulosalar va keyingi ishlar yo'nalishi.\n",
    },
    {
        label: "Lecture",
        description: "Darslik yoki lecture note ko'rinishidagi skeleton.",
        title: "Mavzu nomi",
        abstract: "Ushbu hujjat dars mazmuni va asosiy g'oyalarni qisqacha ifodalaydi.",
        content:
            "# Asosiy g'oya\n\nNazariy tushunchani intuitiv kiriting.\n\n## Muhim ta'riflar\n\n> **Ta'rif.**\n\n## Misollar\n\n1. Birinchi misol.\n2. Ikkinchi misol.\n\n## Mashqlar\n\n1. Mustaqil ishlash uchun topshiriq.\n",
    },
    {
        label: "Proof",
        description: "Isbotga yo'naltirilgan ixcham format.",
        title: "Teorema va isbot",
        abstract: "Bu hujjatda bitta markaziy teorema va uning isboti ko'rsatiladi.",
        content:
            "# Muammo qo'yilishi\n\nIsbot qilinishi kerak bo'lgan bayonotni yozing.\n\n## Tayanch lemmlar\n\n> **Lemma 1.**\n\n## Asosiy isbot\n\n> **Isbot.** Bosqichma-bosqich isbot.\n\n## Natija\n\nIsbotdan kelib chiqadigan xulosa.\n",
    },
];

function splitCommaValues(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function PaperEditorWorkspace({
    formData,
    onChange,
    onSubmit,
    saveState,
    errorMessage,
    backHref = "/write",
    mode = "new",
}: {
    formData: PaperFormData;
    onChange: (next: PaperFormData) => void;
    onSubmit: () => void;
    saveState: SaveState;
    errorMessage: string;
    backHref?: string;
    mode?: "new" | "edit";
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
    const [showMeta, setShowMeta] = useState(true);
    const writerIdRef = useRef(createWriterId());
    const channelRef = useRef<BroadcastChannel | null>(null);
    const latestFormDataRef = useRef(formData);

    const deferredTitle = useDeferredValue(formData.title);
    const deferredAbstract = useDeferredValue(formData.abstract);
    const deferredContent = useDeferredValue(formData.content);

    const words = deferredContent.trim() ? deferredContent.trim().split(/\s+/).length : 0;
    const characters = deferredContent.length;
    const readingTime = Math.max(1, Math.ceil(words / 220));
    const headings = [...deferredContent.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => ({
        level: match[0].match(/^#+/)?.[0].length ?? 1,
        title: match[1].trim(),
    }));
    const equations = (deferredContent.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || []).length;
    const codeBlocks = Math.floor((deferredContent.match(/```/g) || []).length / 2);
    const liveBridgeTargets = extractWriterBridgeBlocks(formData.content).map(blockToTarget);
    const authorList = splitCommaValues(formData.authors);
    const keywordList = splitCommaValues(formData.keywords);
    const completionItems = [
        Boolean(formData.title.trim()),
        Boolean(formData.abstract.trim()),
        Boolean(formData.authors.trim()),
        Boolean(formData.keywords.trim()),
        words >= 250,
        headings.length >= 3,
    ];
    const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

    useEffect(() => {
        latestFormDataRef.current = formData;
    }, [formData]);

    function setField<K extends keyof PaperFormData>(field: K, value: PaperFormData[K]) {
        onChange({ ...formData, [field]: value });
    }

    function insertSnippet(snippet: string) {
        const textarea = textareaRef.current;

        if (!textarea) {
            setField("content", `${formData.content}${snippet}`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const nextContent = `${formData.content.slice(0, start)}${snippet}${formData.content.slice(end)}`;

        onChange({ ...formData, content: nextContent });

        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + snippet.length;
            textarea.selectionStart = cursor;
            textarea.selectionEnd = cursor;
        });
    }

    function insertLiveBridgeBlock() {
        const block = createWaitingWriterBridgeBlock("Taylor yoki laboratoriya natijasi");
        const snippet = `\n${serializeWriterBridgeBlock(block)}\n`;
        insertSnippet(snippet);
    }

    function handleInsertCitation(citation: string, inlineRef: string) {
        const textarea = textareaRef.current;
        if (!textarea) {
            setField("content", formData.content + `\n\n- [${inlineRef}] ${citation}`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const inlineText = ` [${inlineRef}]`;

        let textWithInline = `${formData.content.slice(0, start)}${inlineText}${formData.content.slice(end)}`;
        
        if (!textWithInline.includes("## Ishlatilgan adabiyotlar")) {
            textWithInline += "\n\n## Ishlatilgan adabiyotlar\n";
        }

        textWithInline += `\n- [${inlineRef}] ${citation}`;

        onChange({ ...formData, content: textWithInline });

        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + inlineText.length;
            textarea.selectionStart = cursor;
            textarea.selectionEnd = cursor;
        });
    }

    function applyTemplate(template: StarterTemplate) {
        const shouldReplace =
            !formData.content.trim() ||
            window.confirm("Hozirgi matn o'rniga tanlangan professional andoza qo'yilsinmi?");

        if (!shouldReplace) {
            return;
        }

        onChange({
            ...formData,
            title: template.title,
            abstract: template.abstract,
            content: template.content,
        });
    }

    useEffect(() => {
        const channel = createBroadcastChannel();
        if (!channel) {
            return;
        }

        channelRef.current = channel;

        const handleMessage = (event: MessageEvent<LabPublishBroadcast>) => {
            const message = event.data;
            if (!message || message.type !== "lab-publish" || message.writerId !== writerIdRef.current) {
                return;
            }

            startTransition(() => {
                const current = latestFormDataRef.current;
                onChange({
                    ...current,
                    content: replaceWriterBridgeBlock(current.content, message.payload),
                });
            });
        };

        channel.addEventListener("message", handleMessage as EventListener);

        return () => {
            channel.removeEventListener("message", handleMessage as EventListener);
            channel.close();
            channelRef.current = null;
        };
    }, [onChange]);

    useEffect(() => {
        const channel = channelRef.current;
        if (!channel) {
            return;
        }

        const broadcastTargets = () => {
            channel.postMessage({
                type: "writer-targets",
                writerId: writerIdRef.current,
                documentTitle: formData.title || "Nomsiz maqola",
                targets: liveBridgeTargets,
            });
        };

        broadcastTargets();
        const intervalId = window.setInterval(broadcastTargets, 1500);

        return () => window.clearInterval(intervalId);
    }, [formData.title, liveBridgeTargets]);

    const statusTone =
        formData.status === "published"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-600 border-amber-500/20";

    const saveStatusLabel =
        saveState === "submitting"
            ? "Saqlanmoqda"
            : saveState === "success"
              ? "Saqlangan"
              : saveState === "error"
                ? errorMessage || "Xatolik"
                : mode === "new"
                  ? "Yangi qoralama"
                  : "Tahrirlash rejimi";

    function handleExportPDF() {
        if (viewMode === "edit") {
            setViewMode("preview");
            // Wait for DOM to update and render the preview section
            setTimeout(() => window.print(), 500);
        } else {
            window.print();
        }
    }

    return (
        <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent_35%)] bg-background text-foreground print:bg-white print:h-auto print:overflow-visible">
            <div className="flex h-full flex-col print:h-auto print:block">
                <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl print:hidden">
                    <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <Link
                                    href={backHref}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div className="min-w-0">
                                    <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                                        <SquarePen className="h-3.5 w-3.5" />
                                        Professional Writer Lab
                                    </div>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={(event) => setField("title", event.target.value)}
                                        className="w-full bg-transparent text-2xl font-black tracking-tight outline-none placeholder:text-muted-foreground/45 md:text-4xl"
                                        placeholder="Maqola sarlavhasini kiriting..."
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] ${statusTone}`}>
                                    {formData.status === "published" ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <CircleDashed className="h-4 w-4" />
                                    )}
                                    {formData.status === "published" ? "Published" : "Draft"}
                                </div>

                                <select
                                    value={formData.status}
                                    onChange={(event) => setField("status", event.target.value)}
                                    className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-semibold outline-none"
                                >
                                    <option value="draft">Qoralama</option>
                                    <option value="published">Nashrga tayyor</option>
                                </select>

                                <div className="inline-flex rounded-full border border-border/60 bg-background/60 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("edit")}
                                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${viewMode === "edit" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <PencilLine className="mr-2 inline h-3.5 w-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("split")}
                                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${viewMode === "split" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <Layers2 className="mr-2 inline h-3.5 w-3.5" />
                                        Split
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("preview")}
                                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${viewMode === "preview" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <Eye className="mr-2 inline h-3.5 w-3.5" />
                                        Preview
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-background/60 px-5 text-sm font-bold shadow-sm transition-all hover:bg-muted/80"
                                    title="Hujjatni PDF ko'rinishida saqlash"
                                >
                                    <Printer className="h-4 w-4" />
                                    PDF
                                </button>

                                <button
                                    type="button"
                                    onClick={onSubmit}
                                    disabled={saveState === "submitting" || saveState === "success"}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold text-background shadow-lg transition-all hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-60"
                                >
                                    {saveState === "submitting" ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saqlanmoqda
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Saqlash
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                                Progress: {completion}%
                            </span>
                            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                                {words} so&apos;z
                            </span>
                            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                                {readingTime} daqiqa o&apos;qish
                            </span>
                            <span className={`rounded-full border px-3 py-1.5 ${saveState === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border/60 bg-background/60"}`}>
                                {saveStatusLabel}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-1 flex-col overflow-hidden lg:flex-row print:w-full print:block print:overflow-visible">
                    <aside className="w-full shrink-0 overflow-y-auto border-b border-border/60 bg-background/40 p-4 backdrop-blur-sm lg:w-[360px] lg:border-b-0 lg:border-r print:hidden">
                        <div className="space-y-4">
                            <CitationManager onInsert={handleInsertCitation} />
                            <WriterLiveTargetsPanel targets={liveBridgeTargets} onInsertTarget={insertLiveBridgeBlock} />

                            <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                            Document Pulse
                                        </div>
                                        <div className="mt-1 text-xl font-black">Yozuv holati</div>
                                    </div>
                                    <Sparkles className="h-5 w-5 text-teal-500" />
                                </div>
                                <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 transition-all"
                                        style={{ width: `${completion}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                        <div className="text-xs text-muted-foreground">So&apos;zlar</div>
                                        <div className="mt-1 text-lg font-black">{words}</div>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                        <div className="text-xs text-muted-foreground">Belgilar</div>
                                        <div className="mt-1 text-lg font-black">{characters}</div>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                        <div className="text-xs text-muted-foreground">Tenglamalar</div>
                                        <div className="mt-1 text-lg font-black">{equations}</div>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                                        <div className="text-xs text-muted-foreground">Code blok</div>
                                        <div className="mt-1 text-lg font-black">{codeBlocks}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setShowMeta((value) => !value)}
                                    className="flex w-full items-center justify-between"
                                >
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                            Metadata
                                        </div>
                                        <div className="mt-1 text-xl font-black">Maqola pasporti</div>
                                    </div>
                                    <ScanText className={`h-5 w-5 transition-transform ${showMeta ? "rotate-0" : "-rotate-90"}`} />
                                </button>

                                {showMeta && (
                                    <div className="mt-4 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                Mualliflar
                                            </label>
                                            <input
                                                value={formData.authors}
                                                onChange={(event) => setField("authors", event.target.value)}
                                                placeholder="Masalan: A. Karimov, M. Qodirov"
                                                className="w-full rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500/40"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                Kalit so&apos;zlar
                                            </label>
                                            <input
                                                value={formData.keywords}
                                                onChange={(event) => setField("keywords", event.target.value)}
                                                placeholder="algebra, topology, PDE"
                                                className="w-full rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500/40"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                                Annotatsiya
                                            </label>
                                            <textarea
                                                value={formData.abstract}
                                                onChange={(event) => setField("abstract", event.target.value)}
                                                rows={5}
                                                placeholder="Qisqa, ilmiy va aniq abstract yozing..."
                                                className="w-full rounded-3xl border border-border/60 bg-muted/10 px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-teal-500/40"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    Starter Layouts
                                </div>
                                <div className="mt-1 text-xl font-black">Professional andozalar</div>
                                <div className="mt-4 space-y-3">
                                    {starterTemplates.map((template) => (
                                        <button
                                            key={template.label}
                                            type="button"
                                            onClick={() => applyTemplate(template)}
                                            className="w-full rounded-2xl border border-border/60 bg-muted/10 px-4 py-4 text-left transition-colors hover:border-teal-500/30 hover:bg-teal-500/5"
                                        >
                                            <div className="text-sm font-black">{template.label}</div>
                                            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                {template.description}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    Outline
                                </div>
                                <div className="mt-1 text-xl font-black">Maqola skeleti</div>
                                <div className="mt-4 space-y-2">
                                    {headings.length > 0 ? (
                                        headings.map((headingItem, index) => (
                                            <div
                                                key={`${headingItem.title}-${index}`}
                                                className="rounded-2xl border border-border/50 bg-muted/10 px-3 py-2 text-sm"
                                                style={{ marginLeft: `${(headingItem.level - 1) * 10}px` }}
                                            >
                                                {headingItem.title}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
                                            Hali sarlavhali bo&apos;limlar yo&apos;q. `##` bilan bo&apos;lim oching.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className={`flex-1 overflow-hidden ${viewMode === "split" ? "grid lg:grid-cols-2" : "grid grid-cols-1"} print:block print:overflow-visible`}>
                        {(viewMode === "edit" || viewMode === "split") && (
                            <section className="flex min-h-0 flex-col border-b border-border/60 bg-background/35 lg:border-b-0 lg:border-r print:hidden">
                                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3 bg-muted/5">
                                    {blockPresets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => insertSnippet(preset.snippet)}
                                            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <preset.icon className="h-3.5 w-3.5" />
                                            {preset.label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={insertLiveBridgeBlock}
                                        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Live Lab Block
                                    </button>
                                    <div className="ml-auto">
                                        <MathKeyboard onInsert={insertSnippet} />
                                    </div>
                                </div>

                                <textarea
                                    ref={textareaRef}
                                    value={formData.content}
                                    onChange={(event) => setField("content", event.target.value)}
                                    className="min-h-0 flex-1 resize-none bg-transparent px-5 py-6 font-mono text-[15px] leading-7 text-foreground outline-none md:px-8"
                                    placeholder="Ilmiy maqolani yozishni boshlang..."
                                    spellCheck={false}
                                />
                            </section>
                        )}

                        {(viewMode === "preview" || viewMode === "split") && (
                            <section className="min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.2))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.65),rgba(15,23,42,0.35))] print:bg-white print:overflow-visible print:block print:w-full">
                                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 print:p-0 print:m-0 print:max-w-none">
                                    <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/85 shadow-xl print:border-none print:shadow-none print:bg-white print:rounded-none">
                                        <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_28%)] px-6 py-6 md:px-8 print:bg-none print:border-none print:p-0 print:pb-6">
                                            <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
                                                <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] ${statusTone}`}>
                                                    {formData.status}
                                                </span>
                                                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                                    Professional Preview
                                                </span>
                                            </div>
                                            <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                                                {deferredTitle || "Nomsiz maqola"}
                                            </h1>
                                            {authorList.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {authorList.map((author) => (
                                                        <span
                                                            key={author}
                                                            className="rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background"
                                                        >
                                                            {author}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {keywordList.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {keywordList.map((keyword) => (
                                                        <span
                                                            key={keyword}
                                                            className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                                                        >
                                                            #{keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {deferredAbstract.trim() && (
                                            <div className="border-b border-border/60 bg-teal-500/5 px-6 py-5 md:px-8 print:border-none print:px-0">
                                                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-teal-600 print:text-black">
                                                    Abstract
                                                </div>
                                                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                                                    {deferredAbstract}
                                                </p>
                                            </div>
                                        )}

                                        <div className="px-6 py-8 md:px-8 print:p-0 print:text-black">
                                            <ArticleRichContent
                                                content={deferredContent}
                                                className="prose prose-neutral max-w-none text-foreground dark:prose-invert prose-headings:font-playfair prose-headings:font-black prose-p:text-[15px] prose-p:leading-8 print:text-black print:dark:prose-invert"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
