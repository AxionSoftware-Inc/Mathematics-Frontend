"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    PaperEditorWorkspace,
    type PaperFormData,
} from "@/components/paper-editor-workspace";
import { LIVE_WRITER_EXPORT_KEY } from "@/lib/live-writer-bridge";

const defaultContent = `# Maqola matnini bu yerga kiritasiz...

Matematik ifodalar uchun LaTeX foydalaning, masalan $E = mc^2$ yoki
$$ \\int_0^\\infty x^2 dx $$

## 2D Grafik
\`\`\`plot2d
{
  "f": "sin(x)*x",
  "domain": [-20, 20]
}
\`\`\`

## 3D Grafik
\`\`\`plot3d
{
  "f": "sin(x)*cos(y)",
  "xDomain": [-5, 5],
  "yDomain": [-5, 5]
}
\`\`\`

## Python Kod bloki
\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.grid(True)
plt.show()
\`\`\`
`;

export default function NewPaperPage() {
    const router = useRouter();
    const importedFromLaboratory = useRef(false);
    const [formData, setFormData] = useState<PaperFormData>({
        title: "Yangi Maqola Sarlavhasi",
        abstract: "",
        content: defaultContent,
        authors: "",
        keywords: "",
        status: "draft",
    });
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

        const laboratoryExport = window.localStorage.getItem(LIVE_WRITER_EXPORT_KEY);
        if (!laboratoryExport) {
            return;
        }

        importedFromLaboratory.current = true;
        window.localStorage.removeItem(LIVE_WRITER_EXPORT_KEY);
        const timer = window.setTimeout(() => {
            setFormData((current) => ({
                ...current,
                title: current.title === "Yangi Maqola Sarlavhasi" ? "Laboratoriya hisoboti asosidagi maqola" : current.title,
                abstract:
                    current.abstract ||
                    "Ushbu qoralama matematik laboratoriyadan eksport qilingan series, limit va Taylor tahliliga tayangan holda shakllantirildi.",
                content: `${laboratoryExport}\n\n---\n\n${current.content}`,
                keywords: current.keywords || "series, limits, taylor, laboratory",
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
