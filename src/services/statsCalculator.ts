import { Game, UserStatsSummary, AggregatedPlayerStat, AggregatedTeamStat } from '../types';

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

  // Basketball seasons: Aug - Dec is start of year-(year+1), Jan - Jul is end of (year-1)-year
  if (month >= 8) {
    const nextYear2Digits = String((year + 1) % 100).padStart(2, '0');
    return `${year}-${nextYear2Digits}`;
  } else {
    const currentYear2Digits = String(year % 100).padStart(2, '0');
    return `${year - 1}-${currentYear2Digits}`;
  }
}

export function computeStatsSummaryClient(games: Game[]): UserStatsSummary {
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
