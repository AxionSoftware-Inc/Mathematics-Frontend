import React from "react";

import { IntegralSpatialCanvas } from "./integral-spatial-canvas";
import { VisualizerDeck } from "./visualizer-deck";
import type { DoubleIntegralSummary, TripleIntegralSummary } from "../types";

export function IntegralPrimaryVisualization(props: React.ComponentProps<typeof VisualizerDeck>) {
    const preview = props.previewVisualization as { kind?: string } | null;

    if (
        props.mode === "single" ||
        !props.summary ||
        props.isResultStale ||
        preview?.kind === "geometry"
    ) {
        return <VisualizerDeck {...props} />;
    }

    if (props.mode === "double") {
        const summary = props.summary as DoubleIntegralSummary;
        return (
            <IntegralSpatialCanvas
                kind="surface"
                points={summary.samples}
                height={500}
                label="Double integral surface"
            />
        );
    }

    const summary = props.summary as TripleIntegralSummary;
    return (
        <IntegralSpatialCanvas
            kind="volume"
            points={summary.samples}
            height={500}
            label="Triple integral volume"
        />
    );
}
