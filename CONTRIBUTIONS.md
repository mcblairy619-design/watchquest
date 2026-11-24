# Contributing to WatchQuest

These rules apply to both human contributors and coding agents. The goal is to keep changes small, reviewable and safe for the people developing on Windows and Linux.

## Before changing anything

- Read [AGENTS.md](AGENTS.md), the [roadmap](docs/ROADMAP.md) and the relevant feature documentation. Check `git status --short --branch` and inspect the existing implementation. Preserve changes you did not make.
- Work on the assigned branch. If none was assigned, create a short-lived branch from up-to-date `main` before editing. Do not modify `main` directly. Do not push, open a pull request or merge unless asked by a maintainer; never force-push shared branches.
- Treat the request as the scope. An investigation or review is read-only unless edits are requested. Do not bundle unrelated refactors, dependency upgrades or formatting churn. If the work needs an owner decision or crosses into a new roadmap phase, stop and ask one focused question.
- Do not change `AGENTS.md`, this guide, roadmap approval requirements or CI checks as part of unrelated work. Changes to those rules must be explicitly requested and visible in review.

## Make the smallest safe change

- Prefer the existing feature layout. Browser catalogue code belongs in `src/catalogue/`, recommendation and questionnaire code in `src/movie-dna/`, and provider access and quota handling in `server/`.
- Preserve existing browser data, including saved and watched titles, ratings, preferences and weekly picks. If a storage key or data shape must change, keep old data readable and add a regression test. Never clear user data as a workaround.
- Keep fictional demo titles separate from provider data and keep synthetic provider responses in test fixtures. Do not add real credentials, make live API calls in routine tests, invent real-title metadata or enable unapproved artwork or paid services.
- Add or update focused regression tests for behaviour changes. Keep browser tests independent; use the existing harness and scenario-local state. Keep Windows and Linux support: use the Node version in [`.node-version`](.node-version), install with `npm ci` on each machine and avoid hard-coded executable paths or platform-specific syntax in shared npm scripts.

## Verify and hand off

1. For code changes, run `npm run lint`, `npm run check`, `npm test` and `npm run build`. Run `npm run test:setup` first if the Playwright browser is missing. For UI changes, check desktop and phone-sized layouts. For documentation-only changes, check the links and `git diff --check`.
2. Review the final diff and report what changed, how to reproduce or verify it, and what was skipped. Report the OS and actual test results. A local Linux pass is not a Windows pass.
3. Keep documentation and the changelog in sync where the change affects contributors or users. For an approved checkpoint, stage only in-scope files and use a descriptive local commit. Leave the branch and commit ID in the handoff.
4. Use a pull request for changes headed to `main`. Require maintainer review and passing Windows and Ubuntu CI before merging. An agent's own summary is not a substitute for review or CI.
