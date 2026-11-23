import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import process from "node:process";
import { chromium, devices } from "playwright-core";

const browsers = [
  ["Chrome", "C:/Program Files/Google/Chrome/Application/chrome.exe"],
  ["Edge", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"],
];
const url = process.env.WATCHQUEST_TEST_URL ?? "http://127.0.0.1:5173/";

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
        const mark = page.locator(".site-header .brand-wordmark");
        await mark.waitFor();
        assert.ok(
          await mark.evaluate(
            (image) => image.complete && image.naturalWidth > 0,
          ),
        );
        assert.equal(await page.title(), "WatchQuest");
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

        await desktopNav.getByRole("link", { name: "Movie DNA" }).click();
        await page
          .getByRole("button", { name: "Retake questionnaire" })
          .click();
        await dialog.getByLabel("Display name (optional)").fill("Demo Viewer");
        await dialog.getByLabel("Viewing country").selectOption("Ireland");
        await dialog.getByRole("button", { name: "Next", exact: true }).click();
        await dialog.getByRole("button", { name: "Thriller" }).click();
        await dialog.getByRole("button", { name: "Next", exact: true }).click();
        assert.ok(
          await dialog.getByRole("button", { name: "Thriller" }).isDisabled(),
        );
        await dialog
          .getByRole("button", { name: "Drama", exact: true })
          .click();
        await dialog.getByRole("button", { name: "Back", exact: true }).click();
        assert.equal(
          await dialog
            .getByRole("button", { name: "Thriller" })
            .getAttribute("aria-pressed"),
          "true",
        );
        await dialog.getByRole("button", { name: "Next", exact: true }).click();
        for (let remaining = 6; remaining > 0; remaining--) {
          await dialog
            .getByRole("button", { name: "Skip", exact: true })
            .click();
        }
        await dialog.getByRole("button", { name: "Save Movie DNA" }).click();
        await page
          .locator(".dna-summary")
          .getByText("Thriller", { exact: true })
          .waitFor();
        await desktopNav.getByRole("link", { name: "Profile" }).click();
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
        await mobileNav
          .getByRole("link", { name: "Achievements", exact: true })
          .click();
        await mobile.getByRole("heading", { name: "Achievements" }).waitFor();
        await mobileNav.getByRole("link", { name: "Profile" }).click();
        await mobile.getByRole("link", { name: "Premium" }).click();
        await mobile.getByRole("heading", { name: "WatchQuest+" }).waitFor();
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
        await mobile
          .locator(".hero")
          .getByRole("link", { name: "Movie DNA" })
          .click();
        await mobile
          .getByRole("button", { name: "Retake questionnaire" })
          .click();
        const mobileWizard = mobile.getByRole("dialog");
        await mobileWizard
          .getByRole("button", { name: "Next", exact: true })
          .click();
        await mobileWizard
          .getByRole("heading", { name: "Favourite genres" })
          .waitFor();
        assert.ok(
          await mobileWizard.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        );
        await mobile.keyboard.press("Escape");
        await page.setViewportSize({ width: 810, height: 1080 });
        await page.goto(url);
        await page
          .getByRole("heading", { name: "This Week’s Picks For You" })
          .waitFor();
        assert.ok(
          await page.evaluate(
            () =>
              globalThis.document.documentElement.scrollWidth ===
              globalThis.innerWidth,
          ),
        );
        const android = await browser.newPage(devices["Pixel 7"]);
        await android.goto(url);
        assert.ok(
          await android
            .getByRole("navigation", { name: "Mobile navigation" })
            .isVisible(),
        );
        assert.ok(
          await android.evaluate(
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
            '{"name":"Guest","country":"Ireland","genres":["Sci-fi"]}',
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
        else if (endpoint.pathname.endsWith("/services")) {
          assert.equal(endpoint.searchParams.get("country"), "ie");
          json = { services: [{ id: "netflix", name: "Netflix" }] };
        } else if (endpoint.pathname.endsWith("/favourites")) {
          if (endpoint.searchParams.get("q") === "Unavailable") {
            await request.fulfill({
              status: 429,
              json: { code: "local_quota" },
            });
            return;
          }
          json = {
            titles: [
              { ...film, id: "motn-favourite", name: "Favourite Fixture" },
            ],
          };
        } else if (endpoint.pathname.endsWith("/motn-legacy-series")) {
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
              endpoint.searchParams.get("services") === "netflix" &&
              endpoint.searchParams.get("kind") !== "series"
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
      await setup.getByRole("button", { name: "Netflix", exact: true }).click();
      await setup.getByRole("button", { name: "Next", exact: true }).click();
      assert.equal(
        await setup
          .getByRole("button", { name: "Science Fiction" })
          .getAttribute("aria-pressed"),
        "true",
      );
      await setup.getByRole("button", { name: "Next", exact: true }).click();
      for (let remaining = 5; remaining > 0; remaining--) {
        await setup.getByRole("button", { name: "Skip", exact: true }).click();
      }
      const favouriteSearch = setup.getByRole("search", {
        name: "Find favourite titles",
      });
      await favouriteSearch
        .getByLabel("Search films and series")
        .fill("Unavailable");
      await favouriteSearch.getByRole("button", { name: "Search" }).click();
      await setup
        .getByText(/local catalogue request allowance is exhausted/)
        .waitFor();
      await favouriteSearch
        .getByLabel("Search films and series")
        .fill("Favourite");
      await favouriteSearch.getByRole("button", { name: "Search" }).click();
      const addFavourite = setup.getByRole("button", {
        name: "Add Favourite Fixture to favourites",
      });
      await addFavourite.click();
      assert.ok(await addFavourite.isDisabled());
      await setup
        .getByLabel("Your rating for Favourite Fixture")
        .selectOption("9");
      await setup.getByRole("button", { name: "Next", exact: true }).click();
      await setup.getByRole("button", { name: "Save Movie DNA" }).click();
      await page
        .locator(".dna-summary")
        .getByText("Favourite Fixture · 9/10")
        .waitFor();
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
      await dialog
        .getByLabel("Your rating for Provider Fixture")
        .selectOption("8");
      await dialog
        .getByRole("button", { name: "Not interested", exact: true })
        .click();
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
      await navigation.getByRole("link", { name: "Movie DNA" }).click();
      await page
        .getByRole("button", { name: "Restore Provider Fixture" })
        .click();
      await page
        .getByLabel("Your rating for Provider Fixture")
        .selectOption("");
      await page
        .getByLabel("Your rating for Provider Fixture")
        .waitFor({ state: "detached" });
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

test(
  "weekly replacement changes one slot, survives reload and keeps the old week in history",
  {
    skip: !existsSync(browsers[0][1]),
  },
  async () => {
    const browser = await chromium.launch({ executablePath: browsers[0][1] });
    try {
      const page = await browser.newPage();
      let checkedAt = "2026-11-23T12:00:00.000Z";
      await page.clock.setFixedTime(new Date(checkedAt));
      await page.addInitScript(() => {
        if (!globalThis.localStorage.getItem("sg-phase1-profile")) {
          globalThis.localStorage.setItem(
            "sg-phase1-profile",
            '{"name":"Guest","country":"United Kingdom","genres":["Drama"],"subscriptions":{"gb":["netflix"]}}',
          );
        }
      });
      await page.route("**/api/catalogue**", async (request) => {
        const endpoint = new globalThis.URL(request.request().url());
        if (endpoint.pathname.endsWith("/status")) {
          await request.fulfill({ json: { enabled: true } });
          return;
        }
        const titles = Array.from({ length: 7 }, (_, index) => ({
          id: "motn-weekly-" + index,
          name: "Weekly fixture " + index,
          type: index === 6 ? "Series" : "Film",
          genre: "Drama",
          source: "movie-of-the-night",
          availability: {
            state: "checked",
            checkedAt,
            country: "gb",
            offers: [
              {
                type: "subscription",
                service: "Netflix",
                serviceId: "netflix",
              },
            ],
          },
        }));
        await request.fulfill({ json: { titles } });
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
    } finally {
      await browser.close();
    }
  },
);
