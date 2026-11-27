import { scrapeBoxscore } from '../server/scraper.js';
import { applyRanks } from '../server/espn.js';
import type { Game } from '../src/types/index.js';

const GAME_TYPES = ['preseason', 'exhibition', 'playoff'] as const;
import { addGame, loadGames, computeStatsSummary } from '../server/storage.js';

function getCliArgs(): { url: string; notes?: string; gameType: string } {
  const args = process.argv.slice(2);
  let url = process.env.GAME_URL || '';
  let notes = process.env.GAME_NOTES || '';
  let gameType = process.env.GAME_TYPE || '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--notes' && args[i + 1]) {
      notes = args[i + 1];
      i++;
    } else if (args[i] === '--game-type' && args[i + 1]) {
      gameType = args[i + 1];
      i++;
    } else if (!url && !args[i].startsWith('--')) {
      url = args[i];
    }
  }

  return { url: url.trim(), notes: notes.trim() || undefined, gameType: gameType.trim().toLowerCase() };
}

async function main() {
  const { url, notes, gameType } = getCliArgs();

  // '' or 'none' means no game type; anything else must be an allowed value.
  if (gameType && gameType !== 'none' && !(GAME_TYPES as readonly string[]).includes(gameType)) {
    console.error(`❌ Error: invalid game type "${gameType}". Allowed: none, ${GAME_TYPES.join(', ')}.`);
    process.exit(1);
  }

  if (!url) {
    console.error('❌ Error: Box score URL is required.');
    console.error('Usage: npx tsx scripts/scrape-game.ts --url "https://www.basketball-reference.com/boxscores/..." --notes "Optional notes" --game-type none|preseason|exhibition|playoff');
    process.exit(1);
  }

  console.log(`\n🏀 [BBallStats Scraper CLI]`);
  console.log(`🔗 Scraping URL: ${url}`);
  if (notes) console.log(`📝 Notes: "${notes}"`);
  if (gameType && gameType !== 'none') console.log(`🏷️  Game type: ${gameType}`);

  try {
    const scrapedGame = await scrapeBoxscore(url);
    if (notes) {
      scrapedGame.notes = notes;
    }
    if (gameType && gameType !== 'none') {
      scrapedGame.gameType = gameType as NonNullable<Game['gameType']>;
    }

    await applyRanks(scrapedGame);
    const { game, isNew } = addGame(scrapedGame);
    const allGames = loadGames();
    const summary = computeStatsSummary(allGames);

    console.log(`\n✅ Successfully ${isNew ? 'added new game' : 'updated existing game'}!`);
    console.log(`   - Date: ${game.formattedDate || game.date}`);
    console.log(`   - Matchup: ${game.awayTeam.name} (${game.awayTeam.score}) @ ${game.homeTeam.name} (${game.homeTeam.score})`);
    console.log(`   - Winner: ${game.winner === 'away' ? game.awayTeam.name : game.homeTeam.name}`);
    if (game.arena) console.log(`   - Arena: ${game.arena}`);
    if (game.homeTeam.rank || game.awayTeam.rank) {
      console.log(`   - AP ranks: ${game.awayTeam.name} ${game.awayTeam.rank ? '#' + game.awayTeam.rank : 'unranked'}, ${game.homeTeam.name} ${game.homeTeam.rank ? '#' + game.homeTeam.rank : 'unranked'}`);
    }
    console.log(`   - Away Players: ${game.awayTeam.players.length}, Home Players: ${game.homeTeam.players.length}`);
    console.log(`\n📊 Total Games in Passport: ${summary.totalGames}`);
    console.log(`   Total Points Witnessed: ${summary.totalPointsSeen}`);
    console.log(`   Top Team Seen: ${summary.topTeamsSeen[0]?.teamName || 'None'}`);
    console.log(`   Top Player Seen: ${summary.topPlayersSeen[0]?.playerName || 'None'}\n`);
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ Scraping failed: ${err.message}`);
    process.exit(1);
  }
}

main();
