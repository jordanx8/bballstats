import { Game, PlayerStats } from '../types';
import { getGameSeason } from './statsCalculator';
import { LeagueKey, leagueOf } from './leaderboards';

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export function gameSeason(game: Game): string {
  return getGameSeason(game.date, game.sourceType);
}

const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

const pct = (made: number, att: number) => (att > 0 ? made / att : null);

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

export interface PlayerGameLogEntry {
  gameId: string;
  date: string;
  formattedDate: string;
  season: string;
  league: LeagueKey;
  teamName: string;
  opponent: string;
  isHome: boolean;
  won: boolean;
  scoreLine: string;
  stats: PlayerStats;
}

export interface PlayerTeamSplit {
  teamName: string;
  games: number;
  pts: number;
  trb: number;
  ast: number;
}

export interface PlayerDetailData {
  playerName: string;
  log: PlayerGameLogEntry[];
  gamesSeen: number;
  wins: number;
  losses: number;
  teams: PlayerTeamSplit[];
  seasons: string[];
  leagues: LeagueKey[];
  totals: Record<'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'tov' | 'fg' | 'fga' | 'fg3' | 'fg3a' | 'ft' | 'fta', number>;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  highs: { key: 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'fg3'; label: string; value: number; gameId: string }[];
  doubleDoubles: number;
  tripleDoubles: number;
  twentyPointGames: number;
}

export function computePlayerDetail(games: Game[], playerName: string): PlayerDetailData | null {
  const target = playerName.trim().toLowerCase();
  const log: PlayerGameLogEntry[] = [];

  for (const game of games) {
    const sides = [
      { team: game.awayTeam, opp: game.homeTeam, isHome: false, won: game.winner === 'away' },
      { team: game.homeTeam, opp: game.awayTeam, isHome: true, won: game.winner === 'home' },
    ];
    let found = false;
    for (const { team, opp, isHome, won } of sides) {
      if (found) break;
      const stats = team.players.find(p => !p.dnpReason && p.name?.trim().toLowerCase() === target);
      if (!stats) continue;
      found = true;
      log.push({
        gameId: game.id,
        date: game.date,
        formattedDate: game.formattedDate || game.date,
        season: gameSeason(game),
        league: leagueOf(game),
        teamName: team.name,
        opponent: opp.name,
        isHome,
        won,
        scoreLine: `${won ? 'W' : 'L'} ${team.score}-${opp.score}`,
        stats,
      });
    }
  }

  if (log.length === 0) return null;
  log.sort(byDateDesc);

  const totals = { pts: 0, trb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fg: 0, fga: 0, fg3: 0, fg3a: 0, ft: 0, fta: 0 };
  const teamMap = new Map<string, PlayerTeamSplit>();
  let doubleDoubles = 0;
  let tripleDoubles = 0;
  let twentyPointGames = 0;

  for (const e of log) {
    const s = e.stats;
    for (const k of Object.keys(totals) as (keyof typeof totals)[]) totals[k] += s[k];

    const t = teamMap.get(e.teamName) ?? { teamName: e.teamName, games: 0, pts: 0, trb: 0, ast: 0 };
    t.games += 1; t.pts += s.pts; t.trb += s.trb; t.ast += s.ast;
    teamMap.set(e.teamName, t);

    const cats = [s.pts, s.trb, s.ast, s.stl, s.blk].filter(v => v >= 10).length;
    if (cats >= 2) doubleDoubles += 1;
    if (cats >= 3) tripleDoubles += 1;
    if (s.pts >= 20) twentyPointGames += 1;
  }

  const best = (key: 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'fg3', label: string) => {
    let top = log[0];
    for (const e of log) if (e.stats[key] > top.stats[key]) top = e;
    return { key, label, value: top.stats[key], gameId: top.gameId };
  };

  return {
    playerName: log[0].stats.name.trim(),
    log,
    gamesSeen: log.length,
    wins: log.filter(e => e.won).length,
    losses: log.filter(e => !e.won).length,
    teams: Array.from(teamMap.values()).sort((a, b) => b.games - a.games),
    seasons: Array.from(new Set(log.map(e => e.season))).sort((a, b) => b.localeCompare(a)),
    leagues: Array.from(new Set(log.map(e => e.league))),
    totals,
    fgPct: pct(totals.fg, totals.fga),
    fg3Pct: pct(totals.fg3, totals.fg3a),
    ftPct: pct(totals.ft, totals.fta),
    highs: [
      best('pts', 'Points'), best('trb', 'Rebounds'), best('ast', 'Assists'),
      best('stl', 'Steals'), best('blk', 'Blocks'), best('fg3', '3-Pointers'),
    ],
    doubleDoubles,
    tripleDoubles,
    twentyPointGames,
  };
}

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export interface TeamGameEntry {
  gameId: string;
  date: string;
  formattedDate: string;
  season: string;
  league: LeagueKey;
  opponent: string;
  isHome: boolean;
  won: boolean;
  teamScore: number;
  oppScore: number;
  arena?: string;
  overtime: boolean;
}

