# Tasks

## 1. Playoff game type data

- [x] 1.1 Extend `gameType` in `src/types/index.ts` to `'preseason' | 'exhibition' | 'playoff'`; verify `npm run build` type-checks.
- [x] 1.2 Set `"gameType": "playoff"` on `nba-202204220NOP`, `nba-202404270NOP`, and `nba-202404290NOP` in `data/games.json`; verify `git diff data/games.json` shows only those three additions (plus commas).

## 2. Badge label

- [x] 2.1 Add one shared label for game types ("PRESEASON", "EXHIBITION", "PLAYOFFS") and use it for the badge in both `src/components/GamesTable.tsx` and `src/components/GameBoxscoreView.tsx`, keeping the existing badge styling. In the browser, verify the 2024-04-29 row shows NBA + PLAYOFFS with "4-0" / "0-4", the 2022-04-22 box score header shows NBA + PLAYOFFS with "2-1" / "1-2", and the PRESEASON and EXHIBITION badges are unchanged.

## 3. Game type on import

- [x] 3.1 In `server/storage.ts` `addGame`, keep the existing `gameType` when the incoming game has none; verify by re-adding a playoff game object without `gameType` (against a backup of `data/games.json`, then restoring it) and checking the type remains, and that an incoming type replaces it.
- [x] 3.2 Add a `--game-type` option (and `GAME_TYPE` env var) to `scripts/scrape-game.ts`: empty or `none` means no type; `preseason`/`exhibition`/`playoff` set `gameType` before saving; any other value exits non-zero, names the allowed values, and saves nothing. Verify all three cases locally against a backup of `data/games.json`.
- [x] 3.3 In `.github/workflows/scrape-and-deploy.yml`, add an optional `game_type` input of `type: choice` (options `none`, `preseason`, `exhibition`, `playoff`; default `none`), and change the scrape step to `npx tsx scripts/scrape-game.ts` with the URL, notes, and game type passed only through the `GAME_URL`, `GAME_NOTES`, and `GAME_TYPE` environment variables (the script already reads the first two). Verify the YAML parses (e.g. `npx --yes js-yaml .github/workflows/scrape-and-deploy.yml`) and that no `run:` line contains `${{ github.event.inputs`. Then, locally, run the script with `GAME_URL` set to a known game and `GAME_NOTES` set to a string containing a double quote, `$(whoami)`, a backtick-wrapped command, and `%`, and confirm the stored notes match it byte for byte (against a backup of `data/games.json`, restored afterwards).
- [x] 3.4 Document the new Game type input in `README.md` under "Add a Single Game", and verify the documented choices match the workflow's options.

## 4. Integration check

- [x] 4.1 Run `npm run build`, load the preview build, and confirm all three playoff games show the PLAYOFFS badge in the journal, with no console errors other than the expected `/api` fallback.
