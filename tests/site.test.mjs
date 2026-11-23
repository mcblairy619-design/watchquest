import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { chromium, devices } from "playwright-core";

const browsers = [
  ["Chrome", "C:/Program Files/Google/Chrome/Application/chrome.exe"],
  ["Edge", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"],
];
const url = "http://127.0.0.1:5173/";

for (const [name, path] of browsers) {
  test(
    name + " desktop and mobile prototype",
    { skip: !existsSync(path) },
    async () => {
      const browser = await chromium.launch({ executablePath: path });
      try {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 950 },
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("response", (response) => {
          if (response.status() >= 400)
            errors.push(response.status() + " " + response.url());
        });
        await page.goto(url);
        assert.equal(await page.locator(".weekly .card").count(), 6);
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

        await page.getByRole("searchbox").fill("Neon");
        await page.getByRole("heading", { name: "Discover" }).waitFor();
        assert.equal(await page.locator(".card").count(), 1);
        await page.getByRole("button", { name: "Roll the Dice" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: "Roll the Dice" }).click();
        const pick = await dialog
          .getByRole("heading", { level: 3 })
          .textContent();
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

        await page.getByRole("button", { name: "Get started" }).click();
        await dialog.getByRole("button", { name: "Continue as guest" }).click();
        await dialog.getByLabel("Display name (optional)").fill("Demo Viewer");
        await dialog.getByLabel("Viewing country").selectOption("Ireland");
        await dialog
          .getByRole("button", { name: "Continue", exact: true })
          .click();
        await dialog.getByRole("button", { name: "Thriller" }).click();
        await dialog.getByRole("button", { name: "Save preferences" }).click();
        await page.getByRole("heading", { name: "Demo Viewer" }).waitFor();
        await page.reload();
        assert.ok(
          await page.getByText("Favourite genres: Thriller").isVisible(),
        );
        await desktopNav.getByRole("link", { name: "Community" }).click();
        await page.getByRole("heading", { name: "Demo discussion" }).waitFor();
        await desktopNav.getByRole("link", { name: "Premium" }).click();
        await page.getByRole("heading", { name: "Proposed plans" }).waitFor();
        assert.deepEqual(errors, []);

        const mobile = await browser.newPage({
          ...devices["iPhone 13"],
          reducedMotion: "reduce",
        });
        await mobile.goto(url);
        const mobileNav = mobile.getByRole("navigation", {
          name: "Mobile navigation",
        });
        assert.ok(await mobileNav.isVisible());
        assert.ok(
          !(await mobile
            .getByRole("navigation", { name: "Main navigation" })
            .isVisible()),
        );
        assert.ok(
          await mobile.evaluate(
            () =>
              globalThis.document.documentElement.scrollWidth ===
              globalThis.innerWidth,
          ),
        );
        await mobileNav.getByRole("link", { name: "Profile" }).click();
        await mobile.getByRole("link", { name: "Achievements" }).click();
        await mobile.getByRole("heading", { name: "Achievements" }).waitFor();
        await mobileNav.getByRole("link", { name: "Profile" }).click();
        await mobile.getByRole("link", { name: "Premium" }).click();
        await mobile.getByRole("heading", { name: "Stream Guide+" }).waitFor();
        await mobileNav.getByRole("link", { name: "Home" }).click();
        await mobile.getByRole("button", { name: "Spin to Watch" }).click();
        await mobile.getByRole("button", { name: "Spin the wheel" }).click();
        await mobile.getByRole("button", { name: "Spin again" }).waitFor();
        await mobile.keyboard.press("Escape");
        await mobile.setViewportSize({ width: 320, height: 700 });
        assert.ok(
          await mobile.evaluate(
            () =>
              globalThis.document.documentElement.scrollWidth ===
              globalThis.innerWidth,
          ),
        );
      } finally {
        await browser.close();
      }
    },
  );
}

