import fs from 'fs';
import { loadGames, saveGames } from '../server/storage.js';

/**
 * Set or clear one game's personal notes.
 *
 * Inputs come from the environment (TARGET, NOTES, CLEAR) so the GitHub Action never
 * has to put free text on a shell command line. Flags work too for local use:
 *   npm run update-notes -- --target cbb-2026-11-18-20-louisiana-state --notes "RJ Luis debut"
 *   npm run update-notes -- --target cbb-2026-11-18-20-louisiana-state --clear
 */
function getInputs(): { target: string; notes: string; clear: boolean } {
  let target = process.env.TARGET ?? '';
  let notes = process.env.NOTES ?? '';
  let clear = /^(true|1|yes)$/i.test(process.env.CLEAR ?? '');

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && i + 1 < args.length) target = args[++i];
    else if (arg === '--notes' && i + 1 < args.length) notes = args[++i];
    else if (arg === '--clear') clear = true;
  }

  return { target: target.trim(), notes, clear };
}

function fail(message: string): never {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

/** Expose the matched game ID to later workflow steps, when running in GitHub Actions. */
function setOutput(name: string, value: string) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, `${name}=${value}\n`, 'utf-8');
}

function main() {
  const { target, notes, clear } = getInputs();

  if (!target) fail('A game ID or box score URL is required (TARGET or --target).');
  if (!clear && notes.trim() === '') {
    fail('Provide notes text, or choose "clear" to remove the notes. Nothing was changed.');
  }

  const games = loadGames();
  const wanted = target.toLowerCase();
  const game = games.find(g => g.id.toLowerCase() === wanted || g.sourceUrl.toLowerCase() === wanted);
  if (!game) fail(`No game exactly matches "${target}". Use the full game ID or box score URL. Nothing was changed.`);

  setOutput('game_id', game.id);
  const matchup = `${game.awayTeam.name} @ ${game.homeTeam.name} (${game.formattedDate || game.date})`;

  if (clear) {
    if (!game.notes) {
      console.log(`\nℹ️ ${game.id} already has no notes. Nothing to change.`);
      return;
    }
    delete game.notes;
    saveGames(games);
    console.log(`\n✅ Cleared notes for ${game.id}: ${matchup}`);
    return;
  }

  if (game.notes === notes) {
    console.log(`\nℹ️ ${game.id} already has these notes. Nothing to change.`);
    return;
  }

  game.notes = notes;
  saveGames(games);
  console.log(`\n✅ Updated notes for ${game.id}: ${matchup}`);
  console.log(`   Notes: ${notes}`);
}

main();
