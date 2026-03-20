import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchLaboratoryModule, fetchLaboratoryModules, fallbackLaboratoryModules } from "./laboratory";

const { fetchPublicMock } = vi.hoisted(() => ({
    fetchPublicMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    fetchPublic: fetchPublicMock,
}));

afterEach(() => {
    fetchPublicMock.mockReset();
});

describe("laboratory data fetchers", () => {
    it("returns an empty array when the backend returns no modules", async () => {
        fetchPublicMock.mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        await expect(fetchLaboratoryModules()).resolves.toEqual([]);
        expect(fetchPublicMock).toHaveBeenCalledWith("/api/laboratory/modules/?project=quantum-uz", { next: { revalidate: 60 } });
    });

    it("falls back to local metadata when module fetch fails", async () => {
        fetchPublicMock.mockResolvedValue({
            ok: false,
        });

        await expect(fetchLaboratoryModule("matrix-workbench")).resolves.toEqual(fallbackLaboratoryModules[0]);
        expect(fetchPublicMock).toHaveBeenCalledWith("/api/laboratory/modules/matrix-workbench/?project=quantum-uz", { next: { revalidate: 60 } });
    });
});
