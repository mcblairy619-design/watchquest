import { useId } from "react";
import type { Filters, ScoredTitle } from "./discovery";

export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  return (
    <label>
      <span id={labelId}>{label}</span>
      <select
        aria-labelledby={labelId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([key, name]) => (
          <option key={key} value={key}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function DiscoveryFilters({
  items,
  filters,
  change,
  compact = false,
}: {
  items: ScoredTitle[];
  filters: Filters;
  change: (filters: Filters) => void;
  compact?: boolean;
}) {
  const options = (values: (string | undefined)[]) =>
    [
      ["", "Any"],
      ...[...new Set(values.filter((x): x is string => !!x))]
        .sort()
        .map((value) => [value, value]),
    ] as [string, string][];
  const field = (
    key: Exclude<keyof Filters, "unwatched">,
    label: string,
    choices: readonly (readonly [string, string])[],
  ) => (
    <Choice
      label={label}
      value={filters[key]}
      options={choices}
      onChange={(value) => change({ ...filters, [key]: value })}
    />
  );
  return (
    <div className="discovery-controls">
      {field("type", "Title type", [
        ["", "All titles"],
        ["Film", "Films"],
        ["Series", "Series"],
      ])}
      {field(
        "service",
        "Verified service",
        options(items.flatMap((item) => item.services)),
      )}
      {field(
        "genre",
        "Genre",
        options(
          items.flatMap(({ title }) =>
            title.genres?.length ? title.genres : [title.genre],
          ),
        ),
      )}
      {field("runtime", "Runtime", [
        ["", "Any runtime"],
        ["short", "Under 90 minutes"],
        ["around", "Around two hours"],
      ])}
      {!compact && (
        <>
          {field(
            "year",
            "Release year",
            options(items.map(({ title }) => title.releaseDate?.slice(0, 4))),
          )}
          {field("score", "Movie DNA match", [
            ["", "Any match"],
            ["4", "Some preference signals"],
            ["8", "Stronger preference signals"],
          ])}
          {items.some(({ title }) => title.publicRating) &&
            field("publicRating", "Public rating", [
              ["", "Any rating"],
              ["7", "At least 7/10"],
              ["8", "At least 8/10"],
            ])}
          {field("sort", "Sort by", [
            ["default", "Catalogue order"],
            ["match", "Best match for me"],
            ["public", "Highest verified public rating"],
            ["new", "Newest release"],
            ["old", "Oldest release"],
            ["short", "Shortest runtime"],
            ["long", "Longest runtime"],
          ])}
          <label className="check-choice">
            <input
              type="checkbox"
              checked={filters.unwatched}
              onChange={(event) =>
                change({ ...filters, unwatched: event.target.checked })
              }
            />
            Unwatched only
          </label>
        </>
      )}
    </div>
  );
}
