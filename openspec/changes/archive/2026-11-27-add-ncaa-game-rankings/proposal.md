# Proposal

## Why

Whether a college team was ranked when you saw it is a big part of what made a game memorable. Beating #17 Kentucky in person isn't the same as beating an unranked team. The app has no way to show this today: Sports-Reference box scores, the source for every NCAA game, don't list poll rankings. ESPN's public scoreboard does give each team's AP Top 25 rank as of game day, and `scripts/build-media.ts` already matches every logged game to its ESPN event.

## What Changes

- Each NCAA game (men's and women's) stores each team's AP Top 25 rank as of that game, when the team was ranked.
- When a game is added or re-scraped, the add-game flow (GitHub Actions, CLI scripts, local server) looks up both teams' ranks on ESPN and stores them. If ESPN can't be reached or has no matching game, the game is still saved, without ranks.
- A one-time, re-runnable backfill script adds ranks to the NCAA games already in `data/games.json` (66 today).
- The games list shows the rank right before a ranked team's name, e.g. "#20 LSU". The box score header shows it the same way.
- Unranked teams, games with no rank data, and NBA/WNBA games show no rank marker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `boxscore-scraping`: storing an NCAA game also records each team's game-day AP rank from ESPN, and a failed lookup never blocks saving the game.
- `boxscore-view`: the box score header shows each ranked team's game-day rank before its name.
- `games-journal`: each game row shows each ranked team's game-day rank before its name.

## Impact

- `src/types/index.ts`: optional `rank` on `TeamGameData`.
- New shared ESPN lookup module, used by the add-game flow and the backfill. Event matching moves out of `scripts/build-media.ts` so both use the same logic.
- `server/storage.ts` / `scripts/scrape-game.ts` / `scripts/import-games.ts` / `server/index.ts`: look up ranks before saving NCAA games.
- New `scripts/backfill-rankings.ts` and an npm script.
- `src/components/GamesTable.tsx` and `src/components/GameBoxscoreView.tsx`: show the rank.
- `data/games.json`: `rank` added to ranked teams in existing NCAA games.
- Depends on ESPN's unofficial public API (`site.api.espn.com`), which `build-media` already uses. No new dependencies.
