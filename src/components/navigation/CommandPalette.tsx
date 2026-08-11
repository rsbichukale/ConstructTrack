'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Home, ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import { getAppState, calculateFlatProgress } from '@/lib/dbState';
import { Flat } from '@/lib/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlat: (flat: Flat) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectFlat,
}) => {
  const [query, setQuery] = useState('');
  const state = getAppState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFlats = state.flats.filter(flat => {
    const searchStr = `${flat.wing}-${flat.flatNumber} ${flat.flatNumber} Floor ${flat.floorNumber}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  }).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-sky-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type flat number (e.g. 301, B1-301, 402)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredFlats.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No flats match "{query}". Try typing <span className="font-mono text-sky-400">301</span> or <span className="font-mono text-sky-400">B2-504</span>.
            </div>
          ) : (
            filteredFlats.map((flat) => {
              const progress = calculateFlatProgress(flat.id);
              return (
                <button
                  key={flat.id}
                  onClick={() => {
                    onSelectFlat(flat);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 text-left group transition border border-transparent hover:border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-800 group-hover:bg-sky-600 flex items-center justify-center text-sky-400 group-hover:text-white font-bold text-xs transition">
                      {flat.wing}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>Flat {flat.flatNumber}</span>
                        <span className="text-xs font-normal text-slate-400">({flat.flatType})</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Wing {flat.wing} • Floor {flat.floorNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-sky-400">{progress}%</div>
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-sky-500 h-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Navigate with ⬆⬇ keys, press <kbd className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">Enter</kbd> to jump</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
