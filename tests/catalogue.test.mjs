import assert from "node:assert/strict";
import { test } from "node:test";
import { URL } from "node:url";
import { createCatalogue } from "../server/catalogue.mjs";

const env = {
  CATALOGUE_USE: "non-commercial",
  CATALOGUE_API_TOKEN: "fake-metadata-token",
  CATALOGUE_POSTERS_ALLOWED: "yes",
  AVAILABILITY_TERMS_ACCEPTED: "yes",
  AVAILABILITY_API_TOKEN: "fake-availability-token",
};
const route = (path) => new URL("/api/catalogue" + path, "http://localhost");
const json = (body, init) => globalThis.Response.json(body, init);

test("disabled credentials make no upstream calls", async () => {
  const run = createCatalogue({ CATALOGUE_API_TOKEN: "fake" }, () =>
    assert.fail(),
  );
  assert.deepEqual(await run(route("/status")), { enabled: false });
  await assert.rejects(run(route("")), { status: 503 });
});

test("catalogue excludes people, resolves metadata and coalesces concurrent lookups", async () => {
  const seen = [];
  const run = createCatalogue(env, async (path, options) => {
    const url = new URL(path);
    seen.push(url);
    assert.equal(url.host, "api.themoviedb.org");
    assert.equal(options.headers.Authorization, "Bearer fake-metadata-token");
    assert.ok(!path.includes("fake-metadata-token"));
    if (url.pathname.includes("/genre/"))
      return json({ genres: [{ id: 18, name: "Drama" }] });
    if (url.pathname.includes("/search/"))
      return json({
        results: [
          { media_type: "person", id: 9, name: "Person" },
          { media_type: "movie", adult: true, id: 8, title: "Adult" },
          {
            media_type: "movie",
            id: 1,
            title: "Fixture Film",
            genre_ids: [18],
            release_date: "2020-01-01",
            poster_path: "/test.jpg",
          },
        ],
      });
    if (url.pathname.includes("/discover/"))
      return json({
        results: [
          {
            id: 4,
            name: "Fixture Series",
            title: "Fixture Film",
            genre_ids: [18],
            adult: false,
          },
        ],
      });
    return json({
      id: 1,
      title: "Fixture Film",
      runtime: 102,
      genres: [{ name: "Drama" }],
    });
  });
  assert.deepEqual(await run(route("/status")), { enabled: true });
  const [first, second] = await Promise.all([
    run(route("?q=Test")),
    run(route("?q=test")),
  ]);
  assert.deepEqual(first, second);
  assert.equal(seen.length, 3);
  assert.equal(first.titles.length, 1);
  assert.equal(first.titles[0].genre, "Drama");
  assert.equal(
    first.titles[0].poster,
    "https://image.tmdb.org/t/p/w342/test.jpg",
  );
  assert.equal(first.titles[0].releaseDate, "2020-01-01");
  assert.equal(first.titles[0].score, undefined);
  const popular = await run(route("?country=gb"));
  assert.deepEqual(
    popular.titles.map((title) => title.type),
    ["Film", "Series"],
  );
  assert.equal(
    seen
      .find((url) => url.pathname.endsWith("/discover/movie"))
      .searchParams.get("region"),
    "GB",
  );
  assert.equal((await run(route("/tmdb-movie-1"))).title.time, "102 min");
});

test("reports only selected country offers and keeps paid channels separate", async () => {
  const options = ["subscription", "rent", "buy", "addon", "free"].map(
    (type) => ({
      type,
      service: { name: "Fixture service" },
      link: "https://example.com/" + type,
    }),
  );
  options.push({
    ...options[0],
    addon: { name: "Paid fixture channel" },
    link: "javascript:alert(1)",
  });
  const run = createCatalogue(env, async (path, request) => {
    const url = new URL(path);
    assert.equal(decodeURIComponent(url.pathname), "/v4/shows/tv/1");
    assert.equal(request.headers["X-API-Key"], "fake-availability-token");
    if (url.searchParams.get("country") === "au")
      return json({}, { status: 404 });
    return json({
      streamingOptions: {
        gb: options,
        us: [{ service: { name: "US fixture" }, type: "rent" }],
      },
    });
  });
  const gb = await run(route("/tmdb-tv-1/availability?country=gb"));
  const us = await run(route("/tmdb-tv-1/availability?country=us"));
  assert.equal(gb.state, "checked");
  assert.ok(Number.isFinite(Date.parse(gb.checkedAt)));
  assert.deepEqual(
    gb.offers.map((offer) => offer.type),
    ["subscription", "rent", "buy", "addon", "free", "addon"],
  );
  assert.equal(gb.offers.at(-1).link, undefined);
  assert.equal(us.offers[0].service, "US fixture");
  assert.equal(
    (await run(route("/tmdb-tv-1/availability?country=au"))).state,
    "unknown",
  );
  assert.deepEqual(await run(route("/tmdb-tv-1/availability?country=zz")), {
    state: "unsupported",
  });
});

test("honours Retry-After without retrying or persisting a failed lookup", async () => {
  let calls = 0;
  const run = createCatalogue(env, async () => {
    calls++;
    return json({}, { status: 429, headers: { "Retry-After": "20" } });
  });
  const url = route("/tmdb-movie-1/availability?country=gb");
  await assert.rejects(run(url), { status: 429, retryAfter: 20 });
  await assert.rejects(run(url), { status: 429 });
  assert.equal(calls, 1);
});

test("availability budget spares the provider and still serves cached results", async () => {
  let calls = 0;
  const run = createCatalogue(env, async () => {
    calls++;
    return json({ streamingOptions: {} });
  });
  for (let id = 1; id <= 6; id++) {
    await run(route("/tmdb-movie-" + id + "/availability?country=gb"));
  }
  await assert.rejects(run(route("/tmdb-movie-7/availability?country=gb")), {
    status: 429,
  });
  const cached = await run(route("/tmdb-movie-1/availability?country=gb"));
  assert.equal(cached.state, "checked");
  assert.deepEqual(cached.offers, []);
  assert.equal(calls, 6);
});
