import React, { useMemo } from 'react';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { Game } from '../types';
import { LEAGUE_LABELS } from '../services/leaderboards';
import { computeSeasonSummaries } from '../services/details';
import { paths, navigate, goBack } from '../services/router';
import { PlayerAvatar, TeamLogo } from './Media';
import { BackButton, Link, Section, StatCard, th } from './ui';

/* ------------------------------------------------------------------ */
/* All seasons                                                         */
/* ------------------------------------------------------------------ */

export const SeasonsOverview: React.FC<{ games: Game[] }> = ({ games }) => {
  const seasons = useMemo(() => computeSeasonSummaries(games), [games]);
  const maxGames = Math.max(1, ...seasons.map(s => s.gameCount));

  return (
    <div className="space-y-6 pb-20">
      <div>
        <div className="flex items-center space-x-2">
          <CalendarRange className="w-6 h-6 text-[#b4bffd]" />
          <h2 className="text-2xl font-black text-white tracking-tight">Season by Season</h2>
        </div>
        <p className="text-xs text-slate-300/80 mt-1">
          {games.length} games across {seasons.length} season{seasons.length === 1 ? '' : 's'}. Click a season for the full recap.
        </p>
      </div>

      <div className="space-y-3">
        {seasons.map(s => (
          <div
            key={s.season}
            onClick={() => navigate(paths.season(s.season))}
            className="group bg-[#14161f] border border-[#2a2f42] hover:border-[#6f7bdc]/80 rounded-3xl p-5 cursor-pointer transition-all shadow-lg shadow-[#0b0c12]/40"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Season + games bar */}
              <div className="lg:w-56 shrink-0">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-white group-hover:text-[#b4bffd] transition-colors">{s.season}</span>
                  <span className="text-xs font-semibold text-[#6f7bdc]">Season</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#0b0c12] overflow-hidden">
                  <div className="h-full bg-[#8b9bf5] rounded-full" style={{ width: `${(s.gameCount / maxGames) * 100}%` }} />
                </div>
                <div className="text-xs text-slate-300 mt-1.5">
                  <strong className="text-white">{s.gameCount}</strong> game{s.gameCount === 1 ? '' : 's'}
                  {' · '}
                  {s.leagueCounts.map(l => `${l.count} ${LEAGUE_LABELS[l.league]}`).join(', ')}
                </div>
              </div>

              {/* Highlights */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                <Highlight label="Most Seen Player">
                  {s.mostSeenPlayer && (
                    <>
                      <PlayerAvatar name={s.mostSeenPlayer.playerName} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{s.mostSeenPlayer.playerName}</div>
                        <div className="text-[11px] text-slate-400">{s.mostSeenPlayer.games} games</div>
                      </div>
                    </>
                  )}
                </Highlight>
                <Highlight label="Most Seen Team">
                  {s.mostSeenTeam && (
                    <>
                      <TeamLogo name={s.mostSeenTeam.teamName} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{s.mostSeenTeam.teamName}</div>
                        <div className="text-[11px] text-slate-400">{s.mostSeenTeam.games} games</div>
                      </div>
                    </>
                  )}
                </Highlight>
                <Highlight label="Top Scoring Game">
                  {s.topScorer && (
                    <>
                      <PlayerAvatar name={s.topScorer.playerName} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{s.topScorer.playerName}</div>
                        <div className="text-[11px] text-[#b4bffd] font-bold">{s.topScorer.points} pts</div>
                      </div>
                    </>
                  )}
                </Highlight>
              </div>

              <div className="hidden lg:flex items-center space-x-4 shrink-0 text-right">
                <div>
                  <div className="text-xl font-black text-white tabular-nums">{s.avgPoints.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#6f7bdc]">Pts / Game</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#b4bffd] transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Highlight: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6f7bdc] mb-1">{label}</div>
    <div className="flex items-center space-x-2.5 min-w-0">{children || <span className="text-xs text-slate-500">–</span>}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Single season                                                       */
/* ------------------------------------------------------------------ */

export const SeasonDetail: React.FC<{ games: Game[]; season: string }> = ({ games, season }) => {
  const allSummaries = useMemo(() => computeSeasonSummaries(games), [games]);
  const summary = useMemo(() => allSummaries.find(s => s.season === season) ?? null, [allSummaries, season]);
  const allSeasons = useMemo(() => allSummaries.map(s => s.season), [allSummaries]);

  const teamRows = useMemo(() => {
    if (!summary) return [];
    const map = new Map<string, { teamName: string; games: number; wins: number }>();
    for (const g of summary.games) {
      for (const [team, won] of [[g.awayTeam, g.winner === 'away'], [g.homeTeam, g.winner === 'home']] as const) {
        const e = map.get(team.name) ?? { teamName: team.name, games: 0, wins: 0 };
        e.games += 1; if (won) e.wins += 1;
        map.set(team.name, e);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.games - a.games || b.wins - a.wins);
  }, [summary]);

  const playerRows = useMemo(() => {
    if (!summary) return [];
    const map = new Map<string, { playerName: string; games: number; pts: number; trb: number; ast: number }>();
    for (const g of summary.games) {
      const seen = new Set<string>();
      for (const team of [g.awayTeam, g.homeTeam]) {
        for (const p of team.players) {
          if (!p.name || p.dnpReason) continue;
          const name = p.name.trim();
          if (seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          const e = map.get(name) ?? { playerName: name, games: 0, pts: 0, trb: 0, ast: 0 };
          e.games += 1; e.pts += p.pts; e.trb += p.trb; e.ast += p.ast;
          map.set(name, e);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.games - a.games || b.pts - a.pts).slice(0, 10);
  }, [summary]);

  if (!summary) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => goBack(paths.seasons)} />
        <div className="bg-[#14161f]/40 border border-[#2a2f42]/80 rounded-2xl p-12 text-center text-slate-300">
          No games found for the {season} season.
        </div>
      </div>
    );
  }

  const idx = allSeasons.indexOf(season);
  const newer = idx > 0 ? allSeasons[idx - 1] : null;
  const older = idx < allSeasons.length - 1 ? allSeasons[idx + 1] : null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <BackButton onClick={() => goBack(paths.seasons)} />
        <div className="flex items-center space-x-2 text-xs font-bold">
          {older && (
            <Link to={paths.season(older)} className="px-3 py-2 bg-[#14161f] border border-[#2a2f42] hover:border-[#6f7bdc] rounded-xl text-slate-200">← {older}</Link>
          )}
          {newer && (
            <Link to={paths.season(newer)} className="px-3 py-2 bg-[#14161f] border border-[#2a2f42] hover:border-[#6f7bdc] rounded-xl text-slate-200">{newer} →</Link>
          )}
        </div>
      </div>

      <div className="bg-[#14161f] border border-[#2a2f42] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#0b0c12]/60">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#6f7bdc]">Season Recap</div>
        <h2 className="text-4xl font-black text-white tracking-tight mt-1">{season}</h2>
        <p className="text-sm text-slate-300 mt-1">
          {summary.leagueCounts.map(l => `${l.count} ${LEAGUE_LABELS[l.league]}`).join(' · ')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Games" value={summary.gameCount} />
        <StatCard label="Points Seen" value={summary.totalPoints.toLocaleString()} sub={`${summary.avgPoints.toFixed(1)} per game`} />
        <StatCard label="Teams" value={summary.teamCount} />
        <StatCard label="Players" value={summary.playerCount} />
        <StatCard label="Overtime" value={summary.overtimeGames} />
        <StatCard label="Venues" value={summary.venues.length} sub={summary.venues[0]?.arena} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summary.topScorer && (
          <Link to={paths.game(summary.topScorer.gameId)} className="flex items-center space-x-4 p-4 bg-[#14161f] hover:bg-[#1e2230] border border-[#2a2f42] hover:border-[#6f7bdc]/80 rounded-2xl transition-all">
            <PlayerAvatar name={summary.topScorer.playerName} size={52} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6f7bdc]">Best Scoring Night</div>
              <div className="font-bold text-white truncate">{summary.topScorer.playerName}</div>
              <div className="text-xs text-[#b4bffd] font-bold">{summary.topScorer.points} pts · {summary.topScorer.teamName}</div>
            </div>
          </Link>
        )}
        {summary.highestScoringGame && (
          <Link to={paths.game(summary.highestScoringGame.gameId)} className="flex items-center space-x-4 p-4 bg-[#14161f] hover:bg-[#1e2230] border border-[#2a2f42] hover:border-[#6f7bdc]/80 rounded-2xl transition-all">
            <div className="w-[52px] h-[52px] rounded-full bg-[#0b0c12] border border-[#6f7bdc]/60 flex items-center justify-center text-lg font-black text-[#b4bffd] tabular-nums shrink-0">
              {summary.highestScoringGame.total}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6f7bdc]">Highest Scoring Game</div>
              <div className="font-bold text-white truncate">{summary.highestScoringGame.matchup}</div>
              <div className="text-xs text-slate-400">combined points</div>
            </div>
          </Link>
        )}
        {summary.mostSeenPlayer && (
          <Link to={paths.player(summary.mostSeenPlayer.playerName)} className="flex items-center space-x-4 p-4 bg-[#14161f] hover:bg-[#1e2230] border border-[#2a2f42] hover:border-[#6f7bdc]/80 rounded-2xl transition-all">
            <PlayerAvatar name={summary.mostSeenPlayer.playerName} size={52} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6f7bdc]">Most Seen Player</div>
              <div className="font-bold text-white truncate">{summary.mostSeenPlayer.playerName}</div>
              <div className="text-xs text-slate-400">{summary.mostSeenPlayer.games} games</div>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Teams Seen" flush>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="sticky top-0">
                <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                  <th className={`${th} pl-5`}>Team</th>
                  <th className={`${th} text-center`}>GP</th>
                  <th className={`${th} text-right pr-5`}>W–L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2f42]/40">
                {teamRows.map(t => (
                  <tr key={t.teamName} onClick={() => navigate(paths.team(t.teamName))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                    <td className="py-2 pl-5 pr-3">
                      <div className="flex items-center space-x-2.5">
                        <TeamLogo name={t.teamName} size={26} />
                        <span className="font-semibold text-slate-100 group-hover:text-[#b4bffd]">{t.teamName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-white font-bold">{t.games}</td>
                    <td className="py-2 px-3 pr-5 text-right font-mono text-slate-200">{t.wins}–{t.games - t.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Most Seen Players" flush>
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Player</th>
                <th className={`${th} text-center`}>GP</th>
                <th className={`${th} text-center`}>PPG</th>
                <th className={`${th} text-center pr-5`}>RPG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {playerRows.map(p => (
                <tr key={p.playerName} onClick={() => navigate(paths.player(p.playerName))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                  <td className="py-2 pl-5 pr-3">
                    <div className="flex items-center space-x-3">
                      <PlayerAvatar name={p.playerName} size={32} />
                      <span className="font-semibold text-slate-100 group-hover:text-[#b4bffd]">{p.playerName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-white font-bold">{p.games}</td>
                  <td className="py-2 px-3 text-center font-mono text-[#b4bffd]">{(p.pts / p.games).toFixed(1)}</td>
                  <td className="py-2 px-3 pr-5 text-center font-mono text-slate-200">{(p.trb / p.games).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      <Section title={`Games (${summary.gameCount})`} flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2f42] bg-[#0b0c12]">
                <th className={`${th} pl-5`}>Date</th>
                <th className={th}>Matchup</th>
                <th className={`${th} text-center`}>Score</th>
                <th className={`${th} pr-5`}>Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/40">
              {summary.games.map(g => {
                const awayWon = g.winner === 'away';
                return (
                  <tr key={g.id} onClick={() => navigate(paths.game(g.id))} className="group hover:bg-[#1e2230]/60 cursor-pointer transition-colors">
                    <td className="py-2.5 pl-5 pr-3 whitespace-nowrap font-semibold text-white group-hover:text-[#b4bffd]">{g.formattedDate || g.date}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2 whitespace-nowrap">
                        <TeamLogo name={g.awayTeam.name} size={22} />
                        <span className={awayWon ? 'font-bold text-white' : 'text-slate-300'}>{g.awayTeam.name}</span>
                        <span className="text-slate-500 text-xs">@</span>
                        <TeamLogo name={g.homeTeam.name} size={22} />
                        <span className={!awayWon ? 'font-bold text-white' : 'text-slate-300'}>{g.homeTeam.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      <span className={awayWon ? 'font-black text-white' : 'text-slate-400'}>{g.awayTeam.score}</span>
                      <span className="text-slate-500 mx-1.5">–</span>
                      <span className={!awayWon ? 'font-black text-white' : 'text-slate-400'}>{g.homeTeam.score}</span>
                      {g.isOvertime && <span className="ml-2 text-[10px] font-bold text-[#6f7bdc]">OT</span>}
                    </td>
                    <td className="py-2.5 px-3 pr-5 text-xs text-slate-400 truncate max-w-[240px]">{g.arena || '–'}</td>
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
