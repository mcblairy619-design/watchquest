# Stream Guide

**LESS SCROLLING. MORE WATCHING.**

Stream Guide is a film and television discovery prototype. Phase 1 runs locally with a fictional catalogue. Phase 2 requires the owner's approval.

- [Product specification](PRODUCT_SPEC.md)
- [Development roadmap](ROADMAP.md)
- [Progress and asset audit](PROGRESS.md)
- [Development instructions](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [Environment template](.env.example)

## Open the local website

Open PowerShell in the project folder and run `npm.cmd run dev`. Then open [Stream Guide on this computer](http://127.0.0.1:5173/) in your browser. Keep PowerShell open while you use the site. Press Ctrl+C when you want to stop it. On a fresh checkout, run `npm.cmd ci` once first.

Choose **Set up Movie DNA** or **Get started** to try guest onboarding. Saved titles, watch history and preferences are stored in the browser you use. To check the project, run `npm.cmd run lint`, `npm.cmd run check` and `npm.cmd run build`. Run `npm.cmd test` in a second terminal with the local server running to exercise installed Chrome and Edge.
