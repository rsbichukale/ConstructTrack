'use client';

import React from 'react';
import { Database, Activity, HardDrive, Keyboard, Wifi, Building2 } from 'lucide-react';

export const DesktopStatusBar = ({
  activeWing,
  flatsCount = 70,
  contractorsCount = 14,
  serverPort = 5000
}) => {
  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-20 shrink-0">
      {/* Left: DB & Site Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local PostgreSQL (Port {serverPort})</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center space-x-1 text-slate-300">
          <Building2 className="w-3 h-3 text-amber-400" />
          <span>Site 1: Grand Heights</span>
          <span className="text-slate-500 font-mono">({activeWing ? `Wing ${activeWing}` : 'All Wings'})</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="hidden sm:flex items-center space-x-1 font-mono text-slate-400">
          <span>{flatsCount} Flats</span>
          <span>•</span>
          <span>{contractorsCount} Contractors</span>
        </div>
      </div>

      {/* Right: Keyboard Shortcuts Helper */}
      <div className="hidden md:flex items-center space-x-3 text-[10px] font-mono text-slate-500">
        <div className="flex items-center space-x-1">
          <kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">Ctrl+K</kbd>
          <span>Quick Jump</span>
        </div>
        <div className="flex items-center space-x-1">
          <kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">Ctrl+P</kbd>
          <span>Print / PDF</span>
        </div>
        <div className="flex items-center space-x-1">
          <kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">F5</kbd>
          <span>Live Sync</span>
        </div>
      </div>
    </footer>
  );
};

export default DesktopStatusBar;
