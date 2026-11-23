# Movie DNA and weekly picks

## Questionnaire and browser data

Open **Movie DNA** to see saved tastes, subscriptions, user ratings, rejected titles and previous weeks. **Edit Movie DNA** opens the review with links to each answer. **Retake questionnaire** starts at the first step with earlier answers visible. Neither action applies changes until Save. The nine steps cover subscriptions, favourite genres, avoided genres, stories, pacing, length, content preferences, rated favourites and review.

The app keeps the original local profile, saved and watched keys under the `sg-phase1-` prefix. It reads older profiles without a `dna` property and supplies defaults in memory. For example, the old `Sci-fi` preference displays and scores as Science Fiction. The new answers are added to the same profile on confirmation. The separate `movie-feedback` and `weekly-picks` keys hold ratings/rejections and weekly records. Existing watch history and saved title IDs need no migration. Browser storage is local to the site origin and device.

Subscriptions come from the provider's country endpoint and only show newly selectable services that support base subscriptions. Existing selections are kept when live service metadata is unavailable. A favourite search runs only on explicit submission, shares the provider request budget and returns metadata independently of whether a title is currently included. It never feeds availability into recommendations. Search errors and quota exhaustion leave the step skippable.

## Deterministic ranking

Each candidate must have a fresh offer from the viewing country and a selected service before it can enter the live pool. Rentals, purchases, free-only offers, expired offers and extra channels never qualify. Watched titles and explicit rejections are excluded. The separately labelled demo catalogue is available without a live account.

| Signal | Ranking weight |
| --- | --- |
| Favourite catalogue genres | +4 per matching genre, up to three |
| Genres to avoid | −6 per matching genre |
| Preferred film length | +2 when a matching runtime is supplied |
| Similar titles rated at least 7/10 | +1.5 per same-type title sharing a genre, capped at +6 |
| Similar favourite | +1 when a same-type favourite shares a genre |
| Already on the watchlist | +1 |
| Appeared in the last three recorded weeks for the same country and subscriptions | −7 |
| Genres already represented in the current selection | −2 per overlapping genre, capped at −6 |

The title ID breaks ties. Selection balances preference and variety using these weights. A single low rating never marks a genre as disliked. Story, pacing and content answers, plus descriptive themes such as True Crime and Superhero, are stored for future metadata. They earn no ranking points. Genre matching uses the documented provider categories and known aliases. [Provider genre schema](https://docs.movieofthenight.com/resource/genres)

A card's explanation is based on the signals available when that slot was selected. When there are no supporting taste signals, it explains the catalogue source. The estimate out of 10 requires at least three distinct, user-rated, same-type titles that share a supported genre. It is the weighted mean of those ratings, where the weight is the number of shared genres, rounded to one decimal. Updating ratings refreshes estimates without changing the week's slots. Demo ratings cannot train live picks, and demo picks display no predictions. WatchQuest shows no confidence or accuracy claims.

## Weekly selection and feedback

The calendar week starts at **00:00 Monday in Europe/London**, including the switch to and from British Summer Time. Each browser keeps a separate selection for the week, country and sorted subscription set. It fills up to five films and one series from already verified titles. If the initial non-empty live page has too few candidates of either type, the dashboard checks at most one additional first page per missing type for that catalogue view. It uses the same server request limits. A successful check with too few eligible results displays the actual count.

The first saved Movie DNA can personalise provisional picks. After that, changes normally affect replacements and future weeks. Refreshing results rechecks eligibility while retaining slot identities. A new title may fill an unused slot when verified data arrives. If a pick has been watched, rejected or cannot be verified in the current snapshot, the app withholds it from active recommendations and shows it under the weekly list. Replacement changes just that slot and keeps the same film or series type. A removed pick cannot immediately reappear in the same week. Previous selections and replacements stay visible in Movie DNA.

Ratings are entered or removed in title details and Movie DNA. Rejections can be undone from the title dialog or restored in Movie DNA. Saving, watching, rating and rejecting are independent actions. Watch history and achievement behaviour remain local to the browser.

## Limits and later work

Movie of the Night can have limited catalogue coverage, missing film runtimes or differing availability by TV season. Failed, empty or stale availability cannot supply live picks. Stream subscriptions and offers can change after checking. The current view can be rechecked explicitly, within the existing **450-request rolling 31-day** cap. WatchQuest does not make background availability checks for historical weeks.

Later work can add account synchronisation, episode-level availability, richer verified content metadata and measured prediction calibration. Plan those separately from this phase.
