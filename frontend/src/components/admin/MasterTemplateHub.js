'use client';

import React, { useState } from 'react';
import { Building, CheckCircle2 } from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { MasterSpecTemplateEditor } from './masterTemplate/MasterSpecTemplateEditor';

export const MasterTemplateHub = () => {
  const state = getAppState();
  const [templateMessage, setTemplateMessage] = useState(null);

  const phasesToUse = (state.executionPhases && state.executionPhases.length > 0)
    ? state.executionPhases
    : [];

  const handleShowMessage = (msg) => {
    setTemplateMessage(msg);
    setTimeout(() => setTemplateMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
          <Building className="w-4 h-4" />
          <span>Master Specification & Room Checklists</span>
        </div>
        <h2 className="text-xl font-extrabold text-white mt-1">
          2BHK & 3BHK Flat Micro-Task Master Templates
        </h2>
        <p className="text-xs text-slate-400">
          Configure default room checklist templates and micro-tasks across all flat layouts.
        </p>
      </div>

      {templateMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{templateMessage}</span>
        </div>
      )}

      <MasterSpecTemplateEditor
        phasesToUse={phasesToUse}
        onShowMessage={handleShowMessage}
      />
    </div>
  );
};
