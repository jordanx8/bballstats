import fs from 'fs';
import { scrapeBoxscore } from '../server/scraper.js';
import { addGame, loadGames, computeStatsSummary } from '../server/storage.js';

interface ImportItem {
  url: string;
  notes?: string;
}

function parseInputUrls(): { items: ImportItem[]; delayMs: number } {
  const args = process.argv.slice(2);
  let rawUrls = process.env.URLS_LIST || '';
  let filePath = '';
  let defaultNotes = process.env.GAME_NOTES || '';
  let delayMs = 1500;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--urls' && args[i + 1]) {
      rawUrls = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--notes' && args[i + 1]) {
      defaultNotes = args[i + 1];
      i++;
    } else if (args[i] === '--delay' && args[i + 1]) {
      delayMs = parseInt(args[i + 1], 10) || 1500;
      i++;
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    rawUrls = fs.readFileSync(filePath, 'utf-8');
  }

  if (!rawUrls.trim()) {
    return { items: [], delayMs };
  }

  const rawLines = rawUrls.split(/[\r\n]+/);
  const items: ImportItem[] = [];

  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) continue;

    // Split line by URL boundaries (supports comma-separated, space-separated, or pipe-separated notes)
    const urlSegments = trimmedLine.split(/(?=https?:\/\/)/i);

    for (const segment of urlSegments) {
      let cleaned = segment.trim();
      if (!cleaned) continue;

      // Strip trailing commas, semicolons, quotes, and whitespace
      cleaned = cleaned.replace(/[,;]+$/, '').trim();
      cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
      if (!cleaned) continue;

      if (cleaned.includes('|')) {
        const parts = cleaned.split('|');
        const urlMatch = parts[0].trim().match(/(https?:\/\/[^\s"',;<>]+)/i);
        const notes = parts.slice(1).join('|').trim().replace(/[,;]+$/, '').trim();
        if (urlMatch) {
          items.push({ url: urlMatch[1], notes: notes || defaultNotes || undefined });
        }
      } else {
        const subParts = cleaned.split(/[,;\s]+/);
        for (const part of subParts) {
          const match = part.trim().match(/(https?:\/\/[^\s"',;<>]+)/i);
          if (match) {
            items.push({ url: match[1].trim(), notes: defaultNotes || undefined });
          }
        }
      }
    }
  }

  // Deduplicate items with the same URL
  const uniqueItems: ImportItem[] = [];
  const seenUrls = new Set<string>();
  for (const item of items) {
    if (!seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      uniqueItems.push(item);
    }
  }

  return { items: uniqueItems, delayMs };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const { items, delayMs } = parseInputUrls();

  if (items.length === 0) {
    console.error('❌ Error: No valid box score URLs provided.');
    console.error('\nUsage:');
    console.error('  npx tsx scripts/import-games.ts --urls "https://url1, https://url2"');
    console.error('  npx tsx scripts/import-games.ts --file urls.txt');
    console.error('  Supports comma-separated or newline-separated URLs (optionally: https://... | Note)');
    process.exit(1);
  }

  console.log(`\n🏀 [CourtPass Bulk Import CLI]`);
  console.log(`📋 Found ${items.length} URL${items.length === 1 ? '' : 's'} to process with ${delayMs}ms interval...\n`);

  let successCount = 0;
  let failureCount = 0;
  const errors: { url: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const { url, notes } = items[i];
    console.log(`----------------------------------------------------------------`);
    console.log(`[${i + 1}/${items.length}] 🔗 Scraping: ${url}`);
    if (notes) console.log(`      📝 Note: "${notes}"`);

    try {
      const scrapedGame = await scrapeBoxscore(url);
      if (notes) {
        scrapedGame.notes = notes;
      }

      const { game, isNew } = addGame(scrapedGame);
      successCount++;
      console.log(`      ✅ ${isNew ? 'Added' : 'Updated'}: ${game.awayTeam.name} (${game.awayTeam.score}) @ ${game.homeTeam.name} (${game.homeTeam.score}) - ${game.formattedDate || game.date}`);
      if (game.arena) console.log(`      📍 Arena: ${game.arena}`);
    } catch (err: any) {
      failureCount++;
      console.error(`      ❌ Error: ${err.message}`);
      errors.push({ url, error: err.message });
    }

    // Delay between requests to avoid rate limits
    if (i < items.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const allGames = loadGames();
  const summary = computeStatsSummary(allGames);

  console.log(`\n================================================================`);
  console.log(`📊 BULK IMPORT COMPLETE`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed:     ${failureCount}`);
  console.log(`   🏆 Total Games in Passport: ${summary.totalGames}`);
  console.log(`   🏀 Total Points Witnessed:  ${summary.totalPointsSeen}`);
  console.log(`================================================================\n`);

  if (errors.length > 0) {
    console.log(`Failed URLs summary:`);
    errors.forEach(e => console.log(` - ${e.url} (${e.error})`));
    console.log('');
  }

  if (successCount === 0 && failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
