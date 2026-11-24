import assert from "node:assert/strict";
import { devices } from "playwright-core";
import { browserTest } from "./support/harness.mjs";

browserTest(
  "demo home loads with its catalogue and desktop navigation",
  async ({ newPage, url }) => {
    const page = await newPage({
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
      await mark.evaluate((image) => image.complete && image.naturalWidth > 0),
    );
    assert.equal(await page.title(), "WatchQuest");
    assert.equal(await page.locator(".weekly .card").count(), 6);
    const desktopNav = page.getByRole("navigation", {
      name: "Main navigation",
    });
    assert.ok(await desktopNav.isVisible());
    await desktopNav.getByRole("link", { name: "Community" }).click();
    await page.getByRole("heading", { name: "Demo discussion" }).waitFor();
    await desktopNav.getByRole("link", { name: "Premium" }).click();
    await page.getByRole("heading", { name: "Proposed plans" }).waitFor();
    assert.deepEqual(errors, []);
  },
);

browserTest(
  "mobile navigation and narrow layouts fit the viewport",
  async ({ newPage, url }) => {
    const mobile = await newPage({
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
    await mobile.setViewportSize({ width: 320, height: 700 });
    assert.ok(
      await mobile.evaluate(
        () =>
          globalThis.document.documentElement.scrollWidth ===
          globalThis.innerWidth,
      ),
    );
    const page = await newPage({ viewport: { width: 810, height: 1080 } });
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
    const android = await newPage(devices["Pixel 7"]);
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
  },
);
