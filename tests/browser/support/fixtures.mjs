import { URL } from "node:url";

export function subscriptionOffer({ service = "Netflix", ...extra } = {}) {
  return { type: "subscription", service, serviceId: "netflix", ...extra };
}

export function providerTitle({
  id = "motn-fixture-film",
  name = "Provider Fixture",
  country = "gb",
  checkedAt = new Date().toISOString(),
  offers = [subscriptionOffer()],
  ...extra
} = {}) {
  return {
    id,
    name,
    genre: "Drama",
    type: "Film",
    source: "movie-of-the-night",
    availability: { state: "checked", country, checkedAt, offers },
    ...extra,
  };
}

export function subscribedProfile({ region = "gb", ...extra } = {}) {
  return {
    name: "Guest",
    country: region === "ie" ? "Ireland" : "United Kingdom",
    genres: ["Drama"],
    subscriptions: { [region]: ["netflix"] },
    ...extra,
  };
}

export async function seedStorage(page, entries) {
  await page.addInitScript((values) => {
    // Seed once per tab, so reloads cannot conceal lost browser data.
    const marker = "watchquest-test-storage-seeded";
    const session = globalThis.sessionStorage;
    if (session.getItem(marker)) return;
    const storage = globalThis.localStorage;
    for (const [key, value] of Object.entries(values)) {
      const storageKey = "sg-phase1-" + key;
      if (storage.getItem(storageKey) === null) {
        storage.setItem(storageKey, JSON.stringify(value));
      }
    }
    session.setItem(marker, "yes");
  }, entries);
}

export async function mockCatalogue(page, { titles = [], handle } = {}) {
  await page.route("**/api/catalogue**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.slice("/api/catalogue".length);
    if (await handle?.({ route, path, query: url.searchParams })) return;
    if (path === "/status") {
      await route.fulfill({ json: { enabled: true } });
    } else if (path === "") {
      const kind = url.searchParams.get("kind");
      await route.fulfill({
        json: {
          titles: titles.filter(
            (title) =>
              !kind ||
              (kind === "series"
                ? title.type === "Series"
                : title.type === "Film"),
          ),
        },
      });
    } else {
      const title = titles.find((item) => path === "/" + item.id);
      await route.fulfill(title ? { json: { title } } : { status: 404 });
    }
  });
}
