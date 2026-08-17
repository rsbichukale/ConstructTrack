'use client';

import React from 'react';
import { 
  Building2, 
  X, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  Layers,
  Users,
  Package,
  Wallet,
  ShieldAlert,
  Shield
} from 'lucide-react';
import { WORKSPACES } from '../../config/workspaces.config';

export const Sidebar = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  activeWing,
  onSelectWing,
  onOpenCommandPalette,
  onOpenSetupWizard,
  activeRole,
  currentUser,
  activeWorkspace = 'hub',
  onReturnToHub,
  onSelectWorkspace,
}) => {
  const currentWs = WORKSPACES[activeWorkspace];

  const workspacePermissions = new Set(currentUser?.workspacePermissions || []);
  const accessibleWorkspaces = Object.values(WORKSPACES).filter(ws => workspacePermissions.has(ws.id));

  // Scoped tools for the current active workspace
  const scopedTools = currentWs ? currentWs.tools : [];

  const roleInfo = {
    label: currentUser?.roleName || activeRole || 'Staff',
    color: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl font-bold shadow-md shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-wide">ConstructTrack</div>
              <div className="text-[10px] text-slate-400 font-mono">Site Management ERP</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Role Badge */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'Authorized User'}</div>
            <span className={`inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Back to Hub Action Button */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800">
          <button
            onClick={() => {
              if (onReturnToHub) onReturnToHub();
              onClose();
            }}
            className={`w-full p-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-between transition cursor-pointer group ${
              activeWorkspace === 'hub'
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ArrowLeft className={`w-4 h-4 ${activeWorkspace === 'hub' ? 'text-slate-950' : 'text-amber-400 group-hover:-translate-x-0.5 transition'}`} />
              <span>Main Command Hub</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">Launchpad</span>
          </button>
        </div>

        {/* Workspace Scoped Tools */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeWorkspace !== 'hub' && currentWs ? (
            <div className="space-y-2">
              {/* Workspace Header Banner */}
              <div className="p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                    Active Workspace
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${currentWs.badgeColor}`}>
                    {currentWs.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white leading-tight">{currentWs.title}</div>
              </div>

              {/* Scoped Tools List */}
              <div className="space-y-1 pt-1">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Workspace Tools ({scopedTools.length})
                </div>

                {scopedTools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTab(tool.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400 group-hover:text-amber-300'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight truncate">{tool.label}</div>
                          {tool.subLabel && (
                            <div className={`text-[10px] truncate ${isActive ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                              {tool.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {tool.badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${
                          isActive ? 'bg-slate-950 text-amber-400 border-slate-900' : tool.badgeColor
                        }`}>
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Switch to Other Workspaces */}
              <div className="pt-3 border-t border-slate-800 space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Switch Workspace:
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {accessibleWorkspaces
                    .filter(ws => ws.id !== activeWorkspace)
                    .map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          if (onSelectWorkspace) onSelectWorkspace(ws.id, ws.defaultTool);
                          onClose();
                        }}
                        className="p-2 bg-slate-950/70 hover:bg-slate-800 rounded-xl border border-slate-800 text-left text-[11px] font-bold text-slate-300 hover:text-white truncate transition cursor-pointer"
                      >
                        {ws.shortTitle}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* When in Hub Mode: Show Workspace Cards in Sidebar */
            <div className="space-y-2">
              <div className="px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Workspaces ({accessibleWorkspaces.length})
              </div>
              <div className="space-y-1.5">
                {accessibleWorkspaces.map((ws) => {
                  const Icon = ws.icon;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        if (onSelectWorkspace) onSelectWorkspace(ws.id, ws.defaultTool);
                        onClose();
                      }}
                      className="w-full p-2.5 bg-slate-950/80 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${ws.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                            {ws.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {ws.tools.length} Tools
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Project Setup Wizard Action for Admins */}
        {activeRole === 'admin' && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800">
            <button
              onClick={() => {
                if (onOpenSetupWizard) onOpenSetupWizard();
                onClose();
              }}
              className="w-full p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Project Setup Wizard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
