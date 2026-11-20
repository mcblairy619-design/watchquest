import { useEffect, useState } from "react";
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
  score?: number;
  art?: string;
  poster?: string;
};

export const countries: Record<string, string> = {
  "United Kingdom": "gb",
  Ireland: "ie",
  "United States": "us",
  Canada: "ca",
  Australia: "au",
};

export function useCatalogueRequest<T>(path: string | undefined, delay = 0) {
  const [result, setResult] = useState<{
    path: string;
    data?: T;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? "The data provider is busy. Try again later."
              : "Could not load catalogue information.",
          );
        const data: T = await response.json();
        if (!controller.signal.aborted) setResult({ path, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            path,
            error:
              error instanceof Error
                ? error.message
                : "Could not load catalogue information.",
          });
      }
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [path, delay, retry]);
  return {
    data: result?.path === path ? result?.data : undefined,
    error: result?.path === path ? result?.error : undefined,
    loading: !!path && result?.path !== path,
    retry: () => {
      setResult(undefined);
      setRetry((value) => value + 1);
    },
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
};
type AvailabilityData =
  | { state: "checked"; checkedAt: string; offers: Offer[] }
  | { state: "unsupported" | "unconfigured" | "unknown" };

export function Availability({
  title,
  country,
}: {
  title: Title;
  country: string;
}) {
  const region = countries[country];
  const request = useCatalogueRequest<AvailabilityData>(
    title.score === undefined && region
      ? "/api/catalogue/" + title.id + "/availability?country=" + region
      : undefined,
  );
  if (title.score !== undefined)
    return <p>Streaming availability unverified.</p>;
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
  const data = request.data;
  if (data?.state !== "checked")
    return <p>Streaming availability is unverified for {country}.</p>;
  return (
    <section className="availability" aria-label="Streaming availability">
      <h3>Where to watch in {country}</h3>
      {title.type === "Series" && (
        <p>Series-level listings. Individual seasons may vary.</p>
      )}
      {data.offers.length ? (
        <ul>
          {data.offers.map((offer, index) => (
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
