import { URL, URLSearchParams } from "node:url";

const TMDB = "https://api.themoviedb.org/3";
const STREAMING = "https://api.movieofthenight.com/v4";
const regions = new Set(["gb", "ie", "us", "ca", "au"]);
const offerTypes = new Set(["subscription", "rent", "buy", "addon", "free"]);

class ProviderError extends Error {
  constructor(status, retryAfter) {
    super("Catalogue provider request failed");
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function createClient(base, headers, fetcher, limits) {
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
    for (const window of windows) window.calls.push(now);
    if (cache.size >= 256) {
      const evictable = [...cache].find(([, entry]) => !entry.active);
      if (evictable) cache.delete(evictable[0]);
    }
    active++;
    const entry = { expires: Infinity, active: true };
    entry.pending = (async () => {
      try {
        const response = await fetcher(base + path, {
          headers,
          signal: globalThis.AbortSignal.timeout(8000),
          redirect: "error",
        });
        if (response.status === 429) {
          const raw = response.headers.get("Retry-After");
          const seconds = /^\d+$/.test(raw ?? "")
            ? Number(raw)
            : (Date.parse(raw) - Date.now()) / 1000;
          const retry = Number.isFinite(seconds)
            ? Math.max(1, Math.ceil(seconds))
            : 60;
          coolingUntil = Date.now() + retry * 1000;
          throw new ProviderError(429, retry);
        }
        if (!response.ok) throw new ProviderError(response.status);
        const data = await response.json();
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
    if (!offerTypes.has(option?.type) || !option.service?.name) continue;
    const type = option.addon ? "addon" : option.type;
    const offer = {
      type,
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

export function createCatalogue(env, fetcher = globalThis.fetch) {
  const enabled =
    env.CATALOGUE_USE === "non-commercial" && Boolean(env.CATALOGUE_API_TOKEN);
  const available =
    enabled &&
    env.AVAILABILITY_TERMS_ACCEPTED === "yes" &&
    Boolean(env.AVAILABILITY_API_TOKEN);
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
    [
      [6, 60000],
      [50, 24 * hour],
    ],
  );

  return async (url) => {
    if (url.pathname === "/api/catalogue/status") return { enabled };
    if (!enabled) throw new ProviderError(503);

    if (url.pathname === "/api/catalogue") {
      const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const country = url.searchParams.get("country");
      const region = regions.has(country) ? country.toUpperCase() : undefined;
      if (query.length > 100) throw new ProviderError(400);
      const categories = ["movie", "tv"];
      const genreRequests = categories.map((kind) =>
        tmdb("/genre/" + kind + "/list?language=en", 24 * hour),
      );
      const contentRequests = query
        ? [
            tmdb(
              "/search/multi?" +
                params({ query, include_adult: "false", language: "en-GB" }),
              15 * 60000,
            ),
          ]
        : categories.map((kind) => {
            const filters = {
              include_adult: "false",
              language: "en-GB",
              sort_by: "popularity.desc",
            };
            if (kind === "movie" && region) filters.region = region;
            return tmdb("/discover/" + kind + "?" + params(filters), 6 * hour);
          });
      const [genreLists, content] = await Promise.all([
        Promise.all(genreRequests),
        Promise.all(contentRequests),
      ]);
      const names = new Map(
        genreLists.flatMap(({ data }) =>
          data.genres.map(({ id, name }) => [id, name]),
        ),
      );
      return {
        titles: content.flatMap(({ data }, i) =>
          data.results.flatMap((item) => {
            const kind = query ? item.media_type : categories[i];
            if (
              !categories.includes(kind) ||
              item.adult ||
              !Number.isSafeInteger(item.id) ||
              !(kind === "movie" ? item.title : item.name)
            )
              return [];
            return [titleFrom(item, kind, names, posters)];
          }),
        ),
      };
    }

    const match =
      /^\/api\/catalogue\/(tmdb-(movie|tv)-(\d{1,12}))(\/availability)?$/.exec(
        url.pathname,
      );
    if (!match) throw new ProviderError(404);
    const [, , kind, id, availability] = match;
    if (!availability) {
      const { data } = await tmdb(
        "/" + kind + "/" + id + "?language=en-GB",
        24 * hour,
      );
      if (data.adult) throw new ProviderError(404);
      return { title: titleFrom(data, kind, new Map(), posters) };
    }
    const country = url.searchParams.get("country");
    if (!regions.has(country)) return { state: "unsupported" };
    if (!available) return { state: "unconfigured" };
    try {
      const { data, checkedAt } = await streaming(
        "/shows/" +
          encodeURIComponent(kind + "/" + id) +
          "?" +
          params({ country }),
        6 * hour,
      );
      if (!data.streamingOptions || typeof data.streamingOptions !== "object")
        throw new ProviderError(502);
      const options = data.streamingOptions[country];
      if (options !== undefined && !Array.isArray(options))
        throw new ProviderError(502);
      return { state: "checked", checkedAt, offers: toOffers(options ?? []) };
    } catch (error) {
      if (error.status === 404) return { state: "unknown" };
      throw error;
    }
  };
}

export function catalogueMiddleware(env) {
  const run = createCatalogue(env);
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
      res.statusCode = [400, 404, 405, 429, 503].includes(error.status)
        ? error.status
        : 502;
      if (error.retryAfter)
        res.setHeader("Retry-After", String(error.retryAfter));
      res.end(
        JSON.stringify({
          error:
            res.statusCode === 429
              ? "The data provider is busy. Try again later."
              : "Catalogue information could not be loaded.",
        }),
      );
    }
  };
}
