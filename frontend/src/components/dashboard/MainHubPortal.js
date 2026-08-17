'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Users, 
  Package, 
  Wallet, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  Building2, 
  Key, 
  Receipt, 
  FileText, 
  Truck, 
  FlaskConical, 
  DoorOpen, 
  Activity,
  ChevronRight,
  Search,
  Shield,
  Wifi,
  WifiOff,
  Database,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  HardHat,
  Lock,
  Zap,
  Briefcase
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { WORKSPACES } from '../../config/workspaces.config';

export const MainHubPortal = ({ 
  currentUser,
  activeRole = '', 
  onEnterWorkspace, 
  activeWing = '', 
  onSelectWing,
  wings = [],
  onOpenCommandPalette,
  onLogout,
  onOpenSecurityModal
}) => {
  const appState = getAppState() || {};
  const flats = appState.flats || [];
  const tasks = appState.flatTasks || [];
  const contractors = appState.contractors || [];
  const attendance = appState.contractorAttendance || [];

  const [isOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const handleLaunch = (workspaceId, toolId) => {
    if (onEnterWorkspace) {
      onEnterWorkspace(workspaceId, toolId);
    }
  };

  // Live metrics calculation
  const totalFlats = flats.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeContractorsCount = contractors.length;
  const todayAttendanceCount = attendance.length;

  // Domain Hub Pillar Cards Definitions
  const pillarCards = [
    {
      id: 'execution',
      title: 'Site Execution & Flats',
      subTitle: 'Inspection, Checklists & Defect Snagging',
      icon: Layers,
      theme: 'sky',
      accentColor: 'from-sky-500/20 via-sky-500/10 to-transparent border-sky-500/30 hover:border-sky-400 hover:shadow-sky-500/10',
      iconBg: 'bg-sky-500 text-slate-950 shadow-sky-500/30',
      tag: 'CORE EXECUTION',
      tagColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
      stats: [
        { label: 'Units Tracked', value: `${totalFlats} Flats` },
        { label: 'Progress', value: `${progressPct}% Done` },
      ],
      quickActions: [
        { label: 'Floor Side-by-Side Matrix', target: 'floorRoomMatrix' },
        { label: 'Room Checklist Inspector', target: 'inspection' },
        { label: '2D Elevation View', target: 'elevatorGrid' },
        { label: 'Inspection Photo Reports', target: 'siteReports' },
      ],
      primaryAction: { label: 'Enter Execution Workspace', target: 'floorRoomMatrix' }
    },
    {
      id: 'workforce',
      title: 'Contractor & Workforce',
      subTitle: 'Daily Attendance, Manpower & Rates',
      icon: Users,
      theme: 'amber',
      accentColor: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
      tag: 'MANPOWER',
      tagColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
      stats: [
        { label: 'Active Trades', value: `${activeContractorsCount} Agencies` },
        { label: 'On-Site Today', value: `${todayAttendanceCount} Laborers` },
      ],
      quickActions: [
        { label: 'Pending Work & Call Dialer', target: 'pendingWork' },
        { label: 'Trade Resource Allocation', target: 'resourceAllocation' },
        { label: 'Contractor Directory & Rates', target: 'contractors' },
      ],
      primaryAction: { label: 'Enter Workforce Workspace', target: 'pendingWork' }
    },
    {
      id: 'materials',
      title: 'Material Management (GRN)',
      subTitle: 'Inward Delivery, Stock Ledger & Indents',
      icon: Package,
      theme: 'emerald',
      accentColor: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500 text-slate-950 shadow-emerald-500/30',
      tag: 'INVENTORY',
      tagColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      stats: [
        { label: 'Inventory', value: 'Live Ledger' },
        { label: 'Source', value: 'Local DB' },
      ],
      quickActions: [
        { label: 'Material Inward (GRN) Ledger', target: 'materialsHub' },
        { label: 'Stock Reorder Alerts', target: 'materialsHub' },
      ],
      primaryAction: { label: 'Enter Materials Workspace', target: 'materialsHub' }
    },
    {
      id: 'finance',
      title: 'Finance & Site Expenses',
      subTitle: 'Petty Cash Book, Invoicing & Claims',
      icon: Wallet,
      theme: 'purple',
      accentColor: 'from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500 text-slate-950 shadow-purple-500/30',
      tag: 'COMMERCIAL',
      tagColor: 'bg-purple-950/80 text-purple-300 border-purple-800',
      stats: [
        { label: 'Cash Book', value: 'Live Ledger' },
        { label: 'Claims', value: 'Live Ledger' },
      ],
      quickActions: [
        { label: 'Site Petty Cash Book', target: 'pettyCash' },
        { label: 'Contractor Invoicing Ledger', target: 'billingLedger' },
      ],
      primaryAction: { label: 'Enter Finance Workspace', target: 'pettyCash' }
    },
    {
      id: 'sales',
      title: 'Sales & Client Handover',
      subTitle: 'Custom Variations & Possession Readiness',
      icon: Sparkles,
      theme: 'amber',
      accentColor: 'from-amber-600/20 via-amber-500/10 to-transparent border-amber-600/30 hover:border-amber-500 hover:shadow-amber-500/10',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/30',
      tag: 'CRM & CLIENTS',
      tagColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
      stats: [
        { label: 'Client Changes', value: 'Live Register' },
        { label: 'Possession', value: 'Live Matrix' },
      ],
      quickActions: [
        { label: 'Client Variations Approvals', target: 'clientChanges' },
        { label: 'Customer Handover Matrix', target: 'salesHandover' },
      ],
      primaryAction: { label: 'Enter Sales & Variations', target: 'clientChanges' }
    },
    {
      id: 'safety_qa',
      title: 'SiteOps, Safety & QA/QC',
      subTitle: 'HSE Briefings, Concrete QA & Machinery',
      icon: ShieldAlert,
      theme: 'rose',
      accentColor: 'from-rose-500/20 via-rose-500/10 to-transparent border-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500 text-slate-950 shadow-rose-500/30',
      tag: 'SAFETY & HSE',
      tagColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
      stats: [
        { label: 'Safety', value: 'Live Register' },
        { label: 'Cube Tests', value: 'Live Register' },
      ],
      quickActions: [
        { label: 'Daily Toolbox Safety Talks', target: 'safety' },
        { label: 'Concrete Lab 7/28-Day QA', target: 'concreteQA' },
        { label: 'Machinery & Diesel Logbook', target: 'machinery' },
        { label: 'Visitor Register & Gate Pass', target: 'visitorGate' },
      ],
      primaryAction: { label: 'Enter Safety & QA Workspace', target: 'safety' }
    },
    {
      id: 'admin',
      title: 'Site Administration & Users',
      subTitle: 'User Accounts, Roles, Master Specs & Project Config',
      icon: Shield,
      theme: 'indigo',
      accentColor: 'from-indigo-500/20 via-indigo-500/10 to-transparent border-indigo-500/30 hover:border-indigo-400 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-500 text-slate-950 shadow-indigo-500/30',
      tag: 'ADMIN ONLY',
      tagColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
      stats: [
        { label: 'Staff Accounts', value: 'Live Directory' },
        { label: 'RBAC Security', value: 'Active' },
      ],
      quickActions: [
        { label: 'User Directory & Invites', target: 'userManagement' },
        { label: 'Master 2BHK/3BHK Specs', target: 'masterTemplates' },
        { label: 'Executive Handover KPI', target: 'executiveDashboard' },
      ],
      primaryAction: { label: 'Enter Admin Workspace', target: 'userManagement' }
    }
  ];

  const allowedWorkspaces = new Set(currentUser?.workspacePermissions || []);
  const visibleCards = pillarCards.filter(card => allowedWorkspaces.has(card.id));

  const roleMeta = {
    label: currentUser?.roleName || activeRole || 'Staff',
    color: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1 flex flex-col justify-between w-full">
        
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl font-black shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/10">
              <Building2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">ConstructTrack</h1>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Enterprise Construction Management Workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Authenticated User & Locked Role Badge */}
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-lg">
              <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black text-amber-400">
                {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-xs font-extrabold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {currentUser?.name || 'Authorized Staff'}
                </div>
                <div className="text-[10px] text-amber-300 font-bold flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>{roleMeta.label}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 rounded-2xl transition shadow-lg cursor-pointer"
                title="Sign Out of Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authorized Modules for Your Role ({roleMeta.label})</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Operational Workspace Hub
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Select a module below to manage room execution checklists, workforce deployment, materials store, variations, and site operations.
          </p>
        </div>

        {/* Dynamic Role-Based Domain Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visibleCards.map((card) => {
            const IconComponent = card.icon;

            return (
              <div
                key={card.id}
                className={`relative group bg-slate-900/80 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-b ${card.accentColor}`}
              >
                <div className="space-y-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-2xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {card.subTitle}
                    </p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    {card.stats.map((stat, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</div>
                        <div className="text-xs font-black text-slate-200 mt-0.5">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Action Chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Jump:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.quickActions.map((qa, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleLaunch(card.id, qa.target)}
                          className="text-[11px] font-bold px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{qa.label}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary Launch Action Button */}
                <div className="pt-6 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleLaunch(card.id, card.primaryAction.target)}
                    className="w-full bg-slate-950 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-400 text-slate-200 hover:text-slate-950 font-black py-3 px-4 rounded-2xl border border-slate-800 hover:border-transparent transition-all duration-300 flex items-center justify-between text-xs group/btn shadow-lg cursor-pointer"
                  >
                    <span>{card.primaryAction.label}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover/btn:text-slate-950 group-hover/btn:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-400">PostgreSQL Live Cloud Sync Active</span>
          </div>
          <div>ConstructTrack ERP PRO • High-Rise Civil Operations</div>
        </footer>
      </div>
    </div>
  );
};
