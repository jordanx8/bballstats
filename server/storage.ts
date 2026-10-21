import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Game, UserStatsSummary, AggregatedPlayerStat, AggregatedTeamStat } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'games.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadGames(): Game[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Initialize with sample games so new users immediately have rich demo data if they want
      const initialGames = getInitialSampleGames();
      saveGames(initialGames);
      return initialGames;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading games.json:', err);
    return [];
  }
}

export function saveGames(games: Game[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing games.json:', err);
    throw err;
  }
}

export function addGame(game: Game): { game: Game; isNew: boolean } {
  const games = loadGames();
  const existingIdx = games.findIndex(g => g.id === game.id || g.sourceUrl === game.sourceUrl);
  
  if (existingIdx >= 0) {
    // Update existing game
    games[existingIdx] = { ...game, submittedAt: games[existingIdx].submittedAt || game.submittedAt };
    saveGames(games);
    return { game: games[existingIdx], isNew: false };
  } else {
    // Prepend or add new game
    games.unshift(game);
    // Sort chronologically descending
    games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveGames(games);
    return { game, isNew: true };
  }
}

export function deleteGame(id: string): boolean {
  const games = loadGames();
  const filtered = games.filter(g => g.id !== id);
  if (filtered.length !== games.length) {
    saveGames(filtered);
    return true;
  }
  return false;
}

export function getGameSeason(gameDateStr: string, _sourceType?: string): string {
  const d = new Date(gameDateStr);
  let year = d.getFullYear();
  let month = d.getMonth() + 1; // 1-12

  if (isNaN(year) || isNaN(month)) {
    const match = gameDateStr.match(/(\d{4})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    } else {
      const yearMatch = gameDateStr.match(/\b(\d{4})\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
        month = 10;
      } else {
        return 'Unknown Season';
      }
    }
  }

  if (month >= 8) {
    const nextYear2Digits = String((year + 1) % 100).padStart(2, '0');
    return `${year}-${nextYear2Digits}`;
  } else {
    const currentYear2Digits = String(year % 100).padStart(2, '0');
    return `${year - 1}-${currentYear2Digits}`;
  }
}

