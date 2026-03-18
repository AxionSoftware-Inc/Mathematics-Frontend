import { notFound } from "next/navigation";

import { LaboratoryWorkspaceShell } from "@/components/laboratory/workspace-shell";
import { SiteContainer, SiteSection } from "@/components/public-shell";
import { fetchLaboratoryModule, fetchLaboratoryModules } from "@/lib/laboratory";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const labModule = await fetchLaboratoryModule(params.slug);

    return {
        title: labModule ? `${labModule.title} - MathSphere Laboratory` : "Laboratory Module - MathSphere",
    };
}

export default async function LaboratoryModulePage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const [labModule, modules] = await Promise.all([fetchLaboratoryModule(params.slug), fetchLaboratoryModules()]);

    if (!labModule) {
        notFound();
    }

    return (
        <div className="site-shell">
            <SiteSection className="py-4 md:py-6">
                <SiteContainer className="max-w-[1880px] px-3 md:px-5 xl:px-6">
                    <LaboratoryWorkspaceShell module={labModule} modules={modules} />
                </SiteContainer>
            </SiteSection>
        </div>
    );
}
