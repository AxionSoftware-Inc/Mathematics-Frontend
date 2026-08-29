import React from "react";

import { AxBadge, AxButton, AxDisclosure, AxField, AxInput, AxPanel, AxSelect, AxTextarea } from "@/components/axion";
import type { DifferentialClassification, DifferentialExtendedMode } from "../types";

const modeCopy: Record<DifferentialExtendedMode, { title: string; helper: string; expression: string; variable: string; point: string }> = {
    derivative: { title: "Derivative", helper: "Differentiate a scalar function and inspect its local rate of change.", expression: "sin(x) * x^2", variable: "x", point: "1" },
    partial: { title: "Partial derivative", helper: "Differentiate a multivariable scalar field along selected variables.", expression: "x^2 + y*sin(x)", variable: "x, y", point: "1, 2" },
    directional: { title: "Directional derivative", helper: "Measure a scalar field along a chosen direction vector.", expression: "x^2 + y^2", variable: "x, y", point: "1, 1" },
    jacobian: { title: "Jacobian", helper: "Inspect local linear behavior of a vector-valued function.", expression: "[sin(x*y), x+y]", variable: "x, y", point: "1, 2" },
    hessian: { title: "Hessian", helper: "Inspect second-order curvature of a scalar field.", expression: "(1 - x)^2 + 100*(y - x^2)^2", variable: "x, y", point: "0, 0" },
    ode: { title: "ODE", helper: "Solve or simulate an ordinary differential equation with optional initial data.", expression: "y' = x + y; y(0)=1", variable: "x", point: "y(0)=1" },
    pde: { title: "PDE", helper: "Analyze a compact PDE relation and its numerical lane.", expression: "u_t = u_x; u(x,0)=sin(x)", variable: "x, t", point: "u(x,0)=sin(x)" },
    sde: { title: "SDE", helper: "Simulate a stochastic differential equation and inspect ensemble behavior.", expression: "dX = 0.4*X*dt + 0.2*X*dW; X(0)=1; t:[0,1]; n=200", variable: "t", point: "X(0)=1; t:[0,1]; n=200" },
};

const modes: Array<{ value: DifferentialExtendedMode; label: string }> = [
    { value: "derivative", label: "Derivative" },
    { value: "partial", label: "Partial" },
    { value: "directional", label: "Directional" },
    { value: "jacobian", label: "Jacobian" },
    { value: "hessian", label: "Hessian" },
    { value: "ode", label: "ODE" },
    { value: "pde", label: "PDE" },
    { value: "sde", label: "SDE" },
];

export type DifferentialProblemComposerV2Props = {
    state: {
        expression: string;
        variable: string;
        point: string;
        order: string;
        direction: string;
        mode: DifferentialExtendedMode;
        solvePhase: string;
        isResultStale: boolean;
        classification: DifferentialClassification;
    };
    actions: {
        setExpression: (value: string) => void;
        setVariable: (value: string) => void;
        setPoint: (value: string) => void;
        setOrder: (value: string) => void;
        setDirection: (value: string) => void;
        setMode: (value: DifferentialExtendedMode) => void;
        requestSolve: () => void;
    };
};

