# Tasks

## 1. Game type data

- [x] 1.1 Add optional `gameType?: 'preseason' | 'exhibition'` to `Game` in `src/types/index.ts`; verify `npm run build` type-checks.
- [x] 1.2 In `data/games.json`, set `"gameType": "preseason"` on `nba-20261016WASNOP` and `"gameType": "exhibition"` on `lsu-20261014UCF`; verify with `git diff data/games.json` that only those two lines (plus their commas) were added and no other game changed.

## 2. Games journal

- [x] 2.1 In `src/components/GamesTable.tsx`, show each team's stored `record` right after its name in the matchup cell (small, muted, separated by a real space), shown as stored for every game and omitted when there's no record. In the browser, verify "#17 Kentucky 18-8" / "LSU 14-12" on 2024-02-21, "0-0" for both teams on 2026-10-14, and "2-2" / "3-1" on 2026-10-16.
- [x] 2.2 In `src/components/GamesTable.tsx`, add a separate game-type badge next to the league badge, reading "PRESEASON" or "EXHIBITION" and styled like the league badges (all caps, same size). In the browser, verify the 2026-10-14 row shows NCAA MEN + EXHIBITION, the 2026-10-16 row shows NBA + PRESEASON, and a regular-season row shows only its league badge.

## 3. Box score header

- [x] 3.1 In `src/components/GameBoxscoreView.tsx`, add the same game-type badge next to the header's league badge. In the browser, verify the UCF @ LSU box score shows NCAA MEN + EXHIBITION with both "0-0" records still shown, the Wizards @ Pelicans box score shows NBA + PRESEASON, and a regular-season box score shows only the league badge.

## 4. Integration check

- [x] 4.1 Run `npm run build`, load the preview build, and confirm the journal and both typed box scores render as above with no console errors other than the expected `/api` fallback.
