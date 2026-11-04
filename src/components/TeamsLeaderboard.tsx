import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Search, Shield } from 'lucide-react';
import { Game } from '../types';
import { TeamLogo } from './Media';
import { navigate, paths } from '../services/router';
import { getGameSeason } from '../services/statsCalculator';
import {
  LEAGUE_LABELS,
  LeagueKey,
  TeamLeaderboardRow,
  computeTeamLeaderboard,
} from '../services/leaderboards';

interface TeamsLeaderboardProps {
  games: Game[];
}

type SortKey =
  | 'teamName' | 'gamesSeen' | 'wins' | 'losses' | 'winPct'
  | 'ppg' | 'oppPpg' | 'margin' | 'home' | 'away';

const PAGE_SIZE = 50;

const selectClass =
  'bg-[#0b0c12] border border-[#2a2f42] focus:border-[#8b9bf5] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-medium';

export const TeamsLeaderboard: React.FC<TeamsLeaderboardProps> = ({ games }) => {
  const [search, setSearch] = useState('');
  const [league, setLeague] = useState<'all' | LeagueKey>('all');
  const [season, setSeason] = useState('all');
  const [minGames, setMinGames] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('gamesSeen');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Season filter recomputes the aggregates from only that season's games,
  // so W-L, PPG etc. reflect exactly what the user picked.
  const scopedGames = useMemo(() => {
    if (season === 'all') return games;
    return games.filter(g => seasonOfGame(g) === season);
  }, [games, season]);

  const allSeasons = useMemo(
    () => Array.from(new Set(games.map(seasonOfGame))).sort((a, b) => b.localeCompare(a)),
    [games],
  );

  const rows = useMemo(() => computeTeamLeaderboard(scopedGames), [scopedGames]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(r => {
      if (league !== 'all' && r.league !== league) return false;
      if (r.gamesSeen < minGames) return false;
      if (q && !r.teamName.toLowerCase().includes(q)) return false;
      return true;
    });

    const dir = sortDir === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
      if (sortKey === 'teamName') return a.teamName.localeCompare(b.teamName) * dir;
      const diff = (a[sortKey] - b[sortKey]) * dir;
      return diff || b.gamesSeen - a.gamesSeen || a.teamName.localeCompare(b.teamName);
    });
  }, [rows, search, league, minGames, sortKey, sortDir]);

  const resetPaging = () => setVisible(PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'teamName' ? 'asc' : 'desc');
    }
    resetPaging();
  };

  const columns: { key: SortKey; label: string; title: string }[] = [
    { key: 'gamesSeen', label: 'GP', title: 'Games seen' },
    { key: 'wins', label: 'W', title: 'Wins when you attended' },
    { key: 'losses', label: 'L', title: 'Losses when you attended' },
    { key: 'winPct', label: 'Win %', title: 'Win percentage' },
    { key: 'ppg', label: 'PPG', title: 'Points scored per game' },
    { key: 'oppPpg', label: 'Opp PPG', title: 'Points allowed per game' },
    { key: 'margin', label: 'Margin', title: 'Average scoring margin' },
    { key: 'home', label: 'Home', title: 'Games seen at home' },
    { key: 'away', label: 'Away', title: 'Games seen on the road' },
  ];

  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-[#b4bffd]" />
          <h2 className="text-2xl font-black text-white tracking-tight">Teams Leaderboard</h2>
        </div>
        <p className="text-xs text-slate-300/80 mt-1">
          Every team you&apos;ve seen live — {computeTeamLeaderboard(games).length} in total. Click a column to sort.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#14161f]/90 border border-[#2a2f42] rounded-2xl p-4 space-y-3 shadow-lg shadow-[#0b0c12]/40">
        <div className="relative">
          <Search className="w-4 h-4 text-[#6f7bdc] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPaging(); }}
            className="w-full bg-[#0b0c12] border border-[#2a2f42] focus:border-[#8b9bf5] rounded-xl pl-10 pr-16 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-colors"
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
            {allSeasons.map(s => <option key={s} value={s}>{s} Season</option>)}
          </select>

          <select value={minGames} onChange={e => { setMinGames(Number(e.target.value)); resetPaging(); }} className={selectClass}>
            <option value={1}>Any games seen</option>
            <option value={2}>2+ games</option>
            <option value={3}>3+ games</option>
            <option value={5}>5+ games</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#14161f] border border-[#2a2f42] rounded-3xl overflow-hidden shadow-2xl shadow-[#0b0c12]/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12] text-[11px] uppercase tracking-wider text-[#6f7bdc] font-bold">
                <th className="py-3.5 pl-5 pr-2 w-12">#</th>
                <th className="py-3.5 px-3 min-w-[240px]">
                  <SortHeader label="Team" active={sortKey === 'teamName'} dir={sortDir} onClick={() => toggleSort('teamName')} align="left" />
                </th>
                {columns.map(c => (
                  <th key={c.key} className="py-3.5 px-3 text-right whitespace-nowrap" title={c.title}>
                    <SortHeader label={c.label} active={sortKey === c.key} dir={sortDir} onClick={() => toggleSort(c.key)} align="right" />
                  </th>
                ))}
                <th className="py-3.5 pr-4 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/50">
              {shown.map((r, idx) => (
                <TeamRow key={r.teamName} row={r} rank={idx + 1} onClick={() => navigate(paths.team(r.teamName))} />
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No teams matched your filters</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing the search or loosening a filter.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a2f42] bg-[#0b0c12]/60 text-xs text-slate-300">
            <span>
              Showing <strong className="text-white">{shown.length}</strong> of{' '}
              <strong className="text-white">{filtered.length}</strong> teams
            </span>
            {shown.length < filtered.length && (
              <button
                onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="px-3 py-1.5 bg-[#8b9bf5] hover:bg-[#6f7bdc] text-[#14161f] rounded-lg font-bold transition-colors"
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

function seasonOfGame(g: Game): string {
  return getGameSeason(g.date, g.sourceType);
}

const TeamRow: React.FC<{ row: TeamLeaderboardRow; rank: number; onClick: () => void }> = ({ row, rank, onClick }) => {
  const pct = Math.round(row.winPct * 100);
  const margin = row.margin;
  return (
    <tr onClick={onClick} className="group hover:bg-[#1e2230]/70 cursor-pointer transition-colors">
      <td className="py-3 pl-5 pr-2 text-xs font-bold text-slate-400">{rank}</td>
      <td className="py-3 px-3">
        <div className="flex items-center space-x-3">
          <TeamLogo name={row.teamName} size={40} />
          <div className="min-w-0">
            <div className="font-bold text-white group-hover:text-[#b4bffd] transition-colors truncate">{row.teamName}</div>
            <div className="text-[11px] text-slate-400">{LEAGUE_LABELS[row.league]}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right font-mono font-bold text-white">{row.gamesSeen}</td>
      <td className="py-3 px-3 text-right font-mono text-emerald-400">{row.wins}</td>
      <td className="py-3 px-3 text-right font-mono text-[#E31837]">{row.losses}</td>
      <td className={`py-3 px-3 text-right font-mono font-bold ${pct >= 50 ? 'text-emerald-400' : 'text-[#E31837]'}`}>{pct}%</td>
      <td className="py-3 px-3 text-right font-mono font-bold text-[#b4bffd]">{row.ppg.toFixed(1)}</td>
      <td className="py-3 px-3 text-right font-mono text-slate-200">{row.oppPpg.toFixed(1)}</td>
      <td className={`py-3 px-3 text-right font-mono ${margin > 0 ? 'text-emerald-400' : margin < 0 ? 'text-[#E31837]' : 'text-slate-300'}`}>
        {margin > 0 ? '+' : ''}{margin.toFixed(1)}
      </td>
      <td className="py-3 px-3 text-right font-mono text-slate-200">{row.home}</td>
      <td className="py-3 px-3 text-right font-mono text-slate-200">{row.away}</td>
      <td className="py-3 pr-4">
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#b4bffd] transition-colors" />
      </td>
    </tr>
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
