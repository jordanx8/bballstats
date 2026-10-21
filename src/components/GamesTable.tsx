import React, { useState, useMemo } from 'react';
import { Game } from '../types';
import { Search, Calendar, MapPin, Award, StickyNote, Trophy } from 'lucide-react';
import { getGameSeason } from '../services/statsCalculator';

interface GamesTableProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  initialSearchQuery?: string;
}

export const GamesTable: React.FC<GamesTableProps> = ({
  games,
  onSelectGame,
  initialSearchQuery = '',
}) => {
  const [search, setSearch] = useState(initialSearchQuery);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'pts_desc' | 'margin_desc'>('date_desc');

  // Available unique seasons
  const availableSeasons = useMemo(() => {
    const seasons = new Set<string>();
    for (const g of games) {
      seasons.add(getGameSeason(g.date, g.sourceType));
    }
    return Array.from(seasons).sort((a, b) => b.localeCompare(a));
  }, [games]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Season filter
      if (seasonFilter !== 'all') {
        const season = getGameSeason(game.date, game.sourceType);
        if (season !== seasonFilter) return false;
      }

      // League filter
      if (leagueFilter !== 'all' && game.sourceType !== leagueFilter) {
        return false;
      }

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const matchTeam =
        game.awayTeam.name.toLowerCase().includes(q) ||
        game.homeTeam.name.toLowerCase().includes(q) ||
        game.awayTeam.shortName.toLowerCase().includes(q) ||
        game.homeTeam.shortName.toLowerCase().includes(q);

      const matchDate =
        game.date.includes(q) ||
        game.formattedDate.toLowerCase().includes(q);

      const matchVenue = game.arena?.toLowerCase().includes(q) || false;
      const matchNotes = game.notes?.toLowerCase().includes(q) || false;

      // Check player names in both teams
      const matchPlayer =
        game.awayTeam.players.some(p => p.name.toLowerCase().includes(q)) ||
        game.homeTeam.players.some(p => p.name.toLowerCase().includes(q));

      return matchTeam || matchDate || matchVenue || matchNotes || matchPlayer;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'pts_desc') {
        const totalA = a.awayTeam.score + a.homeTeam.score;
        const totalB = b.awayTeam.score + b.homeTeam.score;
        return totalB - totalA;
      }
      if (sortBy === 'margin_desc') {
        const marginA = Math.abs(a.awayTeam.score - a.homeTeam.score);
        const marginB = Math.abs(b.awayTeam.score - b.homeTeam.score);
        return marginB - marginA;
      }
      return 0;
    });
  }, [games, search, leagueFilter, sortBy]);

  // Find game high scorer helper
  const getGameTopScorer = (game: Game) => {
    let topScorer = { name: '', pts: -1, team: '' };
    for (const p of game.awayTeam.players) {
      if (p.pts > topScorer.pts) {
        topScorer = { name: p.name, pts: p.pts, team: game.awayTeam.shortName || game.awayTeam.name };
      }
    }
    for (const p of game.homeTeam.players) {
      if (p.pts > topScorer.pts) {
        topScorer = { name: p.name, pts: p.pts, team: game.homeTeam.shortName || game.homeTeam.name };
      }
    }
    return topScorer.pts >= 0 ? topScorer : null;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Attended Games Journal</h2>
          <p className="text-xs text-slate-300/80 mt-1">
            Chronological log of {games.length} game{games.length === 1 ? '' : 's'} you have attended
          </p>
        </div>
      </div>

      {/* Filter and Search Bar (Pelicans Theme) */}
      <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg shadow-[#061324]/40">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#B4975A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by team, player, venue, date, or personal memory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Season Filter */}
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium"
          >
            <option value="all">All Seasons</option>
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s} Season
              </option>
            ))}
          </select>

          {/* League Filter */}
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium"
          >
            <option value="all">All Leagues</option>
            <option value="nba">NBA</option>
            <option value="cbb">NCAA (CBB)</option>
            <option value="wnba">WNBA</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium"
          >
            <option value="date_desc">Date: Newest First</option>
            <option value="date_asc">Date: Oldest First</option>
            <option value="pts_desc">Total Points: High to Low</option>
            <option value="margin_desc">Blowout / Margin</option>
          </select>
        </div>
      </div>

      {/* Season-Separated Game Groups */}
      {filteredGames.length === 0 ? (
        <div className="bg-[#0C2340]/40 border border-[#1c4575]/80 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No games matched your search</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, season, or league filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            // Group filtered games by season
            const groups: { [season: string]: { season: string; games: Game[]; totalPoints: number } } = {};
            for (const game of filteredGames) {
              const season = getGameSeason(game.date, game.sourceType);
              if (!groups[season]) {
                groups[season] = { season, games: [], totalPoints: 0 };
              }
              groups[season].games.push(game);
              groups[season].totalPoints += (game.awayTeam.score + game.homeTeam.score);
            }

            // Sort season groups descending (newest season first e.g. 2025-26, then 2024-25)
            const sortedGroups = Object.values(groups).sort((a, b) => b.season.localeCompare(a.season));

            return sortedGroups.map((group) => (
              <div key={group.season} className="space-y-3">
                {/* Season Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#061324] border border-[#B4975A] text-[#B4975A]">
                      <Trophy className="w-4 h-4 text-[#B4975A]" />
                    </span>
                    <h3 className="text-xl font-black text-white tracking-wide">
                      {group.season} <span className="text-sm font-semibold text-[#B4975A]">Season</span>
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2.5 py-1 bg-[#061324] border border-[#1c4575] rounded-full text-slate-300 font-medium">
                      {group.games.length} {group.games.length === 1 ? 'Game' : 'Games'}
                    </span>
                    <span className="px-2.5 py-1 bg-[#061324] border border-[#1c4575] rounded-full text-[#B4975A] font-bold">
                      {group.totalPoints} Total PTS
                    </span>
                  </div>
                </div>

                {/* Table for this Season */}
                <div className="bg-[#0C2340] border border-[#1c4575] rounded-3xl overflow-hidden shadow-2xl shadow-[#061324]/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1c4575] bg-[#061324] text-[11px] uppercase tracking-wider text-[#B4975A] font-bold">
                          <th className="py-4 px-5">Date &amp; League</th>
                          <th className="py-4 px-5">Matchup</th>
                          <th className="py-4 px-5 text-center">Score</th>
                          <th className="py-4 px-5">Top Scorer</th>
                          <th className="py-4 px-5">Venue</th>
                          <th className="py-4 px-5">Notes / Memories</th>
                          <th className="py-4 px-5 text-right">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c4575]/60 text-sm">
                        {group.games.map((game) => {
                          const topScorer = getGameTopScorer(game);
                          const isAwayWinner = game.winner === 'away';
                          const isHomeWinner = game.winner === 'home';

                          return (
                            <tr
                              key={game.id}
                              onClick={() => onSelectGame(game)}
                              className="group hover:bg-[#16365C]/80 cursor-pointer transition-colors"
                            >
                              {/* Date & League */}
                              <td className="py-4 px-5 whitespace-nowrap">
                                <div className="font-bold text-white group-hover:text-[#B4975A] transition-colors">
                                  {game.formattedDate || game.date}
                                </div>
                                <div className="flex items-center space-x-1.5 mt-0.5">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                      game.sourceType === 'nba'
                                        ? 'bg-[#061324] text-[#B4975A] border border-[#B4975A]/60'
                                        : game.sourceType === 'cbb'
                                        ? 'bg-[#061324] text-slate-200 border border-[#1c4575]'
                                        : 'bg-[#061324] text-slate-200 border border-[#1c4575]'
                                    }`}
                                  >
                                    {game.sourceType === 'cbb' ? 'NCAA' : game.sourceType.toUpperCase()}
                                  </span>
                                  {game.isOvertime && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#061324] text-[#B4975A] border border-[#B4975A]">
                                      OT
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Matchup */}
                              <td className="py-4 px-5">
                                <div className="space-y-1">
                                  {/* Away */}
                                  <div className={`flex items-center space-x-2 ${isAwayWinner ? 'font-bold text-white' : 'text-slate-300'}`}>
                                    <span className="w-10 text-xs uppercase font-mono tracking-wider text-[#B4975A]">
                                      {game.awayTeam.shortName || 'AWY'}
                                    </span>
                                    <span className="truncate">{game.awayTeam.name}</span>
                                    {isAwayWinner && <span className="text-[10px] text-[#B4975A] font-bold">✓</span>}
                                  </div>
                                  {/* Home */}
                                  <div className={`flex items-center space-x-2 ${isHomeWinner ? 'font-bold text-white' : 'text-slate-300'}`}>
                                    <span className="w-10 text-xs uppercase font-mono tracking-wider text-[#B4975A]">
                                      {game.homeTeam.shortName || 'HME'}
                                    </span>
                                    <span className="truncate">{game.homeTeam.name}</span>
                                    {isHomeWinner && <span className="text-[10px] text-[#B4975A] font-bold">✓</span>}
                                  </div>
                                </div>
                              </td>

                              {/* Score */}
                              <td className="py-4 px-5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#061324] rounded-xl border border-[#1c4575] font-mono">
                                  <span className={isAwayWinner ? 'font-black text-white' : 'text-slate-400'}>
                                    {game.awayTeam.score}
                                  </span>
                                  <span className="text-slate-500">-</span>
                                  <span className={isHomeWinner ? 'font-black text-white' : 'text-slate-400'}>
                                    {game.homeTeam.score}
                                  </span>
                                </div>
                              </td>

                              {/* Top Scorer */}
                              <td className="py-4 px-5 whitespace-nowrap">
                                {topScorer ? (
                                  <div>
                                    <div className="font-semibold text-slate-100 text-xs flex items-center space-x-1">
                                      <Award className="w-3.5 h-3.5 text-[#B4975A] shrink-0" />
                                      <span>{topScorer.name}</span>
                                    </div>
                                    <div className="text-[11px] text-[#B4975A] font-bold pl-4.5">
                                      {topScorer.pts} PTS ({topScorer.team})
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                              </td>

                              {/* Venue */}
                              <td className="py-4 px-5 max-w-[180px] truncate">
                                {game.arena ? (
                                  <div className="flex items-center space-x-1.5 text-xs text-slate-300 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-[#B4975A] shrink-0" />
                                    <span className="truncate">{game.arena}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">-</span>
                                )}
                              </td>

                              {/* Personal Notes */}
                              <td className="py-4 px-5 max-w-[200px]">
                                {game.notes ? (
                                  <div className="flex items-center space-x-1.5 text-xs text-[#B4975A] truncate bg-[#061324] px-2.5 py-1 rounded-lg border border-[#B4975A]/40">
                                    <StickyNote className="w-3 h-3 text-[#B4975A] shrink-0" />
                                    <span className="truncate">{game.notes}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">No notes</span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => onSelectGame(game)}
                                  className="px-3 py-1.5 bg-[#061324] hover:bg-[#C69214] text-slate-200 hover:text-[#0C2340] border border-[#1c4575] hover:border-[#B4975A] rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                  Boxscore
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};
