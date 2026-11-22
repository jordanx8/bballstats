# Design

## Context

Game records carry a `sourceType` field (`nba`, `wnba`, `cbb`) that the app uses as the game's league: it drives quarter vs. half line-score labels, overtime detection, and the league filters. The box score's source button is the only place that also treats it as "which website", which is why hand-added ESPN and lsusports.net games are mislabeled. See proposal.md (Why).

Notes are saved through `updateGame()` in `src/services/api.ts`, which sends a PUT to the local Express server and, if that fails, silently edits the in-memory copy. The deployed site has no server, so every save there takes the silent path. All data changes on the deployed site already go through manually run Actions (`scrape-and-deploy.yml`, `remove-game.yml`), each running a script in `scripts/`, committing `data/games.json` with `[skip ci]`, then building and deploying.

## Goals / Non-Goals

**Goals:**
- Name the source site from the link that is actually stored.
- Keep `sourceType` meaning only "league".

**Non-Goals:**
- Changing stored game data, the scraper, or the GitHub Actions.
- Supporting scraping from ESPN or school sites.
- Saving notes directly from the deployed site (that would need a GitHub token in the browser).
- Multi-line notes: Action text inputs are single-line in GitHub's form.
- Updating fields other than notes through the new Action.

## Decisions

### Derive the site name from the URL's domain
A small pure helper in `src/services/` takes a URL and returns a display name: it parses the host, matches it against a short list of known domains (by exact match or subdomain suffix), and otherwise returns the host with a leading `www.` stripped. If parsing fails, it returns `null` and the button reads "View source".

Alternatives considered:
- **Store a `sourceName` on each game.** Gives exact control over the text, but needs a data backfill and has to be set by the scraper, the import scripts, and any hand-added game. Rejected for a label that can be worked out from data already stored.
- **Split `sourceType` into league and source fields.** Fixes the double meaning at the root, but touches types, the scraper, stats, and filters for one button. Rejected as too large for the problem.

### Fix the season filter by adding it to the refresh dependencies
The filtered list in `GamesTable.tsx` is memoized on `games`, `search`, `leagueFilter`, and `sortBy`, but not `seasonFilter`, so a season-only change reuses the stale result. Adding `seasonFilter` to that dependency list is the whole fix.

### Update notes with a new Action modeled on Remove Game
Add `.github/workflows/update-notes.yml` ("Update Game Notes & Deploy") with inputs `target` (game ID or source URL, required), `notes` (string, optional), and `clear` (boolean, default false). It runs `scripts/update-notes.ts`, commits `data/games.json` if it changed, then builds and deploys with the same steps and `pages` concurrency group as the existing workflows. The script also gets an `npm run update-notes` entry for local use.

Alternatives considered:
- **Fold notes into the scrape workflow** (re-run with the same URL). Re-scraping to change a note is slow, depends on the source site being up, and could overwrite corrected data. Rejected.
- **Make the editor open the Action page with fields filled in.** GitHub can't pre-fill `workflow_dispatch` inputs from a URL, so the page shows the game ID to copy instead.

### Pass inputs to the script through environment variables only
Free-text notes can contain quotes, `$`, and backticks. The existing workflows write `${{ github.event.inputs.* }}` straight into `run:` commands and commit messages, which lets that text be run by the shell. The new workflow sets `TARGET`, `NOTES`, and `CLEAR` under `env:`, the script reads them from `process.env`, and the commit message uses the game ID printed by the script rather than the raw input.

### Exact matching only
`delete-game.ts` falls back to "ID contains the text", which could hit the wrong game. The notes script matches only an exact ID or exact source URL (case-insensitive) and exits non-zero otherwise, listing nothing changed.

### Hide the editor when nothing can save it
`api.ts` gains a way to tell whether the local server is reachable (the result of the existing `/api/games` request already shows this). `GameBoxscoreView` shows the current editor only in that case. Otherwise it shows the notes read-only, the game ID with a copy button, and an "Edit on GitHub" link to `https://github.com/jordanx8/bballstats/actions/workflows/update-notes.yml`, kept as one constant in `src/services/`.

## Risks / Trade-offs

- [A new hand-added site shows a raw domain rather than a friendly name] → Acceptable by decision; add an entry to the known-domains list if a nicer name is wanted.
- [Notes updated by the Action take a few minutes to appear, while the build and deploy run] → Same delay as adding a game today; the box score link says the change appears after the Action finishes.
- [The repository URL is hard-coded] → One constant; update it if the repo is renamed or forked.
- [Existing workflows still interpolate inputs into shell commands] → Out of scope here; worth fixing in `remove-game.yml` and the scrape workflows separately.
- [No automated test framework in the project] → Verify with `npm run build` (type check) and by checking the affected pages in the dev server.
