# Progress and asset audit

## Live catalogue reliability · 23 November 2026

- Confirmed live mode on the normal local server. One budgeted primary catalogue diagnostic returned HTTP 200 and 20 verified UK Netflix titles, taking the ledger from 58 to 59 of 450 requests. Historical provider failures were not recorded, so the initial trigger could not be confirmed.
- Fixed the browser's failure to retry a failed connection on reconnection. Separated connection and provider failures from a successful verification with no eligible titles. Earlier picks stay stored while verification is unavailable.
- Reviewed artwork terms. Movie of the Night does not grant rights to third-party posters. The cards retain branded placeholders and existing cleared images. See [artwork options and conditions](DATA_PROVIDERS.md).
- ESLint, TypeScript, production build and 22 tests passed using mocked provider responses. Browser coverage includes reconnect recovery, empty verified results, preservation of earlier data and a phone-width broken-image fallback.

## Phase 3 · Movie DNA 2.0

- The latest owner brief moved browser-local personalisation into Phase 3. Supabase accounts and cross-device data are deferred.
- Added the questionnaire, profile, deterministic ranking, personal predictions with a three-rating minimum, feedback and London calendar-week records with individual replacements.
- Reused the verified live catalogue and its budget. Country service metadata, explicitly submitted favourite searches and targeted weekly supplements all share the same 450-request rolling 31-day ceiling. See [Movie DNA implementation and scoring](MOVIE_DNA.md).
- Lint, TypeScript, production build and all 19 automated tests passed. Chrome and Edge covered desktop and mobile emulation. A Chrome browser test verified slot replacement, reload persistence and Monday rollover. Visually checked the desktop dashboard and iPhone-sized questionnaire. Tests used mocks and the demo catalogue without live provider calls.
- Remaining limits include physical Safari testing, live coverage beyond prior audited samples, per-season availability, third-party artwork clearance and an absence of verified storytelling, pacing and content metadata.

## Phase 2.2 · WatchQuest

- Verified GitHub `watchquest/main` at the approved Phase 2.1 checkpoint `5d2e294` before the rebrand.
- The local rebrand uses resized crops of the owner-approved WatchQuest Neon Cinematic Logo for the wordmark, shield, favicon and app icons. The supplied WatchQuest Neon Streaming Design Board is a private visual reference. Film art from the board was excluded. The existing cinematic banner and safe demo artwork remain in use.
- Weekly picks show current catalogue metadata and verified subscription offers when present, alongside save and watched controls. The dashboard uses existing watch activity and achievements. Numeric levels, XP, leaderboards and personalised ratings remain outside this phase.
- Existing route hashes, storage keys and title identifiers remain compatible. The free API cap and provider credentials were preserved.
- Lint, TypeScript, the production build and all nine tests passed. Chrome and Edge covered desktop, tablet, iPhone-sized and Android-sized layouts. The desktop and mobile previews were also reviewed visually. Physical iPhone Safari remains unverified.
- The recently watched panel can name titles in the currently loaded catalogue or the demo library. Out-of-catalogue history remains stored, and the dashboard does not make extra provider calls for it.

## Phase 2.1 · 23 November 2026

- Movie of the Night is the primary metadata and regional streaming provider. The previous audit verified a single UK Netflix request without TMDB and received 20 eligible titles. No additional live request was needed for these regression fixes.
- Clearing search or leaving Discover resets the submitted query. Cancelled searches cannot replace the current results. First Film recognises native provider IDs and retains the original watched list. Existing native IDs are resolved only when needed for the achievement.
- Updated the [provider guide](DATA_PROVIDERS.md) with the direct free-plan setup, the 450-request rolling 31-day cap, artwork restrictions and the Wikidata and TVmaze review. Added targeted credential ignores.
- Lint, TypeScript, the production build and all nine tests passed, including desktop and phone-width checks in Chrome and Edge.
- Outstanding checks remain for real mobile Safari, additional live markets and commercial artwork clearance. The WatchQuest rebrand and Phase 3 remain outside this checkpoint.

## Phase 2 · 20 November 2026

