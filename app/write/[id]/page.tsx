"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
    PaperEditorWorkspace,
    type PaperFormData,
} from "@/components/paper-editor-workspace";

export default function EditPaperPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<PaperFormData>({
        title: "",
        abstract: "",
        content: "",
        authors: "",
        keywords: "",
        status: "draft",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function fetchPaper() {
            try {
                const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
                const res = await fetch(`${apiUrl}/api/builder/papers/${id}/`);

                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        title: data.title || "",
                        abstract: data.abstract || "",
                        content: data.content || "",
                        authors: data.authors || "",
                        keywords: data.keywords || "",
                        status: data.status || "draft",
                    });
                } else {
                    router.push("/write");
                }
            } catch (error) {
                console.error("Xatolik:", error);
                router.push("/write");
            } finally {
                setIsLoading(false);
            }
        }

        fetchPaper();
    }, [id, router]);

    async function handleSubmit() {
        setStatus("submitting");

        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
            const res = await fetch(`${apiUrl}/api/builder/papers/${id}/`, {
                method: "PUT",
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

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-muted-foreground">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Muhit tayyorlanmoqda...</p>
            </div>
        );
    }

    return (
        <PaperEditorWorkspace
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            saveState={status}
            errorMessage={errorMessage}
            mode="edit"
            documentId={id}
        />
    );
}
