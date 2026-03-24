import React from "react";
import {
    Activity,
    Trash2,
    Zap
} from "lucide-react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";

// Shared Services
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

import { useIntegralStudio } from "./integral-studio/use-integral-studio";
import { 
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary, 
    TripleIntegralSummary
} from "./integral-studio/types";
import {
    exportGuides, 
    workspaceTabs,
    integralPresetDescriptions,
    INTEGRAL_PRESETS,
    INTEGRAL_WORKFLOW_TEMPLATES
} from "./integral-studio/constants";
import { 
    buildExactSolutionMarkdown,
    buildExactMethodMarkdown,
    buildNumericalPromptMarkdown, 
    buildIntegralMarkdown, 
    buildIntegralLivePayload, 
} from "./integral-studio/utils";

// Local Components
import { SolverControl } from "./integral-studio/components/solver-control";
import { VisualizerDeck } from "./integral-studio/components/visualizer-deck";
import { TrustPanel } from "./integral-studio/components/trust-panel";
import { AnnotationPanel } from "./integral-studio/components/annotation-panel";
import { ScenarioPanel } from "./integral-studio/components/scenario-panel";
import { StudioHeaderBar } from "./integral-studio/components/studio-header-bar";
import { StudioStatusBar } from "./integral-studio/components/studio-status-bar";
import { CompareView } from "./integral-studio/views/compare-view";
import { ReportView } from "./integral-studio/views/report-view";
import { SolveView } from "./integral-studio/views/solve-view";
import { VisualizeView } from "./integral-studio/views/visualize-view";

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useIntegralStudio(module);
    const {
        mode,
        experienceLevel, setExperienceLevel,
        activeTab, setActiveTab,
        expression,
        lower,
        upper,
        xMin, xMax,
        yMin, yMax,
        zMin, zMax,
        sweepStart, setSweepStart,
        sweepEnd, setSweepEnd,
        annotationTitle, setAnnotationTitle,
        annotationNote, setAnnotationNote,
        experimentLabel, setExperimentLabel,
        activeTemplateId,
        annotations, setAnnotations,
        savedExperiments, setSavedExperiments,
        setExportState,
        guideMode, setGuideMode,
        solvePhase,
        solveErrorMessage,
        analyticSolution,
        normalizedSegments,
        normalizedXResolution,
        normalizedYResolution,
        normalizedZResolution,
        error,
        summary,
        inputValidationSignals,
        blockingValidationCount,
        classification,
        singleDiagnostics,
        doubleDiagnostics,
        tripleDiagnostics,
        sweepSeries,
        previewVisualization,
        isResultStale,
        availableTabs,
        liveBridge
    } = state;

    const {
        applyPreset,
        applyWorkflowTemplate,
        requestAnalyticSolve,
        confirmNumericalSolve,
        addAnnotationFromCurrentResult,
        saveCurrentExperiment,
        resetWorkspace,
        loadSavedExperiment,
    } = actions;
    const [templatesOpen, setTemplatesOpen] = React.useState(false);

    const solverWarning = Boolean(error || solveErrorMessage);
    const warningSignals = React.useMemo(() => {
        const signals: any[] = [];
        if (solverWarning) {
            signals.push({ tone: "warn", label: "Solver Alert", text: error || solveErrorMessage });
        }
        if (analyticSolution?.diagnostics?.convergence === "divergent") {
            signals.push({ tone: "warn", label: "Divergence", text: analyticSolution.diagnostics.convergence_detail });
        }
        if (analyticSolution?.diagnostics?.convergence === "unresolved") {
            signals.push({ tone: "warn", label: "Convergence", text: analyticSolution.diagnostics.convergence_detail });
        }
        if (analyticSolution?.diagnostics?.hazards?.length) {
            signals.push({ tone: "warn", label: "Hazards", text: analyticSolution.diagnostics.hazards[0] });
        }
        if (mode === "single" && summary) {
            const spread = singleDiagnostics?.relativeSpread || 0;
            if (spread > 0.08) signals.push({ tone: "warn", label: "Stability", text: "Method spread yuqori, segment sonini oshirish kerak." });
        }
        return signals;
    }, [analyticSolution?.diagnostics?.convergence, analyticSolution?.diagnostics?.convergence_detail, analyticSolution?.diagnostics?.hazards, error, mode, singleDiagnostics?.relativeSpread, solveErrorMessage, solverWarning, summary]);

    const visibleSignals = React.useMemo(
        () => [...inputValidationSignals, ...warningSignals],
        [inputValidationSignals, warningSignals],
    );

    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(summary && !solverWarning),
        sourceLabel: "Integral Studio",
        liveTargets: liveBridge.liveTargets,
        selectedLiveTargetId: liveBridge.selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () =>
            buildIntegralMarkdown({
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        buildBlock: (targetId: string) =>
            buildIntegralLivePayload({
                targetId,
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        getDraftMeta: () => ({
            title: "Integral Analysis",
            abstract: "Exported from laboratory.",
            keywords: `${mode},integral`,
        }),
    });

    const solverStatusText =
        solvePhase === "analytic-loading"
            ? "Analitik solve tekshirilmoqda"
            : solvePhase === "exact-ready"
              ? "Analitik yechim tayyor"
              : solvePhase === "needs-numerical"
                ? "Numerik tasdiq kutilmoqda"
                : summary
                  ? "Numerik estimate tayyor"
                  : solvePhase === "error"
                    ? "Solver warning"
                    : "Solve kutilmoqda";

    const resultConsoleData = React.useMemo(() => {
        const warningCount = warningSignals.length;
        if (analyticSolution?.status === "exact") {
            return {
                source: "exact",
                sourceLabel: "Exact Result",
                sourceClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                headline: analyticSolution.exact.numeric_approximation || analyticSolution.exact.evaluated_latex || "Exact result",
                subline: analyticSolution.exact.method_label || "Symbolic Reduction",
                latex: analyticSolution.exact.evaluated_latex ? `$$${analyticSolution.exact.evaluated_latex}$$` : null,
                confidenceLabel: "High trust",
                confidenceDetail: "Symbolic solver closed-form natijani topdi.",
                confidenceClassName: "text-emerald-700 dark:text-emerald-300",
                nextAction: warningCount > 0 ? "Compare tabida signal va sweep'ni ko'rib chiqing." : "Xohlasangiz numerik compare yoki report export qiling.",
            };
        }
        if (summary && mode === "single") {
            const relativeSpread = singleDiagnostics?.relativeSpread || 0;
            return {
                source: "numerical",
                sourceLabel: "Numerical Result",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).simpson, 6),
                subline: "Simpson estimate",
                latex: null,
                confidenceLabel: relativeSpread < 0.02 ? "High trust" : relativeSpread < 0.06 ? "Medium trust" : "Cautious",
                confidenceDetail: relativeSpread < 0.02 ? "Metodlar orasidagi farq juda kichik." : relativeSpread < 0.06 ? "Estimate ishlatish mumkin, lekin compare foydali." : "Method spread sezilarli, segmentni oshirish kerak.",
                confidenceClassName: relativeSpread < 0.02 ? "text-emerald-700 dark:text-emerald-300" : relativeSpread < 0.06 ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300",
                nextAction: warningCount > 0 ? "Sweep va compare section orqali barqarorlikni tekshiring." : "Natijani writer yoki note oqimiga olib o'tish mumkin.",
            };
        }
        if (summary && mode === "double") {
            return {
                source: "numerical",
                sourceLabel: "Surface Estimate",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as DoubleIntegralSummary).value, 6),
                subline: `${normalizedXResolution} x ${normalizedYResolution} grid`,
                latex: null,
                confidenceLabel: warningCount > 1 ? "Medium trust" : "Stable grid",
                confidenceDetail: warningCount > 1 ? "Grid va domain signallarini qayta ko'rish tavsiya etiladi." : "Surface grid bo'yicha estimate tayyor.",
                confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
                nextAction: "Visualizer va tables section orqali peak hamda profile'larni tekshiring.",
            };
        }
        if (summary && mode === "triple") {
            return {
                source: "numerical",
                sourceLabel: "Volume Estimate",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as TripleIntegralSummary).value, 6),
                subline: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution} grid`,
                latex: null,
                confidenceLabel: warningCount > 1 ? "Medium trust" : "Research preview",
                confidenceDetail: warningCount > 1 ? "Volumetric grid'ni kuchaytirib qayta tekshirish kerak." : "Hozirgi voxel grid bo'yicha estimate tayyor.",
                confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
                nextAction: "Density profile va report skeleton bilan natijani hujjatlashtiring.",
            };
        }
        return {
            source: "idle",
            sourceLabel: "Awaiting Solve",
            sourceClassName: "border-border/60 bg-background/70 text-muted-foreground",
            headline: "Natija hali yo'q",
            subline: solverStatusText,
            latex: null,
            confidenceLabel: "No confidence yet",
            confidenceDetail: "Formula va domain tayyor bo'lgach solve ishga tushadi.",
            confidenceClassName: "text-muted-foreground",
            nextAction: "Masalani tekshirib, analytic solve yoki numerik tayyorlashni bosing.",
        };
    }, [analyticSolution, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, solvePhase, solverStatusText, summary, warningSignals.length]);

    const workflowReadinessCards = React.useMemo(() => ([
        { eyebrow: "Solve", value: solverStatusText, detail: analyticSolution?.status === "exact" ? "Exact solver javob berdi." : summary ? "Numerik result tayyor." : "Solve hali kutilyapti.", tone: (analyticSolution?.status === "exact" || summary ? "success" : solvePhase === "error" ? "warn" : "info") as any },
        { eyebrow: "Validation", value: blockingValidationCount > 0 ? `${blockingValidationCount} blocker` : "Clean", detail: blockingValidationCount > 0 ? "Inputda to'g'rilanishi kerak bo'lgan maydonlar bor." : "Input oqimi hozir yaroqli.", tone: (blockingValidationCount > 0 ? "warn" : "success") as any },
        { eyebrow: "Visuals", value: summary ? "Ready" : "Waiting", detail: summary ? "Grafik va sample data tayyor." : "Vizual qatlam solve natijasini kutmoqda.", tone: (summary ? "success" : "neutral") as any },
        { eyebrow: "Export", value: summary && !solverWarning ? "Ready" : "Blocked", detail: summary && !solverWarning ? "Report va writer bridge ishlaydi." : "Toza natija chiqmaguncha export bloklangan.", tone: (summary && !solverWarning ? "success" : "warn") as any },
    ]), [analyticSolution?.status, blockingValidationCount, solvePhase, solverStatusText, solverWarning, summary]);

    const solveOverviewCards = React.useMemo(() => {
        const primaryValue = resultConsoleData.headline;
        const cards = [
            { eyebrow: "Result", value: primaryValue, detail: resultConsoleData.subline, tone: (resultConsoleData.source === "idle" ? "neutral" : resultConsoleData.source === "exact" ? "success" : "info") as any },
            { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: resultConsoleData.nextAction, tone: (resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "neutral") as any },
            { eyebrow: "Confidence", value: resultConsoleData.confidenceLabel, detail: resultConsoleData.confidenceDetail, tone: (resultConsoleData.confidenceLabel === "High trust" || resultConsoleData.confidenceLabel === "Stable grid" ? "success" : resultConsoleData.confidenceLabel === "No confidence yet" ? "neutral" : "warn") as any },
        ];

        if (mode === "single" && summary) {
            cards.push({
                eyebrow: "Spread",
                value: LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                detail: singleDiagnostics?.stability || "Method spread",
                tone: ((singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn") as any,
            });
        } else if (mode === "double" && summary) {
            cards.push({
                eyebrow: "Grid",
                value: `${normalizedXResolution} x ${normalizedYResolution}`,
                detail: `Peak ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)}`,
                tone: "info" as any,
            });
        } else if (mode === "triple" && summary) {
            cards.push({
                eyebrow: "Voxel",
                value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                detail: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution} grid`,
                tone: "info" as any,
            });
        }

        return cards;
    }, [doubleDiagnostics?.peak, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, resultConsoleData, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.voxelVolume]);

    const analyticStatusCard = React.useMemo(() => {
        if (classification.support !== "supported") {
            return {
                eyebrow: "Analytic Status",
                title: classification.label,
                body: classification.summary,
                badge: classification.support === "partial" ? "Partial" : "Unsupported",
                toneClass:
                    classification.support === "partial"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            };
        }

        if (analyticSolution?.status === "exact") {
            return {
                eyebrow: "Analytic Status",
                title: analyticSolution.exact.method_label || "Exact solution ready",
                body: analyticSolution.exact.method_summary || "Symbolic solver integral uchun yopiq shakldagi javob topdi.",
                badge: "Exact",
                toneClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            };
        }

        return {
            eyebrow: "Analytic Status",
            title: solvePhase === "analytic-loading" ? "Analytic solve running" : solvePhase === "needs-numerical" || summary ? "Numerical path active" : "Waiting for solve",
            body: buildNumericalPromptMarkdown(mode, analyticSolution),
            badge: "Guidance",
            toneClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        };
    }, [analyticSolution, classification, mode, solvePhase, summary]);

    const fallbackExactSteps = React.useMemo(() => {
        if (analyticSolution?.status !== "exact") {
            return [];
        }

        const derivedSteps = [];
        if (analyticSolution.exact.antiderivative_latex) {
            derivedSteps.push({
                title: "Antiderivative",
                summary: "Symbolic solver antiderivative topdi.",
                latex: analyticSolution.exact.antiderivative_latex,
                tone: "info" as const,
            });
        }
        if (analyticSolution.exact.definite_integral_latex) {
            derivedSteps.push({
                title: "Boundary substitution",
                summary: "Chegaralar qo'yilib definite integral ifodasi hosil qilindi.",
                latex: analyticSolution.exact.definite_integral_latex,
                tone: "success" as const,
            });
        }
        if (analyticSolution.exact.evaluated_latex) {
            derivedSteps.push({
                title: "Final evaluation",
                summary: analyticSolution.exact.numeric_approximation
                    ? `Yakuniy qiymat va yaqinlashgan sonli ko'rinish: ${analyticSolution.exact.numeric_approximation}`
                    : "Yakuniy exact natija olindi.",
                latex: analyticSolution.exact.evaluated_latex,
                tone: "success" as const,
            });
        }
        return derivedSteps;
    }, [analyticSolution]);

    const visibleExactSteps = analyticSolution?.exact.steps?.length ? analyticSolution.exact.steps : fallbackExactSteps;

    const renderedProblemContent = React.useMemo(() => {
        const texExpression = LaboratoryFormattingService.toTexExpression(expression);
        if (mode === "single") {
            if (classification.kind === "indefinite_single") {
                return `$$I = \\int (${texExpression}) \\, dx$$`;
            }
            return `$$I = \\int_{${lower}}^{${upper}} (${texExpression}) \\, dx$$`;
        }
        if (mode === "double") {
            return `$$I = \\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} (${texExpression}) \\, dy \\, dx$$`;
        }
        return `$$I = \\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} \\int_{${zMin}}^{${zMax}} (${texExpression}) \\, dz \\, dy \\, dx$$`;
    }, [classification.kind, expression, lower, mode, upper, xMax, xMin, yMax, yMin, zMax, zMin]);
    const stalePanelClassName = isResultStale ? "opacity-45 grayscale-[0.35] transition-all" : "";
    const staleOverlay = isResultStale ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/55 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-accent/30 bg-background/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-accent shadow-lg">
                Natija kutilmoqda
            </div>
        </div>
    ) : null;

    const reportSupportCards = React.useMemo(() => ([
        { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: "Report skeleton qaysi natija qatlamidan oziqlanayotganini ko'rsatadi.", tone: (resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "warn") as any },
        { eyebrow: "Annotations", value: `${annotations.length}`, detail: annotations.length ? "Current result uchun note'lar mavjud." : "Reportga qo'shish uchun hali note yozilmagan.", tone: (annotations.length ? "info" : "neutral") as any },
        { eyebrow: "Scenarios", value: `${savedExperiments.length}`, detail: savedExperiments.length ? "Saved scenario'lar report comparison uchun tayyor." : "Scenario library hali bo'sh.", tone: (savedExperiments.length ? "info" : "neutral") as any },
        { eyebrow: "Bridge", value: summary && !solverWarning ? "Ready" : "Blocked", detail: summary && !solverWarning ? "Copy, send va live push ishlatish mumkin." : "Writer bridge solve tozalanmaguncha bloklangan.", tone: (summary && !solverWarning ? "success" : "warn") as any },
    ]), [annotations.length, resultConsoleData.source, resultConsoleData.sourceLabel, savedExperiments.length, solverWarning, summary]);

    const assumptionsMarkdown = React.useMemo(() => {
        const assumptions: string[] = [];
        assumptions.push(`- Coordinate system: **${state.coordinates}**.`);
        if (mode === "single") {
            assumptions.push(`- Bound ordering enforced: **${lower} < ${upper}**.`);
            assumptions.push("- Variable support shu rejimda faqat integralning faol o'zgaruvchilariga bog'langan.");
        } else if (mode === "double") {
            assumptions.push(`- Domain box: **x in [${xMin}, ${xMax}]**, **y in [${yMin}, ${yMax}]**.`);
            assumptions.push("- 2D integral midpoint grid orqali baholanadi; singular yoki undefined nuqtalar sample sifatida chiqarib tashlanadi.");
        } else {
            assumptions.push(`- Domain box: **x in [${xMin}, ${xMax}]**, **y in [${yMin}, ${yMax}]**, **z in [${zMin}, ${zMax}]**.`);
            assumptions.push("- 3D estimate sparse voxel sampling bilan quriladi; coordinate jacobian avtomatik qo'llanadi.");
        }

        if (analyticSolution?.diagnostics?.domain_constraints?.length) {
            analyticSolution.diagnostics.domain_constraints.forEach((constraint) => assumptions.push(`- ${constraint}`));
        } else {
            if (expression.includes("log(") || expression.includes("ln(")) {
                assumptions.push("- Logarifmik argumentlar musbat bo'lishi kerak.");
            }
            if (expression.includes("sqrt(")) {
                assumptions.push("- Kvadrat ildiz ostidagi ifoda manfiy bo'lmasligi kerak.");
            }
            if (expression.includes("/")) {
                assumptions.push("- Maxraj nolga teng bo'ladigan nuqtalar domain ichida bo'lmasligi kerak.");
            }
        }
        if (analyticSolution?.diagnostics?.hazards?.length) {
            analyticSolution.diagnostics.hazards.forEach((hazard) => assumptions.push(`- Hazard: ${hazard}`));
        }
        if (analyticSolution?.parser.notes.length) {
            assumptions.push(`- Parser normalization notes: ${analyticSolution.parser.notes.join(" ")}`);
        }

        return assumptions.join("\n");
    }, [analyticSolution?.diagnostics?.domain_constraints, analyticSolution?.diagnostics?.hazards, analyticSolution?.parser.notes, expression, lower, mode, state.coordinates, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodAuditMarkdown = React.useMemo(() => {
        if (mode === "single") {
            return [
                analyticSolution?.status === "exact"
                    ? `- Primary path: **${analyticSolution.exact.method_label || "Exact symbolic"}**.`
                    : "- Primary path: **Simpson** estimate.",
                analyticSolution?.diagnostics?.convergence && analyticSolution.diagnostics.convergence !== "not_applicable"
                    ? `- Convergence state: **${analyticSolution.diagnostics.convergence}**. ${analyticSolution.diagnostics.convergence_detail}`
                    : "- Convergence audit bu lane uchun markaziy signal emas.",
                "- Reference methods: midpoint va trapezoid parallel ko'riladi.",
                `- Method spread: **${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6)}**.`,
                `- Stability label: **${singleDiagnostics?.stability || "Pending"}**.`,
                analyticSolution?.status === "exact"
                    ? "- Exact symbolic result numeric estimate bilan cross-check qilinadi."
                    : "- Closed-form topilmasa numerical confirmation oqimi ishlaydi.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
                "- Primary path: **2D midpoint grid integration**.",
                `- Active grid: **${normalizedXResolution} x ${normalizedYResolution}**.`,
                `- Surface peak: **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 6)}**.`,
                `- Surface mean: **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 6)}**.`,
                "- Grid sweep compare tabida estimate driftni audit qiladi.",
            ].join("\n");
        }

        return [
            "- Primary path: **3D voxel midpoint integration**.",
            `- Active grid: **${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}**.`,
            `- Peak density: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 6)}**.`,
            `- Mean density: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.mean, 6)}**.`,
            `- Voxel volume: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6)}**.`,
        ].join("\n");
    }, [analyticSolution, doubleDiagnostics?.mean, doubleDiagnostics?.peak, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.spread, singleDiagnostics?.stability, tripleDiagnostics?.mean, tripleDiagnostics?.peak, tripleDiagnostics?.voxelVolume]);

    const assumptionCards = React.useMemo(() => {
        const cards: Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }> = [
            {
                eyebrow: "Coordinates",
                value: state.coordinates,
                detail:
                    mode === "single"
                        ? `${lower} < x < ${upper}`
                        : mode === "double"
                          ? `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}]`
                          : `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}], z:[${zMin}, ${zMax}]`,
                tone: "info" as const,
            },
        ];

        if (classification.kind === "improper_infinite_bounds") {
            cards.push({
                eyebrow: "Convergence",
                value: analyticSolution?.diagnostics?.convergence || (analyticSolution?.status === "exact" ? "limit-resolved" : "needs review"),
                detail: analyticSolution?.diagnostics?.convergence_detail || (analyticSolution?.status === "exact"
                    ? "Cheksiz bound symbolic limit bilan baholandi."
                    : "Improper integral uchun convergence audit talab qilinadi."),
                tone: analyticSolution?.diagnostics?.convergence === "convergent" || analyticSolution?.status === "exact" ? "success" : "warn",
            });
        }

        if (classification.kind === "improper_endpoint_singularity") {
            cards.push({
                eyebrow: "Pole risk",
                value: analyticSolution?.diagnostics?.singularity || (analyticSolution?.status === "exact" ? "endpoint-resolved" : "endpoint singularity"),
                detail: analyticSolution?.diagnostics?.hazards?.[0] || (analyticSolution?.status === "exact"
                    ? "Boundary singularity symbolic lane orqali tekshirildi."
                    : "Boundary yaqinida singularity bor, convergence signalini tekshirish kerak."),
                tone: analyticSolution?.status === "exact" ? "success" : "warn",
            });
        }

        if (analyticSolution?.diagnostics?.domain_constraints?.length) {
            analyticSolution.diagnostics.domain_constraints.slice(0, 2).forEach((constraint, index) => {
                cards.push({
                    eyebrow: index === 0 ? "Domain rule" : "Constraint",
                    value: constraint.split(".")[0],
                    detail: constraint,
                    tone: "warn" as const,
                });
            });
        } else {
            if (expression.includes("log(") || expression.includes("ln(")) {
                cards.push({ eyebrow: "Log domain", value: "positive", detail: "Log argument musbat bo'lishi kerak.", tone: "warn" as const });
            }
            if (expression.includes("sqrt(")) {
                cards.push({ eyebrow: "Root domain", value: "nonnegative", detail: "Sqrt ichidagi ifoda manfiy bo'lmasligi kerak.", tone: "warn" as const });
            }
            if (expression.includes("/")) {
                cards.push({ eyebrow: "Denominator", value: "nonzero", detail: "Maxraj nol bo'ladigan nuqtalar domain ichida bo'lmasligi kerak.", tone: "warn" as const });
            }
        }
        if (analyticSolution?.parser.notes.length) {
            cards.push({
                eyebrow: "Parser",
                value: `${analyticSolution.parser.notes.length} notes`,
                detail: analyticSolution.parser.notes[0],
                tone: "neutral" as const,
            });
        }

        return cards.slice(0, 4);
    }, [analyticSolution?.diagnostics, analyticSolution?.parser.notes, analyticSolution?.status, classification.kind, expression, lower, mode, state.coordinates, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodAuditCards = React.useMemo(() => {
        const spreadTone: "success" | "warn" = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";
        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary | null;
            return [
                {
                    eyebrow: "Primary",
                    value: analyticSolution?.status === "exact" ? analyticSolution.exact.method_label || "Exact" : classification.kind === "improper_endpoint_singularity" ? "Improper audit" : "Simpson composite",
                    detail: analyticSolution?.status === "exact"
                        ? "Backend exact solver verified the result."
                        : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                          ? "Improper integral symbolic audit lane active."
                          : "Frontend numerical estimate is currently leading.",
                    tone: analyticSolution?.status === "exact" ? ("success" as const) : ("info" as const),
                },
                {
                    eyebrow: "Cross-check",
                    value: classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity" ? "Convergence lane" : "Midpoint + Trap",
                    detail:
                        classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? analyticSolution?.message || "Improper integral convergence signalini ko'rsatadi."
                            : `${singleSummary?.samples.length || 0} plotted samples, ${singleSummary?.segmentsUsed || normalizedSegments} active segments.`,
                    tone: "neutral" as const,
                },
                {
                    eyebrow: classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity" ? "Status" : "Spread",
                    value:
                        classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? analyticSolution?.status === "exact"
                                ? "convergent"
                                : "watch"
                            : LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                    detail:
                        classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? analyticSolution?.status === "exact"
                                ? (analyticSolution?.diagnostics?.convergence_detail || "Symbolic limit evaluation completed.")
                                : (analyticSolution?.diagnostics?.convergence_detail || "Closed-form convergence hali tasdiqlanmagan.")
                            : singleDiagnostics?.stability || "Pending",
                    tone:
                        classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? (analyticSolution?.status === "exact" ? "success" : "warn")
                            : spreadTone,
                },
            ];
        }

        if (mode === "double") {
            return [
                { eyebrow: "Primary", value: "Midpoint grid", detail: "2D numerical surface integration is active.", tone: "info" as const },
                { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution}`, detail: `${doubleDiagnostics?.sampleCount || 0} accepted surface samples.`, tone: "neutral" as const },
                { eyebrow: "Peak / Mean", value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)} / ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`, detail: "Measured directly from computed surface samples.", tone: "success" as const },
            ];
        }

        return [
            { eyebrow: "Primary", value: "Voxel midpoint", detail: "3D volumetric numerical integration is active.", tone: "info" as const },
            { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`, detail: `${tripleDiagnostics?.sampleCount || 0} accepted volume samples.`, tone: "neutral" as const },
            { eyebrow: "Voxel", value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6), detail: "Measured cell volume used by the estimate.", tone: "success" as const },
        ];
    }, [analyticSolution, classification.kind, doubleDiagnostics?.mean, doubleDiagnostics?.peak, doubleDiagnostics?.sampleCount, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.sampleCount, tripleDiagnostics?.voxelVolume]);

    const visualizeOverviewCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const staleTone: "warn" | "success" | "neutral" = isResultStale ? "warn" : summary ? "success" : "neutral";
        const summaryTone: "success" | "warn" = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";
        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary | null;
            return [
                {
                    eyebrow: "Render source",
                    value: isResultStale ? "Live preview" : analyticSolution?.status === "exact" ? "Exact + numeric" : summary ? "Numeric trace" : "Pending",
                    detail: isResultStale ? "Plot current inputdan real-time qurildi." : "Visualizer latest solved snapshot bilan sinxron.",
                    tone: staleTone,
                },
                {
                    eyebrow: "Interval",
                    value: `[${lower}, ${upper}]`,
                    detail: `${singleSummary?.samples.length || 0} chart samples rendered.`,
                    tone: "info" as const,
                },
                {
                    eyebrow: "Quadrature",
                    value: `${singleSummary?.segmentsUsed || normalizedSegments} seg`,
                    detail: singleDiagnostics?.stability || "Awaiting stable estimate",
                    tone: summaryTone,
                },
            ];
        }

        if (mode === "double") {
            const renderTone: "success" | "neutral" = summary ? "success" : "neutral";
            return [
                {
                    eyebrow: "Render source",
                    value: summary ? "Surface field" : "Preview",
                    detail: `${doubleDiagnostics?.sampleCount || 0} accepted samples.`,
                    tone: renderTone,
                },
                {
                    eyebrow: "Domain",
                    value: `${normalizedXResolution} x ${normalizedYResolution}`,
                    detail: `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}]`,
                    tone: "info" as const,
                },
                {
                    eyebrow: "Amplitude",
                    value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)}`,
                    detail: `Mean ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`,
                    tone: "success" as const,
                },
            ];
        }

        return [
            {
                eyebrow: "Render source",
                value: summary ? "Volume field" : "Preview",
                detail: `${tripleDiagnostics?.sampleCount || 0} accepted samples.`,
                tone: summary ? "success" : "neutral",
            },
            {
                eyebrow: "Domain",
                value: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`,
                detail: `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}], z:[${zMin}, ${zMax}]`,
                tone: "info" as const,
            },
            {
                eyebrow: "Voxel",
                value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                detail: `Peak ${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 4)}`,
                tone: "success" as const,
            },
        ];
    }, [analyticSolution?.status, doubleDiagnostics?.mean, doubleDiagnostics?.peak, doubleDiagnostics?.sampleCount, isResultStale, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.relativeSpread, singleDiagnostics?.stability, summary, tripleDiagnostics?.peak, tripleDiagnostics?.sampleCount, tripleDiagnostics?.voxelVolume, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodTableRows = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") {
            const ss = summary as SingleIntegralSummary;
            return [
                ["Simpson", LaboratoryFormattingService.formatMetric(ss.simpson, 8), singleDiagnostics?.stability || "--"],
                ["Midpoint", LaboratoryFormattingService.formatMetric(ss.midpoint, 8), "Reference"],
                ["Trapezoid", LaboratoryFormattingService.formatMetric(ss.trapezoid, 8), "Reference"],
            ];
        }
        if (mode === "double") {
            const ds = summary as DoubleIntegralSummary;
            return [
                ["Integral", LaboratoryFormattingService.formatMetric(ds.value, 8), "Surface estimate"],
                ["Grid cells", String(doubleDiagnostics?.gridCells || "--"), `${normalizedXResolution} x ${normalizedYResolution}`],
                ["Peak", LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 8), "Surface max"],
                ["Mean", LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 8), "Average height"],
            ];
        }
        const ts = summary as TripleIntegralSummary;
        return [
            ["Integral", LaboratoryFormattingService.formatMetric(ts.value, 8), "Volume estimate"],
            ["Grid cells", String(tripleDiagnostics?.gridCells || "--"), `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`],
            ["Peak", LaboratoryFormattingService.formatMetric(ts.samples.reduce((max, s) => Math.max(max, s.value), 0), 8), "Density max"],
            ["Voxel", LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 8), "Cell volume"],
        ];
    }, [doubleDiagnostics, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, tripleDiagnostics]);

    const sampleTableRows = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") return (summary as SingleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 6)]);
        if (mode === "double") return (summary as DoubleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 6)]);
        return (summary as TripleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 4), LaboratoryFormattingService.formatMetric(p.value, 6)]);
    }, [mode, summary]);

    const sweepTableRows = React.useMemo(() => {
        if (!sweepSeries) return [];
        return sweepSeries.summary.slice(0, 6).map((entry) =>
            "simpson" in entry
                ? [String(entry.x), LaboratoryFormattingService.formatMetric(entry.simpson, 8), LaboratoryFormattingService.formatMetric(entry.midpoint, 8), LaboratoryFormattingService.formatMetric(entry.trapezoid, 8)]
                : [String(entry.x), LaboratoryFormattingService.formatMetric(entry.estimate, 8), String(entry.sampleCount), "zGrid" in entry ? String(entry.zGrid) : "--"]
        );
    }, [sweepSeries]);

    const resultLevelCards = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") {
            const singleValue = (summary as SingleIntegralSummary).simpson;
            return [
                { label: "Fast", summary: `Integral qiymati taxminan **${LaboratoryFormattingService.formatMetric(singleValue, 8)}** ga teng.`, tone: "text-sky-600" },
                { label: "Technical", summary: `Simpson, midpoint va trapezoid orasidagi spread **${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6)}** bo‘ldi.`, tone: "text-emerald-600" },
                { label: "Research", summary: "Single integral uchun convergence va method drift audit qilindi.", tone: "text-amber-600" },
            ];
        }
        if (mode === "double") {
            const ds = summary as DoubleIntegralSummary;
            return [
                { label: "Fast", summary: `2D integral estimate **${LaboratoryFormattingService.formatMetric(ds.value, 8)}** bo‘ldi.`, tone: "text-sky-600" },
                { label: "Technical", summary: `Grid hajmi **${doubleDiagnostics?.gridCells || 0}** va peak height **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 6)}** bilan tekshirildi.`, tone: "text-emerald-600" },
                { label: "Research", summary: "Surface profile va grid sweep orqali reliefning qaysi qismi integralga ko‘proq ta’sir qilishi ko‘riladi.", tone: "text-amber-600" },
            ];
        }
        const ts = summary as TripleIntegralSummary;
        return [
            { label: "Fast", summary: `3D integral estimate **${LaboratoryFormattingService.formatMetric(ts.value, 8)}** bo‘ldi.`, tone: "text-sky-600" },
            { label: "Technical", summary: `Voxel count **${tripleDiagnostics?.gridCells || 0}** va voxel volume **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6)}** bilan audit qilindi.`, tone: "text-emerald-600" },
            { label: "Research", summary: "Volumetric density sample, x-profile va grid sensitivity birga tahlil qilinadi.", tone: "text-amber-600" },
        ];
    }, [doubleDiagnostics, mode, singleDiagnostics, summary, tripleDiagnostics]);

    const compareOverviewCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const warningCount = visibleSignals.filter((item) => item.tone !== "info").length;
        const trustTone: "neutral" | "info" | "success" | "warn" = warningCount === 0 ? "success" : warningCount < 3 ? "warn" : "warn";

        if (mode === "single" && summary) {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(singleSummary.simpson, 6),
                    detail: analyticSolution?.status === "exact" ? "Exact backend check available." : "Simpson composite is the active estimate.",
                    tone: analyticSolution?.status === "exact" ? "success" : "info",
                },
                {
                    eyebrow: "Delta check",
                    value: LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                    detail: `Midpoint/trapezoid spread: ${singleDiagnostics?.stability || "Pending"}`,
                    tone: (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        if (mode === "double" && summary) {
            const doubleSummary = summary as DoubleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(doubleSummary.value, 6),
                    detail: "2D midpoint grid estimate.",
                    tone: "info",
                },
                {
                    eyebrow: "Surface signal",
                    value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)} / ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`,
                    detail: "Peak / mean profile from accepted samples.",
                    tone: "success",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        if (mode === "triple" && summary) {
            const tripleSummary = summary as TripleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(tripleSummary.value, 6),
                    detail: "3D voxel midpoint estimate.",
                    tone: "info",
                },
                {
                    eyebrow: "Volume signal",
                    value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                    detail: `Peak density ${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 4)}`,
                    tone: "success",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        return [
            {
                eyebrow: "Compare state",
                value: "Pending",
                detail: "Solve yoki numerical confirmationdan keyin comparison cards to'ladi.",
                tone: "neutral",
            },
        ];
    }, [analyticSolution?.status, doubleDiagnostics?.mean, doubleDiagnostics?.peak, mode, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.peak, tripleDiagnostics?.voxelVolume, visibleSignals]);

    const riskRegisterCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const cards: Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }> = [];

        if (blockingValidationCount > 0) {
            cards.push({
                eyebrow: "Validation",
                value: `${blockingValidationCount} blocker`,
                detail: "Input bounds yoki expression hali to'liq yaroqli emas.",
                tone: "warn",
            });
        }

        if (warningSignals.length) {
            cards.push({
                eyebrow: "Runtime",
                value: `${warningSignals.length} warning`,
                detail: warningSignals[0]?.text || "Solver warning mavjud.",
                tone: "warn",
            });
        }

        if (expression.includes("/")) {
            cards.push({
                eyebrow: "Singularity risk",
                value: "Denominator",
                detail: "Maxraj nol bo'ladigan nuqtalarni compare qilish kerak.",
                tone: "warn",
            });
        }

        if (expression.includes("log(") || expression.includes("ln(") || expression.includes("sqrt(")) {
            cards.push({
                eyebrow: "Domain risk",
                value: "Restricted",
                detail: "Function faqat ayrim subdomainlarda aniqlangan bo'lishi mumkin.",
                tone: "warn",
            });
        }

        if (!cards.length) {
            cards.push({
                eyebrow: "Risk register",
                value: "Clean",
                detail: "Hozircha keskin domain yoki runtime risk signal topilmadi.",
                tone: "success",
            });
        }

        return cards.slice(0, 4);
    }, [blockingValidationCount, expression, warningSignals]);

    const reportSkeletonMarkdown = React.useMemo(() => {
        if (!summary) return "- Solver natijasi tayyor bo'lgach report skeleton quriladi.";
        const base = `## Laboratory Export: Integral Studio\n\n- Function: \`${expression}\`\n`;
        const assumptionsSection = `\n\n### Assumptions & Domains\n${assumptionsMarkdown}`;
        const methodSection = `\n\n### Method Audit\n${methodAuditMarkdown}`;
        const trustSection = `\n\n### Trust\n- Solver state: ${solverStatusText}\n- Warning count: ${warningSignals.length}\n- Export state: ${summary && !solverWarning ? "Ready" : "Blocked"}`;
        if (mode === "single") {
            return base
                + `- Result (Simpson): ${LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).simpson, 6)}\n- Method spread: ${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread, 6)}`
                + assumptionsSection
                + methodSection
                + trustSection;
        }
        return base
            + `- Result: ${LaboratoryFormattingService.formatMetric((summary as any).value, 8)}`
            + assumptionsSection
            + methodSection
            + trustSection;
    }, [assumptionsMarkdown, expression, methodAuditMarkdown, mode, singleDiagnostics, solverStatusText, solverWarning, summary, warningSignals.length]);

    const reportExecutiveCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        if (!summary) {
            return [
                {
                    eyebrow: "Report state",
                    value: "Pending",
                    detail: "To'liq report packet solve yoki numerical confirmationdan keyin tayyor bo'ladi.",
                    tone: "neutral",
                },
            ];
        }

        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                {
                    eyebrow: "Result",
                    value: LaboratoryFormattingService.formatMetric(singleSummary.simpson, 6),
                    detail: analyticSolution?.status === "exact" ? "Exact result verified." : "Simpson composite estimate.",
                    tone: analyticSolution?.status === "exact" ? "success" : "info",
                },
                {
                    eyebrow: "Trust",
                    value: warningSignals.length ? "Review" : "Ready",
                    detail: warningSignals.length ? "Warnings mavjud, reportga diagnostic note qo'shish kerak." : "Current packet export-ready.",
                    tone: warningSignals.length ? "warn" : "success",
                },
                {
                    eyebrow: "Coverage",
                    value: `${assumptionCards.length + methodAuditCards.length}`,
                    detail: "Assumption va method audit signal'lari reportga kiritiladi.",
                    tone: "info",
                },
            ];
        }

        const resultValue = mode === "double"
            ? LaboratoryFormattingService.formatMetric((summary as DoubleIntegralSummary).value, 6)
            : LaboratoryFormattingService.formatMetric((summary as TripleIntegralSummary).value, 6);

        return [
            {
                eyebrow: "Result",
                value: resultValue,
                detail: mode === "double" ? "Surface estimate packet." : "Volume estimate packet.",
                tone: "info",
            },
            {
                eyebrow: "Trust",
                value: warningSignals.length ? "Review" : "Ready",
                detail: warningSignals.length ? "Warnings mavjud, diagnostic section muhim." : "Current packet export-ready.",
                tone: warningSignals.length ? "warn" : "success",
            },
            {
                eyebrow: "Coverage",
                value: `${assumptionCards.length + methodAuditCards.length}`,
                detail: "Assumption va method audit signal'lari reportga kiritiladi.",
                tone: "info",
            },
        ];
    }, [analyticSolution?.status, assumptionCards.length, methodAuditCards.length, mode, summary, warningSignals.length]);

    const reportReadinessCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => ([
        {
            eyebrow: "Assumptions",
            value: `${assumptionCards.length}`,
            detail: assumptionCards.length ? "Domain va coordinate signallari mavjud." : "Assumption signal topilmadi.",
            tone: assumptionCards.length ? "info" : "neutral",
        },
        {
            eyebrow: "Method audit",
            value: `${methodAuditCards.length}`,
            detail: "Computation pathway report packetga ulanadi.",
            tone: methodAuditCards.length ? "success" : "neutral",
        },
        {
            eyebrow: "Notes",
            value: `${annotations.length}`,
            detail: annotations.length ? "Manual research notes mavjud." : "Reportga qo'shish uchun note yozilmagan.",
            tone: annotations.length ? "info" : "neutral",
        },
        {
            eyebrow: "Bridge",
            value: summary && !solverWarning ? "Ready" : "Blocked",
            detail: summary && !solverWarning ? "Copy, writer send, live push available." : "Export clean result kutmoqda.",
            tone: summary && !solverWarning ? "success" : "warn",
        },
    ]), [annotations.length, assumptionCards.length, methodAuditCards.length, solverWarning, summary]);

    const solverControlProps: React.ComponentProps<typeof SolverControl> = {
        ...state,
        ...actions,
        renderedProblemContent,
        analyticStatusTitle: analyticStatusCard.title,
        analyticStatusBody: analyticStatusCard.body,
        analyticStatusBadge: analyticStatusCard.badge,
        analyticStatusToneClass: analyticStatusCard.toneClass,
        classification,
        isResultStale,
    };

    const visualizerProps: React.ComponentProps<typeof VisualizerDeck> = {
        ...state,
        lower,
        upper,
        isResultStale,
    };

    const trustPanelProps: React.ComponentProps<typeof TrustPanel> = {
        solverStatusText,
        warningSignals,
        visibleWarnings: visibleSignals,
        parserNotes: analyticSolution?.parser.notes || [],
    };

    const scenarioPanelProps: React.ComponentProps<typeof ScenarioPanel> = {
        ...state,
        ...actions,
    };

    const annotationPanelProps: React.ComponentProps<typeof AnnotationPanel> = {
        ...state,
        ...actions,
    };

    return (
        <div className="space-y-8 pb-20">
            <StudioHeaderBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                availableTabs={availableTabs}
                tabs={workspaceTabs}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                workflowTemplates={INTEGRAL_WORKFLOW_TEMPLATES}
                activeTemplateId={activeTemplateId}
                applyWorkflowTemplate={applyWorkflowTemplate}
                presets={INTEGRAL_PRESETS}
                activePresetLabel={state.activePreset?.label}
                applyPreset={applyPreset}
                presetDescriptions={integralPresetDescriptions}
            />

            {/* Guide */}
            {guideMode && (
                <div className="rounded-3xl border border-accent/30 bg-accent/5 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                {exportGuides[guideMode].badge}
                            </div>
                            <h3 className="text-lg font-black tracking-tight text-foreground">{exportGuides[guideMode].title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{exportGuides[guideMode].description}</p>
                        </div>
                        <button onClick={() => setGuideMode(null)} className="rounded-xl border border-border/60 p-2 text-muted-foreground hover:bg-muted transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {exportGuides[guideMode].steps.map((step, idx) => (
                            <div key={idx} className="rounded-2xl border border-border/60 bg-background/50 p-3 space-y-1">
                                <div className="text-[10px] font-black text-accent uppercase">Step {idx + 1}</div>
                                <div className="text-xs leading-5 text-foreground font-medium">{step}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={guideMode === "copy" ? copyMarkdownExport : sendToWriter}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {guideMode === "copy" ? (
                                <><Activity className="mr-2 h-4 w-4" /> Nusxa olish</>
                            ) : (
                                <><Zap className="mr-2 h-4 w-4" /> Writer ga yuborish</>
                            )}
                        </button>
                        <button onClick={() => setGuideMode(null)} className="px-5 text-sm font-bold text-muted-foreground">Yopish</button>
                    </div>
                </div>
            )}

            {/* Main Tabs Content */}
            <div className="grid gap-8">
                {activeTab === "solve" && (
                    <SolveView
                        solverControlProps={solverControlProps}
                        visualizerProps={visualizerProps}
                        staleOverlay={staleOverlay}
                        stalePanelClassName={stalePanelClassName}
                        analyticDerivationTitle={analyticSolution?.status === "exact" ? "Exact solution" : "Solver guidance"}
                        analyticDerivationContent={analyticSolution?.status === "exact" ? buildExactSolutionMarkdown(analyticSolution) : buildNumericalPromptMarkdown(mode, analyticSolution)}
                        analyticDerivationAccentClassName={analyticSolution?.status === "exact" ? "text-emerald-600" : "text-amber-600"}
                        showMethodTrace={mode === "single"}
                        methodTraceContent={buildExactMethodMarkdown(analyticSolution)}
                        exactSteps={visibleExactSteps}
                        methodAuditCards={methodAuditCards}
                        visibleSignals={visibleSignals}
                        assumptionCards={assumptionCards}
                    />
                )}

                {activeTab === "visualize" && (
                    <VisualizeView
                        visualizerProps={visualizerProps}
                        staleOverlay={staleOverlay}
                        stalePanelClassName={stalePanelClassName}
                        mode={mode}
                        methodTableRows={methodTableRows}
                        sampleTableRows={sampleTableRows}
                        visualizeOverviewCards={visualizeOverviewCards}
                        methodAuditCards={methodAuditCards}
                        visibleSignals={visibleSignals}
                        sweepSeries={sweepSeries}
                        sweepTableRows={sweepTableRows}
                        sweepStart={sweepStart}
                        setSweepStart={setSweepStart}
                        sweepEnd={sweepEnd}
                        setSweepEnd={setSweepEnd}
                    />
                )}

                {activeTab === "compare" && (
                    <CompareView
                        compareOverviewCards={compareOverviewCards}
                        trustPanelProps={trustPanelProps}
                        resultLevelCards={resultLevelCards}
                        riskRegisterCards={riskRegisterCards}
                        methodAuditCards={methodAuditCards}
                        scenarioPanelProps={scenarioPanelProps}
                    />
                )}

                {activeTab === "report" && (
                    <ReportView
                        reportExecutiveCards={reportExecutiveCards}
                        reportSupportCards={reportSupportCards}
                        reportSkeletonMarkdown={reportSkeletonMarkdown}
                        copyMarkdownExport={copyMarkdownExport}
                        sendToWriter={sendToWriter}
                        reportReadinessCards={reportReadinessCards}
                        annotationPanelProps={annotationPanelProps}
                        liveTargets={liveBridge.liveTargets}
                        selectedLiveTargetId={liveBridge.selectedLiveTargetId}
                        setSelectedLiveTargetId={liveBridge.setSelectedLiveTargetId}
                        pushLiveResult={pushLiveResult}
                    />
                )}
            </div>

            {/* Sleek Status Bar */}
            <StudioStatusBar cards={[...solveOverviewCards, ...workflowReadinessCards]} resetWorkspace={resetWorkspace} />

        </div>
    );
}
