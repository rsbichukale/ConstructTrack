'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  HelpCircle,
  Activity
} from 'lucide-react';
import { FlatTask, DailyProgressLog, TaskCatalogItem, Flat } from '@/lib/types';

interface SCurveChartProps {
  flatTasks: FlatTask[];
  logs: DailyProgressLog[];
  flats: Flat[];
  taskCatalog: TaskCatalogItem[];
}

export const SCurveChart: React.FC<SCurveChartProps> = ({
  flatTasks,
  logs,
  flats,
  taskCatalog,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Overall Site Completion %
  const totalTasksCount = flatTasks.length;
  const approvedTasksCount = flatTasks.filter(t => t.status === 'APPROVED').length;
  const overallActualPct = totalTasksCount > 0 
    ? Math.round((flatTasks.reduce((sum, t) => sum + (t.completionPct || 0), 0) / (totalTasksCount * 100)) * 100)
    : 0;

  // Milestone S-Curve Timeline Data Points (10 Weeks Timeline simulation/calculation)
  const timelineData = [
    { weekLabel: 'W1', plannedPct: 8, actualPct: 10, dateStr: '01 Jun' },
    { weekLabel: 'W2', plannedPct: 18, actualPct: 20, dateStr: '08 Jun' },
    { weekLabel: 'W3', plannedPct: 30, actualPct: 32, dateStr: '15 Jun' },
    { weekLabel: 'W4', plannedPct: 45, actualPct: 42, dateStr: '22 Jun' },
    { weekLabel: 'W5', plannedPct: 60, actualPct: 55, dateStr: '29 Jun' },
    { weekLabel: 'W6', plannedPct: 72, actualPct: 66, dateStr: '06 Jul' },
    { weekLabel: 'W7 (Current)', plannedPct: 82, actualPct: overallActualPct, dateStr: '13 Jul' },
    { weekLabel: 'W8', plannedPct: 90, actualPct: null, dateStr: '20 Jul' },
    { weekLabel: 'W9', plannedPct: 96, actualPct: null, dateStr: '27 Jul' },
    { weekLabel: 'W10', plannedPct: 100, actualPct: null, dateStr: '03 Aug' },
  ];

  const currentPoint = timelineData[6]; // W7
  const plannedPctNow = currentPoint.plannedPct;
  const actualPctNow = overallActualPct;
  const scheduleVariance = actualPctNow - plannedPctNow; // e.g. -16% or +2%

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 260;
  const paddingX = 45;
  const paddingY = 30;

  const getX = (index: number) => paddingX + (index / (timelineData.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (pct: number) => chartHeight - paddingY - (pct / 100) * (chartHeight - paddingY * 2);

  // Generate SVG path for Planned Line
  const plannedPathD = timelineData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.plannedPct);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Generate SVG path for Actual Line (up to current week)
  const actualPoints = timelineData.filter(pt => pt.actualPct !== null);
  const actualPathD = actualPoints.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.actualPct!);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header Stat Callouts */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white tracking-wide">Project Progress S-Curve</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Planned Cumulative Progress vs Earned Cumulative Progress (Wings B1 & B2 Combined)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-right">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Planned Progress</div>
            <div className="text-lg font-extrabold text-cyan-400">{plannedPctNow}%</div>
          </div>

          <div className="px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-right">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Earned Actual</div>
            <div className="text-lg font-extrabold text-emerald-400">{actualPctNow}%</div>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-right ${
            scheduleVariance >= 0 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <div className="text-[10px] opacity-80 font-medium uppercase flex items-center justify-end gap-1">
              <span>Schedule Variance</span>
              {scheduleVariance >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </div>
            <div className="text-lg font-extrabold">
              {scheduleVariance >= 0 ? `+${scheduleVariance}% (Ahead)` : `${scheduleVariance}% (Behind)`}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Responsive SVG S-Curve Chart */}
      <div className="relative overflow-x-auto">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-auto min-w-[600px] overflow-visible"
        >
          {/* Grid Background Lines */}
          {[0, 25, 50, 75, 100].map(pct => {
            const y = getY(pct);
            return (
              <g key={pct}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={chartWidth - paddingX} 
                  y2={y} 
                  stroke="#334155" 
                  strokeDasharray="4 4" 
                  strokeWidth="1" 
                  opacity="0.5"
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  textAnchor="end"
                  className="font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Planned Line (Cyan Dashed) */}
          <path 
            d={plannedPathD} 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="3" 
            strokeDasharray="6 4" 
            opacity="0.85"
          />

          {/* Actual Line (Emerald Solid) */}
          <path 
            d={actualPathD} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="4" 
            strokeLinecap="round"
          />

          {/* Planned Line Nodes */}
          {timelineData.map((pt, i) => {
            const x = getX(i);
            const y = getY(pt.plannedPct);
            return (
              <circle 
                key={`planned-${i}`} 
                cx={x} 
                cy={y} 
                r="4" 
                fill="#0284c7" 
                stroke="#38bdf8" 
                strokeWidth="2" 
              />
            );
          })}

          {/* Actual Line Nodes & Interactive Markers */}
          {actualPoints.map((pt, i) => {
            const x = getX(i);
            const y = getY(pt.actualPct!);
            const isHovered = selectedWeek === i;
            return (
              <g key={`actual-${i}`} onClick={() => setSelectedWeek(i)} className="cursor-pointer">
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isHovered ? '8' : '6'} 
                  fill="#059669" 
                  stroke="#34d399" 
                  strokeWidth="3" 
                  className="transition-all duration-200 hover:scale-125"
                />
                <text 
                  x={x} 
                  y={y - 12} 
                  fill="#10b981" 
                  fontSize="10" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {pt.actualPct}%
                </text>
              </g>
            );
          })}

          {/* Timeline X-Axis Labels */}
          {timelineData.map((pt, i) => {
            const x = getX(i);
            return (
              <g key={`label-${i}`}>
                <text 
                  x={x} 
                  y={chartHeight - 8} 
                  fill={i === 6 ? '#38bdf8' : '#94a3b8'} 
                  fontSize="11" 
                  fontWeight={i === 6 ? 'bold' : 'normal'} 
                  textAnchor="middle"
                >
                  {pt.weekLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Milestone Summary Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400"></div>
            <span className="text-slate-300 font-medium">Planned Baseline Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-300 font-medium">Earned Actual Output</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Project Target Completion: <strong className="text-slate-200">03 Aug 2026</strong></span>
        </div>
      </div>
    </div>
  );
};
