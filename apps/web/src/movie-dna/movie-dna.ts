import type { Title } from "../catalogue/catalogue";

export const catalogueGenres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Mystery",
  "Music",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
  "Reality TV",
] as const;
export const descriptiveGenres = [
  "Biography",
  "Musical",
  "Sport",
  "Superhero",
  "True Crime",
] as const;
export const stories = [
  "Clever plot twists",
  "Psychological stories",
  "Dark humour",
  "Lighthearted comedy",
  "Suspense and tension",
  "Fast-paced action",
  "Slow-burning mysteries",
  "Emotional storytelling",
  "Character-driven stories",
  "Crime investigations",
  "Science fiction concepts",
  "Fantasy worlds",
  "Real-life stories",
  "Historical settings",
  "Unpredictable endings",
  "Feel-good stories",
  "Thought-provoking themes",
  "Adventure and exploration",
] as const;
export const pacingOptions = [
  "Fast-paced",
  "Balanced",
  "Slow-burning",
  "Depends on my mood",
  "No preference",
] as const;
export const runtimeOptions = [
  "Under 90 minutes",
  "90–120 minutes",
  "120–150 minutes",
  "Over 150 minutes",
  "No preference",
] as const;
export const contentOptions = [
  "Avoid excessive gore",
  "Avoid jump scares",
  "Avoid explicit sexual content",
  "Avoid particularly sad stories",
  "Prefer family-friendly content",
  "No content restrictions",
] as const;

export type TitleSummary = Pick<
  Title,
  "id" | "name" | "type" | "genre" | "genres"
> & { demo?: boolean };
export type MovieDna = {
  avoid: string[];
  stories: string[];
  pacing: (typeof pacingOptions)[number];
  runtime: (typeof runtimeOptions)[number];
  content: string[];
  favourites: TitleSummary[];
};
export type Profile = {
  name: string;
  country: string;
  genres: string[];
  subscriptions?: Record<string, string[]>;
  subscriptionNames?: Record<string, Record<string, string>>;
  dna?: MovieDna;
};
export type Rating = { title: TitleSummary; value: number };
export type Feedback = {
  ratings: Record<string, Rating>;
  rejected: Record<string, TitleSummary>;
};
export const emptyFeedback: Feedback = { ratings: {}, rejected: {} };
export const defaultProfile: Profile = {
  name: "",
  country: "United Kingdom",
  genres: [],
};

function genreLabel(value: string): string {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  if (["scifi", "sciencefiction"].includes(key)) return "Science Fiction";
  if (["reality", "realitytv"].includes(key)) return "Reality TV";
  return (
    [...catalogueGenres, ...descriptiveGenres].find(
      (label) => label.toLowerCase().replace(/[^a-z]/g, "") === key,
    ) ?? value
  );
}

export function canonicalGenres(values: readonly string[]) {
  return [...new Set(values.map(genreLabel))];
}

export function titleGenres(title: TitleSummary) {
  return canonicalGenres(
    title.genres?.length ? title.genres : [title.genre],
  ).filter((genre) => catalogueGenres.some((known) => known === genre));
}

export function normaliseProfile(
  profile: Profile,
): Profile & { dna: MovieDna } {
  const genres = canonicalGenres(profile.genres ?? []);
  const dna = profile.dna;
  return {
    ...profile,
    genres,
    dna: {
      avoid: canonicalGenres(dna?.avoid ?? []).filter(
        (genre) => !genres.includes(genre),
      ),
      stories: dna?.stories ?? [],
      pacing: dna?.pacing ?? "No preference",
      runtime: dna?.runtime ?? "No preference",
      content: dna?.content ?? [],
      favourites: dna?.favourites ?? [],
    },
  };
}

