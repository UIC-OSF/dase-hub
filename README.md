# DASE Hub

The central dashboard for the UIC Digital Accessibility team's projects — one place to track projects, data, and progress, driven by an agreed roadmap rather than ad hoc messages.

---

## Table of Contents

- [What is DASE Hub?](#what-is-dase-hub)
- [How it works](#how-it-works)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [AWS Lambda Deployment](#aws-lambda-deployment)
- [Tech Stack](#tech-stack)
- [Ownership](#ownership)

---

## What is DASE Hub?

DASE Hub channels incoming requests and feedback into a single, tracked backlog so the dashboard is driven by an agreed roadmap. It surfaces data and progress across the team's projects (Equalify, AI Leaders, the Open Source Fund, and more), with coverage rolling out in phases.

Equalify itself lives on the [Equalify Hub](https://equalify.uic.edu); DASE Hub links out to it rather than hosting those product pages.

## How it works

- **Single backlog** — feature, data, and fix requests are logged as tracked issues; requests raised in chat get converted into issues so nothing is lost.
- **One source of truth** — the backlog, not individual messages, is the record of what's requested and where it stands.
- **Regular check-ins** — weekly during active buildout, shifting to monthly at steady state. New requests are reviewed and prioritized against the roadmap.
- **Updates on releases** — a short progress update goes out on each meaningful update or release.

See the [About page](https://equalify.uic.edu/about) for the full roadmap (it's also rendered from this app at `/about`).

---

## Local Development

This project uses [pnpm](https://pnpm.io/).

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment** (optional — sensible defaults are built in)
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```

3. **Start the dev server**
   ```bash
   pnpm start
   ```
   This builds Tailwind CSS and starts a local server at http://localhost:3000 with `tsx`.

---

## Configuration

All configuration is environment-driven (see [`utils/config.ts`](utils/config.ts) and [`.env.example`](.env.example)):

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_NAME` | `DASE Hub` | Display name shown in the header, footer, and page titles. |
| `SITE_URL` | _(empty)_ | Public URL of the deployment (CloudFront / Lambda Function URL). Used for absolute links in `robots.txt`, the sitemap, and `security.txt`. |
| `GITHUB_ORG` | `EqualifyEverything` | GitHub org for the repo browser and "View on GitHub" links. |
| `DOCS_REPO` | `EqualifyEverything/equalify-docs` | `owner/name` of the repo backing the Updates/Reports content. Point at a DASE-owned docs repo when one exists. |
| `EQUALIFY_HUB_URL` | `https://equalify.uic.edu` | Equalify Hub site, used for link-outs and the `/dashboard` & `/reflow` redirects. |
| `EQUALIFY_APP_URL` | `https://app.equalify.uic.edu` | Equalify application, used as the default favicon source. |
| `FAVICON_URL` | `{EQUALIFY_APP_URL}/favicon.ico` | Custom favicon URL. |
| `ORG_LOGO_URL` | inline UIC logo | Custom logo URL. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | _(empty)_ | GitHub OAuth credentials for the repo-browser sign-in. |

---

## AWS Lambda Deployment

The app runs as a single AWS Lambda function fronted by a CloudFront distribution or a Lambda Function URL.

### Required resources

- **Lambda function** named `dase-hub` (Node.js 18+ runtime).
- **DynamoDB table** named `dase-hub` in `us-east-2`, with:
  - Partition key `pk` (String), sort key `sk` (String)
  - TTL enabled on the `ttl` attribute (used to expire the GitHub response cache)
- **A public entry point** — a CloudFront distribution or a Lambda Function URL.

The table is a single-table design holding several entity types (`GHCACHE`, `USER`, `VIEW`, `SEARCH`, `FEATURE`, `WAITLIST`), all keyed by `pk`/`sk`.

### Deploy

The deploy script uses the `equalifyuic` AWS CLI profile. Update the `--profile` in [`package.json`](package.json) if you use a different one.

```bash
# Authenticate with AWS
pnpm sso

# Build CSS, bundle with esbuild, and update the Lambda function code
pnpm build
```

---

## Tech Stack

- **TypeScript** — type-safe development
- **Hono** — lightweight web framework (with JSX)
- **AWS Lambda** — serverless deployment
- **DynamoDB** — single-table storage for views, feature requests, the signup list, and a GitHub response cache
- **Tailwind CSS** — styling
- **esbuild** — fast bundling

---

## Ownership

Maintained by the UIC Digital Accessibility team.

- **Responsible — Chris:** builds and maintains the dashboard, triages requests, maintains the roadmap.
- **Accountable — Blake:** sets direction and priorities, approves the roadmap.
- **Consulted — Jemma & Stefin:** advise on scope, priorities, and meeting cadence.
- **Informed — Helen & Trey:** kept up to date on progress and releases.

---

## License

MIT License – see [LICENSE](LICENSE) for details.
