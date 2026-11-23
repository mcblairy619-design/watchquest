import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { URL } from "node:url";
import { createCatalogue } from "../server/catalogue.mjs";

const env = {
  AVAILABILITY_TERMS_ACCEPTED: "yes",
  AVAILABILITY_FREE_PLAN: "yes",
  AVAILABILITY_FREE_REQUEST_LIMIT: "100",
  AVAILABILITY_CACHE_MINUTES: "60",
  AVAILABILITY_API_TOKEN: "fixture-key",
};
const route = (path) => new URL("/api/catalogue" + path, "http://localhost");
const json = (body, init) => globalThis.Response.json(body, init);
function budget(t) {
  const folder = mkdtempSync(join(tmpdir(), "sg-provider-"));
  t.after(() => rmSync(folder, { recursive: true }));
  return join(folder, "usage.json");
}
const offer = (type, id = "netflix", extras = {}) => ({
  type,
  service: { id, name: id },
  ...extras,
});
const show = (id, streamingOptions) => ({
  id: "fixture-" + id,
  tmdbId: "movie/" + id,
  showType: "movie",
  title: "Fixture " + id,
  genres: [{ name: "Drama" }],
  overview: "Fixture synopsis",
  releaseYear: 2020,
  runtime: 102,
  streamingOptions,
  imageSet: { verticalPoster: { w360: "https://example.com/poster.jpg" } },
});

test("questionnaire services require a country and a genuine base subscription", async (t) => {
  let calls = 0;
  const run = createCatalogue(
    env,
    async (path) => {
      calls++;
      assert.ok(path.endsWith("/countries/ie"));
      return json({
        countryCode: "ie",
        services: [
          {
            id: "netflix",
            name: "Netflix",
            streamingOptionTypes: { subscription: true },
          },
          {
            id: "rentals",
            name: "Rentals",
            streamingOptionTypes: { rent: true },
          },
          {
            id: "addons",
            name: "Add-ons",
            streamingOptionTypes: { addon: true },
          },
        ],
      });
    },
    budget(t),
  );
  assert.deepEqual(await run(route("/services?country=zz")), { services: [] });
  assert.deepEqual(await run(route("/services?country=ie")), {
    services: [{ id: "netflix", name: "Netflix" }],
  });
  assert.equal(calls, 1);
});

test("favourite lookup can return metadata outside subscriptions but never supplies recommendation offers", async (t) => {
  const run = createCatalogue(
    env,
    async (path) => {
      const url = new URL(path);
      assert.equal(url.searchParams.get("country"), "gb");
      if (url.searchParams.get("title") === "empty") return json([]);
      return json([show(3, { gb: [offer("rent")] }), show(3, {})]);
    },
    budget(t),
  );
  assert.deepEqual(await run(route("/favourites?country=gb&q=empty")), {
    titles: [],
  });
  const result = await run(route("/favourites?country=gb&q=title"));
  assert.equal(result.titles.length, 1);
  assert.equal(result.titles[0].id, "tmdb-movie-3");
  assert.equal(result.titles[0].availability, undefined);
});

test("a targeted weekly supplement still requires right type and subscription", async (t) => {
  const run = createCatalogue(
    env,
    async (path) => {
      assert.equal(new URL(path).searchParams.get("show_type"), "series");
      return json({
        shows: [
          show(1, { gb: [offer("subscription")] }),
          {
            ...show(2, { gb: [offer("buy")] }),
            showType: "series",
            tmdbId: "tv/2",
          },
          {
            ...show(3, { gb: [offer("subscription")] }),
            showType: "series",
            tmdbId: "tv/3",
          },
        ],
      });
    },
    budget(t),
  );
  const result = await run(route("?country=gb&services=netflix&kind=series"));
  assert.deepEqual(
    result.titles.map(({ id }) => id),
    ["tmdb-tv-3"],
  );
});

test("disabled accounts make no upstream calls", async (t) => {
  const run = createCatalogue(
    { ...env, AVAILABILITY_FREE_PLAN: "" },
    () => assert.fail(),
    budget(t),
  );
  assert.deepEqual(await run(route("/status")), {
    enabled: false,
    tmdb: false,
  });
  await assert.rejects(run(route("")), { status: 503 });
});

