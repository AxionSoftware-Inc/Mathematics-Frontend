"use client";

import * as React from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { MATRIX_PRESETS } from "./constants";
import { normalizeMatrixDimension } from "./matrix-dimension-options";
import { MatrixSolveService } from "./services/solve-service";
import type {
    MatrixAnalyticSolveResponse,
    MatrixComputationSummary,
    MatrixExperienceLevel,
    MatrixMode,
    MatrixPreset,
    MatrixStudioState,
    MatrixWorkspaceTab,
} from "./types";

function parseMatrixRows(expression: string) {
    return expression
        .split("||")[0]
        .split(";")
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => row.split(/[\s,]+/).map((cell) => cell.trim()).filter(Boolean));
}

function parseTensorSlices(expression: string) {
    return expression
        .split("###")[0]
        .split("||")
        .map((slice) =>
            slice
                .split(";")
                .map((row) => row.trim())
                .filter(Boolean)
                .map((row) => row.split(/[\s,]+/).map((cell) => cell.trim()).filter(Boolean)),
        )
        .filter((slice) => slice.length > 0);
}

function parseVectorRows(expression: string) {
    return expression
        .split(";")
        .map((row) => row.trim())
        .filter(Boolean);
}

function fallbackSummary(matrixRows: string[][], rhsRows: string[], mode: MatrixMode): MatrixComputationSummary {
    const rows = matrixRows.length;
    const cols = matrixRows[0]?.length ?? 0;
    const square = rows > 0 && rows === cols;
    return {
        determinant: square ? "pending" : null,
        trace: square ? "pending" : null,
        rank: rows ? `${rows}` : null,
        inverseAvailable: false,
        eigenSummary: mode === "decomposition" ? "Waiting for solve" : null,
        systemSummary: mode === "systems" ? (rhsRows.length ? `RHS vector length ${rhsRows.length}` : "Right-hand side pending") : null,
        conditionLabel: square ? "Awaiting backend audit" : "Rectangular matrix",
        shape: rows && cols ? `${rows}x${cols}` : null,
        conditionNumber: null,
        diagonalizable: null,
        pivotColumns: [],
        spectralRadius: null,
        residualNorm: null,
        decompositionSummary: null,
        solverKind: null,
        svdSummary: null,
        singularValueMagnitudes: [],
        iterativeSummary: null,
        sparseSummary: null,
        tensorSummary: mode === "tensor" ? "Tensor lane waiting for unfold audit" : null,
        tensorShape: mode === "tensor" && rows && cols ? `${rows}x${cols}x?` : null,
        tensorOrder: mode === "tensor" ? 3 : null,
        modeRanks: mode === "tensor" ? [] : null,
        contractionSummary: null,
        contractionDetails: mode === "tensor" ? [] : null,
        tensorProductSummary: null,
        tuckerSummary: null,
        cpSummary: null,
        tensorEigenSummary: null,
        tensorSliceNorms: mode === "tensor" ? [] : null,
        modeSingularSummaries: mode === "tensor" ? [] : null,
        tensorBlockNorms: mode === "tensor" ? [] : null,
        tuckerFactorSummaries: mode === "tensor" ? [] : null,
        cpFactorSummaries: mode === "tensor" ? [] : null,
    };
}

