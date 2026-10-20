# Sleepy Updates

**The day in tech, summarized before bed.**

Sleepy Updates is a nightly technology and cybersecurity news digest. It collects recent stories from a curated set of RSS feeds, selects the most important coverage, and uses an LLM to turn it into a readable end-of-day briefing. Published digests are stored in a PostgreSQL database and displayed on a small Next.js website with an archive and individual article pages.

**Live site:** https://sleepy-updates.vercel.app/

## What it does

- **Collects recent stories** from technology and cybersecurity RSS feeds, including The Verge, TechCrunch, Ars Technica, WIRED, MIT Technology Review, Hacker News, BleepingComputer, Krebs on Security, and others.
- **Filters and deduplicates coverage** to focus on recent items and avoid showing the same article more than once.
- **Selects and summarizes stories with an LLM**, aiming for a balanced, useful digest rather than a raw feed reader.
- **Has a fallback path** that can publish source-based story excerpts when AI summarization fails.
- **Stores daily posts** in Neon Postgres so previously published digests remain available.
- **Displays a homepage and archive**, with a dedicated page for each digest.
- **Includes sharing and search metadata**, such as canonical URLs, Open Graph/Twitter metadata, NewsArticle structured data, and a sitemap.
- **Publishes through a scheduled Vercel Cron endpoint** protected by a bearer secret.

## Tech stack

