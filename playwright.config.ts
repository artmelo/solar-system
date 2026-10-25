import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  timeout: 60000,
});