- Phase 1 approved. Added opt-in TMDB metadata and a Movie of the Night country-offer adapter. Search, weekly picks, Roll the Dice and Spin to Watch use the configured catalogue. Earlier saves, viewing history and profile settings retain their original browser keys.
- Streaming offers distinguish base subscriptions, rent, buy, paid channels and free viewing. Unsupported countries, upstream failures and absent provider data use explicit unknown or empty states.
- The default preview remains labelled demo mode. No real credentials were available in the project, so the integration was exercised with simulated upstream and browser API responses. Live metadata, artwork rights and service availability still need an owner-authorised check. See [provider setup and commercial decisions](DATA_PROVIDERS.md).
- Lint, TypeScript and production build passed. Browser tests passed on desktop and phone-sized Chrome and Edge, with a simulated configured-catalogue flow on Chrome. Physical iPhone Safari remains unverified.
- Phase 3 is awaiting approval.

## Phase 1 · 20 November 2026

Phase 0 approved. Git for Windows 2.56.1 became available and the initial documentation checkpoint is `8c58584`. Git checkpoint writes were authorised outside the restricted shell. Phase 1 was approved after checkpoint `2864cef`.

- Built the responsive React, TypeScript and Vite foundation with Home, Discover, My Watchlist, Community, Profile, Achievements and Premium. The mobile Profile page links to Achievements and Premium.
- Added a weekly demo pick list, search, genre filters, title details, saves, watched status, Roll the Dice and the equal-chance Spin to Watch wheel for unwatched weekly films. Guest onboarding stores display name, country and genre choices locally. Match scores and the discussion are fictional samples. Preferences and watched state are specific to this browser.
- `public/media/sg.png` and `public/media/icon.png` are unchanged copies of the supplied `SG-Logo-Transparent.png` and `SG-App-Icon.png`. The hero, posters and static mascot were generated for this prototype. The supplied boards guided the design and remain private. The static mascot is an illustration based on the concept board, with the full founder likeness and 3D work deferred.
- Phase-specific checks covered lint, TypeScript, production build and browser tests on desktop Chrome and Edge, including phone-sized Chromium emulation. Reviewed the desktop and mobile home pages visually in Chrome. A real iPhone running Safari remains unverified.
- Community posting, account synchronisation, streaming availability, purchases, avatar integration and installable PWA support remain in their later phases. No services or credentials were activated. The Phase 2 decisions are provider rights, initial countries and availability coverage.

## Phase 0 · 20 November 2026

Asset audit and documentation complete. The checkpoint was created at the start of Phase 1 after Git became available.

### Branding

All six images opened successfully. The written specification governs navigation, font choices and product scope where the boards differ.

| File in branding/ | Dimensions | Use |
| --- | --- | --- |
| SG-Logo.png | 345 × 137 | Approved blue and silver SG mark on dark background |
| SG-Logo-Transparent.png | 345 × 137 | Approved mark with an alpha channel |
| SG-Logo-Lockup.png | 379 × 214 | Full brand and slogan lock-up |
| SG-App-Icon.png | 126 × 122 | Approved icon reference. Larger square variants are needed for PWA installation. |
| Website-Design-Board.jpg | 1536 × 864 | Primary visual reference for the logo, palette, type and cinematic layout |
| Feature-Overview.jpg | 1536 × 1024 | Feature and mascot concept reference. Its clapperboard mark and alternate type and navigation treatments are superseded by the written brief and official SG files. |

The owner supplied the branding for this project. Separate rights documentation for embedded film art, portraits and third-party logos on the boards was absent. Keep the boards as private references and source licensed artwork separately. No standalone founder reference photograph was found.

### Character assets and commercial use

`source-assets/` contains 300 files (about 599 MiB): 144 FBX, 43 Blend, 35 glTF, 2 GLB, 18 BIN, 51 PNG, 1 JPG and 6 text files. It includes combined and individual exports, two similarly named humanoid rig folders, separate FBX clothing/body meshes and animations, a preview, and the two Universal Standard packs. All three Quaternius families have local CC0 1.0 notices and matching commercial-use evidence from the creator. [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/)

