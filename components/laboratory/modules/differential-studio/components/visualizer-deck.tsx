import React from "react";
import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { ScientificPlot } from "@/components/laboratory/scientific-plot";
import { DifferentialMathService } from "../services/math-service";
import type {
    DifferentialAnalyticSolveResponse,
    DerivativeSummary,
    GradientSummary,
    JacobianSummary,
    HessianSummary,
    HigherOrderDerivativeSummary,
    DirectionalDerivativeSummary,
    DifferentialExtendedMode,
    ODESummary,
    PDESummary,
    PlotPoint,
    SDESummary,
    StepSweepEntry,
    DifferentialCoordinateSystem,
} from "../types";

function isDerivative(summary: unknown): summary is DerivativeSummary {
    return (summary as DerivativeSummary)?.type === "derivative";
}

function isHigherOrder(summary: unknown): summary is HigherOrderDerivativeSummary {
    return (summary as HigherOrderDerivativeSummary)?.type === "higher_order";
}

function isGradient(summary: unknown): summary is GradientSummary {
    return (summary as GradientSummary)?.type === "gradient";
}

function isDirectional(summary: unknown): summary is DirectionalDerivativeSummary {
    return (summary as DirectionalDerivativeSummary)?.type === "directional";
}

function isJacobian(summary: unknown): summary is JacobianSummary {
    return (summary as JacobianSummary)?.type === "jacobian";
}

function isHessian(summary: unknown): summary is HessianSummary {
    return (summary as HessianSummary)?.type === "hessian";
}

function isODE(summary: unknown): summary is ODESummary {
    return (summary as ODESummary)?.type === "ode";
}

function isPDE(summary: unknown): summary is PDESummary {
    return (summary as PDESummary)?.type === "pde";
}

function isSDE(summary: unknown): summary is SDESummary {
    return (summary as SDESummary)?.type === "sde";
}

function StabilityBadge({ label, tone }: { label: string; tone: "ok" | "warn" | "rough" }) {
    const toneClass =
        tone === "ok"
            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : tone === "warn"
              ? "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";

    return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>{label}</span>;
}

function StepSweepTable({ entries }: { entries: StepSweepEntry[] }) {
    if (!entries.length) return null;
    return (
        <LaboratoryDataTable
            eyebrow="Stability"
            title="Step-Size Sweep (h)"
            columns={["h", "Value", "Rel. Error", "Status"]}
            rows={entries.map((entry) => [
                entry.hLabel,
                entry.value.toFixed(8),
                entry.relError < 1e-8 ? "< 1e-8" : entry.relError.toExponential(2),
                entry.stability,
            ])}
            emptyMessage="No sweep data"
        />
    );
}

function ODESlopeFieldPanel({
    field,
    trajectory,
}: {
    field: Array<{ x: number; y: number; slope: number }>;
    trajectory: PlotPoint[];
}) {
    if (!field.length) return null;
    const xs = field.map((item) => item.x).concat(trajectory.map((item) => item.x));
    const ys = field.map((item) => item.y).concat(trajectory.map((item) => item.y));
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const px = (x: number) => ((x - xMin) / Math.max(1e-9, xMax - xMin)) * 100;
    const py = (y: number) => 100 - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * 100;

    return (
        <div className="site-outline-card p-4 space-y-3" data-testid="diff-ode-slope-field">
            <div className="site-eyebrow text-accent">Slope Field</div>
            <svg viewBox="0 0 100 100" className="w-full rounded-2xl border border-border/40 bg-muted/10">
                {field.map((sample, index) => {
                    const angle = Math.atan(sample.slope);
                    const len = 1.6;
                    const dx = Math.cos(angle) * len;
                    const dy = Math.sin(angle) * len;
                    return (
                        <line
                            key={`${sample.x}-${sample.y}-${index}`}
                            x1={px(sample.x) - dx}
                            y1={py(sample.y) + dy}
                            x2={px(sample.x) + dx}
                            y2={py(sample.y) - dy}
                            stroke="currentColor"
                            strokeOpacity="0.28"
                            strokeWidth="0.55"
                            strokeLinecap="round"
                        />
                    );
                })}
                <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.3"
                    points={trajectory.map((item) => `${px(item.x)},${py(item.y)}`).join(" ")}
                />
            </svg>
        </div>
    );
}

