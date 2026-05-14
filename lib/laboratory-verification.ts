import { fetchPublic } from "@/lib/api";

export type VerificationCertificate = {
    status: "verified" | "review" | "blocked" | string;
    trust_score: number;
    checks: Array<{
        id: string;
        label: string;
        status: "pass" | "fail" | "review" | string;
        passed?: boolean;
        detail?: string;
        [key: string]: unknown;
    }>;
    warnings: string[];
    recommendations: string[];
};

export async function verifyIntegralCertificate(payload: {
    expression: string;
    lower?: string;
    upper?: string;
    antiderivative_latex?: string;
    result_latex?: string;
    method?: string;
}) {
    const response = await fetchPublic("/api/laboratory/verify/integral/", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.message === "string" ? data.message : `Verification failed with status ${response.status}`);
    }

    const data = (await response.json()) as { certificate?: VerificationCertificate };
    if (!data.certificate) {
        throw new Error("Verification response is missing certificate.");
    }
    return data.certificate;
}
