export type WriterTemplateCategory =
    | "research"
    | "teaching"
    | "proof"
    | "expository"
    | "report"
    | "thesis"
    | "laboratory"
    | "draft";

export type WriterTemplateIcon =
    | "book-open"
    | "flask"
    | "newspaper"
    | "graduation-cap"
    | "sigma"
    | "scroll-text"
    | "briefcase"
    | "sparkles";

export type WriterTemplateAddOnIcon =
    | "sigma"
    | "newspaper"
    | "sparkles"
    | "scroll-text"
    | "briefcase"
    | "graduation-cap";

export type WriterTemplateAddOn = {
    id: string;
    title: string;
    description: string;
    icon: WriterTemplateAddOnIcon;
    snippet: string;
};

export type WriterTemplatePreset = {
    id: string;
    title: string;
    description: string;
    templateId: string;
    addOnIds: string[];
};

export type WriterTemplate = {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    category: WriterTemplateCategory;
    icon: WriterTemplateIcon;
    accentClassName: string;
    recommendedFor: string[];
    recommendedAddOnIds: string[];
    titleTemplate: string;
    abstractTemplate: string;
    contentTemplate: string;
    keywords: string;
};

export const DEFAULT_WRITER_TEMPLATE_ID = "simple-draft";
export const DEFAULT_WRITER_PRESET_ID = "minimal";
const legacyTemplateIdMap: Record<string, string> = {
    research: "research-paper",
    article: "expository-article",
    simple: "simple-draft",
};

