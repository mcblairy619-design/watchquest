# WatchQuest

**LESS SCROLLING. MORE WATCHING.**

**FIND • WATCH • RATE • LEVEL UP.**

WatchQuest is a film and television discovery prototype with a browser-local Movie DNA profile and weekly picks. It runs with a fictional catalogue until the owner enables permitted provider access. Phase 4 requires the owner's approval.

- [Product specification](docs/PRODUCT_SPEC.md)
- [Development roadmap](docs/ROADMAP.md)
- [Progress and asset audit](docs/PROGRESS.md)
- [Development instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [Environment template](.env.example)
- [Data provider decisions and local setup](docs/DATA_PROVIDERS.md)
- [Movie DNA, recommendations and weekly history](docs/MOVIE_DNA.md)

## Run locally

From the project folder, run `npm ci` on a fresh checkout, then `npm run dev`. Open [WatchQuest on this computer](http://127.0.0.1:5173/). If PowerShell blocks `npm`, use `npm.cmd` instead. Re-run `npm ci` rather than copying `node_modules` between Windows and Linux. Demo mode requires no API key.

Open **Movie DNA** and choose **Retake questionnaire** to answer the nine steps, or **Edit Movie DNA** to jump to an answer from the review. Saved titles, watch history, ratings and preferences are stored in the browser you use.

## Repository layout

- `src/main.tsx` and `src/style.css`: app entry, navigation, shared UI and styles.
- `src/catalogue/`: catalogue requests, offer display and fictional demo titles.
- `src/movie-dna/`: questionnaire, feedback, scoring and weekly picks.
- `server/`: provider integration and the request budget, connected to Vite for local development and preview.
- `tests/`: catalogue, Movie DNA and browser regression tests.
- `public/`: assets served as-is, including branding and licence notices.
- `docs/`: product specification, roadmap, progress and feature notes.

## Checks

Run `npm run lint`, `npm run check`, `npm test` and `npm run build`. The production bundle goes to `dist/`. The browser tests currently look for Chrome and Edge at fixed Windows paths and skip when those executables are absent. To run them, start a local demo server before running `npm test`. If live providers are configured, disable them for the test server with `AVAILABILITY_FREE_PLAN=no` and `CATALOGUE_USE=disabled`.
