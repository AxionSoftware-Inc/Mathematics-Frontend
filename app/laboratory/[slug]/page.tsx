import { notFound } from "next/navigation";

import { LaboratoryWorkspaceShell } from "@/components/laboratory/workspace-shell";
import { fetchLaboratoryModule } from "@/lib/laboratory";
import { supportedLaboratorySlugs } from "@/lib/laboratory-catalog";

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
    return supportedLaboratorySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const labModule = await fetchLaboratoryModule(params.slug);

    return {
        title: labModule ? `${labModule.title} - MathSphere Laboratory` : "Laboratory Module - MathSphere",
    };
}

export default async function LaboratoryModulePage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const labModule = await fetchLaboratoryModule(params.slug);

    if (!labModule) {
        notFound();
    }

    return (
        <div className="bg-[#f7f9fc] px-2 py-2 sm:px-3 md:px-4 md:py-3">
            <div className="mx-auto max-w-[1880px]">
                <LaboratoryWorkspaceShell module={labModule} />
            </div>
        </div>
    );
}