export function useMatrixStudio(module: LaboratoryModuleMeta) {
    const config = module.config ?? {};
    const defaultPreset = MATRIX_PRESETS[0];

    const [experienceLevel, setExperienceLevel] = React.useState<MatrixExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<MatrixWorkspaceTab>("solve");
    const [mode, setMode] = React.useState<MatrixMode>((config.defaultMode as MatrixMode | undefined) ?? defaultPreset.mode);
    const [matrixExpression, setMatrixExpression] = React.useState<string>((config.defaultExpression as string | undefined) ?? defaultPreset.matrix);
    const [rhsExpression, setRhsExpression] = React.useState<string>((config.defaultSecondary as string | undefined) ?? defaultPreset.rhs ?? "");
    const [dimension, setDimension] = React.useState<string>((config.defaultDimension as string | undefined) ?? defaultPreset.dimension);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(defaultPreset.label);
    const [solvePhase, setSolvePhase] = React.useState<MatrixStudioState["solvePhase"]>("idle");
    const [analyticSolution, setAnalyticSolution] = React.useState<MatrixAnalyticSolveResponse | null>(null);
    const [solveErrorMessage, setSolveErrorMessage] = React.useState<string | null>(null);
    const [solveSignature, setSolveSignature] = React.useState<string>("");

    const matrixRows = React.useMemo(() => parseMatrixRows(matrixExpression), [matrixExpression]);
    const tensorSlices = React.useMemo(() => parseTensorSlices(matrixExpression), [matrixExpression]);
    const rhsRows = React.useMemo(() => parseVectorRows(rhsExpression), [rhsExpression]);
    const normalizedDimension = React.useMemo(() => normalizeMatrixDimension(mode, dimension), [dimension, mode]);
    const signature = React.useMemo(
        () => JSON.stringify({ mode, matrixExpression, rhsExpression, dimension: normalizedDimension }),
        [matrixExpression, mode, normalizedDimension, rhsExpression],
    );

    React.useEffect(() => {
        const nextDimension = normalizeMatrixDimension(mode, dimension);
        if (nextDimension !== dimension) {
            setDimension(nextDimension);
        }
    }, [dimension, mode]);

    React.useEffect(() => {
        let cancelled = false;

        if (!matrixExpression.trim()) {
            setAnalyticSolution(null);
            setSolvePhase("idle");
            setSolveErrorMessage(null);
            return;
        }

        setSolvePhase("auto-ready");
        setSolveErrorMessage(null);

        MatrixSolveService.requestSolve({
            mode,
            expression: matrixExpression,
            rhs: rhsExpression,
            dimension: normalizedDimension,
        })
            .then((result) => {
                if (cancelled) {
                    return;
                }
                setAnalyticSolution(result);
                setSolveSignature(signature);
                setSolvePhase("analysis-ready");
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                setAnalyticSolution(null);
                setSolveErrorMessage(error instanceof Error ? error.message : "Matrix solve xatosi.");
                setSolvePhase("idle");
            });

        return () => {
            cancelled = true;
        };
    }, [matrixExpression, mode, normalizedDimension, rhsExpression, signature]);

    const summary = React.useMemo(
        () => analyticSolution?.summary ?? fallbackSummary(matrixRows, rhsRows, mode),
        [analyticSolution, matrixRows, mode, rhsRows],
    );

    const isResultStale = Boolean(analyticSolution) && solveSignature !== signature;

    const visualNotes = React.useMemo(() => {
        if (mode === "transform") {
            return [
                "2D transform plot",
                analyticSolution?.exact.result_latex ?? "Probe vector image pending",
                summary.determinant ? `Determinant ${summary.determinant}` : "Area scaling pending",
            ];
        }
        if (mode === "decomposition") {
            return [
                "Matrix heatmap",
                analyticSolution?.summary.eigenSummary ?? "Spectrum pending",
                analyticSolution?.summary.diagonalizable === null || analyticSolution?.summary.diagonalizable === undefined
                    ? "Diagonalizability pending"
                    : `Diagonalizable: ${analyticSolution.summary.diagonalizable ? "yes" : "no"}`,
                analyticSolution?.summary.spectralRadius ? `Spectral radius ${analyticSolution.summary.spectralRadius}` : "Spectral radius pending",
                analyticSolution?.summary.decompositionSummary ?? "LU / QR / Cholesky pending",
                analyticSolution?.summary.svdSummary ? `SVD σ: ${analyticSolution.summary.svdSummary}` : "SVD pending",
                summary.shape ? `Shape ${summary.shape}` : "Shape pending",
            ];
        }
        if (mode === "systems") {
            return [
                "Augmented matrix view",
                analyticSolution?.summary.systemSummary ?? "System solve pending",
                analyticSolution?.summary.solverKind ? `Solver ${analyticSolution.summary.solverKind}` : "Solver kind pending",
                analyticSolution?.summary.iterativeSummary ? `Iterative ${analyticSolution.summary.iterativeSummary}` : "Iterative lane pending",
                analyticSolution?.summary.sparseSummary ? analyticSolution.summary.sparseSummary : "Sparsity pending",
                summary.pivotColumns?.length ? `Pivot columns ${summary.pivotColumns.join(", ")}` : "Pivot structure pending",
                analyticSolution?.summary.residualNorm ? `Residual norm ${analyticSolution.summary.residualNorm}` : "Residual norm pending",
                analyticSolution?.summary.leastSquaresSummary ?? "Least-squares audit pending",
                analyticSolution?.exact.auxiliary_latex ?? "Residual pending",
            ];
        }
        if (mode === "tensor") {
            return [
                "Tensor slice heatmaps",
                analyticSolution?.summary.tensorSummary ?? "Tensor audit pending",
                analyticSolution?.summary.tensorShape ? `Shape ${analyticSolution.summary.tensorShape}` : "Tensor shape pending",
                analyticSolution?.summary.modeRanks?.length ? `Mode ranks ${analyticSolution.summary.modeRanks.join(" / ")}` : "Mode unfolding ranks pending",
                analyticSolution?.summary.contractionSummary ?? "Contraction probe pending",
                analyticSolution?.summary.tensorProductSummary ?? "Tensor product pending",
                analyticSolution?.summary.tuckerSummary ?? "Tucker audit pending",
                analyticSolution?.summary.cpSummary ?? "CP probe pending",
                analyticSolution?.summary.tensorEigenSummary ?? "Tensor eigen concept pending",
                analyticSolution?.summary.modeSingularSummaries?.length ? analyticSolution.summary.modeSingularSummaries.join(" | ") : "Mode spectra pending",
                analyticSolution?.summary.tensorBlockNorms?.length ? `Block energy ${analyticSolution.summary.tensorBlockNorms.join(", ")}` : "Higher-order block audit pending",
                analyticSolution?.summary.tuckerFactorSummaries?.length ? analyticSolution.summary.tuckerFactorSummaries.join(" | ") : "Tucker factors pending",
                analyticSolution?.summary.cpFactorSummaries?.length ? analyticSolution.summary.cpFactorSummaries.join(" | ") : "CP factors pending",
                analyticSolution?.summary.sparseSummary ?? "Tensor sparsity pending",
            ];
        }
        return [
            "Matrix heatmap",
            summary.determinant ? `Det(A) = ${summary.determinant}` : "Determinant pending",
            summary.conditionNumber ? `k(A) ≈ ${summary.conditionNumber}` : "Conditioning pending",
            summary.inverseAvailable ? "Inverse available" : "Inverse unavailable or pending",
        ];
    }, [analyticSolution, mode, summary]);

    const compareNotes = React.useMemo(() => {
        const notes = [
            "Direct solve vs elimination lane",
            "Conditioning and pivot stability",
            "Dense vs sparse-ready roadmap",
        ];
        if (summary.conditionNumber) {
            notes.splice(1, 0, `Condition number ≈ ${summary.conditionNumber}`);
        }
        if (summary.pivotColumns?.length) {
            notes.push(`Pivot columns: ${summary.pivotColumns.join(", ")}`);
        }
        if (summary.spectralRadius) {
            notes.push(`Spectral radius ≈ ${summary.spectralRadius}`);
        }
        if (summary.decompositionSummary) {
            notes.push(`Decomposition: ${summary.decompositionSummary}`);
        }
        if (summary.factorAuditSummary) {
            notes.push(`Factor audit: ${summary.factorAuditSummary}`);
        }
        if (summary.svdSummary) {
            notes.push(`SVD σ: ${summary.svdSummary}`);
        }
        if (summary.iterativeSummary) {
            notes.push(`Iterative: ${summary.iterativeSummary}`);
        }
        if (summary.leastSquaresSummary) {
            notes.push(`Least squares: ${summary.leastSquaresSummary}`);
        }
        if (summary.stabilitySummary) {
            notes.push(`Stability: ${summary.stabilitySummary}`);
        }
        if (summary.sparseSummary) {
            notes.push(`Sparse profile: ${summary.sparseSummary}`);
        }
        if (summary.tensorShape) {
            notes.push(`Tensor shape: ${summary.tensorShape}`);
        }
        if (summary.modeRanks?.length) {
            notes.push(`Mode ranks: ${summary.modeRanks.join(", ")}`);
        }
        if (summary.contractionSummary) {
            notes.push(`Contraction: ${summary.contractionSummary}`);
        }
        if (summary.tensorProductSummary) {
            notes.push(`Tensor product: ${summary.tensorProductSummary}`);
        }
        if (summary.tuckerSummary) {
            notes.push(`Tucker: ${summary.tuckerSummary}`);
        }
        if (summary.cpSummary) {
            notes.push(`CP: ${summary.cpSummary}`);
        }
        if (summary.tensorEigenSummary) {
            notes.push(`Eigen concept: ${summary.tensorEigenSummary}`);
        }
        if (summary.modeSingularSummaries?.length) {
            notes.push(`Mode spectra: ${summary.modeSingularSummaries.join(" | ")}`);
        }
        if (summary.tensorBlockNorms?.length) {
            notes.push(`Block energy: ${summary.tensorBlockNorms.join(", ")}`);
        }
        if (summary.tuckerFactorSummaries?.length) {
            notes.push(`Tucker factors: ${summary.tuckerFactorSummaries.join(" | ")}`);
        }
        if (summary.cpFactorSummaries?.length) {
            notes.push(`CP factors: ${summary.cpFactorSummaries.join(" | ")}`);
        }
        if (analyticSolution?.exact.method_label) {
            notes.unshift(`Primary method: ${analyticSolution.exact.method_label}`);
        }
        return notes;
    }, [analyticSolution, summary.conditionNumber, summary.pivotColumns, summary.spectralRadius, summary.decompositionSummary, summary.factorAuditSummary, summary.svdSummary, summary.iterativeSummary, summary.leastSquaresSummary, summary.stabilitySummary, summary.sparseSummary, summary.tensorShape, summary.modeRanks, summary.contractionSummary, summary.tensorProductSummary, summary.tuckerSummary, summary.cpSummary, summary.tensorEigenSummary, summary.modeSingularSummaries, summary.tensorBlockNorms, summary.tuckerFactorSummaries, summary.cpFactorSummaries]);

    const reportNotes = React.useMemo(() => [
        `Matrix family: ${mode}`,
        `Shape: ${summary.shape ?? "pending"}`,
        `Conditioning cue: ${summary.conditionLabel ?? "pending"}`,
        `Pivot columns: ${summary.pivotColumns?.join(", ") || "pending"}`,
        `Spectral radius: ${summary.spectralRadius ?? "pending"}`,
        `Solver kind: ${summary.solverKind ?? "pending"}`,
        `Stability: ${summary.stabilitySummary ?? "pending"}`,
        `Least-squares: ${summary.leastSquaresSummary ?? "pending"}`,
        `Iterative lane: ${summary.iterativeSummary ?? "pending"}`,
        `Factor audit: ${summary.factorAuditSummary ?? "pending"}`,
        `SVD summary: ${summary.svdSummary ?? "pending"}`,
        `Sparse profile: ${summary.sparseSummary ?? "pending"}`,
        `Tensor shape: ${summary.tensorShape ?? "pending"}`,
        `Mode ranks: ${summary.modeRanks?.join(", ") ?? "pending"}`,
        `Contraction: ${summary.contractionSummary ?? "pending"}`,
        `Tensor product: ${summary.tensorProductSummary ?? "pending"}`,
        `Tucker: ${summary.tuckerSummary ?? "pending"}`,
        `CP: ${summary.cpSummary ?? "pending"}`,
        `Tensor eigen: ${summary.tensorEigenSummary ?? "pending"}`,
        `Mode spectra: ${summary.modeSingularSummaries?.join(" | ") ?? "pending"}`,
        `Block energy: ${summary.tensorBlockNorms?.join(", ") ?? "pending"}`,
        `Tucker factors: ${summary.tuckerFactorSummaries?.join(" | ") ?? "pending"}`,
        `CP factors: ${summary.cpFactorSummaries?.join(" | ") ?? "pending"}`,
    ], [mode, summary.conditionLabel, summary.pivotColumns, summary.shape, summary.spectralRadius, summary.solverKind, summary.stabilitySummary, summary.leastSquaresSummary, summary.iterativeSummary, summary.factorAuditSummary, summary.svdSummary, summary.sparseSummary, summary.tensorShape, summary.modeRanks, summary.contractionSummary, summary.tensorProductSummary, summary.tuckerSummary, summary.cpSummary, summary.tensorEigenSummary, summary.modeSingularSummaries, summary.tensorBlockNorms, summary.tuckerFactorSummaries, summary.cpFactorSummaries]);

    const applyPreset = React.useCallback((preset: MatrixPreset) => {
        setMode(preset.mode);
        setMatrixExpression(preset.matrix);
        setRhsExpression(preset.rhs ?? "");
        setDimension(normalizeMatrixDimension(preset.mode, preset.dimension));
        setActivePresetLabel(preset.label);
    }, []);

    return {
        state: {
            experienceLevel,
            activeTab,
            mode,
            matrixExpression,
            rhsExpression,
            dimension: normalizedDimension,
            solvePhase,
            isResultStale,
            activePresetLabel,
            summary,
            analyticSolution,
            solveErrorMessage,
            matrixRows,
            rhsRows,
            tensorSlices,
            visualNotes,
            compareNotes,
            reportNotes,
        } satisfies MatrixStudioState,
        actions: {
            setExperienceLevel,
            setActiveTab,
            setMode,
            setMatrixExpression,
            setRhsExpression,
            setDimension,
            applyPreset,
        },
    };
}
