import { useEffect, useRef, useState } from "react";
import {
  countries,
  subscriptionServices,
  useCatalogueRequest,
} from "../catalogue/catalogue";
import type { Title } from "../catalogue/catalogue";
import {
  catalogueGenres,
  changeRating,
  contentOptions,
  descriptiveGenres,
  normaliseProfile,
  pacingOptions,
  runtimeOptions,
  stories,
  summariseTitle,
  toggleChoice,
} from "./movie-dna";
import type {
  Feedback,
  Profile,
  TitleSummary,
  WeeklyRecord,
} from "./movie-dna";

type Taste = ReturnType<typeof normaliseProfile>;
type Service = { id: string; name: string };
type RatingChange = (title: TitleSummary, value?: number) => void;

const steps = [
  "Streaming subscriptions",
  "Favourite genres",
  "Genres to avoid",
  "Story preferences",
  "Pacing",
  "Film length",
  "Content preferences",
  "Favourite films and series",
  "Review",
];
const labels = new Map<string, string>(subscriptionServices);

function Choices({
  legend,
  options,
  selected,
  onToggle,
  disabled = [],
}: {
  legend: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  disabled?: readonly string[];
}) {
  return (
    <fieldset className="dna-options">
      <legend>{legend}</legend>
      <div className="chips">
        {options.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            aria-pressed={selected.includes(item)}
            disabled={disabled.includes(item)}
            onClick={() => onToggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function RatingInput({
  title,
  feedback,
  onRate,
}: {
  title: TitleSummary;
  feedback: Feedback;
  onRate: RatingChange;
}) {
  return (
    <label className="rating-input">
      Your rating for {title.name}
      <select
        value={feedback.ratings[title.id]?.value ?? ""}
        onChange={(event) =>
          onRate(
            title,
            event.target.value ? Number(event.target.value) : undefined,
          )
        }
      >
        <option value="">Unrated</option>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
          <option value={value} key={value}>
            {value}/10
          </option>
        ))}
      </select>
    </label>
  );
}

function TasteSummary({
  taste,
  feedback,
  services = [],
  onEdit,
}: {
  taste: Taste;
  feedback: Feedback;
  services?: Service[];
  onEdit?: (step: number) => void;
}) {
  const names = new Map(services.map(({ id, name }) => [id, name]));
  const subscriptions = (
    taste.subscriptions?.[countries[taste.country]] ?? []
  ).map(
    (id) =>
      names.get(id) ??
      taste.subscriptionNames?.[countries[taste.country]]?.[id] ??
      labels.get(id) ??
      id,
  );
  const rows = [
    [
      "Country and subscriptions",
      [
        taste.country,
        ...(subscriptions.length
          ? subscriptions
          : ["No subscriptions selected"]),
      ],
    ],
    ["Favourite genres", taste.genres],
    ["Genres to avoid", taste.dna.avoid],
    ["Story preferences", taste.dna.stories],
    ["Pacing", [taste.dna.pacing]],
    ["Film length", [taste.dna.runtime]],
    ["Content preferences", taste.dna.content],
    [
      "Favourite films and series",
      taste.dna.favourites.map(
        ({ id, name }) =>
          name +
          (feedback.ratings[id]
            ? " · " + feedback.ratings[id].value + "/10"
            : ""),
      ),
    ],
  ] as const;
  return (
    <dl className="dna-summary">
      {rows.map(([label, values], index) => (
        <div key={label}>
          <dt>
            {label}
            {onEdit && (
              <button className="text-button" onClick={() => onEdit(index)}>
                Edit {label.toLowerCase()}
              </button>
            )}
          </dt>
          <dd>{values.length ? values.join(", ") : "None selected"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MovieDnaQuestionnaire({
  profile,
  feedback,
  live,
  review,
  save,
  close,
}: {
  profile: Profile;
  feedback: Feedback;
  live: boolean;
  review: boolean;
  save: (profile: Profile, feedback: Feedback) => void;
  close: () => void;
}) {
  const [step, setStep] = useState(review ? 8 : 0);
  const [draft, setDraft] = useState(() => normaliseProfile(profile));
  const [draftFeedback, setDraftFeedback] = useState(feedback);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [countryServices, setCountryServices] = useState<
    Record<string, Service[]>
  >({});
  const heading = useRef<HTMLHeadingElement>(null);
  const region = countries[draft.country];
  const selected = draft.subscriptions?.[region] ?? [];
  const services = useCatalogueRequest<{ services: Service[] }>(
    live && step === 0 && region && !countryServices[region]
      ? "/api/catalogue/services?country=" + region
      : undefined,
  );
  const favourites = useCatalogueRequest<{ titles: Title[] }>(
    live && region && submitted
      ? "/api/catalogue/favourites?country=" +
          region +
          "&q=" +
          encodeURIComponent(submitted)
      : undefined,
  );
  const serviceData = services.data?.services;
  useEffect(() => {
    if (region && serviceData) {
      setCountryServices((previous) => ({
        ...previous,
        [region]: serviceData,
      }));
    }
  }, [region, serviceData]);
  const options = serviceData ?? countryServices[region] ?? [];
  const onRate: RatingChange = (title, value) =>
    setDraftFeedback((previous) => changeRating(previous, title, value));

  useEffect(() => heading.current?.focus(), [step]);

  const patch = (values: Partial<Taste["dna"]>) =>
    setDraft((previous) => ({
      ...previous,
      dna: { ...previous.dna, ...values },
    }));
  const genreToggle = (item: string) => {
    if (step === 1) {
      const genres = toggleChoice(draft.genres, item);
      setDraft({
        ...draft,
        genres,
        dna: {
          ...draft.dna,
          avoid: draft.dna.avoid.filter((value) => !genres.includes(value)),
        },
      });
    } else patch({ avoid: toggleChoice(draft.dna.avoid, item) });
  };

  function addFavourite(title: TitleSummary) {
    setDraft((previous) =>
      previous.dna.favourites.some((item) => item.id === title.id)
        ? previous
        : {
            ...previous,
            dna: {
              ...previous.dna,
              favourites: [...previous.dna.favourites, summariseTitle(title)],
            },
          },
    );
  }

  const visibleServices = [
    ...options,
    ...selected
      .filter((id) => !options.some((service) => service.id === id))
      .map((id) => ({ id, name: (labels.get(id) ?? id) + " (saved)" })),
  ];
  const optional = step >= 2 && step <= 7;
  return (
    <div className="dna-wizard">
      <div className="dna-step">
        <span>
          Step {step + 1} of {steps.length} · About 3–5 minutes
        </span>
        <progress
          value={step + 1}
          max={steps.length}
          aria-label="Questionnaire progress"
        />
      </div>
      <h3 tabIndex={-1} ref={heading}>
        {steps[step]}
      </h3>
      {step === 0 && (
        <div className="form-stack">
          <div className="welcome">
            <img src="/media/mascot.jpg" alt="" />
            <p>
              Welcome to WatchQuest. Pick the services you use and tell us what
              you enjoy watching.
            </p>
          </div>
          <label>
            Display name (optional)
            <input
              maxLength={30}
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <label>
            Viewing country
            <select
              value={draft.country}
              onChange={(event) => {
                setDraft({ ...draft, country: event.target.value });
                setSubmitted("");
              }}
            >
              {[...Object.keys(countries), "Other"].map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
          <fieldset className="dna-options">
            <legend>Your subscriptions in {draft.country}</legend>
            <p>
              Choose services you already subscribe to. Rentals, purchases and
              extra channels are excluded.
            </p>
            {!region && (
              <p>Live availability is unavailable for this country.</p>
            )}
            {region && !live && (
              <p>
                Live services are unavailable. We’ll keep any subscriptions you
                previously saved.
              </p>
            )}
            {services.loading && (
              <p role="status">Checking supported services…</p>
            )}
            {services.error && (
              <p role="status">
                {services.error}{" "}
                <button className="text-button" onClick={services.retry}>
                  Retry services
                </button>
              </p>
            )}
            {services.data && !options.length && (
              <p>No base subscriptions were returned for this country.</p>
            )}
            <div className="chips">
              {visibleServices.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  className="chip"
                  aria-pressed={selected.includes(id)}
                  disabled={selected.length >= 12 && !selected.includes(id)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      subscriptions: {
                        ...draft.subscriptions,
                        [region]: toggleChoice(selected, id),
                      },
                      subscriptionNames: {
                        ...draft.subscriptionNames,
                        [region]: {
                          ...draft.subscriptionNames?.[region],
                          [id]:
                            options.find((service) => service.id === id)
                              ?.name ??
                            draft.subscriptionNames?.[region]?.[id] ??
                            labels.get(id) ??
                            id,
                        },
                      },
                    })
                  }
                >
                  {name}
                </button>
              ))}
            </div>
            {selected.length >= 12 && <p>Up to 12 services can be selected.</p>}
          </fieldset>
        </div>
      )}
      {(step === 1 || step === 2) && (
        <>
          {step === 2 && (
            <p>Your favourite genres can’t also be marked to avoid.</p>
          )}
          <Choices
            legend="Catalogue genres"
            options={catalogueGenres}
            selected={step === 1 ? draft.genres : draft.dna.avoid}
            disabled={step === 2 ? draft.genres : []}
            onToggle={genreToggle}
          />
          <Choices
            legend="Descriptive themes · saved as preferences"
            options={descriptiveGenres}
            selected={step === 1 ? draft.genres : draft.dna.avoid}
            disabled={step === 2 ? draft.genres : []}
            onToggle={genreToggle}
          />
          <p>
            Descriptive themes are not verified catalogue genres and don’t
            affect ranking yet.
          </p>
        </>
      )}
      {step === 3 && (
        <>
          <Choices
            legend="What kinds of stories do you enjoy?"
            options={stories}
            selected={draft.dna.stories}
            onToggle={(item) =>
              patch({ stories: toggleChoice(draft.dna.stories, item) })
            }
          />
          <p>Saved for when reliable story metadata is available.</p>
        </>
      )}
      {step === 4 && (
        <>
          <label className="rating-input">
            What kind of pacing do you enjoy?
            <select
              value={draft.dna.pacing}
              onChange={(event) =>
                patch({ pacing: event.target.value as Taste["dna"]["pacing"] })
              }
            >
              {pacingOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <p>
            Pacing is saved for later because the catalogue does not verify it.
          </p>
        </>
      )}
      {step === 5 && (
        <>
          <label className="rating-input">
            How long do you usually like films to be?
            <select
              value={draft.dna.runtime}
              onChange={(event) =>
                patch({
                  runtime: event.target.value as Taste["dna"]["runtime"],
                })
              }
            >
              {runtimeOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <p>
            Matching films get a boost when a runtime is available. Other
            lengths can still appear.
          </p>
        </>
      )}
      {step === 6 && (
        <>
          <Choices
            legend="Content preferences"
            options={contentOptions}
            selected={draft.dna.content}
            onToggle={(item) =>
              patch({
                content:
                  item === "No content restrictions"
                    ? toggleChoice(
                        draft.dna.content.includes(item) ? [item] : [],
                        item,
                      )
                    : toggleChoice(
                        draft.dna.content.filter(
                          (value) => value !== "No content restrictions",
                        ),
                        item,
                      ),
              })
            }
          />
          <p>
            These answers are saved. The catalogue cannot verify content
            suitability or filter for these preferences.
          </p>
        </>
      )}
      {step === 7 && (
        <>
          {live && region ? (
            <form
              className="dna-search"
              role="search"
              aria-label="Find favourite titles"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(query.trim().length >= 2 ? query.trim() : "");
              }}
            >
              <label>
                Search films and series
                <input
                  value={query}
                  maxLength={100}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (!event.target.value.trim()) setSubmitted("");
                  }}
                />
              </label>
              <button
                className="button secondary"
                disabled={query.trim().length < 2}
              >
                Search
              </button>
            </form>
          ) : (
            <p>
              Live title search is unavailable. Existing favourites stay saved,
              and you can skip this step.
            </p>
          )}
          {favourites.loading && <p role="status">Searching catalogue…</p>}
          {favourites.error && (
            <p role="status">
              {favourites.error} You can skip this step or try again later.
            </p>
          )}
          {favourites.data && !favourites.data.titles.length && (
            <p>No matching titles were returned.</p>
          )}
          {favourites.data?.titles.length ? (
            <ul className="dna-list">
              {favourites.data.titles.map((title) => (
                <li key={title.id}>
                  <span>
                    {title.name} · {title.type}
                    {title.releaseDate
                      ? " · " + title.releaseDate.slice(0, 4)
                      : ""}
                  </span>
                  <button
                    className="button secondary"
                    aria-label={"Add " + title.name + " to favourites"}
                    disabled={draft.dna.favourites.some(
                      (item) => item.id === title.id,
                    )}
                    onClick={() => addFavourite(title)}
                  >
                    {draft.dna.favourites.some((item) => item.id === title.id)
                      ? "Added"
                      : "Add"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {draft.dna.favourites.length > 0 && (
            <ul className="dna-list">
              {draft.dna.favourites.map((title) => (
                <li key={title.id}>
                  <RatingInput
                    title={title}
                    feedback={draftFeedback}
                    onRate={onRate}
                  />
                  <button
                    className="button secondary"
                    aria-label={"Remove favourite " + title.name}
                    onClick={() =>
                      patch({
                        favourites: draft.dna.favourites.filter(
                          (item) => item.id !== title.id,
                        ),
                      })
                    }
                  >
                    Remove favourite
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {step === 8 && (
        <>
          <TasteSummary
            taste={draft}
            feedback={draftFeedback}
            services={options}
            onEdit={setStep}
          />
          <p>
            Save to apply your answers. Your first completed questionnaire can
            personalise provisional picks. Later changes guide replacements and
            future weeks.
          </p>
        </>
      )}
      <div className="actions dna-actions">
        <button
          className="button secondary"
          onClick={() => (step ? setStep(step - 1) : close())}
        >
          {step ? "Back" : "Cancel"}
        </button>
        {optional && (
          <button
            className="button secondary"
            onClick={() => setStep(step + 1)}
          >
            Skip
          </button>
        )}
        {step < 8 ? (
          <button className="button primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button
            className="button primary"
            onClick={() =>
              save(
                normaliseProfile({ ...draft, name: draft.name.trim() }),
                draftFeedback,
              )
            }
          >
            Save Movie DNA
          </button>
        )}
      </div>
    </div>
  );
}

export function MovieDnaPage({
  profile,
  feedback,
  history,
  edit,
  retake,
  onRate,
  onRestore,
}: {
  profile: Profile;
  feedback: Feedback;
  history: WeeklyRecord[];
  edit: () => void;
  retake: () => void;
  onRate: RatingChange;
  onRestore: (title: TitleSummary) => void;
}) {
  return (
    <section className="dna-profile">
      <h1>Movie DNA</h1>
      <p className="intro">Your viewing tastes, ratings and subscriptions.</p>
      <div className="actions">
        <button className="button primary" onClick={edit}>
          Edit Movie DNA
        </button>
        <button className="button secondary" onClick={retake}>
          Retake questionnaire
        </button>
      </div>
      <TasteSummary taste={normaliseProfile(profile)} feedback={feedback} />
      <section className="panel">
        <h2>Your ratings</h2>
        {Object.values(feedback.ratings).length ? (
          <ul className="dna-list">
            {Object.values(feedback.ratings).map(({ title }) => (
              <li key={title.id}>
                <RatingInput
                  title={title}
                  feedback={feedback}
                  onRate={onRate}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>Open a title to rate it out of 10.</p>
        )}
      </section>
      <section className="panel">
        <h2>Not interested</h2>
        {Object.values(feedback.rejected).length ? (
          <ul className="dna-list">
            {Object.values(feedback.rejected).map((title) => (
              <li key={title.id}>
                <span>{title.name}</span>
                <button
                  className="button secondary"
                  onClick={() => onRestore(title)}
                  aria-label={"Restore " + title.name}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven’t rejected any titles.</p>
        )}
      </section>
      <section className="panel">
        <h2>Previous weekly picks</h2>
        {history.length ? (
          <div className="weekly-history">
            {[...history].reverse().map((record) => (
              <details key={record.week + record.scope}>
                <summary>
                  Week of {record.week} ·{" "}
                  {record.scope === "demo"
                    ? "Demo catalogue"
                    : record.scope.replace("|", " · ")}
                </summary>
                <ul>
                  {record.picks.map((pick) => (
                    <li key={pick.id}>
                      {pick.name} · {pick.type}
                    </li>
                  ))}
                </ul>
                {record.replaced.length > 0 && (
                  <p>
                    Replaced during the week:{" "}
                    {record.replaced.map((pick) => pick.name).join(", ")}
                  </p>
                )}
              </details>
            ))}
          </div>
        ) : (
          <p>Earlier weeks will appear here after the next Monday rollover.</p>
        )}
      </section>
    </section>
  );
}
