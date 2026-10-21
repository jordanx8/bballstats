export type SourceType = 'nba' | 'cbb' | 'wnba' | 'sports-reference';

export interface PlayerStats {
  name: string;
  starter: boolean;
  mp?: string; // Minutes played
  fg: number;
  fga: number;
  fgPct: number | null;
  fg3: number;
  fg3a: number;
  fg3Pct: number | null;
  ft: number;
  fta: number;
  ftPct: number | null;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pts: number;
  plusMinus?: number | null;
  dnpReason?: string;
}

export interface TeamTotals {
  mp?: string;
  fg: number;
  fga: number;
  fgPct: number | null;
  fg3: number;
  fg3a: number;
  fg3Pct: number | null;
  ft: number;
  fta: number;
  ftPct: number | null;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pts: number;
}

export interface TeamGameData {
  name: string;
  shortName: string;
  score: number;
  record?: string;
  lineScores: number[];
  players: PlayerStats[];
  totals?: TeamTotals;
}

export interface Game {
  id: string;
  sourceUrl: string;
  sourceType: SourceType;
  date: string; // YYYY-MM-DD or formatted
  formattedDate: string;
  time?: string;
  arena?: string;
  city?: string;
  attendance?: number | string;
  awayTeam: TeamGameData;
  homeTeam: TeamGameData;
  winner: 'home' | 'away';
  isOvertime?: boolean;
  notes?: string;
  submittedAt: string;
}

export interface AggregatedTeamStat {
  teamName: string;
  gamesSeen: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsScoredTotal: number;
  avgPointsScored: number;
  asHomeCount: number;
  asAwayCount: number;
}

export interface AggregatedPlayerStat {
  playerName: string;
  gamesSeen: number;
  teamsPlayedFor: string[];
  totalPts: number;
  avgPts: number;
  totalReb: number;
  avgReb: number;
  totalAst: number;
  avgAst: number;
  totalStl: number;
  totalBlk: number;
  total3pm: number;
  highScore: number;
  highScoreGameId?: string;
  highScoreMatchup?: string;
}

export interface UserStatsSummary {
  totalGames: number;
  totalPointsSeen: number;
  avgPointsPerGame: number;
  topTeamsSeen: AggregatedTeamStat[];
  topPlayersSeen: AggregatedPlayerStat[];
  topScoringPerformances: {
    playerName: string;
    points: number;
    gameId: string;
    gameDate: string;
    matchup: string;
    teamName: string;
  }[];
  venuesSeen: { arena: string; count: number }[];
  leaguesSeen: { league: string; count: number }[];
}
