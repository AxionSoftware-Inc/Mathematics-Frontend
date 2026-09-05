import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 45_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: "http://127.0.0.1:3005",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    webServer: {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3005",
        url: "http://127.0.0.1:3005",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    projects: [
        {
            name: "chromium",
            testIgnore: /premium-ui\.spec\.ts/,
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "premium-desktop",
            testMatch: /premium-ui\.spec\.ts/,
            use: { viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" },
        },
        {
            name: "premium-mobile",
            testMatch: /premium-ui\.spec\.ts/,
            use: { ...devices["iPhone 13"], reducedMotion: "reduce" },
        },
    ],
});
