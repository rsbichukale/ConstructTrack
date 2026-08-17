'use client';

import React, { useState, useRef } from 'react';
import { Camera, Printer, Share2, Image as ImageIcon } from 'lucide-react';
import { getAppState } from '../../../lib/dbState';
import { downloadDprPdf, shareDprWhatsAppAndPdf } from '../../../lib/pdfGenerator';

export const DailyPhotoProgressSection = ({
  selectedDate,
  onSelectDate,
}) => {
  const state = getAppState();
  const reportContainerRef = useRef(null);
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [userRemarks, setUserRemarks] = useState('Daily site inspection completed. All trade photos verified on site.');

  const logsForDate = (state.logs || []).filter(l => l.dateLogged === selectedDate);
  const tasksWithPhotos = (state.flatTasks || []).filter(t => !!t.photoUrl);

  const photoInspectionCards = tasksWithPhotos.map(task => {
    const flat = (state.flats || []).find(f => f.id === task.flatId);
    const catalogItem = (state.taskCatalog || []).find(c => c.id === task.taskCatalogId);
    const roomZone = (state.roomZones || []).find(z => z.id === catalogItem?.roomZoneId);
    const contractor = (state.contractors || []).find(c => c.id === task.assignedContractorId);
    const taskLogs = logsForDate.filter(l => l.flatTaskId === task.id);

    return {
      task,
      flat,
      catalogItem,
      roomZone,
      contractor,
      taskLogs,
    };
  }).filter(item => {
    if (selectedWing !== 'ALL' && item.flat?.wing !== selectedWing) return false;
    return true;
  });

  const handleDownloadPdf = () => {
    if (!reportContainerRef.current) return;
    downloadDprPdf(reportContainerRef.current, `Daily_Photo_Inspection_Report_${selectedDate}.pdf`);
  };

  const handleShareWhatsApp = () => {
    if (!reportContainerRef.current) return;
    const text = `📸 ConstructTrack Daily Photo Inspection Report (${selectedDate})\n• Wing Scope: ${selectedWing}\n• Verified Photos: ${photoInspectionCards.length} Micro-Tasks\n• Remarks: ${userRemarks}`;
    shareDprWhatsAppAndPdf(reportContainerRef.current, text, `Daily_Photo_Inspection_Report_${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span>Daily Photo Inspection Progress Report</span>
          </h3>
          <p className="text-xs text-slate-400">Detailed visual inspection report with captured task photos, timestamps & remarks</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Inspection Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Wing Filter</label>
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="ALL">🏢 All Wings (B1 & B2)</option>
              <option value="B1">🏢 Wing B1</option>
              <option value="B2">🏢 Wing B2</option>
            </select>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Download Photo PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center space-x-1.5 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Report</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
        <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
          Supervisor Field Remarks for {selectedDate}:
        </label>
        <textarea
          rows={2}
          value={userRemarks}
          onChange={(e) => setUserRemarks(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div ref={reportContainerRef} className="space-y-6">
        {photoInspectionCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoInspectionCards.map(({ task, flat, catalogItem, roomZone, contractor, taskLogs }) => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded uppercase">
                      Flat {flat?.wing}-{flat?.flatNumber} • {roomZone?.zoneLabel}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      task.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      task.status === 'REWORK' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                      'bg-amber-950 text-amber-400 border-amber-800'
                    }`}>
                      {task.status} ({task.completionPct}%)
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-white leading-snug">
                    {catalogItem?.taskName}
                  </h4>

                  {task.photoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-44 w-full">
                      <img
                        src={task.photoUrl}
                        alt={catalogItem?.taskName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm text-slate-300 px-2 py-1 rounded-md text-[10px] font-mono border border-slate-700 flex items-center space-x-1">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>Verified On Site</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 w-full rounded-xl border border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 text-slate-700" />
                      <span>No Photo Attached</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Contractor: <strong className="text-white">{contractor?.companyName || 'Unassigned'}</strong></span>
                    <span className="font-mono text-amber-400">₹{contractor?.ratePerUnit || 0}/unit</span>
                  </div>
                  {task.blockerReason && (
                    <p className="text-[10px] text-rose-400 font-semibold bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                      ⚠ Blocker: {task.blockerReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-dashed border-slate-800 p-8 rounded-2xl text-center space-y-3">
            <Camera className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Inspection Photos Captured Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When site supervisors conduct room inspections in Room Inspector or Task Modal and attach photos, they will instantly populate here in this Daily Photo Report gallery!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
