import React, { useMemo, useState } from 'react';
import { Game } from '../types';
import { LEAGUE_LABELS } from '../services/leaderboards';
import { TeamGameEntry, computeTeamDetail } from '../services/details';
import { paths, navigate, goBack } from '../services/router';
import { PlayerAvatar, TeamLogo } from './Media';
import { BackButton, Link, Section, StatCard, th } from './ui';

const PLAYER_PAGE = 15;

export const TeamDetail: React.FC<{ games: Game[]; teamName: string }> = ({ games, teamName }) => {
  const data = useMemo(() => computeTeamDetail(games, teamName), [games, teamName]);
  const [playersShown, setPlayersShown] = useState(PLAYER_PAGE);

  if (!data) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => goBack(paths.teams)} />
        <div className="bg-[#14161f]/40 border border-[#2a2f42]/80 rounded-2xl p-12 text-center text-slate-300">
          No games found for &ldquo;{teamName}&rdquo;.
        </div>
      </div>
    );
  }

  const pct = Math.round(data.winPct * 100);
  const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;

  const notable = (label: string, e: TeamGameEntry | null) =>
    e && (
      <Link
        to={paths.game(e.gameId)}
        className="block p-4 bg-[#0b0c12]/80 hover:bg-[#1e2230] border border-[#2a2f42]/80 hover:border-[#6f7bdc]/80 rounded-2xl transition-all"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#6f7bdc]">{label}</div>
        <div className="flex items-center justify-between mt-1.5 gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <TeamLogo name={e.opponent} size={28} />
            <div className="min-w-0">
              <div className="font-bold text-white truncate">{e.isHome ? 'vs' : '@'} {e.opponent}</div>
              <div className="text-[11px] text-slate-400">{e.formattedDate}</div>
            </div>
          </div>
          <div className="font-mono font-black text-lg text-white tabular-nums shrink-0">{e.teamScore}-{e.oppScore}</div>
        </div>
      </Link>
    );

  return (
    <div className="space-y-6 pb-20">
      <BackButton onClick={() => goBack(paths.teams)} />

      {/* Header */}
      <div className="bg-[#14161f] border border-[#2a2f42] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#0b0c12]/60 flex flex-col sm:flex-row items-center gap-6">
        <TeamLogo name={data.teamName} size={112} />
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-black text-white tracking-tight">{data.teamName}</h2>
          <p className="text-sm text-slate-300 mt-1">
            {LEAGUE_LABELS[data.league]} · seen {data.gamesSeen} time{data.gamesSeen === 1 ? '' : 's'} across{' '}
            {data.seasons.length} season{data.seasons.length === 1 ? '' : 's'}
          </p>
          <div className="mt-3 inline-flex items-center space-x-3 px-4 py-2 bg-[#0b0c12] border border-[#2a2f42] rounded-xl font-mono">
            <span className="text-2xl font-black text-white">{data.wins}–{data.losses}</span>
            <span className={`text-sm font-bold ${pct >= 50 ? 'text-emerald-400' : 'text-[#E31837]'}`}>{pct}% when you attended</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="PPG" value={data.ppg.toFixed(1)} />
        <StatCard label="Opp PPG" value={data.oppPpg.toFixed(1)} />
        <StatCard label="Avg Margin" value={signed(data.margin)} />
        <StatCard label="At Home" value={`${data.homeRecord.w}–${data.homeRecord.l}`} />
        <StatCard label="On the Road" value={`${data.awayRecord.w}–${data.awayRecord.l}`} />
        <StatCard label="Players Seen" value={data.players.length} />
      </div>

      {/* Notable games */}
      <Section title="Notable Games">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {notable('Biggest Win', data.bestWin)}
          {notable('Worst Loss', data.worstLoss)}
          {notable('Highest Scoring', data.highScore)}
          {!data.bestWin && !data.worstLoss && <p className="text-xs text-slate-400">No results yet.</p>}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasons */}
        <Section title="By Season" flush>
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Season</th>
                <th className={`${th} text-center`}>GP</th>
                <th className={`${th} text-center`}>W–L</th>
                <th className={`${th} text-right pr-5`}>PPG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {data.seasons.map(s => (
                <tr key={s.season} onClick={() => navigate(paths.season(s.season))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                  <td className="py-2.5 pl-5 pr-3 font-bold text-white group-hover:text-[#b4bffd]">{s.season}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.games}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.wins}–{s.losses}</td>
                  <td className="py-2.5 px-3 pr-5 text-right font-mono text-[#b4bffd]">{s.ppg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Opponents */}
        <Section title="Opponents" flush>
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="sticky top-0">
                <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                  <th className={`${th} pl-5`}>Opponent</th>
                  <th className={`${th} text-center`}>GP</th>
                  <th className={`${th} text-right pr-5`}>W–L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2f42]/40">
                {data.opponents.map(o => (
                  <tr key={o.opponent} onClick={() => navigate(paths.team(o.opponent))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                    <td className="py-2 pl-5 pr-3">
                      <div className="flex items-center space-x-2.5">
                        <TeamLogo name={o.opponent} size={24} />
                        <span className="font-semibold text-slate-100 group-hover:text-[#b4bffd]">{o.opponent}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-200">{o.games}</td>
                    <td className="py-2 px-3 pr-5 text-right font-mono text-slate-200">{o.wins}–{o.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Players */}
      <Section title={`Players Seen (${data.players.length})`} flush>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Player</th>
                <th className={`${th} text-center`}>GP</th>
                <th className={`${th} text-center`}>PPG</th>
                <th className={`${th} text-center`}>RPG</th>
                <th className={`${th} text-center`}>APG</th>
                <th className={`${th} text-center pr-5`}>High</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {data.players.slice(0, playersShown).map(p => (
                <tr key={p.playerName} onClick={() => navigate(paths.player(p.playerName))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                  <td className="py-2 pl-5 pr-3">
                    <div className="flex items-center space-x-3">
                      <PlayerAvatar name={p.playerName} size={34} />
                      <span className="font-semibold text-slate-100 group-hover:text-[#b4bffd]">{p.playerName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-white font-bold">{p.games}</td>
                  <td className="py-2 px-3 text-center font-mono text-[#b4bffd]">{(p.pts / p.games).toFixed(1)}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-200">{(p.trb / p.games).toFixed(1)}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-200">{(p.ast / p.games).toFixed(1)}</td>
                  <td className="py-2 px-3 pr-5 text-center font-mono text-slate-200">{p.highPts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {playersShown < data.players.length && (
          <div className="px-5 py-3 border-t border-[#2a2f42] bg-[#0b0c12]/60 text-right">
            <button
              onClick={() => setPlayersShown(v => v + PLAYER_PAGE * 2)}
              className="px-3 py-1.5 bg-[#8b9bf5] hover:bg-[#6f7bdc] text-[#14161f] rounded-lg text-xs font-bold transition-colors"
            >
              Show more
            </button>
          </div>
        )}
      </Section>

      {/* Venues */}
      {data.venues.length > 0 && (
        <Section title="Venues">
          <div className="flex flex-wrap gap-2">
            {data.venues.map(v => (
              <span key={v.arena} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0b0c12] border border-[#2a2f42] text-slate-200">
                {v.arena} <span className="text-[#b4bffd] font-bold ml-1">{v.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Game log */}
      <Section title={`Game Log (${data.gamesSeen})`} flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Date</th>
                <th className={th}>Opponent</th>
                <th className={`${th} text-center`}>Result</th>
                <th className={`${th} pr-5`}>Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {data.log.map(e => (
                <tr key={e.gameId} onClick={() => navigate(paths.game(e.gameId))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                  <td className="py-2.5 pl-5 pr-3 whitespace-nowrap">
                    <div className="font-semibold text-white group-hover:text-[#b4bffd]">{e.formattedDate}</div>
                    <div className="text-[11px] text-slate-400">{e.season}</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <Link to={paths.team(e.opponent)} className="inline-flex items-center space-x-2 text-slate-200 hover:text-[#b4bffd]">
                      <span className="text-slate-500 text-xs">{e.isHome ? 'vs' : '@'}</span>
                      <TeamLogo name={e.opponent} size={22} />
                      <span>{e.opponent}</span>
                    </Link>
                  </td>
                  <td className={`py-2.5 px-3 text-center font-mono font-bold whitespace-nowrap ${e.won ? 'text-emerald-400' : 'text-[#E31837]'}`}>
                    {e.won ? 'W' : 'L'} {e.teamScore}-{e.oppScore}{e.overtime ? ' (OT)' : ''}
                  </td>
                  <td className="py-2.5 px-3 pr-5 text-xs text-slate-400 truncate max-w-[260px]">{e.arena || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};
