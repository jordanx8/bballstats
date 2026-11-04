import { Game, PlayerStats } from '../types';
import { getGameSeason } from './statsCalculator';

export type LeagueKey = 'nba' | 'wnba' | 'ncaa';

export function leagueOf(game: Game): LeagueKey {
  if (game.sourceType === 'nba') return 'nba';
  if (game.sourceType === 'wnba') return 'wnba';
  return 'ncaa';
}

export const LEAGUE_LABELS: Record<LeagueKey, string> = {
  nba: 'NBA',
  wnba: 'WNBA',
  ncaa: 'NCAA',
};

/* ------------------------------------------------------------------ */
/* Single-game performance leaderboards (Dashboard tabs)               */
/* ------------------------------------------------------------------ */

export type PerformanceStatKey =
  | 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'fg3' | 'fg3a'
  | 'fg' | 'fga' | 'ft' | 'fta' | 'orb' | 'tov';

export const PERFORMANCE_STATS: { key: PerformanceStatKey; label: string; short: string }[] = [
  { key: 'pts', label: 'Points', short: 'PTS' },
  { key: 'trb', label: 'Rebounds', short: 'REB' },
  { key: 'ast', label: 'Assists', short: 'AST' },
  { key: 'stl', label: 'Steals', short: 'STL' },
  { key: 'blk', label: 'Blocks', short: 'BLK' },
  { key: 'fg3', label: '3PM', short: '3PM' },
  { key: 'fg3a', label: '3PA', short: '3PA' },
  { key: 'fg', label: 'FGM', short: 'FGM' },
  { key: 'fga', label: 'FGA', short: 'FGA' },
  { key: 'ft', label: 'FTM', short: 'FTM' },
  { key: 'fta', label: 'FTA', short: 'FTA' },
  { key: 'orb', label: 'Off. Reb', short: 'OREB' },
  { key: 'tov', label: 'Turnovers', short: 'TOV' },
];

export interface GamePerformance {
  playerName: string;
  teamName: string;
  gameId: string;
  gameDate: string;
  matchup: string;
  value: number;
  /** Compact context line, e.g. "FG 10-18 · 3P 4-8". */
  detail: string;
}

