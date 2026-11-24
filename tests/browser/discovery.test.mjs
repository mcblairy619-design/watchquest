import assert from "node:assert/strict";
import { devices } from "playwright-core";
import { browserTest } from "./support/harness.mjs";
import {
  mockCatalogue,
  providerTitle,
  seedStorage,
  subscribedProfile,
} from "./support/fixtures.mjs";

browserTest("demo search filters the catalogue", async ({ newPage, url }) => {
  const page = await newPage();
  await page.goto(url);
  await page.getByRole("searchbox").fill("Neon");
  await page.getByRole("heading", { name: "Discover" }).waitFor();
  assert.equal(await page.locator(".card").count(), 1);
});

browserTest(
  "Discover dice and animated wheel exclude an already watched demo film",
  async ({ newPage, url }) => {
    const page = await newPage({ reducedMotion: "no-preference" });
    await seedStorage(page, { watched: ["orbit"] });
    await page.goto(url);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Discover" })
      .click();
    await page.getByRole("heading", { name: "Discover", exact: true }).waitFor();
    await page.getByRole("button", { name: "Roll the Dice", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Roll the Dice" }).click();
    const pick = await dialog.getByRole("heading", { level: 3 }).textContent();
    assert.notEqual(pick, "Last Orbit");
    await dialog.getByRole("button", { name: "Roll again" }).click();
    assert.notEqual(
      await dialog.getByRole("heading", { level: 3 }).textContent(),
      pick,
    );
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Spin to Watch" }).click();
    await dialog.getByRole("button", { name: "Spin the wheel" }).click();
    await dialog.getByRole("button", { name: "Spin again" }).waitFor();
    assert.ok(
      !["Last Orbit", "Signal House"].includes(
        await dialog.getByRole("heading", { level: 3 }).textContent(),
      ),
    );
    await page.keyboard.press("Escape");
  },
);

browserTest(
  "the mobile wheel completes with reduced motion",
  async ({ newPage, url }) => {
    const page = await newPage({
      ...devices["iPhone 13"],
      reducedMotion: "reduce",
    });
    await page.goto(url);
    await page
      .getByRole("region", { name: "Discovery tools" })
      .getByRole("button", { name: "Spin to Watch" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Spin the wheel" }).click();
    await dialog.getByRole("button", { name: "Spin again" }).waitFor();
  },
);

browserTest(
  "live dice and wheel both use eligible provider titles",
  async ({ newPage, url }) => {
    const page = await newPage({ reducedMotion: "reduce" });
    await seedStorage(page, { profile: subscribedProfile() });
    await mockCatalogue(page, { titles: [providerTitle()] });
    await page.goto(url);
    await page.getByRole("button", { name: "View Provider Fixture" }).waitFor();
    await page
      .locator(".hero")
      .getByRole("button", { name: "Roll the Dice" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Roll the Dice" }).click();
    await dialog.getByRole("heading", { name: "Provider Fixture" }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Spin to Watch/ }).click();
    await dialog.getByRole("button", { name: "Spin the wheel" }).click();
    await dialog.getByRole("button", { name: "View details" }).click();
    await dialog.getByRole("heading", { name: "Provider Fixture" }).waitFor();
  },
);

browserTest(
  "a delayed live search cannot overwrite newer results and navigation resets the query",
  async ({ newPage, url }) => {
    const page = await newPage();
    const film = providerTitle({ country: "ie" });
    const oldSearch = Promise.withResolvers();
    const oldFinished = Promise.withResolvers();
    await seedStorage(page, { profile: subscribedProfile({ region: "ie" }) });
    await mockCatalogue(page, {
      titles: [film],
      async handle({ route: request, path, query }) {
        if (path !== "" || !query.has("q")) return;
        assert.equal(query.get("country"), "ie");
        assert.equal(query.get("services"), "netflix");
        if (query.get("q") === "Old") {
          await oldSearch.promise;
          try {
            await request.fulfill({
              json: { titles: [{ ...film, name: "Stale result" }] },
            });
          } catch {
            // The browser can cancel the request before the delayed response arrives.
          } finally {
            oldFinished.resolve();
          }
          return true;
        }
        await request.fulfill({
          json: { titles: [{ ...film, name: "Current result" }] },
        });
        return true;
      },
    });
    await page.goto(url);
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const oldRequest = page.waitForRequest(
      (request) =>
        new globalThis.URL(request.url()).searchParams.get("q") === "Old",
    );
    await page.getByRole("searchbox").fill("Old");
    await page.getByRole("button", { name: "Submit search" }).click();
    await oldRequest;
    await page.getByRole("searchbox").fill("Fixture");
    await page.getByRole("button", { name: "Submit search" }).click();
    await page.getByRole("button", { name: "View Current result" }).waitFor();
    oldSearch.resolve();
    await oldFinished.promise;
    assert.equal(
      await page.getByRole("button", { name: "View Stale result" }).count(),
      0,
    );
    await page.getByRole("searchbox").fill("");
    await page.getByRole("button", { name: "View Provider Fixture" }).waitFor();
    await page.getByRole("searchbox").fill("Fixture");
    await page.getByRole("button", { name: "Submit search" }).click();
    await page.getByRole("button", { name: "View Current result" }).waitFor();
    await navigation.getByRole("link", { name: "Home" }).click();
    await page.locator(".hero").waitFor();
    await navigation.getByRole("link", { name: "Discover" }).click();
    await page.getByRole("button", { name: "View Provider Fixture" }).waitFor();
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
  },
);
