# Proposal

## Why

Women's college games are stored as `cbb`, the same league as men's college games, so their players and teams are mixed into the NCAA filters, the player leaderboards, and the top single-game performances. The app also assumes every college game is played in two halves, but women's college games use four quarters, so period labels and overtime detection would be wrong for them. The one women's game logged so far (LSU Women vs. Louisiana Tech Women, 2025-12-13) also has no per-period line scores at all.

## What Changes

- Add a women's college league, separate from men's college basketball, with its own label ("NCAA Women") everywhere leagues are shown or filtered. The men's college league is labeled "NCAA Men".
- The scraper classifies a Sports-Reference college box score as women's when its URL marks it as a women's game (`_w` before `.html`), and as men's otherwise.
- Women's college games use four quarters: periods are labeled Q1–Q4 then OT1, OT2…, and a game counts as overtime only with more than four periods.
- Fix line-score scraping for women's college box scores so per-quarter scores are stored.
- Migrate the one existing women's game to the new league, keeping its game ID so existing links still work.
- **BREAKING (data):** `sourceType` gains a new value. Code or scripts outside this repo that assume only `nba`, `wnba`, `cbb` would need updating; none are known.

## Capabilities

### New Capabilities

- `league-classification`: Which league a logged game belongs to, how that league's periods and overtime work, how it is labeled, and that stats are grouped and filtered by it.
- `boxscore-scraping`: Turning a supported box score page into a stored game record, including its league and per-period line scores.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- `src/types/index.ts`: new `SourceType` value.
- `server/scraper.ts`: league detection, line-score parsing, overtime detection.
- `src/services/leaderboards.ts` (`LeagueKey`, `leagueOf`, `LEAGUE_LABELS`), `src/services/statsCalculator.ts`, `server/storage.ts`: league mapping and labels.
- `src/components/GamesTable.tsx`, `GameBoxscoreView.tsx`, `PlayersLeaderboard.tsx`, `TeamsLeaderboard.tsx`: league filters, badges, and period labels.
- `scripts/build-media.ts`: use the stored league to pick ESPN's women's college logos and headshots.
- `data/games.json`: one record's `sourceType` and line scores updated.
- Overlaps `fix-source-link-and-season-filter` in `GameBoxscoreView.tsx` and `GamesTable.tsx`; whichever lands second needs a small merge.
