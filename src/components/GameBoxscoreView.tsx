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
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0C2340] hover:bg-[#16365C] border border-[#1c4575] hover:border-[#B4975A] text-slate-200 hover:text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#B4975A]" />
          <span>Back to List</span>
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

      {/* Main Scoreboard Card (Solid Deep Navy & Gold) */}
      <div className="bg-[#0C2340] border border-[#1c4575] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#061324]/80 relative overflow-hidden">
        {/* Date, League, Arena info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 pb-6 border-b border-[#1c4575]/80">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase bg-[#061324] text-[#B4975A] border border-[#B4975A]/60 tracking-wider">
              {game.sourceType === 'cbb' ? 'NCAA Men\'s Basketball' : game.sourceType.toUpperCase()}
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#B4975A]" />
              <span className="text-white font-semibold">{game.formattedDate || game.date}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {game.arena && (
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#B4975A]" />
                <span className="text-slate-200 font-medium">{game.arena}</span>
              </span>
            )}
            {game.attendance && (
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-[#B4975A]" />
                <span className="text-slate-300">Attendance: {typeof game.attendance === 'number' ? game.attendance.toLocaleString() : game.attendance}</span>
              </span>
            )}
          </div>
        </div>

        {/* Teams and Final Score */}
        <div className="py-8 grid grid-cols-1 md:grid-cols-7 gap-6 items-center text-center">
          {/* Away Team */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end text-center md:text-right">
            <div className="text-xs uppercase tracking-widest text-[#B4975A] font-bold mb-1">
              AWAY {game.awayTeam.record && `(${game.awayTeam.record})`}
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black ${isAwayWinner ? 'text-white' : 'text-slate-400'}`}>
              {game.awayTeam.name}
            </h2>
            {isAwayWinner && (
              <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
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
              <div className="text-[#B4975A]/60 text-2xl font-light">-</div>
              <div className={`text-4xl sm:text-5xl font-black font-mono ${isHomeWinner ? 'text-white' : 'text-slate-400'}`}>
                {game.homeTeam.score}
              </div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#B4975A] mt-2">
              FINAL {game.isOvertime ? '(OT)' : ''}
            </div>
          </div>

          {/* Home Team */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-xs uppercase tracking-widest text-[#B4975A] font-bold mb-1">
              HOME {game.homeTeam.record && `(${game.homeTeam.record})`}
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black ${isHomeWinner ? 'text-white' : 'text-slate-400'}`}>
              {game.homeTeam.name}
            </h2>
            {isHomeWinner && (
              <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                WINNER
              </span>
            )}
          </div>
        </div>

        {/* Line Score Table */}
        {(game.awayTeam.lineScores.length > 0 || game.homeTeam.lineScores.length > 0) && (
          <div className="mt-4 pt-6 border-t border-[#1c4575]/80 max-w-lg mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="text-[#B4975A] font-bold border-b border-[#1c4575]">
                    <th className="py-2 px-3 text-left">Team</th>
                    {game.awayTeam.lineScores.map((_, idx) => (
                      <th key={idx} className="py-2 px-2.5">
                        {game.sourceType === 'cbb' ? `H${idx + 1}` : idx < 4 ? `Q${idx + 1}` : `OT${idx - 3}`}
                      </th>
                    ))}
                    <th className="py-2 px-3 font-bold text-white">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c4575]/50">
                  <tr>
                    <td className="py-2 px-3 text-left font-bold text-slate-200">
                      {game.awayTeam.shortName || game.awayTeam.name}
                    </td>
                    {game.awayTeam.lineScores.map((score, idx) => (
                      <td key={idx} className="py-2 px-2.5 text-slate-300 font-mono">
                        {score}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-black text-white font-mono">{game.awayTeam.score}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-left font-bold text-slate-200">
                      {game.homeTeam.shortName || game.homeTeam.name}
                    </td>
                    {game.homeTeam.lineScores.map((score, idx) => (
                      <td key={idx} className="py-2 px-2.5 text-slate-300 font-mono">
                        {score}
                      </td>
                    ))}
                    <td className="py-2 px-3 font-black text-white font-mono">{game.homeTeam.score}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Game Leaders and Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Points Leader */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-bold uppercase text-[#B4975A]">Scoring Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{ptsLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-[#E0B543] font-mono">{ptsLeader.pts} <span className="text-xs font-normal text-slate-400">PTS</span></div>
        </div>

        {/* Rebound Leader */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-bold uppercase text-[#B4975A]">Rebound Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{rebLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">{rebLeader.trb} <span className="text-xs font-normal text-slate-400">REB</span></div>
        </div>

        {/* Assist Leader */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-bold uppercase text-[#B4975A]">Assist Leader</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">{astLeader.name}</div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{astLeader.ast} <span className="text-xs font-normal text-slate-400">AST</span></div>
        </div>

        {/* Total Points in game */}
        <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-bold uppercase text-[#B4975A]">Total Points</div>
            <div className="text-sm font-bold text-slate-300 mt-0.5">Game Combined</div>
          </div>
          <div className="text-2xl font-black text-[#E31837] font-mono">
            {game.awayTeam.score + game.homeTeam.score}
          </div>
        </div>
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
    <div className="bg-[#0C2340]/90 border border-[#1c4575] rounded-3xl overflow-hidden shadow-xl shadow-[#061324]/50">
      {/* Table Header Banner */}
      <div className="p-5 bg-[#061324]/90 border-b border-[#1c4575] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#16365C] border border-[#1c4575] text-[#E0B543] flex items-center justify-center font-bold text-xs uppercase font-mono">
            {team.shortName}
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <span>{team.name}</span>
              {isWinner && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {team.score} PTS
                </span>
              )}
            </h3>
            <span className="text-xs text-[#B4975A] font-medium">{label}</span>
          </div>
        </div>

        {team.totals && (
          <div className="hidden sm:flex items-center space-x-4 text-xs text-slate-300 font-mono">
            <span>FG: <strong className="text-white">{team.totals.fg}/{team.totals.fga}</strong> ({formatPct(team.totals.fgPct)})</span>
            <span>3P: <strong className="text-white">{team.totals.fg3}/{team.totals.fg3a}</strong></span>
            <span>FT: <strong className="text-white">{team.totals.ft}/{team.totals.fta}</strong></span>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1c4575] bg-[#061324]/60 text-[10px] uppercase font-bold text-[#B4975A] tracking-wider">
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
          <tbody className="divide-y divide-[#1c4575]/40">
            {/* Starters header */}
            <tr className="bg-[#061324]/80 font-bold text-[10px] uppercase tracking-wider text-[#B4975A]">
              <td colSpan={16} className="py-2 px-4">Starters</td>
            </tr>
            {starters.map((p, idx) => (
              <PlayerRow key={p.name + idx} player={p} formatPct={formatPct} />
            ))}

            {/* Bench */}
            {bench.length > 0 && (
              <>
                <tr className="bg-[#061324]/80 font-bold text-[10px] uppercase tracking-wider text-[#B4975A]">
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
                <tr className="bg-[#061324]/80 font-bold text-[10px] uppercase tracking-wider text-[#B4975A]">
                  <td colSpan={16} className="py-2 px-4">Did Not Play</td>
                </tr>
                {dnp.map((p, idx) => (
                  <tr key={p.name + idx} className="text-slate-400 italic">
                    <td className="py-2.5 px-4 font-medium text-slate-300">{p.name}</td>
                    <td colSpan={15} className="py-2.5 px-2 text-left text-slate-400">
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
              <tr className="border-t-2 border-[#1c4575] bg-[#061324] font-bold text-slate-100">
                <td className="py-3 px-4 font-black uppercase text-[#B4975A]">Team Totals</td>
                <td className="py-3 px-2 text-center font-mono">{team.totals.mp || '240'}</td>
                <td className="py-3 px-2 text-center text-sm font-black text-[#E0B543] font-mono">{team.totals.pts}</td>
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
    <tr className="hover:bg-[#16365C]/50 transition-colors font-mono">
      <td className="py-2.5 px-4 font-sans font-medium text-slate-100 whitespace-nowrap">
        {player.name}
      </td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.mp || '-'}</td>
      <td className="py-2.5 px-2 text-center font-black text-[#E0B543] text-sm">{player.pts}</td>
      <td className="py-2.5 px-2 text-center text-slate-200">{player.trb}</td>
      <td className="py-2.5 px-2 text-center text-slate-200">{player.ast}</td>
      <td className="py-2.5 px-2 text-center text-slate-200">{player.stl}</td>
      <td className="py-2.5 px-2 text-center text-slate-200">{player.blk}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.fg}-{player.fga}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{formatPct(player.fgPct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.fg3}-{player.fg3a}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{formatPct(player.fg3Pct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.ft}-{player.fta}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{formatPct(player.ftPct)}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.tov}</td>
      <td className="py-2.5 px-2 text-center text-slate-300">{player.pf}</td>
      <td className="py-2.5 px-2 text-center">
        {player.plusMinus !== null && player.plusMinus !== undefined ? (
          <span className={player.plusMinus > 0 ? 'text-emerald-400 font-bold' : player.plusMinus < 0 ? 'text-[#E31837] font-bold' : 'text-slate-400'}>
            {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
          </span>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </td>
    </tr>
  );
};
