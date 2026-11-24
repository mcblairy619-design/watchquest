# WatchQuest development roadmap

Roadmap V2 approved on 24 November 2026. Historical phase numbers and delivered checkpoints are preserved. [PROGRESS.md](PROGRESS.md) records actual verification.

## Release scope

- **Product:** help people choose a film or series they can already stream. WatchQuest combines results across selected services; users declare their subscriptions without connecting their streaming accounts or sharing credentials.
- **First release:** a free, invite-only UK beta. Services available are provided by the API. Only offers included in a selected base subscription qualify. Rentals, purchases, free-only offers and separately paid channels do not qualify. Paid channels are not selectable subscriptions yet.
- **Beta sequence:** first prove account access, device sync and service discovery; then enable shared ratings and reviews for the same cohort once moderation is ready. No billing, adverts or paywalls. Avatars, expanded community features and native apps will come later.

## How to use this roadmap

A phase describes the intended outcome, boundaries and evidence required for approval. Proposed changes to sequencing, spending, or public release still require owner approval. Do not move to the next phase merely because code is merged. At each checkpoint, record how to verify the result, what passed, what was skipped and any remaining blockers in [PROGRESS.md](PROGRESS.md). For code changes, use the checks in [CONTRIBUTING.md](../CONTRIBUTING.md). Keep routine tests synthetic and get approval before spending live provider quota on verification.

## Phases 0–3 — Delivered foundations

| Phase | Delivered | Boundary to preserve |
| --- | --- | --- |
| 0 — Inventory and planning | Audited branding, reference assets, tooling, licences and costs. | Private source assets and reference boards stay out of the repository and deployment. |
| 1 — Responsive prototype | Built the React/TypeScript/Vite shell, guest experience, fictional catalogue and initial discovery. | Preserve guest access to the prototype and label fictional content. |
| 2 — Provider adapters | Added server-side metadata and regional availability handling. | Keep credentials server-side and separate subscription offers from rentals, purchases, free offers and paid channels. |
| 2.1 — Primary provider | Verified a local UK Netflix sample using Movie of the Night without TMDB and documented quota and fallbacks. | Do not claim complete coverage from a spot-check. Keep the optional TMDB path for supported legacy lookups. |
| 2.2 — WatchQuest rebrand | Shipped approved branding and dashboard changes. | Preserve existing routes, saved title identifiers and browser data. Keep uncleared artwork disabled. |
| 3 — Movie DNA and weekly picks | Shipped browser-local onboarding, scoring, feedback and weekly records, with later fixes for catalogue recovery. | Keep deterministic scoring, London Monday rollover, individual pick replacement and prior history. The free target is up to five films and one series, not a guarantee when coverage is limited. |

See [PROGRESS.md](PROGRESS.md) for what was actually verified and [MOVIE_DNA.md](MOVIE_DNA.md) for the recommendation rules. Phase 3 did not ship hosted accounts or cross-device sync.

### Phase 4 discovery checkpoint — Delivered

Ultimate Discovery Experience introduced improved weekly picks, search and filters, dice and wheel, watchlist controls and local viewing activity. See [discovery behaviour](DISCOVERY.md) and [verification history](PROGRESS.md). The migration preserves that checkpoint.

## Phase 4 — Monorepo migration, hosted staging, accounts and private data

**Status:** The in-place migration is approved. Hosted staging and account work still require approval. Agree on the staging host, invite administration and any spending before starting the relevant work. Supabase Auth and PostgreSQL remain the planned account foundation.

### 4.0 — Restructure the WatchQuest repository without changing behaviour

- Use WatchQuest's `refactor/monostyle-migration` branch to move the React/Vite frontend and catalogue backend into `apps/web/` and `apps/api/` in the existing repository. Each app runs independently. The planned production layout uses separate web and API origins. Hostnames and domain ownership are unconfirmed.
- Keep React organised by feature and have it call the API over HTTP, without importing server code. Reuse the existing provider adapters and request-budget logic behind a thin HTTP entry point. Keep `/api/catalogue` and its response behaviour intact. Use a feature-oriented MVC-style split in the API: controllers handle HTTP, services hold business rules, and adapters or repositories handle data access. Do not rewrite working catalogue or Movie DNA logic to fit that structure.
- Use one npm workspace lockfile and the existing root CI checks. Keep setup and checks documented for Windows and Linux. Preserve guest mode, browser storage keys, saved title IDs and weekly history. Keep the existing local frontend origin where practical: changing the scheme, hostname or port leaves browser saves on the old origin. If the intended cutover changes origin, document how existing saves will remain accessible or be transferred; do not assume that preserving keys is enough.
- Keep this checkpoint limited to the move and wiring. No accounts, database schema changes, UI redesign or provider switch.

