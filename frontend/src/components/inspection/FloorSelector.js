'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { calculateFloorProgress, getAppState } from '../../lib/dbState';

export const FloorSelector = ({
  wing,
  selectedFloor,
  onSelectFloor,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const state = getAppState();
  const floors = Array.from(new Set((state.flats || []).filter(f => f.wing === wing).map(f => f.floorNumber))).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>Select Floor (Wing {wing})</span>
          </h2>
          <p className="text-xs text-slate-400">Choose a floor to inspect flat progress or perform bulk logging</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {floors.map((floorNum) => {
          const progress = isMounted ? calculateFloorProgress(wing, floorNum) : 0;
          const isSelected = selectedFloor === floorNum;

          return (
            <button
              key={floorNum}
              onClick={() => onSelectFloor(floorNum)}
              className={`p-4 rounded-xl border text-left transition relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-br from-sky-900/80 to-slate-900 border-sky-500 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-400 group-hover:bg-sky-600 group-hover:text-white'
                  } transition`}>
                    F{floorNum}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Floor {floorNum}</h3>
                    {(() => {
                      const floorFlats = (state.flats || []).filter(f => f.wing === wing && f.floorNumber === floorNum);
                      if (floorFlats.length === 0) return <p className="text-xs text-slate-400">Floor {floorNum}</p>;
                      const firstFlat = floorFlats[0].flatNumber;
                      const lastFlat = floorFlats[floorFlats.length - 1].flatNumber;
                      return (
                        <p className="text-xs text-slate-400">
                          {floorFlats.length} Flats ({firstFlat}–{lastFlat})
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {progress === 100 && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-mono font-bold text-sky-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-amber-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-sky-400 font-semibold group-hover:translate-x-1 transition-transform">
                <span>Inspect Floor</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
