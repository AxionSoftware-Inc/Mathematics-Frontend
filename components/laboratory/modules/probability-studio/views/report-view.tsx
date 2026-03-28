import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";
import type { ProbabilityStudioState } from "../types";

type LiveTarget = {
    id: string;
    title: string;
};

export function ReportView({
    state,
    copyMarkdownExport,
    sendToWriter,
    pushLiveResult,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
}: {
    state: ProbabilityStudioState;
    copyMarkdownExport: () => void;
    sendToWriter: () => void;
    pushLiveResult: () => void;
    liveTargets: LiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
}) {
    const reportSkeletonMarkdown = `# Probability Report
- mode: ${state.mode}
- dimension: ${state.dimension}
- sample size: ${state.summary.sampleSize ?? "pending"}
- method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}
- risk: ${state.summary.riskSignal ?? "pending"}
- primary diagnostic: ${state.summary.testStatistic ?? state.summary.power ?? state.summary.residualSignal ?? state.summary.posteriorPredictive ?? state.summary.pcaSignal ?? state.summary.acfSignal ?? state.summary.bootstrapSignal ?? "pending"}`;

    const executiveCards = [
        { eyebrow: "Mode", value: state.mode, detail: "Active probability lane", tone: "neutral" as const },
        { eyebrow: "Sample", value: state.summary.sampleSize ?? "pending", detail: "Observed sample scale", tone: "info" as const },
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "client fallback", detail: "Primary report lane", tone: "success" as const },
    ];

    const supportCards = [
        { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Primary caution signal", tone: "warn" as const },
        { eyebrow: "Statistic", value: state.summary.testStatistic ?? state.summary.pValue ?? "pending", detail: "Inference / test output", tone: "info" as const },
        { eyebrow: "Forecast", value: state.summary.forecast ?? state.summary.posteriorPredictive ?? "pending", detail: "Forward-looking signal", tone: "neutral" as const },
        { eyebrow: "Shape", value: state.summary.shape ?? state.summary.distributionFamily ?? "pending", detail: "Distribution / dataset profile", tone: "success" as const },
    ];

    const readinessCards = [
        { eyebrow: "Notes", value: String(state.reportNotes.length), detail: "Prepared report notes", tone: "info" as const },
        { eyebrow: "Steps", value: state.analyticSolution?.exact.steps?.length ? String(state.analyticSolution.exact.steps.length) : String(state.result.steps.length), detail: "Available method trace", tone: "neutral" as const },
        { eyebrow: "Live", value: liveTargets.length ? "Ready" : "Waiting", detail: liveTargets.length ? "Writer target available" : "Open Writer to publish live", tone: liveTargets.length ? "success" as const : "warn" as const },
        { eyebrow: "State", value: state.solveErrorMessage ? "Review" : "Ready", detail: state.solveErrorMessage ?? "Report packet can be exported", tone: state.solveErrorMessage ? "warn" as const : "success" as const },
    ];

    return (
        <LaboratoryReportLayout
            executiveCards={executiveCards}
            supportCards={supportCards}
            readinessCards={readinessCards}
            reportMarkdown={reportSkeletonMarkdown}
            copyMarkdownExport={copyMarkdownExport}
            sendToWriter={sendToWriter}
            pushLiveResult={pushLiveResult}
            liveTargets={liveTargets}
            selectedLiveTargetId={selectedLiveTargetId}
            setSelectedLiveTargetId={setSelectedLiveTargetId}
        />
    );
}
