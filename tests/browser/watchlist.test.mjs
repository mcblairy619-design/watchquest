import assert from "node:assert/strict";
import { browserTest } from "./support/harness.mjs";
import {
  mockCatalogue,
  providerTitle,
  seedStorage,
  subscribedProfile,
} from "./support/fixtures.mjs";

browserTest(
  "saved and watched demo titles persist and unlock achievements",
  async ({ newPage, url }) => {
    const page = await newPage();
    await page.goto(url);
    const desktopNav = page.getByRole("navigation", {
      name: "Main navigation",
    });
    assert.ok(await desktopNav.isVisible());
    await page.getByRole("button", { name: "Save Last Orbit" }).click();
    await desktopNav.getByRole("link", { name: "My Watchlist" }).click();
    await page.reload();
    await page.getByRole("button", { name: "View Last Orbit" }).click();
    await page.getByRole("button", { name: "Mark as watched" }).click();
    await page.keyboard.press("Escape");
    await desktopNav.getByRole("link", { name: "Achievements" }).click();
    for (const name of ["First Save", "First Film"]) {
      await page
        .locator(".panel")
        .filter({ has: page.getByRole("heading", { name, exact: true }) })
        .getByText("Unlocked in this demo")
        .waitFor();
    }
    await desktopNav.getByRole("link", { name: "My Watchlist" }).click();
    await page.reload();
    await page.getByRole("button", { name: "View Last Orbit" }).click();
    await page.getByRole("button", { name: "Mark as unwatched" }).waitFor();
  },
);

browserTest(
  "legacy watch history resolves unknown title types without losing a demo save",
  async ({ newPage, url }) => {
    const page = await newPage();
    const film = providerTitle();
    const legacyLookups = [];
    await seedStorage(page, { profile: subscribedProfile(), saved: ["orbit"] });
    await mockCatalogue(page, {
      titles: [film],
      async handle({ route, path }) {
        if (path === "/motn-legacy-series") {
          legacyLookups.push("series");
          await route.fulfill({
            json: { title: { id: "motn-legacy-series", type: "Series" } },
          });
          return true;
        }
        if (path === "/motn-fixture-film") legacyLookups.push("film");
      },
    });
    await page.goto(url);
    await page.getByRole("button", { name: "View Provider Fixture" }).click();
    await page.getByRole("button", { name: "Mark as watched" }).click();
    await page.keyboard.press("Escape");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const unlocked = page
      .locator(".panel")
      .filter({
        has: page.getByRole("heading", { name: "First Film", exact: true }),
      })
      .getByText("Unlocked in this demo");
    await navigation.getByRole("link", { name: "Achievements" }).click();
    await unlocked.waitFor();
    assert.deepEqual(legacyLookups, []);
    await page.reload();
    await unlocked.waitFor();
    assert.deepEqual(legacyLookups, []);
    await page.evaluate(() => {
      globalThis.localStorage.setItem(
        "sg-phase1-watched",
        '["motn-legacy-series","motn-fixture-film"]',
      );
      globalThis.localStorage.removeItem("sg-phase1-watched-types");
    });
    await page.reload();
    await unlocked.waitFor();
    assert.deepEqual(legacyLookups, ["series", "film"]);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "My Watchlist" })
      .click();
    await page.getByRole("button", { name: "View Last Orbit" }).waitFor();
  },
);
