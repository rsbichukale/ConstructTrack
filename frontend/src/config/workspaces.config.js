import { 
  Layers, 
  Users, 
  Package, 
  Wallet, 
  Sparkles, 
  ShieldAlert, 
  Shield, 
  Building2, 
  Key, 
  Receipt, 
  FileText, 
  Truck, 
  FlaskConical, 
  DoorOpen, 
  GitCommit, 
  Zap, 
  BarChart3 
} from 'lucide-react';

export const WORKSPACES = {
  execution: {
    id: 'execution',
    title: 'Site Execution & Flats',
    shortTitle: 'Site Execution',
    subTitle: 'Inspection, Checklists & Defect Snagging',
    badge: 'EXECUTION',
    badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
    themeColor: 'sky',
    icon: Layers,
    iconBg: 'bg-sky-500 text-slate-950 shadow-sky-500/30',
    defaultTool: 'floorRoomMatrix',
    tools: [
      {
        id: 'floorRoomMatrix',
        label: 'Floor Side-by-Side Matrix',
        subLabel: 'Inspect 5 Flats in 1 Screen (30s Check)',
        icon: Layers,
        badge: 'FAST',
        badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800'
      },
      {
        id: 'inspection',
        label: 'Flat Room Checklist Inspector',
        subLabel: 'Room Walkthrough (Kitchen, Toilet, Hall)',
        icon: Layers,
        badge: 'MAIN',
        badgeColor: 'bg-sky-950 text-sky-400 border-sky-800'
      },
      {
        id: 'elevatorGrid',
        label: '2D Building Elevation View',
        subLabel: 'Visual 7 Floors Elevation Matrix',
        icon: Building2
      },
      {
        id: 'siteReports',
        label: 'Site Inspection Photo Reports',
        subLabel: 'DPR, Contractor SLA & Defect Logs',
        icon: FileText
      },
      {
        id: 'masterTemplates',
        label: 'Master 2BHK/3BHK Room Specs',
        subLabel: 'Predefined Master Room Checklists',
        icon: Building2,
        badge: 'SPECS',
        badgeColor: 'bg-purple-950 text-purple-400 border-purple-800'
      },
      {
        id: 'cpmSchedule',
        label: 'CPM Critical Path & Bottlenecks',
        subLabel: 'Zero-Float Sequence & Delay Simulator',
        icon: GitCommit,
        badge: 'CPM',
        badgeColor: 'bg-rose-950 text-rose-400 border-rose-800'
      }
    ]
  },

  workforce: {
    id: 'workforce',
    title: 'Contractor & Workforce',
    shortTitle: 'Workforce & Labor',
    subTitle: 'Daily Attendance, Manpower & Rates',
    badge: 'MANPOWER',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
    themeColor: 'amber',
    icon: Users,
    iconBg: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
    defaultTool: 'pendingWork',
    tools: [
      {
        id: 'pendingWork',
        label: 'Pending Work by Contractor',
        subLabel: 'Grouped Tasks & 1-Tap Call Dialer',
        icon: Users,
        badge: 'CORE',
        badgeColor: 'bg-amber-950 text-amber-400 border-amber-800'
      },
      {
        id: 'resourceAllocation',
        label: 'Contractor Trade Manpower',
        subLabel: 'Masons, Plumbers & Helper Deployment',
        icon: Zap
      },
      {
        id: 'contractors',
        label: 'Contractor Directory & Rates',
        subLabel: 'Contractor Phone Contacts & Trade Rates',
        icon: Users
      }
    ]
  },

  materials: {
    id: 'materials',
    title: 'Material Management (GRN)',
    shortTitle: 'Materials & Store',
    subTitle: 'Inward Delivery, Stock Ledger & Indents',
    badge: 'INVENTORY',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    themeColor: 'emerald',
    icon: Package,
    iconBg: 'bg-emerald-500 text-slate-950 shadow-emerald-500/30',
    defaultTool: 'materialsHub',
    tools: [
      {
        id: 'materialsHub',
        label: 'Material Inward (GRN) & Stock',
        subLabel: 'Cement, Steel, Sand Stock Ledger',
        icon: Package,
        badge: 'SITEOPS',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
      }
    ]
  },

  finance: {
    id: 'finance',
    title: 'Finance & Site Expenses',
    shortTitle: 'Finance & Accounts',
    subTitle: 'Petty Cash Book, Invoicing & Claims',
    badge: 'COMMERCIAL',
    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800',
    themeColor: 'purple',
    icon: Wallet,
    iconBg: 'bg-purple-500 text-slate-950 shadow-purple-500/30',
    defaultTool: 'pettyCash',
    tools: [
      {
        id: 'pettyCash',
        label: 'Site Petty Cash Book',
        subLabel: 'Imprest Top-Ups & Expense Vouchers',
        icon: Wallet,
        badge: 'CASH',
        badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800'
      },
      {
        id: 'billingLedger',
        label: 'Billing & Contractor Invoicing',
        subLabel: 'Measurement Sheets & Payout Claims',
        icon: Receipt,
        badge: 'BILLING',
        badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800'
      }
    ]
  },

  sales: {
    id: 'sales',
    title: 'Sales & Client Handover',
    shortTitle: 'Sales & CRM',
    subTitle: 'Custom Variations & Possession Readiness',
    badge: 'CRM & SALES',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
    themeColor: 'amber',
    icon: Sparkles,
    iconBg: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/30',
    defaultTool: 'clientChanges',
    tools: [
      {
        id: 'clientChanges',
        label: 'Client Changes & Variations',
        subLabel: 'Free Courtesy & Paid Customizations',
        icon: Sparkles,
        badge: 'CHANGES',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
      },
      {
        id: 'salesHandover',
        label: 'Customer Handover & Possession',
        subLabel: 'Unit Readiness & Keys Delivery Matrix',
        icon: Key,
        badge: 'SALES',
        badgeColor: 'bg-amber-950 text-amber-400 border-amber-800'
      },
      {
        id: 'executiveDashboard',
        label: 'Building Handover Progress',
        subLabel: 'Overall Site Completion % Overview',
        icon: BarChart3
      }
    ]
  },

  safety_qa: {
    id: 'safety_qa',
    title: 'SiteOps, Safety & QA/QC',
    shortTitle: 'Safety & QA/QC',
    subTitle: 'HSE Briefings, Concrete QA & Machinery',
    badge: 'SAFETY & QA',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
    themeColor: 'rose',
    icon: ShieldAlert,
    iconBg: 'bg-rose-500 text-slate-950 shadow-rose-500/30',
    defaultTool: 'safety',
    tools: [
      {
        id: 'safety',
        label: 'Safety, PPE & Toolbox Talks',
        subLabel: 'Daily Safety Briefings & Incident Logs',
        icon: ShieldAlert,
        badge: 'HSE',
        badgeColor: 'bg-rose-950 text-rose-400 border-rose-800'
      },
      {
        id: 'concreteQA',
        label: 'Concrete Lab QA/QC Cube Tests',
        subLabel: '7-Day & 28-Day Strength & Slump',
        icon: FlaskConical,
        badge: 'LAB',
        badgeColor: 'bg-teal-950 text-teal-400 border-teal-800'
      },
      {
        id: 'machinery',
        label: 'Machinery & Diesel Log',
        subLabel: 'JCB, Crane Running Hours & Fuel',
        icon: Truck
      },
      {
        id: 'visitorGate',
        label: 'Visitor Register & Gate Pass',
        subLabel: 'Client, VIP & Consultant Gate Passes',
        icon: DoorOpen
      }
    ]
  },

  admin: {
    id: 'admin',
    title: 'Site Administration & System',
    shortTitle: 'Admin & System',
    subTitle: 'User Accounts, Roles, Master Specs & Project Config',
    badge: 'ADMINISTRATION',
    badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    themeColor: 'indigo',
    icon: Shield,
    iconBg: 'bg-indigo-500 text-slate-950 shadow-indigo-500/30',
    defaultTool: 'userManagement',
    tools: [
      {
        id: 'userManagement',
        label: 'Team Users & Role Access',
        subLabel: 'Provision Accounts, Roles & RBAC',
        icon: Users,
        badge: 'SECURITY',
        badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-800'
      },
      {
        id: 'masterTemplates',
        label: 'Master 2BHK/3BHK Room Specs',
        subLabel: 'Standard Checklists & Item Templates',
        icon: Building2,
        badge: 'TEMPLATES',
        badgeColor: 'bg-purple-950 text-purple-400 border-purple-800'
      },
      {
        id: 'executiveDashboard',
        label: 'Executive Site Dashboard',
        subLabel: 'Building Handover & Completion KPI',
        icon: BarChart3
      },
      {
        id: 'dailyReports',
        label: 'Daily Progress Audit (DPR)',
        subLabel: 'Site Engineer DPR & Verification Logs',
        icon: FileText
      }
    ]
  }
};

export const getWorkspaceByToolId = (toolId) => {
  for (const [wsKey, ws] of Object.entries(WORKSPACES)) {
    if (ws.tools.some(t => t.id === toolId)) {
      return ws;
    }
  }
  return WORKSPACES.execution;
};
