import { useState, useEffect } from 'react';
import { Game, UserStatsSummary } from './types';
import { fetchGames, fetchStats, updateGame } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GamesTable } from './components/GamesTable';
import { GameBoxscoreView } from './components/GameBoxscoreView';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [summary, setSummary] = useState<UserStatsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games'>('dashboard');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
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
      setLoadError(err.message || 'Could not load basketball passport data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    <div className="min-h-screen bg-[#061324] text-slate-100 flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Top Navigation in Pelicans Colors */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGame(null);
        }}
        totalGames={games.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#E0B543] animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Loading basketball passport...</p>
          </div>
        ) : loadError ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-[#0C2340] border border-[#1c4575] rounded-3xl text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-10 h-10 text-[#E31837] mx-auto" />
            <h3 className="text-lg font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-300">{loadError}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#16365C] hover:bg-[#C69214] text-white hover:text-[#0C2340] rounded-xl text-xs font-bold transition-colors"
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
          />
        ) : (
          /* Chronological Games Journal Table */
          <GamesTable
            games={games}
            onSelectGame={handleSelectGame}
            initialSearchQuery={tableSearchQuery}
          />
        )}
      </main>

      {/* Footer in Pelicans Navy & Gold */}
      <footer className="border-t border-[#1c4575] bg-[#0C2340]/90 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>🏀 <strong className="text-slate-200">CourtPass</strong> — Attended Basketball Game &amp; Boxscore Passport</span>
          </div>
          <div>
            Data from <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer" className="text-[#E0B543] hover:text-[#B4975A] underline underline-offset-2">Basketball Reference</a> &amp; <a href="https://www.sports-reference.com" target="_blank" rel="noreferrer" className="text-[#E0B543] hover:text-[#B4975A] underline underline-offset-2">Sports Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
