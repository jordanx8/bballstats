/**
 * Matching logged games to ESPN events via ESPN's public site API, plus the
 * game-day AP rank lookup built on it. Shared by build-media, the add-game
 * flow, and the rankings backfill.
 */
import type { Game } from '../src/types/index.js';

export const ESPN_BASE =
  process.env.ESPN_API_BASE || 'https://site.api.espn.com/apis/site/v2/sports/basketball/';

export const SPORT_PATHS = {
  nba: 'nba',
  wnba: 'wnba',
  mens: 'mens-college-basketball',
  womens: 'womens-college-basketball',
} as const;
export type Sport = keyof typeof SPORT_PATHS;

export async function getJson(url: string): Promise<any> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastErr;
}

const scoreboardCache = new Map<string, Promise<any[]>>();

function getScoreboard(sport: Sport, yyyymmdd: string): Promise<any[]> {
  const key = `${sport}:${yyyymmdd}`;
  let cached = scoreboardCache.get(key);
  if (!cached) {
    const groups = sport === 'mens' || sport === 'womens' ? '&groups=50&limit=400' : '';
    cached = getJson(`${ESPN_BASE}${SPORT_PATHS[sport]}/scoreboard?dates=${yyyymmdd}${groups}`)
      .then(data => (data.events as any[]) || [])
      .catch(() => []);
    scoreboardCache.set(key, cached);
  }
  return cached;
}

function sportsToTry(game: Game): Sport[] {
  if (game.sourceType === 'nba') return ['nba'];
  if (game.sourceType === 'wnba') return ['wnba'];
  if (game.sourceType === 'wcbb') return ['womens'];
  return ['mens', 'womens'];
}

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export interface EspnMatch {
  sport: Sport;
  event: any;
  /** ESPN competitor for our `homeTeam` / `awayTeam`. */
  home: any;
  away: any;
  /** True when ESPN lists the teams the other way round (e.g. neutral site). */
  reversed: boolean;
}

/**
 * Finds the ESPN event for a game by date (±1 day) and final score.
 * With `allowReversed`, an event whose home/away scores are swapped also matches.
 */
export async function findEspnEvent(
  game: Game,
  opts: { allowReversed?: boolean } = {},
): Promise<EspnMatch | null> {
  const isoDate = game.date.slice(0, 10);
  for (const sport of sportsToTry(game)) {
    for (const offset of [0, -1, 1]) {
      const events = await getScoreboard(sport, shiftDate(isoDate, offset));
      for (const event of events) {
        const comps = event.competitions?.[0]?.competitors || [];
        const home = comps.find((c: any) => c.homeAway === 'home');
        const away = comps.find((c: any) => c.homeAway === 'away');
        if (!home || !away) continue;
        const h = Number(home.score);
        const a = Number(away.score);
        if (h === game.homeTeam.score && a === game.awayTeam.score) {
          return { sport, event, home, away, reversed: false };
        }
        if (opts.allowReversed && h === game.awayTeam.score && a === game.homeTeam.score) {
          return { sport, event, home: away, away: home, reversed: true };
        }
      }
    }
  }
  return null;
}

export function isCollegeGame(game: Game): boolean {
  return game.sourceType === 'cbb' || game.sourceType === 'wcbb';
}

function apRank(competitor: any): number | undefined {
  const r = Number(competitor?.curatedRank?.current);
  return Number.isInteger(r) && r >= 1 && r <= 25 ? r : undefined;
}

export interface RankLookup {
  eventId: string;
  home?: number;
  away?: number;
}

/** Game-day AP ranks for an NCAA game, or null for non-NCAA games / no ESPN match. */
export async function lookupRanks(game: Game): Promise<RankLookup | null> {
  if (!isCollegeGame(game)) return null;
  const match = await findEspnEvent(game, { allowReversed: true });
  if (!match) return null;
  return { eventId: String(match.event.id), home: apRank(match.home), away: apRank(match.away) };
}

/**
 * Looks up and stores game-day ranks on an NCAA game, in place. Never throws:
 * on failure or no match it warns and leaves the game unchanged.
 * Returns true when the game was matched to ESPN.
 */
export async function applyRanks(game: Game, log: (msg: string) => void = console.warn): Promise<boolean> {
  if (!isCollegeGame(game)) return false;
  try {
    const result = await lookupRanks(game);
    if (!result) {
      log(`⚠️  No ESPN match for ${game.awayTeam.name} @ ${game.homeTeam.name} (${game.date}); ranks not found.`);
      return false;
    }
    game.espnEventId = result.eventId;
    if (result.home !== undefined) game.homeTeam.rank = result.home;
    else delete game.homeTeam.rank;
    if (result.away !== undefined) game.awayTeam.rank = result.away;
    else delete game.awayTeam.rank;
    return true;
  } catch (err: any) {
    log(`⚠️  Rank lookup failed for ${game.id}: ${err?.message || err}; ranks not found.`);
    return false;
  }
}
