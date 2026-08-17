'use client';

import React, { useState, useEffect } from 'react';
import { getAppState, subscribeState, initializeBackendState, saveAppState } from '../lib/dbState';
import { runSyncEngine } from '../lib/syncEngine';
import { getSessionUser, logoutUser } from '../lib/auth';
import { CommandPalette } from '../components/navigation/CommandPalette';
import { SupervisorFlow } from '../components/layout/SupervisorFlow';
import { AdminViewsContainer } from '../components/layout/AdminViewsContainer';
import { BulkFloorLogger } from '../components/inspection/BulkFloorLogger';
import { ContractorPortal } from '../components/contractor/ContractorPortal';
import { LoginPage } from '../components/auth/LoginPage';
import { ProjectSetupWizard } from '../components/admin/ProjectSetupWizard';
import { DesktopLayout } from '../components/desktop/DesktopLayout';

export default function ConstructTrackApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSiteId, setActiveSiteId] = useState(1);
  const [activeWing, setActiveWing] = useState('A');
  const [activeRole, setActiveRole] = useState('');
  const [activeSubTool, setActiveSubTool] = useState('towerElevation');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(2);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [selectedRoomZone, setSelectedRoomZone] = useState(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBulkLoggerOpen, setIsBulkLoggerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('drilldown');

  const [stateVersion, setRerender] = useState(0);

  const handleSelectSubTool = (toolId) => {
    setActiveSubTool(toolId);
    if (toolId === 'inspection') {
      setViewMode('drilldown');
      setCurrentStep(2);
    } else if (toolId === 'elevatorGrid') {
      setViewMode('elevatorGrid');
    }
  };

  const handleSelectFlat = (flat) => {
    setSelectedFlat(flat);
    if (flat?.floorNumber != null) {
      setSelectedFloor(flat.floorNumber);
    }
    if (flat?.wing) {
      setActiveWing(flat.wing);
    }
    setActiveSubTool('inspection');
    setCurrentStep(2);
  };

  useEffect(() => {
    let isActive = true;
    setIsMounted(true);
    // Initialize local database state immediately on boot
    void initializeBackendState();
    
    getSessionUser().then(async (user) => {
      if (!isActive) return;
      setCurrentUser(user);
      if (user) {
        setActiveRole(user.role || 'admin');
      }
    });

    const unsubscribe = subscribeState(() => {
      if (isActive) {
        setRerender(n => n + 1);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const appState = getAppState();
  const flatsCount = (appState.flats || []).length || 70;
  const contractorsCount = (appState.contractors || []).length || 14;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={async (user) => {
          setCurrentUser(user);
          setActiveRole(user.role || 'admin');
          await initializeBackendState();
        }}
      />
    );
  }

  return (
    <>
      {/* Company-Wide Desktop Application Shell */}
      <DesktopLayout
        activeTab={activeSubTool}
        onSelectTab={handleSelectSubTool}
        activeWing={activeWing}
        onSelectWing={setActiveWing}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        currentUser={currentUser}
        onLogout={async () => {
          try {
            await logoutUser();
            setCurrentUser(null);
          } catch (error) {
            console.error('Unable to end session:', error);
          }
        }}
        onQuickAction={(action) => {
          if (action === 'logFuel') setActiveSubTool('machineryWorkspace');
          else if (action === 'musterRoll') setActiveSubTool('workforceHub');
          else if (action === 'issueAdvance') setActiveSubTool('advances');
          else if (action === 'generateBill') setActiveSubTool('raBilling');
          else if (action === 'inwardGRN') setActiveSubTool('materialsWorkspace');
        }}
        flatsCount={flatsCount}
        contractorsCount={contractorsCount}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeWing={activeWing}
        onSelectFlat={handleSelectFlat}
      />

      {/* Project Setup Wizard Modal */}
      {isWizardOpen && (
        <ProjectSetupWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={async (freshState) => {
            if (freshState && (freshState.flats || []).length > 0) {
              saveAppState({ ...getAppState(), ...freshState });
            }
            setIsWizardOpen(false);
            void runSyncEngine(true);
          }}
        />
      )}
    </>
  );
}