export const writerTemplates: WriterTemplate[] = [
    {
        id: "research-paper",
        title: "Research Paper",
        shortDescription: "IMRAD uslubidagi to'liq ilmiy maqola andozasi.",
        description: "Kirish, metodologiya, natijalar, muhokama va xulosa bilan professional tadqiqot maqolasi uchun tayyor skelet.",
        category: "research",
        icon: "book-open",
        accentClassName: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        recommendedFor: ["Journal submission", "Conference paper", "Formal mathematical analysis"],
        recommendedAddOnIds: ["citation-guide", "theorem-pack", "appendix-pack"],
        titleTemplate: "Tadqiqot maqolasi sarlavhasi",
        abstractTemplate: "Ushbu maqola [mavzu] bo'yicha [metod] asosida olingan natijalarni tahlil qiladi va [asosiy xulosa]ni ko'rsatadi.",
        contentTemplate: `# Kirish

Mavzuning dolzarbligi, tadqiqot savoli va maqsadini aniq bayon qiling.

## Muammo qo'yilishi

Asosiy muammo, belgilashlar va ishlatiladigan obyektlarni kiriting.

## Metodologiya

Qo'llangan nazariy apparat, hisoblash usuli yoki isbot strategiyasini yozing.

## Asosiy natijalar

> **Teorema 1.**

> **Isbot.** Bosqichma-bosqich isbot shu yerga yoziladi.

## Muhokama

Natijalarni oldingi ishlar yoki intuitiv talqin bilan taqqoslang.

## Xulosa

Yakuniy xulosalar va keyingi tadqiqot yo'nalishlarini yozing.

## Ishlatilgan adabiyotlar

1. Muallif, *Asar nomi*, jurnal yoki nashr, yil.
`,
        keywords: "research, mathematics, analysis",
    },
    {
        id: "lecture-note",
        title: "Lecture Note",
        shortDescription: "Dars, seminar va tushuntirish matnlari uchun strukturali format.",
        description: "Ta'riflar, teoremalar, misollar va mashqlar bilan o'quvchi uchun tushunarli lecture note andozasi.",
        category: "teaching",
        icon: "graduation-cap",
        accentClassName: "text-teal-500 bg-teal-500/10 border-teal-500/20",
        recommendedFor: ["University lecture", "Workshop handout", "Self-study material"],
        recommendedAddOnIds: ["example-bank", "citation-guide"],
        titleTemplate: "Mavzu nomi",
        abstractTemplate: "Ushbu lecture note [mavzu]ning asosiy g'oyalari, ta'riflari va tipik misollarini jamlaydi.",
        contentTemplate: `# Kirish

Mavzuga intuitiv kirish va asosiy motivatsiyani yozing.

## Muhim ta'riflar

> **Ta'rif.** Asosiy tushuncha shu yerda beriladi.

## Asosiy teoremalar

> **Teorema.** Bayonot.

> **Isbot g'oyasi.** To'liq yoki qisqa tushuntirish.

## Misollar

1. Birinchi misol.
2. Ikkinchi misol.

## Mashqlar

1. Mustaqil ishlash topshirig'i.
2. Qo'shimcha savol.
`,
        keywords: "lecture, notes, teaching",
    },
    {
        id: "proof-note",
        title: "Proof Note",
        shortDescription: "Isbotga yo'naltirilgan ixcham, formal yozuv formati.",
        description: "Lemma, faraz, strategiya va asosiy isbot bloklari bilan bitta natijani toza yozish uchun qulay.",
        category: "proof",
        icon: "sigma",
        accentClassName: "text-violet-500 bg-violet-500/10 border-violet-500/20",
        recommendedFor: ["Standalone theorem proof", "Lemma draft", "Formal derivation"],
        recommendedAddOnIds: ["theorem-pack", "appendix-pack"],
        titleTemplate: "Teorema va isbot",
        abstractTemplate: "Bu hujjatda [natija] uchun kerakli farazlar va isbot strategiyasi jamlanadi.",
        contentTemplate: `# Bayonot

Isbot qilinishi kerak bo'lgan asosiy natijani yozing.

## Farazlar

1. Birinchi faraz.
2. Ikkinchi faraz.

## Yordamchi lemmlar

> **Lemma 1.**

> **Isbot.**

## Asosiy isbot

> **Isbot.** Har bir qadamni alohida asos bilan yozing.

## Natija

Isbotdan kelib chiqadigan asosiy xulosa yoki korollariy.
`,
        keywords: "proof, theorem, lemma",
    },
    {
        id: "expository-article",
        title: "Expository Article",
        shortDescription: "Ilmiy-ommabop yoki tushuntiruvchi maqola uchun boy andoza.",
        description: "Grafiklar, intuition va strukturalangan bo'limlar bilan murakkab matematik fikrni osonroq tushuntirish uchun.",
        category: "expository",
        icon: "newspaper",
        accentClassName: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
        recommendedFor: ["Math blog", "Magazine article", "Concept explainer"],
        recommendedAddOnIds: ["visualization-pack", "example-bank"],
        titleTemplate: "Mavzu sarlavhasi",
        abstractTemplate: "Ushbu maqola [mavzu]ni intuitiv misollar, grafiklar va oddiy izohlar orqali tushuntiradi.",
        contentTemplate: `# Asosiy g'oya

O'quvchini mavzuga olib kiruvchi qisqa kirish yozing.

## Muammo nimada?

Mavzuning nega qiziq ekanini sodda tilda tushuntiring.

## Intuitiv tushuntirish

Asosiy fikrni obrazli yoki oddiy misol bilan bering.

## Grafik yoki tajriba

\`\`\`plot2d
{
  "f": "x^2",
  "domain": [-10, 10],
  "title": "Namunaviy grafik"
}
\`\`\`

## Chuqurroq qarash

Formalroq tushuntirish yoki formula shu yerda beriladi.

## Xulosa

Maqoladan chiqadigan asosiy fikrlar va keyingi o'qish yo'nalishi.
`,
        keywords: "article, exposition, visualization",
    },
    {
        id: "project-report",
        title: "Project Report",
        shortDescription: "Loyiha yoki hisoblash ishlari uchun professional hisobot formati.",
        description: "Maqsad, qurilgan model, bajarilgan ishlar, natijalar va keyingi qadamlarni tartibli ko'rsatadi.",
        category: "report",
        icon: "briefcase",
        accentClassName: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        recommendedFor: ["Team report", "Research progress note", "Computation summary"],
        recommendedAddOnIds: ["delivery-checklist", "appendix-pack"],
        titleTemplate: "Loyiha hisoboti nomi",
        abstractTemplate: "Bu hisobot [loyiha] bo'yicha bajarilgan ishlar, asosiy natijalar va keyingi bosqichlarni qisqacha bayon qiladi.",
        contentTemplate: `# Loyiha maqsadi

Loyiha vazifasi va muvaffaqiyat mezonlarini yozing.

## Boshlang'ich shartlar

Berilganlar, cheklovlar va ishlatilgan resurslar.

## Yechim arxitekturasi

Model, algoritm yoki metodlar ketma-ketligi.

## Olingan natijalar

Jadval, formula yoki qisqa xulosa bilan natijani kiriting.

## Muammolar va risklar

Aniqlangan cheklovlar yoki yechilmagan masalalar.

## Keyingi qadamlar

Navbatdagi iteratsiya uchun reja.
`,
        keywords: "report, project, progress",
    },
    {
        id: "thesis-chapter",
        title: "Thesis Chapter",
        shortDescription: "Bitiruv ishi yoki dissertatsiya bobi uchun formal tuzilma.",
        description: "Kengroq akademik yozuv uchun bo'lim, subsection, related work va conclusion oqimini tayyorlaydi.",
        category: "thesis",
        icon: "scroll-text",
        accentClassName: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        recommendedFor: ["Bachelor thesis", "Master thesis", "Dissertation chapter"],
        recommendedAddOnIds: ["citation-guide", "appendix-pack"],
        titleTemplate: "Bob sarlavhasi",
        abstractTemplate: "Ushbu bob [mavzu]ning nazariy asoslari, tegishli ishlar va asosiy natijalarini tizimli ravishda ko'rib chiqadi.",
        contentTemplate: `# Bobga kirish

Bobning umumiy maqsadi va kontekstini yozing.

## 1. Nazariy asoslar

Tushunchalar, belgilashlar va zarur old bilimlar.

## 2. Tegishli ishlar

Oldingi tadqiqotlar yoki manbalarni qisqacha ko'rib chiqing.

## 3. Asosiy tahlil

Matematik model, isbot yoki asosiy derivatsiyalar.

## 4. Natijalar

Bob doirasida olingan yangi xulosalar.

## 5. Yakuniy eslatmalar

Keyingi bob bilan bog'lanish va o'tish.
`,
        keywords: "thesis, chapter, academic writing",
    },
    {
        id: "lab-report",
        title: "Lab Report",
        shortDescription: "Laboratoriya natijalarini writer bilan birlashtirish uchun mos format.",
        description: "Hisoblash tajribasi, observation va vizual natijalarni toza maqola shakliga keltirish uchun mo'ljallangan.",
        category: "laboratory",
        icon: "flask",
        accentClassName: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        recommendedFor: ["Laboratory export", "Computation session", "Interactive experiment summary"],
        recommendedAddOnIds: ["lab-observation-pack", "visualization-pack", "delivery-checklist"],
        titleTemplate: "Laboratoriya hisobot sarlavhasi",
        abstractTemplate: "Mazkur hisobot laboratoriyada bajarilgan [hisoblash/tajriba] jarayoni, kuzatuvlar va olingan natijalarni umumlashtiradi.",
        contentTemplate: `# Vazifa

Laboratoriyada ko'rilgan masala yoki tajribani yozing.

## Berilganlar

Ishlatilgan parametrlar, ifodalar yoki boshlang'ich shartlar.

## Hisoblash jarayoni

Laboratoriya modulidan olingan asosiy bosqichlar va izohlar.

## Natijalar

Grafik, jadval yoki live blok natijalari shu yerda sharhlanadi.

## Tahlil

Natijalar nimani ko'rsatishini izohlang.

## Xulosa

Yakuniy baho va keyingi tekshirishlar.
`,
        keywords: "laboratory, report, computation",
    },
    {
        id: "simple-draft",
        title: "Simple Draft",
        shortDescription: "Tez yozish, brainstorming va erkin qoralama uchun yengil andoza.",
        description: "Maqsad tez boshlash bo'lsa, minimal strukturali va hech narsani majburlamaydigan draft rejimi.",
        category: "draft",
        icon: "sparkles",
        accentClassName: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        recommendedFor: ["Quick notes", "Early idea dump", "Freeform drafting"],
        recommendedAddOnIds: ["delivery-checklist"],
        titleTemplate: "Yangi qoralama",
        abstractTemplate: "Tezkor qaydlar va fikrlar.",
        contentTemplate: `# Yangi qoralama

Bu yerda fikrlar, formulalar, bloklar va keyingi reja yoziladi.

## Eslatmalar

- 

## Keyingi qadamlar

- 
`,
        keywords: "draft, notes",
    },
];

