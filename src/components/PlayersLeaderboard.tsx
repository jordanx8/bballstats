import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Search, Users } from 'lucide-react';
import { Game } from '../types';
import { PlayerAvatar, TeamLogo } from './Media';
import {
  LEAGUE_LABELS,
  LeagueKey,
  PlayerLeaderboardRow,
  computePlayerLeaderboard,
} from '../services/leaderboards';

interface PlayersLeaderboardProps {
  games: Game[];
  onViewPlayerGames: (playerName: string) => void;
}

type SortKey =
  | 'gamesSeen' | 'pts' | 'trb' | 'ast' | 'stl' | 'blk'
  | 'fg3' | 'fg3a' | 'highPts' | 'playerName';

const PAGE_SIZE = 50;

const selectClass =
  'bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium';

export const PlayersLeaderboard: React.FC<PlayersLeaderboardProps> = ({ games, onViewPlayerGames }) => {
  const [search, setSearch] = useState('');
  const [league, setLeague] = useState<'all' | LeagueKey>('all');
  const [season, setSeason] = useState('all');
  const [team, setTeam] = useState('all');
  const [minGames, setMinGames] = useState(1);
  const [mode, setMode] = useState<'total' | 'avg'>('total');
  const [sortKey, setSortKey] = useState<SortKey>('gamesSeen');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const rows = useMemo(() => computePlayerLeaderboard(games), [games]);

  const seasons = useMemo(
    () => Array.from(new Set(rows.flatMap(r => r.seasons))).sort((a, b) => b.localeCompare(a)),
    [rows],
  );
  const teams = useMemo(
    () => Array.from(new Set(rows.flatMap(r => r.teams))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const valueOf = (r: PlayerLeaderboardRow, key: SortKey): number | string => {
    if (key === 'playerName') return r.playerName;
    if (key === 'gamesSeen' || key === 'highPts') return r[key];
    return mode === 'avg' ? r[key] / r.gamesSeen : r[key];
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(r => {
      if (league !== 'all' && !r.leagues.includes(league)) return false;
      if (season !== 'all' && !r.seasons.includes(season)) return false;
      if (team !== 'all' && !r.teams.includes(team)) return false;
      if (r.gamesSeen < minGames) return false;
      if (q && !r.playerName.toLowerCase().includes(q) && !r.teams.some(t => t.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });

    const dir = sortDir === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
      const av = valueOf(a, sortKey);
      const bv = valueOf(b, sortKey);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      const diff = ((av as number) - (bv as number)) * dir;
      return diff || b.gamesSeen - a.gamesSeen || a.playerName.localeCompare(b.playerName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, league, season, team, minGames, sortKey, sortDir, mode]);

  const resetPaging = () => setVisible(PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'playerName' ? 'asc' : 'desc');
    }
    resetPaging();
  };

  const fmt = (r: PlayerLeaderboardRow, key: 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'fg3' | 'fg3a') =>
    mode === 'avg' ? (r[key] / r.gamesSeen).toFixed(1) : r[key].toLocaleString();

  const columns: { key: SortKey; label: string; title: string }[] = [
    { key: 'gamesSeen', label: 'GP', title: 'Games seen' },
    { key: 'pts', label: mode === 'avg' ? 'PPG' : 'PTS', title: 'Points' },
    { key: 'trb', label: mode === 'avg' ? 'RPG' : 'REB', title: 'Rebounds' },
    { key: 'ast', label: mode === 'avg' ? 'APG' : 'AST', title: 'Assists' },
    { key: 'stl', label: 'STL', title: 'Steals' },
    { key: 'blk', label: 'BLK', title: 'Blocks' },
    { key: 'fg3', label: '3PM', title: 'Three-pointers made' },
    { key: 'fg3a', label: '3PA', title: 'Three-pointers attempted' },
    { key: 'highPts', label: 'High', title: 'Highest scoring game seen' },
  ];

  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-[#E0B543]" />
          <h2 className="text-2xl font-black text-white tracking-tight">Players Leaderboard</h2>
        </div>
        <p className="text-xs text-slate-300/80 mt-1">
          Every player you&apos;ve seen live — {rows.length.toLocaleString()} in total. Click a column to sort.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 space-y-3 shadow-lg shadow-[#061324]/40">
        <div className="relative">
          <Search className="w-4 h-4 text-[#B4975A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players or teams..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPaging(); }}
            className="w-full bg-[#061324] border border-[#1c4575] focus:border-[#C69214] rounded-xl pl-10 pr-16 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); resetPaging(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={league} onChange={e => { setLeague(e.target.value as 'all' | LeagueKey); resetPaging(); }} className={selectClass}>
            <option value="all">All Leagues</option>
            {(Object.keys(LEAGUE_LABELS) as LeagueKey[]).map(k => (
              <option key={k} value={k}>{LEAGUE_LABELS[k]}</option>
            ))}
          </select>

          <select value={season} onChange={e => { setSeason(e.target.value); resetPaging(); }} className={selectClass}>
            <option value="all">All Seasons</option>
            {seasons.map(s => <option key={s} value={s}>{s} Season</option>)}
          </select>

          <select value={team} onChange={e => { setTeam(e.target.value); resetPaging(); }} className={`${selectClass} max-w-[200px]`}>
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={minGames} onChange={e => { setMinGames(Number(e.target.value)); resetPaging(); }} className={selectClass}>
            <option value={1}>Any games seen</option>
            <option value={2}>2+ games</option>
            <option value={3}>3+ games</option>
            <option value={5}>5+ games</option>
            <option value={10}>10+ games</option>
          </select>

          <div className="flex items-center bg-[#061324] p-1 rounded-xl border border-[#1c4575] text-xs ml-auto">
            {(['total', 'avg'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  mode === m ? 'bg-[#C69214] text-[#0C2340]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {m === 'total' ? 'Totals' : 'Per Game'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0C2340] border border-[#1c4575] rounded-3xl overflow-hidden shadow-2xl shadow-[#061324]/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1c4575] bg-[#061324] text-[11px] uppercase tracking-wider text-[#B4975A] font-bold">
                <th className="py-3.5 pl-5 pr-2 w-12">#</th>
                <th className="py-3.5 px-3 min-w-[240px]">
                  <SortHeader label="Player" active={sortKey === 'playerName'} dir={sortDir} onClick={() => toggleSort('playerName')} align="left" />
                </th>
                {columns.map(c => (
                  <th key={c.key} className="py-3.5 px-3 text-right" title={c.title}>
                    <SortHeader label={c.label} active={sortKey === c.key} dir={sortDir} onClick={() => toggleSort(c.key)} align="right" />
                  </th>
                ))}
                <th className="py-3.5 pr-4 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c4575]/50">
              {shown.map((r, idx) => (
                <tr
                  key={r.playerName}
                  onClick={() => onViewPlayerGames(r.playerName)}
                  className="group hover:bg-[#16365C]/70 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-5 pr-2 text-xs font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <PlayerAvatar name={r.playerName} size={40} />
                      <div className="min-w-0">
                        <div className="font-bold text-white group-hover:text-[#E0B543] transition-colors truncate">
                          {r.playerName}
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {r.teams.slice(0, 3).map(t => (
                            <span key={t} title={t}>
                              <TeamLogo name={t} size={16} />
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-400 truncate pl-1">
                            {r.teams.length > 3 ? `${r.teams.slice(0, 3).join(', ')} +${r.teams.length - 3}` : r.teams.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">{r.gamesSeen}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#E0B543]">{fmt(r, 'pts')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'trb')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'ast')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'stl')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'blk')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'fg3')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{fmt(r, 'fg3a')}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">{r.highPts}</td>
                  <td className="py-3 pr-4">
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#E0B543] transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No players matched your filters</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing the search or loosening a filter.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1c4575] bg-[#061324]/60 text-xs text-slate-300">
            <span>
              Showing <strong className="text-white">{shown.length.toLocaleString()}</strong> of{' '}
              <strong className="text-white">{filtered.length.toLocaleString()}</strong> players
            </span>
            {shown.length < filtered.length && (
              <button
                onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="px-3 py-1.5 bg-[#C69214] hover:bg-[#B4975A] text-[#0C2340] rounded-lg font-bold transition-colors"
              >
                Show more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SortHeader: React.FC<{
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  align: 'left' | 'right';
}> = ({ label, active, dir, onClick, align }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold transition-colors hover:text-white ${
      active ? 'text-white' : ''
    } ${align === 'right' ? 'justify-end w-full' : ''}`}
  >
    <span>{label}</span>
    {active && (dir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
  </button>
);
