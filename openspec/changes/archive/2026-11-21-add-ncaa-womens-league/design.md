# Design

## Context

`sourceType` (`nba` | `wnba` | `cbb`, plus an unused `sports-reference`) is the stored league field. It is read in about 60 places across 10 files. Most UI and stats code goes through `leagueOf()` in `src/services/leaderboards.ts`, which collapses everything that isn't NBA or WNBA into one `ncaa` key. The rest compares `sourceType === 'cbb'` directly, either to mean "college" (badges, labels) or to mean "two halves" (period labels, overtime). Game IDs are built as `${sourceType}-${fileName}`, and saving dedupes on ID or source URL (`server/storage.ts`). See proposal.md (Why).

## Goals / Non-Goals

**Goals:**
- Make NCAA Women a first-class league wherever leagues appear.
- Make period format a property of the league, not of "is college".

**Non-Goals:**
- Linking the same school's men's and women's teams.
- Re-scraping existing WNBA games: the shared overtime helper also fixes WNBA overtime detection (never set before) for future scrapes, but stored WNBA games keep their current `isOvertime`.
- Supporting women's sources other than Sports-Reference.

## Decisions

### Store the league as a new `sourceType` value, `wcbb`
Add `wcbb` to `SourceType`, set by the scraper, and migrate the one existing record. `cbb` keeps meaning men's college, so the 65 existing men's games need no change.

Alternatives considered:
- **Derive women's at read time from the `_w` URL suffix.** No data change, but every one of the ~60 checks would need the URL as well as `sourceType`, and the stored field would keep lying. Rejected.
- **Add a separate `gender` field.** Cleaner in theory, but every league check becomes two checks, and nothing else needs gender. Rejected.

### Split `LeagueKey` into `ncaam` and `ncaaw`
`LeagueKey` becomes `'nba' | 'wnba' | 'ncaam' | 'ncaaw'`, with `LEAGUE_LABELS` "NCAA Men" and "NCAA Women". Filters that loop over `LEAGUE_LABELS` (players, teams) pick up the new option for free. The games journal's hard-coded `<option value="cbb">` gets a sibling for `wcbb`, and its badge colors gain a women's college style.

### One helper for period format
Add a small helper (in `src/services/`, also usable by the scraper) that returns a league's regulation period count and period prefix: `cbb` → 2 / `H`, everything else → 4 / `Q`. `GameBoxscoreView.lineLabel` and the scraper's `isOvertime` both use it, replacing their inline `=== 'cbb'` checks. Every other `=== 'cbb'` that means "college" becomes "is `cbb` or `wcbb`".

### Keep the `cbb-` ID prefix for women's games
The scraper builds college IDs from the URL path (`/cbb/`) rather than from `sourceType`, so women's games keep `cbb-…_w` IDs. Existing links keep working, and re-scraping still dedupes on ID.

### Line scores: store periods only when the page has them
The saved women's page (`server/fixtures/`) turned out to list only final scores in its line score, so there are no quarters to recover. The existing parser already stores per-period scores when present and falls back to the total otherwise, so no parser change is needed. The migrated game keeps its single-total line score.

### Append " Women" to women's college team names in the scraper
Sports-Reference names women's teams like the men's ("LSU"). The existing game reads "LSU Women" only because it was edited by hand. Team stats and team pages are keyed by name, so without a suffix a women's game would merge into the men's team. The scraper appends " Women" (unless already present) for `wcbb` games, matching the existing data.

Alternative considered: **plain names, rely on league filters.** Rejected: team pages and per-team records would still mix men's and women's games.

### Migrate the existing game by editing its league field
Since re-scraping would gain no line-score data, the one record is migrated by changing `sourceType` from `cbb` to `wcbb` directly. Its ID, team names, notes, and `submittedAt` stay as they are.

## Risks / Trade-offs

- [A `=== 'cbb'` check is missed and women's games quietly behave like men's] → The tasks list every file from the audit, and a final `grep` for `'cbb'` confirms each remaining use is intentional.
- [Future women's games from Sports-Reference may also lack quarter scores] → They show a single total, the same as today; nothing to fix on our side.
- [Sports-Reference rate-limits or blocks the fetch] → Fixture saved once; the parser fix is tested against the fixture, not live.
- [Merge overlap with `fix-source-link-and-season-filter` in `GameBoxscoreView.tsx` and `GamesTable.tsx`] → Small, separate lines; resolve when the second change lands.

## Migration Plan

1. Ship the code that understands `wcbb`.
2. Change the one record's `sourceType` from `cbb` to `wcbb`.
3. Rollback: set the record back to `cbb` and revert the code; no other data is touched.
