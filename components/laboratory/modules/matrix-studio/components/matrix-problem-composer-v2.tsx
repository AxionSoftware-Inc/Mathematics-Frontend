import { AxBadge, AxField, AxPanel, AxSelect, AxTextarea } from "@/components/axion";
import type { MatrixExperienceLevel, MatrixMode } from "../types";
import { getMatrixDimensionOptions } from "../matrix-dimension-options";

const copy: Record<MatrixMode, { title: string; helper: string; placeholder: string; rhs: string }> = {
    algebra: {
        title: "Matrix algebra",
        helper: "Determinant, inverse, rank and trace from one matrix.",
        placeholder: "2 1; 1 3",
        rhs: "Optional probe vector",
    },
    decomposition: {
        title: "Decomposition",
        helper: "Eigen, SVD and factorization structure.",
        placeholder: "4 1; 1 3",
        rhs: "Optional probe vector",
    },
    systems: {
        title: "Linear system",
        helper: "Solve A·x=b and inspect residuals and conditioning.",
        placeholder: "2 -1 0; -1 2 -1; 0 -1 2",
        rhs: "Right-hand side b",
    },
    transform: {
        title: "Linear transform",
        helper: "See how a matrix transforms a vector and local geometry.",
        placeholder: "1.2 0.4; -0.3 0.9",
        rhs: "Probe vector v",
    },
    tensor: {
        title: "Tensor analysis",
        helper: "Slices, contractions and multilinear structure.",
        placeholder: "1 0 2; 0 1 1 || 2 1 0; 1 0 1",
        rhs: "Optional contraction vector",
    },
};

export type MatrixProblemComposerV2Props = {
    mode: MatrixMode;
    setMode: (value: MatrixMode) => void;
    matrixExpression: string;
    setMatrixExpression: (value: string) => void;
    rhsExpression: string;
    setRhsExpression: (value: string) => void;
    dimension: string;
    setDimension: (value: string) => void;
    experienceLevel: MatrixExperienceLevel;
    activePresetLabel?: string;
};

export function MatrixProblemComposerV2({
    mode,
    setMode,
    matrixExpression,
    setMatrixExpression,
    rhsExpression,
    setRhsExpression,
    dimension,
    setDimension,
    experienceLevel,
    activePresetLabel,
}: MatrixProblemComposerV2Props) {
    const dimensionOptions = getMatrixDimensionOptions(mode);
    const selectedDimension = dimensionOptions.find((item) => item.value === dimension) ?? dimensionOptions[0];
    const meta = copy[mode];
    const showRhs = mode === "systems" || mode === "transform" || mode === "tensor";

    return (
        <AxPanel className="overflow-hidden">
            <div className="border-b border-[var(--ax-line)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[var(--ax-text)]">{meta.title}</div>
                    </div>
                    <AxBadge>{activePresetLabel ?? "Custom"}</AxBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--ax-text-soft)]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <AxField label="Operation">
                    <AxSelect value={mode} onChange={(event) => setMode(event.target.value as MatrixMode)} className="text-[12px] font-semibold">
                        <option value="algebra">Matrix algebra</option>
                        <option value="decomposition">Decomposition</option>
                        <option value="systems">Linear systems</option>
                        <option value="transform">Linear transform</option>
                        <option value="tensor">Tensor</option>
                    </AxSelect>
                </AxField>

                <AxField label="Matrix / tensor">
                    <AxTextarea
                        value={matrixExpression}
                        onChange={(event) => setMatrixExpression(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={meta.placeholder}
                        className="min-h-[148px] font-mono text-[13px]"
                    />
                </AxField>

                {showRhs ? (
                    <AxField label={meta.rhs}>
                        <AxTextarea
                            value={rhsExpression}
                            onChange={(event) => setRhsExpression(event.target.value)}
                            rows={3}
                            spellCheck={false}
                            placeholder="1; 0"
                            className="min-h-[84px] font-mono text-[12px]"
                        />
                    </AxField>
                ) : null}

                <div className="rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-accent-soft)] px-3 py-2.5 text-[11px] leading-5 text-[var(--ax-text-soft)]">
                    Analysis updates automatically as the input changes.
                </div>

                <details className="rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface)]">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--ax-text-soft)]">Advanced settings</summary>
                    <div className="space-y-3 border-t border-[var(--ax-line)] p-3">
                        <AxField label="Dimension">
                            <AxSelect
                                value={selectedDimension?.value ?? dimension}
                                onChange={(event) => setDimension(event.target.value)}
                                className="h-9 text-[11px] font-semibold"
                            >
                                {dimensionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </AxSelect>
                        </AxField>
                        <div className="text-[11px] leading-5 text-[var(--ax-text-soft)]">{selectedDimension?.description}</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--ax-text-soft)]">
                            <div className="rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-2.5 py-2">Rows: <span className="font-semibold text-[var(--ax-text)]">;</span></div>
                            <div className="rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-2.5 py-2">Slices: <span className="font-semibold text-[var(--ax-text)]">||</span></div>
                        </div>
                        <div className="text-[10px] text-[var(--ax-text-faint)]">Experience: {experienceLevel}</div>
                    </div>
                </details>
            </div>
        </AxPanel>
    );
}
