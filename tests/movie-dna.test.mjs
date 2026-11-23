import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessTitle,
  changeRating,
  createWeekly,
  emptyFeedback,
  fillWeekly,
  normaliseProfile,
  replaceWeekly,
  titleGenres,
  toggleRejection,
  weekStarting,
} from "../src/movie-dna.ts";

function title(id, genres = ["Drama"], extra = {}) {
  return {
    id,
    name: id,
    type: "Film",
    genre: genres[0] ?? "Unclassified",
    genres,
    ...extra,
  };
}
function context(overrides = {}) {
  return {
    week: "2026-11-23",
    scope: "gb|netflix",
    saved: [],
    watched: [],
    history: [],
    feedback: emptyFeedback,
    basedOnDna: true,
    taste: normaliseProfile({
      name: "Guest",
      country: "United Kingdom",
      genres: [],
    }),
    ...overrides,
  };
}

test("legacy profile keeps name, country and subscriptions and maps known genre aliases", () => {
  const old = {
    name: "Guest",
    country: "Ireland",
    genres: ["Sci-fi", "Drama"],
    subscriptions: { ie: ["netflix"], gb: ["mubi"] },
  };
  const profile = normaliseProfile(old);
  assert.deepEqual(profile.genres, ["Science Fiction", "Drama"]);
  assert.deepEqual(profile.subscriptions, old.subscriptions);
  assert.equal(profile.country, "Ireland");
  assert.deepEqual(old.genres, ["Sci-fi", "Drama"]);
  assert.deepEqual(
    titleGenres(title("catalogue", ["Sci-Fi", "Reality", "True Crime"])),
    ["Science Fiction", "Reality TV"],
  );
  assert.deepEqual(
    normaliseProfile({
      ...profile,
      dna: { ...profile.dna, avoid: ["Sci-fi", "Horror"] },
    }).dna.avoid,
    ["Horror"],
  );
});

test("exclusive supported scoring uses genres and known film runtime, without inferring themes or content", () => {
  const base = normaliseProfile({
    name: "",
    country: "United Kingdom",
    genres: ["Science Fiction", "True Crime"],
  });
  const taste = {
    ...base,
    dna: {
      ...base.dna,
      avoid: ["Horror"],
      runtime: "90–120 minutes",
      stories: ["Psychological stories"],
    },
  };
  const fit = assessTitle(
    title("fit", ["Sci-fi"], { time: "110 min" }),
    taste,
    emptyFeedback,
    ["fit"],
  );
  assert.equal(fit.score, 7);
  assert.deepEqual(fit.matches, ["Science Fiction"]);
  const horror = assessTitle(
    title("horror", ["Horror", "True Crime"]),
    taste,
    emptyFeedback,
    [],
  );
  assert.equal(horror.score, -6);
  assert.deepEqual(horror.matches, []);
  assert.equal(horror.reasons.length, 2);
  const unknown = assessTitle(title("missing", []), taste, emptyFeedback, []);
  assert.deepEqual(unknown, {
    score: 0,
    matches: [],
    reasons: [],
    prediction: undefined,
  });
});

test("ratings require three relevant same-type samples and support edits and removal", () => {
  const candidate = title("new", ["Drama", "Action"]);
  const matching = title("matching", ["Drama", "Action"]);
  const low = title("low");
  const high = title("high");
  let feedback = changeRating(emptyFeedback, matching, 9);
  feedback = changeRating(feedback, low, 4);
  feedback = changeRating(
    feedback,
    title("series", ["Drama"], { type: "Series" }),
    10,
  );
  assert.equal(
    assessTitle(candidate, context().taste, feedback, []).prediction,
    undefined,
  );
  feedback = changeRating(feedback, high, 7);
  assert.equal(
    assessTitle(candidate, context().taste, feedback, []).prediction,
    7.3,
  );
  feedback = changeRating(feedback, high, 6);
  assert.equal(
    assessTitle(candidate, context().taste, feedback, []).prediction,
    7,
  );
  assert.equal(
    assessTitle(
      candidate,
      context().taste,
      changeRating(feedback, high, undefined),
      [],
    ).prediction,
    undefined,
  );
  assert.equal(
    assessTitle(title("unrelated", ["Horror"]), context().taste, feedback, [])
      .score,
    0,
  );
  assert.equal(
    assessTitle({ ...candidate, demo: true }, context().taste, feedback, [])
      .prediction,
    undefined,
  );
});

test("weekly records are unique, skip watched and rejected, and replace one slot without reordering", () => {
  const films = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => title(id));
  const series = title("s", ["Comedy"], { type: "Series" });
  const inputs = [...films, films[0], series];
  const rejected = toggleRejection(emptyFeedback, films[1]);
  const ranking = context({ watched: ["a"], feedback: rejected });
  const weekly = fillWeekly(createWeekly(ranking), inputs, ranking);
  assert.deepEqual(
    weekly.picks.map((pick) => pick.id),
    ["c", "d", "e", "f", "g", "s"],
  );
  assert.equal(fillWeekly(weekly, [...inputs].reverse(), ranking), weekly);
  const replacement = replaceWeekly(weekly, "d", inputs, ranking);
  assert.deepEqual(
    replacement.picks.map((pick) => pick.id),
    ["c", "h", "e", "f", "g", "s"],
  );
  assert.deepEqual(
    replacement.replaced.map((pick) => pick.id),
    ["d"],
  );
  assert.equal(replaceWeekly(replacement, "s", inputs, ranking), replacement);
  assert.deepEqual(toggleRejection(rejected, films[1]).rejected, {});
  assert.equal(fillWeekly(createWeekly(ranking), [], ranking).picks.length, 0);
});

test("diversity, first questionnaire and prior weeks influence selection without losing history", () => {
  const candidates = [title("a"), title("b"), title("c", ["Mystery"])];
  const bare = context({ basedOnDna: false });
  const initial = fillWeekly(createWeekly(bare), candidates, bare);
  assert.deepEqual(
    initial.picks.map((pick) => pick.id),
    ["a", "c", "b"],
  );
  const preference = normaliseProfile({
    name: "",
    country: "United Kingdom",
    genres: ["Mystery"],
  });
  const changed = context({ taste: preference });
  const personalised = fillWeekly(initial, candidates, changed);
  assert.equal(personalised.picks[0].id, "c");
  assert.equal(fillWeekly(personalised, candidates, bare), personalised);
  const next = context({ week: "2026-11-30", history: [personalised] });
  const selected = fillWeekly(
    createWeekly(next),
    [...candidates, title("fresh")],
    next,
  );
  assert.equal(selected.picks[0].id, "fresh");
  assert.equal(next.history[0], personalised);
});

test("the week rolls over at Monday midnight in London, including British Summer Time", () => {
  assert.equal(weekStarting(Date.parse("2026-07-05T22:59:59Z")), "2026-06-29");
  assert.equal(weekStarting(Date.parse("2026-07-05T23:00:00Z")), "2026-07-06");
  assert.equal(weekStarting(Date.parse("2026-11-29T23:59:59Z")), "2026-11-23");
  assert.equal(weekStarting(Date.parse("2026-11-30T00:00:00Z")), "2026-11-30");
});
