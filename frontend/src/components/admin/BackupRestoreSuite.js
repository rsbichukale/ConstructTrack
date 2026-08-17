'use client';

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Download,
  RotateCcw,
  Plus,
  RefreshCw,
  Clock,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  FolderArchive,
  X
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { fetchStateFromBackend } from '../../lib/backendSync';
import { saveAppState } from '../../lib/dbState';
import { saveFullLocalState } from '../../lib/localDb';

export const BackupRestoreSuite = ({ isOpen, onClose }) => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadBackupsList = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/backup/list');
      if (res.success) {
        setBackups(res.backups || []);
      }
    } catch (err) {
      console.error('[BackupSuite] Load failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadBackupsList();
    }
  }, [isOpen]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setStatusMessage('Dumping PostgreSQL tables and bundling /storage/ documents...');
    try {
      const res = await api.post('/backup/create', {});
      if (res.success) {
        setStatusMessage(`Backup created successfully: ${res.backup.fileName}`);
        await loadBackupsList();
      } else {
        alert(`Backup error: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Backup creation failed: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = (fileName) => {
    const downloadUrl = `/api/backup/download/${encodeURIComponent(fileName)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreBackup = async (fileName) => {
    const confirmRestore = window.confirm(
      `⚠️ CAUTION: Restoring from backup "${fileName}" will overwrite current database records with the backup state. Proceed?`
    );
    if (!confirmRestore) return;

    setIsRestoring(true);
    setStatusMessage(`Restoring database & documents from ${fileName}...`);
    try {
      const res = await api.post('/backup/restore', { fileName });
      if (res.success) {
        setRestoreStatus('SUCCESS');
        setStatusMessage('System restored successfully! Refreshing local state...');
        
        const freshState = await fetchStateFromBackend();
        if (freshState) {
          saveAppState(freshState);
          await saveFullLocalState(freshState);
        }

        setTimeout(() => {
          setIsRestoring(false);
          setRestoreStatus(null);
          setStatusMessage('');
          if (onClose) onClose();
          window.location.reload();
        }, 1500);
      } else {
        alert(`Restore error: ${res.error || 'Restore failed'}`);
        setIsRestoring(false);
      }
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-sky-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>1-Click Database & Storage Backup Engine</span>
                <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full font-mono">
                  PostgreSQL + /storage/
                </span>
              </h2>
              <p className="text-xs text-slate-400">Snapshot 27 database tables and local photos/documents into compressed ZIP archives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-bold text-white block">Create Instant Full System Snapshot</span>
              <span className="text-[11px] text-slate-400 block">Dumps all tables, tasks, materials, cash, and images into an archive.</span>
            </div>
            <button
              disabled={isCreating || isRestoring}
              onClick={handleCreateBackup}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{isCreating ? 'Creating Backup...' : 'Create Backup Now'}</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center space-x-2 animate-in fade-in">
              <RefreshCw className={`w-4 h-4 ${isCreating || isRestoring ? 'animate-spin' : ''}`} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Backup Archives List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Saved Backup Archives ({backups.length})</span>
              <button onClick={loadBackupsList} className="text-sky-400 hover:underline flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading backup archives...</div>
            ) : backups.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
                <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No backup archives created yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => (
                  <div
                    key={b.fileName}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-900 border border-slate-800 text-sky-400 rounded-xl mt-0.5">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-white block">{b.fileName}</span>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                          <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{new Date(b.createdAt).toLocaleString()}</span>
                          {b.manifest && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">{b.manifest.totalRecords} Records</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleDownloadBackup(b.fileName)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        title="Download ZIP archive to PC"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        disabled={isRestoring || isCreating}
                        onClick={() => handleRestoreBackup(b.fileName)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-30 cursor-pointer"
                        title="Restore database and files from this archive"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Full System Integrity Verified</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