export function computeTopPerformances(
  games: Game[],
  stat: PerformanceStatKey,
  limit = 10,
): GamePerformance[] {
  const all: GamePerformance[] = [];

  for (const game of games) {
    const matchup = `${game.awayTeam.name} vs. ${game.homeTeam.name}`;
    const seen = new Set<string>();
    for (const team of [game.awayTeam, game.homeTeam]) {
      for (const p of team.players) {
        if (!p.name || p.dnpReason) continue;
        const name = p.name.trim();
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const value = p[stat];
        if (typeof value !== 'number' || value <= 0) continue;
        all.push({
          playerName: name,
          teamName: team.name,
          gameId: game.id,
          gameDate: game.formattedDate || game.date,
          matchup,
          value,
          detail: `${p.pts} pts · ${p.trb} reb · ${p.ast} ast`,
        });
      }
    }
  }

  all.sort((a, b) => b.value - a.value || b.gameId.localeCompare(a.gameId));
  return all.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Full player leaderboard                                             */
/* ------------------------------------------------------------------ */

export interface PlayerLeaderboardRow {
  playerName: string;
  teams: string[];
  leagues: LeagueKey[];
  seasons: string[];
  gamesSeen: number;
  pts: number;
  trb: number;
  ast: number;
  stl: number;
  blk: number;
  fg3: number;
  fg3a: number;
  fg: number;
  fga: number;
  ft: number;
  fta: number;
  tov: number;
  highPts: number;
  highPtsGameId?: string;
  lastSeen: string;
}

type Acc = Omit<PlayerLeaderboardRow, 'teams' | 'leagues' | 'seasons'> & {
  teams: Set<string>;
  leagues: Set<LeagueKey>;
  seasons: Set<string>;
};

export function computePlayerLeaderboard(games: Game[]): PlayerLeaderboardRow[] {
  const map = new Map<string, Acc>();

  for (const game of games) {
    const league = leagueOf(game);
    const season = getGameSeason(game.date, game.sourceType);
    const seen = new Set<string>();

    for (const team of [game.awayTeam, game.homeTeam]) {
      for (const p of team.players as PlayerStats[]) {
        if (!p.name || p.dnpReason) continue;
        const name = p.name.trim();
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const row =
          map.get(name) ??
          ({
            playerName: name,
            teams: new Set<string>(),
            leagues: new Set<LeagueKey>(),
            seasons: new Set<string>(),
            gamesSeen: 0,
            pts: 0, trb: 0, ast: 0, stl: 0, blk: 0,
            fg3: 0, fg3a: 0, fg: 0, fga: 0, ft: 0, fta: 0, tov: 0,
            highPts: 0,
            lastSeen: '',
          } as Acc);

        row.gamesSeen += 1;
        row.teams.add(team.name);
        row.leagues.add(league);
        row.seasons.add(season);
        row.pts += p.pts; row.trb += p.trb; row.ast += p.ast;
        row.stl += p.stl; row.blk += p.blk; row.tov += p.tov;
        row.fg3 += p.fg3; row.fg3a += p.fg3a;
        row.fg += p.fg; row.fga += p.fga;
        row.ft += p.ft; row.fta += p.fta;
        if (p.pts > row.highPts) {
          row.highPts = p.pts;
          row.highPtsGameId = game.id;
        }
        if (game.date > row.lastSeen) row.lastSeen = game.date;
        map.set(name, row);
      }
    }
  }

  return Array.from(map.values()).map(r => ({
    ...r,
    teams: Array.from(r.teams),
    leagues: Array.from(r.leagues),
    seasons: Array.from(r.seasons),
  }));
}

/* ------------------------------------------------------------------ */
/* Full team leaderboard                                               */
/* ------------------------------------------------------------------ */

export interface TeamLeaderboardRow {
  teamName: string;
  league: LeagueKey;
  seasons: string[];
  gamesSeen: number;
  wins: number;
  losses: number;
  winPct: number;
  home: number;
  away: number;
  pointsFor: number;
  pointsAgainst: number;
  ppg: number;
  oppPpg: number;
  margin: number;
  lastSeen: string;
}

export function computeTeamLeaderboard(games: Game[]): TeamLeaderboardRow[] {
  const map = new Map<string, TeamLeaderboardRow & { seasonSet: Set<string> }>();

  for (const game of games) {
    const league = leagueOf(game);
    const season = getGameSeason(game.date, game.sourceType);

    const sides = [
      { team: game.awayTeam, opp: game.homeTeam, isHome: false, won: game.winner === 'away' },
      { team: game.homeTeam, opp: game.awayTeam, isHome: true, won: game.winner === 'home' },
    ];

    for (const { team, opp, isHome, won } of sides) {
      const row =
        map.get(team.name) ??
        {
          teamName: team.name,
          league,
          seasons: [],
          seasonSet: new Set<string>(),
          gamesSeen: 0, wins: 0, losses: 0, winPct: 0,
          home: 0, away: 0,
          pointsFor: 0, pointsAgainst: 0, ppg: 0, oppPpg: 0, margin: 0,
          lastSeen: '',
        };

      row.gamesSeen += 1;
      if (won) row.wins += 1; else row.losses += 1;
      if (isHome) row.home += 1; else row.away += 1;
      row.pointsFor += team.score;
      row.pointsAgainst += opp.score;
      row.seasonSet.add(season);
      if (game.date > row.lastSeen) row.lastSeen = game.date;
      map.set(team.name, row);
    }
  }

  return Array.from(map.values()).map(({ seasonSet, ...r }) => ({
    ...r,
    seasons: Array.from(seasonSet),
    winPct: r.gamesSeen ? r.wins / r.gamesSeen : 0,
    ppg: r.gamesSeen ? r.pointsFor / r.gamesSeen : 0,
    oppPpg: r.gamesSeen ? r.pointsAgainst / r.gamesSeen : 0,
    margin: r.gamesSeen ? (r.pointsFor - r.pointsAgainst) / r.gamesSeen : 0,
  }));
}
