"use client";

import { useEffect, useMemo } from "react";
import { useLabEngine, type LabDataset, type LabVisualizationType } from "./lab-engine";

/**
 * Hook to easily register a dataset with the LabEngine.
 * Automatically handles registration and unregistration.
 */
export function useLabPlot(
    id: string,
    label: string,
    type: LabVisualizationType,
    data: any[],
    options?: { color?: string; visible?: boolean }
) {
    const { registerDataset, unregisterDataset } = useLabEngine();

    const memoizedData = useMemo(() => data, [data]);

    useEffect(() => {
        const dataset: LabDataset = {
            id,
            label,
            type,
            data: memoizedData,
            ...options,
        };
        registerDataset(dataset);

        return () => unregisterDataset(id);
    }, [id, label, type, memoizedData, options, registerDataset, unregisterDataset]);
}
