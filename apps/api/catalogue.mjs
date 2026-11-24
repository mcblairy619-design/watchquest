import { URL, URLSearchParams } from "node:url";
import { freeRequestBudget } from "./request-budget.mjs";

const TMDB = "https://api.themoviedb.org/3";
const STREAMING = "https://api.movieofthenight.com/v4";
const regions = new Set(["gb", "ie", "us", "ca", "au"]);
const offerTypes = new Set(["subscription", "rent", "buy", "addon", "free"]);

class ProviderError extends Error {
  constructor(status, retryAfter, code) {
    super("Catalogue provider request failed");
    this.status = status;
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

const accountErrorCodes = {
  400: "provider_query",
  401: "provider_access",
  403: "provider_access",
  422: "provider_query",
};

function createClient(base, headers, fetcher, limits, reserve = () => 0) {
  const cache = new Map();
  let coolingUntil = 0;
  let active = 0;
  const windows = limits.map(([max, duration]) => ({
    max,
    duration,
    calls: [],
  }));
  return async (path, ttl) => {
    const cached = cache.get(path);
    if (cached && cached.expires > Date.now()) return cached.pending;
    if (coolingUntil > Date.now() || active >= 8) {
      throw new ProviderError(
        429,
        Math.max(1, Math.ceil((coolingUntil - Date.now()) / 1000)),
      );
    }
    const now = Date.now();
    let budgetWait = 0;
    for (const window of windows) {
      while (window.calls.length && window.calls[0] <= now - window.duration)
        window.calls.shift();
      if (window.calls.length >= window.max) {
        budgetWait = Math.max(
          budgetWait,
          window.calls[0] + window.duration - now,
        );
      }
    }
    if (budgetWait) throw new ProviderError(429, Math.ceil(budgetWait / 1000));
    let quotaWait;
    try {
      quotaWait = reserve();
    } catch (error) {
      throw new ProviderError(
        503,
        undefined,
        error.code === "EEXIST" ? "budget_busy" : "budget_unavailable",
      );
    }
    if (quotaWait) throw new ProviderError(429, quotaWait, "local_quota");
    for (const window of windows) window.calls.push(now);
    if (cache.size >= 256) {
      const evictable = [...cache].find(([, entry]) => !entry.active);
      if (evictable) cache.delete(evictable[0]);
    }
    active++;
    const entry = { expires: Infinity, active: true };
    entry.pending = (async () => {
      try {
        const signal = globalThis.AbortSignal.timeout(8000);
        let response;
        try {
          response = await fetcher(base + path, {
            headers,
            signal,
            redirect: "error",
          });
        } catch (error) {
          throw new ProviderError(
            signal.aborted || error.name === "TimeoutError" ? 504 : 502,
            undefined,
            signal.aborted || error.name === "TimeoutError"
              ? "provider_timeout"
              : "provider_connection",
          );
        }
        if ([402, 429].includes(response.status)) {
          const raw = response.headers.get("Retry-After");
          const seconds = /^\d+$/.test(raw ?? "")
            ? Number(raw)
            : (Date.parse(raw) - Date.now()) / 1000;
          const retry = Number.isFinite(seconds)
            ? Math.max(1, Math.ceil(seconds))
            : response.status === 402
              ? 3600
              : 60;
          coolingUntil = Date.now() + retry * 1000;
          throw new ProviderError(429, retry, "provider_limit");
        }
        if (!response.ok)
          throw new ProviderError(
            response.status,
            undefined,
            accountErrorCodes[response.status] ?? "provider_response",
          );
        const data = await response.json().catch(() => {
          throw new ProviderError(
            signal.aborted ? 504 : 502,
            undefined,
            signal.aborted ? "provider_timeout" : "provider_response",
          );
        });
        entry.expires = Date.now() + ttl;
        return { data, checkedAt: new Date().toISOString() };
      } catch (error) {
        cache.delete(path);
        throw error;
      } finally {
        entry.active = false;
        active--;
      }
    })();
    cache.set(path, entry);
    return entry.pending;
  };
}

const hour = 3600000;
const params = (values) => new URLSearchParams(values).toString();

function titleFrom(item, kind, genres, posters) {
  const genreNames =
    item.genres?.map((genre) => genre.name) ??
    item.genre_ids?.map((id) => genres.get(id)).filter(Boolean) ??
    [];
  const minutes =
    kind === "movie"
      ? item.runtime
      : item.episode_run_time?.find((value) => value > 0);
  return {
    id: "tmdb-" + kind + "-" + item.id,
    name: kind === "movie" ? item.title : item.name,
    genre: genreNames[0] ?? "Unclassified",
    genres: genreNames,
    type: kind === "movie" ? "Film" : "Series",
    time:
      minutes > 0
        ? minutes + " min" + (kind === "tv" ? " per episode" : "")
        : undefined,
    releaseDate: kind === "movie" ? item.release_date : item.first_air_date,
    synopsis: item.overview,
    poster:
      posters && /^\/[\w-]+\.(jpg|png)$/i.test(item.poster_path ?? "")
        ? "https://image.tmdb.org/t/p/w342" + item.poster_path
        : undefined,
  };
}

function secureLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password)
      return url.href;
  } catch {
    /* Unknown links are omitted. */
  }
}