function PDEHeatmapPanel({ samples }: { samples: Array<{ x: number; y: number; z: number }> }) {
    if (!samples.length) return null;
    const xMin = Math.min(...samples.map((sample) => sample.x));
    const xMax = Math.max(...samples.map((sample) => sample.x));
    const yMin = Math.min(...samples.map((sample) => sample.y));
    const yMax = Math.max(...samples.map((sample) => sample.y));
    const zMin = Math.min(...samples.map((sample) => sample.z));
    const zMax = Math.max(...samples.map((sample) => sample.z));
    const zSpan = Math.max(1e-9, zMax - zMin);
    const cell = 3.1;

    return (
        <div className="site-outline-card p-4 space-y-3" data-testid="diff-pde-heatmap">
            <div className="site-eyebrow text-accent">Space-Time Heatmap</div>
            <svg viewBox="0 0 100 100" className="w-full rounded-2xl border border-border/40 bg-muted/10">
                {samples.map((sample, index) => {
                    const t = (sample.z - zMin) / zSpan;
                    const red = Math.round(40 + t * 180);
                    const green = Math.round(80 + (1 - t) * 120);
                    const blue = Math.round(210 - t * 80);
                    const x = ((sample.x - xMin) / Math.max(1e-9, xMax - xMin)) * 96 + 2;
                    const y = 98 - ((sample.y - yMin) / Math.max(1e-9, yMax - yMin)) * 96;
                    return <rect key={`${sample.x}-${sample.y}-${index}`} x={x} y={y} width={cell} height={cell} fill={`rgba(${red}, ${green}, ${blue}, 0.82)`} />;
                })}
            </svg>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                <div>x: <span className="font-mono text-foreground">{xMin.toFixed(2)} .. {xMax.toFixed(2)}</span></div>
                <div>t: <span className="font-mono text-foreground">{yMin.toFixed(2)} .. {yMax.toFixed(2)}</span></div>
            </div>
        </div>
    );
}

function ODEPhasePanel({ summary }: { summary: ODESummary }) {
    return (
        <div className="site-outline-card p-4 space-y-3" data-testid="diff-ode-phase-panel">
            <div className="site-eyebrow text-accent">Phase Portrait</div>
            <CartesianPlot
                title="Phase Line / Flow"
                series={[{ label: "dy/dx vs y", color: "#f59e0b", points: summary.phaseSamples }]}
            />
            <div className="grid gap-3 sm:grid-cols-3 text-[11px] text-muted-foreground">
                <div>family: <span className="font-mono text-foreground">{summary.family}</span></div>
                <div>equilibria: <span className="font-mono text-foreground">{summary.equilibriumPoints.length || 0}</span></div>
                <div>stability: <span className="font-mono text-foreground">{summary.stabilityLabel}</span></div>
            </div>
        </div>
    );
}

function PDEProfilePanel({ summary }: { summary: PDESummary }) {
    return (
        <div className="site-outline-card p-4 space-y-3" data-testid="diff-pde-profile-panel">
            <div className="site-eyebrow text-accent">Final Spatial Profile</div>
            <CartesianPlot
                title="u(x, T)"
                series={[{ label: "final profile", color: "var(--accent)", points: summary.finalProfile }]}
            />
            <div className="grid gap-3 sm:grid-cols-3 text-[11px] text-muted-foreground">
                <div>family: <span className="font-mono text-foreground">{summary.family}</span></div>
                <div>grid: <span className="font-mono text-foreground">{summary.grid.nx}x{summary.grid.nt}</span></div>
                <div>ratio: <span className="font-mono text-foreground">{summary.stabilityRatio.toFixed(3)}</span></div>
            </div>
        </div>
    );
}

