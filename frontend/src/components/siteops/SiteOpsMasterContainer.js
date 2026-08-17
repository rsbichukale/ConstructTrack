'use client';

import React, { useState } from 'react';
import { 
  Package, 
  Wallet, 
  Truck, 
  ShieldAlert, 
  DoorOpen, 
  FlaskConical, 
  Layers, 
  Activity 
} from 'lucide-react';
import { MaterialsHub } from './MaterialsHub';
import { PettyCashHub } from './PettyCashHub';
import { MachineryDieselHub } from './MachineryDieselHub';
import { SafetyToolboxHub } from './SafetyToolboxHub';
import { VisitorGateHub } from './VisitorGateHub';
import { ConcreteLabQAHub } from './ConcreteLabQAHub';

export const SiteOpsMasterContainer = ({ defaultSubTab = 'materials' }) => {
  const [activeTab, setActiveTab] = useState(defaultSubTab);

  const TABS = [
    { id: 'materials', label: 'Materials & Stock', icon: Package, color: 'text-amber-400', activeClass: 'bg-amber-500 text-slate-950 shadow-amber-500/20' },
    { id: 'cash', label: 'Petty Cash Book', icon: Wallet, color: 'text-emerald-400', activeClass: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' },
    { id: 'machinery', label: 'Machinery & Fuel', icon: Truck, color: 'text-sky-400', activeClass: 'bg-sky-500 text-slate-950 shadow-sky-500/20' },
    { id: 'safety', label: 'Safety & HSE', icon: ShieldAlert, color: 'text-rose-400', activeClass: 'bg-rose-500 text-slate-950 shadow-rose-500/20' },
    { id: 'visitors', label: 'Visitor Gate Pass', icon: DoorOpen, color: 'text-indigo-400', activeClass: 'bg-indigo-500 text-white shadow-indigo-500/20' },
    { id: 'quality', label: 'Concrete Lab QA', icon: FlaskConical, color: 'text-teal-400', activeClass: 'bg-teal-500 text-slate-950 shadow-teal-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Top SiteOps Module Switcher Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-3xl shadow-xl flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center space-x-1.5 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 ${
                  isActive
                    ? `${tab.activeClass} shadow-lg scale-100`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-inherit' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Module Render */}
      <div className="transition-all duration-200">
        {activeTab === 'materials' && <MaterialsHub />}
        {activeTab === 'cash' && <PettyCashHub />}
        {activeTab === 'machinery' && <MachineryDieselHub />}
        {activeTab === 'safety' && <SafetyToolboxHub />}
        {activeTab === 'visitors' && <VisitorGateHub />}
        {activeTab === 'quality' && <ConcreteLabQAHub />}
      </div>
    </div>
  );
};
