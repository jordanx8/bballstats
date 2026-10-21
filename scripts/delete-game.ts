import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadGames, saveGames, computeStatsSummary } from '../server/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCliArgs(): { target: string } {
  const args = process.argv.slice(2);
  let target = process.env.TARGET || '';

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--id' || args[i] === '--url' || args[i] === '--target') && args[i + 1]) {
      target = args[i + 1];
      i++;
    } else if (!target && !args[i].startsWith('--')) {
      target = args[i];
    }
  }

  return { target: target.trim() };
}

function main() {
  const { target } = getCliArgs();

  if (!target) {
    console.error('❌ Error: Game ID or Boxscore URL is required.');
    console.error('Usage: npx tsx scripts/delete-game.ts --target "nba-202411110NOP" (or provide URL)');
    process.exit(1);
  }

  console.log(`\n🗑️ [CourtPass Delete Game CLI]`);
  console.log(`🔍 Searching for game matching: "${target}"...`);

  const games = loadGames();
  const matchIndex = games.findIndex(
    g => g.id.toLowerCase() === target.toLowerCase() || 
         g.sourceUrl.toLowerCase() === target.toLowerCase() ||
         g.id.toLowerCase().includes(target.toLowerCase())
  );

  if (matchIndex === -1) {
    console.error(`\n❌ Game not found in library matching: "${target}".`);
    console.log(`Available game IDs:`);
    games.forEach(g => console.log(`   - ${g.id} (${g.formattedDate}: ${g.awayTeam.name} @ ${g.homeTeam.name})`));
    process.exit(1);
  }

  const removedGame = games[matchIndex];
  games.splice(matchIndex, 1);
  saveGames(games);

  // Sync to public/data/games.json
  const publicDataDir = path.resolve(__dirname, '../public/data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDataDir, 'games.json'), JSON.stringify(games, null, 2), 'utf-8');

  const summary = computeStatsSummary(games);

  console.log(`\n✅ Successfully removed game from passport:`);
  console.log(`   - ID: ${removedGame.id}`);
  console.log(`   - Date: ${removedGame.formattedDate || removedGame.date}`);
  console.log(`   - Matchup: ${removedGame.awayTeam.name} vs ${removedGame.homeTeam.name}`);
  console.log(`   - URL: ${removedGame.sourceUrl}`);
  console.log(`\n📊 Updated Passport Stats:`);
  console.log(`   - Remaining Games: ${summary.totalGames}`);
  console.log(`   - Total Points Witnessed: ${summary.totalPointsSeen}\n`);
  process.exit(0);
}

main();
