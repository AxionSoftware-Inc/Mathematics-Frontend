import React from "react";

import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";

import { AnnotationPanel } from "../components/annotation-panel";
import { StudioMetricCard } from "../presentation-types";

type LiveTarget = {
    id: string;
    title: string;
};

type ReportViewProps = {
    reportExecutiveCards: StudioMetricCard[];
    reportSupportCards: StudioMetricCard[];
    reportSkeletonMarkdown: string;
    copyMarkdownExport: () => void;
    sendToWriter: () => void;
    reportReadinessCards: StudioMetricCard[];
    annotationPanelProps: React.ComponentProps<typeof AnnotationPanel>;
    liveTargets: LiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    pushLiveResult: () => void;
};

export function ReportView({
    reportExecutiveCards,
    reportSupportCards,
    reportSkeletonMarkdown,
    copyMarkdownExport,
    sendToWriter,
    reportReadinessCards,
    annotationPanelProps,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    pushLiveResult,
}: ReportViewProps) {
    return (
        <LaboratoryReportLayout
            executiveCards={reportExecutiveCards}
            supportCards={reportSupportCards}
            readinessCards={reportReadinessCards}
            reportMarkdown={reportSkeletonMarkdown}
            copyMarkdownExport={copyMarkdownExport}
            sendToWriter={sendToWriter}
            pushLiveResult={pushLiveResult}
            liveTargets={liveTargets}
            selectedLiveTargetId={selectedLiveTargetId}
            setSelectedLiveTargetId={setSelectedLiveTargetId}
            annotationNode={<AnnotationPanel {...annotationPanelProps} />}
        />
    );
}
