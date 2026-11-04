import React, { useMemo } from 'react';
import { Game } from '../types';
import { LEAGUE_LABELS } from '../services/leaderboards';
import { computePlayerDetail } from '../services/details';
import { paths, navigate, goBack } from '../services/router';
import { PlayerAvatar, TeamLogo } from './Media';
import { BackButton, Link, Section, StatCard, pctText, th } from './ui';

export const PlayerDetail: React.FC<{ games: Game[]; playerName: string }> = ({ games, playerName }) => {
  const data = useMemo(() => computePlayerDetail(games, playerName), [games, playerName]);

  if (!data) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => goBack(paths.players)} />
        <div className="bg-[#14161f]/40 border border-[#2a2f42]/80 rounded-2xl p-12 text-center text-slate-300">
          No games found for &ldquo;{playerName}&rdquo;.
        </div>
      </div>
    );
  }

  const n = data.gamesSeen;
  const avg = (v: number) => (v / n).toFixed(1);

  return (
    <div className="space-y-6 pb-20">
      <BackButton onClick={() => goBack(paths.players)} />

      {/* Header */}
      <div className="bg-[#14161f] border border-[#2a2f42] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#0b0c12]/60 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <PlayerAvatar name={data.playerName} size={112} className="border-2 border-[#6f7bdc]" />
        <div className="text-center sm:text-left min-w-0">
          <h2 className="text-3xl font-black text-white tracking-tight">{data.playerName}</h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            {data.teams.map(t => (
              <Link
                key={t.teamName}
                to={paths.team(t.teamName)}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#0b0c12] border border-[#2a2f42] hover:border-[#6f7bdc] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
              >
                <TeamLogo name={t.teamName} size={20} />
                <span>{t.teamName}</span>
                <span className="text-[#b4bffd]">{t.games}g</span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {data.leagues.map(l => LEAGUE_LABELS[l]).join(' · ')} · seen across {data.seasons.length} season
            {data.seasons.length === 1 ? '' : 's'} ({data.seasons[data.seasons.length - 1]}
            {data.seasons.length > 1 ? ` – ${data.seasons[0]}` : ''})
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Games Seen" value={n} sub={`${data.wins}W – ${data.losses}L when seen`} />
        <StatCard label="Points" value={avg(data.totals.pts)} sub={`${data.totals.pts.toLocaleString()} total`} />
        <StatCard label="Rebounds" value={avg(data.totals.trb)} sub={`${data.totals.trb.toLocaleString()} total`} />
        <StatCard label="Assists" value={avg(data.totals.ast)} sub={`${data.totals.ast.toLocaleString()} total`} />
        <StatCard label="Steals" value={avg(data.totals.stl)} sub={`${data.totals.stl} total`} />
        <StatCard label="Blocks" value={avg(data.totals.blk)} sub={`${data.totals.blk} total`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="FG%" value={pctText(data.fgPct)} sub={`${data.totals.fg}/${data.totals.fga}`} />
        <StatCard label="3P%" value={pctText(data.fg3Pct)} sub={`${data.totals.fg3}/${data.totals.fg3a}`} />
        <StatCard label="FT%" value={pctText(data.ftPct)} sub={`${data.totals.ft}/${data.totals.fta}`} />
        <StatCard label="20+ Pt Games" value={data.twentyPointGames} />
        <StatCard label="Double-Doubles" value={data.doubleDoubles} />
        <StatCard label="Triple-Doubles" value={data.tripleDoubles} />
      </div>

      {/* Career highs */}
      <Section title="Best Games You've Seen">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.highs.map(h => (
            <Link
              key={h.key}
              to={paths.game(h.gameId)}
              className="block p-3 bg-[#0b0c12]/80 hover:bg-[#1e2230] border border-[#2a2f42]/80 hover:border-[#6f7bdc]/80 rounded-2xl text-center transition-all"
            >
              <div className="text-3xl font-black text-[#b4bffd] tabular-nums">{h.value}</div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-[#6f7bdc]">{h.label}</div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Game log */}
      <Section title={`Game Log (${n})`} flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left border-collapse text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Date</th>
                <th className={th}>Team</th>
                <th className={th}>Opponent</th>
                <th className={`${th} text-center`}>Result</th>
                {['MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG', '3P', 'FT', 'TO'].map(c => (
                  <th key={c} className={`${th} text-center`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {data.log.map(e => {
                const s = e.stats;
                return (
                  <tr
                    key={e.gameId}
                    onClick={() => navigate(paths.game(e.gameId))}
                    className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pl-5 pr-3 whitespace-nowrap">
                      <div className="font-semibold text-white group-hover:text-[#b4bffd] transition-colors">{e.formattedDate}</div>
                      <div className="text-[11px] text-slate-400">{e.season}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Link to={paths.team(e.teamName)} className="inline-flex items-center space-x-2 text-slate-200 hover:text-[#b4bffd]">
                        <TeamLogo name={e.teamName} size={22} />
                        <span>{e.teamName}</span>
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Link to={paths.team(e.opponent)} className="inline-flex items-center space-x-2 text-slate-300 hover:text-[#b4bffd]">
                        <span className="text-slate-500 text-xs">{e.isHome ? 'vs' : '@'}</span>
                        <TeamLogo name={e.opponent} size={22} />
                        <span>{e.opponent}</span>
                      </Link>
                    </td>
                    <td className={`py-2.5 px-3 text-center font-mono font-bold whitespace-nowrap ${e.won ? 'text-emerald-400' : 'text-[#E31837]'}`}>{e.scoreLine}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{s.mp || '–'}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-[#b4bffd]">{s.pts}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.trb}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.ast}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.stl}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">{s.blk}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{s.fg}-{s.fga}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{s.fg3}-{s.fg3a}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{s.ft}-{s.fta}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{s.tov}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};
