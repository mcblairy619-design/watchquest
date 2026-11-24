# WatchQuest

**LESS SCROLLING. MORE WATCHING.**

**FIND • WATCH • RATE • LEVEL UP.**

WatchQuest is a film and television discovery prototype with a browser-local Movie DNA profile and weekly picks. It runs with a fictional catalogue until the owner enables permitted provider access. Phase 4 requires the owner's approval.

- [Product specification](docs/PRODUCT_SPEC.md)
- [Development roadmap](docs/ROADMAP.md)
- [Progress and asset audit](docs/PROGRESS.md)
- [Contribution guide](CONTRIBUTING.md)
- [Development instructions for coding agents](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [Environment template](.env.example)
- [Data provider decisions and local setup](docs/DATA_PROVIDERS.md)
- [Movie DNA, recommendations and weekly history](docs/MOVIE_DNA.md)

## Run locally

Use the Node.js version in [`.node-version`](.node-version). From the repository root, run `npm ci` to install both workspaces from the shared lockfile, then `npm run dev`. Open [WatchQuest on this computer](http://127.0.0.1:5173/). If PowerShell blocks `npm`, use `npm.cmd` instead. Re-run `npm ci` rather than copying `node_modules` between Windows and Linux. Demo mode requires no API key.

Open **Movie DNA** and choose **Retake questionnaire** to answer the nine steps, or **Edit Movie DNA** to jump to an answer from the review. Saved titles, watch history, ratings and preferences are stored in the browser you use.

Run `npm run start:api` to start the standalone catalogue API, then open [its status endpoint](http://127.0.0.1:3001/api/catalogue/status). It binds to `127.0.0.1:3001` by default; set `WATCHQUEST_API_HOST` or `WATCHQUEST_API_PORT` in the server environment to override this. It does not serve the frontend. By default, `npm run dev` still runs the frontend and its embedded catalogue API on port 5173.

To use two processes locally, leave the standalone API running and set `WATCHQUEST_API_PROXY_TARGET` in the web terminal before starting Vite:

- Linux: `WATCHQUEST_API_PROXY_TARGET=http://127.0.0.1:3001 npm run dev --workspace @watchquest/web`
- PowerShell: `$env:WATCHQUEST_API_PROXY_TARGET = 'http://127.0.0.1:3001'; npm.cmd run dev --workspace @watchquest/web`

Vite forwards catalogue requests to the standalone API without changing the browser's dev origin, so existing local saves remain visible. To try the built frontend, run `npm run build`, then use `npm run preview` with the same environment setting. Preview can use a different port and therefore a different browser storage origin. This proxy is for local development and preview, not the planned two-origin staging deployment.

## Repository layout

- `apps/web/` (`@watchquest/web`): React/Vite frontend, including catalogue, Movie DNA, browser storage and public assets. It talks to the API over HTTP and does not import API code.
- `apps/api/` (`@watchquest/api`): standalone Node catalogue API, provider integration and request budget. `npm run start:api` starts this workspace.
- Root `vite.config.mjs`: compatibility adapter for the existing one-command development and preview workflow; it is not required for building the web workspace or running the API.
- `tests/`: server catalogue and Movie DNA unit tests; `tests/browser/` contains browser scenarios grouped by feature, with shared setup and test-only fixtures in `support/`.
- `docs/`: product specification, roadmap, progress and feature notes.

## Checks

Run `npm run test:setup` once, and again after Playwright updates, to download the matching headless Chromium. On a supported Linux distribution that is missing browser libraries, run `npm run test:setup -- --with-deps`. Then run `npm test` on either OS. Browser tests start their own local demo servers with provider access disabled; you don't need to stop your dev server or install Chrome or Edge. Use `npm run test:browser` for the browser suite alone, or `npm run test:unit` for the Node-only tests without Chromium.

Run `npm run lint`, `npm run check` and `npm run build` for the other checks. The production bundle goes to `apps/web/dist/`. GitHub Actions runs the same root commands on Ubuntu and Windows for pull requests and pushes to `main`.
