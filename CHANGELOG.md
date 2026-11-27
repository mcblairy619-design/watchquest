# Changelog

## Unreleased

- Adopted Roadmap V2 and documented zero-spend private staging options.
- Preserved the local discovery checkpoint in the web workspace and loaded root environment files for standalone API startup.

- Restructured the WatchQuest repository in place as an npm workspace with `apps/web` and `apps/api`, preserving the one-command local workflow and browser data.
- Added a standalone Node catalogue API entry point. The existing local development workflow is unchanged.
- Added an opt-in local proxy so the Vite dev server and production preview can use the standalone API without changing frontend catalogue URLs.
- Grouped project documentation and frontend feature files. No changes to app behaviour or stored data.
- Standardised Node and line endings for Windows and Linux, and added a two-OS CI workflow with portable browser tests.
- Split the browser suite into independent feature scenarios, with shared test setup and synthetic provider fixtures.

## Phase 4 · Ultimate Discovery Experience

- Added combined discovery filters, local sorting and debounced provider search.
- Improved weekly variety and added recommendation details while keeping existing weekly records and one-slot replacements.
- Added personalised dice modes and session history, plus a fair film wheel with weekly, watchlist and manual entries.
- Added watchlist search, priority and undo, local viewing statistics, editable ratings and deduplicated activity events.
- Kept verified regional subscription checks, the free-plan cap and approved artwork settings.

## Live catalogue reliability

- Added reconnect recovery and separate messages for failed checks and successful checks with no eligible offers.
- Improved the WatchQuest artwork fallback while keeping unverified poster artwork disabled.

## Phase 3 · Movie DNA 2.0

- Added the nine-step questionnaire and a dedicated profile with saved preferences, ratings, feedback and weekly history.
- Ranked eligible weekly picks with deterministic, documented rules, evidence-based explanations and personal predictions when sufficient ratings exist.
- Added individual replacements, watched and rating actions, and reversible rejections. Retained WatchQuest branding and the existing browser data.

## Phase 2.2 · WatchQuest

- Backed up the Phase 2.1 checkpoint to GitHub.
- Applied the approved WatchQuest logo, app icons, typography and responsive navigation while retaining the existing cinematic banner.
- Added available catalogue details and watched controls to weekly picks, plus a dashboard summary of existing browser activity.

## 23 November 2026 · Phase 2.1

- Fixed live search resets and stale responses, and restored First Film for native Movie of the Night IDs.
- Documented the primary provider, free-plan budget and optional metadata sources, and added secret ignore rules.
- Made the achievement browser assertion wait for the rendered result.

## 20 November 2026 · Phase 2

- Added opt-in TMDB metadata and Movie of the Night availability behind a local server API.
- Connected discovery, weekly picks, dice and wheel to the configured catalogue while preserving earlier browser data.
- Added distinct offer types, country lookup, source credits, caching, request budgets and provider tests.

## 20 November 2026 · Phase 1

- Added the responsive React website and seven prototype pages with the approved SG branding.
- Added a fictional weekly watchlist, catalogue search, dice and wheel, browser-local saves, watched status and guest onboarding.
- Added original demo imagery, production build commands and Chrome and Edge browser tests.

## 20 November 2026 · Phase 0

- Established the product specification, phase order, progress tracker and development instructions.
- Reviewed the supplied branding, source assets, licences and local tools.
- Added a blank environment template and ignored private source assets, local secrets and generated files.
