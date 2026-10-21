import React, { useState } from 'react';
import { Game, UserStatsSummary } from '../types';
import { 
  Trophy, Flame, Users, Shield, MapPin, 
  ArrowRight, ChevronRight, Zap
} from 'lucide-react';

interface DashboardProps {
  summary: UserStatsSummary | null;
  games: Game[];
  onSelectGame: (game: Game) => void;
  onFilterByTeam: (teamName: string) => void;
  onFilterByPlayer: (playerName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  games,
  onSelectGame,
  onFilterByTeam,
  onFilterByPlayer,
}) => {
  const [playerTab, setPlayerTab] = useState<'most_seen' | 'scoring' | 'playmaking' | 'rebounding'>('most_seen');
  const [teamTab, setTeamTab] = useState<'most_seen' | 'highest_winpct' | 'scoring'>('most_seen');

  if (!summary || games.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-[#0C2340] border border-[#B4975A]/40 rounded-3xl mx-auto flex items-center justify-center mb-6 text-3xl shadow-xl shadow-[#C69214]/10">
          🏀
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No Games Logged Yet</h2>
        <p className="text-slate-300/80 max-w-md mx-auto mb-6 text-sm leading-relaxed">
          Log games you attend by triggering the <strong className="text-[#E0B543]">"Scrape Game &amp; Deploy"</strong> workflow in your repository's GitHub Actions tab.
        </p>
      </div>
    );
  }

  const sortedTeams = [...summary.topTeamsSeen];
  if (teamTab === 'highest_winpct') {
    sortedTeams.sort((a, b) => b.winPct - a.winPct || b.gamesSeen - a.gamesSeen);
  } else if (teamTab === 'scoring') {
    sortedTeams.sort((a, b) => b.avgPointsScored - a.avgPointsScored);
  }

  const sortedPlayers = [...summary.topPlayersSeen];
  if (playerTab === 'scoring') {
    sortedPlayers.sort((a, b) => b.totalPts - a.totalPts || b.avgPts - a.avgPts);
  } else if (playerTab === 'playmaking') {
    sortedPlayers.sort((a, b) => b.totalAst - a.totalAst || b.avgAst - a.avgAst);
  } else if (playerTab === 'rebounding') {
    sortedPlayers.sort((a, b) => b.totalReb - a.totalReb || b.avgReb - a.avgReb);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Key Metrics (Pelicans Navy & Gold Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Games */}
        <div className="bg-[#0C2340] border border-[#1c4575] rounded-2xl p-5 shadow-lg shadow-[#061324]/40 hover:border-[#B4975A]/60 transition-colors">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4975A]">Games Attended</span>
            <div className="w-8 h-8 rounded-lg bg-[#061324] text-[#B4975A] border border-[#1c4575] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#B4975A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{summary.totalGames}</div>
          <div className="mt-1 flex items-center text-xs text-slate-300">
            <span>Across {summary.venuesSeen.length} venue{summary.venuesSeen.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Total Points Seen */}
        <div className="bg-[#0C2340] border border-[#1c4575] rounded-2xl p-5 shadow-lg shadow-[#061324]/40 hover:border-[#B4975A]/60 transition-colors">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4975A]">Points Witnessed</span>
            <div className="w-8 h-8 rounded-lg bg-[#061324] text-[#B4975A] border border-[#1c4575] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#B4975A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{summary.totalPointsSeen.toLocaleString()}</div>
          <div className="mt-1 flex items-center text-xs text-[#B4975A] font-semibold">
            <span>Avg {summary.avgPointsPerGame} PPG per game</span>
          </div>
        </div>

        {/* Unique Teams Seen */}
        <div className="bg-[#0C2340] border border-[#1c4575] rounded-2xl p-5 shadow-lg shadow-[#061324]/40 hover:border-[#B4975A]/60 transition-colors">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4975A]">Unique Teams</span>
            <div className="w-8 h-8 rounded-lg bg-[#061324] text-[#B4975A] border border-[#1c4575] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#B4975A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{summary.topTeamsSeen.length}</div>
          <div className="mt-1 text-xs text-slate-300 truncate">
            Top: {summary.topTeamsSeen[0]?.teamName || 'None'}
          </div>
        </div>

        {/* Unique Players Seen */}
        <div className="bg-[#0C2340] border border-[#1c4575] rounded-2xl p-5 shadow-lg shadow-[#061324]/40 hover:border-[#B4975A]/60 transition-colors">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4975A]">Unique Players</span>
            <div className="w-8 h-8 rounded-lg bg-[#061324] text-[#B4975A] border border-[#1c4575] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#B4975A]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{summary.topPlayersSeen.length}</div>
          <div className="mt-1 text-xs text-slate-300 truncate">
            Top: {summary.topPlayersSeen[0]?.playerName || 'None'}
          </div>
        </div>
      </div>

      {/* Main Grid: Teams Seen Most & Players Seen Most */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: TEAMS SEEN THE MOST */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-[#061324]/40">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#E0B543]" />
                  <h3 className="text-xl font-black text-white tracking-tight">Teams You've Seen Most</h3>
                </div>
                <p className="text-xs text-slate-300/70 mt-0.5">Frequency, record, and scoring averages</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center space-x-1 bg-[#061324] p-1 rounded-xl border border-[#1c4575] text-xs">
                <button
                  onClick={() => setTeamTab('most_seen')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    teamTab === 'most_seen' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Most Seen
                </button>
                <button
                  onClick={() => setTeamTab('highest_winpct')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    teamTab === 'highest_winpct' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Best Win%
                </button>
                <button
                  onClick={() => setTeamTab('scoring')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    teamTab === 'scoring' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Top Scoring
                </button>
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-3">
              {sortedTeams.slice(0, 6).map((team, idx) => {
                const winRate = Math.round(team.winPct * 100);
                return (
                  <div
                    key={team.teamName}
                    onClick={() => onFilterByTeam(team.teamName)}
                    className="group flex items-center justify-between p-3.5 bg-[#061324]/80 hover:bg-[#16365C] border border-[#1c4575]/80 hover:border-[#B4975A]/80 rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-[#16365C] text-[#E0B543] group-hover:bg-[#C69214] group-hover:text-[#0C2340] border border-[#1c4575] flex items-center justify-center font-black text-xs transition-colors shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-[#E0B543] transition-colors truncate text-sm">
                          {team.teamName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-300/80">
                          <span>{team.wins}W - {team.losses}L</span>
                          <span>•</span>
                          <span className={winRate >= 50 ? 'text-emerald-400 font-semibold' : 'text-[#E31837] font-semibold'}>{winRate}% Win</span>
                          <span>•</span>
                          <span>{team.avgPointsScored} PPG</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-white">
                          {team.gamesSeen} <span className="text-xs font-normal text-slate-400">game{team.gamesSeen === 1 ? '' : 's'}</span>
                        </div>
                        <div className="text-[11px] text-[#B4975A]">
                          {team.asHomeCount}H / {team.asAwayCount}A
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#E0B543] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {sortedTeams.length > 6 && (
            <div className="mt-4 pt-3 border-t border-[#1c4575] text-center">
              <button
                onClick={() => onFilterByTeam('')}
                className="text-xs font-bold text-[#E0B543] hover:text-[#B4975A] inline-flex items-center space-x-1"
              >
                <span>View all {sortedTeams.length} teams in games journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: PLAYERS SEEN THE MOST */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-[#061324]/40">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#E0B543]" />
                  <h3 className="text-xl font-black text-white tracking-tight">Players You've Seen Most</h3>
                </div>
                <p className="text-xs text-slate-300/70 mt-0.5">Top players witnessed live in action</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center space-x-1 bg-[#061324] p-1 rounded-xl border border-[#1c4575] text-xs">
                <button
                  onClick={() => setPlayerTab('most_seen')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    playerTab === 'most_seen' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Most Seen
                </button>
                <button
                  onClick={() => setPlayerTab('scoring')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    playerTab === 'scoring' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Points
                </button>
                <button
                  onClick={() => setPlayerTab('playmaking')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    playerTab === 'playmaking' ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Assists
                </button>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-3">
              {sortedPlayers.slice(0, 6).map((player, idx) => (
                <div
                  key={player.playerName}
                  onClick={() => onFilterByPlayer(player.playerName)}
                  className="group flex items-center justify-between p-3.5 bg-[#061324]/80 hover:bg-[#16365C] border border-[#1c4575]/80 hover:border-[#B4975A]/80 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-[#16365C] text-[#E0B543] group-hover:bg-[#C69214] group-hover:text-[#0C2340] border border-[#1c4575] flex items-center justify-center font-black text-xs transition-colors shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white group-hover:text-[#E0B543] transition-colors truncate text-sm">
                        {player.playerName}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-300/80 truncate">
                        <span className="text-slate-400">{player.teamsPlayedFor.join(', ')}</span>
                        <span>•</span>
                        <span className="text-[#E0B543] font-semibold">{player.avgPts} PPG</span>
                        <span>•</span>
                        <span>{player.avgReb} RPG</span>
                        <span>•</span>
                        <span>{player.avgAst} APG</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">
                        {player.gamesSeen} <span className="text-xs font-normal text-slate-400">game{player.gamesSeen === 1 ? '' : 's'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        High: <span className="text-[#E0B543] font-bold">{player.highScore} pts</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#E0B543] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sortedPlayers.length > 6 && (
            <div className="mt-4 pt-3 border-t border-[#1c4575] text-center">
              <button
                onClick={() => onFilterByPlayer('')}
                className="text-xs font-bold text-[#E0B543] hover:text-[#B4975A] inline-flex items-center space-x-1"
              >
                <span>Search all {sortedPlayers.length} players in games journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Scoring Performances & Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Scoring Single Game Performances */}
        <div className="lg:col-span-2 bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl p-6 shadow-xl shadow-[#061324]/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#E0B543]" />
              <h3 className="text-xl font-black text-white tracking-tight">Top Scoring Performances Witnessed</h3>
            </div>
            <span className="text-xs text-[#B4975A] font-semibold">Single game highs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.topScoringPerformances.slice(0, 6).map((perf, index) => (
              <div
                key={`${perf.playerName}-${perf.gameId}-${index}`}
                onClick={() => {
                  const targetGame = games.find(g => g.id === perf.gameId);
                  if (targetGame) onSelectGame(targetGame);
                }}
                className="group p-4 bg-[#061324]/80 hover:bg-[#16365C] border border-[#1c4575]/80 hover:border-[#B4975A]/80 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#B4975A]">#{index + 1}</span>
                    <span className="font-bold text-white group-hover:text-[#B4975A] transition-colors truncate">
                      {perf.playerName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">
                    {perf.teamName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {perf.gameDate} • {perf.matchup}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-2xl font-black text-[#B4975A]">
                    {perf.points}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-[#B4975A] tracking-wider">PTS</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venues Visited */}
        <div className="bg-[#0C2340] border border-[#1c4575] rounded-3xl p-6 shadow-xl shadow-[#061324]/40">
          <div className="flex items-center space-x-2 mb-6">
            <MapPin className="w-5 h-5 text-[#B4975A]" />
            <h3 className="text-xl font-black text-white tracking-tight">Venues &amp; Arenas</h3>
          </div>

          <div className="space-y-3">
            {summary.venuesSeen.slice(0, 5).map((venue) => (
              <div
                key={venue.arena}
                className="p-3 bg-[#061324]/80 border border-[#1c4575]/80 rounded-2xl flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-semibold text-slate-200 truncate">
                    {venue.arena}
                  </div>
                </div>
                <div className="shrink-0 px-2.5 py-1 bg-[#16365C] border border-[#1c4575] rounded-lg text-xs font-bold text-[#E0B543]">
                  {venue.count} game{venue.count === 1 ? '' : 's'}
                </div>
              </div>
            ))}
            {summary.venuesSeen.length === 0 && (
              <p className="text-xs text-slate-400 italic">No arena details recorded yet.</p>
            )}
          </div>

          {/* League Distribution */}
          <div className="mt-6 pt-5 border-t border-[#1c4575]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#B4975A] mb-3">Leagues Witnessed</h4>
            <div className="flex flex-wrap gap-2">
              {summary.leaguesSeen.map(l => (
                <span
                  key={l.league}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#061324] border border-[#1c4575] text-slate-200 flex items-center space-x-1.5"
                >
                  <span>{l.league}:</span>
                  <span className="text-[#E0B543] font-bold">{l.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
