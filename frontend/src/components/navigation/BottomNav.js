'use client';

import React from 'react';
import { 
  Home, 
  Layers, 
  Building2, 
  Users, 
  GitCommit, 
  Search, 
  Package, 
  Wallet, 
  Sparkles, 
  Key, 
  ShieldAlert, 
  FlaskConical, 
  FileText, 
  Receipt,
  Truck
} from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';
import { WORKSPACES } from '../../config/workspaces.config';

export const BottomNav = ({
  activeWorkspace = 'hub',
  activeSubTool = 'floorRoomMatrix',
  onSelectSubTool,
  onEnterWorkspace,
  onReturnToHub,
  onOpenCommandPalette,
}) => {
  const handleOpenSearch = () => {
    triggerHaptic('light');
    if (onOpenCommandPalette) onOpenCommandPalette();
  };

  const handleToolClick = (toolId) => {
    triggerHaptic('light');
    if (onSelectSubTool) onSelectSubTool(toolId);
  };

  const handleHubClick = () => {
    triggerHaptic('light');
    if (onReturnToHub) onReturnToHub();
  };

  // Define scoped bottom tabs for each workspace
  const getNavItems = () => {
    switch (activeWorkspace) {
      case 'execution':
        return {
          left: [
            { id: 'floorRoomMatrix', label: 'Matrix', icon: Layers },
            { id: 'inspection', label: 'Checklist', icon: Building2 },
          ],
          right: [
            { id: 'elevatorGrid', label: '2D View', icon: Building2 },
            { id: 'siteReports', label: 'Reports', icon: FileText },
          ]
        };

      case 'workforce':
        return {
          left: [
            { id: 'pendingWork', label: 'Pending', icon: Users },
            { id: 'resourceAllocation', label: 'Manpower', icon: Users },
          ],
          right: [
            { id: 'contractors', label: 'Rates', icon: Users },
            { id: 'hub_return', label: 'Hub', icon: Home, isHub: true },
          ]
        };

      case 'materials':
        return {
          left: [
            { id: 'materialsHub', label: 'GRN Inward', icon: Package },
            { id: 'materialsHub', label: 'Stock', icon: Package },
          ],
          right: [
            { id: 'materialsHub', label: 'Indents', icon: Package },
            { id: 'hub_return', label: 'Hub', icon: Home, isHub: true },
          ]
        };

      case 'finance':
        return {
          left: [
            { id: 'pettyCash', label: 'Petty Cash', icon: Wallet },
            { id: 'billingLedger', label: 'Billing', icon: Receipt },
          ],
          right: [
            { id: 'billingLedger', label: 'Claims', icon: Receipt },
            { id: 'hub_return', label: 'Hub', icon: Home, isHub: true },
          ]
        };

      case 'sales':
        return {
          left: [
            { id: 'clientChanges', label: 'Variations', icon: Sparkles },
            { id: 'salesHandover', label: 'Handover', icon: Key },
          ],
          right: [
            { id: 'executiveDashboard', label: 'Progress', icon: Building2 },
            { id: 'hub_return', label: 'Hub', icon: Home, isHub: true },
          ]
        };

      case 'safety_qa':
        return {
          left: [
            { id: 'safety', label: 'Safety HSE', icon: ShieldAlert },
            { id: 'concreteQA', label: 'Cube Tests', icon: FlaskConical },
          ],
          right: [
            { id: 'machinery', label: 'Diesel Log', icon: Truck },
            { id: 'visitorGate', label: 'Gate Pass', icon: Building2 },
          ]
        };

      case 'admin':
        return {
          left: [
            { id: 'userManagement', label: 'Users', icon: Users },
            { id: 'masterTemplates', label: 'Templates', icon: Building2 },
          ],
          right: [
            { id: 'executiveDashboard', label: 'Executive', icon: Building2 },
            { id: 'hub_return', label: 'Hub', icon: Home, isHub: true },
          ]
        };

      default: // 'hub' mode
        return {
          left: [
            { id: 'hub_home', label: 'Hub', icon: Home, isHub: true },
            { id: 'execution_launch', label: 'Flats', icon: Layers, workspaceId: 'execution', toolId: 'floorRoomMatrix' },
          ],
          right: [
            { id: 'workforce_launch', label: 'Labor', icon: Users, workspaceId: 'workforce', toolId: 'pendingWork' },
            { id: 'materials_launch', label: 'Store', icon: Package, workspaceId: 'materials', toolId: 'materialsHub' },
          ]
        };
    }
  };

  const navItems = getNavItems();

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const isHubButton = item.isHub || item.id === 'hub_home' || item.id === 'hub_return';
    const isActive = isHubButton 
      ? activeWorkspace === 'hub'
      : activeSubTool === item.id;

    const handleClick = () => {
      if (isHubButton) {
        handleHubClick();
      } else if (item.workspaceId) {
        triggerHaptic('light');
        if (onEnterWorkspace) onEnterWorkspace(item.workspaceId, item.toolId);
      } else {
        handleToolClick(item.id);
      }
    };

    return (
      <button
        key={item.id + item.label}
        onClick={handleClick}
        className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
          isActive
            ? 'text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-amber-400 stroke-[2.5]' : 'text-slate-400'}`} />
        <span className="text-[9px] truncate max-w-[58px] tracking-tight">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl px-2 pt-1.5 pb-safe flex items-center justify-between text-[10px] font-bold text-slate-400">
      {/* Left items */}
      <div className="flex items-center space-x-1 flex-1 justify-around">
        {navItems.left.map(renderNavButton)}
      </div>

      {/* Floating Center Search Trigger */}
      <button
        onClick={handleOpenSearch}
        className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] py-1 px-1 text-amber-400 font-bold hover:text-amber-300 transition shrink-0 mx-1 cursor-pointer"
        title="Search Flats or Tasks (⌘K)"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 -mt-5 border-2 border-slate-900 active:scale-95 transition">
          <Search className="w-4 h-4 stroke-[2.5]" />
        </div>
        <span className="mt-0.5 text-[8px] font-black uppercase tracking-wider">Search</span>
      </button>

      {/* Right items */}
      <div className="flex items-center space-x-1 flex-1 justify-around">
        {navItems.right.map(renderNavButton)}
      </div>
    </div>
  );
};

