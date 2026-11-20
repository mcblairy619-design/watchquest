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
        assert.equal(await page.getByText("Unlocked in this demo").count(), 2);

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
        globalThis.localStorage.setItem("sg-phase1-saved", '["orbit"]');
        globalThis.localStorage.setItem(
          "sg-phase1-profile",
          '{"name":"Guest","country":"Ireland","genres":[]}',
        );
      });
      const film = {
        id: "tmdb-movie-1",
        name: "Provider Fixture",
        genre: "Drama",
        type: "Film",
        releaseDate: "2020-01-01",
      };
      await page.route("**/api/catalogue**", async (request) => {
        const endpoint = new globalThis.URL(request.request().url());
        let json;
        if (endpoint.pathname.endsWith("/status")) json = { enabled: true };
        else if (endpoint.pathname.endsWith("/availability")) {
          assert.equal(endpoint.searchParams.get("country"), "ie");
          json = {
            state: "checked",
            checkedAt: "2026-11-20T10:00:00Z",
            offers: [
              { service: "Fixture Streaming", type: "subscription" },
              {
                service: "Fixture Streaming",
                type: "addon",
                addon: "Extra Channel",
              },
            ],
          };
        } else if (endpoint.pathname.endsWith(film.id))
          json = {
            title: {
              ...film,
              time: "102 min",
              synopsis: "A provider response fixture.",
            },
          };
        else if (endpoint.searchParams.has("q")) {
          assert.equal(endpoint.searchParams.get("q"), "Fixture");
          json = { titles: [film] };
        } else json = { titles: [film] };
        await request.fulfill({ json });
      });
      await page.goto(url);
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
      await page.keyboard.press("Escape");
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "My Watchlist" })
        .click();
      await page.getByRole("button", { name: "View Last Orbit" }).waitFor();
      await page.getByRole("searchbox").fill("Fixture");
      await page.getByRole("heading", { name: "Discover" }).waitFor();
      await page
        .getByRole("button", { name: "View Provider Fixture" })
        .waitFor();
    } finally {
      await browser.close();
    }
  },
);
