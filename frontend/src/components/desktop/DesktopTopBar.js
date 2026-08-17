'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Building2, 
  Layers, 
  X, 
  Fuel, 
  Receipt, 
  Package, 
  UserCheck, 
  Activity, 
  ShieldCheck, 
  ChevronDown,
  LogOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Command,
  FileSpreadsheet
} from 'lucide-react';
import { SitewiseExcelExportModal } from '../features/reports/SitewiseExcelExportModal';

export const DesktopTopBar = ({
  openTabs = [],
  activeTab,
  onSelectTab,
  onCloseTab,
  activeWing,
  onSelectWing,
  onOpenCommandPalette,
  currentUser,
  onLogout,
  onQuickAction
}) => {
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between px-3 z-30 select-none">
      {/* Left Area: Wing Selector & Multi-Tab Strip */}
      <div className="flex items-center space-x-2 overflow-hidden flex-1 mr-4">
        {/* Wing Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 shrink-0">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={activeWing || 'A'}
            onChange={(e) => onSelectWing(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="A" className="bg-slate-950">Wing A (T-01)</option>
            <option value="B" className="bg-slate-950">Wing B (T-02)</option>
            <option value="ALL" className="bg-slate-950">All Wings</option>
          </select>
        </div>

        {/* Multi-Tab Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar flex-1 py-1">
          {openTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 border-slate-700 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/60 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <span>{tab.label}</span>
                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="opacity-60 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Universal Search, Quick Action, LAN Pill & Profile */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Universal Search Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl text-xs transition"
          title="Universal Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Quick Jump...</span>
          <kbd className="hidden md:inline-block bg-slate-950 border border-slate-800 text-[10px] text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold">
            Ctrl+K
          </kbd>
        </button>

        {/* Master Sitewise Excel Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
          title="Export All 6,832 Micro-Tasks to Excel / CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Sitewise Excel</span>
        </button>

        {/* Quick Action Launcher */}
        <div className="relative">
          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Action</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isQuickActionOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setIsQuickActionOpen(false)}
            >
              <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Transactions</div>
              
              <button
                onClick={() => { onQuickAction('logFuel'); setIsQuickActionOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Machine Runtime & Diesel</span>
              </button>

              <button
                onClick={() => { onQuickAction('musterRoll'); setIsQuickActionOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Record Daily Labor Attendance</span>
              </button>

              <button
                onClick={() => { onQuickAction('issueAdvance'); setIsQuickActionOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Issue Labor Wage Advance (Kharcha)</span>
              </button>

              <button
                onClick={() => { onQuickAction('generateBill'); setIsQuickActionOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Receipt className="w-3.5 h-3.5 text-purple-400" />
                <span>Generate Subcontractor RA Bill</span>
              </button>

              <button
                onClick={() => { onQuickAction('inwardGRN'); setIsQuickActionOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Package className="w-3.5 h-3.5 text-teal-400" />
                <span>Record Store Inward (GRN)</span>
              </button>
            </div>
          )}
        </div>

        {/* Live LAN Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LAN Live</span>
        </div>

        {/* User Profile & Role Selector */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-xl transition"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
              {currentUser?.name?.[0] || 'A'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-white leading-none">{currentUser?.name || 'Site Administrator'}</div>
              <div className="text-[9px] text-slate-400 font-mono capitalize">{currentUser?.role || 'admin'}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="font-bold text-xs text-white">{currentUser?.name || 'Administrator'}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email || 'admin@constructtrack.com'}</div>
              </div>

              <button
                onClick={() => { onSelectTab('userManagement'); setIsUserMenuOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>User & Role Permissions</span>
              </button>

              <button
                onClick={() => { onSelectTab('siteDiagnostics'); setIsUserMenuOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>LAN Health & Diagnostics</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/50 transition text-left mt-1 border-t border-slate-800/80"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sitewise Master Excel Modal */}
      <SitewiseExcelExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </header>
  );
};

export default DesktopTopBar;
