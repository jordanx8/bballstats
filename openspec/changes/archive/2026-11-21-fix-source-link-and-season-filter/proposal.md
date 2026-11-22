# Proposal

## Why

The box score page's "View on …" button names its site from the game's league rather than from the link it opens, so hand-added games that link to ESPN or a school athletics site are mislabeled as Basketball-Reference or Sports-Reference. Separately, the games journal does not refresh when only the Season filter changes, so picking a season can leave the wrong games on screen. Finally, editing a game's notes on the deployed GitHub Pages site appears to save but only changes the copy in memory, so the note is lost on reload; there is no way to change notes after a game is logged except by editing `data/games.json` by hand.

## What Changes

- The box score source button derives its site name from the domain of the game's source URL instead of from the league.
  - Known sites get a friendly name: Basketball-Reference, Sports-Reference, ESPN.
  - Any other site shows its domain (with a leading `www.` removed), e.g. "View on lsusports.net".
- The games journal re-filters as soon as the Season filter changes, without needing another filter, the search, or the sort to change too.
- A new "Update Game Notes" GitHub Action (manually run, like Remove Game) sets or clears one game's notes, commits `data/games.json`, and redeploys the site.
- On the deployed site, the box score's notes section no longer offers an editor that can't save. It links to the new Action and shows the game's ID to use there. In-place editing keeps working when the local Express server is running.
- No changes to the shape of stored game data, the scraper, or the meaning of the league field.

## Capabilities

### New Capabilities

- `boxscore-view`: The single-game box score page, including how it links back to the game's original source and how its notes can be edited.
- `game-management`: The manually run GitHub Actions that add, remove, and update logged games and redeploy the site.
- `games-journal`: The chronological list of attended games and its search, filter, and sort controls.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- `src/components/GameBoxscoreView.tsx`: source button label.
- A small new helper under `src/services/` that maps a URL to a display name.
- `src/components/GamesTable.tsx`: filtered list refresh when the season changes.
- New `.github/workflows/update-notes.yml` and a matching `scripts/update-notes.ts` (plus an `npm run update-notes` script).
- `src/components/GameBoxscoreView.tsx` notes section and `src/services/api.ts`: tell whether notes can be saved where the app is running.
- `README.md`: document the new Action alongside the existing ones.
- Affects the two existing hand-added games (ESPN, lsusports.net), whose labels become correct. All Reference-sourced games keep their current labels.
