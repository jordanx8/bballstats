import React, { useState, useEffect } from 'react';
import { Game, UserStatsSummary } from './types';
import { fetchGames, fetchStats, deleteGame, updateGame } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GamesTable } from './components/GamesTable';
import { GameBoxscoreView } from './components/GameBoxscoreView';
import { SubmitGameModal } from './components/SubmitGameModal';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [summary, setSummary] = useState<UserStatsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games'>('dashboard');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [gamesData, statsData] = await Promise.all([
        fetchGames(),
        fetchStats(),
      ]);
      setGames(gamesData);
      setSummary(statsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setLoadError(err.message || 'Could not connect to local backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGameAdded = (newGame: Game, newSummary: UserStatsSummary) => {
    setGames(prev => {
      const filtered = prev.filter(g => g.id !== newGame.id);
      return [newGame, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    setSummary(newSummary);
  };

  const handleDeleteGame = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this game from your passport?')) {
      return;
    }
    try {
      const res = await deleteGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
      setSummary(res.summary);
      if (selectedGame?.id === id) {
        setSelectedGame(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleUpdateNotes = async (gameId: string, notes: string) => {
    const updated = await updateGame(gameId, { notes });
    setGames(prev => prev.map(g => (g.id === gameId ? updated : g)));
    if (selectedGame?.id === gameId) {
      setSelectedGame(updated);
    }
  };

  const handleFilterByTeam = (teamName: string) => {
    setTableSearchQuery(teamName);
    setActiveTab('games');
    setSelectedGame(null);
  };

  const handleFilterByPlayer = (playerName: string) => {
    setTableSearchQuery(playerName);
    setActiveTab('games');
    setSelectedGame(null);
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGame(null);
        }}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        totalGames={games.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading your basketball passport...</p>
          </div>
        ) : loadError ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400">{loadError}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : selectedGame ? (
          /* Single Game Detailed Boxscore View */
          <GameBoxscoreView
            game={selectedGame}
            onBack={() => setSelectedGame(null)}
            onUpdateNotes={handleUpdateNotes}
          />
        ) : activeTab === 'dashboard' ? (
          /* Dashboard Overview */
          <Dashboard
            summary={summary}
            games={games}
            onSelectGame={handleSelectGame}
            onFilterByTeam={handleFilterByTeam}
            onFilterByPlayer={handleFilterByPlayer}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        ) : (
          /* Chronological Games Journal Table */
          <GamesTable
            games={games}
            onSelectGame={handleSelectGame}
            onDeleteGame={handleDeleteGame}
            initialSearchQuery={tableSearchQuery}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        )}
      </main>

      {/* Submit Game Link Modal */}
      <SubmitGameModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onGameAdded={handleGameAdded}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>🏀 <strong>CourtPass</strong> — Local Attended Basketball Boxscore Tracker</span>
          </div>
          <div>
            Data sourced from <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white underline underline-offset-2">Basketball Reference</a> &amp; <a href="https://www.sports-reference.com" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white underline underline-offset-2">Sports Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