export const writerTemplateAddOns: WriterTemplateAddOn[] = [
    {
        id: "theorem-pack",
        title: "Theorem Pack",
        description: "Teorema, lemma va isbot uchun tayyor formal bloklar.",
        icon: "sigma",
        snippet: `## Qo'shimcha teorema bloki

> **Lemma.** Yordamchi natija shu yerda yoziladi.
>
> **Isbot.** Lemma isboti.

> **Teorema.** Asosiy bayonot.
>
> **Isbot.** Teorema isboti shu yerga yoziladi.
`,
    },
    {
        id: "citation-guide",
        title: "Citation Guide",
        description: "Manbalar bilan ishlash va bibliografiya uchun tayyor bo'lim.",
        icon: "scroll-text",
        snippet: `## Citation Notes

Matn ichida manbani \`[1]\` yoki \`[Muallif, yil]\` formatida belgilang.

## Ishlatilgan adabiyotlar

1. Muallif, *Asar nomi*, jurnal yoki nashr, yil.
2. Muallif, *Asar nomi*, nashriyot, yil.
`,
    },
    {
        id: "visualization-pack",
        title: "Visualization Pack",
        description: "Grafik va vizual tushuntirish uchun tayyor blok.",
        icon: "newspaper",
        snippet: `## Vizual tahlil

\`\`\`plot2d
{
  "f": "sin(x)",
  "domain": [-10, 10],
  "title": "Vizual tahlil grafigi"
}
\`\`\`

Grafikdan olingan kuzatuvlar shu yerda yoziladi.
`,
    },
    {
        id: "example-bank",
        title: "Example Bank",
        description: "Misollar va mashqlarni tez qo'shish uchun blok.",
        icon: "graduation-cap",
        snippet: `## Misollar

1. Birinchi misol.
2. Ikkinchi misol.

## Mashqlar

1. Mustaqil yechish uchun topshiriq.
2. Qo'shimcha savol.
`,
    },
    {
        id: "lab-observation-pack",
        title: "Lab Observation Pack",
        description: "Kuzatuv, parametr va experiment log uchun blok.",
        icon: "sparkles",
        snippet: `## Observation Log

- Ishlatilgan parametrlar:
- Kuzatilgan xatti-harakat:
- Kutilmagan natija:

## Experiment Notes

- Qadam 1:
- Qadam 2:
- Qadam 3:
`,
    },
    {
        id: "appendix-pack",
        title: "Appendix Pack",
        description: "Appendix va texnik detallar uchun tayyor bo'lim.",
        icon: "briefcase",
        snippet: `## Appendix

Bu yerda qo'shimcha hisoblash, texnik tafsilot yoki yordamchi jadval beriladi.
`,
    },
    {
        id: "delivery-checklist",
        title: "Delivery Checklist",
        description: "Maqola topshirishdan oldingi tekshiruv ro'yxati.",
        icon: "scroll-text",
        snippet: `## Submission Checklist

- [ ] Sarlavha yakuniy tekshirildi
- [ ] Abstract tozalandi
- [ ] Formulalar tekshirildi
- [ ] Grafik va bloklar ko'rib chiqildi
- [ ] Adabiyotlar moslashtirildi
`,
    },
];

