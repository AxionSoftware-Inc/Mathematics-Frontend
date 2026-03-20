import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DifferentialLabModule } from "./differential-lab";

vi.mock("@/components/laboratory/cartesian-plot", () => ({
    CartesianPlot: ({ title }: { title?: string }) => <div data-testid="cartesian-plot">{title || "cartesian"}</div>,
}));

vi.mock("@/components/laboratory/scientific-plot", () => ({
    ScientificPlot: ({ title }: { title?: string }) => <div data-testid="scientific-plot">{title || "scientific"}</div>,
}));

vi.mock("@/components/live-writer-bridge/laboratory-bridge-card", () => ({
    LaboratoryBridgeCard: () => <div data-testid="bridge-card">bridge</div>,
}));

vi.mock("@/components/live-writer-bridge/use-live-writer-targets", () => ({
    useLiveWriterTargets: () => ({
        liveTargets: [],
        selectedLiveTargetId: "",
        setSelectedLiveTargetId: vi.fn(),
    }),
}));

describe("DifferentialLabModule", () => {
    it("switches between presets without runtime errors", async () => {
        const user = userEvent.setup();

        render(
            <DifferentialLabModule
                module={{
                    id: "differential-lab",
                    slug: "differential-lab",
                    title: "Differensial laboratoriya",
                    summary: "summary",
                    category: "differential",
                    computation_mode: "client",
                }}
            />,
        );

        expect(screen.queryByText("Hisoblash xatosi")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Van der Pol Oscillator/i }));
        expect(screen.queryByText("Hisoblash xatosi")).not.toBeInTheDocument();
        expect(screen.getByTestId("cartesian-plot")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Lorenz Attractor/i }));
        expect(screen.queryByText("Hisoblash xatosi")).not.toBeInTheDocument();
        expect(screen.getByTestId("scientific-plot")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Logistic Growth/i }));
        expect(screen.queryByText("Hisoblash xatosi")).not.toBeInTheDocument();
        expect(screen.getByTestId("cartesian-plot")).toBeInTheDocument();
    });
});
