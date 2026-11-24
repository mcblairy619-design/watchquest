import type { Title } from "../catalogue/catalogue";

export const defaultFilters = {
  type: "",
  service: "",
  genre: "",
  year: "",
  runtime: "",
  score: "",
  publicRating: "",
  unwatched: false,
  sort: "default",
};
export type Filters = typeof defaultFilters;
export type ScoredTitle = {
  title: Title;
  score: number;
  prediction?: number;
  matches?: string[];
  services: string[];
};
export const minutes = (title: Title) =>
  Number(/^(\d+) min$/.exec(title.time ?? "")?.[1]) || undefined;
export function discover(
  items: ScoredTitle[],
  filters: Filters,
  watched: readonly string[],
) {
  const unique = [
    ...new Map(items.map((item) => [item.title.id, item])).values(),
  ];
  const results = unique.filter(
    ({ title, score, services }) =>
      (!filters.type || title.type === filters.type) &&
      (!filters.service || services.includes(filters.service)) &&
      (!filters.genre ||
        (title.genres?.length ? title.genres : [title.genre]).includes(
          filters.genre,
        )) &&
      (!filters.year || title.releaseDate?.slice(0, 4) === filters.year) &&
      (!filters.runtime || runtimeMatches(title, filters.runtime)) &&
      (!filters.score || score >= Number(filters.score)) &&
      (!filters.publicRating ||
        (title.publicRating?.value ?? -1) >= Number(filters.publicRating)) &&
      (!filters.unwatched || !watched.includes(title.id)),
  );
  const value = (item: ScoredTitle) => {
    if (filters.sort === "match") return -item.score;
    if (filters.sort === "public")
      return item.title.publicRating
        ? -item.title.publicRating.value
        : Infinity;
    if (filters.sort === "new" || filters.sort === "old") {
      const date = item.title.releaseDate;
      return date
        ? Number(date.replaceAll("-", "").padEnd(8, "0")) *
            (filters.sort === "new" ? -1 : 1)
        : Infinity;
    }
    const duration = minutes(item.title);
    return duration ? duration * (filters.sort === "long" ? -1 : 1) : Infinity;
  };
  return filters.sort === "default"
    ? results
    : results.sort((a, b) => value(a) - value(b));
}

export function runtimeMatches(title: Title, range: string) {
  if (!range) return true;
  const time = minutes(title);
  return !!time && (range === "short" ? time < 90 : time >= 105 && time <= 135);
}

export function roll(
  items: ScoredTitle[],
  seen: readonly string[],
  mode: string,
  random = Math.random,
) {
  const candidates = items.filter(({ title }) => !seen.includes(title.id));
  if (mode === "best")
    return [...candidates].sort((a, b) => b.score - a.score)[0]?.title;
  if (mode === "different")
    return [...candidates].sort(
      (a, b) =>
        (a.matches?.length ?? 0) - (b.matches?.length ?? 0) ||
        b.score - a.score,
    )[0]?.title;
  return candidates[Math.floor(random() * candidates.length)]?.title;
}

export function wheelResult<T>(
  items: readonly T[],
  turn: number,
  random = Math.random,
) {
  if (!items.length) return undefined;
  const index = Math.floor(random() * items.length);
  return {
    winner: items[index],
    angle:
      (Math.floor(turn / 360) + 4) * 360 +
      360 -
      ((index + 0.5) * 360) / items.length,
  };
}

export type Activity = Record<
  string,
  { kind: string; subject: string; at: number }
>;
export function recordActivity(
  events: Activity,
  kind: string,
  subject: string,
  at: number,
) {
  const key = kind + ":" + subject;
  return Object.hasOwn(events, key)
    ? events
    : { ...events, [key]: { kind, subject, at } };
}
export function viewingStats(
  watched: readonly string[],
  types: Record<string, Title["type"]>,
  known: Map<string, Title>,
  ratings: { value: number }[],
) {
  const ids = [...new Set(watched)];
  const genres = new Map<string, number>();
  let films = 0,
    series = 0;
  for (const id of ids) {
    const title = known.get(id);
    const type =
      title?.type ??
      types[id] ??
      (id.startsWith("tmdb-movie-")
        ? "Film"
        : id.startsWith("tmdb-tv-")
          ? "Series"
          : undefined);
    if (type === "Film") films++;
    if (type === "Series") series++;
    if (title)
      for (const genre of new Set(
        title.genres?.length ? title.genres : [title.genre],
      )) {
        if (genre !== "Unclassified")
          genres.set(genre, (genres.get(genre) ?? 0) + 1);
      }
  }
  return {
    films,
    series,
    unknown: ids.length - films - series,
    genres: [...genres].sort((a, b) => b[1] - a[1]),
    average: ratings.length
      ? ratings.reduce((n, r) => n + r.value, 0) / ratings.length
      : undefined,
  };
}