export const writerTemplatePresets: WriterTemplatePreset[] = [
    {
        id: "minimal",
        title: "Minimal",
        description: "Tez boshlash uchun eng yengil draft rejimi.",
        templateId: "simple-draft",
        addOnIds: [],
    },
    {
        id: "journal-ready",
        title: "Journal Ready",
        description: "Formal research maqola va topshirish uchun kerakli bloklar.",
        templateId: "research-paper",
        addOnIds: ["citation-guide", "theorem-pack", "appendix-pack", "delivery-checklist"],
    },
    {
        id: "teaching-ready",
        title: "Teaching Ready",
        description: "Lecture note, misollar va mashqlar bilan darsga tayyor oqim.",
        templateId: "lecture-note",
        addOnIds: ["example-bank", "citation-guide"],
    },
    {
        id: "lab-ready",
        title: "Lab Ready",
        description: "Laboratoriya eksportlari va observation bloklari bilan tayyor draft.",
        templateId: "lab-report",
        addOnIds: ["lab-observation-pack", "visualization-pack", "delivery-checklist"],
    },
];

export function getWriterTemplate(templateId: string | null | undefined) {
    const normalizedId = templateId ? legacyTemplateIdMap[templateId] ?? templateId : templateId;
    return writerTemplates.find((template) => template.id === normalizedId) ?? null;
}

export function getDefaultWriterTemplate() {
    return getWriterTemplate(DEFAULT_WRITER_TEMPLATE_ID) ?? writerTemplates[0];
}

export function getWriterTemplatePreset(presetId: string | null | undefined) {
    return writerTemplatePresets.find((preset) => preset.id === presetId) ?? null;
}

export function getDefaultWriterTemplatePreset() {
    return getWriterTemplatePreset(DEFAULT_WRITER_PRESET_ID) ?? writerTemplatePresets[0];
}

export function resolveWriterTemplateAddOns(addOnIds: string[] = []) {
    return addOnIds
        .map((addOnId) => writerTemplateAddOns.find((addOn) => addOn.id === addOnId) ?? null)
        .filter((addOn): addOn is WriterTemplateAddOn => Boolean(addOn));
}

export function createDraftFromTemplate(template: WriterTemplate, addOnIds: string[] = []) {
    const resolvedAddOns = resolveWriterTemplateAddOns(addOnIds);
    const addOnContent = resolvedAddOns.map((addOn) => addOn.snippet.trim()).join("\n\n");
    const content = addOnContent
        ? `${template.contentTemplate.trim()}\n\n---\n\n${addOnContent}\n`
        : template.contentTemplate;

    return {
        title: template.titleTemplate,
        abstract: template.abstractTemplate,
        content,
        authors: "",
        keywords: template.keywords,
        status: "draft",
    };
}
