import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Crown,
  Dna,
  Dices,
  House,
  Search,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import { titles as demoTitles } from "./catalogue/demo";
import {
  Availability,
  countries,
  hasFreshOffers,
  includedWith,
  includedServices,
  Poster,
  useCatalogueRequest,
} from "./catalogue/catalogue";
import type { Title } from "./catalogue/catalogue";
import {
  MovieDnaPage,
  MovieDnaQuestionnaire,
  RatingInput,
} from "./movie-dna/movie-dna-ui";
import {
  assessTitle,
  changeRating,
  createWeekly,
  defaultProfile,
  emptyFeedback,
  fillWeekly,
  normaliseProfile,
  replaceWeekly,
  toggleRejection,
  weekStarting,
  summariseTitle,
} from "./movie-dna/movie-dna";
import type {
  Feedback,
  Profile,
  RankingContext,
  TitleSummary,
  WeeklyPick,
  WeeklyRecord,
} from "./movie-dna/movie-dna";
import {
  defaultFilters,
  discover,
  recordActivity,
  roll,
  viewingStats,
  wheelResult,
} from "./discovery/discovery";
import type { Activity, Filters } from "./discovery/discovery";
import { Choice, DiscoveryFilters } from "./discovery/discovery-ui";
import "./style.css";

const pages = [
  { id: "home", name: "Home", icon: House },
  { id: "discover", name: "Discover", icon: Compass },
  { id: "watchlist", name: "My Watchlist", icon: Bookmark },
  { id: "achievements", name: "Achievements", icon: Trophy },
  { id: "profile", name: "Profile", icon: UserRound },
  { id: "community", name: "Community", icon: Users },
  { id: "premium", name: "Premium", icon: Crown },
  { id: "movie-dna", name: "Movie DNA", icon: Dna },
] as const;
type Page = (typeof pages)[number];
type Overlay =
  | "dice"
  | "spin"
  | "onboard"
  | "edit-dna"
  | "notifications"
  | "credits"
  | Title;

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <a
      className={mobile ? "mobile-brand brand" : "brand"}
      href="#home"
      aria-label="WatchQuest home"
    >
      <img className="brand-shield" src="/media/watchquest-shield.png" alt="" />
      <img
        className="brand-wordmark"
        src="/media/watchquest-wordmark.png"
        alt="WatchQuest"
      />
    </a>
  );
}
function readLocal<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem("sg-phase1-" + key) ?? "null") ?? fallback
    );
  } catch {
    return fallback;
  }
}
function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState(() => readLocal(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem("sg-phase1-" + key, JSON.stringify(value));
    } catch {
      /* The current session can still run without persistent storage. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
const activePage = () =>
  pages.find((item) => "#" + item.id === location.hash)?.id ?? "home";

function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close" onClick={close}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function RequestMessage({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  return loading ? (
    <p role="status" className="catalogue-loading">
      Loading catalogue…
    </p>
  ) : error ? (
    <div className="panel">
      <p role="status">{error}</p>
      <button className="button secondary" onClick={retry}>
        Retry
      </button>
    </div>
  ) : null;
}

function SavedEntry({
  id,
  country,
  render,
  remove,
  known,
  verified,
  onResolved,
}: {
  id: string;
  country: string;
  render: (title: Title) => ReactNode;
  remove: () => void;
  known?: Title;
  verified?: Title;
  onResolved: (title: Title) => void;
}) {
  const demo = demoTitles.find((title) => title.id === id);
  const request = useCatalogueRequest<{ title: Title }>(
    demo || verified
      ? undefined
      : "/api/catalogue/" +
          encodeURIComponent(id) +
          "?country=" +
          (countries[country] ?? ""),
  );
  const resolved = request.data?.title;
  useEffect(() => {
    if (resolved) onResolved(resolved);
  }, [resolved, onResolved]);
  const title = demo ?? verified ?? resolved ?? known;
  if (title) return render(title);
  return (
    <div className="panel">
      <RequestMessage {...request} />
      {!request.loading && !request.error && (
        <p>Details for this saved entry are unavailable.</p>
      )}
      <button className="button secondary" onClick={remove}>
        Remove saved entry
      </button>
    </div>
  );
}

function TitleDetails({ title, country }: { title: Title; country: string }) {
  const detail = useCatalogueRequest<{ title: Title }>(
    !title.demo && !title.source ? "/api/catalogue/" + title.id : undefined,
  );
  const item = detail.data?.title ?? title;
  return (
    <>
      <div className="result">
        <Poster title={item} />
        <div>
          {item.demo && <p className="eyebrow">FICTIONAL DEMO TITLE</p>}
          <p>
            {[
              item.genres?.length ? item.genres.join(", ") : item.genre,
              item.type,
              item.time,
              item.releaseDate,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p>{item.synopsis || "Description unavailable."}</p>
          {detail.error && (
            <p>
              Full details unavailable.{" "}
              <button className="button secondary" onClick={detail.retry}>
                Retry
              </button>
            </p>
          )}
        </div>
      </div>
      <Availability title={item} country={country} />
    </>
  );
}

function App() {
  const [page, setPage] = useState(activePage);
  const [weeklyRequested, setWeeklyRequested] = useState(page === "home");
  const [saved, setSaved] = useLocal<string[]>("saved", []);
  const [watched, setWatched] = useLocal<string[]>("watched", []);
  const [watchedTypes, setWatchedTypes] = useLocal<
    Record<string, Title["type"]>
  >("watched-types", {});
  const [profile, setProfile] = useLocal<Profile>("profile", defaultProfile);
  const [feedback, setFeedback] = useLocal<Feedback>(
    "movie-feedback",
    emptyFeedback,
  );
  const [weeks, setWeeks] = useLocal<WeeklyRecord[]>("weekly-picks", []);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [resolvedSaved, setResolvedSaved] = useState<Record<string, Title>>({});
  const rememberSaved = useCallback(
    (title: Title) =>
      setResolvedSaved((previous) =>
        previous[title.id] === title
          ? previous
          : { ...previous, [title.id]: title },
      ),
    [],
  );
  const [savedQuery, setSavedQuery] = useState("");
  const [savedFilters, setSavedFilters] = useState<Filters>(defaultFilters);
  const [savedOrder, setSavedOrder] = useState("latest");
  const [priorities, setPriorities] = useLocal<string[]>(
    "saved-priorities",
    [],
  );
  const [knownTitles, setKnownTitles] = useLocal<Record<string, TitleSummary>>(
    "activity-titles",
    {},
  );
  const [events, setEvents] = useLocal<Activity>("activity-events-v1", {});
  const [undo, setUndo] = useState<{ id: string; index: number }>();
  const [diceFilters, setDiceFilters] = useState<Filters>(defaultFilters);
  const [diceMode, setDiceMode] = useState("random");
  const [rollHistory, setRollHistory] = useState<
    { title: Title; reason: string }[]
  >([]);
  const [wheelSource, setWheelSource] = useState("weekly");
  const [wheelSelected, setWheelSelected] = useState<string[]>([]);
  const [wheelHidden, setWheelHidden] = useState<string[]>([]);
  const [replacementMessage, setReplacementMessage] = useState("");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [clock, setClock] = useState(Date.now);
  const [overlay, setOverlay] = useState<Overlay>();
  const [result, setResult] = useState<Title>();
  const diceHistory = rollHistory.map(({ title }) => title.id);
  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const spinTimer = useRef<number | undefined>(undefined);
  const search = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const status = useCatalogueRequest<{ enabled: boolean; tmdb?: boolean }>(
    "/api/catalogue/status",
  );
  const live = status.data?.enabled === true;
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const region = countries[profile.country] ?? "";
  const services = profile.subscriptions?.[region] ?? [];
  const cataloguePath =
    "/api/catalogue?country=" +
    region +
    "&services=" +
    encodeURIComponent([...services].sort().join(","));
  const catalogue = useCatalogueRequest<{ titles: Title[] }>(
    live ? cataloguePath : undefined,
  );
  const searchPath =
    live && page === "discover" && submitted
      ? cataloguePath + "&q=" + encodeURIComponent(submitted)
      : undefined;
  const searchResults = useCatalogueRequest<{ titles: Title[] }>(
    searchPath,
    350,
  );
  const eligibleNow = (title: Title, now: number) =>
    title.demo
      ? status.data?.enabled === false
      : live && includedWith(title, region, services, now);
  const primaryTitles: readonly Title[] = live
    ? (catalogue.data?.titles ?? []).filter((title) =>
        eligibleNow(title, clock),
      )
    : demoTitles;
  const countUnseen = (type: Title["type"]) =>
    primaryTitles.filter(
      (title) =>
        title.type === type &&
        !watched.includes(title.id) &&
        !Object.hasOwn(feedback.rejected, title.id),
    ).length;
  const canSupplement = live && weeklyRequested && primaryTitles.length > 0;
  const filmSupplement = useCatalogueRequest<{ titles: Title[] }>(
    canSupplement && countUnseen("Film") < 5
      ? cataloguePath + "&kind=movie"
      : undefined,
  );
  const seriesSupplement = useCatalogueRequest<{ titles: Title[] }>(
    canSupplement && countUnseen("Series") < 1
      ? cataloguePath + "&kind=series"
      : undefined,
  );
  const titles = [
    ...new Map(
      [
        ...primaryTitles,
        ...(filmSupplement.data?.titles ?? []),
        ...(seriesSupplement.data?.titles ?? []),
      ]
        .filter((title) => eligibleNow(title, clock))
        .map((title) => [title.id, title]),
    ).values(),
  ];
  const week = weekStarting(clock);
  const scope = live
    ? region + "|" + [...new Set(services)].sort().join(",")
    : "demo";
  const ranking: RankingContext = {
    taste: normaliseProfile(profile),
    feedback,
    saved,
    watched,
    history: weeks,
    week,
    scope,
    basedOnDna: !!profile.dna || profile.genres.length > 0,
  };
  const existingWeek = weeks.find(
    (entry) => entry.week === week && entry.scope === scope,
  );
  const weeklyRecord = fillWeekly(
    existingWeek ?? createWeekly(ranking),
    titles,
    ranking,
  );
  const canSaveWeek = live
    ? !!catalogue.data && !filmSupplement.loading && !seriesSupplement.loading
    : status.data?.enabled === false || !!status.error;
  useEffect(() => {
    if (
      !canSaveWeek ||
      !weeklyRecord.picks.length ||
      weeklyRecord === existingWeek
    )
      return;
    setWeeks((previous) => {
      const old = previous.find(
        (entry) =>
          entry.week === weeklyRecord.week &&
          entry.scope === weeklyRecord.scope,
      );
      if (old !== existingWeek) return previous;
      return old
        ? previous.map((entry) => (entry === old ? weeklyRecord : entry))
        : [...previous, weeklyRecord];
    });
  }, [canSaveWeek, existingWeek, weeklyRecord, setWeeks]);
  const activeTitles = new Map(
    titles
      .filter(
        (title) =>
          !watched.includes(title.id) &&
          !Object.hasOwn(feedback.rejected, title.id),
      )
      .map((title) => [title.id, title]),
  );
  const orderedPicks = [...weeklyRecord.picks].sort(
    (a, b) => Number(a.type === "Series") - Number(b.type === "Series"),
  );
  const weekly = orderedPicks.flatMap((pick) => {
    const title = activeTitles.get(pick.id);
    return title ? [title] : [];
  });
  const predictions = new Map(
    weekly.map((title) => [
      title.id,
      assessTitle(title, ranking.taste, feedback, saved).prediction,
    ]),
  );
  const inactive = weeklyRecord.picks.filter(
    (pick) => !activeTitles.has(pick.id),
  );
  const checkingWeekly =
    catalogue.loading || filmSupplement.loading || seriesSupplement.loading;
  const weeklyError =
    catalogue.error ?? filmSupplement.error ?? seriesSupplement.error;
  const browseRequest =
    status.loading || status.error
      ? status
      : searchPath
        ? searchResults
        : catalogue;
  const browse = searchPath
    ? (searchResults.data?.titles ?? []).filter((title) =>
        eligibleNow(title, clock),
      )
    : primaryTitles;
  const firstFilm = watched.some(
    (id) =>
      id.startsWith("tmdb-movie-") ||
      watchedTypes[id] === "Film" ||
      demoTitles.some((title) => title.id === id && title.type === "Film"),
  );

  useEffect(() => {
    if (!live || page !== "achievements" || firstFilm) return;
    const unknown = watched.filter(
      (id) => id.startsWith("motn-") && !watchedTypes[id],
    );
    if (!unknown.length) return;
    const controller = new AbortController();
    const resolveTypes = async () => {
      const resolved: Record<string, Title["type"]> = {};
      for (const id of new Set(unknown)) {
        if (controller.signal.aborted) return;
        try {
          const response = await fetch(
            "/api/catalogue/" + encodeURIComponent(id),
            { signal: controller.signal },
          );
          if (response.status === 429) break;
          if (!response.ok) continue;
          const { title } = (await response.json()) as { title?: Title };
          if (
            title?.id !== id ||
            (title.type !== "Film" && title.type !== "Series")
          )
            continue;
          resolved[id] = title.type;
          if (title.type === "Film") break;
        } catch {
          if (controller.signal.aborted) return;
          break;
        }
      }
      if (!controller.signal.aborted && Object.keys(resolved).length) {
        setWatchedTypes((previous) => ({ ...resolved, ...previous }));
      }
    };
    void resolveTypes();
    return () => controller.abort();
  }, [live, page, firstFilm, watched, watchedTypes, setWatchedTypes]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSubmitted("");
    setFilters(defaultFilters);
  }, []);
  useEffect(() => {
    const navigate = () => {
      const nextPage = activePage();
      if (nextPage === "home") setWeeklyRequested(true);
      if (nextPage !== "discover") clearSearch();
      setPage(nextPage);
      window.scrollTo(0, 0);
      if (document.activeElement !== search.current)
        main.current?.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [clearSearch]);
  useEffect(() => () => window.clearTimeout(spinTimer.current), []);
  useEffect(() => {
    document.title =
      page === "home"
        ? "WatchQuest"
        : pages.find((item) => item.id === page)?.name + " | WatchQuest";
  }, [page]);

  const event = (kind: string, subject: string) =>
    setEvents((previous) =>
      recordActivity(previous, kind, subject, Date.now()),
    );
  const toggleSaved = (title: Title) => {
    const { id } = title;
    setKnownTitles((previous) => ({
      ...previous,
      [id]: summariseTitle(title),
    }));
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  };
  const toggleWatched = (title: Title) => {
    const { id, type } = title;
    const { genre, genres } = title;
    setKnownTitles((previous) => ({
      ...previous,
      [id]: summariseTitle(title),
    }));
    if (!watched.includes(id)) {
      if (type === "Film") event("film-watched", id);
      for (const item of genres?.length ? genres : [genre]) {
        if (item !== "Unclassified") event("genre-watched", item);
      }
    }
    if (id.startsWith("motn-"))
      setWatchedTypes((previous) => ({ ...previous, [id]: type }));
    setWatched((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  };
  const rate = (title: TitleSummary, value?: number) => {
    if (value !== undefined) event("title-rated", title.id);
    setFeedback((previous) => changeRating(previous, title, value));
  };
  useEffect(() => {
    if (
      weeklyRecord.picks.length !== 6 ||
      !weeklyRecord.picks.every((pick) => watched.includes(pick.id))
    )
      return;
    setEvents((previous) =>
      recordActivity(
        previous,
        "weekly-completed",
        weeklyRecord.week + "|" + weeklyRecord.scope,
        Date.now(),
      ),
    );
  }, [weeklyRecord, watched, setEvents]);
  const reject = (title: TitleSummary) =>
    setFeedback((previous) => toggleRejection(previous, title));
  const replace = (id: string) => {
    const candidates = titles.filter((title) => eligibleNow(title, Date.now()));
    const next = replaceWeekly(weeklyRecord, id, candidates, ranking);
    if (next === weeklyRecord) {
      setReplacementMessage(
        "No eligible replacement of the same type is available.",
      );
      return;
    }
    setWeeks((previous) => {
      const current = previous.find(
        (entry) => entry.week === week && entry.scope === scope,
      );
      const updated =
        !current || current === weeklyRecord
          ? next
          : replaceWeekly(current, id, candidates, ranking);
      if (updated === current) return previous;
      return current
        ? previous.map((entry) => (entry === current ? updated : entry))
        : [...previous, updated];
    });
    setReplacementMessage(
      "Replaced one pick. The rest of the week is unchanged.",
    );
  };
  const close = () => {
    window.clearTimeout(spinTimer.current);
    setSpinning(false);
    setOverlay(undefined);
  };
  const open = (value: Overlay) => {
    setResult(undefined);
    setTurn(0);
    setOverlay(value);
  };
  const asScored = (title: Title) => ({
    title,
    ...assessTitle(title, ranking.taste, feedback, saved),
    services: includedServices(title, region, services, clock),
  });
  const pool = [
    ...new Map(
      [
        ...Object.values(resolvedSaved).filter(
          (title) =>
            live &&
            includedWith(title, region, services, clock) &&
            !watched.includes(title.id) &&
            !Object.hasOwn(feedback.rejected, title.id),
        ),
        ...activeTitles.values(),
        ...browse.filter(
          (title) =>
            !watched.includes(title.id) &&
            !Object.hasOwn(feedback.rejected, title.id),
        ),
      ].map((title) => [title.id, title]),
    ).values(),
  ];
  const spinPool = (
    wheelSource === "weekly"
      ? weekly
      : pool.filter((title) =>
          (wheelSource === "saved" ? saved : wheelSelected).includes(title.id),
        )
  ).filter(
    (title) =>
      title.type === "Film" &&
      !wheelHidden.includes(title.id) &&
      eligibleNow(title, clock),
  );
  const dicePool = discover(pool.map(asScored), diceFilters, watched).map(
    (item) => item.title,
  );
  function rollDice() {
    const next = roll(
      dicePool.filter((title) => eligibleNow(title, Date.now())).map(asScored),
      diceHistory,
      diceMode,
    );
    if (next) {
      setResult(next);
      const reason =
        diceMode === "best"
          ? "Highest Movie DNA match among titles you have not rolled with these options."
          : diceMode === "different"
            ? "Fewer overlaps with your favourite genres, with stronger Movie DNA matches preferred on a tie."
            : "Drawn at random from titles you have not rolled with these options.";
      setRollHistory((previous) => [...previous, { title: next, reason }]);
    }
  }
  function spinWheel() {
    if (spinning || spinPool.some((title) => !eligibleNow(title, Date.now())))
      return;
    const spin = wheelResult(spinPool, turn);
    if (!spin) return;
    setTurn(spin.angle);
    setResult(undefined);
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      spinPool.length === 1
    ) {
      setResult(spin.winner);
      return;
    }
    setSpinning(true);
    spinTimer.current = window.setTimeout(() => {
      setResult(eligibleNow(spin.winner, Date.now()) ? spin.winner : undefined);
      setSpinning(false);
    }, 950);
  }
  const nav = (item: Page, label: string = item.name) => (
    <a
      key={item.id}
      href={"#" + item.id}
      aria-current={page === item.id ? "page" : undefined}
    >
      <item.icon size={19} />
      <span>{label}</span>
    </a>
  );
  const filtered = discover(
    browse
      .filter(
        (title) =>
          live ||
          (title.name + " " + title.genre + " " + title.type)
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      )
      .map(asScored),
    filters,
    watched,
  ).map((item) => item.title);
  const activityTitles = new Map(
    [
      ...Object.values(feedback.ratings).map(({ title }) => title),
      ...Object.values(knownTitles),
      ...demoTitles,
      ...Object.values(resolvedSaved),
      ...titles,
    ].map((title) => [title.id, title]),
  );
  const stats = viewingStats(
    watched,
    watchedTypes,
    activityTitles,
    Object.values(feedback.ratings),
  );
  const savedIds = [...saved].sort((a, b) => {
    if (savedOrder === "priority")
      return (
        Number(priorities.includes(b)) - Number(priorities.includes(a)) ||
        saved.indexOf(b) - saved.indexOf(a)
      );
    if (savedOrder === "oldest") return saved.indexOf(a) - saved.indexOf(b);
    if (savedOrder === "match") {
      const score = (id: string) => {
        const title = activityTitles.get(id);
        return title ? asScored(title).score : -Infinity;
      };
      return score(b) - score(a);
    }
    return saved.indexOf(b) - saved.indexOf(a);
  });
  const savedMatches = (title: Title) =>
    title.name.toLowerCase().includes(savedQuery.trim().toLowerCase()) &&
    discover([asScored(title)], savedFilters, watched).length > 0;
  const filteringSaved = !!(
    savedQuery.trim() ||
    savedFilters.type ||
    savedFilters.service
  );
  const removeSaved = (id: string) => {
    setUndo({ id, index: saved.indexOf(id) });
    setSaved((previous) => previous.filter((item) => item !== id));
  };
  const restoreSaved = () => {
    if (!undo) return;
    setSaved((previous) =>
      previous.includes(undo.id)
        ? previous
        : [
            ...previous.slice(0, undo.index),
            undo.id,
            ...previous.slice(undo.index),
          ],
    );
    setUndo(undefined);
  };
  const recent = watched
    .slice(-3)
    .reverse()
    .flatMap((id) => {
      const title = activityTitles.get(id);
      return title ? [title] : [];
    });
  const card = (title: Title, pick?: WeeklyPick) => (
    <article className="card" key={title.id}>
      <button
        className="poster"
        aria-label={"View " + title.name}
        onClick={() => open(title)}
      >
        <Poster title={title} />
        {title.demo && <span className="match">Demo title</span>}
        <span className="poster-title">{title.name}</span>
      </button>
      <div className="card-footer">
        <div>
          <h3>{title.name}</h3>
          <p>
            {[title.type, title.releaseDate?.slice(0, 4), title.time]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p>{title.genres?.join(", ") || title.genre}</p>
          {title.publicRating && (
            <p>
              Public rating: {title.publicRating.value}/10 (
              {title.publicRating.source})
            </p>
          )}
          {live &&
            (pick || page === "discover" || page === "watchlist") &&
            includedServices(title, region, services, clock).map((service) => (
              <p key={service} className="card-offer">
                Included with {service}
              </p>
            ))}
          {page === "watchlist" &&
            !includedWith(title, region, services, clock) && (
              <p>
                {hasFreshOffers(title, region, clock)
                  ? "No verified offer with your selected subscriptions"
                  : "Availability not recently verified"}
              </p>
            )}
          {Object.hasOwn(feedback.rejected, title.id) && <p>Not interested</p>}
          {feedback.ratings[title.id] && (
            <p>Your rating: {feedback.ratings[title.id].value}/10</p>
          )}
          {pick && (
            <div className="pick-explanation">
              {predictions.get(title.id) !== undefined && (
                <strong>
                  {predictions.get(title.id)?.toFixed(1)}/10 predicted for you
                </strong>
              )}
              <p>
                {pick.reasons.length
                  ? pick.reasons.join(" ")
                  : live
                    ? "Selected from verified titles on your streaming services."
                    : "Selected from the fictional demo catalogue."}
              </p>
              {pick.matches.length > 0 && (
                <p>Matching genres: {pick.matches.join(", ")}</p>
              )}
            </div>
          )}
        </div>
        <div className="card-controls">
          <button
            className="icon-button"
            aria-label={
              saved.includes(title.id)
                ? "Remove " + title.name + " from watchlist"
                : "Save " + title.name
            }
            aria-pressed={saved.includes(title.id)}
            onClick={() =>
              page === "watchlist" ? removeSaved(title.id) : toggleSaved(title)
            }
          >
            <Bookmark size={17} />
          </button>
          {(pick || page === "discover" || page === "watchlist") && (
            <button
              className="icon-button"
              aria-pressed={watched.includes(title.id)}
              aria-label={
                (watched.includes(title.id)
                  ? "Mark unwatched: "
                  : "Mark watched: ") + title.name
              }
              onClick={() => {
                toggleWatched(title);
                open(title);
              }}
            >
              <Check size={17} />
            </button>
          )}
        </div>
        {page === "watchlist" && (
          <button
            className="text-button"
            aria-pressed={priorities.includes(title.id)}
            onClick={() =>
              setPriorities((previous) =>
                previous.includes(title.id)
                  ? previous.filter((id) => id !== title.id)
                  : [...previous, title.id],
              )
            }
          >
            Viewing priority
          </button>
        )}
        {pick && (
          <div className="pick-actions">
            <button
              className="text-button"
              onClick={() => replace(title.id)}
              aria-label={"Replace " + title.name}
            >
              Replace
            </button>
            <button
              className="text-button"
              onClick={() => open(title)}
              aria-label={"Rate or give feedback for " + title.name}
            >
              Rate / feedback
            </button>
          </div>
        )}
      </div>
    </article>
  );
  const cards = (items: readonly Title[]) => (
    <div className="cards">{items.map((title) => card(title))}</div>
  );

  return (
    <>
      <a
        className="skip"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          {pages.slice(0, 2).map((item) => nav(item))}
          {nav(pages[7])}
          {pages.slice(2, -1).map((item) => nav(item))}
        </nav>
      </header>
      <div className="shell">
        <div className="topbar">
          <Brand mobile />
          <span className="prototype">
            <span></span> {live ? "Live catalogue" : "Demo catalogue"}
          </span>
          <form
            className="search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(query.trim().length >= 2 ? query.trim() : "");
              location.hash = "discover";
            }}
          >
            <Search size={17} />
            <input
              ref={search}
              type="search"
              aria-label={
                live ? "Search films and series" : "Search demo titles"
              }
              value={query}
              placeholder={
                live ? "Search films and series" : "Search demo titles"
              }
              maxLength={100}
              onChange={(event) => {
                setQuery(event.target.value);
                setSubmitted(
                  event.target.value.trim().length >= 2
                    ? event.target.value.trim()
                    : "",
                );
                if (page !== "discover") location.hash = "discover";
              }}
            />
            {live && (
              <button
                type="submit"
                className="icon-button"
                aria-label="Submit search"
              >
                <ArrowRight size={17} />
              </button>
            )}
          </form>
          <button
            className="icon-button top-icon"
            onClick={() => open("notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <a
            className="icon-button top-icon account"
            href="#profile"
            aria-label="Profile"
          >
            <UserRound size={18} />
          </a>
        </div>
        <main id="content" tabIndex={-1} ref={main}>
          {page === "home" && (
            <>
              <section className="hero">
                <div className="hero-content">
                  <p className="eyebrow">FILM &amp; TV DISCOVERY</p>
                  <h1>
                    LESS SCROLLING.
                    <br />
                    <em>MORE WATCHING.</em>
                  </h1>
                  <p>
                    {live
                      ? "Explore films and series on your streaming services and build your watchlist."
                      : "Explore the fictional catalogue and try the weekly picks, watchlist and discovery tools."}
                  </p>
                  <div className="actions">
                    <button
                      className="button primary"
                      onClick={() => open("dice")}
                    >
                      <Dices size={19} /> Roll the Dice
                    </button>
                    <a className="button secondary" href="#movie-dna">
                      <Dna size={19} /> Movie DNA
                    </a>
                  </div>
                </div>
              </section>
              <section className="weekly">
                <div className="section-head">
                  <div>
                    <h2>This Week’s Picks For You</h2>
                    <p>
                      {live
                        ? "Ranked using Movie DNA and titles included with your subscriptions."
                        : "Five films and one series from the fictional demo catalogue."}
                    </p>
                  </div>
                  <a href="#discover" onClick={clearSearch}>
                    Browse all <ArrowRight size={16} />
                  </a>
                </div>
                {status.error && <RequestMessage {...status} />}
                {catalogue.error && (
                  <p className="weekly-note">
                    Live catalogue check failed. Your previous picks are still
                    saved.
                  </p>
                )}
                <RequestMessage {...catalogue} />
                {(filmSupplement.loading || seriesSupplement.loading) && (
                  <p role="status">
                    Checking more eligible titles for this week's picks…
                  </p>
                )}
                {(filmSupplement.error || seriesSupplement.error) && (
                  <p role="status">
                    Some additional titles could not be checked.{" "}
                    {filmSupplement.error ?? seriesSupplement.error}
                  </p>
                )}
                {live && (!region || !services.length) && (
                  <button
                    className="button secondary"
                    onClick={() => open("onboard")}
                  >
                    Set viewing country and subscriptions
                  </button>
                )}
                {weekly.length > 0 && (
                  <div className="cards">
                    {orderedPicks.map((pick) => {
                      const title = activeTitles.get(pick.id);
                      return title ? card(title, pick) : null;
                    })}
                  </div>
                )}
                {live &&
                  weekly.some(
                    (title) => predictions.get(title.id) === undefined,
                  ) && (
                    <p className="weekly-note">
                      Rate a few titles with similar genres to unlock personal
                      predictions for future picks.
                    </p>
                  )}
                {(!live ||
                  (region &&
                    services.length > 0 &&
                    !catalogue.loading &&
                    !catalogue.error)) && (
                  <p className="weekly-note">
                    Week of {week} ·{" "}
                    {weekly.filter((title) => title.type === "Film").length} of
                    5 films ·{" "}
                    {weekly.filter((title) => title.type === "Series").length}{" "}
                    of 1 series.
                    {weekly.length < 6 &&
                      !checkingWeekly &&
                      (!live
                        ? " The demo catalogue has no more eligible picks for the remaining slots."
                        : weeklyError
                          ? " A catalogue check failed, so some slots could not be verified."
                          : weekly.length
                            ? " The verified catalogue and filters leave some slots unfilled."
                            : " The catalogue loaded. No verified recommendations match this selection.")}
                  </p>
                )}
                {live &&
                  region &&
                  services.length > 0 &&
                  !!catalogue.data &&
                  weekly.length < 6 && (
                    <button className="text-button" onClick={catalogue.retry}>
                      Refresh catalogue
                    </button>
                  )}
                {replacementMessage && (
                  <p role="status">{replacementMessage}</p>
                )}
                {inactive.length > 0 && (
                  <details className="weekly-inactive">
                    <summary>
                      Watched, rejected or unverified picks ({inactive.length})
                    </summary>
                    <ul className="dna-list">
                      {inactive.map((pick) => (
                        <li key={pick.id}>
                          <span>
                            {pick.name} ·{" "}
                            {watched.includes(pick.id)
                              ? "Watched"
                              : feedback.rejected[pick.id]
                                ? "Not interested"
                                : checkingWeekly
                                  ? "Checking availability"
                                  : weeklyError
                                    ? "Availability check failed"
                                    : "Availability not confirmed by the current catalogue"}
                          </span>
                          <button
                            className="text-button"
                            onClick={() => replace(pick.id)}
                            aria-label={"Replace " + pick.name}
                          >
                            Replace
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
              <section className="quick-actions" aria-label="Discovery tools">
                <button onClick={() => open("dice")}>
                  <Dices />
                  <span>
                    <strong>Roll the Dice</strong>
                    <small>
                      Get a surprise {live ? "catalogue" : "demo"} pick.
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button onClick={() => open("spin")}>
                  <Compass />
                  <span>
                    <strong>Spin to Watch</strong>
                    <small>Choose from this week’s films.</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button onClick={() => open("onboard")}>
                  <Sparkles />
                  <span>
                    <strong>Set up Movie DNA</strong>
                    <small>Save your viewing preferences.</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              </section>
              <section
                className="dashboard-activity"
                aria-label="Your activity"
              >
                <div className="panel">
                  <Bookmark aria-hidden="true" />
                  <h2>Watchlist</h2>
                  <p>{saved.length} saved</p>
                  <a className="button secondary" href="#watchlist">
                    Open watchlist
                  </a>
                </div>
                <div className="panel">
                  <Check aria-hidden="true" />
                  <h2>Recently watched</h2>
                  {recent.length ? (
                    <ul>
                      {recent.map((title) => (
                        <li key={title.id}>
                          <button
                            className="activity-title"
                            onClick={() => open(title)}
                          >
                            {title.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {watched.length
                        ? "Recent titles are outside this catalogue selection."
                        : "Mark a title as watched to see it here."}
                    </p>
                  )}
                </div>
                <div className="panel">
                  <Trophy aria-hidden="true" />
                  <h2>{profile.name || "Guest viewer"}</h2>
                  <p>
                    {Number(firstFilm) + Number(saved.length > 0)} of 2
                    achievements unlocked
                  </p>
                  <progress
                    aria-label="Achievements unlocked"
                    value={Number(firstFilm) + Number(saved.length > 0)}
                    max={2}
                  />
                  <a className="button secondary" href="#achievements">
                    View achievements
                  </a>
                </div>
              </section>
            </>
          )}
          {page === "discover" && (
            <>
              <h1>Discover</h1>
              <p className="intro">
                {live
                  ? "Browse titles included with your selected subscriptions."
                  : "Browse fictional films and series. Streaming availability is unverified."}
              </p>
              <p>
                {searchPath
                  ? "Searching the wider provider catalogue within your subscriptions."
                  : "Filters apply to the currently loaded catalogue. Use search to look beyond it."}
              </p>
              <DiscoveryFilters
                items={browse.map(asScored)}
                filters={filters}
                change={setFilters}
              />
              <button
                className="text-button"
                onClick={() => setFilters(defaultFilters)}
              >
                Reset filters
              </button>
              {filters.sort === "public" &&
                !browse.some((title) => title.publicRating) && (
                  <p>
                    No sourced public ratings are available in these results.
                  </p>
                )}
              <RequestMessage {...browseRequest} />
              {browseRequest.loading ||
              browseRequest.error ? null : filtered.length ? (
                cards(filtered)
              ) : (
                <div className="panel">
                  <h2>No titles found</h2>
                  {live && (!region || !services.length) ? (
                    <button
                      className="button secondary"
                      onClick={() => open("onboard")}
                    >
                      Set viewing country and subscriptions
                    </button>
                  ) : (
                    <p>Try another title or reset the catalogue filters.</p>
                  )}
                  <button className="button secondary" onClick={clearSearch}>
                    Clear filters
                  </button>
                </div>
              )}
              <div className="actions">
                <button
                  className="button secondary"
                  onClick={() => open("dice")}
                >
                  <Dices size={18} /> Roll the Dice
                </button>
                <button
                  className="button secondary"
                  onClick={() => open("spin")}
                >
                  <Compass size={18} /> Spin to Watch
                </button>
              </div>
            </>
          )}
          {page === "watchlist" && (
            <>
              <h1>My Watchlist</h1>
              <p className="intro">
                Your saved titles are stored in this browser.
              </p>
              <div className="discovery-controls">
                <label>
                  Search watchlist
                  <input
                    value={savedQuery}
                    onChange={(e) => setSavedQuery(e.target.value)}
                  />
                </label>
                <Choice
                  label="Saved title type"
                  value={savedFilters.type}
                  options={[
                    ["", "All"],
                    ["Film", "Films"],
                    ["Series", "Series"],
                  ]}
                  onChange={(type) =>
                    setSavedFilters({ ...savedFilters, type })
                  }
                />
                <Choice
                  label="Saved verified service"
                  value={savedFilters.service}
                  options={[
                    ["", "Any"],
                    ...[
                      ...new Set(
                        savedIds.flatMap((id) => {
                          const t = activityTitles.get(id);
                          return t ? asScored(t).services : [];
                        }),
                      ),
                    ].map((name) => [name, name] as const),
                  ]}
                  onChange={(service) =>
                    setSavedFilters({ ...savedFilters, service })
                  }
                />
                <Choice
                  label="Sort watchlist"
                  value={savedOrder}
                  options={[
                    ["latest", "Recently saved"],
                    ["oldest", "Earliest saved"],
                    ["priority", "Viewing priority"],
                    ["match", "Best personal match"],
                  ]}
                  onChange={setSavedOrder}
                />
              </div>
              {undo && (
                <div role="status">
                  Removed from watchlist.{" "}
                  <button className="button secondary" onClick={restoreSaved}>
                    Undo removal
                  </button>
                </div>
              )}
              {saved.length > 0 &&
                filteringSaved &&
                savedIds.every(
                  (id) =>
                    activityTitles.has(id) &&
                    !savedMatches(activityTitles.get(id)!),
                ) && <p role="status">No saved titles match these filters.</p>}
              {saved.length ? (
                <div className="cards">
                  {savedIds.map((id) => (
                    <SavedEntry
                      key={id}
                      id={id}
                      country={profile.country}
                      known={activityTitles.get(id)}
                      verified={
                        titles.find((title) => title.id === id) ??
                        (resolvedSaved[id] &&
                        hasFreshOffers(resolvedSaved[id], region, clock)
                          ? resolvedSaved[id]
                          : undefined)
                      }
                      onResolved={rememberSaved}
                      render={(title) =>
                        savedMatches(title) ? card(title) : null
                      }
                      remove={() => removeSaved(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="panel">
                  <Bookmark />
                  <h2>Your watchlist is empty</h2>
                  <p>Use the bookmark button on a title to save it here.</p>
                  <a
                    href="#discover"
                    className="button primary"
                    onClick={clearSearch}
                  >
                    Browse the catalogue
                  </a>
                </div>
              )}
            </>
          )}
          {page === "community" && (
            <>
              <h1>Community</h1>
              <p className="intro">
                Preview a sample discussion. Public posting will be available in
                a later phase.
              </p>
              <div className="panel">
                <Users />
                <h2>Demo discussion</h2>
                <h3>What makes a good slow-burn mystery?</h3>
                <p>
                  Sample member · “A small cast and a setting that feels like a
                  character of its own.”
                </p>
                <button
                  className="button secondary"
                  onClick={() => open(demoTitles[2])}
                >
                  View the featured demo title
                </button>
              </div>
            </>
          )}
          {page === "movie-dna" && (
            <MovieDnaPage
              profile={profile}
              feedback={feedback}
              history={weeks.filter((entry) => entry.week < week)}
              edit={() => open("edit-dna")}
              retake={() => open("onboard")}
              onRate={rate}
              onRestore={reject}
            />
          )}
          {page === "profile" && (
            <>
              <h1>Profile</h1>
              <div className="panel">
                <UserRound />
                <h2>{profile.name || "Guest viewer"}</h2>
                <p>
                  {profile.country} · {saved.length} saved · {watched.length}{" "}
                  watched
                </p>
                <p>
                  {profile.genres.length
                    ? "Favourite genres: " + profile.genres.join(", ")
                    : "Choose your favourite genres in Movie DNA."}
                </p>
                <button
                  className="button primary"
                  onClick={() => open("onboard")}
                >
                  <Settings size={18} /> Edit viewing preferences
                </button>
                <p>
                  <a className="text-button" href="#movie-dna">
                    View Movie DNA
                  </a>
                </p>
              </div>
              <section className="panel">
                <h2>Viewing statistics</h2>
                <dl className="viewing-stats">
                  <div>
                    <dt>Films watched</dt>
                    <dd>{stats.films}</dd>
                  </div>
                  <div>
                    <dt>Series marked watched</dt>
                    <dd>{stats.series}</dd>
                  </div>
                  <div>
                    <dt>Titles rated</dt>
                    <dd>{Object.keys(feedback.ratings).length}</dd>
                  </div>
                  <div>
                    <dt>Average personal rating</dt>
                    <dd>
                      {stats.average === undefined
                        ? "No ratings yet"
                        : stats.average.toFixed(1) + "/10"}
                    </dd>
                  </div>
                </dl>
                {stats.unknown > 0 && (
                  <p>
                    {stats.unknown} watched{" "}
                    {stats.unknown === 1 ? "title has" : "titles have"} no
                    stored type.
                  </p>
                )}
                <h3>Most watched genres</h3>
                {stats.genres.length ? (
                  <ul>
                    {stats.genres.slice(0, 5).map(([genre, count]) => (
                      <li key={genre}>
                        {genre} ({count})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No watched titles with genre information yet.</p>
                )}
                <h3>Recent viewing activity</h3>
                {recent.length ? (
                  <ul>
                    {recent.map((title) => (
                      <li key={title.id}>
                        <button
                          className="text-button"
                          onClick={() => open(title)}
                        >
                          {title.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent titles with saved details.</p>
                )}
              </section>
              <section className="panel">
                <h2>Personal ratings</h2>
                {Object.keys(feedback.ratings).length ? (
                  <ul className="selection-list">
                    {Object.values(feedback.ratings)
                      .sort((a, b) => b.value - a.value)
                      .map(({ title }) => (
                        <li key={title.id}>
                          <strong>{title.name}</strong>
                          <RatingInput
                            title={title}
                            feedback={feedback}
                            onRate={rate}
                          />
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>
                    Rate a title to see it here. Your highest ratings appear
                    first.
                  </p>
                )}
              </section>
            </>
          )}
          {page === "achievements" && (
            <>
              <h1>Achievements</h1>
              <p className="intro">
                Preview progress with activity from this browser.{" "}
                {Object.keys(events).length} recorded actions.
              </p>
              <div className="feature-grid">
                {[
                  {
                    name: "First Save",
                    desc: "Save a title to your watchlist.",
                    done: saved.length > 0,
                  },
                  {
                    name: "First Film",
                    desc: "Mark a film as watched.",
                    done: firstFilm,
                  },
                ].map((item) => (
                  <div className="panel" key={item.name}>
                    <Trophy />
                    <h2>{item.name}</h2>
                    <p>{item.desc}</p>
                    <strong
                      className={
                        item.done
                          ? "achievement-status unlocked"
                          : "achievement-status"
                      }
                    >
                      {item.done ? "Unlocked in this demo" : "In progress"}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          )}
          {page === "premium" && (
            <>
              <h1>WatchQuest+</h1>
              <p className="intro">
                Preview the proposed membership. Sign-ups and payments are
                disabled.
              </p>
              <div className="panel premium">
                <Crown />
                <h2>Proposed plans</h2>
                <p className="price">£1.99 per month · £19.99 per year</p>
                <ul>
                  <li>Fifteen films and three series each week</li>
                  <li>Unlimited dice rolls</li>
                  <li>Advanced viewing statistics and Movie DNA insights</li>
                  <li>Couple and Friends Mode</li>
                </ul>
              </div>
            </>
          )}
          {page === "profile" && (
            <div className="mobile-profile-links">
              <a href="#community">
                <Users size={18} /> Community
              </a>
              <a href="#premium">
                <Crown size={18} /> Premium
              </a>
            </div>
          )}
        </main>
        <footer>
          <span className="footer-brand">
            <strong>WatchQuest</strong>
            <small>FIND • WATCH • RATE • LEVEL UP.</small>
          </span>
          {(live || status.data?.tmdb) && (
            <button onClick={() => open("credits")}>Credits</button>
          )}
          <button onClick={() => open("onboard")}>
            <CircleHelp size={16} /> Get started
          </button>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {pages
          .slice(0, 5)
          .map((item) =>
            nav(item, item.id === "watchlist" ? "Saved" : item.name),
          )}
      </nav>

      {(overlay === "onboard" || overlay === "edit-dna") && (
        <Modal title="Set up your Movie DNA" close={close}>
          <MovieDnaQuestionnaire
            profile={profile}
            live={live}
            feedback={feedback}
            review={overlay === "edit-dna"}
            close={close}
            save={(value, updatedFeedback) => {
              setProfile(value);
              event("movie-dna-completed", "profile");
              setFeedback(updatedFeedback);
              close();
              location.hash = "movie-dna";
            }}
          />
        </Modal>
      )}
      {overlay === "notifications" && (
        <Modal title="Notifications" close={close}>
          <p>You have no notifications in this demo.</p>
        </Modal>
      )}
      {overlay === "credits" && (
        <Modal title="Credits" close={close}>
          {status.data?.tmdb && (
            <>
              <a href="https://www.themoviedb.org">
                <img className="tmdb-logo" src="/media/tmdb.svg" alt="TMDB" />
              </a>
              <p>
                This product uses the TMDB API but is not endorsed or certified
                by TMDB.
              </p>
            </>
          )}
          <p>
            Catalogue and streaming availability are provided by the{" "}
            <a href="https://www.movieofthenight.com/about/api">
              Streaming Availability API by Movie of the Night
            </a>{" "}
            when enabled.
          </p>
        </Modal>
      )}
      {(overlay === "dice" || overlay === "spin") && (
        <Modal
          title={overlay === "dice" ? "Roll the Dice" : "Spin to Watch"}
          close={close}
        >
          <p>
            {overlay === "dice"
              ? live
                ? "Draw a film or series from the catalogue."
                : "Draw a fictional film or series from the demo catalogue."
              : "Every unwatched film in this week’s list has an equal chance."}
          </p>
          {overlay === "dice" && (
            <>
              <div className="discovery-controls">
                <Choice
                  label="Roll style"
                  value={diceMode}
                  onChange={setDiceMode}
                  options={[
                    ["random", "Surprise me"],
                    ["best", "Best match for my Movie DNA"],
                    ["different", "Something different"],
                  ]}
                />
              </div>
              <DiscoveryFilters
                compact
                items={pool.map(asScored)}
                filters={diceFilters}
                change={setDiceFilters}
              />
              {rollHistory.length > 0 && (
                <details>
                  <summary>Roll history ({rollHistory.length})</summary>
                  <ul className="selection-list">
                    {[...rollHistory].reverse().map(({ title }) => (
                      <li key={title.id}>
                        <button
                          className="text-button"
                          onClick={() => setResult(title)}
                        >
                          {title.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
          {overlay === "spin" && (
            <fieldset disabled={spinning} className="wheel-options">
              <legend>Wheel entries</legend>
              <div className="discovery-controls">
                <Choice
                  label="Film source"
                  value={wheelSource}
                  onChange={(source) => {
                    setWheelSource(source);
                    setWheelHidden([]);
                    setResult(undefined);
                    setTurn(0);
                  }}
                  options={[
                    ["weekly", "This week's films"],
                    ["saved", "Saved films"],
                    ["manual", "Choose films"],
                  ]}
                />
              </div>
              {wheelSource === "manual" && (
                <details open>
                  <summary>Select eligible films</summary>
                  <ul className="selection-list">
                    {pool
                      .filter((title) => title.type === "Film")
                      .map((title) => (
                        <li key={title.id}>
                          <label className="check-choice">
                            <input
                              type="checkbox"
                              checked={wheelSelected.includes(title.id)}
                              onChange={() => {
                                setWheelSelected((previous) =>
                                  previous.includes(title.id)
                                    ? previous.filter((id) => id !== title.id)
                                    : [...previous, title.id],
                                );
                                setWheelHidden((previous) =>
                                  previous.filter((id) => id !== title.id),
                                );
                                setResult(undefined);
                                setTurn(0);
                              }}
                            />
                            {title.name}
                          </label>
                        </li>
                      ))}
                  </ul>
                </details>
              )}
              {spinPool.length > 0 && (
                <ul className="selection-list">
                  {spinPool.map((title) => (
                    <li key={title.id}>
                      <span>{title.name}</span>
                      <button
                        className="text-button"
                        onClick={() => {
                          setWheelHidden((previous) => [...previous, title.id]);
                          setResult(undefined);
                          setTurn(0);
                        }}
                        aria-label={"Remove " + title.name + " from wheel"}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {wheelHidden.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    setWheelHidden([]);
                    setResult(undefined);
                    setTurn(0);
                  }}
                >
                  Restore removed entries
                </button>
              )}
            </fieldset>
          )}
          {overlay === "dice" && (
            <div
              className="dice-preview"
              key={result?.id ?? "ready"}
              aria-hidden="true"
            >
              <Dices size={42} />
            </div>
          )}
          {overlay === "spin" && spinPool.length > 0 && (
            <div className="wheel-area">
              <div className="wheel-pointer" aria-hidden="true" />
              <div
                className="wheel"
                aria-hidden="true"
                style={{
                  transform: "rotate(" + turn + "deg)",
                  background:
                    "conic-gradient(" +
                    spinPool
                      .map(
                        (_, i) =>
                          [
                            "#104f9a",
                            "#073167",
                            "#176dc8",
                            "#142644",
                            "#244889",
                          ][i % 5] +
                          " " +
                          (i * 100) / spinPool.length +
                          "% " +
                          ((i + 1) * 100) / spinPool.length +
                          "%",
                      )
                      .join(",") +
                    ")",
                }}
              >
                {spinPool.map((item, i) => (
                  <span
                    key={item.id}
                    style={{
                      transform:
                        "rotate(" +
                        ((i + 0.5) * 360) / spinPool.length +
                        "deg)",
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div aria-live="polite">
            {result && (
              <div className="result">
                <Poster title={result} />
                <div>
                  <h3>{result.name}</h3>
                  <p>
                    {[result.genre, result.time].filter(Boolean).join(" · ")}
                  </p>
                  <p>
                    {includedServices(result, region, services, clock).length
                      ? "Included with " +
                        includedServices(result, region, services, clock).join(
                          ", ",
                        )
                      : "Streaming availability unverified."}
                  </p>
                  <p>
                    {overlay === "spin"
                      ? "Selected at random from the wheel."
                      : rollHistory.find(({ title }) => title.id === result.id)
                          ?.reason}{" "}
                    {asScored(result).reasons.join(" ")}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => open(result)}
                  >
                    View details
                  </button>
                </div>
              </div>
            )}
          </div>
          <RequestMessage
            {...(status.loading || status.error ? status : catalogue)}
          />
          {status.loading ||
          status.error ||
          catalogue.loading ||
          catalogue.error ? null : !(overlay === "dice"
              ? dicePool.some(
                  (title) =>
                    !diceHistory.includes(title.id) &&
                    eligibleNow(title, clock),
                )
              : spinPool.length) ? (
            <p>
              No eligible {live ? "catalogue" : "demo"} titles remain with these
              options. {overlay === "dice" && "Try changing your roll options."}
            </p>
          ) : (
            <button
              className="button primary"
              disabled={spinning}
              onClick={overlay === "dice" ? rollDice : spinWheel}
            >
              {overlay === "dice"
                ? result
                  ? "Roll again"
                  : "Roll the Dice"
                : spinning
                  ? "Spinning…"
                  : result
                    ? "Spin again"
                    : "Spin the wheel"}
            </button>
          )}
        </Modal>
      )}
      {overlay && typeof overlay === "object" && (
        <Modal title={overlay.name} close={close}>
          <TitleDetails
            key={overlay.id}
            title={overlay}
            country={profile.country}
          />
          {weeklyRecord.picks.some((pick) => pick.id === overlay.id) && (
            <section className="pick-explanation">
              <h3>Why this weekly pick?</h3>
              <p>
                {weeklyRecord.picks
                  .find((pick) => pick.id === overlay.id)
                  ?.reasons.join(" ") ||
                  (live
                    ? "Selected to add variety within your eligible catalogue."
                    : "Selected from the fictional demo catalogue.")}
              </p>
            </section>
          )}
          {asScored(overlay).prediction !== undefined && (
            <p>
              Personal prediction: {asScored(overlay).prediction?.toFixed(1)}/10
            </p>
          )}
          {overlay.publicRating && (
            <p>
              Public rating: {overlay.publicRating.value.toFixed(1)}/10 (
              {overlay.publicRating.source})
            </p>
          )}
          <div className="title-feedback">
            <RatingInput title={overlay} feedback={feedback} onRate={rate} />
            <button
              className="button secondary"
              aria-pressed={Object.hasOwn(feedback.rejected, overlay.id)}
              onClick={() => reject(overlay)}
            >
              {Object.hasOwn(feedback.rejected, overlay.id)
                ? "Undo not interested"
                : "Not interested"}
            </button>
          </div>
          <div className="actions">
            <button
              className="button primary"
              aria-pressed={saved.includes(overlay.id)}
              onClick={() =>
                page === "watchlist" && saved.includes(overlay.id)
                  ? removeSaved(overlay.id)
                  : toggleSaved(overlay)
              }
            >
              <Bookmark size={17} />
              {saved.includes(overlay.id)
                ? "Remove from watchlist"
                : "Save to watchlist"}
            </button>
            <button
              className="button secondary"
              aria-pressed={watched.includes(overlay.id)}
              onClick={() => toggleWatched(overlay)}
            >
              <Check size={17} />
              {watched.includes(overlay.id)
                ? "Mark as unwatched"
                : "Mark as watched"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
