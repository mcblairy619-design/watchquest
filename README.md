# WatchQuest

**LESS SCROLLING. MORE WATCHING.**

**FIND • WATCH • RATE • LEVEL UP.**

WatchQuest is a film and television discovery prototype with a browser-local Movie DNA profile and weekly picks. It runs with a fictional catalogue until the owner enables permitted provider access. Phase 4 requires the owner's approval.

- [Product specification](PRODUCT_SPEC.md)
- [Development roadmap](ROADMAP.md)
- [Progress and asset audit](PROGRESS.md)
- [Development instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [Environment template](.env.example)
- [Data provider decisions and local setup](DATA_PROVIDERS.md)
- [Movie DNA, recommendations and weekly history](MOVIE_DNA.md)

## Open the local website

Open PowerShell in the project folder and run `npm.cmd run dev`. Then open [WatchQuest on this computer](http://127.0.0.1:5173/) in your browser. Keep PowerShell open while you use the site. Press Ctrl+C when you want to stop it. On a fresh checkout, run `npm.cmd ci` once first.

Open **Movie DNA** and choose **Retake questionnaire** to answer the nine steps, or **Edit Movie DNA** to jump to an answer from the review. Saved titles, watch history, ratings and preferences are stored in the browser you use. To check the project, run `npm.cmd run lint`, `npm.cmd run check` and `npm.cmd run build`. Run `npm.cmd test` in a second terminal with a local demo server running to exercise installed Chrome and Edge. For a test run without provider calls, set `$env:AVAILABILITY_FREE_PLAN='no'` and `$env:CATALOGUE_USE='disabled'` in the terminal that starts the dev server.
