import { expect, test } from "@playwright/test";

test.describe("Product smoke", () => {
    test("homepage presents product-grade hero and surface map", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: /Matematik natijani tayyor ilmiy ishga aylantiring/i })).toBeVisible();
        await expect(page.getByText(/hisoblash, tekshirish, vizualizatsiya, report/i)).toBeVisible();
        await expect(page.getByRole("link", { name: /Laboratory ochish/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /^Writer$/i })).toBeVisible();
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
        await expect(page.getByRole("button", { name: /Create|Yangi qoralama yaratish/i }).first()).toBeVisible();
        await expect(page.getByText(/Hujjatlar arxivi|Backend ulanmagan|Arxiv servisi hozir javob bermayapti|Arxivni yuklashda xatolik/i)).toBeVisible();
    });

    test("writer new draft workspace opens and renders editor shell", async ({ page }) => {
        await page.goto("/write/new");

        await expect(page.getByText("Section Editor")).toBeVisible();
        await page.getByRole("button", { name: "Tools", exact: true }).click();
        await expect(page.getByText("Import Saved Result")).toBeVisible();
        await expect(page.getByRole("button", { name: "Preview", exact: true })).toBeVisible();
    });
});
