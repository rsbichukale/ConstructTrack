'use client';

import React from 'react';
import { Layers, Building2, Users, BarChart3, Search } from 'lucide-react';

interface BottomNavProps {
  activeRole: 'supervisor' | 'contractor' | 'admin';
  onSelectRole: (role: 'supervisor' | 'contractor' | 'admin') => void;
  viewMode: 'drilldown' | 'elevatorGrid';
  onSelectViewMode: (mode: 'drilldown' | 'elevatorGrid') => void;
  onOpenCommandPalette: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeRole,
  onSelectRole,
  viewMode,
  onSelectViewMode,
  onOpenCommandPalette,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold text-slate-400">
      {/* 5-Step Inspection Button */}
      <button
        onClick={() => {
          onSelectRole('supervisor');
          onSelectViewMode('drilldown');
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          activeRole === 'supervisor' && viewMode === 'drilldown'
            ? 'text-sky-400 font-extrabold bg-sky-950/60 border border-sky-800/60'
            : 'hover:text-slate-200'
        }`}
      >
        <Layers className="w-5 h-5 mb-0.5" />
        <span>Inspection</span>
      </button>

      {/* 2D Elevator Grid */}
      <button
        onClick={() => {
          onSelectRole('supervisor');
          onSelectViewMode('elevatorGrid');
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          activeRole === 'supervisor' && viewMode === 'elevatorGrid'
            ? 'text-sky-400 font-extrabold bg-sky-950/60 border border-sky-800/60'
            : 'hover:text-slate-200'
        }`}
      >
        <Building2 className="w-5 h-5 mb-0.5" />
        <span>2D Grid</span>
      </button>

      {/* Quick Search */}
      <button
        onClick={onOpenCommandPalette}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-amber-400 font-bold hover:text-amber-300 transition"
      >
        <div className="h-9 w-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 -mt-5 border-2 border-slate-900">
          <Search className="w-5 h-5" />
        </div>
        <span className="mt-0.5 text-[9px]">Search</span>
      </button>

      {/* Contractor Portal */}
      <button
        onClick={() => onSelectRole('contractor')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          activeRole === 'contractor'
            ? 'text-amber-400 font-extrabold bg-amber-950/60 border border-amber-800/60'
            : 'hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Contractor</span>
      </button>

      {/* Admin Dashboard */}
      <button
        onClick={() => onSelectRole('admin')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          activeRole === 'admin'
            ? 'text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-800/60'
            : 'hover:text-slate-200'
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Admin</span>
      </button>
    </div>
  );
};
