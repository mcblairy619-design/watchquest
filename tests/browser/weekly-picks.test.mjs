import assert from "node:assert/strict";
import { browserTest } from "./support/harness.mjs";
import {
  mockCatalogue,
  providerTitle,
  seedStorage,
  subscribedProfile,
} from "./support/fixtures.mjs";

browserTest(
  "weekly replacement changes one slot, survives reload and keeps the old week in history",
  async ({ newPage, url }) => {
    const page = await newPage();
    let checkedAt = "2026-11-23T12:00:00.000Z";
    await page.clock.setFixedTime(new Date(checkedAt));
    await seedStorage(page, { profile: subscribedProfile() });
    await mockCatalogue(page, {
      async handle({ route, path }) {
        if (path !== "") return;
        const titles = Array.from({ length: 7 }, (_, index) =>
          providerTitle({
            id: "motn-weekly-" + index,
            name: "Weekly fixture " + index,
            type: index === 6 ? "Series" : "Film",
            checkedAt,
          }),
        );
        await route.fulfill({ json: { titles } });
        return true;
      },
    });
    const weekly = page.locator(".weekly");
    const names = () => weekly.locator(".card h3").allTextContents();
    await page.goto(url);
    await weekly.getByText("Week of 2026-11-23", { exact: false }).waitFor();
    await weekly
      .getByRole("button", { name: "Replace Weekly fixture 0" })
      .click();
    await weekly.getByText("Replaced one pick.", { exact: false }).waitFor();
    const expected = [
      "Weekly fixture 5",
      "Weekly fixture 1",
      "Weekly fixture 2",
      "Weekly fixture 3",
      "Weekly fixture 4",
      "Weekly fixture 6",
    ];
    assert.deepEqual(await names(), expected);
    await page.reload();
    await weekly
      .getByRole("button", { name: "View Weekly fixture 5" })
      .waitFor();
    assert.deepEqual(await names(), expected);
    checkedAt = "2026-11-30T00:01:00.000Z";
    await page.clock.setFixedTime(new Date(checkedAt));
    await page.reload();
    await weekly.getByText("Week of 2026-11-30", { exact: false }).waitFor();
    await weekly
      .getByRole("button", { name: "View Weekly fixture 0" })
      .waitFor();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Movie DNA" })
      .click();
    await page.getByText("Week of 2026-11-23", { exact: false }).click();
    await page
      .getByText("Replaced during the week: Weekly fixture 0", {
        exact: true,
      })
      .waitFor();
  },
);