export interface TeamPlayerRow {
  playerName: string;
  games: number;
  pts: number;
  trb: number;
  ast: number;
  highPts: number;
}

export interface TeamSeasonRow {
  season: string;
  games: number;
  wins: number;
  losses: number;
  ppg: number;
}

export interface TeamOpponentRow {
  opponent: string;
  games: number;
  wins: number;
  losses: number;
}

export interface TeamDetailData {
  teamName: string;
  league: LeagueKey;
  log: TeamGameEntry[];
  gamesSeen: number;
  wins: number;
  losses: number;
  winPct: number;
  homeRecord: { w: number; l: number };
  awayRecord: { w: number; l: number };
  ppg: number;
  oppPpg: number;
  margin: number;
  bestWin: TeamGameEntry | null;
  worstLoss: TeamGameEntry | null;
  highScore: TeamGameEntry | null;
  seasons: TeamSeasonRow[];
  players: TeamPlayerRow[];
  opponents: TeamOpponentRow[];
  venues: { arena: string; count: number }[];
}

export function computeTeamDetail(games: Game[], teamName: string): TeamDetailData | null {
  const log: TeamGameEntry[] = [];
  const playerMap = new Map<string, TeamPlayerRow>();

  for (const game of games) {
    const sides = [
      { team: game.awayTeam, opp: game.homeTeam, isHome: false, won: game.winner === 'away' },
      { team: game.homeTeam, opp: game.awayTeam, isHome: true, won: game.winner === 'home' },
    ];
    for (const { team, opp, isHome, won } of sides) {
      if (team.name !== teamName) continue;
      log.push({
        gameId: game.id,
        date: game.date,
        formattedDate: game.formattedDate || game.date,
        season: gameSeason(game),
        league: leagueOf(game),
        opponent: opp.name,
        isHome,
        won,
        teamScore: team.score,
        oppScore: opp.score,
        arena: game.arena,
        overtime: !!game.isOvertime,
      });

      const seen = new Set<string>();
      for (const p of team.players) {
        if (!p.name || p.dnpReason) continue;
        const name = p.name.trim();
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const row = playerMap.get(name) ?? { playerName: name, games: 0, pts: 0, trb: 0, ast: 0, highPts: 0 };
        row.games += 1; row.pts += p.pts; row.trb += p.trb; row.ast += p.ast;
        row.highPts = Math.max(row.highPts, p.pts);
        playerMap.set(name, row);
      }
    }
  }

  if (log.length === 0) return null;
  log.sort(byDateDesc);

  const wins = log.filter(e => e.won).length;
  const n = log.length;
  const pointsFor = log.reduce((s, e) => s + e.teamScore, 0);
  const pointsAgainst = log.reduce((s, e) => s + e.oppScore, 0);
  const record = (home: boolean) => {
    const g = log.filter(e => e.isHome === home);
    return { w: g.filter(e => e.won).length, l: g.filter(e => !e.won).length };
  };

  const seasonMap = new Map<string, { games: number; wins: number; pts: number }>();
  const oppMap = new Map<string, TeamOpponentRow>();
  const venueMap = new Map<string, number>();
  for (const e of log) {
    const s = seasonMap.get(e.season) ?? { games: 0, wins: 0, pts: 0 };
    s.games += 1; s.pts += e.teamScore; if (e.won) s.wins += 1;
    seasonMap.set(e.season, s);

    const o = oppMap.get(e.opponent) ?? { opponent: e.opponent, games: 0, wins: 0, losses: 0 };
    o.games += 1; if (e.won) o.wins += 1; else o.losses += 1;
    oppMap.set(e.opponent, o);

    if (e.arena) venueMap.set(e.arena, (venueMap.get(e.arena) ?? 0) + 1);
  }

  const margin = (e: TeamGameEntry) => e.teamScore - e.oppScore;
  const wonGames = log.filter(e => e.won);
  const lostGames = log.filter(e => !e.won);

  return {
    teamName,
    league: log[0].league,
    log,
    gamesSeen: n,
    wins,
    losses: n - wins,
    winPct: wins / n,
    homeRecord: record(true),
    awayRecord: record(false),
    ppg: pointsFor / n,
    oppPpg: pointsAgainst / n,
    margin: (pointsFor - pointsAgainst) / n,
    bestWin: wonGames.length ? wonGames.reduce((a, b) => (margin(b) > margin(a) ? b : a)) : null,
    worstLoss: lostGames.length ? lostGames.reduce((a, b) => (margin(b) < margin(a) ? b : a)) : null,
    highScore: log.reduce((a, b) => (b.teamScore > a.teamScore ? b : a)),
    seasons: Array.from(seasonMap.entries())
      .map(([season, s]) => ({ season, games: s.games, wins: s.wins, losses: s.games - s.wins, ppg: s.pts / s.games }))
      .sort((a, b) => b.season.localeCompare(a.season)),
    players: Array.from(playerMap.values()).sort((a, b) => b.games - a.games || b.pts - a.pts),
    opponents: Array.from(oppMap.values()).sort((a, b) => b.games - a.games || a.opponent.localeCompare(b.opponent)),
    venues: Array.from(venueMap.entries()).map(([arena, count]) => ({ arena, count })).sort((a, b) => b.count - a.count),
  };
}

