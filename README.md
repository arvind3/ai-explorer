# AI Explorer

AI Explorer is a mobile-first discovery site for finding **free AI models** from OpenRouter.

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

## Quality gates (by design)

All future PRs are validated through automation:

1. `test.yml`: runs `npm ci` + `npm test` on push and pull request
2. `deploy-pages.yml`: validates Pages configuration before deployment
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