import React, { useState } from 'react';
import { Game, PlayerStats, TeamGameData } from '../types';
import { 
  ArrowLeft, ExternalLink, Calendar, MapPin, Users, 
  StickyNote, Check, Edit2 
} from 'lucide-react';

interface GameBoxscoreViewProps {
  game: Game;
  onBack: () => void;
  onUpdateNotes: (gameId: string, notes: string) => Promise<void>;
}

export const GameBoxscoreView: React.FC<GameBoxscoreViewProps> = ({
  game,
  onBack,
  onUpdateNotes,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(game.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  // Leaders
  const getAllPlayers = () => [...game.awayTeam.players, ...game.homeTeam.players];
  const ptsLeader = getAllPlayers().reduce((prev, curr) => (curr.pts > prev.pts ? curr : prev), { name: '-', pts: 0 } as PlayerStats);
  const rebLeader = getAllPlayers().reduce((prev, curr) => (curr.trb > prev.trb ? curr : prev), { name: '-', trb: 0 } as PlayerStats);
  const astLeader = getAllPlayers().reduce((prev, curr) => (curr.ast > prev.ast ? curr : prev), { name: '-', ast: 0 } as PlayerStats);

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto">
      {/* Top Bar with Back Button & External Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>

        <a
          href={game.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-xl transition-colors font-medium"
        >
          <span>View on {game.sourceType === 'cbb' ? 'Sports-Reference' : 'Basketball-Reference'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Scoreboard Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Date, League, Arena info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {game.sourceType === 'cbb' ? 'NCAA Men\'s Basketball' : game.sourceType.toUpperCase()}
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{game.formattedDate || game.date}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {game.arena && (
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">{game.arena}</span>
              </span>
            )}
            {game.attendance && (
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Attendance: {typeof game.attendance === 'number' ? game.attendance.toLocaleString() : game.attendance}</span>
              </span>
            )}
          </div>
        </div>

        {/* Teams and Final Score */}
        <div className="py-8 grid grid-cols-1 md:grid-cols-7 gap-6 items-center text-center">
          {/* Away Team */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end text-center md:text-right">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">
              AWAY {game.awayTeam.record && `(${game.awayTeam.record})`}
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black ${isAwayWinner ? 'text-white' : 'text-slate-400'}`}>
              {game.awayTeam.name}
            </h2>
            {isAwayWinner && (
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                WINNER
              </span>
            )}
          </div>

          {/* Scores */}
          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className={`text-4xl sm:text-5xl font-black font-mono ${isAwayWinner ? 'text-white' : 'text-slate-400'}`}>
                {game.awayTeam.score}
              </div>
              <div className="text-slate-700 text-2xl font-light">-</div>
              <div className={`text-4xl sm:text-5xl font-black font-mono ${isHomeWinner ? 'text-white' : 'text-slate-400'}`}>
                {game.homeTeam.score}
              </div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">
              FINAL {game.isOvertime ? '(OT)' : ''}
            </div>
          </div>

          {/* Home Team */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">
              HOME {game.homeTeam.record && `(${game.homeTeam.record})`}
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black ${isHomeWinner ? 'text-white' : 'text-slate-400'}`}>
              {game.homeTeam.name}
            </h2>
            {isHomeWinner && (
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                WINNER
              </span>
            )}
          </div>
        </div>

        {/* Line Score Table */}
        {(game.awayTeam.lineScores.length > 0 || game.homeTeam.lineScores.length > 0) && (
          <div className="mt-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-800">
                    <th className="py-2 px-3 text-left">Team</th>
                    {game.awayTeam.lineScores.map((_, idx) => (
                      <th key={idx} className="py-2 px-2.5">
                        {game.sourceType === 'cbb' ? `H${idx + 1}` : idx < 4 ? `Q${idx + 1}` : `OT${idx - 3}`}
                      </th>
                    ))}
                    <th className="py-2 px-3 font-bold text-white">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr>
                    <td className="py-2 px-3 text-left font-semibold text-slate-300">
                      {game.awayTeam.shortName || game.awayTeam.name}
                    </td>
                    {game.awayTeam.lineScores.map((score, idx) => (
                      <td key={idx} className="py-2 px-2.5 text-slate-400 font-mono">
                        {score}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-bold text-white font-mono">{game.awayTeam.score}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-left font-semibold text-slate-300">
                      {game.homeTeam.shortName || game.homeTeam.name}
                    </td>
                    {game.homeTeam.lineScores.map((score, idx) => (
                      <td key={idx} className="py-2 px-2.5 text-slate-400 font-mono">
                        {score}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-bold text-white font-mono">{game.homeTeam.score}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Game Leaders and Memories Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Points Leader */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Scoring Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{ptsLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{ptsLeader.pts} <span className="text-xs font-normal text-slate-400">PTS</span></div>
        </div>

        {/* Rebound Leader */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Rebound Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{rebLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">{rebLeader.trb} <span className="text-xs font-normal text-slate-400">REB</span></div>
        </div>

        {/* Assist Leader */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Assist Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{astLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{astLeader.ast} <span className="text-xs font-normal text-slate-400">AST</span></div>
        </div>

        {/* Total Points in game */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Points</div>
            <div className="text-sm font-bold text-slate-300 mt-0.5">Game Combined</div>
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono">
            {game.awayTeam.score + game.homeTeam.score}
          </div>
        </div>
      </div>

      {/* Personal Notes Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Personal Memory & Notes</h3>
          </div>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center space-x-1"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 min-h-[90px]"
            />
            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() => {
                  setNotesText(game.notes || '');
                  setIsEditingNotes(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-1.5 shadow-md shadow-orange-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            {game.notes || <span className="text-slate-500 italic">No notes logged for this game yet. Click "Add Note" to record where you sat or who you went with!</span>}
          </p>
        )}
      </div>

      {/* Boxscore Player Tables */}
      <div className="space-y-8">
        <TeamBoxscoreTable team={game.awayTeam} label="Away Team" isWinner={isAwayWinner} />
        <TeamBoxscoreTable team={game.homeTeam} label="Home Team" isWinner={isHomeWinner} />
      </div>
    </div>
  );
};

interface TeamBoxscoreTableProps {
  team: TeamGameData;
  label: string;
  isWinner: boolean;
}

const TeamBoxscoreTable: React.FC<TeamBoxscoreTableProps> = ({ team, label, isWinner }) => {
  const starters = team.players.filter(p => p.starter && !p.dnpReason);
  const bench = team.players.filter(p => !p.starter && !p.dnpReason);
  const dnp = team.players.filter(p => p.dnpReason);

  const formatPct = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return (val * 100).toFixed(1) + '%';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Table Header Banner */}
      <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs uppercase font-mono">
            {team.shortName}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{team.name}</span>
              {isWinner && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {team.score} PTS
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        </div>

        {team.totals && (
          <div className="hidden sm:flex items-center space-x-4 text-xs text-slate-400 font-mono">
            <span>FG: <strong className="text-slate-200">{team.totals.fg}/{team.totals.fga}</strong> ({formatPct(team.totals.fgPct)})</span>
            <span>3P: <strong className="text-slate-200">{team.totals.fg3}/{team.totals.fg3a}</strong></span>
            <span>FT: <strong className="text-slate-200">{team.totals.ft}/{team.totals.fta}</strong></span>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-3 px-4 min-w-[160px]">Player</th>
              <th className="py-3 px-2 text-center">MP</th>
              <th className="py-3 px-2 text-center font-bold text-white">PTS</th>
              <th className="py-3 px-2 text-center">TRB</th>
              <th className="py-3 px-2 text-center">AST</th>
              <th className="py-3 px-2 text-center">STL</th>
              <th className="py-3 px-2 text-center">BLK</th>
              <th className="py-3 px-2 text-center">FG</th>
              <th className="py-3 px-2 text-center">FG%</th>
              <th className="py-3 px-2 text-center">3P</th>
              <th className="py-3 px-2 text-center">3P%</th>
              <th className="py-3 px-2 text-center">FT</th>
              <th className="py-3 px-2 text-center">FT%</th>
              <th className="py-3 px-2 text-center">TOV</th>
              <th className="py-3 px-2 text-center">PF</th>
              <th className="py-3 px-2 text-center">+/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {/* Starters header */}
            <tr className="bg-slate-950/60 font-bold text-[10px] uppercase tracking-wider text-slate-400">
              <td colSpan={16} className="py-2 px-4">Starters</td>
            </tr>
            {starters.map((p, idx) => (
              <PlayerRow key={p.name + idx} player={p} formatPct={formatPct} />
            ))}

            {/* Bench */}
            {bench.length > 0 && (
              <>
                <tr className="bg-slate-950/60 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  <td colSpan={16} className="py-2 px-4">Reserves / Bench</td>
                </tr>
                {bench.map((p, idx) => (
                  <PlayerRow key={p.name + idx} player={p} formatPct={formatPct} />
                ))}
              </>
            )}

            {/* DNP players */}
            {dnp.length > 0 && (
              <>
                <tr className="bg-slate-950/60 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  <td colSpan={16} className="py-2 px-4">Did Not Play</td>
                </tr>
                {dnp.map((p, idx) => (
                  <tr key={p.name + idx} className="text-slate-500 italic">
                    <td className="py-2.5 px-4 font-medium text-slate-400">{p.name}</td>
                    <td colSpan={15} className="py-2.5 px-2 text-left text-slate-500">
                      {p.dnpReason}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>

          {/* Team Totals */}
          {team.totals && (
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950/90 font-bold text-slate-100">
                <td className="py-3 px-4 font-extrabold uppercase">Team Totals</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.mp || '240'}</td>
                <td className="py-3 px-2 text-center text-sm font-black text-amber-400 font-mono">{team.totals.pts}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.trb}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.ast}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.stl}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.blk}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.fg}-{team.totals.fga}</td>
                <td className="py-3 px-2 text-center font-mono">{formatPct(team.totals.fgPct)}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.fg3}-{team.totals.fg3a}</td>
                <td className="py-3 px-2 text-center font-mono">{formatPct(team.totals.fg3Pct)}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.ft}-{team.totals.fta}</td>
                <td className="py-3 px-2 text-center font-mono">{formatPct(team.totals.ftPct)}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.tov}</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.pf}</td>
                <td className="py-3 px-2 text-center text-slate-500">-</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const PlayerRow: React.FC<{ player: PlayerStats; formatPct: (val: number | null) => string }> = ({ player, formatPct }) => {
  return (
    <tr className="hover:bg-slate-800/50 transition-colors font-mono">
      <td className="py-2.5 px-4 font-sans font-medium text-slate-200 whitespace-nowrap">
        {player.name}
      </td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.mp || '-'}</td>
      <td className="py-2.5 px-2 text-center font-black text-amber-400 text-sm">{player.pts}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.trb}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.ast}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.stl}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.blk}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.fg}-{player.fga}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{formatPct(player.fgPct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.fg3}-{player.fg3a}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{formatPct(player.fg3Pct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.ft}-{player.fta}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{formatPct(player.ftPct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.tov}</td>
      <td className="py-2.5 px-2 text-center text-slate-400">{player.pf}</td>
      <td className="py-2.5 px-2 text-center">
        {player.plusMinus !== null && player.plusMinus !== undefined ? (
          <span className={player.plusMinus > 0 ? 'text-emerald-400' : player.plusMinus < 0 ? 'text-rose-400' : 'text-slate-400'}>
            {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
          </span>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </td>
    </tr>
  );
};
