import { IntegralBlockId, IntegralExperienceLevel, IntegralWorkspaceTab } from "./types";

export const exportGuides = {
    copy: {
        badge: "Integral export",
        title: "Integral natijasini nusxa olish",
        description: "Integral hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Midpoint, trapezoid va Simpson natijalari bitta hisobotga yig'iladi.",
            "Function, interval va segment soni ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Integral natijasini writer'ga yuborish",
        description: "Integral hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Integral export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

export const integralNotebookBlocks: Array<{ id: IntegralBlockId; label: string; description: string }> = [
    { id: "controls", label: "Solver Control", description: "Integral input, domain, grid va solve tugmalari." },
    { id: "visualizer", label: "Visualizer", description: "2D/3D grafik va asosiy result metric'lar." },
    { id: "summary", label: "Result Summary", description: "Yakuniy natija, trust va keyingi action kartalari." },
    { id: "exact", label: "Derivation", description: "Parser, exact result va qadamma-qadam symbolic kartalar." },
    { id: "tables", label: "Tables & Samples", description: "Method compare, sample rows va preview jadvali." },
    { id: "sweep", label: "Sweep", description: "Segment yoki grid sensitivity tahlili." },
    { id: "insights", label: "Diagnostics", description: "Compare, explain va result levels." },
    { id: "report", label: "Report Builder", description: "Writer skeleton va ilmiy summary." },
    { id: "notes", label: "Annotations", description: "Annotation'lar va current anchor." },
    { id: "experiments", label: "Scenarios", description: "Saqlangan scenario'lar." },
    { id: "bridge", label: "Writer Bridge", description: "Copy, send va live push." },
];

export const experienceLevelBlocks: Record<IntegralExperienceLevel, readonly IntegralBlockId[]> = {
    beginner: ["controls", "summary", "visualizer", "exact", "report", "bridge"],
    advanced: ["controls", "visualizer", "summary", "exact", "tables", "sweep", "insights", "report", "bridge"],
    research: integralNotebookBlocks.map((block) => block.id),
};

export const workspaceTabs: Array<{ id: IntegralWorkspaceTab; label: string; description: string }> = [
    { id: "solve", label: "Solve", description: "Input, action bar, primary result va derivation." },
    { id: "visualize", label: "Visualize", description: "Grafik, tables, samples va sweep." },
    { id: "compare", label: "Compare", description: "Diagnostics, explain mode va scenario compare." },
    { id: "report", label: "Report", description: "Report builder, notes va export flow." },
];

export const levelTabs: Record<IntegralExperienceLevel, readonly IntegralWorkspaceTab[]> = {
    beginner: ["solve", "visualize", "report"],
    advanced: ["solve", "visualize", "compare", "report"],
    research: ["solve", "visualize", "compare", "report"],
};

export const integralPresetDescriptions: Record<string, string> = {
    "Studio Walkthrough": "Birinchi kirishda solve, audit, visualizer, compare va report oqimini birga ko'rsatadigan balanslangan nazorat misoli.",
    "Gaussian Bell": "Silliq va xavfsiz benchmark. Exact symbolic natija, method spread va report oqimi uchun mos.",
    "Oscillatory Fresnel Window": "Oscillatory integral. Convergence, spread va sweep analysis qiymatini ochib beradi.",
    "Indefinite Polynomial Primitive": "Aniqmas integral lane uchun sodda symbolic benchmark. Primitive va method trace oqimini ko'rsatadi.",
    "Endpoint Singularity Probe": "Boundary singularity bor improper integral. Pole risk va convergence signalini ko'rsatadi.",
    "Infinite Tail Audit": "Cheksiz bound bilan improper integral. Symbolic limit evaluation va convergence audit uchun mos.",
    "Line Circulation Candidate": "Line integral taxonomy lane uchun parametric path signallari bilan yozilgan research placeholder.",
    "Surface Flux Candidate": "Surface integral taxonomy lane uchun flux/normal signalini ko'rsatadigan placeholder.",
    "Contour Residue Candidate": "Contour integral taxonomy lane uchun complex/residue signalini ko'rsatadigan placeholder.",
    "Wave Interference Surface": "2D interference surface. Profile slices, surface relief va grid sensitivity uchun mo'ljallangan.",
    "Saddle Surface": "Musbat va manfiy regionlar kompensatsiyasi kuchli bo'lgan cancellation benchmark.",
    "Radial Energy Cloud": "3D density audit. Voxel volume, sparse sampling va volumetric trust signalini ko'rsatadi.",
};

export const INTEGRAL_WORKFLOW_TEMPLATES = [
    {
        id: "studio-walkthrough",
        title: "Baseline Verification Workflow",
        description: "Exact path, numerical backup, visualizer va report oqimini bir joyda tekshiradigan standart baseline workflow.",
        presetLabel: "Studio Walkthrough",
        blocks: ["controls", "visualizer", "exact", "tables", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "96", count: "5" },
    },
    {
        id: "convergence-check",
        title: "Oscillation Stability Audit",
        description: "Oscillatory integrallar uchun Simpson, midpoint va trapezoid driftini tizimli audit qiladi.",
        presetLabel: "Oscillatory Fresnel Window",
        blocks: ["controls", "visualizer", "exact", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "10", end: "80", count: "5" },
    },
    {
        id: "indefinite-primitive-review",
        title: "Primitive Extraction Review",
        description: "Aniqmas integral uchun symbolic primitive, parser translation va method trace qatlamini ko'rsatadi.",
        presetLabel: "Indefinite Polynomial Primitive",
        blocks: ["controls", "exact", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "48", count: "4" },
    },
    {
        id: "endpoint-singularity-audit",
        title: "Endpoint Singularity Audit",
        description: "Boundary singularity bo'lgan integral uchun pole risk va convergence signallarini chiqaradi.",
        presetLabel: "Endpoint Singularity Probe",
        blocks: ["controls", "exact", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "64", count: "4" },
    },
    {
        id: "improper-tail-audit",
        title: "Infinite Tail Convergence Audit",
        description: "Cheksiz upper bound bilan improper integral uchun symbolic limit evaluation qatlamini tekshiradi.",
        presetLabel: "Infinite Tail Audit",
        blocks: ["controls", "exact", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "64", count: "4" },
    },
    {
        id: "line-lane-mapping",
        title: "Line Integral Lane Mapping",
        description: "Parametric path yoki circulation yozuvlari kelganda studio qaysi line lane'ni ochishini ko'rsatadi.",
        presetLabel: "Line Circulation Candidate",
        blocks: ["controls", "exact", "insights", "report"] as const,
        sweep: { start: "8", end: "32", count: "4" },
    },
    {
        id: "surface-lane-mapping",
        title: "Surface Integral Lane Mapping",
        description: "Flux va normal signallari kelganda surface taxonomy lane uchun diagnostic guidance beradi.",
        presetLabel: "Surface Flux Candidate",
        blocks: ["controls", "exact", "insights", "report"] as const,
        sweep: { start: "8", end: "32", count: "4" },
    },
    {
        id: "contour-lane-mapping",
        title: "Contour Integral Lane Mapping",
        description: "Complex contour va residue yozuvlari kelganda contour taxonomy lane'ni ko'rsatadi.",
        presetLabel: "Contour Residue Candidate",
        blocks: ["controls", "exact", "insights", "report"] as const,
        sweep: { start: "8", end: "32", count: "4" },
    },
    {
        id: "surface-accumulation-study",
        title: "Surface Response Mapping",
        description: "2D sirtning qaysi regioni integralga ko'proq hissa qo'shayotganini profile va grid audit orqali ko'rsatadi.",
        presetLabel: "Wave Interference Surface",
        blocks: ["controls", "visualizer", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "10", end: "40", count: "4" },
    },
    {
        id: "saddle-balance-review",
        title: "Cancellation Risk Review",
        description: "Cancellation kuchli bo'lgan surface case'da region balance va estimate sezgirligini tekshiradi.",
        presetLabel: "Saddle Surface",
        blocks: ["controls", "visualizer", "sweep", "insights", "report"] as const,
        sweep: { start: "8", end: "32", count: "4" },
    },
    {
        id: "volume-density-audit",
        title: "Volumetric Density Audit",
        description: "3D density cloud bo'yicha voxel, sparse sampling va trust signallarini tekshiradigan volumetric workflow.",
        presetLabel: "Radial Energy Cloud",
        blocks: ["controls", "visualizer", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "6", end: "20", count: "4" },
    },
] as const;

export const INTEGRAL_PRESETS = [
    { label: "Studio Walkthrough", mode: "single", expr: "sin(x) + x^2 / 5", lower: "0", upper: "3.14", segments: "96" },
    { label: "Gaussian Bell", mode: "single", expr: "exp(-x^2)", lower: "-3", upper: "3", segments: "96" },
    { label: "Oscillatory Fresnel Window", mode: "single", expr: "sin(x^2)", lower: "0", upper: "6", segments: "140" },
    { label: "Indefinite Polynomial Primitive", mode: "single", expr: "3*x^2 + 2*x + 1", lower: "", upper: "", segments: "72" },
    { label: "Endpoint Singularity Probe", mode: "single", expr: "1/sqrt(x)", lower: "0", upper: "1", segments: "120" },
    { label: "Infinite Tail Audit", mode: "single", expr: "exp(-x)", lower: "0", upper: "inf", segments: "120" },
    { label: "Line Circulation Candidate", mode: "single", expr: "x*dr + y*ds along curve C", lower: "", upper: "", segments: "48" },
    { label: "Surface Flux Candidate", mode: "single", expr: "F . n dS over surface S", lower: "", upper: "", segments: "48" },
    { label: "Contour Residue Candidate", mode: "single", expr: "f(z) dz on contour C with residue", lower: "", upper: "", segments: "48" },
    { label: "Wave Interference Surface", mode: "double", expr: "sin(x) * cos(y) + 0.25 * x", x: "[-6.28, 6.28]", y: "[-6.28, 6.28]", nx: "34", ny: "34" },
    { label: "Saddle Surface", mode: "double", expr: "x^2 - y^2", x: "[-3, 3]", y: "[-3, 3]", nx: "30", ny: "30" },
    { label: "Radial Energy Cloud", mode: "triple", expr: "exp(-(x^2 + y^2 + z^2)/3)", x: "[-2, 2]", y: "[-2, 2]", z: "[-2, 2]", nx: "12", ny: "12", nz: "12" },
] as const;