export function computeStatsSummary(games: Game[]): UserStatsSummary {
  if (games.length === 0) {
    return {
      totalGames: 0,
      totalPointsSeen: 0,
      avgPointsPerGame: 0,
      topTeamsSeen: [],
      topPlayersSeen: [],
      topScoringPerformances: [],
      venuesSeen: [],
      leaguesSeen: [],
    };
  }

  let totalPointsSeen = 0;
  const teamMap = new Map<string, {
    teamName: string;
    gamesSeen: number;
    wins: number;
    losses: number;
    pointsScoredTotal: number;
    asHomeCount: number;
    asAwayCount: number;
  }>();

  const playerMap = new Map<string, {
    playerName: string;
    gamesSeen: number;
    teamsPlayedFor: Set<string>;
    totalPts: number;
    totalReb: number;
    totalAst: number;
    totalStl: number;
    totalBlk: number;
    total3pm: number;
    highScore: number;
    highScoreGameId?: string;
    highScoreMatchup?: string;
  }>();

  const venueMap = new Map<string, number>();
  const leagueMap = new Map<string, number>();
  const allPerformances: {
    playerName: string;
    points: number;
    gameId: string;
    gameDate: string;
    matchup: string;
    teamName: string;
  }[] = [];

  for (const game of games) {
    const totalGamePoints = game.awayTeam.score + game.homeTeam.score;
    totalPointsSeen += totalGamePoints;

    // Venue
    if (game.arena) {
      venueMap.set(game.arena, (venueMap.get(game.arena) || 0) + 1);
    }

    // League
    const leagueLabel = game.sourceType === 'nba' ? 'NBA' : game.sourceType === 'cbb' ? 'NCAA Men\'s (CBB)' : game.sourceType === 'wnba' ? 'WNBA' : 'Other';
    leagueMap.set(leagueLabel, (leagueMap.get(leagueLabel) || 0) + 1);

    // Away Team Stats
    const away = game.awayTeam;
    const home = game.homeTeam;
    const matchupStr = `${away.name} vs. ${home.name}`;

    const updateTeam = (team: typeof away, isHome: boolean, isWinner: boolean) => {
      const entry = teamMap.get(team.name) || {
        teamName: team.name,
        gamesSeen: 0,
        wins: 0,
        losses: 0,
        pointsScoredTotal: 0,
        asHomeCount: 0,
        asAwayCount: 0,
      };
      entry.gamesSeen += 1;
      if (isWinner) entry.wins += 1;
      else entry.losses += 1;
      entry.pointsScoredTotal += team.score;
      if (isHome) entry.asHomeCount += 1;
      else entry.asAwayCount += 1;
      teamMap.set(team.name, entry);
    };

    updateTeam(away, false, game.winner === 'away');
    updateTeam(home, true, game.winner === 'home');

    // Player stats with per-game deduplication
    const playersProcessedInThisGame = new Set<string>();

    const processPlayers = (players: typeof away.players, teamName: string) => {
      for (const p of players) {
        if (!p.name || p.dnpReason) continue;
        const normalizedName = p.name.trim();
        const key = normalizedName.toLowerCase();
        if (playersProcessedInThisGame.has(key)) continue;
        playersProcessedInThisGame.add(key);

        const pEntry = playerMap.get(normalizedName) || {
          playerName: normalizedName,
          gamesSeen: 0,
          teamsPlayedFor: new Set<string>(),
          totalPts: 0,
          totalReb: 0,
          totalAst: 0,
          totalStl: 0,
          totalBlk: 0,
          total3pm: 0,
          highScore: 0,
        };

        pEntry.gamesSeen += 1;
        pEntry.teamsPlayedFor.add(teamName);
        pEntry.totalPts += p.pts;
        pEntry.totalReb += p.trb;
        pEntry.totalAst += p.ast;
        pEntry.totalStl += p.stl;
        pEntry.totalBlk += p.blk;
        pEntry.total3pm += p.fg3;

        if (p.pts > pEntry.highScore) {
          pEntry.highScore = p.pts;
          pEntry.highScoreGameId = game.id;
          pEntry.highScoreMatchup = matchupStr;
        }

        playerMap.set(normalizedName, pEntry);

        if (p.pts > 0) {
          allPerformances.push({
            playerName: normalizedName,
            points: p.pts,
            gameId: game.id,
            gameDate: game.formattedDate || game.date,
            matchup: matchupStr,
            teamName,
          });
        }
      }
    };

    processPlayers(away.players, away.name);
    processPlayers(home.players, home.name);
  }

  // Aggregate Teams
  const topTeamsSeen: AggregatedTeamStat[] = Array.from(teamMap.values())
    .map(t => ({
      ...t,
      winPct: t.gamesSeen > 0 ? Number((t.wins / t.gamesSeen).toFixed(3)) : 0,
      avgPointsScored: t.gamesSeen > 0 ? Number((t.pointsScoredTotal / t.gamesSeen).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.gamesSeen - a.gamesSeen || b.wins - a.wins);

  // Aggregate Players
  const topPlayersSeen: AggregatedPlayerStat[] = Array.from(playerMap.values())
    .map(p => ({
      playerName: p.playerName,
      gamesSeen: p.gamesSeen,
      teamsPlayedFor: Array.from(p.teamsPlayedFor),
      totalPts: p.totalPts,
      avgPts: p.gamesSeen > 0 ? Number((p.totalPts / p.gamesSeen).toFixed(1)) : 0,
      totalReb: p.totalReb,
      avgReb: p.gamesSeen > 0 ? Number((p.totalReb / p.gamesSeen).toFixed(1)) : 0,
      totalAst: p.totalAst,
      avgAst: p.gamesSeen > 0 ? Number((p.totalAst / p.gamesSeen).toFixed(1)) : 0,
      totalStl: p.totalStl,
      totalBlk: p.totalBlk,
      total3pm: p.total3pm,
      highScore: p.highScore,
      highScoreGameId: p.highScoreGameId,
      highScoreMatchup: p.highScoreMatchup,
    }))
    .sort((a, b) => b.gamesSeen - a.gamesSeen || b.totalPts - a.totalPts);

  // Sort Top scoring performances
  const topScoringPerformances = allPerformances
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  // Venues
  const venuesSeen = Array.from(venueMap.entries())
    .map(([arena, count]) => ({ arena, count }))
    .sort((a, b) => b.count - a.count);

  // Leagues
  const leaguesSeen = Array.from(leagueMap.entries())
    .map(([league, count]) => ({ league, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalGames: games.length,
    totalPointsSeen,
    avgPointsPerGame: games.length > 0 ? Number((totalPointsSeen / games.length).toFixed(1)) : 0,
    topTeamsSeen,
    topPlayersSeen,
    topScoringPerformances,
    venuesSeen,
    leaguesSeen,
  };
}

function getInitialSampleGames(): Game[] {
  return [
    {
      id: 'nba-202411110NOP',
      sourceUrl: 'https://www.basketball-reference.com/boxscores/202411110NOP.html',
      sourceType: 'nba',
      date: '2024-11-11',
      formattedDate: 'November 11, 2024',
      arena: 'Smoothie King Center, New Orleans, Louisiana',
      attendance: 16834,
      awayTeam: {
        name: 'Brooklyn Nets',
        shortName: 'BKN',
        score: 107,
        record: '5-6',
        lineScores: [26, 28, 27, 26],
        players: [
          { name: 'Cam Thomas', starter: true, mp: '35:28', fg: 6, fga: 17, fgPct: 0.353, fg3: 2, fg3a: 7, fg3Pct: 0.286, ft: 3, fta: 4, ftPct: 0.75, orb: 0, drb: 7, trb: 7, ast: 2, stl: 0, blk: 0, tov: 1, pf: 2, pts: 17, plusMinus: 4 },
          { name: 'Cameron Johnson', starter: true, mp: '31:40', fg: 6, fga: 11, fgPct: 0.545, fg3: 2, fg3a: 5, fg3Pct: 0.4, ft: 1, fta: 1, ftPct: 1.0, orb: 0, drb: 1, trb: 1, ast: 2, stl: 2, blk: 0, tov: 1, pf: 2, pts: 15, plusMinus: 2 },
          { name: 'Dennis Schröder', starter: true, mp: '32:15', fg: 4, fga: 12, fgPct: 0.333, fg3: 2, fg3a: 6, fg3Pct: 0.333, ft: 4, fta: 4, ftPct: 1.0, orb: 0, drb: 1, trb: 1, ast: 2, stl: 1, blk: 0, tov: 3, pf: 4, pts: 14, plusMinus: 0 },
          { name: 'Nic Claxton', starter: true, mp: '24:50', fg: 6, fga: 8, fgPct: 0.75, fg3: 0, fg3a: 0, fg3Pct: null, ft: 1, fta: 2, ftPct: 0.5, orb: 3, drb: 6, trb: 9, ast: 3, stl: 1, blk: 1, tov: 2, pf: 3, pts: 13, plusMinus: 1 },
          { name: 'Dorian Finney-Smith', starter: true, mp: '28:10', fg: 3, fga: 6, fgPct: 0.5, fg3: 3, fg3a: 5, fg3Pct: 0.6, ft: 1, fta: 2, ftPct: 0.5, orb: 2, drb: 1, trb: 3, ast: 1, stl: 0, blk: 0, tov: 0, pf: 2, pts: 10, plusMinus: 6 },
          { name: 'Jalen Wilson', starter: false, mp: '21:30', fg: 3, fga: 7, fgPct: 0.429, fg3: 2, fg3a: 5, fg3Pct: 0.4, ft: 2, fta: 2, ftPct: 1.0, orb: 1, drb: 3, trb: 4, ast: 1, stl: 0, blk: 0, tov: 0, pf: 1, pts: 10, plusMinus: 1 },
          { name: 'Noah Clowney', starter: false, mp: '17:20', fg: 3, fga: 5, fgPct: 0.6, fg3: 2, fg3a: 4, fg3Pct: 0.5, ft: 0, fta: 0, ftPct: null, orb: 2, drb: 5, trb: 7, ast: 0, stl: 0, blk: 1, tov: 1, pf: 3, pts: 8, plusMinus: 3 },
          { name: 'Ziaire Williams', starter: false, mp: '19:40', fg: 2, fga: 6, fgPct: 0.333, fg3: 1, fg3a: 3, fg3Pct: 0.333, ft: 2, fta: 2, ftPct: 1.0, orb: 0, drb: 4, trb: 4, ast: 1, stl: 1, blk: 0, tov: 1, pf: 1, pts: 7, plusMinus: 4 },
          { name: 'Shake Milton', starter: false, mp: '14:20', fg: 3, fga: 4, fgPct: 0.75, fg3: 2, fg3a: 3, fg3Pct: 0.667, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 0, trb: 0, ast: 1, stl: 0, blk: 0, tov: 0, pf: 0, pts: 8, plusMinus: 2 },
          { name: 'Keon Johnson', starter: false, mp: '14:47', fg: 1, fga: 3, fgPct: 0.333, fg3: 1, fg3a: 2, fg3Pct: 0.5, ft: 1, fta: 2, ftPct: 0.5, orb: 0, drb: 1, trb: 1, ast: 1, stl: 0, blk: 0, tov: 1, pf: 1, pts: 4, plusMinus: 2 }
        ],
        totals: { mp: '240', fg: 37, fga: 82, fgPct: 0.451, fg3: 19, fg3a: 41, fg3Pct: 0.463, ft: 14, fta: 19, ftPct: 0.737, orb: 8, drb: 30, trb: 38, ast: 22, stl: 5, blk: 2, tov: 10, pf: 19, pts: 107 }
      },
      homeTeam: {
        name: 'New Orleans Pelicans',
        shortName: 'NOP',
        score: 105,
        record: '3-8',
        lineScores: [22, 34, 29, 20],
        players: [
          { name: 'Brandon Ingram', starter: true, mp: '34:40', fg: 10, fga: 24, fgPct: 0.417, fg3: 1, fg3a: 5, fg3Pct: 0.2, ft: 3, fta: 4, ftPct: 0.75, orb: 1, drb: 4, trb: 5, ast: 9, stl: 1, blk: 0, tov: 3, pf: 3, pts: 24, plusMinus: -1 },
          { name: 'Trey Murphy III', starter: true, mp: '26:15', fg: 4, fga: 14, fgPct: 0.286, fg3: 2, fg3a: 6, fg3Pct: 0.333, ft: 4, fta: 4, ftPct: 1.0, orb: 1, drb: 4, trb: 5, ast: 2, stl: 0, blk: 1, tov: 1, pf: 1, pts: 14, plusMinus: -4 },
          { name: 'Yves Missi', starter: true, mp: '27:05', fg: 6, fga: 7, fgPct: 0.857, fg3: 0, fg3a: 0, fg3Pct: null, ft: 5, fta: 7, ftPct: 0.714, orb: 7, drb: 4, trb: 11, ast: 0, stl: 2, blk: 1, tov: 0, pf: 2, pts: 17, plusMinus: 5 },
          { name: 'Brandon Boston Jr.', starter: true, mp: '36:30', fg: 3, fga: 10, fgPct: 0.3, fg3: 1, fg3a: 4, fg3Pct: 0.25, ft: 0, fta: 0, ftPct: null, orb: 1, drb: 6, trb: 7, ast: 10, stl: 3, blk: 0, tov: 3, pf: 2, pts: 7, plusMinus: -2 },
          { name: 'Jose Alvarado', starter: true, mp: '21:10', fg: 2, fga: 6, fgPct: 0.333, fg3: 0, fg3a: 3, fg3Pct: 0.0, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 0, trb: 0, ast: 3, stl: 1, blk: 0, tov: 1, pf: 2, pts: 4, plusMinus: 1 },
          { name: 'Jeremiah Robinson-Earl', starter: false, mp: '26:20', fg: 6, fga: 9, fgPct: 0.667, fg3: 1, fg3a: 2, fg3Pct: 0.5, ft: 2, fta: 3, ftPct: 0.667, orb: 3, drb: 4, trb: 7, ast: 1, stl: 0, blk: 0, tov: 1, pf: 1, pts: 15, plusMinus: -3 },
          { name: 'Jaylen Nowell', starter: false, mp: '20:15', fg: 5, fga: 10, fgPct: 0.5, fg3: 1, fg3a: 2, fg3Pct: 0.5, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 2, trb: 2, ast: 1, stl: 0, blk: 0, tov: 0, pf: 0, pts: 11, plusMinus: -3 },
          { name: 'Javonte Green', starter: false, mp: '21:50', fg: 3, fga: 5, fgPct: 0.6, fg3: 1, fg3a: 2, fg3Pct: 0.5, ft: 0, fta: 0, ftPct: null, orb: 1, drb: 1, trb: 2, ast: 0, stl: 0, blk: 0, tov: 0, pf: 3, pts: 7, plusMinus: -4 },
          { name: 'Jamal Cain', starter: false, mp: '15:50', fg: 3, fga: 4, fgPct: 0.75, fg3: 0, fg3a: 0, fg3Pct: null, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 2, trb: 2, ast: 0, stl: 0, blk: 1, tov: 0, pf: 1, pts: 6, plusMinus: 1 }
        ],
        totals: { mp: '240', fg: 42, fga: 89, fgPct: 0.472, fg3: 6, fg3a: 24, fg3Pct: 0.25, ft: 15, fta: 20, ftPct: 0.75, orb: 14, drb: 27, trb: 41, ast: 26, stl: 7, blk: 3, tov: 9, pf: 15, pts: 105 }
      },
      winner: 'away',
      isOvertime: false,
      notes: 'Close 2-point finish! Cam Thomas clutch shots in the 4th.',
      submittedAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      id: 'cbb-2024-11-06-20-louisiana-state',
      sourceUrl: 'https://www.sports-reference.com/cbb/boxscores/2024-11-06-20-louisiana-state.html',
      sourceType: 'cbb',
      date: '2024-11-06',
      formattedDate: 'November 6, 2024',
      arena: 'Pete Maravich Assembly Center, Baton Rouge, Louisiana',
      attendance: 7531,
      awayTeam: {
        name: 'Louisiana-Monroe',
        shortName: 'ULM',
        score: 60,
        record: '0-2',
        lineScores: [27, 33],
        players: [
          { name: 'Jerry Ngopot', starter: true, mp: '28', fg: 4, fga: 8, fgPct: 0.5, fg3: 0, fg3a: 0, fg3Pct: null, ft: 2, fta: 2, ftPct: 1.0, orb: 3, drb: 4, trb: 7, ast: 0, stl: 1, blk: 0, tov: 2, pf: 3, pts: 10 },
          { name: 'Coltie Young', starter: true, mp: '31', fg: 3, fga: 9, fgPct: 0.333, fg3: 3, fg3a: 8, fg3Pct: 0.375, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 3, trb: 3, ast: 1, stl: 0, blk: 0, tov: 1, pf: 2, pts: 9 },
          { name: 'Jalen Bolden', starter: true, mp: '24', fg: 2, fga: 7, fgPct: 0.286, fg3: 1, fg3a: 3, fg3Pct: 0.333, ft: 3, fta: 4, ftPct: 0.75, orb: 1, drb: 4, trb: 5, ast: 2, stl: 0, blk: 0, tov: 3, pf: 2, pts: 8 },
          { name: 'Jacob Wilson', starter: true, mp: '25', fg: 2, fga: 6, fgPct: 0.333, fg3: 1, fg3a: 2, fg3Pct: 0.5, ft: 2, fta: 2, ftPct: 1.0, orb: 0, drb: 2, trb: 2, ast: 3, stl: 1, blk: 0, tov: 4, pf: 1, pts: 7 },
          { name: 'Makai Willis', starter: true, mp: '22', fg: 3, fga: 7, fgPct: 0.429, fg3: 0, fg3a: 1, fg3Pct: 0.0, ft: 1, fta: 2, ftPct: 0.5, orb: 2, drb: 3, trb: 5, ast: 0, stl: 0, blk: 1, tov: 2, pf: 4, pts: 7 },
          { name: 'Ta\'Vance Minix', starter: false, mp: '19', fg: 3, fga: 5, fgPct: 0.6, fg3: 0, fg3a: 0, fg3Pct: null, ft: 1, fta: 2, ftPct: 0.5, orb: 1, drb: 2, trb: 3, ast: 1, stl: 0, blk: 0, tov: 1, pf: 1, pts: 7 },
          { name: 'Micah Thomas', starter: false, mp: '18', fg: 2, fga: 5, fgPct: 0.4, fg3: 1, fg3a: 3, fg3Pct: 0.333, ft: 1, fta: 2, ftPct: 0.5, orb: 0, drb: 1, trb: 1, ast: 1, stl: 1, blk: 0, tov: 1, pf: 1, pts: 6 },
          { name: 'Kelton Williams', starter: false, mp: '15', fg: 1, fga: 4, fgPct: 0.25, fg3: 0, fg3a: 1, fg3Pct: 0.0, ft: 2, fta: 2, ftPct: 1.0, orb: 0, drb: 1, trb: 1, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pts: 4 },
          { name: 'Renars Sondors', starter: false, mp: '18', fg: 1, fga: 3, fgPct: 0.333, fg3: 0, fg3a: 1, fg3Pct: 0.0, ft: 0, fta: 0, ftPct: null, orb: 1, drb: 1, trb: 2, ast: 0, stl: 0, blk: 0, tov: 1, pf: 1, pts: 2 }
        ],
        totals: { mp: '200', fg: 21, fga: 54, fgPct: 0.389, fg3: 6, fg3a: 19, fg3Pct: 0.316, ft: 12, fta: 16, ftPct: 0.75, orb: 8, drb: 21, trb: 29, ast: 8, stl: 3, blk: 1, tov: 15, pf: 15, pts: 60 }
      },
      homeTeam: {
        name: 'LSU',
        shortName: 'LSU',
        score: 95,
        record: '1-0',
        lineScores: [50, 45],
        players: [
          { name: 'Cam Carter', starter: true, mp: '25', fg: 7, fga: 11, fgPct: 0.636, fg3: 4, fg3a: 6, fg3Pct: 0.667, ft: 3, fta: 3, ftPct: 1.0, orb: 0, drb: 2, trb: 2, ast: 3, stl: 1, blk: 0, tov: 1, pf: 1, pts: 21 },
          { name: 'Jordan Sears', starter: true, mp: '22', fg: 5, fga: 8, fgPct: 0.625, fg3: 3, fg3a: 5, fg3Pct: 0.6, ft: 1, fta: 2, ftPct: 0.5, orb: 0, drb: 3, trb: 3, ast: 5, stl: 2, blk: 0, tov: 0, pf: 1, pts: 14 },
          { name: 'Daimion Collins', starter: true, mp: '18', fg: 4, fga: 6, fgPct: 0.667, fg3: 0, fg3a: 0, fg3Pct: null, ft: 3, fta: 4, ftPct: 0.75, orb: 2, drb: 4, trb: 6, ast: 1, stl: 1, blk: 2, tov: 0, pf: 1, pts: 11 },
          { name: 'Jalen Reed', starter: true, mp: '20', fg: 4, fga: 7, fgPct: 0.571, fg3: 0, fg3a: 1, fg3Pct: 0.0, ft: 2, fta: 3, ftPct: 0.667, orb: 3, drb: 4, trb: 7, ast: 2, stl: 1, blk: 1, tov: 2, pf: 2, pts: 10 },
          { name: 'Vyctorius Miller', starter: true, mp: '22', fg: 3, fga: 6, fgPct: 0.5, fg3: 1, fg3a: 3, fg3Pct: 0.333, ft: 2, fta: 2, ftPct: 1.0, orb: 0, drb: 3, trb: 3, ast: 2, stl: 0, blk: 0, tov: 1, pf: 1, pts: 9 },
          { name: 'Curtis Givens III', starter: false, mp: '21', fg: 4, fga: 7, fgPct: 0.571, fg3: 2, fg3a: 4, fg3Pct: 0.5, ft: 2, fta: 2, ftPct: 1.0, orb: 1, drb: 2, trb: 3, ast: 4, stl: 1, blk: 0, tov: 1, pf: 2, pts: 12 },
          { name: 'Robert Miller III', starter: false, mp: '16', fg: 3, fga: 5, fgPct: 0.6, fg3: 0, fg3a: 0, fg3Pct: null, ft: 1, fta: 2, ftPct: 0.5, orb: 2, drb: 4, trb: 6, ast: 0, stl: 0, blk: 1, tov: 0, pf: 2, pts: 7 },
          { name: 'Derek Fountain', starter: false, mp: '19', fg: 2, fga: 4, fgPct: 0.5, fg3: 0, fg3a: 1, fg3Pct: 0.0, ft: 1, fta: 1, ftPct: 1.0, orb: 1, drb: 3, trb: 4, ast: 1, stl: 1, blk: 0, tov: 1, pf: 1, pts: 5 },
          { name: 'Corey Chest', starter: false, mp: '14', fg: 2, fga: 3, fgPct: 0.667, fg3: 0, fg3a: 0, fg3Pct: null, ft: 0, fta: 0, ftPct: null, orb: 1, drb: 2, trb: 3, ast: 0, stl: 0, blk: 1, tov: 0, pf: 2, pts: 4 },
          { name: 'Noah Boyde', starter: false, mp: '12', fg: 1, fga: 2, fgPct: 0.5, fg3: 0, fg3a: 0, fg3Pct: null, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 1, trb: 1, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pts: 2 },
          { name: 'Trace Young', starter: false, mp: '11', fg: 0, fga: 2, fgPct: 0.0, fg3: 0, fg3a: 2, fg3Pct: 0.0, ft: 0, fta: 0, ftPct: null, orb: 0, drb: 0, trb: 0, ast: 1, stl: 0, blk: 0, tov: 0, pf: 0, pts: 0 }
        ],
        totals: { mp: '200', fg: 35, fga: 61, fgPct: 0.574, fg3: 10, fg3a: 22, fg3Pct: 0.455, ft: 15, fta: 21, ftPct: 0.714, orb: 10, drb: 28, trb: 38, ast: 19, stl: 7, blk: 5, tov: 6, pf: 13, pts: 95 }
      },
      winner: 'home',
      isOvertime: false,
      notes: 'Season opener at the PMAC! Dominant second half run by LSU.',
      submittedAt: new Date(Date.now() - 86400000 * 25).toISOString()
    }
  ];
}
