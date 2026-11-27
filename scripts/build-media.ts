/**
 * Builds data/media.json: team logos and player headshots for every game in
 * data/games.json, using ESPN's public site API.
 *
 * Each game is matched to its ESPN event by date + final score, then the ESPN
 * box score gives exact athlete IDs/headshots and team logos. The script is
 * incremental: games already listed in `processedGames` are skipped.
 *
 * Usage: npm run build-media [-- --force]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Game } from '../src/types/index.js';
import { normalizeName } from '../src/services/mediaKeys.js';
import { ESPN_BASE as BASE, SPORT_PATHS, type Sport, findEspnEvent, getJson } from '../server/espn.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAMES_FILE = path.resolve(__dirname, '../data/games.json');
const MEDIA_FILE = path.resolve(__dirname, '../data/media.json');

interface MediaFile {
  generatedAt: string;
  processedGames: string[];
  teams: Record<string, string>;
  players: Record<string, string>;
}

const force = process.argv.includes('--force');

// Teams that can't be matched through an ESPN event (e.g. exhibitions scraped from school sites).
// `copyFrom` reuses the logo of another team name already in the file; `url` is a literal logo.
const TEAM_LOGO_OVERRIDES: Record<string, { copyFrom?: string; url?: string }> = {
  'LSU Tigers': { copyFrom: 'LSU' },
  'UCF Knights': { url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2116.png' },
};

function defaultHeadshot(sport: Sport, id: string): string {
  return `https://a.espncdn.com/i/headshots/${SPORT_PATHS[sport]}/players/full/${id}.png`;
}

async function main() {
  const games: Game[] = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
  const media: MediaFile =
    !force && fs.existsSync(MEDIA_FILE)
      ? JSON.parse(fs.readFileSync(MEDIA_FILE, 'utf-8'))
      : { generatedAt: '', processedGames: [], teams: {}, players: {} };

  const done = new Set(media.processedGames);
  const pending = games
    .filter(g => !done.has(g.id))
    .sort((a, b) => a.date.localeCompare(b.date)); // oldest first so newer headshots win

  console.log(`[media] ${pending.length} game(s) to process (${games.length} total)`);

  const unmatched: string[] = [];
  let index = 0;
  for (const game of pending) {
    index++;
    const found = await findEspnEvent(game);
    if (!found) {
      unmatched.push(`${game.id} (${game.awayTeam.name} @ ${game.homeTeam.name}, ${game.date})`);
      continue;
    }
    const { sport, event } = found;

    // Team logos from the scoreboard competitors
    const { home, away } = found;
    if (home?.team?.logo) media.teams[game.homeTeam.name] = home.team.logo;
    if (away?.team?.logo) media.teams[game.awayTeam.name] = away.team.logo;

    // Athlete headshots from the box score
    try {
      const summary = await getJson(`${BASE}${SPORT_PATHS[sport]}/summary?event=${event.id}`);
      for (const teamBlock of summary.boxscore?.players || []) {
        for (const statGroup of teamBlock.statistics || []) {
          for (const entry of statGroup.athletes || []) {
            const athlete = entry.athlete;
            if (!athlete?.displayName) continue;
            const key = normalizeName(athlete.displayName);
            const url: string = athlete.headshot?.href || defaultHeadshot(sport, athlete.id);
            const existing = media.players[key];
            // Keep an NBA headshot over a college one
            if (existing && existing.includes('/nba/') && !url.includes('/nba/')) continue;
            media.players[key] = url;
          }
        }
      }
      media.processedGames.push(game.id);
    } catch (err: any) {
      unmatched.push(`${game.id} (summary failed: ${err.message})`);
    }

    if (index % 10 === 0) console.log(`[media] processed ${index}/${pending.length}`);
  }

  for (const [name, override] of Object.entries(TEAM_LOGO_OVERRIDES)) {
    if (media.teams[name]) continue;
    const url = override.url || (override.copyFrom ? media.teams[override.copyFrom] : undefined);
    if (url) media.teams[name] = url;
  }

  media.generatedAt = new Date().toISOString();
  media.processedGames.sort();
  media.teams = Object.fromEntries(Object.entries(media.teams).sort(([a], [b]) => a.localeCompare(b)));
  media.players = Object.fromEntries(Object.entries(media.players).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MEDIA_FILE, JSON.stringify(media, null, 2) + '\n', 'utf-8');

  // Coverage report
  const teamNames = new Set<string>();
  const playerNames = new Set<string>();
  for (const g of games) {
    for (const t of [g.awayTeam, g.homeTeam]) {
      teamNames.add(t.name);
      for (const p of t.players) if (p.name && !p.dnpReason) playerNames.add(p.name);
    }
  }
  const missingTeams = [...teamNames].filter(n => !media.teams[n]);
  const missingPlayers = [...playerNames].filter(n => !media.players[normalizeName(n)]);

  console.log(`[media] teams with logo: ${teamNames.size - missingTeams.length}/${teamNames.size}`);
  console.log(`[media] players with headshot: ${playerNames.size - missingPlayers.length}/${playerNames.size}`);
  if (missingTeams.length) console.log(`[media] missing logos: ${missingTeams.join('; ')}`);
  if (unmatched.length) console.log(`[media] unmatched games:\n  ${unmatched.join('\n  ')}`);
}

main().catch(err => {
  console.error('[media] failed:', err);
  process.exit(1);
});