export function toggleChoice(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function summariseTitle(title: TitleSummary): TitleSummary {
  return {
    id: title.id,
    name: title.name,
    type: title.type,
    genre: title.genre,
    genres: title.genres,
    demo: title.demo,
  };
}

export function changeRating(
  feedback: Feedback,
  title: TitleSummary,
  value?: number,
): Feedback {
  const ratings = { ...feedback.ratings };
  if (value === undefined) delete ratings[title.id];
  else if (Number.isInteger(value) && value >= 1 && value <= 10) {
    ratings[title.id] = { title: summariseTitle(title), value };
  }
  return { ...feedback, ratings };
}

export function toggleRejection(
  feedback: Feedback,
  title: TitleSummary,
): Feedback {
  const rejected = { ...feedback.rejected };
  if (Object.hasOwn(rejected, title.id)) delete rejected[title.id];
  else rejected[title.id] = summariseTitle(title);
  return { ...feedback, rejected };
}

function matchingRuntime(title: Title, runtime: MovieDna["runtime"]) {
  if (title.type !== "Film" || runtime === "No preference") return false;
  const minutes = Number(/^(\d+) min$/.exec(title.time ?? "")?.[1]);
  if (runtime === "Under 90 minutes") return minutes > 0 && minutes < 90;
  if (runtime === "90–120 minutes") return minutes >= 90 && minutes <= 120;
  if (runtime === "120–150 minutes") return minutes >= 120 && minutes <= 150;
  return minutes > 150;
}

type Assessment = {
  score: number;
  reasons: string[];
  matches: string[];
  prediction?: number;
};
type Taste = ReturnType<typeof normaliseProfile>;

export function assessTitle(
  title: Title,
  taste: Taste,
  feedback: Feedback,
  saved: readonly string[],
): Assessment {
  const genres = titleGenres(title);
  const matches = genres.filter((genre) => taste.genres.includes(genre));
  const avoided = genres.filter((genre) => taste.dna.avoid.includes(genre));
  const runtime = matchingRuntime(title, taste.dna.runtime);
  const shared = (other: TitleSummary) =>
    titleGenres(other).filter((genre) => genres.includes(genre)).length;
  const demo = !!title.demo;
  const similar = Object.values(feedback.ratings)
    .filter(
      ({ title: other, value }) =>
        other.id !== title.id &&
        other.type === title.type &&
        !!other.demo === demo &&
        value >= 1 &&
        value <= 10,
    )
    .map((rating) => ({ ...rating, weight: shared(rating.title) }))
    .filter((rating) => rating.weight > 0);
  const high = similar.filter(({ value }) => value >= 7);
  const favourite = taste.dna.favourites.some(
    (other) =>
      other.id !== title.id && other.type === title.type && shared(other) > 0,
  );
  const isSaved = saved.includes(title.id);
  const reasons: string[] = [];
  if (matches.length)
    reasons.push("Matches your interest in " + matches.join(", ") + ".");
  if (runtime) reasons.push("Fits your preferred film length.");
  if (high.length)
    reasons.push(
      high.length > 1
        ? "Shares genres with titles you rated highly."
        : "Shares a genre with a title you rated highly.",
    );
  else if (favourite)
    reasons.push("Shares a genre with one of your favourites.");
  if (isSaved) reasons.push("Already on your watchlist.");
  if (avoided.length) {
    if (!reasons.length)
      reasons.push("One of the available candidates for this slot.");
    reasons.push(
      "Also includes a genre you prefer to avoid: " + avoided.join(", ") + ".",
    );
  }
  const score =
    Math.min(3, matches.length) * 4 -
    avoided.length * 6 +
    (runtime ? 2 : 0) +
    Math.min(6, high.length * 1.5) +
    (favourite ? 1 : 0) +
    (isSaved ? 1 : 0);
  const weight = similar.reduce((total, entry) => total + entry.weight, 0);
  const prediction =
    !demo && similar.length >= 3
      ? Math.round(
          (similar.reduce(
            (total, entry) => total + entry.weight * entry.value,
            0,
          ) /
            weight) *
            10,
        ) / 10
      : undefined;
  return { score, reasons, matches, prediction };
}

export type WeeklyPick = TitleSummary & Pick<Assessment, "matches" | "reasons">;
export type WeeklyRecord = {
  week: string;
  scope: string;
  picks: WeeklyPick[];
  replaced: WeeklyPick[];
  basedOnDna?: boolean;
};
export type RankingContext = {
  taste: Taste;
  feedback: Feedback;
  saved: readonly string[];
  watched: readonly string[];
  history: readonly WeeklyRecord[];
  week: string;
  scope: string;
  basedOnDna?: boolean;
};

const londonDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function weekStarting(now: number) {
  const parts = londonDate.formatToParts(now);
  const part = (type: string) =>
    Number(parts.find((value) => value.type === type)?.value);
  const day = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export function createWeekly(context: RankingContext): WeeklyRecord {
  return {
    week: context.week,
    scope: context.scope,
    picks: [],
    replaced: [],
    basedOnDna: context.basedOnDna,
  };
}

function choose(
  candidates: readonly Title[],
  type: Title["type"],
  record: WeeklyRecord,
  context: RankingContext,
) {
  const excluded = new Set([
    ...context.watched,
    ...Object.keys(context.feedback.rejected),
    ...record.picks.map(({ id }) => id),
    ...record.replaced.map(({ id }) => id),
  ]);
  const recentWeeks = [
    ...new Set(
      context.history
        .filter(
          (item) => item.scope === context.scope && item.week < context.week,
        )
        .map((item) => item.week),
    ),
  ]
    .sort()
    .reverse()
    .slice(0, 3);
  const recent = new Set(
    context.history
      .filter(
        (item) =>
          item.scope === context.scope && recentWeeks.includes(item.week),
      )
      .flatMap((item) => [...item.picks, ...item.replaced].map(({ id }) => id)),
  );
  const used = record.picks.flatMap(titleGenres);
  const options = candidates
    .filter((title) => title.type === type && !excluded.has(title.id))
    .map((title) => {
      const assessment = assessTitle(
        title,
        context.taste,
        context.feedback,
        context.saved,
      );
      const overlap = titleGenres(title).filter((genre) =>
        used.includes(genre),
      ).length;
      const score = assessment.score - Math.min(6, overlap * 2);
      return { title, assessment, score };
    });
  options.sort(
    (a, b) =>
      Number(recent.has(a.title.id)) - Number(recent.has(b.title.id)) ||
      b.score - a.score ||
      (a.title.id < b.title.id ? -1 : a.title.id > b.title.id ? 1 : 0),
  );
  const winner = options[0];
  if (!winner) return undefined;
  const { reasons, matches } = winner.assessment;
  return { ...summariseTitle(winner.title), reasons, matches };
}

export function fillWeekly(
  record: WeeklyRecord,
  candidates: readonly Title[],
  context: RankingContext,
): WeeklyRecord {
  let next =
    context.basedOnDna &&
    !record.basedOnDna &&
    !record.replaced.length &&
    candidates.length
      ? createWeekly(context)
      : record;
  for (const [type, limit] of [
    ["Film", 5],
    ["Series", 1],
  ] as const) {
    let count = next.picks.filter((pick) => pick.type === type).length;
    while (count < limit) {
      const pick = choose(candidates, type, next, context);
      if (!pick) break;
      next = { ...next, picks: [...next.picks, pick] };
      count++;
    }
  }
  return next;
}

export function replaceWeekly(
  record: WeeklyRecord,
  id: string,
  candidates: readonly Title[],
  context: RankingContext,
) {
  const original = record.picks.find((pick) => pick.id === id);
  if (!original) return record;
  const working = {
    ...record,
    picks: record.picks.filter((pick) => pick.id !== id),
    replaced: [...record.replaced, original],
  };
  const replacement = choose(candidates, original.type, working, context);
  return replacement
    ? {
        ...working,
        picks: record.picks.map((pick) =>
          pick.id === id ? replacement : pick,
        ),
      }
    : record;
}
