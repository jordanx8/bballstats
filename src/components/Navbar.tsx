import React from 'react';
import { Calendar, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'games';
  setActiveTab: (tab: 'dashboard' | 'games') => void;
  totalGames: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalGames,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0C2340]/95 backdrop-blur-md border-b border-[#1c4575] shadow-lg shadow-[#061324]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand (Pelicans Theme) */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#0C2340] border border-[#B4975A] flex items-center justify-center shadow-md shadow-[#061324]/50 group-hover:scale-105 transition-transform">
              <span className="text-xl select-none">🏀</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  CourtPass
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#061324] text-[#B4975A] border border-[#B4975A]/60 rounded tracking-wider">
                  BOXSCORE LOG
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">Attended Basketball Games &amp; Box Scores</p>
            </div>
          </div>

          {/* Navigation Tabs (Pelicans Navy & Gold) */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-[#061324] p-1 rounded-xl border border-[#1c4575]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#B4975A] text-[#0C2340] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#16365C]/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Overview &amp; Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'games'
                  ? 'bg-[#B4975A] text-[#0C2340] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#16365C]/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Games Journal</span>
              {totalGames > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'games' ? 'bg-[#0C2340] text-[#B4975A]' : 'bg-[#16365C] text-slate-200 border border-[#1c4575]'
                }`}>
                  {totalGames}
                </span>
              )}
            </button>
          </div>

          {/* GitHub Actions Indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-[#061324]/60 px-3 py-1.5 rounded-xl border border-[#1c4575]/60">
            <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
            <span className="font-medium text-slate-300">Managed via GitHub Actions</span>
          </div>
        </div>
      </div>
    </header>
  );
};
