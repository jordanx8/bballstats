# Tasks

## 1. Data model and shared ESPN lookup

- [x] 1.1 Add optional `rank?: number` to `TeamGameData` and optional `espnEventId?: string` to `Game` in `src/types/index.ts`; verify `npm run build` type-checks.
- [x] 1.2 Create `server/espn.ts` by moving `getJson`, the scoreboard cache, `sportsToTry`, `shiftDate`, and `findEvent` out of `scripts/build-media.ts`, exported as `findEspnEvent(game)`. Point `build-media.ts` at it and verify `npm run build-media -- --force` produces the same `data/media.json` as before (`git diff --stat data/media.json` shows no change beyond `generatedAt`).
- [x] 1.3 Add `lookupRanks(game)` to `server/espn.ts`. It returns `null` for non-NCAA games or no match. Otherwise it returns `{ eventId, home?, away? }`, keeping only ranks 1-25 and swapping home/away when the scores line up reversed. Verify with a quick `tsx` one-off on the 2024-02-21 Kentucky @ LSU game (expects away 17, no home rank) and the 2026-01-14 game (expects no ranks).

## 2. Add-game flow

- [x] 2.1 In `server/storage.ts` `addGame`, when replacing an existing record whose incoming game has no `espnEventId`, keep the previous `espnEventId` and team `rank` values; verify by re-adding a ranked game object without ranks and checking the stored ranks remain.
- [x] 2.2 Add an `applyRanks(game)` helper that calls `lookupRanks`, sets `rank`/`espnEventId`, and on failure logs a warning and leaves the game unchanged. Call it before `addGame` in `scripts/scrape-game.ts`, `scripts/import-games.ts`, and the scrape route in `server/index.ts` (the `/api/games/import` route restores whole game objects without scraping, so it does no lookup). Verify that `npm run scrape -- https://www.sports-reference.com/cbb/boxscores/2024-02-21-21-louisiana-state.html` stores Kentucky's rank 17.
- [x] 2.3 Verify the failure path: run the same scrape with network access to `site.api.espn.com` blocked, or with the ESPN base URL temporarily pointed at an invalid host. The game saves, a warning is printed, and no ranks are stored.
- [x] 2.4 Verify that scraping an NBA game makes no ESPN rank request and stores no ranks.

## 3. Backfill

- [x] 3.1 Add `scripts/backfill-rankings.ts` and an npm script `backfill-rankings`. It runs `applyRanks` on every `cbb`/`wcbb` game without `espnEventId` (all of them with `--force`), writes `data/games.json` once, and prints counts of matched games, ranked teams, and an unmatched list. Verify that a second run without `--force` leaves `git diff data/games.json` unchanged.
- [x] 3.2 Run the backfill and review the diff. Only `rank`/`espnEventId` fields should be added, no NBA/WNBA game touched, and 2024-02-21 Kentucky = 17, 2023-01-21 Tennessee = 9. Note in the commit which seasons came back with no ranks at all (e.g. 2017-19).
- [x] 3.3 Document the backfill command and the ESPN rank source in `README.md` (Local CLI Commands and Features), and verify the documented command runs as written.

## 4. Display

- [x] 4.1 In `src/components/GamesTable.tsx`, render `#N` (muted) right before each team name in the matchup cell when `rank` is set. In the browser, verify "#9 Tennessee" appears on the 2023-01-21 row, unranked and NBA rows show no marker, and searching "Kentucky" still finds the ranked game.
- [x] 4.2 In `src/components/GameBoxscoreView.tsx`, render `#N` before the team name in the header. In the browser, verify "#17 Kentucky" appears on the 2024-02-21 box score and an NBA box score shows no marker.

## 5. Integration check

- [x] 5.1 Run `npm run build`, then load the preview build. Spot-check three ranked games and one NBA game in both the list and the box score, and confirm there are no console errors.
