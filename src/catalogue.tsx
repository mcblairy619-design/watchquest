import { useEffect, useMemo, useState } from "react";

export type Title = {
  id: string;
  name: string;
  genre: string;
  genres?: string[];
  type: "Film" | "Series";
  time?: string;
  synopsis?: string;
  releaseDate?: string;
  demo?: boolean;
  art?: string;
  poster?: string;
  source?: "movie-of-the-night";
  availability?: CheckedAvailability & { country: string };
};

export const countries: Record<string, string> = {
  "United Kingdom": "gb",
  Ireland: "ie",
  "United States": "us",
  Canada: "ca",
  Australia: "au",
};

export const subscriptionServices = [
  ["netflix", "Netflix"],
  ["prime", "Prime Video"],
  ["disney", "Disney+"],
  ["apple", "Apple TV"],
  ["mubi", "MUBI"],
  ["paramount", "Paramount+"],
] as const;

const requestErrors: Record<string, string> = {
  local_connection:
    "Could not reach the local WatchQuest server. Check that Vite is running.",
  local_response:
    "The local WatchQuest server returned an unreadable catalogue response.",
  provider_connection:
    "WatchQuest could not connect to the streaming provider. Check your internet connection.",
  provider_timeout: "The streaming provider took too long to respond.",
  provider_access:
    "The streaming provider refused access. Check the account and API key in your local settings.",
  provider_query:
    "The streaming provider could not use the selected country, services or search.",
  provider_response:
    "The streaming provider returned an unavailable or unexpected response.",
  provider_limit:
    "The streaming provider is limiting requests. Try again later.",
  local_quota: "The local catalogue request allowance is exhausted.",
  catalogue_disabled:
    "Live catalogue access is disabled in the local server settings.",
  budget_busy:
    "Another catalogue request is updating the local budget. Try again shortly.",
  budget_unavailable:
    "WatchQuest could not record a request in its local budget. Check the project folder permissions.",
};

export function useCatalogueRequest<T>(path: string | undefined, delay = 0) {
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(
    () => ({ path, delay, attempt }),
    [path, delay, attempt],
  );
  const [result, setResult] = useState<{
    request: typeof request;
    data?: T;
    error?: string;
    reconnect?: boolean;
  }>();
  useEffect(() => {
    if (!request.path) return;
    const path = request.path;
    const controller = new AbortController();
    const fail = (code: string | undefined, fallback: string) => {
      if (controller.signal.aborted) return;
      setResult({
        request,
        error:
          code && Object.hasOwn(requestErrors, code)
            ? requestErrors[code]
            : fallback,
        reconnect:
          code === "local_connection" ||
          code === "provider_connection" ||
          code === "provider_timeout",
      });
    };
    const timer = window.setTimeout(async () => {
      let response: Response;
      try {
        response = await fetch(path, { signal: controller.signal });
      } catch {
        fail("local_connection", "");
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          code?: string;
        } | null;
        fail(
          body?.code,
          response.status === 429
            ? "The data provider is busy. Try again later."
            : "Could not load catalogue information.",
        );
        return;
      }
      try {
        const data: T = await response.json();
        if (!controller.signal.aborted) setResult({ request, data });
      } catch {
        fail("local_response", "");
      }
    }, request.delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [request]);
  const current = result?.request === request ? result : undefined;
  useEffect(() => {
    if (!current?.reconnect) return;
    const retry = () => setAttempt((value) => value + 1);
    window.addEventListener("online", retry, { once: true });
    return () => window.removeEventListener("online", retry);
  }, [current]);
  return {
    data: current?.data,
    error: current?.error,
    loading: !!path && !current,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function Poster({ title }: { title: Title }) {
  const src = title.poster ?? (title.art && "/media/" + title.art + ".jpg");
  const [failed, setFailed] = useState<string>();
  return src && failed !== src ? (
    <img
      alt=""
      src={src}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
    />
  ) : (
    <span className="poster-placeholder" aria-hidden="true" />
  );
}

const labels = {
  subscription: "Included with the service subscription",
  rent: "Rent",
  buy: "Buy",
  addon: "Additional paid channel",
  free: "Free to watch",
};
type Offer = {
  type: keyof typeof labels;
  service: string;
  addon?: string;
  link?: string;
  serviceId?: string;
  expiresAt?: number;
};
type CheckedAvailability = {
  state: "checked";
  checkedAt: string;
  offers: Offer[];
};
type AvailabilityData =
  CheckedAvailability | { state: "unsupported" | "unconfigured" | "unknown" };

export function hasFreshOffers(title: Title, region: string, now: number) {
  const availability = title.availability;
  return (
    !!availability &&
    availability.country === region &&
    now - Date.parse(availability.checkedAt) < 6 * 3600000
  );
}

export function includedWith(
  title: Title,
  region: string,
  services: string[],
  now: number,
) {
  return includedServices(title, region, services, now).length > 0;
}

export function includedServices(
  title: Title,
  region: string,
  services: string[],
  now: number,
) {
  if (!hasFreshOffers(title, region, now)) return [];
  return [
    ...new Set(
      title.availability?.offers
        .filter(
          (offer) =>
            offer.type === "subscription" &&
            !!offer.serviceId &&
            services.includes(offer.serviceId) &&
            (!offer.expiresAt || offer.expiresAt > now),
        )
        .map((offer) => offer.service),
    ),
  ];
}

export function Availability({
  title,
  country,
}: {
  title: Title;
  country: string;
}) {
  const region = countries[country];
  const now = Date.now();
  const embedded = hasFreshOffers(title, region, now)
    ? title.availability
    : undefined;
  const request = useCatalogueRequest<AvailabilityData>(
    !title.demo && region && !embedded
      ? "/api/catalogue/" + title.id + "/availability?country=" + region
      : undefined,
  );
  if (title.demo) return <p>Streaming availability unverified.</p>;
  if (!region)
    return <p>Availability checks are unavailable for the selected country.</p>;
  if (request.loading)
    return <p role="status">Checking streaming options for {country}…</p>;
  if (request.error)
    return (
      <p>
        Streaming availability could not be verified.{" "}
        <button className="button secondary" onClick={request.retry}>
          Retry
        </button>
      </p>
    );
  const data = embedded ?? request.data;
  if (data?.state !== "checked")
    return <p>Streaming availability is unverified for {country}.</p>;
  const offers = data.offers.filter(
    (offer) => !offer.expiresAt || offer.expiresAt > now,
  );
  return (
    <section className="availability" aria-label="Streaming availability">
      <h3>Where to watch in {country}</h3>
      {title.type === "Series" && (
        <p>Series-level listings. Individual seasons may vary.</p>
      )}
      {offers.length ? (
        <ul>
          {offers.map((offer, index) => (
            <li key={index}>
              <strong>
                {offer.service}
                {offer.addon && " · " + offer.addon}
              </strong>
              <span>{labels[offer.type]}</span>
              {offer.link && (
                <a href={offer.link} target="_blank" rel="noreferrer">
                  Open on {offer.service}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>The provider returned no listed options for this country.</p>
      )}
      <p>
        Checked{" "}
        <time dateTime={data.checkedAt}>
          {new Date(data.checkedAt).toLocaleString("en-GB")}
        </time>
        . Data from{" "}
        <a href="https://www.movieofthenight.com/about/api">
          Streaming Availability API by Movie of the Night
        </a>
        .
      </p>
    </section>
  );
}
