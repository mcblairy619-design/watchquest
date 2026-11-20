# Progress and asset audit

## Phase 0 · 20 November 2026

Asset audit and documentation complete. The local Git checkpoint is pending. Phase 1 is awaiting owner approval.

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
- Phase 1 may start after owner approval. Keep the Git checkpoint visible as pending until a commit exists.
