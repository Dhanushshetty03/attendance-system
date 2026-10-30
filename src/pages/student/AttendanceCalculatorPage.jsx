import React, { useState, useEffect } from 'react';
import { Calculator, Target, Info, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

export function AttendanceCalculatorPage() {
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation parameters for what-if scenario
  const [simExtraAttended, setSimExtraAttended] = useState(0);
  const [simExtraMissed, setSimExtraMissed] = useState(0);

  useEffect(() => {
    async function fetchProjections() {
      try {
        setLoading(true);
        const res = await api.getAttendanceCalculator(targetPercentage);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjections();
  }, [targetPercentage]);

  if (loading && !data) {
    return <LoadingSkeleton lines={6} />;
  }

  const overall = data?.overall;
  const subjects = data?.subjectWise || [];
  const formulaInfo = data?.formulaExplanation;

  // Compute what-if simulation
  const currentAttended = formulaInfo?.variables?.a ? parseInt(formulaInfo.variables.a.match(/\d+/)[0]) : 0;
  const currentConducted = formulaInfo?.variables?.t ? parseInt(formulaInfo.variables.t.match(/\d+/)[0]) : 0;

  const simTotalConducted = currentConducted + simExtraAttended + simExtraMissed;
  const simTotalAttended = currentAttended + simExtraAttended;
  const simPercentage = simTotalConducted > 0 ? Math.round((simTotalAttended / simTotalConducted) * 10000) / 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Attendance Target & Projection Calculator
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate future attendance and calculate exact consecutive classes needed using the official Logisys formula.
          </p>
        </div>

        {/* Target Percentage Preset Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-300">Target:</span>
          {[75, 80, 85, 90].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                setTargetPercentage(pct);
                setSimExtraAttended(0);
                setSimExtraMissed(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                targetPercentage === pct
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Target Result Banner */}
      {overall && (
        <div
          className={`p-6 rounded-2xl border shadow-xs ${
            overall.status === 'BELOW_TARGET'
              ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
              : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Target: {targetPercentage}% Attendance
                </h3>
                <StatusBadge status={overall.status} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {overall.message}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Note: Projections assume every future class considered is attended consecutively. Institutional examination eligibility regulations take precedence.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
              <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {overall.currentPercentage}%
                </p>
              </div>

              {overall.status === 'BELOW_TARGET' ? (
                <div className="text-center px-3">
                  <p className="text-[10px] uppercase font-bold text-amber-600">Must Attend</p>
                  <p className="text-2xl font-black text-amber-600">
                    +{overall.classesNeeded}
                  </p>
                  <p className="text-[10px] text-slate-400">classes</p>
                </div>
              ) : (
                <div className="text-center px-3">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Safe to Miss</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {overall.classesCanMiss}
                  </p>
                  <p className="text-[10px] text-slate-400">classes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive What-If Simulator & Formula Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Simulator Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive "What-If" Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Test how attending or missing future classes impacts your percentage
              </p>
            </div>
            <button
              onClick={() => {
                setSimExtraAttended(0);
                setSimExtraMissed(0);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Simulation
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Additional Classes You Attend: <span className="text-emerald-600 text-sm font-extrabold">+{simExtraAttended}</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={simExtraAttended}
                onChange={(e) => setSimExtraAttended(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span>15</span>
                <span>30 classes</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Additional Classes You Miss: <span className="text-rose-600 text-sm font-extrabold">+{simExtraMissed}</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={simExtraMissed}
                onChange={(e) => setSimExtraMissed(parseInt(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span>10</span>
                <span>20 classes</span>
              </div>
            </div>
          </div>

          {/* Simulated Outcome Box */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Simulated Result
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Total Conducted: {simTotalConducted} | Total Attended: {simTotalAttended}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {simPercentage}%
                </span>
                <p className="text-[10px] text-slate-500">
                  {simPercentage >= targetPercentage ? (
                    <span className="text-emerald-600 font-bold">✓ Meets target ({targetPercentage}%)</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✗ Below target ({targetPercentage}%)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula & Policy Explanation Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Mathematical Formulation
            </h3>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl font-mono text-xs overflow-x-auto">
            <p className="text-blue-400 font-bold mb-1">// Consecutive classes needed:</p>
            <p className="text-emerald-400">x = max(0, ceil((r * t - a) / (1 - r)))</p>
            <p className="text-blue-400 font-bold mt-2 mb-1">// Bunk buffer allowance:</p>
            <p className="text-amber-400">m = floor((a - r * t) / r)</p>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <p><strong className="text-slate-900 dark:text-white">r:</strong> Target rate expressed as decimal ({targetPercentage}% = {(targetPercentage/100).toFixed(2)})</p>
            <p><strong className="text-slate-900 dark:text-white">a:</strong> Number of classes currently attended</p>
            <p><strong className="text-slate-900 dark:text-white">t:</strong> Total classes conducted to date</p>
            <p><strong className="text-slate-900 dark:text-white">x:</strong> Minimum consecutive classes to attend</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Policy Note:</p>
            <p>Under University Regulation, students with less than 75% aggregate attendance in any theory course will not be granted hall tickets for the semester-end examination.</p>
          </div>
        </div>
      </div>

      {/* Subject-by-Subject Calculation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Subject-Wise Target Analysis ({targetPercentage}% Threshold)
          </h3>
          <p className="text-xs text-slate-500">
            Calculated classes needed or safe misses for each course
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Attended / Conducted</th>
                <th className="py-3 px-4 text-center">Current %</th>
                <th className="py-3 px-4 text-center">Classes Needed</th>
                <th className="py-3 px-4 text-center">Bunk Buffer</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Calculated Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map((sub) => (
                <tr key={sub.subjectId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{sub.code}</div>
                    <div className="text-slate-500 text-[11px] truncate max-w-xs">{sub.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">
                    {sub.attended} / {sub.conducted}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-bold text-sm ${
                        sub.currentPercentage >= targetPercentage
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {sub.currentPercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {sub.classesNeeded > 0 ? (
                      <span className="font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
                        +{sub.classesNeeded} classes
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {sub.classesCanMiss > 0 ? (
                      <span className="font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                        {sub.classesCanMiss} safe misses
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                    {sub.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
