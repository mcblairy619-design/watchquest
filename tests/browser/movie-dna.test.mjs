import assert from "node:assert/strict";
import { devices } from "playwright-core";
import { browserTest } from "./support/harness.mjs";
import {
  mockCatalogue,
  providerTitle,
  seedStorage,
  subscribedProfile,
} from "./support/fixtures.mjs";

browserTest(
  "questionnaire keeps choices when going back and persists the saved profile",
  async ({ newPage, url }) => {
    const page = await newPage();
    await page.goto(url);
    const desktopNav = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const dialog = page.getByRole("dialog");
    await desktopNav.getByRole("link", { name: "Movie DNA" }).click();
    await page.getByRole("button", { name: "Retake questionnaire" }).click();
    await dialog.getByLabel("Display name (optional)").fill("Demo Viewer");
    await dialog.getByLabel("Viewing country").selectOption("Ireland");
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await dialog.getByRole("button", { name: "Thriller" }).click();
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    assert.ok(
      await dialog.getByRole("button", { name: "Thriller" }).isDisabled(),
    );
    await dialog.getByRole("button", { name: "Drama", exact: true }).click();
    await dialog.getByRole("button", { name: "Back", exact: true }).click();
    assert.equal(
      await dialog
        .getByRole("button", { name: "Thriller" })
        .getAttribute("aria-pressed"),
      "true",
    );
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    for (let remaining = 6; remaining > 0; remaining--) {
      await dialog.getByRole("button", { name: "Skip", exact: true }).click();
    }
    await dialog.getByRole("button", { name: "Save Movie DNA" }).click();
    await page
      .locator(".dna-summary")
      .getByText("Thriller", { exact: true })
      .waitFor();
    await desktopNav.getByRole("link", { name: "Profile" }).click();
    await page.getByRole("heading", { name: "Demo Viewer" }).waitFor();
    await page.reload();
    assert.ok(await page.getByText("Favourite genres: Thriller").isVisible());
  },
);

browserTest(
  "questionnaire fits a narrow phone screen",
  async ({ newPage, url }) => {
    const mobile = await newPage(devices["iPhone 13"]);
    await mobile.setViewportSize({ width: 320, height: 700 });
    await mobile.goto(url);
    await mobile
      .locator(".hero")
      .getByRole("link", { name: "Movie DNA" })
      .click();
    await mobile.getByRole("button", { name: "Retake questionnaire" }).click();
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
  },
);

browserTest(
  "the live questionnaire saves a favourite rating and enables subscription picks",
  async ({ newPage, url }) => {
    const page = await newPage({ reducedMotion: "reduce" });
    await seedStorage(page, {
      profile: { name: "Guest", country: "Ireland", genres: ["Sci-fi"] },
    });
    const film = providerTitle({ country: "ie" });
    await mockCatalogue(page, {
      titles: [film],
      async handle({ route, path, query }) {
        if (path === "/services") {
          assert.equal(query.get("country"), "ie");
          await route.fulfill({
            json: { services: [{ id: "netflix", name: "Netflix" }] },
          });
        } else if (path === "/favourites") {
          const favourite = {
            id: "motn-favourite",
            name: "Favourite Fixture",
            genre: "Drama",
            type: "Film",
          };
          await route.fulfill(
            query.get("q") === "Unavailable"
              ? { status: 429, json: { code: "local_quota" } }
              : { json: { titles: [favourite] } },
          );
        } else if (path === "") {
          assert.equal(query.get("country"), "ie");
          if (query.get("services") === "netflix") return;
          await route.fulfill({ json: { titles: [] } });
        } else return;
        return true;
      },
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
      .locator(".weekly")
      .getByRole("button", { name: "View Provider Fixture" })
      .waitFor();
  },
);

browserTest(
  "a live title rejection can be reversed and its rating removed",
  async ({ newPage, url }) => {
    const page = await newPage();
    await seedStorage(page, { profile: subscribedProfile() });
    await mockCatalogue(page, { titles: [providerTitle()] });
    await page.goto(url);
    await page.getByRole("button", { name: "View Provider Fixture" }).click();
    const dialog = page.getByRole("dialog");
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
    await navigation.getByRole("link", { name: "Movie DNA" }).click();
    await page
      .getByRole("button", { name: "Restore Provider Fixture" })
      .click();
    await page.getByLabel("Your rating for Provider Fixture").selectOption("");
    await page
      .getByLabel("Your rating for Provider Fixture")
      .waitFor({ state: "detached" });
  },
);
