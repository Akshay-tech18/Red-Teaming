import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  AlertOctagon, 
  CheckCircle, 
  Clock, 
  Terminal,
  Activity,
  Layers,
  Flame,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function LiveExecutionView({ 
  attack, 
  currentVersion, 
  setVersion,
  activeRun, 
  isRunning, 
  runProgress, 
  onRerun,
  onNavigateTo
}) {
  const isProtected = currentVersion === 'ver-1.1' || String(currentVersion).includes('protected');
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [verdictFlashKey, setVerdictFlashKey] = useState(0);

  const rawEvents = activeRun?.events || [];

  // Stream in events with quick 80ms stagger for true live terminal feeling
  useEffect(() => {
    if (isRunning) {
      setDisplayedEvents([]);
      return;
    }

    if (rawEvents.length === 0) {
      setDisplayedEvents([]);
      return;
    }

    setVerdictFlashKey((prev) => prev + 1);
    setDisplayedEvents([]);

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx <= rawEvents.length) {
        setDisplayedEvents(rawEvents.slice(0, currentIdx));
      } else {
        clearInterval(interval);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [activeRun, isRunning]);

  const verdict = activeRun?.finding?.label || activeRun?.deterministic_result?.label || (isProtected ? 'ATTEMPT_BLOCKED' : 'CRITICAL_ACTION');
  const confidenceScore = activeRun?.finding?.confidence || 98;

  const getVerdictStyle = (label) => {
    switch (label) {
      case 'CRITICAL_ACTION':
        return {
          bg: 'bg-red-950/40',
          border: 'border-red-500/50',
          ring: 'ring-1 ring-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.22)]',
          text: 'text-red-400',
          badgeBg: 'bg-red-500/20 text-red-300 border border-red-500/40',
          indicatorColor: '#ef4444',
          icon: AlertOctagon,
          title: 'CRITICAL ACTION TRIGGERED',
          summary: 'Agent successfully tricked into executing unauthorized privileged action without required authorization.'
        };
      case 'ATTEMPT_BLOCKED':
        return {
          bg: 'bg-teal-950/30',
          border: 'border-teal-500/50',
          ring: 'ring-1 ring-teal-500/40 shadow-[0_0_14px_rgba(20,184,166,0.18)]',
          text: 'text-teal-400',
          badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
          indicatorColor: '#14b8a6',
          icon: ShieldCheck,
          title: 'ATTEMPT SAFELY BLOCKED',
          summary: 'Deterministic security precondition intercepted illegal call. State mutation prevented.'
        };
      case 'POLICY_VIOLATION':
        return {
          bg: 'bg-orange-950/30',
          border: 'border-orange-500/40',
          ring: 'ring-1 ring-orange-500/30 shadow-[0_0_14px_rgba(234,88,12,0.15)]',
          text: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
          indicatorColor: '#ea580c',
          icon: AlertTriangle,
          title: 'POLICY VIOLATION DETECTED',
          summary: 'Agent violated organizational guardrails but stopped before mutating critical state.'
        };
      case 'PARTIAL_LEAK':
        return {
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/40',
          ring: 'ring-1 ring-amber-500/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          indicatorColor: '#f59e0b',
          icon: AlertTriangle,
          title: 'PARTIAL DATA LEAK DETECTED',
          summary: 'Internal parameters or session token disclosed in response.'
        };
      default:
        return {
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/40',
          ring: 'ring-1 ring-emerald-500/30 shadow-[0_0_14px_rgba(34,197,94,0.15)]',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          indicatorColor: '#22c55e',
          icon: CheckCircle,
          title: 'SAFE & PROTECTED',
          summary: 'All execution preconditions satisfied. No security constraints violated.'
        };
    }
  };

  const style = getVerdictStyle(verdict);
  const VerdictIcon = style.icon;

  // Confidence radial calculation (r = 18, circumference = 2 * PI * 18 = 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidenceScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header with high-contrast type scale */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Live Run &amp; Trace Verification
            </h1>
            <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
              {attack?.id || 'A-001'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sandboxed LLM execution debugger. Inspect conversational turns, tool call arguments, state mutations, and deterministic security assertions.
          </p>
        </div>

        {/* Re-run Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setVersion('ver-1.0');
              onRerun(attack?.id || 'A-001');
            }}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold border transition-all ${
              !isProtected
                ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-sm ring-1 ring-red-500/30'
                : 'bg-app-panel border-app-border text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            Run on v1.0 (Vulnerable)
          </button>
          <button
            onClick={() => {
              setVersion('ver-1.1');
              onRerun(attack?.id || 'A-001');
            }}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold border transition-all ${
              isProtected
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-app-panel border-app-border text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            Run on v1.1 (Protected)
          </button>
        </div>
      </div>

      {/* Running Execution Spinner State */}
      {isRunning && (
        <div className="p-8 rounded-sm bg-app-panel border border-blue-500/30 flex flex-col items-center justify-center text-center space-y-3 shadow-panel">
          <Activity className="w-8 h-8 text-blue-400 animate-spin" />
          <div>
            <div className="text-sm font-bold text-white font-mono tracking-wider">
              {runProgress?.status || 'EXECUTING ATTACK TURN'}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              {runProgress?.stage || 'Emulating prompt injection in isolated agent sandbox...'}
            </div>
          </div>
        </div>
      )}

      {/* Completed Verdict Card with Flash Animation on reveal */}
      {!isRunning && activeRun && (
        <div 
          key={verdictFlashKey}
          className={`p-5 rounded-sm border ${style.bg} ${style.border} ${style.ring} space-y-4 animate-verdict-flash`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Large Distinct Glyph */}
              <div className={`p-3 rounded-sm ${style.badgeBg} flex items-center justify-center shrink-0`}>
                <VerdictIcon className="w-7 h-7" />
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                  Deterministic Safety Verdict
                </div>
                <div className={`text-xl font-bold font-mono tracking-tight ${style.text}`}>
                  {verdict}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {style.summary}
                </div>
              </div>
            </div>

            {/* Confidence Radial Gauge + Metadata Badge */}
            <div className="flex items-center gap-4">
              {/* Radial Gauge */}
              <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-sm border border-slate-800">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 transform -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="transparent"
                      className="text-slate-800"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r={radius}
                      stroke={style.indicatorColor}
                      strokeWidth="3.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-mono font-bold text-white">
                    {confidenceScore}%
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Confidence</div>
                  <div className="text-xs font-mono font-bold text-white">Deterministic</div>
                </div>
              </div>

              {/* Violations / Constraint Badges */}
              <div className="text-right font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Triggered Rule</div>
                <button
                  onClick={() => onNavigateTo && onNavigateTo('constraints', 'C-001')}
                  className="mt-0.5 text-xs font-bold text-amber-300 hover:text-amber-200 underline decoration-amber-500/40"
                >
                  {activeRun.deterministic_result?.violations?.[0] || 'C-001'} (Precondition Guard)
                </button>
              </div>
            </div>
          </div>

          {/* Evaluator Rationale Code-Like Block */}
          <div className="p-3.5 rounded-sm bg-black/50 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
            <span className="text-slate-400 font-bold tracking-wider">// EVALUATOR RATIONALE: </span>
            {activeRun.finding?.rationale || 'Evaluation analysis complete.'}
          </div>
        </div>
      )}

      {/* Syslog / Terminal-Style Chronological Trace Stream */}
      <div className="rounded-sm bg-[#080d14] border border-app-border overflow-hidden shadow-panel">
        {/* Terminal Titlebar */}
        <div className="px-4 py-2.5 bg-[#0e1420] border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-slate-500 font-mono text-xs ml-2">|</span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              syslog://agent-execution-trace
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-2">
              [{displayedEvents.length}/{rawEvents.length} events logged]
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10.5px]">
            <span className="text-slate-400">TARGET:</span>
            <span className={`px-2 py-0.5 rounded-sm font-bold ${
              isProtected ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/40 text-red-400 border border-red-500/30'
            }`}>
              {isProtected ? 'ShopAssist v1.1 [PROTECTED]' : 'ShopAssist v1.0 [VULNERABLE]'}
            </span>
          </div>
        </div>

        {/* Trace Terminal Log Stream */}
        <div className="p-4 space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto">
          {displayedEvents.map((evt, idx) => {
            const isSecurity = evt.type === 'SECURITY_EVENT' || evt.type === 'POLICY_INTERCEPT';
            const isTool = evt.type === 'TOOL_CALL' || evt.type === 'TOOL_RESULT';

            return (
              <div
                key={evt.id || idx}
                className={`p-3 rounded-sm border transition-all animate-stream-in ${
                  evt.type === 'SECURITY_EVENT'
                    ? 'bg-red-950/30 border-red-500/50 text-red-200'
                    : evt.type === 'POLICY_INTERCEPT'
                    ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                    : isTool
                    ? 'bg-[#0f1726] border-slate-800 text-slate-200'
                    : 'bg-[#0b101a] border-white/[0.04] text-slate-300'
                }`}
              >
                {/* Event header line with timestamps and type badges */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04] text-[11px]">
                  <div className="flex items-center gap-2.5">
                    {/* Monospace Timestamp Column */}
                    <span className="text-slate-400 select-none">
                      {evt.timestamp || `18:24:0${idx}.104`}
                    </span>

                    <span className="text-slate-400 font-bold select-none">
                      #{String(evt.sequence || idx + 1).padStart(2, '0')}
                    </span>

                    {/* Color Coded Event Tag */}
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[9.5px] font-bold tracking-wider uppercase ${
                        evt.type === 'USER_MESSAGE'
                          ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/40'
                          : evt.type === 'AGENT_MESSAGE'
                          ? 'bg-purple-950/50 text-purple-300 border border-purple-500/40'
                          : evt.type === 'TOOL_CALL'
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40'
                          : evt.type === 'POLICY_INTERCEPT'
                          ? 'bg-teal-950/50 text-teal-300 border border-teal-500/40'
                          : evt.type === 'SECURITY_EVENT'
                          ? 'bg-red-950/60 text-red-300 border border-red-500/50'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {evt.type}
                    </span>

                    {evt.tool && (
                      <span className="text-sky-400 font-bold">
                        executing::{evt.tool}()
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400">
                    STATUS: OK
                  </span>
                </div>

                {/* Event Body Content */}
                {evt.content && (
                  <div className="mt-2 text-slate-200 leading-relaxed font-sans text-xs">
                    {evt.content}
                  </div>
                )}

                {/* Tool Arguments Block */}
                {evt.arguments && (
                  <div className="mt-2 p-2.5 rounded-sm bg-black/50 border border-slate-800/90 text-[11px] text-amber-200/90">
                    <span className="text-slate-400 select-none">INPUT_PAYLOAD: </span>
                    <code>{JSON.stringify(evt.arguments)}</code>
                  </div>
                )}

                {/* Tool Result Block */}
                {evt.result && (
                  <div className="mt-2 p-2.5 rounded-sm bg-black/50 border border-slate-800/90 text-[11px] text-emerald-300/90">
                    <span className="text-slate-400 select-none">RETURN_DATA: </span>
                    <code>{JSON.stringify(evt.result)}</code>
                  </div>
                )}

                {/* Security Assertion Alert Box */}
                {evt.type === 'SECURITY_EVENT' && (
                  <div className="mt-2 p-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>[SYS_ALERT] Dangerous action invocation without verified security state precondition.</span>
                  </div>
                )}

                {evt.type === 'POLICY_INTERCEPT' && (
                  <div className="mt-2 p-2 rounded-sm bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>[GUARD_INTERCEPT] Intercepted unverified invocation. Returned state error to model.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
