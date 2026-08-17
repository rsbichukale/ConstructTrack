'use client';

import React from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  FlaskConical, 
  FileText, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Shield,
  Activity,
  UserCheck,
  Fuel,
  Receipt,
  FileCheck2,
  HardHat,
  Boxes, 
  HelpCircle, 
  Clock, 
  Sparkles,
  Ruler,
  AlertTriangle
} from 'lucide-react';

export const DESKTOP_NAV_MODULES = [
  {
    id: 'execution',
    label: 'Site Execution & Units',
    icon: Building2,
    color: 'text-amber-400',
    items: [
      { id: 'towerElevation', label: 'Tower 2D Elevation Matrix', icon: Layers, badge: '70 Flats' },
      { id: 'floorRoomMatrix', label: 'Floor Side-by-Side Matrix', icon: Building2 },
      { id: 'inspection', label: 'Flat Inspection & Checklist', icon: FileCheck2 },
      { id: 'floorPlanTemplates', label: 'Typology Plans (2BHK/3BHK)', icon: Ruler, badge: 'Master' },
      { id: 'pendingWork', label: 'Pending Snag & Blocker Call Hub', icon: AlertTriangleBadge }
    ]
  },
  {
    id: 'workforce',
    label: 'Contractors & Manpower',
    icon: Users,
    color: 'text-sky-400',
    items: [
      { id: 'workforceHub', label: 'Multi-Skill Daily Muster Roll', icon: UserCheck, badge: 'Live' },
      { id: 'targets', label: 'Daily Work Targets & SLAs', icon: Activity },
      { id: 'advances', label: 'Wage Advances (Kharcha)', icon: Receipt },
      { id: 'contractors', label: '14 Trade Contractor Roster', icon: Users }
    ]
  },
  {
    id: 'materials',
    label: 'Store & Inventory (GRN)',
    icon: Package,
    color: 'text-emerald-400',
    items: [
      { id: 'materialsWorkspace', label: 'Inventory Stock & Reorder Ledger', icon: Boxes, badge: '6 Items' },
      { id: 'materialsInward', label: 'Material Inward (GRN Challans)', icon: Package },
      { id: 'materialsOutward', label: 'Material Issue Slips', icon: FileText }
    ]
  },
  {
    id: 'machinery',
    label: 'Plant Fleet & Diesel Tracker',
    icon: Truck,
    color: 'text-purple-400',
    items: [
      { id: 'machineryWorkspace', label: 'Heavy Machinery & Fuel Logs', icon: Fuel, badge: '3 Active' },
      { id: 'machineryFleet', label: 'Plant Equipment Asset Registry', icon: Truck },
      { id: 'machineryMaintenance', label: 'Preventive Service Schedule', icon: Settings }
    ]
  },
  {
    id: 'billing',
    label: 'Commercial & RA Billing',
    icon: DollarSign,
    color: 'text-amber-400',
    items: [
      { id: 'raBilling', label: 'Subcontractor RA Bills & Deductions', icon: Receipt, badge: 'Auto 5%' },
      { id: 'financeWorkspace', label: 'Site Petty Cash & Imprest Safe', icon: DollarSign },
      { id: 'clientChanges', label: 'Client Customization Variations', icon: FileText }
    ]
  },
  {
    id: 'qaSafety',
    label: 'QA Lab & Safety (HSE)',
    icon: FlaskConical,
    color: 'text-teal-400',
    items: [
      { id: 'qaSafetyWorkspace', label: 'Concrete Cube Tests & Strength', icon: FlaskConical, badge: '100% Pass' },
      { id: 'safetyBriefings', label: 'Daily Toolbox Talks & HSE', icon: HardHat },
      { id: 'visitorGate', label: 'Visitor & Vehicle Gate Passes', icon: Shield }
    ]
  },
  {
    id: 'reports',
    label: 'Executive Reports & DPR',
    icon: FileText,
    color: 'text-indigo-400',
    items: [
      { id: 'siteReports', label: '8 Enterprise Executive Reports', icon: FileText, badge: 'Excel / PDF' },
      { id: 'executiveDashboard', label: 'Executive Handover Matrix', icon: Sparkles },
      { id: 'siteDiagnostics', label: 'Database & LAN Diagnostics', icon: Activity }
    ]
  }
];

function AlertTriangleBadge() {
  return <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />;
}

export const DesktopSidebar = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse
}) => {
  const [openSections, setOpenSections] = React.useState({
    execution: true,
    workforce: true,
    materials: true,
    machinery: true,
    billing: true,
    qaSafety: false,
    reports: false
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <aside 
      className={`h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-all duration-200 select-none z-20 ${
        collapsed ? 'w-16' : 'w-64 xl:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-3.5 bg-slate-900/40">
        {!collapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <div className="font-black text-sm text-white flex items-center space-x-1">
                <span>ConstructTrack</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">PRO</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">Enterprise Desktop v2.2</div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 custom-scrollbar">
        {DESKTOP_NAV_MODULES.map(module => {
          const isOpen = openSections[module.id];
          const Icon = module.icon;

          if (collapsed) {
            return (
              <div key={module.id} className="space-y-1">
                {module.items.map(item => {
                  const ItemIcon = item.icon || Icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      title={`${module.label} → ${item.label}`}
                      className={`w-full h-10 rounded-xl flex items-center justify-center transition ${
                        isActive 
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={module.id} className="space-y-1">
              {/* Category Header Accordion */}
              <button
                onClick={() => toggleSection(module.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-extrabold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded-lg hover:bg-slate-900/40 transition"
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 ${module.color}`} />
                  <span>{module.label}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Child Nav Items */}
              {isOpen && (
                <div className="space-y-0.5 pl-2 border-l border-slate-800/60 ml-2.5 mt-0.5">
                  {module.items.map(item => {
                    const ItemIcon = item.icon || Icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition text-left ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ml-1.5 shrink-0 ${
                            isActive 
                              ? 'bg-slate-950/30 text-slate-950' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer System Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[10px] text-slate-300 font-mono">LAN DB 0.0.0.0:5000</div>
            </div>
            <button 
              onClick={onToggleCollapse}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700"
              title="Collapse Sidebar"
            >
              ◀
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={onToggleCollapse}
              className="text-[10px] text-slate-400 hover:text-white p-1 rounded bg-slate-800 hover:bg-slate-700"
              title="Expand Sidebar"
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
