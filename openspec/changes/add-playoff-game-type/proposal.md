# Proposal

## Why

Three logged games are NBA playoff games, all at the Pelicans: Suns (2022-04-22) and Thunder (2024-04-27 and 2024-04-29). They look like regular-season games, and their stored records are playoff series records (for example the Thunder at 4-0 after completing a sweep), which read as wrong without context. Games can already be marked preseason or exhibition, and playoff games need the same treatment.

## What Changes

- The game type gains a third value: playoff.
- A playoff game shows a separate "PLAYOFFS" badge next to its league badge, in the games journal and in the box score header, styled like the existing PRESEASON and EXHIBITION badges.
- The three Pelicans playoff games are marked playoff in `data/games.json`: `nba-202204220NOP`, `nba-202404270NOP`, `nba-202404290NOP`.
- The "Scrape Game & Deploy" Action gets an optional **Game type** dropdown (none, preseason, exhibition, playoff). The chosen type is stored on the scraped game, so new non-regular-season games no longer need a hand edit. The CLI scrape script takes the same option.
- The same Action also stops writing the box score URL and notes straight into its shell command. They're passed as environment variables instead, so notes containing quotes, `$`, or backticks are stored exactly as typed and never run as code. This matches what the Update Notes Action already guarantees.
- Re-scraping a game with no type chosen keeps any type the game already has, so a re-scrape never silently drops a flag.
- Records stay exactly as stored, so playoff games keep showing their series record next to each team.
- Stats, records, and leaderboards don't change. Detecting a game's type automatically from the box score is out of scope, and so is a type option for the bulk import Action.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `games-journal`: the game-type badge also covers playoff games ("PLAYOFFS").
- `boxscore-view`: the box score header's game-type badge also covers playoff games ("PLAYOFFS").
- `game-management`: the single-game scrape Action accepts an optional game type and stores it on the game, and passes its URL, notes, and game type as data so they are never run as commands.

## Impact

- `src/types/index.ts`: `gameType` accepts `'playoff'`.
- `src/components/GamesTable.tsx`, `src/components/GameBoxscoreView.tsx`: the badge label for playoff games. The other types show their type name in caps, but playoff needs the plural "PLAYOFFS".
- `data/games.json`: `gameType` set on three games.
- `.github/workflows/scrape-and-deploy.yml`: new optional `game_type` choice input. It, the URL, and the notes are all passed to the scrape script through environment variables (`GAME_TYPE`, `GAME_URL`, `GAME_NOTES`) instead of being written into the `run:` command.
- `scripts/scrape-game.ts`: `--game-type` option (and `GAME_TYPE` env var), validated against the allowed values.
- `server/storage.ts` `addGame`: keeps an existing `gameType` when the incoming game has none.
- `README.md`: the Action's new input.