export function DifferentialProblemComposerV2({ state, actions }: DifferentialProblemComposerV2Props) {
    const [expression, setExpression] = React.useState(state.expression);
    const [variable, setVariable] = React.useState(state.variable);
    const [point, setPoint] = React.useState(state.point);
    const [order, setOrder] = React.useState(state.order);
    const [direction, setDirection] = React.useState(state.direction);
    const meta = modeCopy[state.mode];

    React.useEffect(() => setExpression(state.expression), [state.expression]);
    React.useEffect(() => setVariable(state.variable), [state.variable]);
    React.useEffect(() => setPoint(state.point), [state.point]);
    React.useEffect(() => setOrder(state.order), [state.order]);
    React.useEffect(() => setDirection(state.direction), [state.direction]);

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            if (expression !== state.expression) actions.setExpression(expression);
            if (variable !== state.variable) actions.setVariable(variable);
            if (point !== state.point) actions.setPoint(point);
            if (order !== state.order) actions.setOrder(order);
            if (direction !== state.direction) actions.setDirection(direction);
        }, 280);
        return () => window.clearTimeout(timer);
    }, [actions, direction, expression, order, point, state.direction, state.expression, state.order, state.point, state.variable, variable]);

    const flush = () => {
        actions.setExpression(expression);
        actions.setVariable(variable);
        actions.setPoint(point);
        actions.setOrder(order);
        actions.setDirection(direction);
    };

    const solving = state.solvePhase === "analytic-loading";
    const showOrder = state.mode === "derivative";
    const showDirection = state.mode === "directional";
    const status = solving ? "Analyzing" : state.isResultStale ? "Needs update" : state.solvePhase === "exact-ready" ? "Exact ready" : state.solvePhase === "numerical-ready" ? "Numerical ready" : "Ready";
    const statusTone = solving || state.isResultStale ? "warning" : state.solvePhase === "exact-ready" || state.solvePhase === "numerical-ready" ? "success" : "neutral";

    return (
        <AxPanel className="overflow-hidden">
            <div className="border-b border-[var(--ax-line)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-accent)]">Problem</div>
                        <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[var(--ax-text)]">{meta.title}</div>
                    </div>
                    <AxBadge tone={statusTone}>{status}</AxBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--ax-text-soft)]">{meta.helper}</p>
            </div>

            <div className="space-y-4 p-4">
                <AxField label="Operation">
                    <AxSelect
                        data-testid="diff-mode-select"
                        value={state.mode}
                        onChange={(event) => actions.setMode(event.target.value as DifferentialExtendedMode)}
                        className="text-[12px] font-semibold"
                    >
                        {modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </AxSelect>
                </AxField>

                <AxField label="Expression / equation">
                    <AxTextarea
                        data-testid="diff-expression-input"
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                        onBlur={flush}
                        rows={5}
                        spellCheck={false}
                        placeholder={meta.expression}
                        className="min-h-[124px] bg-[var(--ax-surface)] font-mono text-[13px]"
                    />
                </AxField>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <AxField label="Variable(s)">
                        <AxInput
                            data-testid="diff-variable-input"
                            value={variable}
                            onChange={(event) => setVariable(event.target.value)}
                            onBlur={flush}
                            placeholder={meta.variable}
                            spellCheck={false}
                            className="font-mono text-[12px]"
                        />
                    </AxField>
                    <AxField label="Point / condition">
                        <AxInput
                            data-testid="diff-point-input"
                            value={point}
                            onChange={(event) => setPoint(event.target.value)}
                            onBlur={flush}
                            placeholder={meta.point}
                            spellCheck={false}
                            className="font-mono text-[12px]"
                        />
                    </AxField>
                </div>

                <AxButton
                    data-testid="diff-solve-button"
                    variant="primary"
                    disabled={solving}
                    onClick={() => {
                        flush();
                        window.setTimeout(actions.requestSolve, 0);
                    }}
                    className="w-full disabled:cursor-wait"
                >
                    {solving ? "Analyzing…" : state.isResultStale ? "Update solution" : "Solve"}
                </AxButton>

                <AxDisclosure title="Advanced settings" hint="Order, direction and detected differential structure">
                    <div className="space-y-3">
                        {showOrder ? (
                            <AxField label="Derivative order">
                                <AxInput data-testid="diff-order-input" value={order} onChange={(event) => setOrder(event.target.value)} onBlur={flush} className="h-9 font-mono text-[11px]" />
                            </AxField>
                        ) : null}
                        {showDirection ? (
                            <AxField label="Direction vector">
                                <AxInput data-testid="diff-direction-input" value={direction} onChange={(event) => setDirection(event.target.value)} onBlur={flush} placeholder="1, 0" className="h-9 font-mono text-[11px]" />
                            </AxField>
                        ) : null}
                        <div className="rounded-[var(--ax-radius-control)] bg-[var(--ax-surface-soft)] px-3 py-2 text-[11px] leading-5 text-[var(--ax-text-soft)]">
                            <div className="font-semibold text-[var(--ax-text)]">{state.classification.label}</div>
                            <div className="mt-1">{state.classification.summary}</div>
                        </div>
                    </div>
                </AxDisclosure>
            </div>
        </AxPanel>
    );
}
