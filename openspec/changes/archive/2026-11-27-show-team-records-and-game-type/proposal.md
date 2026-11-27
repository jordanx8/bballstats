# Proposal

## Why

The games journal shows who played and the score, but not where each team stood. Each team's record after the game, like Kentucky at 18-8 or LSU at 6-0, gives quick context, and it's already stored for every game (it's shown in the box score header today). Two logged games aren't regular-season games: the UCF exhibition at LSU (2026-10-14) and the Wizards preseason game at the Pelicans (2026-10-16). Nothing marks them, so a 0-0 or 3-1 preseason record would look like an error.

## What Changes

- The games journal shows each team's stored record (after the game) right after its name, for every game, exactly as stored. That includes 0-0 and preseason records.
- Games gain an optional game type: preseason or exhibition. Regular-season games have none.
- A game with a type shows a separate badge reading "PRESEASON" or "EXHIBITION" (all caps, matching the league badges) next to its league badge, in the games journal and in the box score header.
- The Wizards @ Pelicans game (2026-10-16) is marked preseason, and the UCF @ LSU game (2026-10-14) is marked exhibition, in `data/games.json`.
- Stats, records, and leaderboards don't change. Typed games still count everywhere they count today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `games-journal`: each game row shows each team's post-game record after its name, and a game-type badge when the game has a type.
- `boxscore-view`: the box score header shows the game-type badge next to the league badge.

## Impact

- `src/types/index.ts`: optional `gameType` on `Game`.
- `src/components/GamesTable.tsx`: the record after each team name, and the game-type badge.
- `src/components/GameBoxscoreView.tsx`: the game-type badge in the header.
- `data/games.json`: `gameType` set on two games.
- No scraper, API, or dependency changes.
