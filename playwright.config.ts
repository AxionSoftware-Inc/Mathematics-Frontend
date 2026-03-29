import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    expect: {
        timeout: 8_000,
    },
    fullyParallel: true,
    retries: 0,
    use: {
        baseURL: "http://127.0.0.1:3005",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    webServer: {
        command:
            'powershell -NoProfile -Command "if (!(Test-Path .next\\BUILD_ID)) { npm.cmd run build | Out-Host }; npm.cmd run start -- --hostname 127.0.0.1 --port 3005"',
        url: "http://127.0.0.1:3005",
        reuseExistingServer: true,
        timeout: 120_000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