**Evidence:** The API starts without Vite and the built frontend works against it. The existing catalogue route, fictional guest demo, saved titles, Movie DNA and weekly history still work. Lint, type checks, automated tests and the production build pass from the repository root, with Windows and Ubuntu CI and no live provider calls. Record the source revision, verification results and the pre-restructure commit as a rollback point.

### 4.1 — Deploy a private staging environment

- Deploy the web and API apps to separate staging origins that mirror the planned production split, separate from any public site. Configure the frontend's API address per environment and allow only the intended frontend origin on each API environment. Verify the browser flow against the real staging origins rather than relying on the local Vite proxy. Cross-origin settings do not replace API authentication or data-access checks; if account work uses cookies, keep them scoped to the API host.
- Keep production and staging data, secrets and provider credentials separate where possible. Use a demo or mocked provider for routine testing; enable real provider access only for approved verification. Enforce a shared request budget across the hosted app rather than relying on a file in an individual checkout.
- Record how to deploy, roll back and diagnose an unavailable API without exposing credentials or personal data.

**Evidence:** The built frontend works with the standalone API across the two staging origins, and browsers on unapproved origins cannot read API responses. The app distinguishes an unavailable live catalogue from an empty verified result. The web and API deployments can be rolled back to compatible known builds.

### 4.2 — Establish invite-only access

- Add email invitations, registration, sign-in, sign-out and account recovery. An invite must be tied to the intended email, with expiry and a way to revoke unused invites. A public URL must not bypass registration restrictions.
- Preserve the fictional guest demo where appropriate, but keep invite-only account features and beta provider access behind sign-in. Do not add social sign-in in this phase.
- Set database permissions so the server enforces ownership of private data. Record who can issue invites and how to remove beta access. Provide account deletion and data export before real testers are invited; agree what to retain and for how long.
- Keep the Supabase schema and access policies in versioned migrations. Use typed data objects derived from the schema and return only the fields the frontend needs. Use the signed-in user's identity for routine account data requests so row-level policies apply; do not use an elevated server key for routine reads and writes.

**Evidence:** Invited users can sign in and recover access. Uninvited users, reused/revoked invites and invitations used with a different email are rejected. Signed-out access and a separate account cannot read or write another user's private data, including through direct requests rather than only the UI.

### 4.3 — Sync without losing existing browser data

- Prove the full journey with one watchlist save first: accept an invite, sign in, import the save from the browser and open it on a second device. Then extend sync to watched titles and types, private ratings and rejections, Movie DNA, streaming selections and weekly history.
- Keep the existing browser keys readable for import. Decide and document what happens when imported and account records differ; do not silently overwrite one with the other. Import is explicit, safe to retry and does not delete the local copy. Keep fictional titles distinct from live catalogue records.
- Preserve existing title IDs or map them to a stable stored identity so a provider change or unavailable offer does not orphan a saved title. Keep signed-in data from leaking to the next account on a shared device.

**Evidence:** Two devices converge on the same account data. Repeated or interrupted imports do not lose or duplicate saves. Existing data can be imported into a non-empty account. Signing out removes private data from view. The existing weekly history and guest storage regression cases still pass.

**Out of scope:** Public profiles or reviews, social sign-in, premium entitlements and payments.

## Phase 5 — Verify UK multi-service discovery

**Status:** Discovery flows already exist. Remaining scope is beta readiness: live coverage, realistic combinations, a shared request budget and fixes for failures found—not rebuilding search, dice or wheel.

- Verify Netflix, Prime Video, Disney+, HBO Max and Paramount+ individually, then a mixed selection and all five together. Capture the region, service, time and representative titles checked, including at least one title available on more than one selected service. Cross-check offers and watch links against the streaming service where practical.
- Use one title entry for an overlap, showing its qualifying watch options. Unselecting a service removes titles that are no longer eligible from live discovery, without dropping existing saves or historical picks. An expired or unverifiable offer cannot qualify.
- Verify the same eligibility rules for search, weekly picks, Roll the Dice and Spin to Watch. Verify the default weekly wheel and the saved and manual sources all require eligible, unwatched films. Cover empty pools and reduced motion. Distinguish a failed check from a successful check with no eligible results.
- Check the hosted quota against expected beta usage. Include catalogue browsing, favourite search, weekly supplements and retries. Document limits, what users see when quota is exhausted, and when to pause invites rather than overrun the allowance. Keep provider artwork disabled unless separately cleared.

**Evidence:** All five services pass the live checklist and the combined view works as expected. Automated tests cover overlap, unselected services, a rental, a paid channel, expiry, and failure recovery. Document any known coverage gaps instead of promising a full catalogue. A missing day-one service blocks the invite wave unless the owner explicitly changes scope.

