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
    saveResult: () => void | Promise<unknown>;
    saveState: "idle" | "saving" | "saved" | "error";
    saveError: string | null;
    lastSavedResultTitle: string | null;
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
    saveResult,
    saveState,
    saveError,
    lastSavedResultTitle,
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
            saveResult={saveResult}
            saveState={saveState}
            saveError={saveError}
            lastSavedResultTitle={lastSavedResultTitle}
            sendToWriter={sendToWriter}
            pushLiveResult={pushLiveResult}
            liveTargets={liveTargets}
            selectedLiveTargetId={selectedLiveTargetId}
            setSelectedLiveTargetId={setSelectedLiveTargetId}
            annotationNode={<AnnotationPanel {...annotationPanelProps} />}
        />
    );
}
