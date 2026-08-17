'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Search, Wifi, WifiOff, Menu, LogOut, User, Key, Database, Sparkles, Shield, ChevronDown, ArrowLeft, Layers } from 'lucide-react';
import { updateUserProfile } from '../../lib/auth';
import { WORKSPACES } from '../../config/workspaces.config';

export const Header = ({
  activeSiteId,
  onSiteChange,
  activeWing,
  onWingChange,
  wings = [],
  onOpenCommandPalette,
  onToggleSidebar,
  currentUser,
  onLogout,
  onProjectSetupComplete,
  activeRole,
  activeWorkspace = 'hub',
  onReturnToHub,
  onSelectWorkspace,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newOwnerName, setNewOwnerName] = useState(currentUser?.name || 'Site Manager & Owner');
  const [securityMsg, setSecurityMsg] = useState(null);

  const currentWsConfig = WORKSPACES[activeWorkspace];

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    const res = await updateUserProfile(
      newOwnerName.trim() || currentUser?.name || 'ConstructTrack User',
      newPassword.trim() || undefined
    );
    if (!res.success) {
      setSecurityMsg(`Unable to update account: ${res.error || 'Request failed'}`);
      return;
    }
    setNewPassword('');
    setSecurityMsg('Account credentials updated via backend.');
    setTimeout(() => {
      setSecurityMsg(null);
      setIsSecurityModalOpen(false);
    }, 2000);
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-2.5 sm:px-4 py-2 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Branding OR Back to Hub + Workspace Header */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 shrink min-w-0">
            {activeWorkspace !== 'hub' ? (
              <>
                {/* Back to Command Hub Button */}
                <button
                  onClick={onReturnToHub}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-amber-400 font-bold rounded-xl text-xs transition flex items-center space-x-1 shadow-sm shrink-0 cursor-pointer"
                  title="Return to Main Command Hub"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs font-black">Hub</span>
                </button>

                {/* Scoped Sidebar Toggle */}
                {onToggleSidebar && (
                  <button
                    onClick={onToggleSidebar}
                    className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-800 transition shrink-0 cursor-pointer"
                    title="Open Workspace Tools Sidebar"
                  >
                    <Menu className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Active Workspace Title & Icon */}
                {currentWsConfig && (
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <div className={`p-1.5 rounded-xl font-bold shrink-0 ${currentWsConfig.iconBg}`} title={currentWsConfig.title}>
                      {React.createElement(currentWsConfig.icon, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' })}
                    </div>
                    <div className="min-w-0 hidden md:block">
                      <div className="font-black text-xs sm:text-sm text-white tracking-tight truncate leading-tight">
                        {currentWsConfig.title}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Global Hub Sidebar Toggle */}
                {onToggleSidebar && (
                  <button
                    onClick={onToggleSidebar}
                    className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-800 transition shrink-0 cursor-pointer"
                    title="Open Management Modules"
                  >
                    <Menu className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Brand Logo */}
                <div 
                  onClick={onReturnToHub}
                  className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer group shrink-0"
                  title="ConstructTrack Command Hub"
                >
                  <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="hidden xs:block">
                    <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-amber-300 transition">ConstructTrack</span>
                    <span className="text-[9px] text-amber-400 font-mono ml-1 font-bold">ERP</span>
                  </div>
                </div>
              </>
            )}

            {/* Contextual Wing Switcher (Execution Workspace) */}
            {activeWorkspace === 'execution' && wings.length > 0 && onWingChange && (
              <div className="flex items-center space-x-0.5 bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 shrink-0">
                {wings.map((wing) => (
                  <button
                    key={wing}
                    onClick={() => onWingChange(wing)}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black transition cursor-pointer ${
                      activeWing === wing
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {wing}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Quick Search Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:flex items-center space-x-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 px-3 py-1.5 rounded-xl text-xs transition-all w-52 xl:w-64 justify-between group"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 group-hover:text-amber-400 transition-colors" />
                <span>Search flat or task...</span>
              </div>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Right: Actions, Role Switcher & User Menu */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Authenticated Role Badge (Locked - No role switching) */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-black text-amber-300 shrink-0 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{currentUser?.roleName || activeRole || 'Staff'}</span>
            </div>

            {/* Offline/Online Status Indicator */}
            <div
              className={`flex items-center space-x-1 p-1.5 sm:px-2 sm:py-1 rounded-xl text-xs font-bold border shrink-0 ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
              }`}
              title={isOnline ? 'Online - Synced with Local DB & Cloud' : 'Offline Mode Active'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Database Cloud Sync Button */}
            <button
              onClick={async () => {
                try {
                  const { runSyncEngine } = await import('../../lib/syncEngine');
                  await runSyncEngine(true);
                } catch (e) {
                  console.warn('Sync failed:', e);
                }
              }}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/80 active:scale-95 transition cursor-pointer shrink-0"
              title="Force Full Snapshot Sync"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Sync</span>
            </button>

            {currentUser && (
              <div className="flex items-center space-x-1 pl-1 sm:pl-1.5 border-l border-slate-800 shrink-0">
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
                  title="Change Password & Security Credentials"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white rounded-xl border border-rose-900/60 transition cursor-pointer shrink-0"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Security Credentials Modal */}
      {isSecurityModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsSecurityModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-base">Account Security & Role</h3>
              </div>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {securityMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-bold">
                {securityMsg}
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Account User Name</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
