"use client";

import { type LaboratoryBridgeGuide } from "@/components/live-writer-bridge/laboratory-bridge-card";

export function createDefaultBridgeGuides(label: string, subject: string) {
    return {
        copy: {
            badge: `${label} export`,
            title: "Natijani nusxa olish",
            description: `${subject} natijasini markdown ko'rinishida clipboard'ga ko'chiradi.`,
            confirmLabel: "Nusxa olish",
            steps: [
                "Aktiv hisoblash natijasi qisqa hisobotga yig'iladi.",
                "Asosiy metric, xulosa va kerakli preview birga qo'shiladi.",
                "Hosil bo'lgan markdown'ni writer ichidagi xohlagan joyga joylaysiz.",
            ],
            note: "Qo'lda joylashtirish va tez draft tuzish uchun shu oqim eng qulay.",
        },
        send: {
            badge: `${label} writer import`,
            title: "Natijani yangi draftga yuborish",
            description: `${subject} natijasini yangi writer draft sifatida ochadi.`,
            confirmLabel: "Draft ochish",
            steps: [
                "Natija markdown va rich live block ko'rinishida import queue'ga yoziladi.",
                "Yangi writer draft ochilib, natija avtomatik joylanadi.",
                "Kerak bo'lsa keyin uni project ichidagi kerakli file yoki sectionga ko'chirasiz.",
            ],
            note: "Mavjud writer ichidagi aniq target blokka yuborish uchun Live Writer Bridge ishlatiladi.",
        },
    } satisfies Record<"copy" | "send", LaboratoryBridgeGuide>;
}
