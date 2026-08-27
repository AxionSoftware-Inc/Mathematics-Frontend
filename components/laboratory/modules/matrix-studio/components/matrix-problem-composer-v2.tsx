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
        <div className="overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white">
            <div className="border-b border-[#e8ebef] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">{meta.title}</div>
                    </div>
                    <div className="rounded-[7px] bg-[#f5f7fa] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#747d88]">
                        {activePresetLabel ?? "Custom"}
                    </div>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#6f7782]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Operation</span>
                    <select
                        value={mode}
                        onChange={(event) => setMode(event.target.value as MatrixMode)}
                        className="h-10 w-full rounded-[8px] border border-[#dfe4ea] bg-white px-3 text-[12px] font-semibold text-[#20242b] outline-none focus:border-[#9db5dc]"
                    >
                        <option value="algebra">Matrix algebra</option>
                        <option value="decomposition">Decomposition</option>
                        <option value="systems">Linear systems</option>
                        <option value="transform">Linear transform</option>
                        <option value="tensor">Tensor</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">Matrix / tensor</span>
                    <textarea
                        value={matrixExpression}
                        onChange={(event) => setMatrixExpression(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={meta.placeholder}
                        className="min-h-[148px] w-full resize-y rounded-[8px] border border-[#dfe4ea] bg-[#fcfdff] px-3 py-3 font-mono text-[13px] leading-6 text-[#20242b] outline-none focus:border-[#9db5dc]"
                    />
                </label>

                {showRhs ? (
                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#747d88]">{meta.rhs}</span>
                        <textarea
                            value={rhsExpression}
                            onChange={(event) => setRhsExpression(event.target.value)}
                            rows={3}
                            spellCheck={false}
                            placeholder="1; 0"
                            className="w-full resize-y rounded-[8px] border border-[#dfe4ea] bg-white px-3 py-2.5 font-mono text-[12px] leading-5 text-[#20242b] outline-none focus:border-[#9db5dc]"
                        />
                    </label>
                ) : null}

                <div className="rounded-[8px] border border-[#dfe4ea] bg-[#f8fafe] px-3 py-2.5 text-[11px] leading-5 text-[#626b76]">
                    Analysis updates automatically as the input changes.
                </div>

                <details className="rounded-[8px] border border-[#e2e6ec] bg-white">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#66707c]">Advanced settings</summary>
                    <div className="space-y-3 border-t border-[#edf0f3] p-3">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#7a838e]">Dimension</span>
                            <select
                                value={selectedDimension?.value ?? dimension}
                                onChange={(event) => setDimension(event.target.value)}
                                className="h-9 w-full rounded-[7px] border border-[#dfe4ea] bg-white px-3 text-[11px] font-semibold text-[#303640] outline-none"
                            >
                                {dimensionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                        <div className="text-[11px] leading-5 text-[#7a838e]">{selectedDimension?.description}</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-[#7a838e]">
                            <div className="rounded-[7px] bg-[#f7f8fa] px-2.5 py-2">Rows: <span className="font-semibold text-[#343a43]">;</span></div>
                            <div className="rounded-[7px] bg-[#f7f8fa] px-2.5 py-2">Slices: <span className="font-semibold text-[#343a43]">||</span></div>
                        </div>
                        <div className="text-[10px] text-[#9299a2]">Experience: {experienceLevel}</div>
                    </div>
                </details>
            </div>
        </div>
    );
}
