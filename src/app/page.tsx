'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { StepNavigator, StepNumber } from '@/components/navigation/StepNavigator';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar, AdminMenuTab } from '@/components/navigation/Sidebar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { FloorSelector } from '@/components/inspection/FloorSelector';
import { FlatSelector } from '@/components/inspection/FlatSelector';
import { FloorPlanZones } from '@/components/inspection/FloorPlanZones';
import { RoomInspector } from '@/components/inspection/RoomInspector';
import { ElevatorGrid } from '@/components/inspection/ElevatorGrid';
import { BulkFloorLogger } from '@/components/inspection/BulkFloorLogger';
import { ContractorPortal } from '@/components/contractor/ContractorPortal';
import { ExecutiveDashboard } from '@/components/admin/ExecutiveDashboard';
import { ResourceAllocationCenter } from '@/components/admin/ResourceAllocationCenter';
import { MicroTaskManager } from '@/components/admin/MicroTaskManager';
import { ContractorManagementSuite } from '@/components/admin/ContractorManagementSuite';
import { DailyReportHub } from '@/components/admin/DailyReportHub';
import { ExecutionSequenceManager } from '@/components/admin/ExecutionSequenceManager';
import { SiteReportsCenter } from '@/components/admin/SiteReportsCenter';
import { LoginPage } from '@/components/auth/LoginPage';
import { getSessionUser, logoutUser, AppUser } from '@/lib/auth';
import { Flat, RoomZone } from '@/lib/types';
import { subscribeState, getAppState, initializeSupabaseState } from '@/lib/dbState';
import { Building2, Zap, Layers, Grid, Home as HomeIcon } from 'lucide-react';

