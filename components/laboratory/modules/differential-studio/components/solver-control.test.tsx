import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SolverControl } from "./solver-control";

describe("SolverControl advanced guided forms", () => {
    it("updates SDE draft fields through the guided form", async () => {
        const user = userEvent.setup();
        const setExpression = vi.fn();
        const setPoint = vi.fn();
        const setVariable = vi.fn();

        render(
            <SolverControl
                state={{
                    expression: "dX = 0.4*X*dt + 0.2*X*dW",
                    variable: "t",
                    point: "X(0)=1; t:[0,1]; n=200",
                    order: "1",
                    direction: "1, 0",
                    coordinates: "cartesian",
                    mode: "sde",
                    solvePhase: "idle",
                    isResultStale: false,
                    classification: {
                        kind: "sde_candidate",
                        label: "SDE candidate",
                        support: "supported",
                        summary: "Stochastic lane",
                        notes: [],
                    },
                }}
                actions={{
                    setExpression,
                    setVariable,
                    setPoint,
                    setOrder: vi.fn(),
                    setDirection: vi.fn(),
                    setMode: vi.fn(),
                    requestSolve: vi.fn(),
                }}
            />,
        );

        const inputs = screen.getAllByRole("textbox");
        const driftInput = inputs.find((input) => input.getAttribute("placeholder") === "0.4*X");
        expect(driftInput).toBeTruthy();

        await user.clear(driftInput!);
        await user.type(driftInput!, "0.6*X");
        await new Promise((resolve) => window.setTimeout(resolve, 380));

        expect(setExpression).toHaveBeenCalled();
    });
});