**Out of scope:** Other viewing markets, paid channel entitlements, streaming-account linking, and guaranteed title counts.

## Phase 6 — Share ratings and reviews within the beta

**Depends on:** Verified account ownership and enough time using the first invite wave to identify sync or catalogue blockers. Existing private ratings are already part of Phase 4, not a feature to reimplement here.

- Keep personal ratings private unless deliberately published. Define one active community rating and one editable review per account per title, and show the number of ratings alongside any average. Support creation, editing, deletion and spoiler labels; limit visibility to beta members at first.
- Include reporting, basic abuse limits and a restricted moderation queue with an agreed moderation owner. Define what happens to reported, hidden and deleted material. Do not wait for the wider community phase to put reporting in place.
- Keep public contributions separate from private viewing history and recommendation data. Make it clear to a user whether an action changes a private score or shares something with the cohort.

**Evidence:** A contribution is visible to another invited account only after publication. Only the author can edit or delete it; a moderator can hide or restore content within their permissions. Spoilers are concealed until revealed. Edits and duplicate submissions do not inflate counts, and deleting a rating updates the aggregate. A report can be filed and resolved without exposing unrelated private data.

**Out of scope:** Public profiles, follows, a feed, leaderboards, helpful-vote incentives and XP for posting. Add these only after a separate decision.

## Phases 7–11 — Later features, not invite-beta requirements

| Phase | Scope | Evidence before marking complete |
| --- | --- | --- |
| 7 — Community and progression | Build approved profile visibility, social features, achievements, XP and leaderboards in small slices. Reuse moderation from Phase 6. | Verify privacy and blocking rules; repeated or automated actions cannot multiply rewards; moderation covers any new sharing surface. |
| 8 — Avatar lab | Evaluate approved glTF/GLB assets independently of the main app. Document licences, compatible rigs, textures, animation and mobile performance. | Prove a candidate works on representative devices and has a usable static fallback. No manual modelling requirement. |
| 9 — Avatar and mascot integration | Add optional avatar setup, configuration persistence and approved mascot assets. | Saved appearance survives sync; static and reduced-motion fallbacks work; uncleared founder material stays private. |
| 10 — Advanced discovery | Prioritise advanced search, alerts, group picks, personal stats and other documented features after beta findings. | Test consent, data coverage and calculations. Group picks must respect participants' privacy and shared availability. |
| 11 — WatchQuest+ preparation | Test a proposed premium benefit with beta members before charging. Prepare configurable membership entitlements and restricted administration if approved. | Access is decided server-side; entitlements can be granted and revoked without altering account data. Billing, adverts and paywalls stay disabled. Prices and allowances in the product spec are proposals. |

## Phase 12 — Invite beta rollout and exit review

**Approved sequencing:** The first invite-only UK beta can begin after Phases 4 and 5 pass their acceptance criteria. Reviews can join a second wave after Phase 6 passes. Public launch, paid hosting and live billing require separate approval.

**Before the first invite:** Confirm staging access and account isolation, all five UK services, provider use and quota for the planned cohort, privacy and support arrangements, a way to pause invites and roll back, and desktop and phone browser checks. Do not treat phone-sized Chromium as a substitute for real Safari testing.

**During the beta:** Track whether testers found and watched a suggested title, whether its offer was correct and whether they came back on another night. Record support issues and quota usage without collecting more personal data than needed. For the second wave, confirm an assigned moderator and a working report flow before turning on reviews.

**Exit evidence:** Summarise what happened against those questions; log availability, authentication and moderation problems and assign owners. Decide explicitly whether to fix and repeat, expand invites or prepare for public launch. Beta exit does not authorise billing or commercial launch.

## Phases 13–15 — Commercial readiness and launch

| Phase | Scope | Evidence before approval |
| --- | --- | --- |
| 13 — Commercial readiness | Confirm rights and attribution for the catalogue and artwork, provider capacity, operating costs, privacy obligations and support ownership. If payment work is separately approved, evaluate checkout, cancellation and failed renewals in test mode first. | Record the approvals and outstanding limits. For payments, verify that server-side access follows verified billing events, including duplicate events and changes in membership. No live charges until separately approved. |
| 14 — Public launch and installable PWA | Launch only the approved service on public hosting. Establish backups, monitoring, support and rollback; verify installation and updates on supported devices. | Record a deployment and restore/rollback check, browser/device results and who responds to failures. Public access and live billing are separate decisions. |
| 15 — Native iOS and Android evaluation | Decide whether demand justifies native apps with the same account and catalogue rules. | Document the decision, expected benefits and maintenance costs before implementation. |

Related: [Provider setup and limits](DATA_PROVIDERS.md) · [Product specification](PRODUCT_SPEC.md) · [Contribution guide](../CONTRIBUTING.md).
