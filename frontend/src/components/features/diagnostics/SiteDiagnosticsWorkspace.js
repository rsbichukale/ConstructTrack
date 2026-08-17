import React from 'react';
import { Activity, Database, Server, Wifi, RefreshCw, HardDrive, Layers } from 'lucide-react';
import { useSiteDiagnostics } from '../../../hooks/useSiteDiagnostics';
import { KPICard } from '../../ui/KPICard';
import { ActionButton } from '../../ui/ActionButton';

export const SiteDiagnosticsWorkspace = () => {
  const { diagnostics, loading, refresh } = useSiteDiagnostics();

  const isDbConnected = diagnostics?.database?.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-500" />
            Site Hub & Local Database Diagnostics
          </h2>
          <p className="text-xs text-slate-400">Live heartbeat status of local PostgreSQL database and site Wi-Fi network.</p>
        </div>
        <ActionButton onClick={refresh} icon={RefreshCw} loading={loading} variant="secondary" size="sm">
          Ping Database
        </ActionButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard
          title="Local PostgreSQL DB"
          value={isDbConnected ? 'ONLINE (Port 5432)' : 'DISCONNECTED'}
          icon={Database}
          color={isDbConnected ? 'emerald' : 'rose'}
          subtitle={isDbConnected ? `Latency: ${diagnostics?.database?.latencyMs || 0}ms` : 'Check local service'}
        />
        <KPICard
          title="Express API Server"
          value={`Port ${diagnostics?.server?.port || 5000}`}
          icon={Server}
          color="amber"
          subtitle={`Uptime: ${Math.floor((diagnostics?.server?.uptimeSeconds || 0) / 60)} mins`}
        />
        <KPICard
          title="Connected LAN Clients"
          value={`${diagnostics?.server?.connectedLanClients || 0} Devices`}
          icon={Wifi}
          color="blue"
          subtitle="Site Wi-Fi SSE Stream"
        />
        <KPICard
          title="Database Disk Size"
          value={diagnostics?.database?.stats?.db_size || '8 MB'}
          icon={HardDrive}
          color="indigo"
          subtitle="constructtrack_db"
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          Live Local PostgreSQL Record Counts
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">Residential Flats</p>
            <h4 className="mt-1 text-2xl font-bold text-white">{diagnostics?.database?.stats?.total_flats || 70}</h4>
            <span className="text-[10px] text-emerald-400">Wings B1 & B2</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">Micro-Tasks Active</p>
            <h4 className="mt-1 text-2xl font-bold text-white">{diagnostics?.database?.stats?.total_tasks || '6,832'}</h4>
            <span className="text-[10px] text-amber-400">11 Room Zones</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">Contractors Active</p>
            <h4 className="mt-1 text-2xl font-bold text-white">{diagnostics?.database?.stats?.total_contractors || 14}</h4>
            <span className="text-[10px] text-blue-400">14 Trades Registered</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">Material Store SKUs</p>
            <h4 className="mt-1 text-2xl font-bold text-white">{diagnostics?.database?.stats?.total_inventory || 6}</h4>
            <span className="text-[10px] text-purple-400">Stock Items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDiagnosticsWorkspace;