function toOffers(options) {
  const offers = [];
  const seen = new Set();
  for (const option of options) {
    if (
      !offerTypes.has(option?.type) ||
      !option.service?.name ||
      (option.expiresOn && option.expiresOn * 1000 <= Date.now())
    )
      continue;
    const type = option.addon ? "addon" : option.type;
    const offer = {
      type,
      serviceId: option.service.id,
      expiresAt: Number.isFinite(option.expiresOn)
        ? option.expiresOn * 1000
        : undefined,
      service: option.service.name,
      addon: option.addon?.name,
      link: secureLink(option.videoLink) ?? secureLink(option.link),
    };
    const key = JSON.stringify(offer);
    if (!seen.has(key)) offers.push(offer);
    seen.add(key);
  }
  return offers;
}

function regionalOffers(show, country) {
  if (
    !regions.has(country) ||
    !show?.streamingOptions ||
    typeof show.streamingOptions !== "object" ||
    Array.isArray(show.streamingOptions)
  )
    return;
  const options = show.streamingOptions[country];
  if (options === undefined) return [];
  if (Array.isArray(options)) return toOffers(options);
}

function fromStreaming(show) {
  if (
    !show ||
    !["movie", "series"].includes(show.showType) ||
    typeof show.title !== "string" ||
    !show.title
  )
    return;
  const film = show.showType === "movie";
  const match = /^(movie|tv)\/(\d{1,12})$/.exec(show.tmdbId ?? "");
  const id =
    match && match[1] === (film ? "movie" : "tv")
      ? "tmdb-" + match[1] + "-" + match[2]
      : /^[a-zA-Z0-9_-]{1,80}$/.test(show.id ?? "")
        ? "motn-" + show.id
        : undefined;
  if (!id) return;
  const genres = (Array.isArray(show.genres) ? show.genres : [])
    .map((genre) => genre?.name)
    .filter((name) => typeof name === "string");
  const year = film ? show.releaseYear : show.firstAirYear;
  return {
    id,
    name: show.title,
    type: film ? "Film" : "Series",
    genres,
    genre: genres[0] ?? "Unclassified",
    synopsis: typeof show.overview === "string" ? show.overview : undefined,
    time:
      film && Number.isFinite(show.runtime) && show.runtime > 0
        ? show.runtime + " min"
        : undefined,
    releaseDate: Number.isInteger(year) ? String(year) : undefined,
    source: "movie-of-the-night",
  };
}

