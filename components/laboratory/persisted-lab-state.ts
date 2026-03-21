"use client";

export function readStoredArray<T>(storageKey: string): T[] {
    if (typeof window === "undefined") {
        return [];
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

export function writeStoredValue<T>(storageKey: string, value: T) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
}
