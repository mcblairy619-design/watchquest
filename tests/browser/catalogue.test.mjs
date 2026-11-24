import assert from "node:assert/strict";
import { browserTest } from "./support/harness.mjs";
import {
  mockCatalogue,
  providerTitle,
  seedStorage,
  subscribedProfile,
  subscriptionOffer,
} from "./support/fixtures.mjs";

browserTest(
  "title details distinguish subscription and paid channel offers",
  async ({ newPage, url }) => {
    const page = await newPage();
    const film = providerTitle({
      time: "102 min",
      releaseDate: "2020-01-01",
      offers: [
        subscriptionOffer({ service: "Fixture Streaming" }),
        subscriptionOffer({
          service: "Fixture Streaming",
          type: "addon",
          addon: "Extra Channel",
        }),
      ],
    });
    await seedStorage(page, { profile: subscribedProfile() });
    await mockCatalogue(page, { titles: [film] });
    await page.goto(url);
    await page.getByRole("button", { name: "View Provider Fixture" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText(/102 min/).waitFor();
    await dialog.getByText("Included with the service subscription").waitFor();
    await dialog.getByText("Additional paid channel").waitFor();
  },
);

browserTest(
  "reconnect distinguishes a failed check from empty availability and preserves stored data",
  async ({ newPage, url }) => {
    const page = await newPage();
    const checkedAt = "2026-11-23T12:00:00.000Z";
    await page.clock.setFixedTime(new Date(checkedAt));
    await seedStorage(page, {
      profile: subscribedProfile(),
      saved: ["orbit"],
      watched: ["neon"],
      "movie-feedback": {
        ratings: {
          neon: {
            title: {
              id: "neon",
              name: "Neon District",
              type: "Film",
              genre: "Thriller",
            },
            value: 7,
          },
        },
        rejected: {},
      },
      "weekly-picks": [
        {
          week: "2026-11-23",
          scope: "gb|netflix",
          basedOnDna: true,
          replaced: [],
          picks: [
            {
              id: "motn-previous",
              name: "Previous fixture",
              type: "Film",
              genre: "Drama",
              matches: [],
              reasons: [],
            },
          ],
        },
      ],
    });
    let checks = 0;
    await mockCatalogue(page, {
      async handle({ route, path, query }) {
        if (path !== "") return;
        assert.equal(query.get("country"), "gb");
        assert.equal(query.get("services"), "netflix");
        checks++;
        if (checks === 1) {
          await route.fulfill({
            status: 502,
            json: { code: "provider_connection" },
          });
        } else {
          const restored = Array.from({ length: 6 }, (_, index) =>
            providerTitle({
              id: index === 0 ? "motn-previous" : "motn-restored-" + index,
              name:
                index === 0 ? "Previous fixture" : "Restored fixture " + index,
              type: index === 5 ? "Series" : "Film",
              checkedAt,
            }),
          );
          await route.fulfill({
            json: { titles: checks === 2 ? [] : restored },
          });
        }
        return true;
      },
    });
    await page.goto(url);
    const weekly = page.locator(".weekly");
    await weekly
      .getByText(
        "Live catalogue check failed. Your previous picks are still saved.",
      )
      .waitFor();
    await weekly
      .getByText(/could not connect to the streaming provider/)
      .waitFor();
    await weekly.locator("summary").click();
    await weekly
      .getByText("Previous fixture · Availability check failed")
      .waitFor();
    assert.equal(checks, 1);
    const second = page.waitForResponse((res) =>
      new globalThis.URL(res.url()).searchParams.has("services"),
    );
    await page.evaluate(() =>
      globalThis.dispatchEvent(new globalThis.Event("online")),
    );
    await second;
    await weekly
      .getByText(/The catalogue loaded. No verified recommendations/)
      .waitFor();
    assert.equal(checks, 2);
    await weekly.getByRole("button", { name: "Refresh catalogue" }).click();
    await weekly.getByText(/5 of 5 films.*1 of 1 series/).waitFor();
    assert.equal(checks, 3);
    assert.equal(
      await page.evaluate(() =>
        globalThis.localStorage.getItem("sg-phase1-saved"),
      ),
      '["orbit"]',
    );
    assert.equal(
      await page.evaluate(() =>
        globalThis.localStorage.getItem("sg-phase1-watched"),
      ),
      '["neon"]',
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(
            globalThis.localStorage.getItem("sg-phase1-movie-feedback"),
          ).ratings.neon.value,
      ),
      7,
    );
  },
);

browserTest(
  "a broken provider poster gets a correctly sized fallback on mobile",
  async ({ newPage, url }) => {
    const page = await newPage({ viewport: { width: 390, height: 844 } });
    await seedStorage(page, { profile: subscribedProfile() });
    await mockCatalogue(page, {
      titles: [providerTitle({ poster: "/media/failing-poster.jpg" })],
    });
    await page.route("**/media/failing-poster.jpg", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await page.goto(url);
    const weekly = page.locator(".weekly");
    const card = weekly.getByRole("button", {
      name: "View Provider Fixture",
    });
    await card.scrollIntoViewIfNeeded();
    await card.locator(".poster-placeholder").waitFor();
    assert.equal(
      await card.evaluate(
        (element) => globalThis.getComputedStyle(element).aspectRatio,
      ),
      "2 / 3",
    );
  },
);
