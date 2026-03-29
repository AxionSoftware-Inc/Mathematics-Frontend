import { expect, test } from "@playwright/test";

test.describe("Product smoke", () => {
    test("homepage presents product-grade hero and surface map", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: /analytical workflow in one premium system/i })).toBeVisible();
        await expect(page.getByText("MathSphere is being shaped as a serious product for mathematical work")).toBeVisible();
        await expect(page.getByRole("link", { name: /Explore Laboratory/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Enter Writer/i })).toBeVisible();
    });

    test("laboratory index loads curated studios without backend", async ({ page }) => {
        await page.goto("/laboratory");

        await expect(page.getByRole("heading", { name: "Professional Computational Workspaces." })).toBeVisible();
        await expect(page.getByRole("link", { name: /Integral Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Differential Studio/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /Probability Studio/i })).toBeVisible();
    });

    test("writer archive handles backend absence gracefully", async ({ page }) => {
        await page.goto("/write");

        await expect(page.getByText("MathSphere Writer")).toBeVisible();
        await expect(page.getByRole("button", { name: /Yangi hujjat/i })).toBeVisible();
        await expect(page.getByText(/Backend ulanmagan|Arxiv servisi hozir javob bermayapti|Arxivni yuklashda xatolik/i)).toBeVisible();
    });

    test("writer new draft workspace opens and renders editor shell", async ({ page }) => {
        await page.goto("/write/new");

        await expect(page.getByText("Section Editor")).toBeVisible();
        await expect(page.getByText("Import Saved")).toBeVisible();
        await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
    });
});
