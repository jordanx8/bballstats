import React from 'react';
import { Calendar, Activity, Users, Shield, CalendarRange } from 'lucide-react';

export type TabKey = 'dashboard' | 'games' | 'players' | 'teams' | 'seasons';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  totalGames: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalGames,
}) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { key: 'games', label: 'Games', icon: <Calendar className="w-4 h-4" />, count: totalGames },
    { key: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    { key: 'teams', label: 'Teams', icon: <Shield className="w-4 h-4" /> },
    { key: 'seasons', label: 'Seasons', icon: <CalendarRange className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#14161f]/95 backdrop-blur-md border-b border-[#2a2f42] shadow-lg shadow-[#0b0c12]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand (Night Mode) */}
          <div
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#14161f] border border-[#6f7bdc] flex items-center justify-center shadow-md shadow-[#0b0c12]/50 group-hover:scale-105 transition-transform">
              <span className="text-xl select-none">🏀</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  BBallStats
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0b0c12] text-[#6f7bdc] border border-[#6f7bdc]/60 rounded tracking-wider">
                  BOXSCORE LOG
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden lg:block">Attended Basketball Games &amp; Box Scores</p>
            </div>
          </div>

          {/* Navigation Tabs (Night Mode) */}
          <nav className="flex items-center space-x-1 bg-[#0b0c12] p-1 rounded-xl border border-[#2a2f42] overflow-x-auto">
            {tabs.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#6f7bdc] text-[#14161f] shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#1e2230]/50'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        active ? 'bg-[#14161f] text-[#6f7bdc]' : 'bg-[#1e2230] text-slate-200 border border-[#2a2f42]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
