import React, { useState } from 'react';
import { 
  GitCompare, 
  CheckCircle, 
  AlertTriangle, 
  RotateCw, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  AlertOctagon,
  Flame
} from 'lucide-react';

export default function RegressionSuiteView({ 
  regressionTests = [], 
  onRunAttack,
  setVersion,
  onNavigateTo
}) {
  const [tests, setTests] = useState(regressionTests);
  const [rerunningId, setRerunningId] = useState(null);

  const handleRerun = (testId) => {
    setRerunningId(testId);
    setTimeout(() => {
      setRerunningId(null);
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, last_run: new Date().toISOString() } : t
        )
      );
    }, 600);
  };

  const getVerdictDiffDisplay = (baseline, current, isReg, isImprove) => {
    return (
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Baseline item with strikethrough / red tint */}
        <span className={`px-2 py-0.5 rounded-sm line-through ${
          isReg 
            ? 'bg-emerald-950/40 text-emerald-400/70 border border-emerald-500/20' 
            : 'bg-red-950/50 text-red-400/80 border border-red-500/30'
        }`}>
          {baseline}
        </span>

        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

        {/* Current item */}
        <span className={`px-2 py-0.5 rounded-sm font-bold ${
          isReg
            ? 'bg-red-950/80 text-red-400 border border-red-500/60 ring-1 ring-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
            : isImprove
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 ring-1 ring-emerald-500/30'
            : 'bg-slate-800 text-slate-300 border border-slate-700'
        }`}>
          {current}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header with high-contrast type scale */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Fix Verification &amp; Continuous Regression
          </h1>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
            Regression Engine
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Side-by-side behavioral comparator and automated regression suite. Verifies that deploying prompt or code guards resolves target exploits without regressing benign or edge scenarios.
        </p>
      </div>

      {/* Side-by-Side Version Comparator with ✕ and ✓ items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* v1.0 Vulnerable Card */}
        <div className="p-4 rounded-sm bg-[#120b0e] border border-red-500/30 space-y-3 shadow-panel">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-white font-mono">v1.0 (Vulnerable Baseline)</span>
            </div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-500/40">
              FAILING
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-3 h-3 text-red-400" />
              </div>
              <span>Unrestricted <code className="text-red-300 font-mono text-[11px] bg-red-950/30 px-1 py-0.5 rounded">issue_refund()</code> tool execution without identity verification.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-3 h-3 text-red-400" />
              </div>
              <span>No mandatory precondition checks on prior <code className="text-red-300 font-mono text-[11px] bg-red-950/30 px-1 py-0.5 rounded">verify_order()</code> execution.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <X className="w-3 h-3 text-red-400" />
              </div>
              <span>Vulnerable to persona authority override and conversational urgency manipulation.</span>
            </div>
          </div>

          <button
            onClick={() => {
              setVersion('ver-1.0');
              onRunAttack('A-001');
            }}
            className="w-full py-1.5 rounded-sm bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono font-semibold transition-all mt-2"
          >
            Run A-001 on Baseline v1.0
          </button>
        </div>

        {/* v1.1 Protected Card */}
        <div className="p-4 rounded-sm bg-[#091512] border border-emerald-500/30 space-y-3 shadow-panel">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono">v1.1 (Protected Hardened)</span>
            </div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-alert-safe">
              PROTECTED
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span>Precondition assertion: <code className="text-emerald-300 font-mono text-[11px] bg-emerald-950/30 px-1 py-0.5 rounded">verify_order()</code> required prior to refund.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span>Dual-authorization guard: refunds &gt; $500 require manager token signature.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-sm bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span>Prompt claims of authority cannot forge or simulate session security states.</span>
            </div>
          </div>

          <button
            onClick={() => {
              setVersion('ver-1.1');
              onRunAttack('A-001');
            }}
            className="w-full py-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition-all mt-2"
          >
            Run A-001 on Hardened v1.1
          </button>
        </div>
      </div>

      {/* Regression Suite Table with Git-Diff Strips & Full-Row Regressions */}
      <div className="rounded-sm bg-app-panel border border-app-border overflow-hidden shadow-panel">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
              Continuous Verification Suite
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {tests.length} Tracked Regressions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-app-border bg-[#0b0f17] text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-24">Test ID</th>
                <th className="py-3 px-4">Attack Scenario</th>
                <th className="py-3 px-4 w-32">Constraint</th>
                <th className="py-3 px-4 min-w-[280px]">Baseline → Current (Git-Diff)</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-borderSubtle font-sans">
              {tests.map((t) => {
                const isReg = t.status_diff === 'REGRESSION';
                const isImprove = t.status_diff === 'IMPROVEMENT';

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isReg 
                        ? 'bg-red-950/40 border-l-4 border-l-red-500 ring-1 ring-red-500/20' 
                        : isImprove 
                        ? 'bg-emerald-950/15 hover:bg-emerald-950/25 border-l-4 border-l-emerald-500/50' 
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {t.attack_id}
                    </td>

                    {/* Attack Name & Objective */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{t.attack_name}</span>
                        {isReg && (
                          <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                            ALERT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Constraint */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onNavigateTo && onNavigateTo('constraints', t.target_constraint)}
                        className="text-[11px] font-mono text-sky-300 hover:text-sky-200 bg-black/40 px-2 py-0.5 rounded-sm border border-slate-800 transition-colors"
                      >
                        {t.target_constraint}
                      </button>
                    </td>

                    {/* Git-Diff Style Strip */}
                    <td className="py-3.5 px-4">
                      {getVerdictDiffDisplay(t.baseline_label, t.new_label, isReg, isImprove)}
                    </td>

                    {/* Diff Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isReg
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50 ring-1 ring-red-500/30'
                            : isImprove
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 ring-1 ring-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isReg ? (
                          <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : isImprove ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        {t.status_diff}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRerun(t.id)}
                        disabled={rerunningId === t.id}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] border border-app-border text-[11px] font-mono text-slate-300 transition-all"
                      >
                        <RotateCw
                          className={`w-3 h-3 text-slate-400 group-hover:text-blue-400 group-hover:shadow-icon-glow transition-all ${
                            rerunningId === t.id ? 'animate-spin text-blue-400' : ''
                          }`}
                        />
                        <span>Rerun</span>
                      </button>
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