/* ------------------------------------------------------------------ */
/* Seasons                                                             */
/* ------------------------------------------------------------------ */

export interface SeasonSummary {
  season: string;
  games: Game[];
  gameCount: number;
  totalPoints: number;
  avgPoints: number;
  leagueCounts: { league: LeagueKey; count: number }[];
  teamCount: number;
  playerCount: number;
  venues: { arena: string; count: number }[];
  overtimeGames: number;
  mostSeenPlayer: { playerName: string; games: number } | null;
  topScorer: { playerName: string; points: number; gameId: string; teamName: string } | null;
  highestScoringGame: { gameId: string; total: number; matchup: string } | null;
  mostSeenTeam: { teamName: string; games: number } | null;
}

export function computeSeasonSummaries(games: Game[]): SeasonSummary[] {
  const bySeason = new Map<string, Game[]>();
  for (const g of games) {
    const s = gameSeason(g);
    bySeason.set(s, [...(bySeason.get(s) ?? []), g]);
  }
  return Array.from(bySeason.entries())
    .map(([season, list]) => summarizeSeason(season, list))
    .sort((a, b) => b.season.localeCompare(a.season));
}

export function summarizeSeason(season: string, games: Game[]): SeasonSummary {
  const sorted = [...games].sort(byDateDesc);
  const leagueMap = new Map<LeagueKey, number>();
  const teamGames = new Map<string, number>();
  const playerGames = new Map<string, number>();
  const venueMap = new Map<string, number>();
  let totalPoints = 0;
  let overtimeGames = 0;
  let topScorer: SeasonSummary['topScorer'] = null;
  let highestScoringGame: SeasonSummary['highestScoringGame'] = null;

  for (const g of sorted) {
    const total = g.awayTeam.score + g.homeTeam.score;
    totalPoints += total;
    if (g.isOvertime) overtimeGames += 1;
    const league = leagueOf(g);
    leagueMap.set(league, (leagueMap.get(league) ?? 0) + 1);
    if (g.arena) venueMap.set(g.arena, (venueMap.get(g.arena) ?? 0) + 1);

    const matchup = `${g.awayTeam.name} @ ${g.homeTeam.name}`;
    if (!highestScoringGame || total > highestScoringGame.total) {
      highestScoringGame = { gameId: g.id, total, matchup };
    }

    const seen = new Set<string>();
    for (const team of [g.awayTeam, g.homeTeam]) {
      teamGames.set(team.name, (teamGames.get(team.name) ?? 0) + 1);
      for (const p of team.players) {
        if (!p.name || p.dnpReason) continue;
        const name = p.name.trim();
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        playerGames.set(name, (playerGames.get(name) ?? 0) + 1);
        if (!topScorer || p.pts > topScorer.points) {
          topScorer = { playerName: name, points: p.pts, gameId: g.id, teamName: team.name };
        }
      }
    }
  }

  const top = <T extends string>(m: Map<T, number>) => {
    let best: [T, number] | null = null;
    for (const [k, v] of m) if (!best || v > best[1]) best = [k, v];
    return best;
  };
  const tp = top(playerGames);
  const tt = top(teamGames);

  return {
    season,
    games: sorted,
    gameCount: sorted.length,
    totalPoints,
    avgPoints: sorted.length ? totalPoints / sorted.length : 0,
    leagueCounts: Array.from(leagueMap.entries()).map(([league, count]) => ({ league, count })).sort((a, b) => b.count - a.count),
    teamCount: teamGames.size,
    playerCount: playerGames.size,
    venues: Array.from(venueMap.entries()).map(([arena, count]) => ({ arena, count })).sort((a, b) => b.count - a.count),
    overtimeGames,
    mostSeenPlayer: tp ? { playerName: tp[0], games: tp[1] } : null,
    topScorer,
    highestScoringGame,
    mostSeenTeam: tt ? { teamName: tt[0], games: tt[1] } : null,
  };
}
