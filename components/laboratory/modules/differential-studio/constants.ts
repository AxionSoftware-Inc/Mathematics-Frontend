import type { DifferentialWorkspaceTab } from "./types";
import { DIFFERENTIAL_PRESET_CATALOG, DIFFERENTIAL_WORKFLOW_CATALOG } from "@/components/laboratory/laboratory-template-catalog";

export const exportGuides = {
    copy: {
        badge: "Differential export",
        title: "Hosila natijasini nusxa olish",
        description: "Differential hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Analitik hosila va numerik point evaluation bitta hisobotga yig'iladi.",
            "Function, variable va tangent line ifodasi ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Hosila natijasini writer'ga yuborish",
        description: "Differential hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Differential export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

export const workspaceTabs: Array<{ id: DifferentialWorkspaceTab; label: string; description: string }> = [
    { id: "solve", label: "Solve", description: "Input, action bar, primary result va derivation." },
    { id: "code", label: "Code", description: "Method selector, editable code draft va AI step writer." },
    { id: "visualize", label: "Visualize", description: "Grafik, slope-field, tangent va sensitivity." },
    { id: "compare", label: "Compare", description: "Diagnostics, numeric vs symbolic compare va scenario compare." },
    { id: "report", label: "Report", description: "Report builder, notes va export flow." },
];

export const DIFFERENTIAL_PRESETS = DIFFERENTIAL_PRESET_CATALOG;

export const DIFFERENTIAL_WORKFLOW_TEMPLATES = DIFFERENTIAL_WORKFLOW_CATALOG;
