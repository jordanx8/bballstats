# Tasks

## 1. Source link label

- [x] 1.1 Add a pure helper in `src/services/` that maps a URL to a site display name (Basketball-Reference, Sports-Reference, ESPN by domain or subdomain; otherwise the host without a leading `www.`; `null` if the URL can't be parsed), and verify `npm run build` passes
- [x] 1.2 Use the helper for the "View on …" button in `src/components/GameBoxscoreView.tsx`, falling back to "View source" when it returns `null`, and verify `npm run build` passes
- [x] 1.3 In the dev server, open the box scores for WAS @ NOP (2026-10-16), UCF @ LSU (2026-10-14), one Basketball-Reference game, and one Sports-Reference game, and verify the buttons read "View on ESPN", "View on lsusports.net", "View on Basketball-Reference", and "View on Sports-Reference"

## 2. Season filter refresh

- [x] 2.1 Add `seasonFilter` to the dependency list of the filtered-games memo in `src/components/GamesTable.tsx`, and verify `npm run build` passes
- [x] 2.2 In the dev server, change only the Season filter on the games journal and verify the list updates immediately, then switch back to all seasons and verify every game returns

## 3. Update Game Notes Action

- [x] 3.1 Add `scripts/update-notes.ts` that reads `TARGET`, `NOTES`, `CLEAR` from the environment (with matching `--target`/`--notes`/`--clear` flags), matches a game by exact ID or source URL, sets or clears its notes, and saves via `server/storage`; add `npm run update-notes`; verify locally that setting, clearing, a partial ID, an unknown ID, and empty notes without clear each behave as the `game-management` spec says, then `git checkout data/games.json`
- [x] 3.2 Verify locally that notes containing ``"quotes" $HOME `ls` `` are stored exactly as typed and nothing is executed
- [x] 3.3 Add `.github/workflows/update-notes.yml` modeled on `remove-game.yml`, passing inputs only via `env:`, committing `data/games.json` only when it changed with a message using the matched game ID, then building and deploying; verify by comparing it step by step with `remove-game.yml` and confirming no `${{ github.event.inputs.* }}` appears inside any `run:` block
- [x] 3.4 Add an "Update Game Notes" section to `README.md` next to "Remove a Game", and verify its steps match the workflow's input names

## 4. Box score notes section

- [x] 4.1 Expose from `src/services/api.ts` whether the local server is reachable, and verify `npm run build` passes
- [x] 4.2 In `GameBoxscoreView.tsx`, show the editor only when the server is reachable; otherwise show the notes read-only, the game ID with a copy button, and an "Edit on GitHub" link to the update-notes workflow; verify `npm run build` passes
- [x] 4.3 Run `npm run dev`, edit and save a note, reload, and verify it persisted; then run `npm run build && npm run preview` (no server), open a box score, and verify there's no editor, the ID copies, and the link opens the workflow page

## 5. End-to-end check

- [ ] 5.1 After merging, run the Update Game Notes Action on GitHub for one game and verify the commit lands and the deployed box score shows the new notes
