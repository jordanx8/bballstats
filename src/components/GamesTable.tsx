import React, { useState, useMemo } from 'react';
import { Game } from '../types';
import { 
  Search, Calendar, 
  Trash2, MapPin, Award, StickyNote, PlusCircle
} from 'lucide-react';

interface GamesTableProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onDeleteGame: (id: string, e: React.MouseEvent) => void;
  initialSearchQuery?: string;
  onOpenSubmitModal: () => void;
}

export const GamesTable: React.FC<GamesTableProps> = ({
  games,
  onSelectGame,
  onDeleteGame,
  initialSearchQuery = '',
  onOpenSubmitModal,
}) => {
  const [search, setSearch] = useState(initialSearchQuery);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'pts_desc' | 'margin_desc'>('date_desc');

  // Filter and sort games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
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
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Attended Games Journal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological record of {games.length} game{games.length === 1 ? '' : 's'} you have attended
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenSubmitModal}
          className="self-start md:self-auto flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by team, player, venue, date, or personal note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          {/* League Filter */}
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="date_desc">Date: Newest First</option>
            <option value="date_asc">Date: Oldest First</option>
            <option value="pts_desc">Total Points: High to Low</option>
            <option value="margin_desc">Blowout / Margin</option>
          </select>
        </div>
      </div>

      {/* Table of Games */}
      {filteredGames.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No games matched your search</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or league filter, or add a new game link.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-4 px-5">Date & League</th>
                  <th className="py-4 px-5">Matchup</th>
                  <th className="py-4 px-5 text-center">Score</th>
                  <th className="py-4 px-5">Top Scorer</th>
                  <th className="py-4 px-5">Venue</th>
                  <th className="py-4 px-5">Notes / Memories</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredGames.map((game) => {
                  const topScorer = getGameTopScorer(game);
                  const isAwayWinner = game.winner === 'away';
                  const isHomeWinner = game.winner === 'home';

                  return (
                    <tr
                      key={game.id}
                      onClick={() => onSelectGame(game)}
                      className="group hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      {/* Date & League */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {game.formattedDate || game.date}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              game.sourceType === 'nba'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : game.sourceType === 'cbb'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {game.sourceType === 'cbb' ? 'NCAA' : game.sourceType.toUpperCase()}
                          </span>
                          {game.isOvertime && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              OT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Matchup */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          {/* Away */}
                          <div className={`flex items-center space-x-2 ${isAwayWinner ? 'font-bold text-white' : 'text-slate-400'}`}>
                            <span className="w-10 text-xs uppercase font-mono tracking-wider text-slate-500">
                              {game.awayTeam.shortName || 'AWY'}
                            </span>
                            <span className="truncate">{game.awayTeam.name}</span>
                            {isAwayWinner && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                          </div>
                          {/* Home */}
                          <div className={`flex items-center space-x-2 ${isHomeWinner ? 'font-bold text-white' : 'text-slate-400'}`}>
                            <span className="w-10 text-xs uppercase font-mono tracking-wider text-slate-500">
                              {game.homeTeam.shortName || 'HME'}
                            </span>
                            <span className="truncate">{game.homeTeam.name}</span>
                            {isHomeWinner && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 font-mono">
                          <span className={isAwayWinner ? 'font-bold text-white' : 'text-slate-400'}>
                            {game.awayTeam.score}
                          </span>
                          <span className="text-slate-600">-</span>
                          <span className={isHomeWinner ? 'font-bold text-white' : 'text-slate-400'}>
                            {game.homeTeam.score}
                          </span>
                        </div>
                      </td>

                      {/* Top Scorer */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {topScorer ? (
                          <div>
                            <div className="font-medium text-slate-200 text-xs flex items-center space-x-1">
                              <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                              <span>{topScorer.name}</span>
                            </div>
                            <div className="text-[11px] text-amber-400 font-semibold pl-4.5">
                              {topScorer.pts} PTS ({topScorer.team})
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Venue */}
                      <td className="py-4 px-5 max-w-[180px] truncate">
                        {game.arena ? (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{game.arena}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* Personal Notes */}
                      <td className="py-4 px-5 max-w-[200px]">
                        {game.notes ? (
                          <div className="flex items-center space-x-1.5 text-xs text-amber-300/90 truncate bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            <StickyNote className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{game.notes}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No notes</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onSelectGame(game)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Boxscore
                          </button>
                          <button
                            onClick={(e) => onDeleteGame(game.id, e)}
                            title="Delete game from journal"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
