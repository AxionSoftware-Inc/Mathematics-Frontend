import type { MatrixExperienceLevel, MatrixMode } from "../types";

type Props = {
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

const modeCopy: Record<MatrixMode, { label: string; helper: string; placeholder: string }> = {
    algebra: {
        label: "Matrix Algebra",
        helper: "Determinant, inverse, trace va rank auditlari uchun square matrix kiriting.",
        placeholder: "2 1; 1 3",
    },
    decomposition: {
        label: "Spectral / Decomposition",
        helper: "Eigenvalue, eigenvector, LU/QR/SVD oilalari uchun simmetrik yoki square matrix bilan boshlang.",
        placeholder: "4 1; 1 3",
    },
    systems: {
        label: "Linear Systems",
        helper: "A*x=b tipidagi sistema, elimination trace va least-squares audit uchun RHS vector qo'shing.",
        placeholder: "2 -1 0; -1 2 -1; 0 -1 2",
    },
    transform: {
        label: "Linear Transform",
        helper: "2D transform, basis distortion va geometry preview uchun transform matrix kiriting.",
        placeholder: "1.2 0.4; -0.3 0.9",
    },
    tensor: {
        label: "Tensor Analysis",
        helper: "Rank-3 tensor slice'larini `||` bilan, higher-order bloklarni `###` bilan ajrating. Unfolding, contraction, Tucker/CP va sparse audit shu lane'da ishlaydi.",
        placeholder: "1 0 2; 0 1 1 || 2 1 0; 1 0 1 || 0 2 1; 1 1 0 ### 0 1 0; 1 0 0 || 1 1 0; 0 0 1 || 0 0 1; 1 0 1",
    },
};

export function SolverControl({
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
}: Props) {
    const copy = modeCopy[mode];

    return (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Composer</div>
                        <div className="mt-2 text-xl font-black tracking-tight text-foreground">{copy.label}</div>
                        <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.helper}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-right">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Preset</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{activePresetLabel ?? "Custom"}</div>
                    </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr_0.8fr]">
                    <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Analysis Mode</span>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as MatrixMode)}
                            className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
                        >
                            <option value="algebra">Matrix Algebra</option>
                            <option value="decomposition">Decomposition</option>
                            <option value="systems">Linear Systems</option>
                            <option value="transform">Linear Transform</option>
                            <option value="tensor">Tensor</option>
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Dimension Scope</span>
                        <select
                            value={dimension}
                            onChange={(e) => setDimension(e.target.value)}
                            className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
                        >
                            <option value="2x2">2x2</option>
                            <option value="3x3">3x3</option>
                            <option value="4x4">4x4</option>
                            <option value="5x5">5x5</option>
                            <option value="5x2">5x2</option>
                            <option value="2x3x3">2x3x3</option>
                            <option value="mxn">m x n</option>
                        </select>
                    </label>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Experience</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{experienceLevel}</div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">Matrix oilalari, transform va tensor lane'lar shu shell ichida ishlaydi.</div>
                    </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Matrix / Tensor Input</span>
                        <textarea
                            value={matrixExpression}
                            onChange={(e) => setMatrixExpression(e.target.value)}
                            rows={7}
                            placeholder={copy.placeholder}
                            spellCheck={false}
                            className="min-h-[190px] w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                        />
                    </label>

                    <div className="space-y-4">
                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">RHS / Probe Vector</span>
                            <textarea
                                value={rhsExpression}
                                onChange={(e) => setRhsExpression(e.target.value)}
                                rows={5}
                                placeholder="1; 0"
                                spellCheck={false}
                                className="w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                            />
                        </label>

                        <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Input Rules</div>
                            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                                <li>Rows `;` bilan ajratiladi.</li>
                                <li>Bir qatordagi elementlar bo'sh joy yoki `,` bilan ajratiladi.</li>
                                <li>Tensor slice'lari `||` bilan ajratiladi.</li>
                                <li>Higher-order tensor bloklari `###` bilan ajratiladi.</li>
                                <li>RHS vector optional, `systems`, `transform` va `tensor contraction` lane'da foydali.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Rendered Preview</div>
                    <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 font-mono text-sm leading-7 text-foreground">
                        {matrixExpression || "2 1; 1 3"}
                    </div>
                    {rhsExpression ? (
                        <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 p-4 font-mono text-sm leading-7 text-foreground">
                            probe = {rhsExpression}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