function SDEEnsemblePanel({ summary }: { summary: SDESummary }) {
    const bandSeries = [
        { label: "mean", color: "var(--accent)", points: summary.meanPath },
        { label: "+1σ", color: "#10b981", points: summary.upperBand },
        { label: "-1σ", color: "#f59e0b", points: summary.lowerBand },
    ];
    const pathSeries = summary.ensemblePaths.slice(0, 8).map((path, index) => ({
        label: `path ${index + 1}`,
        color: index === 0 ? "#94a3b8" : "#cbd5e1",
        points: path,
    }));

    return (
        <div className="space-y-4" data-testid="diff-sde-ensemble-panel">
            <div className="site-outline-card p-4 space-y-3">
                <div className="site-eyebrow text-accent">Ensemble Paths</div>
                <CartesianPlot title="Monte Carlo Trajectories" series={[...pathSeries, ...bandSeries]} />
            </div>
            <div className="site-outline-card p-4 space-y-3">
                <div className="site-eyebrow text-accent">Terminal Distribution</div>
                <CartesianPlot
                    title="Histogram"
                    series={[{ label: "terminal density", color: "#8b5cf6", points: summary.terminalHistogram }]}
                />
                <div className="grid gap-3 sm:grid-cols-3 text-[11px] text-muted-foreground">
                    <div>paths: <span className="font-mono text-foreground">{summary.pathCount}</span></div>
                    <div>mean: <span className="font-mono text-foreground">{summary.terminalMean.toFixed(4)}</span></div>
                    <div>std: <span className="font-mono text-foreground">{summary.terminalStd.toFixed(4)}</span></div>
                </div>
            </div>
        </div>
    );
}

