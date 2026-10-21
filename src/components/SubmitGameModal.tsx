import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, ArrowRight, GitBranch } from 'lucide-react';
import { scrapeGameUrl } from '../services/api';
import { Game, UserStatsSummary } from '../types';

interface SubmitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: (game: Game, summary: UserStatsSummary) => void;
}

export const SubmitGameModal: React.FC<SubmitGameModalProps> = ({
  isOpen,
  onClose,
  onGameAdded,
}) => {
  const [activeMode, setActiveMode] = useState<'scrape' | 'github_action'>('scrape');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a boxscore URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await scrapeGameUrl(url.trim(), notes.trim() || undefined);
      setSuccessMessage(result.message || 'Game successfully logged!');
      onGameAdded(result.game, result.summary);
      
      setTimeout(() => {
        setUrl('');
        setNotes('');
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape game.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePastePreset = (presetUrl: string, sampleNotes?: string) => {
    setUrl(presetUrl);
    if (sampleNotes) setNotes(sampleNotes);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Log Attended Game</h3>
            <p className="text-xs text-slate-400">Add Basketball-Reference or Sports-Reference boxscores</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs mb-5">
          <button
            type="button"
            onClick={() => setActiveMode('scrape')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              activeMode === 'scrape' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Scrape
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('github_action')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 ${
              activeMode === 'github_action' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Action</span>
          </button>
        </div>

        {activeMode === 'github_action' ? (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="font-bold text-white text-sm flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-orange-400" />
                <span>How to log games via GitHub Action</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
                <li>Go to your repository on GitHub.</li>
                <li>Click the <strong className="text-slate-200">Actions</strong> tab at the top.</li>
                <li>Select <strong className="text-slate-200">"Scrape Game &amp; Deploy to GitHub Pages"</strong> from the left sidebar.</li>
                <li>Click <strong className="text-slate-200">Run workflow</strong>.</li>
                <li>Paste your game link (Basketball-Reference or Sports-Reference) and optional memory notes.</li>
                <li>Click the green <strong className="text-slate-200">Run workflow</strong> button!</li>
              </ol>
            </div>
            <p className="text-[11px] text-slate-400">
              The workflow will automatically scrape the stats, commit the new game to <code className="bg-slate-800 px-1 py-0.5 rounded text-orange-300">data/games.json</code>, and republish your live GitHub Pages site.
            </p>
          </div>
        ) : (
          /* Scrape Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Boxscore URL <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://www.basketball-reference.com/boxscores/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Try an example link:</div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePastePreset('https://www.basketball-reference.com/boxscores/202411110NOP.html', 'Nets vs Pelicans clutch finish in New Orleans!')}
                  className="text-left text-xs bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 p-2 rounded-xl text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span className="truncate pr-2">🏀 <strong>NBA</strong>: Nets @ Pelicans (2024-11-11)</span>
                  <span className="text-orange-400 text-[11px] font-medium shrink-0">Use Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePastePreset('https://www.sports-reference.com/cbb/boxscores/2024-11-06-20-louisiana-state.html', 'College basketball season opener at Pete Maravich!')}
                  className="text-left text-xs bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 p-2 rounded-xl text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span className="truncate pr-2">🎓 <strong>NCAA</strong>: UL Monroe @ LSU (2024-11-06)</span>
                  <span className="text-orange-400 text-[11px] font-medium shrink-0">Use Link</span>
                </button>
              </div>
            </div>

            {/* Personal Memory / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Personal Memories & Notes <span className="text-slate-500 text-[11px] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  placeholder="e.g. Sat in section 112 with Dad, buzzer beater shot!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="font-semibold">Unable to fetch box score</p>
                  <p className="mt-0.5 text-rose-300/80">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white flex items-center space-x-2 shadow-lg shadow-orange-500/20 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scraping Boxscore...</span>
                  </>
                ) : (
                  <>
                    <span>Scrape & Save Game</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