export function createCatalogue(env, fetcher = globalThis.fetch, budgetPath) {
  const tmdbEnabled =
    env.CATALOGUE_USE === "non-commercial" && Boolean(env.CATALOGUE_API_TOKEN);
  const limit = Number(env.AVAILABILITY_FREE_REQUEST_LIMIT);
  const available =
    env.AVAILABILITY_TERMS_ACCEPTED === "yes" &&
    env.AVAILABILITY_FREE_PLAN === "yes" &&
    Number.isInteger(limit) &&
    limit > 0 &&
    limit <= 450 &&
    Boolean(env.AVAILABILITY_API_TOKEN);
  const cacheMinutes = Number(env.AVAILABILITY_CACHE_MINUTES);
  const ttl =
    Number.isInteger(cacheMinutes) && cacheMinutes > 0
      ? Math.min(cacheMinutes, 360) * 60000
      : 0;
  const posters = env.CATALOGUE_POSTERS_ALLOWED === "yes";
  const tmdb = createClient(
    TMDB,
    { Authorization: "Bearer " + env.CATALOGUE_API_TOKEN },
    fetcher,
    [[30, 60000]],
  );
  const streaming = createClient(
    STREAMING,
    { "X-API-Key": env.AVAILABILITY_API_TOKEN },
    fetcher,
    [[6, 60000]],
    available ? freeRequestBudget(limit, budgetPath) : undefined,
  );

  return async (url) => {
    if (url.pathname === "/api/catalogue/status")
      return { enabled: available, tmdb: tmdbEnabled };
    const country = url.searchParams.get("country");
    const validCountry = regions.has(country);
    const lookup = (id) =>
      streaming(
        "/shows/" +
          encodeURIComponent(id) +
          (validCountry ? "?" + params({ country }) : ""),
        ttl,
      );

    if (url.pathname === "/api/catalogue/services") {
      if (!available)
        throw new ProviderError(503, undefined, "catalogue_disabled");
      if (!validCountry) return { services: [] };
      const { data } = await streaming("/countries/" + country, ttl);
      if (
        typeof data?.countryCode !== "string" ||
        data.countryCode.toLowerCase() !== country ||
        !Array.isArray(data.services)
      ) {
        throw new ProviderError(502, undefined, "provider_response");
      }
      return {
        services: data.services
          .filter(
            (service) =>
              service?.streamingOptionTypes?.subscription === true &&
              /^[a-z0-9_-]{1,32}$/.test(service.id ?? "") &&
              typeof service.name === "string",
          )
          .map(({ id, name }) => ({ id, name })),
      };
    }

    if (url.pathname === "/api/catalogue/favourites") {
      if (!available)
        throw new ProviderError(503, undefined, "catalogue_disabled");
      const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      if (query.length > 100) throw new ProviderError(400);
      if (query.length < 2 || !validCountry) return { titles: [] };
      const { data } = await streaming(
        "/shows/search/title?" + params({ country, title: query }),
        ttl,
      );
      if (!Array.isArray(data))
        throw new ProviderError(502, undefined, "provider_response");
      const titles = data.map(fromStreaming).filter(Boolean);
      return {
        titles: [
          ...new Map(titles.map((title) => [title.id, title])).values(),
        ].slice(0, 12),
      };
    }

    if (url.pathname === "/api/catalogue") {
      const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const kind = url.searchParams.get("kind");
      if (query.length > 100) throw new ProviderError(400);
      if (kind && !["movie", "series"].includes(kind))
        throw new ProviderError(400);
      if (!available)
        throw new ProviderError(503, undefined, "catalogue_disabled");
      const services = [
        ...new Set(
          (url.searchParams.get("services") ?? "").split(",").filter(Boolean),
        ),
      ].sort();
      if (
        services.length > 12 ||
        services.some((service) => !/^[a-z0-9_-]{1,32}$/.test(service))
      ) {
        throw new ProviderError(400);
      }
      if (!validCountry || !services.length) return { titles: [] };
      const route = query
        ? "/shows/search/title?" + params({ country, title: query })
        : "/shows/search/filters?" +
          params({
            country,
            catalogs: services
              .map((service) => service + ".subscription")
              .join(","),
            order_by: "popularity_1week",
            ...(kind ? { show_type: kind } : {}),
          });
      const { data, checkedAt } = await streaming(route, ttl);
      const shows = query ? data : data?.shows;
      if (!Array.isArray(shows))
        throw new ProviderError(502, undefined, "provider_response");
      const titles = new Map();
      for (const show of shows) {
        const title = fromStreaming(show);
        const offers = regionalOffers(show, country);
        if (
          title &&
          (!kind || title.type === (kind === "movie" ? "Film" : "Series")) &&
          offers?.some(
            (offer) =>
              offer.type === "subscription" &&
              services.includes(offer.serviceId),
          )
        ) {
          titles.set(title.id, {
            ...title,
            availability: { state: "checked", country, checkedAt, offers },
          });
        }
      }
      return { titles: [...titles.values()] };
    }

    const match =
      /^\/api\/catalogue\/(?:(tmdb-(movie|tv)-(\d{1,12}))|motn-([a-zA-Z0-9_-]{1,80}))(\/availability)?$/.exec(
        url.pathname,
      );
    if (!match) throw new ProviderError(404);
    const [, , kind, id, nativeId, availability] = match;
    if (!availability && !available && kind && tmdbEnabled) {
      const { data } = await tmdb(
        "/" + kind + "/" + id + "?language=en-GB",
        24 * hour,
      );
      if (data.adult) throw new ProviderError(404);
      return { title: titleFrom(data, kind, new Map(), posters) };
    }
    if (!available) {
      if (availability) return { state: "unconfigured" };
      throw new ProviderError(503, undefined, "catalogue_disabled");
    }
    if (availability && !validCountry) return { state: "unsupported" };
    try {
      const { data, checkedAt } = await lookup(nativeId ?? kind + "/" + id);
      const offers = regionalOffers(data, country);
      if (availability)
        return offers
          ? { state: "checked", checkedAt, offers }
          : { state: "unknown" };
      const title = fromStreaming(data);
      if (!title) throw new ProviderError(502, undefined, "provider_response");
      return {
        title: {
          ...title,
          id: match[1] ?? "motn-" + nativeId,
          availability: offers && {
            state: "checked",
            country,
            checkedAt,
            offers,
          },
        },
      };
    } catch (error) {
      if (availability && error.status === 404) return { state: "unknown" };
      throw error;
    }
  };
}

export function catalogueMiddleware(env, fetcher, budgetPath) {
  const run = createCatalogue(env, fetcher, budgetPath);
  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (
      url.pathname !== "/api/catalogue" &&
      !url.pathname.startsWith("/api/catalogue/")
    )
      return next();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    try {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        throw new ProviderError(405);
      }
      res.end(JSON.stringify(await run(url)));
    } catch (error) {
      res.statusCode = [400, 404, 405, 429, 503, 504].includes(error.status)
        ? error.status
        : 502;
      if (error.retryAfter)
        res.setHeader("Retry-After", String(error.retryAfter));
      res.end(
        JSON.stringify({
          code: error instanceof ProviderError ? error.code : undefined,
          error:
            res.statusCode === 429
              ? "The data provider is busy. Try again later."
              : "Catalogue information could not be loaded.",
        }),
      );
    }
  };
}
