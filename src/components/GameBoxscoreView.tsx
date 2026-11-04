import React, { useState } from 'react';
import { Game, PlayerStats, TeamGameData } from '../types';
import {
  ArrowLeft, ExternalLink, Calendar, MapPin, Users,
  StickyNote, Check, Edit2
} from 'lucide-react';
import { PlayerAvatar, TeamLogo } from './Media';

interface GameBoxscoreViewProps {
  game: Game;
  onBack: () => void;
  onUpdateNotes: (gameId: string, notes: string) => Promise<void>;
}

type TeamView = 'away' | 'home';

interface Leader {
  player: PlayerStats;
  teamName: string;
}

function findLeader(game: Game, stat: 'pts' | 'trb' | 'ast'): Leader | null {
  let best: Leader | null = null;
  for (const team of [game.awayTeam, game.homeTeam]) {
    for (const player of team.players) {
      if (player.dnpReason) continue;
      if (!best || player[stat] > best.player[stat]) best = { player, teamName: team.name };
    }
  }
  return best;
}

export const GameBoxscoreView: React.FC<GameBoxscoreViewProps> = ({
  game,
  onBack,
  onUpdateNotes,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(game.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [teamView, setTeamView] = useState<TeamView>(game.winner === 'home' ? 'home' : 'away');

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(game.id, notesText);
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const isAwayWinner = game.winner === 'away';
  const isHomeWinner = game.winner === 'home';

  const leaders: { label: string; unit: string; color: string; leader: Leader | null; stat: 'pts' | 'trb' | 'ast' }[] = [
    { label: 'Scoring Leader', unit: 'PTS', color: 'text-[#E0B543]', leader: findLeader(game, 'pts'), stat: 'pts' },
    { label: 'Rebound Leader', unit: 'REB', color: 'text-sky-400', leader: findLeader(game, 'trb'), stat: 'trb' },
    { label: 'Assist Leader', unit: 'AST', color: 'text-emerald-400', leader: findLeader(game, 'ast'), stat: 'ast' },
  ];

  const lineLabel = (idx: number) => {
    const regulation = game.sourceType === 'cbb' ? 2 : 4;
    if (idx >= regulation) return `OT${idx - regulation + 1}`;
    return game.sourceType === 'cbb' ? `H${idx + 1}` : `Q${idx + 1}`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Bar with Back Button & External Link */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0C2340] hover:bg-[#16365C] border border-[#1c4575] hover:border-[#B4975A] text-slate-200 hover:text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#B4975A]" />
          <span>Back</span>
        </button>

        <a
          href={game.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 text-xs text-[#E0B543] hover:text-[#B4975A] bg-[#0C2340] hover:bg-[#16365C] border border-[#1c4575] px-3.5 py-2 rounded-xl transition-colors font-bold shadow-md"
        >
          <span>View on {game.sourceType === 'cbb' ? 'Sports-Reference' : 'Basketball-Reference'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Scoreboard */}
      <div className="bg-[#0C2340] border border-[#1c4575] rounded-3xl shadow-2xl shadow-[#061324]/80 overflow-hidden">
        {/* Meta strip */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 sm:px-8 py-4 bg-[#061324]/70 border-b border-[#1c4575]/80 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase bg-[#061324] text-[#B4975A] border border-[#B4975A]/60 tracking-wider">
              {game.sourceType === 'cbb' ? 'NCAA Basketball' : game.sourceType.toUpperCase()}
            </span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B4975A]" />
              <span className="text-white font-semibold">{game.formattedDate || game.date}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {game.arena && (
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#B4975A]" />
                <span className="text-slate-200 font-medium">{game.arena}</span>
              </span>
            )}
            {game.attendance && (
              <span className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#B4975A]" />
                <span>Attendance {typeof game.attendance === 'number' ? game.attendance.toLocaleString() : game.attendance}</span>
              </span>
            )}
          </div>
        </div>

        {/* Teams & score */}
        <div className="px-6 sm:px-8 py-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <ScoreTeam team={game.awayTeam} label="Away" isWinner={isAwayWinner} align="right" />

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 sm:gap-5 font-mono font-black">
              <span className={`text-4xl sm:text-6xl ${isAwayWinner ? 'text-white' : 'text-slate-500'}`}>{game.awayTeam.score}</span>
              <span className="text-[#B4975A]/50 text-2xl sm:text-3xl font-light">–</span>
              <span className={`text-4xl sm:text-6xl ${isHomeWinner ? 'text-white' : 'text-slate-500'}`}>{game.homeTeam.score}</span>
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[#B4975A]">
              Final{game.isOvertime ? ' · OT' : ''}
            </div>
          </div>

          <ScoreTeam team={game.homeTeam} label="Home" isWinner={isHomeWinner} align="left" />
        </div>

        {/* Line score */}
        {(game.awayTeam.lineScores.length > 0 || game.homeTeam.lineScores.length > 0) && (
          <div className="px-4 sm:px-8 pb-6">
            <div className="max-w-xl mx-auto overflow-x-auto rounded-2xl border border-[#1c4575]/80 bg-[#061324]/50">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#B4975A] font-bold border-b border-[#1c4575]/80">
                    <th className="py-2.5 px-4 text-left">Team</th>
                    {game.awayTeam.lineScores.map((_, idx) => (
                      <th key={idx} className="py-2.5 px-3">{lineLabel(idx)}</th>
                    ))}
                    <th className="py-2.5 px-4 text-white">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c4575]/50">
                  {[game.awayTeam, game.homeTeam].map(t => (
                    <tr key={t.name}>
                      <td className="py-2.5 px-4 text-left font-bold text-slate-200 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <TeamLogo name={t.name} size={20} />
                          <span>{t.shortName || t.name}</span>
                        </div>
                      </td>
                      {t.lineScores.map((score, idx) => (
                        <td key={idx} className="py-2.5 px-3 text-slate-300 font-mono tabular-nums">{score}</td>
                      ))}
                      <td className="py-2.5 px-4 font-black text-white font-mono tabular-nums">{t.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Game Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaders.map(({ label, unit, color, leader, stat }) => (
          <div
            key={label}
            className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex items-center gap-4 shadow-lg"
          >
            {leader ? (
              <>
                <PlayerAvatar name={leader.player.name} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#B4975A]">{label}</div>
                  <div className="text-sm font-bold text-white truncate">{leader.player.name}</div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                    <TeamLogo name={leader.teamName} size={14} />
                    <span className="truncate">{leader.teamName}</span>
                  </div>
                </div>
                <div className={`text-3xl font-black font-mono tabular-nums ${color}`}>
                  {leader.player[stat]}
                  <span className="block text-[10px] font-bold text-slate-400 text-right tracking-wider">{unit}</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400">No data</span>
            )}
          </div>
        ))}
      </div>

      {/* Personal Notes Section */}
      <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-4 h-4 text-[#E0B543]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Personal Memory &amp; Notes</h3>
          </div>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-[#E0B543] hover:text-[#B4975A] font-bold flex items-center space-x-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{game.notes ? 'Edit Note' : 'Add Note'}</span>
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Sat 5 rows from court with friends, awesome game-winner in overtime!"
              className="w-full bg-[#061324] border border-[#1c4575] rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C69214] min-h-[90px]"
            />
            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() => {
                  setNotesText(game.notes || '');
                  setIsEditingNotes(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#C69214] hover:bg-[#B4975A] text-[#0C2340] flex items-center space-x-1.5 shadow-md shadow-[#C69214]/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-200 bg-[#061324]/80 p-3.5 rounded-2xl border border-[#1c4575]/80">
            {game.notes || <span className="text-slate-400 italic">No notes logged for this game yet. Click "Add Note" to record your memories!</span>}
          </p>
        )}
      </div>

      {/* Team switcher + Box score */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 bg-[#061324] p-1.5 rounded-2xl border border-[#1c4575] max-w-xl">
          {([
            { key: 'away' as const, team: game.awayTeam, winner: isAwayWinner },
            { key: 'home' as const, team: game.homeTeam, winner: isHomeWinner },
          ]).map(({ key, team, winner }) => (
            <button
              key={key}
              onClick={() => setTeamView(key)}
              className={`flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all min-w-0 ${
                teamView === key
                  ? 'bg-[#B4975A] text-[#0C2340] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#16365C]/60'
              }`}
            >
              <TeamLogo name={team.name} size={24} />
              <span className="truncate">{team.shortName || team.name}</span>
              <span className={`font-mono text-xs ${teamView === key ? 'text-[#0C2340]' : winner ? 'text-emerald-400' : 'text-slate-400'}`}>
                {team.score}
              </span>
            </button>
          ))}
        </div>

        <TeamBoxscoreTable
          team={teamView === 'away' ? game.awayTeam : game.homeTeam}
          label={teamView === 'away' ? 'Away Team' : 'Home Team'}
          isWinner={teamView === 'away' ? isAwayWinner : isHomeWinner}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const ScoreTeam: React.FC<{
  team: TeamGameData;
  label: string;
  isWinner: boolean;
  align: 'left' | 'right';
}> = ({ team, label, isWinner, align }) => (
  <div
    className={`flex flex-col items-center gap-2 min-w-0 text-center md:gap-4 ${
      align === 'right' ? 'md:flex-row-reverse md:text-right' : 'md:flex-row md:text-left'
    }`}
  >
    <TeamLogo name={team.name} size={72} />
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-widest text-[#B4975A] font-bold">
        {label}{team.record ? ` · ${team.record}` : ''}
      </div>
      <h2 className={`text-lg sm:text-2xl font-black leading-tight break-words ${isWinner ? 'text-white' : 'text-slate-400'}`}>
        {team.name}
      </h2>
      {isWinner && (
        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
          WINNER
        </span>
      )}
    </div>
  </div>
);

const formatPct = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '–';
  return (val * 100).toFixed(1);
};

const COLUMN_GROUPS: { label: string; span: number }[] = [
  { label: '', span: 1 }, // Player (sticky)
  { label: '', span: 1 }, // MIN
  { label: 'Scoring & Core', span: 5 },
  { label: 'Shooting', span: 6 },
  { label: 'Other', span: 3 },
];

const TeamBoxscoreTable: React.FC<{ team: TeamGameData; label: string; isWinner: boolean }> = ({ team, label, isWinner }) => {
  const starters = team.players.filter(p => p.starter && !p.dnpReason);
  const bench = team.players.filter(p => !p.starter && !p.dnpReason);
  const dnp = team.players.filter(p => p.dnpReason);
  const colCount = COLUMN_GROUPS.reduce((n, g) => n + g.span, 0);

  const head = 'py-3 px-3 text-center whitespace-nowrap';

  return (
    <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl overflow-hidden shadow-xl shadow-[#061324]/50">
      {/* Header */}
      <div className="px-5 py-4 bg-[#061324]/90 border-b border-[#1c4575] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <TeamLogo name={team.name} size={40} />
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>{team.name}</span>
              {isWinner && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  W
                </span>
              )}
            </h3>
            <span className="text-xs text-[#B4975A] font-medium">{label}</span>
          </div>
        </div>

        {team.totals && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip label="FG" value={`${team.totals.fg}/${team.totals.fga}`} sub={`${formatPct(team.totals.fgPct)}%`} />
            <Chip label="3P" value={`${team.totals.fg3}/${team.totals.fg3a}`} sub={`${formatPct(team.totals.fg3Pct)}%`} />
            <Chip label="FT" value={`${team.totals.ft}/${team.totals.fta}`} sub={`${formatPct(team.totals.ftPct)}%`} />
            <Chip label="REB" value={String(team.totals.trb)} />
            <Chip label="AST" value={String(team.totals.ast)} />
            <Chip label="TOV" value={String(team.totals.tov)} />
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left border-collapse text-sm tabular-nums">
          <thead>
            {/* Group header */}
            <tr className="bg-[#061324]/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              {COLUMN_GROUPS.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className={`py-1.5 px-3 text-center ${
                    i === 0 ? 'sticky left-0 z-10 bg-[#061324]' : i === 1 ? '' : 'border-l border-[#1c4575]/60'
                  }`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-[#1c4575] bg-[#061324] text-[11px] uppercase font-bold text-[#B4975A] tracking-wider">
              <th className="py-3 pl-5 pr-3 min-w-[230px] sticky left-0 z-10 bg-[#061324]">Player</th>
              <th className={head}>MIN</th>
              <th className={`${head} border-l border-[#1c4575]/60 text-white`}>PTS</th>
              <th className={head}>REB</th>
              <th className={head}>AST</th>
              <th className={head}>STL</th>
              <th className={head}>BLK</th>
              <th className={`${head} border-l border-[#1c4575]/60`}>FG</th>
              <th className={`${head} text-slate-400`}>FG%</th>
              <th className={head}>3P</th>
              <th className={`${head} text-slate-400`}>3P%</th>
              <th className={head}>FT</th>
              <th className={`${head} text-slate-400`}>FT%</th>
              <th className={`${head} border-l border-[#1c4575]/60`}>TO</th>
              <th className={head}>PF</th>
              <th className={head}>+/-</th>
            </tr>
          </thead>
          <tbody>
            <SectionRow label="Starters" colSpan={colCount} />
            {starters.map((p, idx) => <PlayerRow key={p.name + idx} player={p} />)}

            {bench.length > 0 && (
              <>
                <SectionRow label="Bench" colSpan={colCount} />
                {bench.map((p, idx) => <PlayerRow key={p.name + idx} player={p} />)}
              </>
            )}

            {dnp.length > 0 && (
              <>
                <SectionRow label="Did Not Play" colSpan={colCount} />
                {dnp.map((p, idx) => (
                  <tr key={p.name + idx} className="border-b border-[#1c4575]/30 text-slate-400">
                    <td className="py-2.5 pl-5 pr-3 sticky left-0 z-[1] bg-[#0C2340]">
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar name={p.name} size={32} className="opacity-60" />
                        <span className="font-medium text-slate-300">{p.name}</span>
                      </div>
                    </td>
                    <td colSpan={colCount - 1} className="py-2.5 px-3 italic text-xs">{p.dnpReason}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>

          {team.totals && (
            <tfoot>
              <tr className="border-t-2 border-[#1c4575] bg-[#061324] font-bold text-slate-100">
                <td className="py-3.5 pl-5 pr-3 font-black uppercase text-[#B4975A] sticky left-0 z-[1] bg-[#061324]">Team Totals</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.mp || ''}</td>
                <td className="py-3.5 px-3 text-center font-mono text-base font-black text-[#E0B543] border-l border-[#1c4575]/60">{team.totals.pts}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.trb}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.ast}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.stl}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.blk}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-[#1c4575]/60">{team.totals.fg}-{team.totals.fga}</td>
                <td className="py-3.5 px-3 text-center font-mono text-slate-300">{formatPct(team.totals.fgPct)}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.fg3}-{team.totals.fg3a}</td>
                <td className="py-3.5 px-3 text-center font-mono text-slate-300">{formatPct(team.totals.fg3Pct)}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.ft}-{team.totals.fta}</td>
                <td className="py-3.5 px-3 text-center font-mono text-slate-300">{formatPct(team.totals.ftPct)}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-[#1c4575]/60">{team.totals.tov}</td>
                <td className="py-3.5 px-3 text-center font-mono">{team.totals.pf}</td>
                <td className="py-3.5 px-3 text-center text-slate-500">–</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const Chip: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="px-2.5 py-1.5 rounded-lg bg-[#0C2340] border border-[#1c4575] font-mono">
    <span className="text-[10px] font-sans font-bold text-[#B4975A] mr-1.5">{label}</span>
    <strong className="text-white">{value}</strong>
    {sub && <span className="text-slate-400 ml-1.5">{sub}</span>}
  </div>
);

const SectionRow: React.FC<{ label: string; colSpan: number }> = ({ label, colSpan }) => (
  <tr className="bg-[#061324]/60 border-y border-[#1c4575]/60">
    <td colSpan={colSpan} className="py-2 pl-5 pr-3 text-[10px] font-bold uppercase tracking-widest text-[#B4975A] sticky left-0">
      {label}
    </td>
  </tr>
);

const PlayerRow: React.FC<{ player: PlayerStats }> = ({ player }) => {
  const cell = 'py-3 px-3 text-center font-mono';
  const pm = player.plusMinus;
  return (
    <tr className="group border-b border-[#1c4575]/30 hover:bg-[#16365C]/50 transition-colors">
      <td className="py-2.5 pl-5 pr-3 sticky left-0 z-[1] bg-[#0C2340] group-hover:bg-[#16365C] transition-colors">
        <div className="flex items-center space-x-3">
          <PlayerAvatar name={player.name} size={36} />
          <span className="font-semibold text-slate-100 whitespace-nowrap">{player.name}</span>
        </div>
      </td>
      <td className={`${cell} text-slate-300`}>{player.mp || '–'}</td>
      <td className={`${cell} border-l border-[#1c4575]/40 font-black text-[#E0B543] text-base`}>{player.pts}</td>
      <td className={`${cell} text-slate-100`}>{player.trb}</td>
      <td className={`${cell} text-slate-100`}>{player.ast}</td>
      <td className={`${cell} text-slate-100`}>{player.stl}</td>
      <td className={`${cell} text-slate-100`}>{player.blk}</td>
      <td className={`${cell} border-l border-[#1c4575]/40 text-slate-200`}>{player.fg}-{player.fga}</td>
      <td className={`${cell} text-slate-400 text-xs`}>{formatPct(player.fgPct)}</td>
      <td className={`${cell} text-slate-200`}>{player.fg3}-{player.fg3a}</td>
      <td className={`${cell} text-slate-400 text-xs`}>{formatPct(player.fg3Pct)}</td>
      <td className={`${cell} text-slate-200`}>{player.ft}-{player.fta}</td>
      <td className={`${cell} text-slate-400 text-xs`}>{formatPct(player.ftPct)}</td>
      <td className={`${cell} border-l border-[#1c4575]/40 text-slate-300`}>{player.tov}</td>
      <td className={`${cell} text-slate-300`}>{player.pf}</td>
      <td className={cell}>
        {pm !== null && pm !== undefined ? (
          <span className={pm > 0 ? 'text-emerald-400 font-bold' : pm < 0 ? 'text-[#E31837] font-bold' : 'text-slate-400'}>
            {pm > 0 ? `+${pm}` : pm}
          </span>
        ) : (
          <span className="text-slate-600">–</span>
        )}
      </td>
    </tr>
  );
};
