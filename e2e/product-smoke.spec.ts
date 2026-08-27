import { expect, test } from "@playwright/test";

test.describe("Laboratory product smoke", () => {
    test("root redirects into Laboratory", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/laboratory$/);
    });

    test("laboratory index loads curated studios without backend", async ({ page }) => {
        await page.goto("/laboratory");

        await expect(page.getByRole("heading", { name: "Professional Computational Workspaces." })).toBeVisible();
        await expect(page.getByRole("link", { name: /Integral Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Differential Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Probability Studio/i })).toBeVisible();
    });
});
