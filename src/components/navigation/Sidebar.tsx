'use client';

import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Layers, 
  Users, 
  FileText, 
  Receipt, 
  Building2, 
  Search, 
  X, 
  ChevronRight, 
  Sparkles,
  ListOrdered,
  Hash
} from 'lucide-react';

export type AdminMenuTab = 
  | 'resourceAllocation' 
  | 'executiveDashboard' 
  | 'microTasks' 
  | 'executionSequence'
  | 'contractors' 
  | 'dailyReports' 
  | 'siteReports'
  | 'billing' 
  | 'inspection' 
  | 'elevatorGrid';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminMenuTab;
  onSelectTab: (tab: AdminMenuTab) => void;
  activeWing: 'B1' | 'B2';
  onSelectWing: (wing: 'B1' | 'B2') => void;
  onOpenCommandPalette: () => void;
  activeRole: 'supervisor' | 'contractor' | 'admin';
  onSelectRole: (role: 'supervisor' | 'contractor' | 'admin') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  activeWing,
  onSelectWing,
  onOpenCommandPalette,
  activeRole,
  onSelectRole,
}) => {
  const menuItems = [
    {
      id: 'resourceAllocation' as AdminMenuTab,
      label: 'Speed & Resource Center',
      subLabel: 'Bottlenecks & Manpower',
      icon: Zap,
      badge: 'CORE',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
    },
    {
      id: 'siteReports' as AdminMenuTab,
      label: 'Site Executive Reports',
      subLabel: 'Labor, Photos, Floors & Keys',
      icon: FileText,
      badge: 'NEW',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    },
    {
      id: 'executiveDashboard' as AdminMenuTab,
      label: 'Executive Overview',
      subLabel: 'Site Rollups & Analytics',
      icon: BarChart3,
    },
    {
      id: 'microTasks' as AdminMenuTab,
      label: 'Task Catalogue',
      subLabel: 'Master Tasks & Client Additions',
      icon: Layers,
    },
    {
      id: 'executionSequence' as AdminMenuTab,
      label: 'Execution Priority Sequence',
      subLabel: 'Phase Ordering & Progress',
      icon: ListOrdered,
      badge: 'NEW',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-800',
    },
    {
      id: 'contractors' as AdminMenuTab,
      label: 'Contractors & Labor Suite',
      subLabel: 'Assignment & Worker DB',
      icon: Users,
    },
    {
      id: 'dailyReports' as AdminMenuTab,
      label: 'Daily Target & Audit Hub',
      subLabel: 'End-of-Day WhatsApp Reports',
      icon: FileText,
    },
  ];

  const fieldItems = [
    {
      id: 'inspection' as AdminMenuTab,
      label: '5-Step Field Inspection',
      subLabel: 'Room Inspector Engine',
      icon: Layers,
    },
    {
      id: 'elevatorGrid' as AdminMenuTab,
      label: '2D Elevator Grid Matrix',
      subLabel: 'Visual 7 Floors Matrix',
      icon: Building2,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity md:hidden"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-tight">ConstructTrack</h2>
              <p className="text-[10px] text-slate-400 font-medium">Navigation Menu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Trigger */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenCommandPalette();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 text-xs transition group"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Search Flat (Ctrl+K)</span>
            </div>
            <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Wing Switcher Pills inside Sidebar */}
        <div className="px-3 pb-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
            <button
              onClick={() => onSelectWing('B1')}
              className={`flex-1 py-1.5 font-extrabold rounded-lg transition text-center ${
                activeWing === 'B1' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wing B1
            </button>
            <button
              onClick={() => onSelectWing('B2')}
              className={`flex-1 py-1.5 font-extrabold rounded-lg transition text-center ${
                activeWing === 'B2' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wing B2
            </button>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Admin Management Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Management Modules
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === 'admin' && activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectRole('admin');
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition group ${
                    isActive
                      ? 'bg-sky-600/90 text-white shadow-lg shadow-sky-600/20 font-bold border border-sky-500/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-400 group-hover:text-sky-300'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className={`text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                        {item.subLabel}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Field Execution Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Field Execution Views
            </div>

            {fieldItems.map((item) => {
              const Icon = item.icon;
              const isActive = (activeRole === 'supervisor' || activeRole === 'contractor') && 
                (item.id === 'inspection' || item.id === 'elevatorGrid');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectRole('supervisor');
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition group ${
                    isActive
                      ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-600/20 font-bold border border-amber-500/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className={`text-[10px] ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                        {item.subLabel}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] text-slate-400 font-medium">
          ConstructTrack v2.5 • Fast Build PWA
        </div>
      </aside>
    </>
  );
};
