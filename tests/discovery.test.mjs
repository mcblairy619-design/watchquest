import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultFilters,
  discover,
  recordActivity,
  roll,
  viewingStats,
  wheelResult,
} from "../apps/web/src/discovery/discovery.ts";

function item(id, extras = {}, score = 5, services = []) {
  return {
    title: { id, name: id, type: "Film", genre: "Drama", ...extras },
    score,
    prediction: score,
    services,
  };
}
const first = item(
  "first",
  {
    time: "82 min",
    releaseDate: "2022-01-01",
    publicRating: { value: 8, source: "Fixture" },
  },
  8,
  ["Netflix"],
);
const second = item("second", { time: "120 min", releaseDate: "2024" }, 9, [
  "Netflix",
]);
const series = item("series", { type: "Series", genre: "Comedy" }, 7, ["MUBI"]);
const items = [first, second, series];

test("Discover combines filters and deduplicates without counting unknown metadata", () => {
  assert.deepEqual(
    discover(
      [...items, first],
      {
        ...defaultFilters,
        type: "Film",
        service: "Netflix",
        genre: "Drama",
        year: "2022",
        runtime: "short",
        score: "8",
        publicRating: "7",
      },
      [],
    ),
    [first],
  );
  assert.deepEqual(
    discover(items, { ...defaultFilters, type: "Film", service: "MUBI" }, []),
    [],
  );
  assert.deepEqual(
    discover(items, { ...defaultFilters, runtime: "around", unwatched: true }, [
      "second",
    ]),
    [],
  );
  assert.deepEqual(
    discover(items, { ...defaultFilters, type: "Series", service: "MUBI" }, []),
    [series],
  );
});

test("Discovery sorts sourced ratings, dates, preference matches and known runtimes", () => {
  for (const [sort, expected] of [
    ["new", [second, first, series]],
    ["old", [first, second, series]],
    ["long", [second, first, series]],
    ["short", [first, second, series]],
    ["match", [second, first, series]],
    ["public", items],
  ])
    assert.deepEqual(
      discover(items, { ...defaultFilters, sort }, []),
      expected,
    );
});

test("Dice modes draw eligible input without repeating session history", () => {
  assert.equal(roll(items, [], "best"), second.title);
  assert.equal(
    roll(items, [], "random", () => 0.99),
    series.title,
  );
  assert.equal(roll(items, ["series", "first"], "different"), second.title);
  assert.equal(
    roll(
      items,
      items.map(({ title }) => title.id),
      "random",
    ),
    undefined,
  );
});

test("Wheel handles empty and single entries and lands on the selected segment", () => {
  assert.equal(wheelResult([], 0), undefined);
  assert.equal(wheelResult(["only"], 0, () => 0.9).winner, "only");
  for (const [turn, initial] of [
    [0, 0],
    [1440, 1],
    [2550, 2],
  ]) {
    for (const index of [0, 1, 2]) {
      const result = wheelResult(items, turn, () => (index + 0.4) / 3);
      assert.equal(result.winner, items[index]);
      assert.ok(result.angle > turn);
      assert.equal(
        (result.angle + (index + 0.5) * 120) % 360,
        0,
        String(initial),
      );
    }
  }
});

test("Viewing statistics use stored types and ratings and count genres once per title", () => {
  const known = new Map([
    [first.title.id, { ...first.title, genres: ["Drama", "Drama"] }],
  ]);
  const types = { "motn-series": "Series" };
  const statistics = viewingStats(
    ["first", "first", "motn-series", "tmdb-movie-42", "old"],
    types,
    known,
    [{ value: 8 }, { value: 5 }],
  );
  assert.deepEqual(statistics, {
    films: 2,
    series: 1,
    unknown: 1,
    genres: [["Drama", 1]],
    average: 6.5,
  });
  assert.equal(viewingStats([], {}, known, []).average, undefined);
});

test("Local activity survives storage round trips without replaying a subject event", () => {
  const stored = JSON.parse(
    JSON.stringify(recordActivity({}, "film-watched", "motn-123", 123)),
  );
  assert.equal(recordActivity(stored, "film-watched", "motn-123", 500), stored);
  const rated = recordActivity(stored, "title-rated", "motn-123", 500);
  assert.deepEqual(
    Object.values(rated).map((event) => event.at),
    [123, 500],
  );
});
