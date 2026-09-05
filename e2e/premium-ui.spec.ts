import { expect, test } from "@playwright/test";

async function ready(page: import("@playwright/test").Page) {
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(120);
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
    const metrics = await page.evaluate(() => ({
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
}

test("premium landing keeps its visual contract", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ready(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header.ax-premium-nav")).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("mathematics-landing.png"), fullPage: true, animations: "disabled" });
});

test("laboratory index stays inside the premium workspace grid", async ({ page }, testInfo) => {
    await page.goto("/laboratory", { waitUntil: "domcontentloaded" });
    await ready(page);
    await expect(page.getByRole("heading", { level: 1, name: /focused mathematical workspaces/i })).toBeVisible();
    await expect(page.locator(".ax-work-list")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("mathematics-laboratory.png"), fullPage: true, animations: "disabled" });
});
