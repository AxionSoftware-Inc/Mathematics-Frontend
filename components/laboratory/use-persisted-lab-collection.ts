"use client";

import React from "react";

import { readStoredArray, writeStoredValue } from "@/components/laboratory/persisted-lab-state";

export function usePersistedLabCollection<T>(storageKey: string) {
    const [items, setItems] = React.useState<T[]>(() => readStoredArray<T>(storageKey));

    React.useEffect(() => {
        writeStoredValue(storageKey, items);
    }, [items, storageKey]);

    return [items, setItems] as const;
}
