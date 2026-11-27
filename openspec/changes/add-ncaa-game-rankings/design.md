# Design

## Context

NCAA games come from Sports-Reference, whose box scores have no poll rankings. `scripts/build-media.ts` already finds each game's ESPN event by date and final score: it reads the ESPN scoreboard for the game date, then the day before and after, and for college it uses the D-I group (`groups=50&limit=400`). Each ESPN competitor carries `curatedRank.current`, the team's AP rank on that date, where `99` means unranked. Spot checks showed Tennessee #9 on 2023-01-21, Kentucky #17 on 2024-02-21, and both teams unranked on 2026-01-14.

Games get saved in three places: the GitHub Actions (`scrape-game.ts`, `import-games.ts`), the local Express server (`server/index.ts`), and `addGame` in `server/storage.ts`. That one shared function replaces the whole record when a game is re-scraped.

## Goals / Non-Goals

**Goals:**
- One ESPN event-matching routine shared by `build-media`, the add-game flow, and the backfill.
- Ranks survive re-scraping, because the add flow looks them up again.

**Non-Goals:**
- Showing ranks anywhere besides the games list and box score header (team pages, leaderboards, "record vs ranked" stats). Later changes can build on the stored data.
- Coaches poll, NET, or any ranking other than ESPN's AP rank.
- Changing how `build-media` stores logos and headshots.

## Decisions

**Store `rank?: number` on `TeamGameData`, only when 1-25.** ESPN's `99` and a missing `curatedRank` both mean "no rank" and are stored as an absent field, so the UI only needs to check whether `rank` exists. *Alternative:* store `99` or `null`. Rejected: that leaks ESPN's sentinel into the data and gives the UI two "unranked" values to handle.

**Mark a successful match with a game-level `espnEventId`.** When the lookup finds the ESPN event, the game stores its ID. The backfill skips games that have it unless `--force` is passed, and games without it get retried, which is cheap because few games fail to match. It also lets later features fetch more from ESPN without matching again. *Alternative:* a `processedGames` list in a separate file, the way `media.json` does it. Rejected: rank is a fact about the game, and the marker should travel with the record.

**Extract matching into `server/espn.ts`.** It holds `findEspnEvent(game)` (scoreboard cache, retries, ±1 day, league → sport mapping, moved from `build-media.ts`) and `lookupRanks(game) → { home?, away?, eventId } | null`. `build-media.ts` imports `findEspnEvent` and its behavior doesn't change. *Alternative:* copy the matching code. Rejected: two copies would drift apart, and the matching rules (date offsets, women's fallback) are subtle.

**Look up ranks in the callers, before `addGame`.** `scrape-game.ts`, `import-games.ts`, and the server's add and bulk routes call `lookupRanks` for `cbb`/`wcbb` games after scraping, then save. `addGame` stays synchronous and free of network calls. A failed lookup is logged as a warning and the game saves without ranks. *Alternative:* call it inside `addGame`. Rejected: that makes storage async and hides network I/O in a function the delete and notes paths also depend on.

**Match teams by home/away, not by name.** The ESPN event is already matched on both final scores, so its `home` and `away` competitors map straight onto `homeTeam`/`awayTeam`. Women's names with " Women" and spelling differences like "Louisiana–Monroe" don't matter. *Edge case:* neutral-site games, where ESPN's home/away could disagree with Sports-Reference. If the scores line up reversed (ESPN home score = our away score), swap them.

**Display:** a `#N` prefix in the same text run as the team name, slightly muted (e.g. `text-slate-400 font-semibold`) so the name stays the focal point. It goes in `GamesTable.tsx` (matchup cell) and in the `GameBoxscoreView.tsx` header. The line score table and per-team stat table headers are left as they are. Search ignores the prefix because it matches on `team.name`, which is unchanged.

## Risks / Trade-offs

- [ESPN API is unofficial and could change or rate-limit] → Lookup failures never block a save. The backfill can be re-run, and unmatched games are retried.
- [Older seasons (2017-2019) may lack `curatedRank`] → Those games store no rank, which is correct behavior. The backfill's unmatched and no-rank output shows the gaps.
- [Two games on the same date with identical final scores could match the wrong event] → Very unlikely. The match could also require one team's ESPN `shortDisplayName` to appear in ours as a tie-breaker, but that isn't worth adding unless it actually happens.
- [Re-scraping while ESPN is down drops ranks the game had before] → Accepted. The backfill restores them. *Mitigation option:* `addGame` keeps the old `rank`/`espnEventId` when the incoming game has none. Cheap, and included in the tasks.

## Migration Plan

1. Ship the code with ranks optional, so old data renders unchanged.
2. Run `npm run backfill-rankings` locally (or via a one-off Action), review the diff to `data/games.json`, and commit it.
3. Rollback: revert the commit. The extra fields are ignored by older code.
