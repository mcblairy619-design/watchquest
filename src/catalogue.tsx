import { useEffect, useMemo, useState } from "react";
import { Film } from "lucide-react";

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
  }>();
  useEffect(() => {
    if (!request.path) return;
    const path = request.path;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok) {
          if (response.status === 429) {
            const body = (await response.json().catch(() => null)) as {
              code?: string;
            } | null;
            if (body?.code === "local_quota") {
              throw new Error(
                "The local catalogue request allowance is exhausted.",
              );
            }
          }
          throw new Error(
            response.status === 429
              ? "The data provider is busy. Try again later."
              : "Could not load catalogue information.",
          );
        }
        const data: T = await response.json();
        if (!controller.signal.aborted) setResult({ request, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            request,
            error:
              error instanceof Error
                ? error.message
                : "Could not load catalogue information.",
          });
      }
    }, request.delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [request]);
  const current = result?.request === request ? result : undefined;
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
    <img alt="" src={src} loading="lazy" onError={() => setFailed(src)} />
  ) : (
    <span className="poster-placeholder" aria-hidden="true">
      <Film size={28} />
    </span>
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
