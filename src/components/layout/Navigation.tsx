import React from 'react';
import { LayoutGrid, Users, Compass, Users2, BarChart3 } from 'lucide-react';

export type ActiveTab = 'pitch' | 'bench' | 'tactics' | 'roster' | 'stats';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  benchCount: number;
  queuedSubCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  benchCount,
  queuedSubCount,
}) => {
  const tabs = [
    { id: 'pitch' as const, label: 'Pitch', icon: LayoutGrid, badge: queuedSubCount > 0 ? queuedSubCount : null, badgeColor: 'bg-emerald-500 text-white' },
    { id: 'bench' as const, label: 'Bench', icon: Users, badge: benchCount > 0 ? benchCount : null, badgeColor: 'bg-slate-700 text-slate-200' },
    { id: 'tactics' as const, label: 'Tactics', icon: Compass, badge: null },
    { id: 'roster' as const, label: 'Roster', icon: Users2, badge: null },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3, badge: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto py-1 px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-emerald-400 font-semibold scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== null && (
                  <span className={`absolute -top-1.5 -right-2.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
