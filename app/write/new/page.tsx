"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


import {
    PaperEditorWorkspace,
    type PaperFormData,
} from "@/components/paper-editor-workspace";
import { LIVE_WRITER_EXPORT_KEY, readQueuedWriterImport, serializeWriterBridgeBlock } from "@/lib/live-writer-bridge";
import { createDraftFromTemplate, getDefaultWriterTemplate, getWriterTemplate, getWriterTemplatePreset } from "@/lib/writer-templates";


export default function NewPaperPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const importedFromLaboratory = useRef(false);

    const presetId = searchParams.get("preset");
    const templateId = searchParams.get("template");
    const selectedPreset = getWriterTemplatePreset(presetId);
    const addOnIds = (searchParams.get("addons") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const selectedTemplate = getWriterTemplate(templateId || selectedPreset?.templateId) ?? getDefaultWriterTemplate();
    const resolvedAddOnIds = addOnIds.length ? addOnIds : selectedPreset?.addOnIds ?? [];

    const [formData, setFormData] = useState<PaperFormData>(createDraftFromTemplate(selectedTemplate, resolvedAddOnIds));

    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (importedFromLaboratory.current || typeof window === "undefined") {
            return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("source") !== "laboratory") {
            return;
        }

        const laboratoryExport = readQueuedWriterImport();
        if (!laboratoryExport) {
            return;
        }

        importedFromLaboratory.current = true;
        window.localStorage.removeItem(LIVE_WRITER_EXPORT_KEY);
        const timer = window.setTimeout(() => {
            const importedSections = [
                laboratoryExport.block ? serializeWriterBridgeBlock(laboratoryExport.block) : "",
                laboratoryExport.markdown,
            ].filter(Boolean);

            setFormData((current) => ({
                ...current,
                title:
                    current.title === getDefaultWriterTemplate().titleTemplate
                        ? laboratoryExport.title || "Laboratoriya hisoboti asosidagi maqola"
                        : current.title,
                abstract:
                    current.abstract ||
                    laboratoryExport.abstract ||
                    "Ushbu qoralama matematik laboratoriyadan eksport qilingan hisob-kitob va vizual natijalarga tayangan holda shakllantirildi.",
                content: `${importedSections.join("\n\n")}\n\n---\n\n${current.content}`,
                keywords: current.keywords || laboratoryExport.keywords || "mathematics, laboratory",
            }));
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    async function handleSubmit() {
        setStatus("submitting");

        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
            const res = await fetch(`${apiUrl}/api/builder/papers/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus("success");
                setTimeout(() => {
                    router.push("/write");
                }, 900);
            } else {
                const data = await res.json();
                setErrorMessage(data.detail || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
                setStatus("error");
            }
        } catch (error) {
            console.error("Submission error:", error);
            setErrorMessage("Tarmoq xatosi. Server bilan bog'lanishda muammo.");
            setStatus("error");
        }
    }

    return (
        <PaperEditorWorkspace
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            saveState={status}
            errorMessage={errorMessage}
            mode="new"
        />
    );
}
