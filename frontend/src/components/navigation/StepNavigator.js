'use client';

import React from 'react';
import { ChevronRight, Building, Layers, Home, Grid, CheckCircle2 } from 'lucide-react';

export const StepNavigator = ({
  currentStep,
  onSelectStep,
  selectedWing,
  selectedFloor,
  selectedFlatNumber,
  selectedRoomLabel,
}) => {
  const steps = [
    { id: 1, label: `Wing ${selectedWing}`, icon: Building, isComplete: true },
    { id: 2, label: selectedFloor ? `Floor ${selectedFloor}` : 'Select Floor', icon: Layers, isComplete: selectedFloor !== null },
    { id: 3, label: selectedFlatNumber ? `Flat ${selectedFlatNumber}` : 'Select Flat', icon: Home, isComplete: selectedFlatNumber !== null },
    { id: 4, label: selectedRoomLabel ? selectedRoomLabel : 'Floor Plan', icon: Grid, isComplete: selectedRoomLabel !== null },
    { id: 5, label: 'Room Inspection', icon: CheckCircle2, isComplete: false },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex items-center space-x-2">
        {currentStep > 1 && (
          <button
            onClick={() => onSelectStep(currentStep - 1)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-lg border border-slate-700 flex items-center space-x-1 transition flex-shrink-0"
            title="Step Back"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isClickable = step.id <= currentStep || step.isComplete;

            return (
              <React.Fragment key={step.id}>
                <button
                  disabled={!isClickable}
                  onClick={() => onSelectStep(step.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold text-xs transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400'
                      : isClickable
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                      : 'bg-slate-900/40 text-slate-600 cursor-not-allowed border border-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <span>{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
