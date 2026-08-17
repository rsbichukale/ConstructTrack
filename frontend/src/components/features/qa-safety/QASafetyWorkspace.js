import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, AlertCircle, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { useQASafety } from '../../../hooks/useQASafety';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

export const QASafetyWorkspace = () => {
  const { cubes, snags, loading, recordCubeTest, recordSnag, resolveSnag, recordSafetyBriefing, refresh } = useQASafety();
  const [activeSubTab, setActiveSubTab] = useState('cubes');
  const [isCubeModalOpen, setIsCubeModalOpen] = useState(false);
  const [isSnagModalOpen, setIsSnagModalOpen] = useState(false);

  // Cube form
  const [member, setMember] = useState('');
  const [wing, setWing] = useState('B1');
  const [floor, setFloor] = useState(1);
  const [grade, setGrade] = useState('M30');
  const [supplier, setSupplier] = useState('UltraTech RMC');
  const [slump, setSlump] = useState(125);
  const [castingDate, setCastingDate] = useState(new Date().toISOString().split('T')[0]);
  const [ageDays, setAgeDays] = useState(7);
  const [targetMpa, setTargetMpa] = useState(20);
  const [actualMpa, setActualMpa] = useState(23.5);

  // Snag form
  const [flatId, setFlatId] = useState(1);
  const [snagDesc, setSnagDesc] = useState('');
  const [snagCategory, setSnagCategory] = useState('Tiling');

  const handleCreateCube = async (e) => {
    e.preventDefault();
    await recordCubeTest({
      member, wing, floor: Number(floor), grade, supplier, slump: Number(slump),
      castingDate, ageDays: Number(ageDays), testDate: new Date().toISOString().split('T')[0],
      targetMpa: Number(targetMpa), actualMpa: Number(actualMpa),
      status: Number(actualMpa) >= Number(targetMpa) ? 'PASSED' : 'FAILED'
    });
    setIsCubeModalOpen(false);
  };

  const handleCreateSnag = async (e) => {
    e.preventDefault();
    await recordSnag({ flatId: Number(flatId), roomZoneId: 1, category: snagCategory, description: snagDesc });
    setIsSnagModalOpen(false);
    setSnagDesc('');
  };

  const cubeColumns = [
    { key: 'structural_member', header: 'Structural Member' },
    { key: 'wing', header: 'Location', render: (val, row) => `${val || 'B1'} - Floor ${row.floor_number || 1}` },
    { key: 'concrete_grade', header: 'Grade' },
    { key: 'test_age_days', header: 'Age', render: (val) => `${val} Days` },
    { key: 'actual_strength_mpa', header: 'Actual (MPa)', render: (val) => <span className="font-bold text-white">{val} MPa</span> },
    { key: 'target_strength_mpa', header: 'Target (MPa)', render: (val) => `${val} MPa` },
    { key: 'supplier_r_m_c', header: 'RMC Supplier' },
    { key: 'status', header: 'Compliance', render: (val) => <StatusBadge status={val} /> }
  ];

  const snagColumns = [
    { key: 'flat_number', header: 'Flat', render: (val, row) => `${row.wing || 'B1'}-${val || row.flat_id}` },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Defect Description' },
    { key: 'status', header: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (_, row) => row.status !== 'RESOLVED' ? (
        <button
          onClick={() => resolveSnag(row.id, 'https://placehold.co/400x300?text=Resolved+Photo', 'Resolved on site audit')}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Mark Resolved
        </button>
      ) : <span className="text-xs text-slate-500">Completed</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-amber-500" />
            QA / QC Lab Testing & Site Safety Hub
          </h2>
          <p className="text-xs text-slate-400">Concrete compressive strength register, snagging punch list, and safety audit.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button onClick={() => setActiveSubTab('cubes')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeSubTab === 'cubes' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Concrete Cubes
            </button>
            <button onClick={() => setActiveSubTab('snags')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeSubTab === 'snags' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Snagging Punch List
            </button>
          </div>
          {activeSubTab === 'cubes' ? (
            <ActionButton onClick={() => setIsCubeModalOpen(true)} icon={Plus} size="sm">Log Cube Test</ActionButton>
          ) : (
            <ActionButton onClick={() => setIsSnagModalOpen(true)} icon={Plus} size="sm">Report Snag</ActionButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Total Cube Tests" value={cubes.length} icon={FlaskConical} color="amber" subtitle="M25 & M30 Slabs" />
        <KPICard title="Lab Pass Rate" value="100%" icon={CheckCircle2} color="emerald" subtitle="Target strength met" />
        <KPICard title="Open Snagging Items" value={snags.filter(s => s.status !== 'RESOLVED').length} icon={AlertCircle} color="rose" subtitle="Punch list items" />
        <KPICard title="Safety Compliance" value="100%" icon={ShieldCheck} color="blue" subtitle="Mandatory PPE Active" />
      </div>

      {activeSubTab === 'cubes' ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Concrete Compressive Cube Crushing Register</h3>
          <DataTable columns={cubeColumns} data={cubes} searchKey="structural_member" searchPlaceholder="Search structural member (e.g. Column, Slab)..." />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quality Snagging & Defect Punch List</h3>
          <DataTable columns={snagColumns} data={snags} searchKey="description" searchPlaceholder="Search snag description..." />
        </div>
      )}

      {/* Log Cube Modal */}
      <ModalDialog isOpen={isCubeModalOpen} onClose={() => setIsCubeModalOpen(false)} title="Record Concrete Cube Crushing Test">
        <form onSubmit={handleCreateCube} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Structural Member / Pour Location</label>
            <input type="text" value={member} onChange={(e) => setMember(e.target.value)} placeholder="e.g. Column C1-C8 (Tower B1)" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
                <option value="M25">M25</option>
                <option value="M30">M30</option>
                <option value="M35">M35</option>
                <option value="M40">M40</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Test Age</label>
              <select value={ageDays} onChange={(e) => setAgeDays(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
                <option value="7">7 Days</option>
                <option value="28">28 Days</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Actual Strength (MPa)</label>
              <input type="number" step="0.1" value={actualMpa} onChange={(e) => setActualMpa(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton onClick={() => setIsCubeModalOpen(false)} variant="ghost" size="sm">Cancel</ActionButton>
            <ActionButton type="submit" size="sm">Save Test Result</ActionButton>
          </div>
        </form>
      </ModalDialog>

      {/* Snag Modal */}
      <ModalDialog isOpen={isSnagModalOpen} onClose={() => setIsSnagModalOpen(false)} title="Report Quality Snag / Defect">
        <form onSubmit={handleCreateSnag} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Flat ID / Unit</label>
              <input type="number" min="1" max="70" value={flatId} onChange={(e) => setFlatId(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Trade Category</label>
              <select value={snagCategory} onChange={(e) => setSnagCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
                <option value="Tiling">Tiling / Skirting</option>
                <option value="Plaster">Plaster / POP Finish</option>
                <option value="Plumbing">Plumbing / Drainage</option>
                <option value="Electrical">Electrical / Switch Plates</option>
                <option value="Painting">Painting & Touchup</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Defect Description</label>
            <textarea value={snagDesc} onChange={(e) => setSnagDesc(e.target.value)} placeholder="e.g. Master Bedroom hollow sound on 2 floor tiles" required rows={3} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton onClick={() => setIsSnagModalOpen(false)} variant="ghost" size="sm">Cancel</ActionButton>
            <ActionButton type="submit" size="sm">Log Snag</ActionButton>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

export default QASafetyWorkspace;