| Pack | Evidence and browser assessment |
| --- | --- |
| Ultimate Modular Males | Root `License.txt` and `How To Use.txt`. The 17 individual glTF 2.0 files each have 24 embedded clips, a 62-joint skeleton and four or five meshes. Every external resource reference resolves. `Casual_Hoodie.gltf` is about 3.1 MB and includes Idle, Idle_Neutral and Wave. Start the Phase 8 lab here. Test whether separately skinned parts can share a rig before allowing swaps. [Quaternius catalogue](https://quaternius.com/) |
| Universal Base Characters Standard | `License_Standard.txt`. Two superhero body glTFs with 65 joints and no embedded clips. Six hairstyle/facial-hair pieces and two eyebrow pieces each have rigged and unrigged glTF variants. Both body files reference missing `T_Eye_Normal_png.png`, and the male body also references missing `T_Hair_1_Normal_png.png`. Similarly named textures are present. Verify them before correcting references in derived exports. [Quaternius pack page](https://quaternius.com/packs/universalbasecharacters.html) |
| Universal Animation Library Standard | Pack `License.txt` and `README.txt`. Both GLB files contain 43 clips and each exceeds 7.6 MB. The male superhero and the non-root-motion GLB share all 65 joint names. Test rest poses, scale, hierarchy and clip playback before using them together. The modular hoodie uses a different rig. [Quaternius pack page](https://quaternius.com/packs/universalanimationlibrary.html) |

All 37 glTF/GLB JSON descriptions parsed as version 2.0. This establishes file-level browser candidates. Rendering, retargeting, clothing swaps, material changes and performance remain Phase 8 checks. Standalone FBX and Blend files are source material. Preserve originals and ship only trimmed web assets as needed.

### Local tools

- Node.js 26.13.1 and npm 11.20.0 run. VS Code, Chrome and Edge are present. PowerShell can use `npm.cmd`. npm's global listing reports a missing user prefix directory.
- No app, package manifest, lockfile or project dependencies were present. TypeScript, ESLint, Supabase CLI, Docker and GitHub CLI were absent from the command path. Python was only found as a Windows app alias. Blender and Unity were absent from the command path and are unnecessary for Phase 1.
- Git was absent from the command path and checked installation locations. No repository existed. A portable Git download attempt could not connect to GitHub from the restricted shell. A checkpoint requires an accessible Git executable and permission to write Git metadata.

### Costs, accounts and decisions

| Stage | No-spend route and dependencies |
| --- | --- |
| Phase 1 | Local React, TypeScript, Vite and CSS, branded shell, accessible navigation, guest-side UI and clearly marked demo states. No external accounts or keys needed. |
| Phases 2–5 | Prototype metadata and regional offers only under permitted terms. TMDB is a candidate for attributed non-commercial development and needs an account and server API credential. Its regional watch data requires JustWatch attribution and lacks full provider deep links. Assess channel entitlement detail, freshness and coverage before using it for recommendations. Deterministic Movie DNA, weekly picks, dice, wheel and basic search can run without paid AI. [TMDB FAQ](https://developer.themoviedb.org/docs/faq) · [Watch Providers](https://developer.themoviedb.org/reference/movie-watch-providers) |
| Phases 3–11 | Hosted authentication and sync require a Supabase account, project URL and publishable key. Privileged jobs may need a server-only key. Free tier can support early development within its quotas. Plan transactional email credentials for real registration/recovery delivery and OAuth credentials if Google or Apple login is enabled. Watchlists, reviews, community, statistics and achievements use application code and database capacity. The avatar lab can use the included CC0 assets and open-source browser tools. [Supabase pricing](https://supabase.com/pricing) · [Supabase email setup](https://supabase.com/docs/guides/auth/auth-smtp) |
| Source control and launch | GitHub account for remote backup/collaboration when requested. Hosting account and commercially permitted terms before deployment. Registrar account and ownership check if choosing the proposed domain. Confirm commercial catalogue and availability licences, operational email, backups and storage capacity before launch. The 1,000 monthly user target alone does not determine operating cost. |
| Optional later | An OpenAI account and server key only if AI features are approved. Billing and advertising provider accounts and credentials only if enabled after review. Apple or Google developer accounts if native distribution goes ahead. |

Outstanding decisions are logged for their owning phases: viewing markets and data rights (2/13), founder photograph and asset family (8/9), hosting/domain and commercial rights (13/14), and optional paid integrations (13 onward).

### Verification

- Reviewed the boards and logo variants visually, read the six asset text files, counted the asset inventory and checked every external resource path referenced by web-format models.
- Lint, TypeScript, automated application tests, production build, responsive browser checks and regressions are inapplicable in Phase 0 because the workspace has no application.
