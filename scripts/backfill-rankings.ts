/**
 * Adds game-day AP Top 25 ranks (from ESPN) to NCAA games already stored in
 * data/games.json. Only `rank` and `espnEventId` are written; nothing else in a
 * game changes. Games already matched to ESPN are skipped unless --force.
 *
 * Usage: npm run backfill-rankings [-- --force]
 */
import { loadGames, saveGames } from '../server/storage.js';
import { applyRanks, isCollegeGame } from '../server/espn.js';

const force = process.argv.includes('--force');

async function main() {
  const games = loadGames();
  const pending = games.filter(g => isCollegeGame(g) && (force || !g.espnEventId));
  console.log(`[ranks] ${pending.length} NCAA game(s) to look up${force ? ' (--force)' : ''}`);

  const before = JSON.stringify(games);
  const unmatched: string[] = [];
  let matched = 0;
  let rankedTeams = 0;

  for (const game of pending) {
    const ok = await applyRanks(game, () => {});
    if (!ok) {
      unmatched.push(`${game.id} (${game.awayTeam.name} @ ${game.homeTeam.name}, ${game.date})`);
      continue;
    }
    matched++;
    for (const t of [game.awayTeam, game.homeTeam]) {
      if (t.rank) {
        rankedTeams++;
        console.log(`[ranks] ${game.date}  #${t.rank} ${t.name}`);
      }
    }
  }

  if (JSON.stringify(games) !== before) {
    saveGames(games);
    console.log('[ranks] data/games.json updated');
  } else {
    console.log('[ranks] no changes');
  }
  console.log(`[ranks] matched ${matched}/${pending.length}, ranked teams found: ${rankedTeams}`);
  if (unmatched.length) console.log(`[ranks] unmatched games:\n  ${unmatched.join('\n  ')}`);
}

main().catch(err => {
  console.error('[ranks] failed:', err);
  process.exit(1);
});
