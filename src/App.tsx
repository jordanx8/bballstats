import { useState, useEffect } from 'react';
import { Game, UserStatsSummary } from './types';
import { fetchGames, fetchStats, updateGame } from './services/api';
import { Navbar, TabKey } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GamesTable } from './components/GamesTable';
import { GameBoxscoreView } from './components/GameBoxscoreView';
import { PlayersLeaderboard } from './components/PlayersLeaderboard';
import { TeamsLeaderboard } from './components/TeamsLeaderboard';
import { PlayerDetail } from './components/PlayerDetail';
import { TeamDetail } from './components/TeamDetail';
import { SeasonsOverview, SeasonDetail } from './components/Seasons';
import { BackButton } from './components/ui';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { goBack, navigate, paths, useRoute } from './services/router';

/** Which top-level nav tab a route belongs to. */
function tabFor(routeName: string): TabKey {
  switch (routeName) {
    case 'games':
    case 'game':
      return 'games';
    case 'players':
    case 'player':
      return 'players';
    case 'teams':
    case 'team':
      return 'teams';
    case 'seasons':
    case 'season':
      return 'seasons';
    default:
      return 'dashboard';
  }
}

const TAB_PATHS: Record<TabKey, string> = {
  dashboard: paths.dashboard,
  games: paths.games,
  players: paths.players,
  teams: paths.teams,
  seasons: paths.seasons,
};

export function App() {
  const route = useRoute();
  const [games, setGames] = useState<Game[]>([]);
  const [summary, setSummary] = useState<UserStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  };

  const renderRoute = () => {
    switch (route.name) {
      case 'game': {
        const game = games.find(g => g.id === route.id);
        if (!game) {
          return (
            <div className="space-y-6">
              <BackButton onClick={() => goBack(paths.games)} />
              <div className="bg-[#14161f]/40 border border-[#2a2f42]/80 rounded-2xl p-12 text-center text-slate-300">
                Game &ldquo;{route.id}&rdquo; was not found.
              </div>
            </div>
          );
        }
        return (
          <GameBoxscoreView
            key={game.id}
            game={game}
            onBack={() => goBack(paths.games)}
            onUpdateNotes={handleUpdateNotes}
          />
        );
      }
      case 'games':
        return (
          <GamesTable
            games={games}
            onSelectGame={game => navigate(paths.game(game.id))}
          />
        );
      case 'players':
        return <PlayersLeaderboard games={games} />;
      case 'player':
        return <PlayerDetail games={games} playerName={route.playerName} />;
      case 'teams':
        return <TeamsLeaderboard games={games} />;
      case 'team':
        return <TeamDetail games={games} teamName={route.teamName} />;
      case 'seasons':
        return <SeasonsOverview games={games} />;
      case 'season':
        return <SeasonDetail games={games} season={route.season} />;
      default:
        return (
          <Dashboard
            summary={summary}
            games={games}
            onSelectGame={game => navigate(paths.game(game.id))}
            onViewAllPlayers={() => navigate(paths.players)}
            onViewAllTeams={() => navigate(paths.teams)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c12] text-slate-100 flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Top Navigation in Night Mode */}
      <Navbar
        activeTab={tabFor(route.name)}
        setActiveTab={tab => navigate(TAB_PATHS[tab])}
        totalGames={games.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#b4bffd] animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Loading basketball passport...</p>
          </div>
        ) : loadError ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-[#14161f] border border-[#2a2f42] rounded-3xl text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-10 h-10 text-[#E31837] mx-auto" />
            <h3 className="text-lg font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-300">{loadError}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1e2230] hover:bg-[#8b9bf5] text-white hover:text-[#14161f] rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          renderRoute()
        )}
      </main>

      {/* Footer in Night Mode */}
      <footer className="border-t border-[#2a2f42] bg-[#14161f]/90 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>🏀 <strong className="text-slate-200">BBallStats</strong> — Attended Basketball Game &amp; Boxscore Passport</span>
          </div>
          <div>
            Data from <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer" className="text-[#b4bffd] hover:text-[#6f7bdc] underline underline-offset-2">Basketball Reference</a> &amp; <a href="https://www.sports-reference.com" target="_blank" rel="noreferrer" className="text-[#b4bffd] hover:text-[#6f7bdc] underline underline-offset-2">Sports Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