test(
  "configured catalogue UI uses provider responses and keeps earlier saves",
  { skip: !existsSync(browsers[0][1]) },
  async () => {
    const browser = await chromium.launch({ executablePath: browsers[0][1] });
    try {
      const page = await browser.newPage({ reducedMotion: "reduce" });
      await page.addInitScript(() => {
        if (!globalThis.localStorage.getItem("sg-phase1-profile")) {
          globalThis.localStorage.setItem("sg-phase1-saved", '["orbit"]');
          globalThis.localStorage.setItem(
            "sg-phase1-profile",
            '{"name":"Guest","country":"Ireland","genres":[]}',
          );
        }
      });
      const film = {
        id: "motn-fixture-film",
        name: "Provider Fixture",
        genre: "Drama",
        type: "Film",
        releaseDate: "2020-01-01",
        source: "movie-of-the-night",
        time: "102 min",
        availability: {
          country: "ie",
          state: "checked",
          checkedAt: new Date().toISOString(),
          offers: [
            {
              service: "Fixture Streaming",
              serviceId: "netflix",
              type: "subscription",
            },
            {
              service: "Fixture Streaming",
              serviceId: "netflix",
              type: "addon",
              addon: "Extra Channel",
            },
          ],
        },
      };
      const oldSearch = Promise.withResolvers();
      const oldFinished = Promise.withResolvers();
      const legacyLookups = [];
      await page.route("**/api/catalogue**", async (request) => {
        const endpoint = new globalThis.URL(request.request().url());
        let json;
        if (endpoint.pathname.endsWith("/status")) json = { enabled: true };
        else if (endpoint.pathname.endsWith("/motn-legacy-series")) {
          legacyLookups.push("series");
          json = { title: { id: "motn-legacy-series", type: "Series" } };
        } else if (endpoint.pathname.endsWith("/motn-fixture-film")) {
          legacyLookups.push("film");
          json = { title: film };
        } else {
          assert.equal(endpoint.searchParams.get("country"), "ie");
          const query = endpoint.searchParams.get("q");
          if (query === "Old") {
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
            return;
          }
          json = {
            titles:
              endpoint.searchParams.get("services") === "netflix"
                ? [
                    query === "Fixture"
                      ? { ...film, name: "Current result" }
                      : film,
                  ]
                : [],
          };
        }
        await request.fulfill({ json });
      });
      await page.goto(url);
      await page
        .getByRole("button", { name: "Set viewing country and subscriptions" })
        .click();
      const setup = page.getByRole("dialog");
      await setup.getByRole("button", { name: "Continue as guest" }).click();
      await setup.getByRole("button", { name: "Netflix", exact: true }).click();
      await setup
        .getByRole("button", { name: "Continue", exact: true })
        .click();
      await setup.getByRole("button", { name: "Save preferences" }).click();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Home" })
        .click();
      await page
        .getByRole("button", { name: "View Provider Fixture" })
        .waitFor();
      await page
        .locator(".hero")
        .getByRole("button", { name: "Roll the Dice" })
        .click();
      let dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Roll the Dice" }).click();
      await dialog.getByRole("heading", { name: "Provider Fixture" }).waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /Spin to Watch/ }).click();
      await dialog.getByRole("button", { name: "Spin the wheel" }).click();
      await dialog.getByRole("button", { name: "View details" }).click();
      dialog = page.getByRole("dialog");
      await dialog.getByText(/102 min/).waitFor();
      await dialog
        .getByText("Included with the service subscription")
        .waitFor();
      await dialog.getByText("Additional paid channel").waitFor();
      await dialog.getByRole("button", { name: "Mark as watched" }).click();
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
      await page
        .getByRole("button", { name: "View Provider Fixture" })
        .waitFor();
      await page.getByRole("searchbox").fill("Fixture");
      await page.getByRole("button", { name: "Submit search" }).click();
      await page.getByRole("button", { name: "View Current result" }).waitFor();
      await navigation.getByRole("link", { name: "Home" }).click();
      await page.locator(".hero").waitFor();
      await navigation.getByRole("link", { name: "Discover" }).click();
      await page
        .getByRole("button", { name: "View Provider Fixture" })
        .waitFor();
      assert.equal(await page.getByRole("searchbox").inputValue(), "");
    } finally {
      await browser.close();
    }
  },
);
