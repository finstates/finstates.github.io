# FinStates

> Local-first professional workspace built around reusable XBRL Facts.

FinStates turns financial reports into long-lived, reusable XBRL Facts — structured data with full evidence, immutable versioning, and taxonomy fidelity — and uses them to complete fixed professional Tasks, starting with regulatory XBRL filings.

## Why FinStates

- **Facts first** — Every Fact carries its full XBRL coordinates (Concept, Entity, Period, Dimensions, Unit, accuracy, Taxonomy/DTS) plus source Evidence. You maintain Facts directly; Tasks reuse exact versions — no re-import, no re-parsing.
- **Immutable history** — All changes flow through Change Sets and become immutable Fact Revisions. Undo is a new reverse Change Set; history is never overwritten.
- **Local-first** — Your workspace lives on your device and works fully offline. Accounts, licenses, sync and compute credits never lock your local data, exports, or backups.
- **Traceable AI** — AI proposes tagging candidates only. Values, signs, periods, units, accuracy and dimensions are decided by code and parsing evidence, with fail-closed verification.
- **Controlled taxonomy** — Each filing regime binds a locked Taxonomy/DTS, validator and exporter. Regulatory taxonomies are read-only.

## Tasks

| Task | Users | Status |
|---|---|---|
| ACRA 2026 Simplified XBRL filing | Singapore accounting firms, accountants, company secretaries | In development |
| ESEF annual financial report | European issuers and advisors | Planned |
| Traceable multi-year financial research | Research, risk and due-diligence teams | Planned |
| Fundamental value analysis | Investors and equity research | Planned |

## Download

Signed desktop apps will be published on **GitHub Releases** — macOS first, Windows via Microsoft Store. *Coming soon.*

## Links

- Website: https://finstates.app
- Support and company information: https://finstates.app/support/
- Privacy notice: https://finstates.app/privacy/
- Website terms: https://finstates.app/terms/
- This repository hosts the public website (GitHub Pages) and release downloads; the application source code is private.
- License: commercial software — free for personal use, commercial use requires a license (details at launch).

## Company

FinStates is developed and operated by **Shenzhen Little Fish Cat Technology Co., Ltd.**, Shenzhen, Guangdong, China.

## Development and deployment

### Runtime

| Layer | Technology | Production |
|---|---|---|
| Website | React 18, TypeScript 5.7, Vite 6 | Static files on GitHub Pages |
| Toolchain | Node.js 22, pnpm 11.0.6 | GitHub Actions on Ubuntu |
| Registration API | Cloudflare Worker, Hono, D1, SMTP | `https://api.finstates.app/v1` |

The website contains no deploy-time secrets. Vite development builds call `https://api.dev.finstates.app/v1`; production builds must contain only `https://api.finstates.app/v1`. The platform API and D1 database are deployed independently from the private FinStates repository.

### Local checks

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm preview
```

`pnpm check` compiles every page and verifies the production API, custom domain, required routes and generated assets.

### Production deployment

Requirements: a clean `main` branch, committed changes, `git`, `curl`, `jq`, and an authenticated GitHub CLI with repository and Actions access.

```bash
pnpm deploy:dry-run
pnpm deploy -- --confirm DEPLOY_SITE
```

The deployment script:

1. validates the toolchain, repository, branch and clean worktree;
2. installs the frozen dependency graph and runs `pnpm check`;
3. rejects a local branch behind `origin/main`;
4. pushes an unpublished commit or dispatches the Pages workflow for the current commit;
5. waits for GitHub Actions and verifies the deployed asset, public routes and registration API contract.

GitHub Actions is the only production website deployment path. A normal push to `main` also triggers `.github/workflows/deploy.yml`. To withdraw a bad website release, revert its commit on `main` and run the same deployment command; do not overwrite a historical build.
