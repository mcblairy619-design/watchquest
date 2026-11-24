# Development instructions

Read and follow [CONTRIBUTIONS.md](CONTRIBUTIONS.md) before working in this repository. It defines scope, branch workflow, test expectations and handoff for humans and agents.

- Treat a request to inspect, assess or plan as read-only unless edits are explicitly requested. Confirm the branch and preserve other contributors' changes. Never edit `main` directly; do not push, open pull requests or merge without a maintainer's request.
- Keep Windows and Linux support. Use `.node-version` and the shared npm scripts; do not add Windows-only paths, Linux-only syntax or machine-specific setup to shared workflows. Report only the platforms actually verified.
- Do not edit these instructions, the contribution guide, approval gates or CI requirements unless that change is explicitly requested.
- Work one phase at a time in docs/ROADMAP.md. Stop for owner approval before starting the next phase. At each phase end report results, known issues and decisions in plain British English. Ask one focused question when an essential decision requires owner input.
- Inspect existing files and preserve functionality and user data. Use free tooling where practical. Obtain approval for paid services. Keep keys server-side, real environment files ignored and .env.example current.
- Use the supplied official WatchQuest mark and written brand requirements. Preserve originals. Keep raw assets, reference photographs and boards out of source control and deployments. Add only approved distributable assets with documented provenance.
- Never invent real-title metadata, scores or streaming availability. Label fixtures and disable unsupported claims. Check rights before integrating artwork or data and obtain commercial clearance before monetisation or public commercial launch.
- Keep provider integrations interchangeable. Prefer deterministic recommendations. Keep Blender, Unity and manual modelling out of the required workflow. Use original, licensed avatar assets and confirm compatibility in the lab.
- At each phase end run lint, TypeScript checks, relevant automated tests, the production build, mobile layout checks and regression checks where executable. Record outcomes and inapplicable checks. Maintain [README.md](README.md), the [product specification](docs/PRODUCT_SPEC.md), the [roadmap](docs/ROADMAP.md), [progress notes](docs/PROGRESS.md), and [CHANGELOG.md](CHANGELOG.md). Create a local Git checkpoint after successful verification. Keep incomplete and untested work visible.
