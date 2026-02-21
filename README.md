# AI Explorer

AI Explorer is a mobile-first discovery site for finding **free AI models** from OpenRouter.

---

## Awareness Pages — Start Here

> **Sharing this project?** Send the Executive Summary link — it tells the full story in 2 minutes and links to all other pages from its navigation bar.

### Executive Summary (primary shareable link)

**[https://arvind3.github.io/ai-explorer/docs/executive.html](https://arvind3.github.io/ai-explorer/docs/executive.html)**

The executive page covers:
- The market opportunity — why free AI access matters at scale
- What AI Explorer does and who it is for
- Strategic value and platform potential
- The founder's vision in their own words
- Navigation bar at the top links to all other pages

### All Awareness Pages

| Page | Link | Best for |
|------|------|----------|
| **Hub** | [/docs/](https://arvind3.github.io/ai-explorer/docs/) | Anyone — overview with links to all perspectives |
| **Executive** | [/docs/executive.html](https://arvind3.github.io/ai-explorer/docs/executive.html) | C-suite, investors, leadership, partners |
| **Product** | [/docs/product.html](https://arvind3.github.io/ai-explorer/docs/product.html) | Product managers, end users, stakeholders |
| **Engineering** | [/docs/engineering.html](https://arvind3.github.io/ai-explorer/docs/engineering.html) | Developers, architects, technical reviewers |
| **Capability** | [/docs/capability.html](https://arvind3.github.io/ai-explorer/docs/capability.html) | Business strategists, partners, enterprise teams |

Each page is self-contained with a top navigation bar that links to all others — a user who lands on the Executive page can navigate directly to Engineering or Product without needing to come back here.

---

## What it does

- Fetches live model data from `https://openrouter.ai/api/v1/models`
- Filters to free models only
- Shows provider, context window, difficulty, and practical use cases
- Supports category filtering (Writing, Coding, Learning, Business, Creative)

## Local development

```bash
npm install
npm test
```

## GitHub Pages deployment

This repository deploys from GitHub Actions using `.github/workflows/deploy-pages.yml`.

One-time repository setup is still required:

1. Open **Settings -> Pages**
2. Set **Source** to **GitHub Actions**
3. Rerun the **Deploy static content to Pages** workflow

If this setup is missing, deploy preflight now fails with a direct error message instead of a vague workflow failure.

If the Pages UI is not visible in your account, you can enable Pages by API:

```bash
curl -L -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/arvind3/ai-explorer/pages \
  -d '{"build_type":"workflow"}'
```

You can also set repository secret `PAGES_ENABLEMENT_TOKEN` (admin token) and the deploy workflow will attempt API enablement automatically.

## Quality gates (by design)

All future PRs are validated through automation:

1. `test.yml`: runs `npm ci` + `npm test` on push and pull request
2. `deploy-pages.yml`: optionally enables Pages via API (if `PAGES_ENABLEMENT_TOKEN` exists), then validates config
3. `live-smoke.yml`: verifies the deployed URL responds with expected page markers after a successful deploy

You can also run the live smoke check manually:

```bash
npm run test:live
```

Set a custom URL if needed:

```bash
LIVE_URL=https://example.com/ npm run test:live
```

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- Node test runner (`node:test`)
- jsdom for DOM-level tests
- GitHub Actions + GitHub Pages

---

*Built by [Arvind Bhardwaj](https://www.linkedin.com/in/arvindkumarbhardwaj/) · Helping developers unlock the power of AI — for free.*
