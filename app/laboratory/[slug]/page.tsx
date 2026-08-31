import { notFound } from "next/navigation";

import { LaboratoryWorkspaceShell } from "@/components/laboratory/workspace-shell";
import { fetchLaboratoryModule } from "@/lib/laboratory";

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

    if (!labModule) notFound();

    return (
        <div className="ax-workspace-root px-3 py-3 sm:px-5 sm:py-4 lg:px-6 xl:px-8">
            <div className="mx-auto max-w-[1880px]">
                <LaboratoryWorkspaceShell module={labModule} />
            </div>
        </div>
    );
}
