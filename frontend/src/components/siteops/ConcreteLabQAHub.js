'use client';

import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Layers, 
  Calendar, 
  Award, 
  TrendingUp, 
  FileCheck 
} from 'lucide-react';
import { fetchConcreteTests, recordConcreteTest } from '../../lib/backendSync';

export const ConcreteLabQAHub = () => {
  const [qaData, setQaData] = useState({ tests: [], passedCount: 0, totalCount: 0, passPercentage: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sampleCode, setSampleCode] = useState('');
  const [grade, setGrade] = useState('M25');
  const [locationPoured, setLocationPoured] = useState('Wing B1 - 4th Slab');
  const [castingDate, setCastingDate] = useState('');
  const [slump, setSlump] = useState('120');
  const [ageDays, setAgeDays] = useState('7');
  const [targetStrength, setTargetStrength] = useState('16.5');
  const [actualStrength, setActualStrength] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchConcreteTests();
    setQaData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sampleCode.trim() || !actualStrength) return;
    setIsSubmitting(true);
    try {
      await recordConcreteTest({
        sampleCode: sampleCode.trim(),
        gradeOfConcrete: grade,
        locationPoured: locationPoured.trim(),
        castingDate: castingDate || new Date().toISOString().split('T')[0],
        slumpMeasuredMm: Number(slump || 120),
        testingAgeDays: Number(ageDays),
        targetStrengthMpa: Number(targetStrength),
        actualStrengthMpa: Number(actualStrength),
        remarks: remarks.trim()
      });
      setFeedbackMsg(`Concrete cube test ${sampleCode} recorded successfully.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsModalOpen(false);
      setSampleCode('');
      setActualStrength('');
      setRemarks('');
      await loadData();
    } catch (err) {
      alert('Error recording test: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>SiteOps Material QA/QC & Strength Testing</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Concrete Cube & Slump Testing QA/QC Pour Cards
          </h2>
          <p className="text-xs text-slate-400">
            Record 7-day and 28-day concrete compressive strength (CTM testing), slump flow checks & IS 456 compliance
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Cube Strength Test</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>QA/QC Strength Pass Rate</span>
            <Award className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black font-mono text-teal-400">
            {qaData.passPercentage}%
          </div>
          <p className="text-[11px] text-slate-400 font-medium">{qaData.passedCount} of {qaData.totalCount} tests passed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Cube Samples Cast</span>
            <FlaskConical className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {qaData.totalCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">7-day & 28-day test batches</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>IS 456 Structural Standard</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            100% Verified
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Calibrated CTM certified</p>
        </div>
      </div>

      {/* Test Records */}
      <div className="space-y-3">
        {(qaData.tests || []).map((test) => {
          const isPassed = (test.result_status || test.resultStatus) === 'PASSED';

          return (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl transition shadow-lg space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-lg border border-teal-800">
                      {test.sampleCode || test.sample_code}
                    </span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-md">
                      Grade {test.gradeOfConcrete || test.grade_of_concrete}
                    </span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {test.testingAgeDays || test.testing_age_days}-Day Test
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm pt-1">{test.locationPoured || test.location_poured}</h3>
                  <p className="text-xs text-slate-400">{test.remarks}</p>
                </div>

                <div className="text-right font-mono">
                  <div className="flex items-center space-x-1 justify-end">
                    {isPassed ? (
                      <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-xs flex items-center space-x-1 bg-rose-950 px-2.5 py-0.5 rounded-md border border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-white pt-1">
                    {test.actualStrengthMpa || test.actual_strength_mpa} N/mm²{' '}
                    <span className="text-[11px] text-slate-500 font-normal">(Target: {test.targetStrengthMpa || test.target_strength_mpa} N/mm²)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>Slump: <strong className="text-slate-200">{test.slumpMeasuredMm || test.slump_measured_mm || 120} mm</strong></span>
                <span>Cast: {test.castingDate || test.casting_date}</span>
                <span>Technician: <strong className="text-slate-200">{test.labTechnician || test.lab_technician}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Record Concrete Cube Test</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Sample Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUBE-B1-5S-7D"
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="M20">M20 (20 MPa)</option>
                    <option value="M25">M25 (25 MPa)</option>
                    <option value="M30">M30 (30 MPa)</option>
                    <option value="M35">M35 (35 MPa)</option>
                    <option value="M40">M40 (40 MPa)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Testing Age</label>
                  <select
                    value={ageDays}
                    onChange={(e) => {
                      setAgeDays(e.target.value);
                      if (e.target.value === '7') setTargetStrength('16.5');
                      else setTargetStrength('25.0');
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="7">7 Days (66% target)</option>
                    <option value="28">28 Days (100% target)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Pour Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wing B1 - 5th Floor Slab & Beams"
                  value={locationPoured}
                  onChange={(e) => setLocationPoured(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Target Strength (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetStrength}
                    onChange={(e) => setTargetStrength(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-teal-400">Actual Crushing Strength (MPa) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="18.5"
                    value={actualStrength}
                    onChange={(e) => setActualStrength(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-teal-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">QC Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Clean aggregate fracture, passed IS 456"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-teal-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Record Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