- [Next.js](https://nextjs.org/) 15 — App Router and server-rendered pages
- [React](https://react.dev/) 19
- [Neon](https://neon.tech/) serverless Postgres — persistent digest storage
- [ElectronHub](https://electronhub.ai/) chat completions API — model access
- [rss-parser](https://www.npmjs.com/package/rss-parser) — RSS ingestion
- [marked](https://marked.js.org/) — Markdown rendering
- [Vercel](https://vercel.com/) — deployment, scheduled cron, and analytics

## How the pipeline works

1. Vercel calls `/api/cron/digest` on the configured schedule.
2. The route checks the `CRON_SECRET` bearer token and skips the run if a digest for the current India Standard Time date already exists (unless forced).
3. `lib/digest.js` fetches the configured RSS feeds concurrently, keeps recent stories, validates URLs, removes duplicate links, and limits the working set.
4. The editor model chooses a shortlist; the writer model drafts the digest. If either AI stage fails, the code attempts a simpler source-based fallback.
5. The route checks the generated title/body, saves the digest to Postgres, and revalidates the affected pages.
6. The homepage, archive, and `/posts/YYYY-MM-DD` pages read published posts from the database.

Feed contents and model output are external/untrusted inputs. The project includes defensive prompt instructions and rendering safeguards, but these should be treated as layers of risk reduction—not a guarantee that every possible malicious or malformed input is harmless.

## Getting started locally

### Requirements

- Node.js compatible with your installed Next.js version
- npm
- A Neon/Postgres database
- An ElectronHub API key for AI-generated summaries

### 1. Clone and install

```bash
git clone https://github.com/mukund-vish/Sleepy-Updates.git
cd Sleepy-Updates
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```dotenv
DATABASE_URL=your_neon_postgres_connection_string
CRON_SECRET=replace_with_a_long_random_secret
ELECTRONHUB_API_KEY=your_electronhub_api_key

# Optional: one model or a comma-separated fallback list
ELECTRONHUB_MODEL=mistral-small-3.2-24b-instruct:free

# Optional: canonical public origin for metadata and sitemap
SITE_URL=http://localhost:3000
```

- `DATABASE_URL` is used by the Neon serverless client. The app creates the `posts` table on first database access.
- `CRON_SECRET` protects the scheduled publishing endpoint. Use a long, random value and keep it private.
- `ELECTRONHUB_API_KEY` authenticates requests to the chat completions API.
- `ELECTRONHUB_MODEL` is optional; it can contain a comma-separated list of models to try in order.
- `SITE_URL` is optional. Set it to the public origin in production if you need to override the Vercel-derived URL.

Do not commit `.env.local` or real credentials to source control.

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000.

### 4. Build and run in production mode

```bash
npm run build
npm run start
```

## Project layout

```text
app/
  page.js                    Homepage and latest/older digests
  archive/page.js            Date-grouped digest archive
  posts/[date]/page.js       Individual digest and metadata
  api/cron/digest/route.js   Protected scheduled publishing endpoint
  sitemap.js                 Dynamic sitemap
lib/
  db.js                      Neon database queries and schema setup
  digest.js                  RSS collection, selection, writing, fallback
  post.js                    Digest parsing/presentation helpers
  site.js                    Site constants and structured-data helper
  sources.js                 Curated RSS feed configuration
vercel.json                  Vercel Cron schedule
```

## RSS sources

The feed list is maintained in `lib/sources.js`. Each entry defines a source name, topic, website, and RSS URL. Add or remove sources there.

The collector currently considers items from roughly the previous 24 hours, limits the number collected from each feed, removes duplicate article links, and caps the overall working set. RSS feeds can be unavailable or change format, so a run may contain fewer stories than usual.

## Scheduled publishing

The cron configuration lives in `vercel.json`. The current schedule is `30 15 * * *` (15:30 UTC daily). The post date is determined using **Asia/Kolkata (IST)**; verify that the configured UTC time matches your intended publication time and your Vercel plan's cron capabilities.

The endpoint is:

```text
GET /api/cron/digest
Authorization: Bearer <CRON_SECRET>
```

The route returns an unauthorized response if the secret is missing or incorrect. It normally skips publishing if today's post already exists. A `?force=1` query parameter bypasses that duplicate-date skip, so use it carefully: it can replace the stored post for that date.

For a manual local request, with the development server running:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/digest
```

## Database

The application creates a `posts` table automatically when it first accesses the database. Each post is keyed by its date and stores its title, Markdown body, and creation timestamp. Re-running a digest for an existing date updates that date's stored post.

The database connection string must be configured in `DATABASE_URL`. Keep production credentials private and use a separate database for local development if you want to avoid changing production content.

## Deployment

The app is designed for Vercel.

1. Import the GitHub repository into Vercel.
2. Configure `DATABASE_URL`, `CRON_SECRET`, and `ELECTRONHUB_API_KEY` in the project's environment settings. Configure `ELECTRONHUB_MODEL` and `SITE_URL` if needed.
3. Confirm the cron schedule in `vercel.json` and that scheduled functions are supported by your plan.
4. Deploy and verify the homepage, archive, an individual post, database connectivity, and cron execution in the function logs.

A successful website deployment does not by itself confirm that scheduled publishing works; the database credentials, model API, cron configuration, and secret must all be correct.

## Troubleshooting

- **No digests appear:** Check the database connection and whether a post has been published for the current IST date.
- **Cron returns `401 Unauthorized`:** Confirm the request uses `Authorization: Bearer <CRON_SECRET>` and that the secret matches the deployment environment.
- **Cron reports too few feed items:** Check the RSS URLs in `lib/sources.js` and the server logs. Individual feeds may be down or may not have recent items.
- **AI generation fails:** Check `ELECTRONHUB_API_KEY`, the configured model name(s), provider availability, and function logs. The fallback may still publish a simpler digest if enough source material is available.
- **Local pages cannot read posts:** Confirm `DATABASE_URL` is set and points to a reachable Neon/Postgres database.

## Contributing

1. Create a branch for your change.
2. Keep feed configuration in `lib/sources.js` and digest pipeline logic in `lib/digest.js`.
3. Run `npm run build` before opening a pull request.
4. Do not commit secrets, production database contents, or generated credentials.

There is currently no test or lint script defined in `package.json`.

## License

No license file is currently included in the repository. Unless a license is added, the project should not be assumed to be available for unrestricted reuse.
