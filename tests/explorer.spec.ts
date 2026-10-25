import { test, expect } from "@playwright/test";
test("explore, time travel, scales and learning activities", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:5173");
  await expect(
    page.getByRole("heading", { name: "Your place in space." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "test-results/explorer-desktop.png" });
  await page.getByLabel("Search planets and moons").fill("Earth");
  await page
    .getByRole("button", { name: "Earth Solar system", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Years", exact: true }).click();
  await page.getByLabel("Play simulation").click();
  await page.waitForTimeout(300);
  await page.getByLabel("Pause simulation").click();
  await page.getByRole("button", { name: "Realistic", exact: true }).click();
  await expect(
    page.getByText("True relative distances and radii.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Educational", exact: true }).click();
  await page
    .getByRole("button", { name: "Orbit Detective", exact: true })
    .click();
  await page.getByRole("button", { name: "Mercury", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Correct!");
  await page.getByRole("button", { name: "Moon Dance", exact: true }).click();
  await expect(page.getByRole("combobox")).toHaveValue("Jupiter");
  await page.getByRole("button", { name: "Io ↗", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Io", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search planets and moons").fill("S/2009 S1");
  await page
    .getByRole("button", {
      name: "S/2009 S1 Saturn · orbit unavailable",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Incomplete orbital record.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: false }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/explorer-mobile.png",
    fullPage: true,
  });
  await expect(page.getByLabel("Play simulation")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]) {
  test(`mobile controls and panels fit ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("http://localhost:5173");
    for (const mode of ["Explore", "Moon Dance", "Orbit Detective"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      const layout = await page.evaluate(() => {
        const panels = [
          "header",
          ".universe",
          ".scene-tools",
          ".timeline",
          "aside",
        ].map((selector) =>
          document.querySelector(selector)!.getBoundingClientRect(),
        );
        return {
          width: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
          ordered: panels.every(
            (rect, index) =>
              index === 0 || rect.top >= panels[index - 1].bottom - 1,
          ),
          sceneHeight: panels[1].height,
        };
      });
      expect(layout.content).toBeLessThanOrEqual(layout.width);
      expect(layout.ordered).toBe(true);
      expect(layout.sceneHeight).toBeGreaterThanOrEqual(250);
      for (const label of ["Play simulation", "Choose date"]) {
        const bounds = await page
          .getByLabel(label, { exact: true })
          .boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.getByRole("button", { name: "Moon Dance", exact: true }).click();
    await page.getByRole("combobox").selectOption("Saturn");
    await page
      .getByRole("button", { name: "Details: Saturn ↓", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Saturn", exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "↑ Back to space", exact: true })
      .click();
    await expect(page.locator("canvas")).toBeInViewport();
  });
}
