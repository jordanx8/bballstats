import React from 'react';
import { Calendar, PlusCircle, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'games';
  setActiveTab: (tab: 'dashboard' | 'games') => void;
  onOpenSubmitModal: () => void;
  totalGames: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSubmitModal,
  totalGames,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-xl select-none">🏀</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CourtPass
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                  BOXSCORE TRACKER
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Basketball Passport & Attended Game Log</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Overview & Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'games'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Games Journal</span>
              {totalGames > 0 && (
                <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'games' ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {totalGames}
                </span>
              )}
            </button>
          </div>

          {/* Action button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenSubmitModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Game Link</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