function GradientArrowPanel({ summary }: { summary: GradientSummary | DirectionalDerivativeSummary }) {
    const { gradient, magnitude } = summary;
    if (gradient.length < 2) return null;

    const [gx, gy] = gradient;
    const n = magnitude > 0 ? magnitude : 1;
    const ux = (gx ?? 0) / n;
    const uy = (gy ?? 0) / n;

    return (
        <div className="site-outline-card p-4 space-y-3">
            <div className="site-eyebrow text-accent">Gradient Direction</div>
            <div className="flex items-center justify-center">
                <svg viewBox="-1.5 -1.5 3 3" width="170" height="170">
                    <line x1="-1.4" y1="0" x2="1.4" y2="0" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.02" />
                    <line x1="0" y1="-1.4" x2="0" y2="1.4" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.02" />
                    <line x1="0" y1="0" x2={ux * 1.2} y2={-uy * 1.2} stroke="var(--accent)" strokeWidth="0.06" strokeLinecap="round" />
                    <circle cx={ux * 1.2} cy={-uy * 1.2} r="0.09" fill="var(--accent)" />
                    <circle cx="0" cy="0" r="0.08" fill="currentColor" fillOpacity="0.45" />
                </svg>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">|∇f|</div>
                    <div className="mt-1 font-serif text-base font-black tabular-nums">{magnitude.toFixed(6)}</div>
                </div>
                <div className="space-y-1 font-mono text-xs">
                    {gradient.map((value, index) => (
                        <div key={index}>g{index + 1} = {value.toFixed(5)}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ScalarFieldMapPanel({
    samples,
    point,
    gradient,
    direction,
}: {
    samples: Array<{ x: number; y: number; z: number }>;
    point: { x: number; y: number };
    gradient: number[];
    direction?: number[];
}) {
    if (!samples.length) return null;

    const xMin = Math.min(...samples.map((sample) => sample.x));
    const xMax = Math.max(...samples.map((sample) => sample.x));
    const yMin = Math.min(...samples.map((sample) => sample.y));
    const yMax = Math.max(...samples.map((sample) => sample.y));
    const zMin = Math.min(...samples.map((sample) => sample.z));
    const zMax = Math.max(...samples.map((sample) => sample.z));
    const zSpan = Math.max(1e-9, zMax - zMin);

    const projectX = (x: number) => ((x - xMin) / Math.max(1e-9, xMax - xMin)) * 100;
    const projectY = (y: number) => 100 - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * 100;
    const gradNorm = Math.sqrt((gradient[0] ?? 0) ** 2 + (gradient[1] ?? 0) ** 2) || 1;
    const px = projectX(point.x);
    const py = projectY(point.y);
    const gx = ((gradient[0] ?? 0) / gradNorm) * 14;
    const gy = ((gradient[1] ?? 0) / gradNorm) * 14;

    const directionNorm =
        direction && direction.length >= 2
            ? Math.sqrt((direction[0] ?? 0) ** 2 + (direction[1] ?? 0) ** 2) || 1
            : 1;
    const dx = direction ? ((direction[0] ?? 0) / directionNorm) * 14 : 0;
    const dy = direction ? ((direction[1] ?? 0) / directionNorm) * 14 : 0;

    return (
        <div className="site-outline-card p-4 space-y-3">
            <div className="site-eyebrow text-accent">Scalar Field Map</div>
            <svg viewBox="0 0 100 100" className="w-full rounded-2xl border border-border/40 bg-muted/10">
                {samples.map((sample, index) => {
                    const t = (sample.z - zMin) / zSpan;
                    const red = Math.round(35 + t * 125);
                    const green = Math.round(75 + (1 - t) * 120);
                    const blue = Math.round(180 + t * 35);
                    return (
                        <circle
                            key={`${sample.x}-${sample.y}-${index}`}
                            cx={projectX(sample.x)}
                            cy={projectY(sample.y)}
                            r="1.6"
                            fill={`rgba(${red}, ${green}, ${blue}, 0.72)`}
                        />
                    );
                })}
                <line x1={px} y1={py} x2={px + gx} y2={py - gy} stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx={px + gx} cy={py - gy} r="1.8" fill="var(--accent)" />
                {direction ? (
                    <>
                        <line x1={px} y1={py} x2={px + dx} y2={py - dy} stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="2 2" strokeLinecap="round" />
                        <circle cx={px + dx} cy={py - dy} r="1.5" fill="#f59e0b" />
                    </>
                ) : null}
                <circle cx={px} cy={py} r="1.7" fill="white" stroke="var(--foreground)" strokeWidth="0.5" />
            </svg>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                <div>z min: <span className="font-mono text-foreground">{zMin.toFixed(4)}</span></div>
                <div>z max: <span className="font-mono text-foreground">{zMax.toFixed(4)}</span></div>
            </div>
            <div className="text-[11px] leading-5 text-muted-foreground">
                Accent arrow gradient directionni, dashed orange arrow esa directional lane uchun unit directionni ko&apos;rsatadi.
            </div>
        </div>
    );
}

function HigherOrderPanel({ summary }: { summary: HigherOrderDerivativeSummary }) {
    return (
        <div className="space-y-4">
            <div className="site-outline-card p-4 space-y-3">
                <div className="site-eyebrow text-accent">Derivative Series</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.derivatives.map((value, index) => (
                        <div key={index} className="rounded-xl bg-muted/10 px-3 py-2">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                f{index === 0 ? "" : `^(${index})`}(x0)
                            </div>
                            <div className="mt-1 font-mono text-sm font-bold tabular-nums">{value.toFixed(6)}</div>
                        </div>
                    ))}
                </div>
            </div>
            <CartesianPlot
                title={`Taylor Polynomial T_${summary.maxOrder}(x) vs f(x)`}
                series={[
                    { label: "f(x)", color: "var(--accent)", points: summary.functionSamples },
                    { label: `T_${summary.maxOrder}(x)`, color: "#f59e0b", points: summary.taylorSamples },
                ]}
            />
        </div>
    );
}

function MatrixLanePanel({
    title,
    detail,
    metrics,
}: {
    title: string;
    detail: string;
    metrics: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="site-panel-strong p-5 space-y-5">
            <div className="site-outline-card p-4 space-y-2">
                <div className="site-eyebrow text-accent">{title}</div>
                <div className="text-sm leading-6 text-muted-foreground">{detail}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="site-outline-card p-4">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{metric.label}</div>
                        <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">{metric.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function surfaceGridFromSamples(samples: Array<{ x: number; y: number; z: number }>) {
    const xValues = [...new Set(samples.map((sample) => Number(sample.x.toFixed(6))))].sort((a, b) => a - b);
    const yValues = [...new Set(samples.map((sample) => Number(sample.y.toFixed(6))))].sort((a, b) => a - b);
    const zLookup = new Map(samples.map((sample) => [`${sample.x.toFixed(6)}::${sample.y.toFixed(6)}`, sample.z] as const));

    return {
        x: yValues.map(() => xValues),
        y: yValues.map((y) => xValues.map(() => y)),
        z: yValues.map((y) =>
            xValues.map((x) => zLookup.get(`${x.toFixed(6)}::${y.toFixed(6)}`) ?? null),
        ),
    };
}

export interface VisualizerDeckState {
    summary: unknown;
    analyticSolution?: DifferentialAnalyticSolveResponse | null;
    error: string;
    solveErrorMessage: string;
    expression: string;
    variable: string;
    point: string;
    mode: DifferentialExtendedMode;
    coordinates?: DifferentialCoordinateSystem;
    solvePhase: string;
    isResultStale: boolean;
    stepSweep?: StepSweepEntry[];
}

export function VisualizerDeck({ state }: { state: VisualizerDeckState }) {
    const {
        summary,
        error,
        solveErrorMessage,
        expression,
        variable,
        point,
        mode,
        coordinates = "cartesian",
        solvePhase,
        isResultStale,
        stepSweep = [],
    } = state;

    const vars = variable.split(",").map((entry) => entry.trim()).filter(Boolean);
    const pointValues = point.split(",").map((entry) => Number(entry.trim())).filter(Number.isFinite);
    const staleClass = isResultStale ? "opacity-50 grayscale" : "";
    const laneLabel =
        mode === "derivative"
            ? "2D derivative plot"
            : mode === "partial"
              ? "Gradient field"
              : mode === "directional"
                ? "Directional derivative"
                : mode === "jacobian"
                  ? "Jacobian lane"
                  : mode === "hessian"
                    ? "Hessian lane"
                    : mode === "ode"
                      ? "ODE lane"
                      : mode === "pde"
                        ? "PDE lane"
                        : "SDE lane";

    if (isODE(summary)) {
            return (
                <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                    <div className="mb-3 flex items-center justify-between px-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - ODE Lane</div>
                        {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                    </div>
                    <div className={`site-panel-strong space-y-5 p-5 ${staleClass}`}>
                        <CartesianPlot
                            title="Solution Trajectory"
                            domainX={[summary.x0 - 1, summary.x0 + 6]}
                            series={[{ label: "y(x)", color: "var(--accent)", points: summary.samples }]}
                        />
                        <ODESlopeFieldPanel field={summary.field} trajectory={summary.samples} />
                        <ODEPhasePanel summary={summary} />
                    </div>
                </div>
            );
    }

    if (isPDE(summary)) {
            const pdeGrid = surfaceGridFromSamples(summary.heatmapSamples);
            return (
                <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                    <div className="mb-3 flex items-center justify-between px-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - PDE Lane</div>
                        {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                    </div>
                    <div className={`site-panel-strong space-y-5 p-5 ${staleClass}`}>
                        <PDEHeatmapPanel samples={summary.heatmapSamples} />
                        <ScientificPlot
                            type="surface"
                            title="Space-Time Surface"
                            height={340}
                            data={[
                                {
                                    type: "surface",
                                    x: pdeGrid.x,
                                    y: pdeGrid.y,
                                    z: pdeGrid.z,
                                    colorscale: "Viridis",
                                    showscale: false,
                                },
                            ]}
                            insights={["x-space vs time", "surface height shows field amplitude"]}
                        />
                        <PDEProfilePanel summary={summary} />
                    </div>
                </div>
            );
    }

    if (isSDE(summary)) {
        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - SDE Lane</div>
                    {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                </div>
                <div className={`site-panel-strong space-y-5 p-5 ${staleClass}`}>
                    <SDEEnsemblePanel summary={summary} />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Start</div>
                            <div className="mt-1 font-mono text-sm font-bold tabular-nums">{summary.meanPath[0]?.y.toFixed(6) ?? "n/a"}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Terminal Mean</div>
                            <div className="mt-1 font-mono text-sm font-bold tabular-nums">{summary.terminalMean.toFixed(6)}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ensemble</div>
                            <div className="mt-1 font-mono text-sm font-bold tabular-nums">{summary.pathCount}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!summary && !error && !solveErrorMessage && solvePhase !== "analytic-loading") {
        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-6">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">
                    {mode === "ode" || mode === "pde" || mode === "sde"
                        ? "Bu lane uchun solve natijasi pastdagi analytic/result panellarida chiqadi. Maxsus chart qatlami keyingi bosqichda kengaytiriladi."
                        : "Grafik va audit solve tugagandan keyin shu yerda chiqadi."}
                </div>
            </div>
        );
    }

    if (solvePhase === "analytic-loading") {
        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-6 animate-pulse">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">
                    Hisoblanmoqda...
                </div>
            </div>
        );
    }

    if ((error || solveErrorMessage) && !summary) {
        return (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
                <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-rose-500/70">Error</div>
                    <div className="text-sm text-rose-700 dark:text-rose-300">{error || solveErrorMessage}</div>
                </div>
            );
    }

    if (isDerivative(summary)) {
        const centerX = pointValues[0] ?? 0;
        const series = [
            { label: `f(${vars[0] ?? "x"})`, color: "var(--accent)", points: summary.samples },
            ...(summary.tangentSamples.length ? [{ label: "Tangent line", color: "#10b981", points: summary.tangentSamples }] : []),
        ];

        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
                    <div className="flex gap-2">
                        <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{laneLabel}</span>
                        {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                    </div>
                </div>
                <div className={`site-panel-strong space-y-5 p-5 ${staleClass}`}>
                    <CartesianPlot title={`f(${vars[0] ?? "x"}) = ${expression}`} domainX={[centerX - 10, centerX + 10]} series={series} />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="site-outline-card border-accent/20 bg-accent/5 p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-accent">Slope</div>
                            <div className="mt-1 font-serif text-xl font-black tabular-nums">{summary.derivativeAtPoint.toFixed(6)}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">f(x0)</div>
                            <div className="mt-1 font-serif text-xl font-black tabular-nums">{summary.valueAtPoint.toFixed(6)}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Intercept</div>
                            <div className="mt-1 font-serif text-xl font-black tabular-nums">{summary.tangentLine.intercept.toFixed(5)}</div>
                        </div>
                        <div className="site-outline-card p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Point</div>
                            <div className="mt-1 font-serif text-xl font-black tabular-nums">{point}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isHigherOrder(summary)) {
        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - Taylor Series</div>
                    {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                </div>
                <div className={`site-panel-strong p-5 ${staleClass}`}>
                    <HigherOrderPanel summary={summary} />
                </div>
            </div>
        );
    }

    if (isGradient(summary) || isDirectional(summary)) {
        const fieldSamples =
            vars.length >= 2 && pointValues.length >= 2
                ? DifferentialMathService.buildScalarFieldSamples(expression, vars, pointValues, 18, 18, coordinates)
                : [];
        const tangentPlaneSamples =
            vars.length >= 2 && pointValues.length >= 2
                ? DifferentialMathService.buildTangentPlaneSamples(
                    {
                        x: pointValues[0] ?? 0,
                        y: pointValues[1] ?? 0,
                        z: summary.valueAtPoint,
                    },
                    summary.gradient,
                    16,
                    16,
                    3,
                )
                : [];
        const fieldGrid = fieldSamples.length > 0 ? surfaceGridFromSamples(fieldSamples) : null;
        const tangentGrid = tangentPlaneSamples.length > 0 ? surfaceGridFromSamples(tangentPlaneSamples) : null;

        const directionVector = isDirectional(summary) ? summary.unitDirection : undefined;
        const dirValue = isDirectional(summary) ? summary.directionalDerivative : null;
        const sliceSeries: Array<{ label: string; color: string; points: PlotPoint[] }> = summary.samples.length
            ? [{ label: `f(${vars[0] ?? "x"}, ...)`, color: "var(--accent)", points: summary.samples }]
            : [];

        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - {laneLabel}</div>
                    {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                </div>
                <div className={`site-panel-strong space-y-5 p-5 ${staleClass}`}>
                    {sliceSeries.length > 0 && (
                        <CartesianPlot
                            title={`Slice along ${vars[0] ?? "x"}`}
                            domainX={[(pointValues[0] ?? 0) - 10, (pointValues[0] ?? 0) + 10]}
                            series={sliceSeries}
                        />
                    )}
                    {fieldSamples.length > 0 && (
                        <ScientificPlot
                            type="surface"
                            title={vars.length >= 3 ? "3D Slice Surface (first two variables)" : "3D Surface + Tangent Plane"}
                            height={360}
                            data={[
                                {
                                    type: "surface",
                                    name: "Scalar field",
                                    x: fieldGrid?.x,
                                    y: fieldGrid?.y,
                                    z: fieldGrid?.z,
                                    colorscale: "Viridis",
                                    opacity: 0.9,
                                    showscale: false,
                                    hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>",
                                },
                                {
                                    type: "surface",
                                    name: "Tangent plane",
                                    x: tangentGrid?.x,
                                    y: tangentGrid?.y,
                                    z: tangentGrid?.z,
                                    colorscale: [
                                        [0, "rgba(245,158,11,0.22)"],
                                        [1, "rgba(245,158,11,0.52)"],
                                    ],
                                    opacity: 0.55,
                                    showscale: false,
                                    hovertemplate: "plane x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>",
                                },
                            ]}
                            insights={[
                                vars.length >= 3 ? "remaining variables fixed at evaluation point" : "local surface around evaluation point",
                                "amber plane shows first-order local approximation",
                            ]}
                        />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fieldSamples.length > 0 ? (
                            <ScalarFieldMapPanel
                                samples={fieldSamples}
                                point={{ x: pointValues[0] ?? 0, y: pointValues[1] ?? 0 }}
                                gradient={summary.gradient}
                                direction={directionVector}
                            />
                        ) : (
                            <GradientArrowPanel summary={summary} />
                        )}
                        <GradientArrowPanel summary={summary} />
                        <div className="site-outline-card p-4 space-y-3">
                            <div className="site-eyebrow text-accent">Gradient Metrics</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">|∇f|</span>
                                    <span className="font-mono font-bold tabular-nums">{summary.magnitude.toFixed(6)}</span>
                                </div>
                                {summary.gradient.map((value, index) => (
                                    <div key={index} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">∂f/∂{vars[index] ?? `x${index + 1}`}</span>
                                        <span className="font-mono font-bold tabular-nums">{value.toFixed(6)}</span>
                                    </div>
                                ))}
                                {dirValue !== null && (
                                    <div className="flex justify-between border-t border-border/40 pt-2 text-xs">
                                        <span className="text-accent">D_u f</span>
                                        <span className="font-mono font-bold text-accent tabular-nums">{dirValue.toFixed(6)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {stepSweep.length > 0 && <StepSweepTable entries={stepSweep} />}
                </div>
            </div>
        );
    }

    if (isJacobian(summary)) {
        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - Jacobian Lane</div>
                    {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                </div>
                <div className={staleClass}>
                    <MatrixLanePanel
                        title="Jacobian Structure"
                        detail="Jacobian uchun asosiy foydali chiqish matritsaning o'zi. Shu sabab visualizer endi matrixni qayta tiqmaydi; u Solve ichida alohida ko'rsatiladi."
                        metrics={[
                            { label: "det(J)", value: summary.determinant !== null ? summary.determinant.toFixed(4) : "N/A" },
                            { label: "tr(J)", value: summary.trace !== null ? summary.trace.toFixed(4) : "N/A" },
                            { label: "Size", value: `${summary.size.rows}x${summary.size.cols}` },
                            { label: "F(p)", value: `[${summary.valueAtPoint.map((value) => value.toFixed(3)).join(", ")}]` },
                        ]}
                    />
                </div>
            </div>
        );
    }

    if (isHessian(summary)) {
        const signatureTone: "ok" | "warn" | "rough" =
            summary.eigenvalueSignature === "positive_definite" || summary.eigenvalueSignature === "negative_definite"
                ? "ok"
                : summary.eigenvalueSignature === "indefinite"
                  ? "warn"
                  : "rough";

        return (
            <div className="rounded-3xl border border-border/60 bg-background/45 p-3 xl:sticky xl:top-24">
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck - Hessian Lane</div>
                    {isResultStale && <StabilityBadge label="Stale" tone="warn" />}
                </div>
                <div className={`space-y-5 ${staleClass}`}>
                    <MatrixLanePanel
                        title="Hessian Curvature"
                        detail="Hessian ham grafikdan ko'ra curvature audit sifatida foydaliroq. To'liq matrix Solve bo'limida qoladi, visualizer esa signature va kritik nuqta xulosasini ushlaydi."
                        metrics={[
                            { label: "det(H)", value: summary.determinant.toFixed(4) },
                            { label: "tr(H)", value: summary.trace.toFixed(4) },
                            { label: "f(p)", value: summary.valueAtPoint.toFixed(5) },
                            { label: "Signature", value: summary.eigenvalueSignature.replace(/_/g, " ") },
                        ]}
                    />
                    <div className="site-outline-card border-indigo-500/20 bg-indigo-500/5 p-4">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Critical Point Classification</div>
                        <div className="text-sm font-bold">{summary.criticalPointType}</div>
                        <div className="mt-2">
                            <StabilityBadge label={summary.eigenvalueSignature.replace(/_/g, " ")} tone={signatureTone} />
                        </div>
                    </div>
                    {stepSweep.length > 0 && <StepSweepTable entries={stepSweep} />}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-background/45 p-6">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Visualizer Deck</div>
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">
                Natija ko&apos;rinishi bu lane uchun hali tayyor emas.
            </div>
        </div>
    );
}
