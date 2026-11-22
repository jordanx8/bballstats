# Tasks

## 1. League model

- [x] 1.1 Add `wcbb` to `SourceType` in `src/types/index.ts` and drop the unused `sports-reference` value if nothing reads it; verify `npm run build` passes
- [x] 1.2 Add a period-format helper in `src/services/` (regulation periods and label prefix per `sourceType`: `cbb` → 2/`H`, others → 4/`Q`), and verify by calling it from a short `npx tsx -e` check for each league
- [x] 1.3 In `src/services/leaderboards.ts`, split `LeagueKey` into `ncaam` and `ncaaw`, map `wcbb` → `ncaaw` in `leagueOf()`, and set `LEAGUE_LABELS` to "NCAA Men" / "NCAA Women"; verify `npm run build` passes and fix any type errors it surfaces in `details.ts` and the leaderboard components

## 2. Scraper

- [x] 2.1 With the user's OK to download it, save the existing women's box score page (`…/2025-12-13-18-louisiana-state_w.html`) as a fixture under `server/fixtures/`, plus one men's college page for comparison
- [x] 2.2 In `server/scraper.ts`, classify `/cbb/` URLs ending in `_w.html` as `wcbb`, build college IDs from the `/cbb/` path so women's IDs keep the `cbb-` prefix, and use the period helper for `isOvertime`; verify with a `npx tsx` script that parses both fixtures and prints `sourceType`, `id`, and `isOvertime`
- [x] 2.3 Confirm the parser stores per-period scores when the page has them and falls back to the total otherwise; verify with the same script that the women's fixture gives `[61]` / `[87]` and the men's fixture still gives two halves
- [x] 2.5 Append " Women" to both team names for `wcbb` games in `server/scraper.ts` (unless already present); verify with the same script that the women's fixture gives "Louisiana Tech Women" and "LSU Women" and the men's fixture's names are unchanged
- [x] 2.4 In `scripts/build-media.ts`, pick ESPN's women's college group from `sourceType === 'wcbb'` instead of matching "Women" in team names; verify `npm run build-media` still resolves the LSU Women logo

## 3. UI and stats labels

- [x] 3.1 In `GameBoxscoreView.tsx`, use the period helper for line-score labels and show "NCAA Women" / "NCAA Men" in the header; verify in `npm run dev` that a men's game shows H1/H2 and the women's game shows Q1–Q4
- [x] 3.2 In `GamesTable.tsx`, add an "NCAA Women" league filter option and badge style, and relabel the men's option "NCAA Men"; verify in `npm run dev` that filtering to each shows only that league's games
- [x] 3.3 Update the league labels in `src/services/statsCalculator.ts` and `server/storage.ts` to cover `wcbb`; verify `npm run build` passes
- [x] 3.4 In `npm run dev`, filter the players and teams leaderboards to NCAA Men and NCAA Women and verify no women's players or teams appear under NCAA Men, and the Seasons page lists both leagues separately for 2025

## 4. Data migration

- [x] 4.1 Change the existing women's game's `sourceType` from `cbb` to `wcbb` in `data/games.json`; verify with `git diff data/games.json` that only that one field changed and `#/games/cbb-2025-12-13-18-louisiana-state_w` still opens

## 5. Final check

- [x] 5.1 Run `grep -rn "'cbb'" src server scripts` and verify each remaining match intentionally means men's college only; then run `npm run build` and verify it passes