test("primary listings and search require a current base subscription in the chosen country", async (t) => {
  const shows = [
    show(1, {
      gb: [offer("subscription"), offer("rent"), offer("buy"), offer("addon")],
    }),
    show(2, { gb: [offer("rent")], us: [offer("subscription")] }),
    show(3, { gb: [offer("subscription", "prime")] }),
    show(4, {
      gb: [offer("subscription", "netflix", { addon: { name: "Extra" } })],
    }),
    show(5, { gb: [offer("subscription", "netflix", { expiresOn: 1 })] }),
  ];
  const seen = [];
  const run = createCatalogue(
    env,
    async (path, request) => {
      const url = new URL(path);
      seen.push(url);
      assert.equal(url.host, "api.movieofthenight.com");
      assert.deepEqual(request.headers, { "X-API-Key": "fixture-key" });
      assert.equal(url.searchParams.get("country"), "gb");
      return json(url.pathname.endsWith("/title") ? shows : { shows });
    },
    budget(t),
  );
  assert.deepEqual(await run(route("/status")), { enabled: true, tmdb: false });
  assert.deepEqual(await run(route("?country=gb")), { titles: [] });
  assert.deepEqual(await run(route("?country=zz&services=netflix")), {
    titles: [],
  });
  const [browse, again] = await Promise.all([
    run(route("?country=gb&services=netflix")),
    run(route("?country=gb&services=netflix")),
  ]);
  assert.deepEqual(browse, again);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].searchParams.get("catalogs"), "netflix.subscription");
  const search = await run(route("?country=gb&services=netflix&q=Fixture"));
  assert.deepEqual(
    search.titles.map((title) => title.id),
    ["tmdb-movie-1"],
  );
  assert.deepEqual(
    browse.titles.map((title) => title.id),
    ["tmdb-movie-1"],
  );
  const [title] = browse.titles;
  assert.equal(title.time, "102 min");
  assert.equal(title.genre, "Drama");
  assert.equal(title.releaseDate, "2020");
  assert.equal(title.poster, undefined);
  assert.deepEqual(
    title.availability.offers.map((item) => item.type),
    ["subscription", "rent", "buy", "addon"],
  );
});

test("resolves existing saved identifiers without TMDB and coalesces detail and offer lookups", async (t) => {
  let calls = 0;
  const run = createCatalogue(
    env,
    async (path) => {
      calls++;
      assert.equal(
        decodeURIComponent(new URL(path).pathname),
        "/v4/shows/movie/1",
      );
      return json(
        show(1, { gb: [offer("rent")], us: [offer("subscription")] }),
      );
    },
    budget(t),
  );
  assert.equal(
    (await run(route("/tmdb-movie-1?country=gb"))).title.id,
    "tmdb-movie-1",
  );
  const gb = await run(route("/tmdb-movie-1/availability?country=gb"));
  assert.deepEqual(
    gb.offers.map(({ type }) => type),
    ["rent"],
  );
  assert.equal(calls, 1);
  assert.deepEqual(await run(route("/tmdb-movie-1/availability?country=zz")), {
    state: "unsupported",
  });
});

test("optional TMDB restores legacy metadata independently of primary availability", async (t) => {
  const run = createCatalogue(
    { CATALOGUE_USE: "non-commercial", CATALOGUE_API_TOKEN: "legacy" },
    async (path, options) => {
      assert.equal(new URL(path).host, "api.themoviedb.org");
      assert.equal(options.headers.Authorization, "Bearer legacy");
      return json({ id: 1, title: "Legacy title", runtime: 100 });
    },
    budget(t),
  );
  assert.deepEqual(await run(route("/status")), { enabled: false, tmdb: true });
  assert.equal((await run(route("/tmdb-movie-1"))).title.time, "100 min");
});

test("quota survives restarts and honours Retry-After", async (t) => {
  const path = budget(t);
  const limited = { ...env, AVAILABILITY_FREE_REQUEST_LIMIT: "1" };
  let calls = 0;
  const upstream = async () => {
    calls++;
    return json({}, { status: 429, headers: { "Retry-After": "20" } });
  };
  const run = createCatalogue(limited, upstream, path);
  const url = route("/tmdb-movie-1/availability?country=gb");
  await assert.rejects(run(url), { status: 429, retryAfter: 20 });
  await assert.rejects(run(url), { status: 429 });
  await assert.rejects(createCatalogue(limited, upstream, path)(url), {
    status: 429,
    code: "local_quota",
  });
  assert.equal(calls, 1);
});

test("completed responses are fetched again when caching is disabled", async (t) => {
  let calls = 0;
  const run = createCatalogue(
    { ...env, AVAILABILITY_CACHE_MINUTES: "0" },
    async () => {
      calls++;
      return json(show(1, {}));
    },
    budget(t),
  );
  const url = route("/tmdb-movie-1/availability?country=gb");
  await run(url);
  await run(url);
  assert.equal(calls, 2);
});
