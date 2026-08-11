'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Search, Wifi, WifiOff, Menu, LogOut, User, Key, Database, RefreshCw, UploadCloud } from 'lucide-react';
import { AppUser } from '@/lib/auth';
import { updateAdminCredentials, getAppState } from '@/lib/dbState';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { seedFullProjectDataToSupabase } from '@/lib/supabaseSync';

interface HeaderProps {
  activeSiteId: number;
  onSelectSite: (siteId: number) => void;
  activeWing: 'B1' | 'B2';
  onSelectWing: (wing: 'B1' | 'B2') => void;
  onOpenCommandPalette: () => void;
  activeRole: 'supervisor' | 'contractor' | 'admin';
  onSelectRole: (role: 'supervisor' | 'contractor' | 'admin') => void;
  onToggleSidebar?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSiteId,
  onSelectSite,
  activeWing,
  onSelectWing,
  onOpenCommandPalette,
  activeRole,
  onSelectRole,
  onToggleSidebar,
  currentUser,
  onLogout,
}) => {
  const [isOnline, setIsOnline] = useState(true);

  // Security Credentials Modal state
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [newOwnerName, setNewOwnerName] = useState(currentUser?.name || 'Site Manager & Owner');
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminCredentials({
      username: newUsername.trim() || 'admin',
      passwordHash: newPassword.trim() || 'admin',
      name: newOwnerName.trim() || 'Site Manager & Owner',
    });

    setSecurityMsg('Credentials saved directly to database!');
    setTimeout(() => {
      setSecurityMsg(null);
      setIsSecurityModalOpen(false);
    }, 2000);
  };

  const handleMigrateDatabaseToSupabase = async () => {
    setIsMigrating(true);
    setSecurityMsg('Migrating complete database dataset & Micro-Tasks to Supabase Cloud...');
    
    const state = getAppState();
    const result = await seedFullProjectDataToSupabase(state);
    
    setIsMigrating(false);
    if (result.success) {
      setSecurityMsg(`✅ ${result.message}`);
    } else {
      setSecurityMsg(`❌ Migration Failed: ${result.message}`);
    }
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl md:pl-72">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                ConstructTrack
              </h1>
              <span className="px-1.5 py-0.2 text-[10px] sm:text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                PWA
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium">Daily Progress & Resource System</p>
          </div>
        </div>

        {/* Desktop Role Switcher (Hidden on Mobile) */}
        <div className="hidden md:flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => onSelectRole('supervisor')}
            className={`px-3 py-1 font-medium rounded-md transition ${
              activeRole === 'supervisor'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Field Supervisor
          </button>
          <button
            onClick={() => onSelectRole('contractor')}
            className={`px-3 py-1 font-medium rounded-md transition ${
              activeRole === 'contractor'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Contractor Portal
          </button>
          <button
            onClick={() => onSelectRole('admin')}
            className={`px-3 py-1 font-medium rounded-md transition ${
              activeRole === 'admin'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Dashboard
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Wing Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-[11px] sm:text-xs">
            <button
              onClick={() => onSelectWing('B1')}
              className={`px-2.5 sm:px-3 py-1 font-extrabold rounded-lg transition flex items-center space-x-1.5 ${
                activeWing === 'B1' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeWing === 'B1' ? 'bg-sky-300 animate-pulse' : 'bg-slate-600'}`} />
              <span>Wing B1</span>
            </button>
            <button
              onClick={() => onSelectWing('B2')}
              className={`px-2.5 sm:px-3 py-1 font-extrabold rounded-lg transition flex items-center space-x-1.5 ${
                activeWing === 'B2' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeWing === 'B2' ? 'bg-amber-300 animate-pulse' : 'bg-slate-600'}`} />
              <span>Wing B2</span>
            </button>
          </div>

          {/* Quick Search Button (Desktop) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium transition"
            title="Search Flat (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden lg:inline text-[9px] bg-slate-900 text-slate-400 px-1 py-0.5 rounded border border-slate-700">
              Ctrl K
            </kbd>
          </button>

          {/* Database & Cloud Connection Status Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
              isSupabaseConfigured
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-900 text-sky-400 border-slate-800'
            }`}
            title={isSupabaseConfigured ? 'Supabase PostgreSQL Cloud DB Connected' : 'Local PWA Database Mode'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Cloud DB' : 'Local DB (PWA)'}</span>
          </div>

          {/* User Profile & Security Settings */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-extrabold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">{currentUser.role}</span>
              </div>

              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                title="Change Password & Security Credentials"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    if (confirm(`Log out ${currentUser.name} from ConstructTrack?`)) {
                      onLogout();
                    }
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition"
                  title="Log Out Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CHANGE SECURITY CREDENTIALS MODAL */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Change Database Security Credentials</span>
              </h3>
              <button onClick={() => setIsSecurityModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {securityMsg && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-semibold">
                {securityMsg}
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold">Owner Display Name</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold">Login ID / Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-amber-400 font-bold">New Password</label>
                <input
                  type="text"
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-amber-800 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <span>Supabase Database Migration</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Migrate all 87 Micro-Tasks, 11 Room Zones, 70 Flats, Contractors & 3,000+ Flat Task Matrix entries directly to your Supabase PostgreSQL Cloud database.
                </p>
                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={handleMigrateDatabaseToSupabase}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Migrating Database...' : 'Migrate All Micro-Tasks & Project Data to Supabase Cloud'}</span>
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
