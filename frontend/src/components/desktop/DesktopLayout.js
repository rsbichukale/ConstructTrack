'use client';

import React, { useState, useEffect } from 'react';
import DesktopSidebar, { DESKTOP_NAV_MODULES } from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';
import DesktopStatusBar from './DesktopStatusBar';
import { AdminViewsContainer } from '../layout/AdminViewsContainer';

export const DesktopLayout = ({
  activeTab,
  onSelectTab,
  activeWing,
  onSelectWing,
  onOpenCommandPalette,
  currentUser,
  onLogout,
  onQuickAction,
  flatsCount = 70,
  contractorsCount = 14
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openTabs, setOpenTabs] = useState([
    { id: 'towerElevation', label: '🏗️ 2D Elevation Matrix' },
    { id: 'raBilling', label: '💰 Subcontractor RA Bills' }
  ]);

  // Tab label mapper
  const getTabLabel = (tabId) => {
    for (const mod of DESKTOP_NAV_MODULES) {
      const found = mod.items.find(i => i.id === tabId);
      if (found) return found.label;
    }
    if (tabId === 'billingLedger' || tabId === 'raBilling') return '💰 RA Billing & Deductions';
    if (tabId === 'machineryWorkspace' || tabId === 'machinery') return '🚜 Plant Fleet & Fuel';
    if (tabId === 'workforceHub') return '👷 Labor Muster Roll';
    if (tabId === 'materialsWorkspace') return '📦 Inventory & GRN';
    return tabId;
  };

  const handleSelectTab = (tabId) => {
    // If not already in openTabs, add it
    if (!openTabs.some(t => t.id === tabId)) {
      setOpenTabs(prev => [...prev, { id: tabId, label: getTabLabel(tabId) }]);
    }
    onSelectTab(tabId);
  };

  const handleCloseTab = (tabId) => {
    const remaining = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(remaining);
    if (activeTab === tabId && remaining.length > 0) {
      onSelectTab(remaining[remaining.length - 1].id);
    }
  };

  // Keyboard shortcut listener for desktop (Ctrl+K, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Top Command Ribbon */}
      <DesktopTopBar
        openTabs={openTabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        activeWing={activeWing}
        onSelectWing={onSelectWing}
        onOpenCommandPalette={onOpenCommandPalette}
        currentUser={currentUser}
        onLogout={onLogout}
        onQuickAction={onQuickAction}
      />

      {/* 2. Main Desktop Work Area (Sidebar + Full Workspace Container) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Persistent Navigation Dock */}
        <DesktopSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Central High-Density Workspace (Full Width Desktop Screen) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 p-3 sm:p-5 custom-scrollbar">
          <div className="w-full max-w-[1800px] mx-auto space-y-4">
            <AdminViewsContainer
              activeAdminTab={activeTab}
              activeTab={activeTab}
            />
          </div>
        </main>
      </div>

      {/* 3. Bottom Status Bar */}
      <DesktopStatusBar
        activeWing={activeWing}
        flatsCount={flatsCount}
        contractorsCount={contractorsCount}
        serverPort={5000}
      />
    </div>
  );
};

export default DesktopLayout;
