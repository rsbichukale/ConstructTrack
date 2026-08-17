import React from 'react';

// Core Execution Workspaces
import { TowerElevationWorkspace } from '../features/execution/TowerElevationWorkspace';
import { FlatInspectionWorkspace } from '../features/execution/FlatInspectionWorkspace';
import { FloorPlanTemplateWorkspace } from '../features/execution/FloorPlanTemplateWorkspace';
import { FloorRoomMatrix } from '../../features/worktracker';
import { PendingWorkHub } from '../../features/admin';

// Contractors & Manpower Standalone Workspaces
import { DailyMusterRollWorkspace } from '../features/workforce/DailyMusterRollWorkspace';
import { DailyTargetsWorkspace } from '../features/workforce/DailyTargetsWorkspace';
import { WageAdvancesWorkspace } from '../features/workforce/WageAdvancesWorkspace';
import { ContractorRosterWorkspace } from '../features/workforce/ContractorRosterWorkspace';

// Store & Inventory (GRN) Standalone Workspaces
import { InventoryStockWorkspace } from '../features/materials/InventoryStockWorkspace';
import { MaterialInwardWorkspace } from '../features/materials/MaterialInwardWorkspace';
import { MaterialOutwardWorkspace } from '../features/materials/MaterialOutwardWorkspace';

// Heavy Plant & Diesel Fleet Standalone Workspaces
import { MachineryFuelWorkspace } from '../features/machinery/MachineryFuelWorkspace';
import { MachineryFleetWorkspace } from '../features/machinery/MachineryFleetWorkspace';
import { MachineryMaintenanceWorkspace } from '../features/machinery/MachineryMaintenanceWorkspace';

// Commercial & Billing Workspaces
import { RABillingWorkspace } from '../features/billing/RABillingWorkspace';
import { PettyCashWorkspace } from '../features/finance/PettyCashWorkspace';
import { ClientChangesWorkspace } from '../features/finance/ClientChangesWorkspace';

// QA Lab & Safety (HSE) Standalone Workspaces
import { ConcreteQALabWorkspace } from '../features/qa-safety/ConcreteQALabWorkspace';
import { SafetyHSEWorkspace } from '../features/qa-safety/SafetyHSEWorkspace';
import { VisitorGatePassWorkspace } from '../features/qa-safety/VisitorGatePassWorkspace';

// Reports & Administration
import { SiteReportsWorkspace } from '../features/reports/SiteReportsWorkspace';
import { ExecutiveDashboard, UserManagementSuite } from '../../features/admin';
import { SiteDiagnosticsWorkspace } from '../features/diagnostics/SiteDiagnosticsWorkspace';

export const AdminViewsContainer = ({ activeAdminTab, activeTab }) => {
  const tab = activeAdminTab || activeTab;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* 1. Site Execution & Units */}
      {tab === 'towerElevation' && <TowerElevationWorkspace />}
      {tab === 'floorRoomMatrix' && <FloorRoomMatrix />}
      {tab === 'inspection' && <FlatInspectionWorkspace />}
      {tab === 'floorPlanTemplates' && <FloorPlanTemplateWorkspace />}
      {tab === 'pendingWork' && <PendingWorkHub />}

      {/* 2. Contractors & Manpower (Separated Workspaces) */}
      {tab === 'workforceHub' && <DailyMusterRollWorkspace />}
      {tab === 'targets' && <DailyTargetsWorkspace />}
      {tab === 'advances' && <WageAdvancesWorkspace />}
      {tab === 'contractors' && <ContractorRosterWorkspace />}

      {/* 3. Store & Inventory (GRN) (Separated Workspaces) */}
      {tab === 'materialsWorkspace' && <InventoryStockWorkspace />}
      {tab === 'materialsInward' && <MaterialInwardWorkspace />}
      {tab === 'materialsOutward' && <MaterialOutwardWorkspace />}

      {/* 4. Plant Fleet & Diesel Tracker (Separated Workspaces) */}
      {tab === 'machineryWorkspace' && <MachineryFuelWorkspace />}
      {tab === 'machineryFleet' && <MachineryFleetWorkspace />}
      {tab === 'machineryMaintenance' && <MachineryMaintenanceWorkspace />}

      {/* 5. Commercial & Financial Operations */}
      {tab === 'raBilling' && <RABillingWorkspace />}
      {tab === 'billingLedger' && <RABillingWorkspace />}
      {tab === 'financeWorkspace' && <PettyCashWorkspace />}
      {tab === 'pettyCash' && <PettyCashWorkspace />}
      {tab === 'clientChanges' && <ClientChangesWorkspace />}

      {/* 6. QA Lab & Safety (HSE) (Separated Workspaces) */}
      {tab === 'qaSafetyWorkspace' && <ConcreteQALabWorkspace />}
      {tab === 'concreteQA' && <ConcreteQALabWorkspace />}
      {tab === 'safetyBriefings' && <SafetyHSEWorkspace />}
      {tab === 'safety' && <SafetyHSEWorkspace />}
      {tab === 'visitorGate' && <VisitorGatePassWorkspace />}

      {/* 7. Executive Reports & Administration */}
      {tab === 'siteReports' && <SiteReportsWorkspace />}
      {tab === 'dailyReports' && <SiteReportsWorkspace />}
      {tab === 'executiveDashboard' && <ExecutiveDashboard />}
      {tab === 'siteDiagnostics' && <SiteDiagnosticsWorkspace />}
      {tab === 'userManagement' && <UserManagementSuite />}
    </main>
  );
};

export default AdminViewsContainer;
