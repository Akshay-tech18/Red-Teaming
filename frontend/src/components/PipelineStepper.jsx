import React, { useState } from 'react';
import {
  ChevronRight,
  Settings,
  FileCheck2,
  GitFork,
  Crosshair,
  Activity,
  GitCompare
} from 'lucide-react';

export default function PipelineStepper({ currentView, setView }) {
  const [hoveredStepId, setHoveredStepId] = useState(null);

  // "Judge Metrics" (step 07) removed for the demo build: it called
  // /evaluations/metrics, which has no backend equivalent at all (not a bug
  // to fix, there's nothing to point it at). A dead step in a numbered
  // pipeline is worse on camera than one fewer step - see step-4 handoff
  // notes for the alternative considered (leave it in place with an
  // unavailable banner).
  const steps = [
    { id: "config", num: "01", label: "Understand Config", icon: Settings },
    { id: "constraints", num: "02", label: "Derive Constraints", icon: FileCheck2 },
    { id: "threat", num: "03", label: "Threat Decision Tree", icon: GitFork },
    { id: "attacks", num: "04", label: "Targeted Attacks", icon: Crosshair },
    { id: "execution", num: "05", label: "Judge & Traces", icon: Activity },
    { id: "compare", num: "06", label: "Fix & Regression", icon: GitCompare },
  ];

  return (
    <nav 
      aria-label="Pipeline Navigation"
      className="w-full flex items-center justify-between p-1.5 bg-gradient-to-b from-[#0d1322] to-[#080c16] border border-app-border rounded-md shadow-sm mb-6 select-none overflow-x-auto gap-1"
    >
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = currentView === step.id;
        const isHovered = hoveredStepId === step.id;
        const showIcon = isActive || isHovered;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setView(step.id)}
              onMouseEnter={() => setHoveredStepId(step.id)}
              onMouseLeave={() => setHoveredStepId(null)}
              className={`flex-1 min-w-[125px] group relative flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md text-xs transition-all duration-200 border whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600/15 text-white font-semibold border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              {/* Number Badge */}
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'bg-white/[0.05] text-slate-500 border border-white/[0.06] group-hover:text-blue-400 group-hover:border-blue-500/40 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.2)] group-hover:bg-blue-950/40'
                }`}
              >
                {step.num}
              </span>

              {/* Icon Container */}
              <div 
                className={`flex items-center justify-center transition-all duration-200 ease-out overflow-hidden ${
                  showIcon 
                    ? 'w-3.5 opacity-100 translate-x-0 mr-0.5' 
                    : 'w-0 opacity-0 -translate-x-2 mr-0'
                }`}
              >
                <StepIcon 
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
                  }`} 
                />
              </div>

              {/* Step Title */}
              <span className={`tracking-tight font-sans text-xs truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {step.label}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-600/70 shrink-0 mx-0.5 select-none" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