export default function ConstructTrackApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeSiteId, setActiveSiteId] = useState<number>(1);
  const [activeWing, setActiveWing] = useState<'B1' | 'B2'>('B1');
  const [activeRole, setActiveRole] = useState<'supervisor' | 'contractor' | 'admin'>('supervisor');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminMenuTab>('resourceAllocation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Step Drilldown Navigation state
  const [currentStep, setCurrentStep] = useState<StepNumber>(2); // Default Step 2 (Floor Select)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(1);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [selectedRoomZone, setSelectedRoomZone] = useState<RoomZone | null>(null);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBulkLoggerOpen, setIsBulkLoggerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'drilldown' | 'elevatorGrid'>('drilldown');

  // Handle Tab Selection from Sidebar
  const handleSelectAdminTab = (tab: AdminMenuTab) => {
    if (tab === 'inspection') {
      setActiveRole('supervisor');
      setViewMode('drilldown');
    } else if (tab === 'elevatorGrid') {
      setActiveRole('supervisor');
      setViewMode('elevatorGrid');
    } else {
      setActiveAdminTab(tab);
    }
  };

  const [, setRerender] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getSessionUser());
    initializeSupabaseState();

    // Subscribe to state changes
    const unsubscribe = subscribeState(() => {
      setRerender(n => n + 1);
    });

    // Register Service Worker for PWA Offline Sync
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('[PWA] ServiceWorker registered:', reg.scope))
        .catch(err => console.error('[PWA] ServiceWorker registration failed:', err));
    }

    // Global Ctrl+K / Cmd+K Hotkey Listener
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleSelectFloor = (floor: number) => {
    setSelectedFloor(floor);
    setSelectedFlat(null);
    setSelectedRoomZone(null);
    setCurrentStep(3); // Advance to Flat Select
  };

  const handleSelectFlat = (flat: Flat) => {
    setSelectedFlat(flat);
    setSelectedFloor(flat.floorNumber);
    setActiveWing(flat.wing);
    setSelectedRoomZone(null);
    setCurrentStep(4); // Advance to Floor Plan Zones
  };

  const handleSelectRoomZone = (zone: RoomZone) => {
    setSelectedRoomZone(zone);
    setCurrentStep(5); // Advance to Room Inspection
  };

  const handleStepChange = (step: StepNumber) => {
    setCurrentStep(step);
    if (step === 2) {
      setSelectedFlat(null);
      setSelectedRoomZone(null);
    } else if (step === 3) {
      setSelectedRoomZone(null);
    }
  };

  // If user is not logged in, render the login page lockdown screen
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-sans">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-ping"></div>
          <span>Initializing ConstructTrack...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-6">
      {/* Sidebar Menu Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeAdminTab}
        onSelectTab={handleSelectAdminTab}
        activeWing={activeWing}
        onSelectWing={setActiveWing}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
      />

      {/* App Header */}
      <Header
        activeSiteId={activeSiteId}
        onSelectSite={setActiveSiteId}
        activeWing={activeWing}
        onSelectWing={(wing) => {
          setActiveWing(wing);
          setSelectedFlat(null);
          setSelectedRoomZone(null);
          if (currentStep > 2) setCurrentStep(2);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
        onLogout={() => {
          logoutUser();
          setCurrentUser(null);
        }}
      />

      {/* Main Content Body */}
      {activeRole === 'supervisor' && (
        <div className="md:pl-72">
          {/* Step Navigator Bar */}
          <StepNavigator
            currentStep={currentStep}
            onSelectStep={handleStepChange}
            selectedWing={activeWing}
            selectedFloor={selectedFloor}
            selectedFlatNumber={selectedFlat ? selectedFlat.flatNumber : null}
            selectedRoomLabel={selectedRoomZone ? selectedRoomZone.zoneLabel : null}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

            {/* Drilldown Mode */}
            {viewMode === 'drilldown' && (
              <>
                {currentStep === 2 && (
                  <FloorSelector
                    wing={activeWing}
                    selectedFloor={selectedFloor}
                    onSelectFloor={handleSelectFloor}
                  />
                )}

                {currentStep === 3 && selectedFloor && (
                  <FlatSelector
                    wing={activeWing}
                    floorNumber={selectedFloor}
                    selectedFlatId={selectedFlat?.id || null}
                    onSelectFlat={handleSelectFlat}
                  />
                )}

                {currentStep === 4 && selectedFlat && (
                  <FloorPlanZones
                    flat={selectedFlat}
                    selectedZoneId={selectedRoomZone?.id || null}
                    onSelectZone={handleSelectRoomZone}
                  />
                )}

                {currentStep === 5 && selectedFlat && selectedRoomZone && (
                  <RoomInspector
                    flat={selectedFlat}
                    roomZone={selectedRoomZone}
                    onBackToZones={() => setCurrentStep(4)}
                  />
                )}
              </>
            )}

            {/* Elevator Grid View */}
            {viewMode === 'elevatorGrid' && (
              <ElevatorGrid
                wing={activeWing}
                onSelectFlat={(flat) => {
                  handleSelectFlat(flat);
                  setViewMode('drilldown');
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* Contractor Portal View */}
      {activeRole === 'contractor' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:pl-72">
          <ContractorPortal />
        </main>
      )}

      {/* Admin Dashboard View with Separate Sidebar Menu Options */}
      {activeRole === 'admin' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:pl-72 space-y-6">
          {activeAdminTab === 'resourceAllocation' && <ResourceAllocationCenter />}
          {activeAdminTab === 'siteReports' && <SiteReportsCenter />}
          {activeAdminTab === 'executiveDashboard' && <ExecutiveDashboard />}
          {activeAdminTab === 'microTasks' && <MicroTaskManager />}
          {activeAdminTab === 'executionSequence' && <ExecutionSequenceManager />}
          {activeAdminTab === 'contractors' && <ContractorManagementSuite />}
          {activeAdminTab === 'dailyReports' && <DailyReportHub />}
        </main>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <BottomNav
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFlat={(flat) => {
          handleSelectFlat(flat);
          setActiveRole('supervisor');
          setViewMode('drilldown');
        }}
      />

      {selectedFloor && (
        <BulkFloorLogger
          isOpen={isBulkLoggerOpen}
          onClose={() => setIsBulkLoggerOpen(false)}
          wing={activeWing}
          floorNumber={selectedFloor}
        />
      )}
    </div>
  );
}
