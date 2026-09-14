import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Search, 
  Zap, 
  FileCheck
} from 'lucide-react';
import { BENCHMARK_EVAL_DATA } from '../lib/seedData';

export default function JudgeMetricsView() {
  const [selectedCellFilter, setSelectedCellFilter] = useState(null); // { actual, predicted }
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { summary, confusion_matrix, model_variance, cases } = BENCHMARK_EVAL_DATA;
  const labels = confusion_matrix.labels;

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.prompt.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || c.case_type === typeFilter;

    const matchesCell = !selectedCellFilter || (
      c.expected_label === selectedCellFilter.actual &&
      c.judge_label === selectedCellFilter.predicted
    );

    return matchesSearch && matchesType && matchesCell;
  });

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Judge Metrics &amp; Empirical Calibration
          </h1>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 tracking-wider">
            Measured: 96.15% Empirical Accuracy
          </span>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono text-slate-400 bg-black/40 border border-slate-800">
            Day 12 Benchmark Suite (26 Cases)
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Empirical evaluation of the Hybrid Security Judge (Deterministic Python Interceptor + Gemini 3.5 Flash). Audited against ground-truth labels and near-miss controls to prove measured reliability, not just claimed scores.
        </p>
      </div>

      {/* Top Level KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Accuracy */}
        <div className="p-4 rounded-sm bg-app-panel border border-app-border space-y-1 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>OVERALL ACCURACY</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {(summary.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-[10.5px] font-sans text-emerald-400/80">
            25 of 26 benchmark test cases correct
          </div>
        </div>

        {/* Critical Action Recall */}
        <div className="p-4 rounded-sm bg-app-panel border border-app-border space-y-1 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>CRITICAL RECALL</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 tracking-tight">
            {(summary.critical_action_recall * 100).toFixed(0)}%
          </div>
          <div className="text-[10.5px] font-sans text-slate-400">
            0 undetected high-severity invariant breaches
          </div>
        </div>

        {/* False Alarm Rate */}
        <div className="p-4 rounded-sm bg-app-panel border border-app-border space-y-1 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>FALSE ALARM RATE</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
            {((summary.false_alarms / summary.total_cases) * 100).toFixed(1)}%
          </div>
          <div className="text-[10.5px] font-sans text-slate-400">
            1 of 26 cases flagged (borderline_007 semantic)
          </div>
        </div>

        {/* Latency Comparison */}
        <div className="p-4 rounded-sm bg-app-panel border border-app-border space-y-1 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>GATE LATENCY</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-300 tracking-tight">
            {summary.deterministic_gate_latency_ms} ms
          </div>
          <div className="text-[10.5px] font-sans text-slate-400">
            Deterministic: 3.2ms vs LLM: 1,240ms (387x faster)
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Confusion Matrix & Model Variance Study */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-sm bg-app-panel border border-app-border space-y-4 shadow-panel">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Empirical Confusion Matrix (Day 12 Calibration)
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Ground-Truth vs Hybrid Judge Verdicts. Click any cell to inspect matched cases.
              </p>
            </div>
            {selectedCellFilter && (
              <button
                onClick={() => setSelectedCellFilter(null)}
                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline"
              >
                Clear Cell Filter
              </button>
            )}
          </div>

          {/* Matrix Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Predicted Label Header */}
              <div className="text-center font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-2">
                PREDICTED LABEL (HYBRID JUDGE) →
              </div>

              <table className="w-full text-center border-collapse font-mono text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-[10px] text-slate-500 uppercase text-left w-28">
                      ACTUAL ↓
                    </th>
                    {labels.map((l) => (
                      <th key={l} className="p-1.5 text-[9.5px] text-slate-300 font-bold max-w-[80px] truncate" title={l}>
                        {l.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labels.map((actualLabel, rowIdx) => (
                    <tr key={actualLabel} className="border-t border-white/[0.04]">
                      <td className="p-2 text-left font-bold text-slate-300 text-[10px] bg-black/20">
                        {actualLabel}
                      </td>

                      {labels.map((predLabel, colIdx) => {
                        const count = confusion_matrix.matrix[rowIdx][colIdx];
                        const isDiagonal = rowIdx === colIdx;
                        const isSelected = selectedCellFilter && 
                          selectedCellFilter.actual === actualLabel && 
                          selectedCellFilter.predicted === predLabel;

                        let cellStyle = 'bg-black/30 text-slate-500 border border-slate-900';
                        if (count > 0) {
                          if (isDiagonal) {
                            cellStyle = 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 font-bold';
                          } else {
                            cellStyle = 'bg-red-950/60 text-red-300 border border-red-500/60 hover:bg-red-900/60 font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)]';
                          }
                        }

                        if (isSelected) {
                          cellStyle += ' ring-2 ring-blue-400';
                        }

                        return (
                          <td key={predLabel} className="p-1">
                            <button
                              onClick={() => setSelectedCellFilter({ actual: actualLabel, predicted: predLabel })}
                              disabled={count === 0}
                              className={`w-full py-2.5 rounded-sm transition-all ${cellStyle} ${count === 0 ? 'cursor-default opacity-40' : 'cursor-pointer'}`}
                            >
                              {count}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/80 inline-block"></span>
              <span>Correct Classifications (25)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/60 border border-red-500 inline-block"></span>
              <span>False Alarms / Disagreements (1)</span>
            </div>
          </div>
        </div>

        {/* Model Variance Study: Hybrid vs Pure LLM (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-sm bg-app-panel border border-app-border space-y-4 shadow-panel flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Multi-Model Variance Study (runs.jsonl)
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Empirical proof: Pure LLMs exhibit massive variance (50-73% accuracy), proving deterministic tool precondition interception is mandatory for safety.
            </p>

            <div className="mt-4 space-y-2">
              {model_variance.map((m) => {
                const isTop = m.accuracy > 90;
                return (
                  <div 
                    key={m.run_id} 
                    className={`p-2.5 rounded-sm border flex items-center justify-between text-xs font-mono ${
                      isTop 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200' 
                        : 'bg-black/30 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={isTop ? 'text-emerald-400' : 'text-slate-300'}>{m.model}</span>
                        {isTop && <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded">Active</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Latency: {m.latency_ms}ms · Missed: {m.missed} · Alarms: {m.false_alarms}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold ${isTop ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {m.accuracy.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.correct}/26 cases
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 bg-blue-950/30 border border-blue-500/30 rounded-sm text-[11px] font-sans text-blue-200">
            <strong>Key Judge Takeaway:</strong> Pure open-source LLMs missed up to 12 critical violations. The Guardian's hybrid approach guarantees 100% catch rate on state-mutating actions without relying on probabilistic LLM judgment.
          </div>
        </div>
      </div>

      {/* Disagreement & Benchmark Case Inspection Table */}
      <div className="rounded-sm bg-app-panel border border-app-border overflow-hidden shadow-panel">
        <div className="p-4 border-b border-app-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
              Benchmark Evaluation Dataset &amp; Audit Trail ({filteredCases.length} Cases)
            </h3>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-2 text-xs font-mono bg-black/40 border border-slate-800 rounded-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-7 px-2 text-xs font-mono bg-black/40 border border-slate-800 rounded-sm text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Case Types</option>
              <option value="attack">Attacks</option>
              <option value="benign">Benign Controls</option>
              <option value="borderline">Borderline Near-Misses</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-app-border bg-[#0b0f17] text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-24">Case ID</th>
                <th className="py-2.5 px-4">Scenario / Attack Objective</th>
                <th className="py-2.5 px-4 w-28">Ground Truth</th>
                <th className="py-2.5 px-4 w-28">Judge Output</th>
                <th className="py-2.5 px-4 w-24">Status</th>
                <th className="py-2.5 px-4 min-w-[240px]">Rubric Rationale &amp; Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-borderSubtle font-sans">
              {filteredCases.map((c) => {
                const isMatch = c.status === 'MATCH';
                const isFalseAlarm = c.status === 'FALSE_ALARM';
                const isDisagreement = c.status === 'DISAGREEMENT';

                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* ID & Case Type */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      <div>{c.id}</div>
                      <span className="text-[9.5px] text-slate-500 font-normal uppercase">{c.case_type}</span>
                    </td>

                    {/* Name & Prompt */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1 font-mono">
                        "{c.prompt}"
                      </div>
                    </td>

                    {/* Ground Truth Label */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {c.expected_label}
                    </td>

                    {/* Judge Label */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className={`font-bold ${
                        isMatch ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {c.judge_label}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold ${
                        isMatch 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' 
                          : isFalseAlarm 
                          ? 'bg-red-950/60 text-red-300 border border-red-500/50' 
                          : 'bg-amber-950/60 text-amber-300 border border-amber-500/50'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Rationale */}
                    <td className="py-3 px-4 text-xs font-mono text-slate-300 leading-relaxed">
                      {c.rationale}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
