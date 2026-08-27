import { expect, test } from "@playwright/test";

test.describe("Laboratory product smoke", () => {
    test("root renders the Laboratory landing page", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { name: /Mathematics, made visible\./i })).toBeVisible();
        await expect(page.getByRole("link", { name: "Open Laboratory" }).first()).toBeVisible();
        await expect(page.getByText("Integral Studio").first()).toBeVisible();
    });

    test("laboratory index loads curated studios without backend", async ({ page }) => {
        await page.goto("/laboratory");

        await expect(page.getByRole("heading", { name: "Focused mathematical workspaces." })).toBeVisible();
        await expect(page.getByRole("link", { name: /Integral Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Differential Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Probability Studio/i })).toBeVisible();
    });
});
