# Discovery, watchlists and local activity

## Recommendations and discovery

Weekly picks target five films and one series. Within each slot, recent picks are a fallback when there are no fresh alternatives of that type. Preference signals, genre diversity and stable title IDs determine the order. The current set stays in its London calendar week and follows the existing replacement and first-questionnaire rules. Availability can expire independently of a saved pick. A short result set stays short.

Discover filters and sorts the results already loaded. Submitting a title query, or pausing after entering two or more characters, searches the provider within the current country and selected subscriptions. The app debounces live search by 350 ms and invalidates earlier results when the search changes or closes. Unknown public ratings, release dates and runtimes sort after titles with supported metadata. A Movie DNA match uses the ranking score. A personal rating prediction uses the existing rating safeguards. The primary provider does not supply a sourced public review rating for this interface. Optional TMDB legacy details may display a TMDB vote average when votes exist.

Dice draws avoid previously rolled, watched and rejected titles in the session. Best match uses Movie DNA ranking. Something different favours fewer favourite-genre matches and uses Movie DNA ranking for ties. Under 90 minutes and 105–135 minutes require known runtime. The wheel gives each eligible entry an equal chance. Saved entries need already verified offers for the selected subscriptions, which can come from the loaded catalogue or the watchlist's existing detail lookup. Opening a tool and choosing filters, rolling or spinning does not fetch replacement pages. The fictional demo mode stays labelled.

## User data and events

Existing browser keys retain their formats and identifiers. New keys use the existing storage namespace. The watchlist preserves its original insertion order and stores priority separately. Older watched entries without known type or genre remain in history. Statistics use stored user actions and available title information. Viewing duration and streaks are absent because the app lacks reliable time measurements.

`activity-events-v1` is a map keyed by event kind and subject. Each entry has `kind`, `subject` and millisecond timestamp `at`. Movie DNA completion uses a profile subject, film watched and title rated use title IDs, genre discovery uses the genre, and weekly completion uses week and subscription scope when all six picks are marked watched. Each event is recorded once per subject in this browser. Editing a rating or toggling a watched title does not award a second event. Events describe recorded first actions, while profile totals reflect the current watched and rating records. The activity log does not backfill earlier actions.

## Provider boundaries and later work

Movie of the Night remains primary. Live draws need a fresh, unexpired base subscription offer for the selected country and service. Rentals, purchases, free offers and paid channels do not qualify. The guarded server route retains the maximum 450 requests over a rolling 31 days. No cache configuration, artwork rights or credential handling changed. [Provider setup and restrictions](DATA_PROVIDERS.md)

Candidates for the next phase include export and restore of local data, physical Safari accessibility checks and a decision on commercially cleared artwork and regional catalogue coverage.
